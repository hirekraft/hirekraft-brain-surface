// fill/answer.js: THE CONVERSATION ABOUT ONE EMAIL (seat answer, then seat email-workspace, 2026-10-07).
//
// WHAT IT IS. Everything she asks about an email, and the draft when she wants one, in one place that
// sits WITH the email in the reading column (mail.js decides where). Answer and Forward start it with a
// briefing of what the company knows; a question typed in the one Ask bar while the email is open lands
// here too. Send is its own press and is the only thing that sends.
//
// IT STAYS WITH ITS EMAIL (Alex, 2026-10-07: an answer about an accounting@ email was still on screen
// over the next mailbox; "either it resets, or we find another way"). Each email has its own
// conversation and its own Work chat, titled by the email's subject (work_keep with p_about). Moving
// to another email takes it off the screen; it is kept, not lost; coming back shows it again; Discard
// deletes it from Work too (work_discard). Keeping is the default and discarding is one click, so
// nobody is asked "save or delete?" on every move.
// SUPERSEDED THE SAME DAY: each turn used to be kept in whichever Work chat happened to be open
// (keepTurn without a chat of its own), and the conversation had its own question box under it. One
// question box now, the Ask bar; the box here was a second way to ask the same thing.
//
// WHERE EACH PART LIVES. The briefing, the answers and the draft are lens-ask (CONVERSE), anchored on
// this email; lens-ask checks the mailbox through the door before reading anything. Sending is
// mail-send (ACT): it takes her from her session, asks the same door whether she may send from this
// mailbox, recomputes the hash of what it is about to send and refuses if it differs from what this
// box showed (draftHash below is byte for byte the server's canonical()), and logs every attempt.
// Keeping is lens.js keepTurn; drawing an answer is lens.js renderAsk. Nothing here decides who may
// do what. No colour, size or spacing here; those are in skin.css under ANSWER and WORKSPACE.

const ASK = '/functions/v1/lens-ask';
const SEND = '/functions/v1/mail-send';
const NL = String.fromCharCode(10);
const BRIEF_Q = 'What does the company know that bears on this email?';

async function post(C, path, body) {
  const { data } = await C.sb.auth.getSession();
  const jwt = data && data.session && data.session.access_token;
  if (!jwt) return { status: 401, j: { ok: false, error: 'You are not signed in on this browser, so there is nobody to act as.' } };
  const r = await fetch(C.url + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, j: await r.json().catch(() => null) };
}

// Addresses from a header or a typed field: "Name <a@b.c>, d@e.f" -> ["a@b.c", "d@e.f"].
function addrs(s) {
  return String(s || '').split(',').map((p) => {
    const a = p.indexOf('<'), b = p.indexOf('>');
    return (a >= 0 && b > a ? p.slice(a + 1, b) : p).trim().toLowerCase();
  }).filter((x) => x.includes('@'));
}

// THE SAME CANONICAL FORM AS mail-send's canonical(). If these two ever differ, every send is
// refused as "differs from what was shown": loud, never a silent wrong send.
export async function draftHash(d) {
  const s = JSON.stringify([d.source_key, d.thread_id || '', d.to, d.cc, d.subject, d.text]);
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function threadText(t) {
  return (t.messages || []).map((m) => 'From ' + (m.from_name || m.from_email || 'someone')
    + (m.from_email ? ' <' + m.from_email + '>' : '') + (m.date ? ', ' + m.date : '') + NL + (m.body || ''))
    .join(NL + NL + '---' + NL + NL).slice(-6000);
}

function prefixed(p, subject) {
  const s = String(subject || '').trim();
  return s.toLowerCase().startsWith(p.toLowerCase()) ? s : p + ' ' + s;
}

// o: { sourceKey, mailbox, thread (null for a question asked on Mail with no email open),
//      keep: { chat, about, title } handed to keepTurn, onTurn(), onDiscard() }.
// Returns { el, ask(q), start(mode), restore(turns), count() }. The element survives being taken
// off the screen and put back, so a conversation is never redrawn from scratch while it lives.
export function conversation(C, o) {
  const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = text; return n; };
  const t = o.thread;
  const msgs = (t && t.messages) || [];
  const last = msgs[msgs.length - 1] || {};
  const mailbox = String(o.mailbox || '').toLowerCase();
  const other = [...msgs].reverse().find((m) => String(m.from_email || '').toLowerCase() !== mailbox) || last;
  const anchor = t ? {
    source_key: o.sourceKey, thread_id: t.thread_id, from_email: other.from_email || '', from_name: other.from_name || '',
    subject: t.subject || '', date: last.date || '', text: threadText(t),
  } : null;
  const turns = [];
  let busy = false;
  let mode = null;

  const box = mk('section', 'answerx');
  box.setAttribute('aria-label', t ? 'The conversation about this email' : 'Questions asked on Mail');
  const top = mk('div', 'answerx-top');
  const eyebrow = mk('p', 'eyebrow', t ? 'About this email' : 'Asked here, about no one email');
  const kept = mk('span', 'quiet answerx-kept');
  const discard = mk('button', 'go ghost answerx-discard', 'Discard');
  discard.type = 'button';
  discard.hidden = true;
  top.append(eyebrow, kept, discard);
  const convo = mk('div', 'answerx-convo');
  convo.setAttribute('aria-live', 'polite');
  const tools = mk('div', 'answerx-btns');
  tools.hidden = true;
  const quick = mk('button', 'go ghost', 'Draft the reply');
  quick.type = 'button';
  tools.appendChild(quick);
  const said = mk('p', 'quiet answerx-said');
  said.setAttribute('aria-live', 'polite');
  box.append(top, convo, tools);

  // THE DRAFT. Hidden until she asks for one. Everything in it is hers to type over.
  const draft = mk('div', 'answerx-draft');
  draft.hidden = true;
  const field = (label, el) => { const l = mk('label', 'answerx-field'); l.appendChild(mk('span', null, label)); l.appendChild(el); draft.appendChild(l); return el; };
  const toI = field('To', mk('input'));
  const ccI = field('Cc', mk('input'));
  const subjI = field('Subject', mk('input'));
  const bodyLabel = mk('span', null, 'Reply');
  const bodyI = mk('textarea', 'answerx-body');
  bodyI.rows = 10;
  const bl = mk('label', 'answerx-field'); bl.append(bodyLabel, bodyI); draft.appendChild(bl);
  const fwdNote = mk('p', 'quiet', 'Sent below your note, exactly as shown:');
  const fwdPre = mk('pre', 'answerx-fwd');
  const send = mk('button', 'go', 'Send');
  send.type = 'button';
  const sent = mk('p', 'quiet answerx-said');
  sent.setAttribute('aria-live', 'polite');
  draft.append(fwdNote, fwdPre, send, sent);
  if (t) box.appendChild(draft);
  box.appendChild(said);

  const fwdBlock = () => ['---------- Forwarded message ----------',
    'From: ' + (last.from_name ? last.from_name + ' <' + (last.from_email || '') + '>' : (last.from_email || '')),
    'Date: ' + (last.date || ''), 'Subject: ' + ((t && t.subject) || ''), 'To: ' + (last.to || ''), '', last.body || ''].join(NL);

  function setMode(m) {
    mode = m;
    const fwd = m === 'forward';
    tools.hidden = false;
    quick.textContent = fwd ? 'Write the note' : 'Draft the reply';
    bodyLabel.textContent = fwd ? 'Your note' : 'Reply';
    toI.value = fwd ? '' : (other.from_email || '');
    subjI.value = prefixed(fwd ? 'Fwd:' : 'Re:', t.subject);
    fwdNote.hidden = !fwd; fwdPre.hidden = !fwd;
    fwdPre.textContent = fwd ? fwdBlock() : '';
  }

  function markKept() {
    const k = o.keep;
    discard.hidden = !(turns.length || (k && k.chat));
    kept.textContent = k && k.chat ? 'Kept in Work' + (k.about ? ' as ' + (k.title || 'this email') : '') + '.' : '';
  }

  function row(q, showQ) {
    const r = mk('div', 'answer-turn');
    if (showQ) r.appendChild(mk('p', 'answer-asked', q));
    const slot = mk('div', 'answer-slot');
    r.appendChild(slot);
    convo.appendChild(r);
    return slot;
  }

  async function turn(q, brief) {
    if (busy) { said.textContent = 'Still answering the last question; ask again in a moment.'; return; }
    busy = true; quick.disabled = true; said.textContent = '';
    const slot = row(q, !brief);
    slot.appendChild(mk('p', 'answer-wait', brief ? 'Putting together what the company knows about this email.' : 'Reading your records.'));
    if (o.onTurn) o.onTurn();
    slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    try {
      const cur = draft.hidden ? null : { subject: subjI.value, text: bodyI.value };
      const req = anchor
        ? Object.assign({ question: q, tz: C.zone(), anchor, turns: turns.slice(-6) }, cur ? { draft: cur } : {})
        : Object.assign({ question: q, tz: C.zone() }, turns.length ? { follows: turns[turns.length - 1].q } : {});
      const { status, j } = await post(C, ASK, req);
      slot.innerHTML = '';
      if (!j || j.ok !== true) {
        slot.appendChild(mk('p', 'state stalled', (j && j.error) || ('The brain did not answer (' + status + '). Nothing was changed.')));
        return;
      }
      if (t && j.state === 'draft' && j.draft) {
        if (!mode) setMode('reply');
        subjI.value = j.draft.subject || subjI.value;
        bodyI.value = j.draft.text || '';
        draft.hidden = false;
        sent.textContent = 'Nothing is sent until you press Send.';
        C.renderAsk(slot, Object.assign({}, j, { state_reason: j.answer }));
      } else {
        C.renderAsk(slot, j);
      }
      turns.push({ q, a: String(j.answer || j.state_reason || '').slice(0, 1500) });
      await C.keepTurn(slot, q, j, o.keep);
      markKept();
    } catch (e) {
      slot.innerHTML = '';
      slot.appendChild(mk('p', 'state stalled', 'The brain could not be reached: ' + ((e && e.message) || e)));
    } finally {
      busy = false; quick.disabled = false;
    }
  }

  quick.addEventListener('click', () => turn(mode === 'forward' ? 'Write a short note to go above the forwarded email.' : 'Draft the reply.', false));

  discard.addEventListener('click', async () => {
    const k = o.keep;
    if (k && k.chat) {
      discard.disabled = true;
      try {
        const { data, error } = await C.sb.rpc('work_discard', { p_chat: k.chat });
        if (error || !data || !data.ok) throw new Error((error && error.message) || (data && (data.note || data.reason)) || 'no reason was given');
      } catch (e) {
        said.textContent = 'Not discarded: ' + ((e && e.message) || e) + '. It is still kept in Work.';
        discard.disabled = false;
        return;
      }
    }
    if (o.onDiscard) o.onDiscard();
  });

  send.addEventListener('click', async () => {
    const fwd = mode === 'forward';
    const to = addrs(toI.value), cc = addrs(ccI.value);
    if (!to.length) { sent.textContent = 'Put at least one address in To.'; return; }
    const text = fwd ? bodyI.value.trimEnd() + NL + NL + fwdBlock() : bodyI.value;
    const d = { source_key: o.sourceKey, thread_id: fwd ? '' : t.thread_id, to, cc, subject: subjI.value, text };
    send.disabled = true;
    sent.textContent = 'Sending from ' + mailbox + '.';
    try {
      const hash = await draftHash(d);
      const { status, j } = await post(C, SEND, Object.assign({ action: 'send', hash }, d));
      if (j && j.ok === true && j.sent) {
        const same = !fwd && j.thread_id && j.thread_id === t.thread_id;
        const n = to.concat(cc).length;
        sent.textContent = 'Sent from ' + mailbox + ' to ' + n + ' address' + (n === 1 ? '' : 'es') + (same ? ', in the same Gmail conversation.' : '.');
        for (const el of [toI, ccI, subjI, bodyI]) el.readOnly = true;
        return;
      }
      sent.textContent = 'Not sent: ' + ((j && (j.reason || j.error)) || ('the send came back with ' + status)) + '.';
    } catch (e) {
      sent.textContent = 'Not sent: the send could not be reached (' + ((e && e.message) || e) + ').';
    }
    send.disabled = false;
  });

  markKept();
  return {
    el: box,
    count: () => convo.children.length,
    ask: (q) => turn(q, false),
    // Answer or Forward: the briefing first, if nothing has been asked yet, then the draft button.
    start(m) {
      if (!t) return;
      setMode(m);
      if (!convo.children.length) turn(BRIEF_Q, true);
      else box.scrollIntoView({ block: 'start', behavior: 'smooth' });
    },
    // A conversation kept earlier, drawn from what was kept and not asked again (lens.js openChat
    // does the same for the Work tab).
    restore(kept) {
      for (const k of kept || []) {
        const slot = row(k.question, k.question !== BRIEF_Q);
        if (k.withheld || (k.answer && k.answer.state === 'withheld')) slot.appendChild(mk('p', 'quiet', (k.answer && k.answer.note) || 'No longer shown.'));
        else { try { C.renderAsk(slot, k.answer); } catch (e) { slot.appendChild(mk('p', 'quiet', 'This kept answer could not be drawn: ' + ((e && e.message) || e))); } }
        slot.appendChild(mk('p', 'quiet work-when', 'As shown on ' + new Date(k.asked_at).toLocaleString() + '. Not asked again.'));
        turns.push({ q: k.question, a: String((k.answer && (k.answer.answer || k.answer.state_reason)) || '').slice(0, 1500) });
      }
      markKept();
    },
  };
}

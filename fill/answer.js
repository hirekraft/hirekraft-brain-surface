// fill/answer.js: REPLYING TO AN EMAIL, AND THE CONVERSATION ABOUT IT (seat answer, then seat email-workspace, 2026-10-07;
// rebuilt by seat mail-round-two, 2026-10-29).
//
// TWO PARTS, EACH ONCE.
// composer(): the reply, reply all or forward, written in place under the email (Alex's walk of Mail, 2026-10-29 10:48 PT: "Reply,
//   Reply all, Forward at the top with an inline composer (To filled, Send, Discard)"). "Draft a reply for me" fills it from the
//   emails and the books (askDraft, lens-ask anchored on this email). Send is its own press and is the only thing that sends.
// conversation(): what she asks about an email, from the one box or from Tell me more about this, answered under that email
//   and kept in Work as a chat named after it. When an answer is a draft, it goes into the composer (onDraft), never into a
//   second draft box here.
// SUPERSEDES, 2026-10-29 (seat mail-round-two, Alex's walk of Mail): Answer and Forward opened the conversation with an unasked
//   briefing ("What does the company know that bears on this email?") and a draft box inside it. The briefing now comes only when
//   she presses Tell me more about this; the draft box inside the conversation is removed, the composer is the one place to write.
//
// IT STAYS WITH ITS EMAIL (Alex, 2026-10-07). Each email has its own conversation and its own Work chat (work_keep with p_about).
// Moving to another email takes it off the screen; coming back shows it again; Discard deletes it from Work too (work_discard).
//
// WHERE EACH PART LIVES. Drafts and answers are lens-ask (CONVERSE, COMPOSE), anchored on this email; lens-ask checks the mailbox
// through the door before reading anything. Sending is mail-send (ACT): it takes her from her session, asks the same door whether
// she may send from this mailbox, recomputes the hash of what it is about to send and refuses if it differs from what this box
// showed (draftHash below is byte for byte the server's canonical()), and logs every attempt. While mail-send's TEST LOCK holds,
// a send to anyone but the mailbox itself is refused there and said here plainly as held. Nothing here decides who may do what.
// No colour, size or spacing here; those are in skin.css under ANSWER, WORKSPACE and MAIL ROUND TWO.

import { fmtDate } from './dates.js?v=2026-10-22-dates';
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
export function addrs(s) {
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

// Who the email is from and what it is, as lens-ask reads it. One shape for the composer and the conversation.
function shapeOf(o) {
  const t = o.thread;
  const msgs = (t && t.messages) || [];
  const last = msgs[msgs.length - 1] || {};
  const mailbox = String(o.mailbox || '').toLowerCase();
  const other = [...msgs].reverse().find((m) => String(m.from_email || '').toLowerCase() !== mailbox) || last;
  const anchor = t ? {
    source_key: o.sourceKey, thread_id: t.thread_id, from_email: other.from_email || '', from_name: other.from_name || '',
    subject: t.subject || '', date: last.date || '', text: threadText(t),
  } : null;
  return { t, msgs, last, mailbox, other, anchor };
}

// "Draft a reply for me": lens-ask writes the reply (or the note above a forward) from the emails and the books.
export async function askDraft(C, o, mode, cur) {
  const s = shapeOf(o);
  if (!s.anchor) return { ok: false, reason: 'No email is open.' };
  const q = mode === 'forward' ? 'Write a short note to go above the forwarded email.' : 'Draft the reply.';
  try {
    const { status, j } = await post(C, ASK, Object.assign({ question: q, tz: C.zone(), anchor: s.anchor, turns: [] }, cur ? { draft: cur } : {}));
    if (j && j.ok === true && j.state === 'draft' && j.draft) return { ok: true, draft: j.draft };
    return { ok: false, reason: (j && (j.error || j.answer || j.state_reason)) || ('The brain did not answer (' + status + ').') };
  } catch (e) {
    return { ok: false, reason: 'The brain could not be reached: ' + ((e && e.message) || e) };
  }
}

// THE COMPOSER. o: { sourceKey, mailbox, thread, mode: 'reply' | 'replyall' | 'forward', onDiscard(), onSent() }.
// Returns { el, mode, fill(draft), setMode(m), status(text, cls), body() }.
export function composer(C, o) {
  const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = text; return n; };
  const s = shapeOf(o);
  const box = mk('section', 'mailx-compose');
  box.setAttribute('aria-label', 'Your reply');
  const head = mk('p', 'mailx-compose-kind');
  const drafted = mk('p', 'mailx-compose-drafted', 'Drafted from the emails and your books. Change anything before you send.');
  drafted.hidden = true;
  const field = (label, el) => { const l = mk('label', 'mailx-compose-field'); l.appendChild(mk('span', null, label)); l.appendChild(el); return l; };
  const toI = mk('input'); toI.type = 'text'; toI.autocomplete = 'off';
  const ccI = mk('input'); ccI.type = 'text'; ccI.autocomplete = 'off';
  const subjI = mk('input'); subjI.type = 'text';
  const ccRow = field('Cc', ccI);
  const bodyI = mk('textarea', 'mailx-compose-body');
  bodyI.rows = 8;
  bodyI.setAttribute('aria-label', 'Your reply');
  const fwdNote = mk('p', 'quiet', 'Sent below your note, exactly as shown:');
  const fwdPre = mk('pre', 'answerx-fwd');
  const row = mk('div', 'mailx-compose-acts');
  const send = mk('button', 'go', 'Send'); send.type = 'button';
  const discard = mk('button', 'go ghost', 'Discard'); discard.type = 'button';
  const said = mk('p', 'mailx-compose-said'); said.setAttribute('aria-live', 'polite');
  row.append(send, discard, said);
  box.append(head, drafted, field('To', toI), ccRow, field('Subject', subjI), bodyI, fwdNote, fwdPre, row);

  const fwdBlock = () => ['---------- Forwarded message ----------',
    'From: ' + (s.last.from_name ? s.last.from_name + ' <' + (s.last.from_email || '') + '>' : (s.last.from_email || '')),
    'Date: ' + (s.last.date || ''), 'Subject: ' + ((s.t && s.t.subject) || ''), 'To: ' + (s.last.to || ''), '', s.last.body || ''].join(NL);
  // Reply all: everyone the latest email went to, on To and Cc, except this mailbox and the person replied to.
  const others = () => {
    const skip = new Set([s.mailbox, String(s.other.from_email || '').toLowerCase()]);
    return [...new Set(addrs(s.last.to).concat(addrs(s.last.cc)))].filter((a) => !skip.has(a));
  };
  const api = { el: box, mode: null };
  api.setMode = (m) => {
    const fwd = m === 'forward';
    api.mode = m;
    head.textContent = m === 'forward' ? 'Forward' : m === 'replyall' ? 'Reply all' : 'Reply';
    toI.value = fwd ? '' : (s.other.from_email || '');
    ccI.value = m === 'replyall' ? others().join(', ') : '';
    ccRow.hidden = m !== 'replyall' && !ccI.value;
    subjI.value = prefixed(fwd ? 'Fwd:' : 'Re:', s.t && s.t.subject);
    bodyI.placeholder = fwd ? 'Add a note above the forwarded email' : 'Write your reply';
    fwdNote.hidden = !fwd; fwdPre.hidden = !fwd;
    fwdPre.textContent = fwd ? fwdBlock() : '';
    drafted.hidden = true;
    said.textContent = ''; said.className = 'mailx-compose-said';
  };
  api.fill = (d) => {
    if (d.subject) subjI.value = d.subject;
    bodyI.value = d.text || '';
    drafted.hidden = false;
    api.status('Nothing is sent until you press Send.', '');
  };
  api.status = (text, cls) => { said.textContent = text; said.className = 'mailx-compose-said' + (cls ? ' ' + cls : ''); };
  api.body = () => ({ subject: subjI.value, text: bodyI.value });
  api.focus = () => { (toI.value ? bodyI : toI).focus(); };
  discard.addEventListener('click', () => { if (o.onDiscard) o.onDiscard(); });
  send.addEventListener('click', async () => {
    const fwd = api.mode === 'forward';
    const to = addrs(toI.value), cc = addrs(ccI.value);
    if (!to.length) { api.status('Put at least one address in To.', 'state stalled'); return; }
    if (!bodyI.value.trim() && !fwd) { api.status('Write your reply first, or press Draft a reply for me.', 'state stalled'); return; }
    const text = fwd ? bodyI.value.trimEnd() + NL + NL + fwdBlock() : bodyI.value;
    const d = { source_key: o.sourceKey, thread_id: fwd ? '' : s.t.thread_id, to, cc, subject: subjI.value, text };
    send.disabled = true;
    api.status('Sending from ' + s.mailbox + '.', 'working');
    try {
      const hash = await draftHash(d);
      const { status, j } = await post(C, SEND, Object.assign({ action: 'send', hash }, d));
      if (j && j.ok === true && j.sent) {
        const n = to.concat(cc).length;
        api.status('Sent from ' + s.mailbox + ' to ' + n + ' address' + (n === 1 ? '' : 'es') + '. It is in your Sent folder in Gmail too.', 'mailx-compose-ok');
        for (const el of [toI, ccI, subjI, bodyI]) el.readOnly = true;
        discard.hidden = true;
        if (o.onSent) o.onSent();
        return;
      }
      const why = String((j && (j.reason || j.error)) || '');
      // THE TEST LOCK (mail-send): while sending is being proven, it sends only to the mailbox itself. Said plainly, as held.
      if (why.startsWith('test lock')) api.status('Held, not sent. While the Tool’s own sending is being tested, it only sends to ' + s.mailbox + ' itself. Your words stay here.', 'mailx-compose-held');
      else api.status('Not sent: ' + (why || ('the send came back with ' + status)) + '.', 'state stalled');
    } catch (e) {
      api.status('Not sent: the send could not be reached (' + ((e && e.message) || e) + ').', 'state stalled');
    }
    send.disabled = false;
  });
  api.setMode(o.mode || 'reply');
  return api;
}

// o: { sourceKey, mailbox, thread (null for a question asked on Mail with no email open),
//      keep: { chat, about, title } handed to keepTurn, onTurn(), onDiscard(), onDraft(draft) }.
// Returns { el, ask(q), brief(), restore(turns), count() }. The element survives being taken
// off the screen and put back, so a conversation is never redrawn from scratch while it lives.
export function conversation(C, o) {
  const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = text; return n; };
  const s = shapeOf(o);
  const t = s.t;
  const turns = [];
  let busy = false;

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
  const said = mk('p', 'quiet answerx-said');
  said.setAttribute('aria-live', 'polite');
  box.append(top, convo, said);

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
    busy = true; said.textContent = '';
    const slot = row(q, !brief);
    slot.appendChild(mk('p', 'answer-wait working', brief ? 'Putting together what the company knows about this email.' : 'Reading your records.'));
    if (o.onTurn) o.onTurn();
    slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    try {
      const req = s.anchor
        ? { question: q, tz: C.zone(), anchor: s.anchor, turns: turns.slice(-6) }
        : Object.assign({ question: q, tz: C.zone() }, turns.length ? { follows: turns[turns.length - 1].q } : {});
      const { status, j } = await post(C, ASK, req);
      slot.innerHTML = '';
      if (!j || j.ok !== true) {
        slot.appendChild(mk('p', 'state stalled', (j && j.error) || ('The brain did not answer (' + status + '). Nothing was changed.')));
        return;
      }
      // A draft goes into the composer under the email, the one place to write (seat mail-round-two).
      if (t && j.state === 'draft' && j.draft && o.onDraft) {
        o.onDraft(j.draft);
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
      busy = false;
    }
  }

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

  markKept();
  return {
    el: box,
    count: () => convo.children.length,
    ask: (q) => turn(q, false),
    // Tell me more about this: what the company knows that bears on this email, asked once, on her press.
    brief() { if (t && !convo.children.length) turn(BRIEF_Q, true); },
    // A conversation kept earlier, drawn from what was kept and not asked again (lens.js openChat
    // does the same for the Work tab).
    restore(kept) {
      for (const k of kept || []) {
        const slot = row(k.question, k.question !== BRIEF_Q);
        if (k.withheld || (k.answer && k.answer.state === 'withheld')) slot.appendChild(mk('p', 'quiet', (k.answer && k.answer.note) || 'No longer shown.'));
        else { try { C.renderAsk(slot, k.answer); } catch (e) { slot.appendChild(mk('p', 'quiet', 'This kept answer could not be drawn: ' + ((e && e.message) || e))); } }
        slot.appendChild(mk('p', 'quiet work-when', 'As shown on ' + fmtDate(k.asked_at, 'when') + '. Not asked again.'));
        turns.push({ q: k.question, a: String((k.answer && (k.answer.answer || k.answer.state_reason)) || '').slice(0, 1500) });
      }
      markKept();
    },
  };
}

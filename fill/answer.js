// fill/answer.js: ANSWER AN EMAIL WITH EVERYTHING THE COMPANY KNOWS (seat answer, 2026-10-07).
// Alex's ruling that day ("the Tool sends mail"): Answer opens a CONVERSATION about this email,
// led by a briefing of what the company knows about it, from every mailbox and file she may see,
// each point saying where it came from. She asks and instructs here, typed or dictated. A draft
// appears when she asks for one, in an editable box under the conversation; she types over it or
// asks for it shorter. Send is its own press and is the only thing that sends.
//
// WHERE EACH PART LIVES. The briefing, the answers and the draft are lens-ask (CONVERSE), anchored
// on this email; lens-ask checks the mailbox through the door before reading anything. Sending is
// mail-send (ACT): it takes her from her session, asks the same door whether she may send from
// this mailbox, recomputes the hash of what it is about to send and refuses if it differs from
// what this box showed (draftHash below is byte for byte the server's canonical()), and logs every
// attempt. Nothing in this file decides who may do what.
// Each turn is kept in Work through lens.js's keepTurn, like every other question.
// No colour, size or spacing here; those are in skin.css under ANSWER.

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

// host: an element in the open email's column that survives redraws (mail.js keeps it on the
// open email). o: { sourceKey, mailbox, thread, mode: 'reply' | 'forward' }.
export function drawAnswer(host, C, o) {
  if (host.dataset.mode === o.mode && host.dataset.thread === o.thread.thread_id && host.firstChild) {
    host.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }
  const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = text; return n; };
  const t = o.thread;
  const msgs = t.messages || [];
  const last = msgs[msgs.length - 1] || {};
  const mailbox = String(o.mailbox || '').toLowerCase();
  const other = [...msgs].reverse().find((m) => String(m.from_email || '').toLowerCase() !== mailbox) || last;
  const fwd = o.mode === 'forward';
  const anchor = {
    source_key: o.sourceKey, thread_id: t.thread_id, from_email: other.from_email || '', from_name: other.from_name || '',
    subject: t.subject || '', date: last.date || '', text: threadText(t),
  };
  const fwdBlock = fwd ? ['---------- Forwarded message ----------',
    'From: ' + (last.from_name ? last.from_name + ' <' + (last.from_email || '') + '>' : (last.from_email || '')),
    'Date: ' + (last.date || ''), 'Subject: ' + (t.subject || ''), 'To: ' + (last.to || ''), '', last.body || ''].join(NL) : '';
  const turns = [];
  let busy = false;

  host.innerHTML = '';
  host.dataset.mode = o.mode;
  host.dataset.thread = t.thread_id;
  const box = mk('section', 'answerx');
  box.setAttribute('aria-label', fwd ? 'Forward this email' : 'Answer this email');
  box.appendChild(mk('p', 'eyebrow', fwd ? 'Forwarding, from ' + mailbox : 'Answering, from ' + mailbox));
  const convo = mk('div', 'answerx-convo');
  convo.setAttribute('aria-live', 'polite');

  const form = mk('div', 'answerx-ask');
  const input = mk('textarea', 'answerx-input');
  input.rows = 2;
  input.placeholder = fwd ? 'Ask about it, or say what to write above the forwarded email' : 'Ask about this email, or say what to reply';
  const ask = mk('button', 'go', 'Ask');
  ask.type = 'button';
  const quick = mk('button', 'go ghost', fwd ? 'Write the note' : 'Draft the reply');
  quick.type = 'button';
  const btns = mk('div', 'answerx-btns');
  btns.append(ask, quick);
  form.append(input, btns);

  // THE DRAFT. Hidden until she asks for one. Everything in it is hers to type over.
  const draft = mk('div', 'answerx-draft');
  draft.hidden = true;
  const field = (label, el) => { const l = mk('label', 'answerx-field'); l.appendChild(mk('span', null, label)); l.appendChild(el); draft.appendChild(l); return el; };
  const toI = field('To', mk('input'));
  toI.value = fwd ? '' : (other.from_email || '');
  const ccI = field('Cc', mk('input'));
  const subjI = field('Subject', mk('input'));
  subjI.value = prefixed(fwd ? 'Fwd:' : 'Re:', t.subject);
  const bodyI = field(fwd ? 'Your note' : 'Reply', mk('textarea', 'answerx-body'));
  bodyI.rows = 10;
  if (fwd) {
    draft.appendChild(mk('p', 'quiet', 'Sent below your note, exactly as shown:'));
    draft.appendChild(mk('pre', 'answerx-fwd', fwdBlock));
  }
  const send = mk('button', 'go', 'Send');
  send.type = 'button';
  const said = mk('p', 'quiet answerx-said');
  said.setAttribute('aria-live', 'polite');
  draft.append(send, said);

  box.append(convo, form, draft);
  host.appendChild(box);
  host.scrollIntoView({ block: 'start', behavior: 'smooth' });

  async function turn(q, brief) {
    if (busy) return;
    busy = true; ask.disabled = true; quick.disabled = true;
    const row = mk('div', 'answer-turn');
    if (!brief) row.appendChild(mk('p', 'answer-asked', q));
    const slot = mk('div', 'answer-slot');
    slot.appendChild(mk('p', 'answer-wait', brief ? 'Putting together what the company knows about this email.' : 'Reading your records.'));
    row.appendChild(slot);
    convo.appendChild(row);
    try {
      const cur = draft.hidden ? null : { subject: subjI.value, text: bodyI.value };
      const { status, j } = await post(C, ASK, Object.assign({ question: q, tz: C.zone(), anchor, turns: turns.slice(-6) }, cur ? { draft: cur } : {}));
      if (!j || j.ok !== true) {
        slot.innerHTML = '';
        slot.appendChild(mk('p', 'state stalled', (j && j.error) || ('The brain did not answer (' + status + '). Nothing was changed.')));
        return;
      }
      if (j.state === 'draft' && j.draft) {
        subjI.value = j.draft.subject || subjI.value;
        bodyI.value = j.draft.text || '';
        draft.hidden = false;
        said.textContent = 'Nothing is sent until you press Send.';
        C.renderAsk(slot, Object.assign({}, j, { state_reason: j.answer }));
      } else {
        C.renderAsk(slot, j);
      }
      turns.push({ q, a: String(j.answer || j.state_reason || '').slice(0, 1500) });
      await C.keepTurn(slot, q, j);
    } catch (e) {
      slot.innerHTML = '';
      slot.appendChild(mk('p', 'state stalled', 'The brain could not be reached: ' + ((e && e.message) || e)));
    } finally {
      busy = false; ask.disabled = false; quick.disabled = false;
    }
  }

  const go = () => { const v = input.value.trim(); if (!v) return; input.value = ''; turn(v, false); };
  ask.addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
  quick.addEventListener('click', () => turn(fwd ? 'Write a short note to go above the forwarded email.' : 'Draft the reply.', false));

  send.addEventListener('click', async () => {
    const to = addrs(toI.value), cc = addrs(ccI.value);
    if (!to.length) { said.textContent = 'Put at least one address in To.'; return; }
    const text = fwd ? bodyI.value.trimEnd() + NL + NL + fwdBlock : bodyI.value;
    const d = { source_key: o.sourceKey, thread_id: fwd ? '' : t.thread_id, to, cc, subject: subjI.value, text };
    send.disabled = true;
    said.textContent = 'Sending from ' + mailbox + '.';
    try {
      const hash = await draftHash(d);
      const { status, j } = await post(C, SEND, Object.assign({ action: 'send', hash }, d));
      if (j && j.ok === true && j.sent) {
        const same = !fwd && j.thread_id && j.thread_id === t.thread_id;
        said.textContent = 'Sent from ' + mailbox + ' to ' + to.concat(cc).length + ' address' + (to.concat(cc).length === 1 ? '' : 'es')
          + (same ? ', in the same Gmail conversation.' : '.');
        for (const el of [toI, ccI, subjI, bodyI]) el.readOnly = true;
        return;
      }
      said.textContent = 'Not sent: ' + ((j && (j.reason || j.error)) || ('the send came back with ' + status)) + '.';
    } catch (e) {
      said.textContent = 'Not sent: the send could not be reached (' + ((e && e.message) || e) + ').';
    }
    send.disabled = false;
  });

  turn(BRIEF_Q, true);
}

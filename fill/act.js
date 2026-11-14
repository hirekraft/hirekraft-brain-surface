// fill/act.js - A ONE-OFF ACTION OF VERA'S: THE EMAIL SHE DRAFTED, SHOWN, AND SENT ONLY ON THE PERSON'S PRESS
// (seat vera-one-door, 2026-11-14; decision 1175 point 2, picture RxLG1Ec8Zs6LCmhiEMk8dj). The screen part of ACT; it adds no
// mechanism. The words are lens-ask's own draft step (COMPOSE, anchored on the email she is looking at); sending is mail-send
// (ACT), which takes the person from their session, asks the door whether they may send from that mailbox, refuses anything
// that differs from what was shown (the hash below is answer.js draftHash, byte for byte the server's), and logs every try.
//
// THE CARD: To, the subject and the words, then Send, Change, Not Now. Nothing leaves until Send is pressed, and Send is
// never pressed by the Tool (1115).
// WHILE THE TOOL'S SENDING IS BEING TESTED (mail-send's TEST LOCK) the card says so BEFORE the press: Send delivers the
// email only back to the mailbox it is sent from (the person's own), as a new email, so they see it arrive; nobody else receives it; that changes on
// Alex's word. SEND_LOCKED below is the screen's copy of that fact and decides nothing: mail-send refuses on its own
// whatever the screen believes. If this says locked and the server is open, the email still goes only to the own address;
// if this says open and the server is locked, the server's refusal is said as held and the own-address send is offered.
// HQ turns this to false in the same recorded change that lifts mail-send's lock, and not before. A SECOND COPY OF ONE
// FACT, named: the clean end is mail-send answering "is the lock on" to a signed-in person, and this line removed.
// Change makes the words editable in place (what is sent is what the card shows when Send is pressed); she can also tell
// Vera what to change, and a new draft comes under it.
// No regex literals and no backslashes (STANDING-CLAUSES).

import { draftHash } from './answer.js?v=2026-10-29-mail-invites';

export const SEND_LOCKED = true;
const SEND = '/functions/v1/mail-send';
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// D: { post(path, body) -> { status, j }, name() -> her name }. about: { source_key, thread_id, to, to_name, label } or null.
// Returns { text(), subject(), closed() } so her conversation knows the draft now on screen.
export function draftCard(slot, body, about, D) {
  const dr = body.draft || {};
  const mailbox = about && String(about.source_key || '').startsWith('gmail:') ? String(about.source_key).slice(6).toLowerCase() : '';
  if (body.answer) slot.appendChild(mk('p', 'ans-lead', String(body.answer)));
  const box = mk('div', 'vera-draft');
  const toLine = mk('p', 'vera-draft-f');
  toLine.append(mk('span', null, 'To: '));
  const who = mk('b', null, about && about.to ? (about.to_name ? about.to_name + ' <' + about.to + '>' : about.to) : 'not known'); who.translate = false;
  toLine.appendChild(who);
  const subj = mk('p', 'vera-draft-f'); subj.append(mk('span', null, 'Subject: '));
  const sv = mk('b', null, String(dr.subject || '')); sv.translate = false; subj.appendChild(sv);
  const words = mk('p', 'vera-draft-text', String(dr.text || '')); words.translate = false;
  const edit = mk('textarea', 'vera-draft-edit'); edit.hidden = true; edit.setAttribute('aria-label', 'The words of the email');
  box.append(toLine, subj, words, edit);
  const out = mk('p', 'vera-draft-out'); out.setAttribute('role', 'status');
  const acts = mk('div', 'vera-acts');
  const send = mk('button', 'go', 'Send'); send.type = 'button';
  const change = mk('button', 'go ghost', 'Change'); change.type = 'button';
  const no = mk('button', 'go ghost', 'Not Now'); no.type = 'button';
  acts.append(send, change, no);
  let done = false;
  const text = () => (edit.hidden ? String(words.textContent || '') : edit.value);
  const api = { text, subject: () => String(dr.subject || ''), closed: () => done };

  if (!mailbox || !about.to) {
    // Kept and opened again, or a draft that came with no email behind it: shown, never sendable from here.
    box.appendChild(mk('p', 'vera-small', 'Shown as it was written. To send it, point at the email again and ask me for the reply.'));
    slot.appendChild(box);
    done = true;
    return api;
  }
  const lockLine = mk('p', 'vera-draft-lock');
  // Every sentence here is written as whole pieces around the person's own names, so each piece is put in her language where it
  // stands (words.js changes only exact pieces inside an answer) and the names stay as written.
  const own = (t) => { const b = mk('b', null, String(t)); b.translate = false; return b; };
  const pieces = (node, cls, list) => { node.className = cls; node.replaceChildren(...list.map((x) => (typeof x === 'string' ? mk('span', null, x) : x))); };
  const them = about.to_name || about.to;
  const sayLock = () => pieces(lockLine, 'vera-draft-lock', ['While the Tool' + String.fromCharCode(8217) + 's sending is being tested, Send delivers this to your own mailbox only:', ' ', own(mailbox), ' ',
    'It arrives as a new email, so you can see it. It does not go to', ' ', own(them), ' ', 'or to anyone else. Sending to other people is turned on when Alex says so.']);
  let locked = SEND_LOCKED;
  if (locked) sayLock();
  box.append(lockLine, acts, out);
  slot.appendChild(box);

  const finish = (list, cls) => { done = true; acts.remove(); pieces(out, 'vera-draft-out ' + (cls || ''), list); };
  change.addEventListener('click', () => {
    if (!edit.hidden) return;
    edit.value = String(words.textContent || ''); edit.rows = Math.min(16, Math.max(4, edit.value.split(String.fromCharCode(10)).length + 2));
    words.hidden = true; edit.hidden = false; change.disabled = true;
    pieces(out, 'vera-draft-out', ['Change the words here, or tell me below what to change. Nothing is sent until you press Send.']);
    edit.focus();
  });
  no.addEventListener('click', () => finish(['Not sent. Nothing left your mailbox. The draft stays here in our conversation.'], ''));
  send.addEventListener('click', async () => {
    const t = text();
    if (!t.trim()) { pieces(out, 'vera-draft-out state stalled', ['There are no words to send.']); return; }
    const d = locked
      ? { source_key: about.source_key, thread_id: '', to: [mailbox], cc: [], subject: String(dr.subject || ''), text: t }
      : { source_key: about.source_key, thread_id: String(about.thread_id || ''), to: [String(about.to).toLowerCase()], cc: [], subject: String(dr.subject || ''), text: t };
    send.disabled = true; change.disabled = true; no.disabled = true;
    pieces(out, 'vera-draft-out working no-late', ['Sending from', ' ', own(mailbox)]);
    let status = 0, j = null, err = '';
    try { const hash = await draftHash(d); const r = await D.post(SEND, Object.assign({ action: 'send', hash }, d)); status = r.status; j = r.j; }
    catch (e) { err = String((e && e.message) || e); }
    if (j && j.ok === true && j.sent) {
      if (!edit.hidden) { words.textContent = t; words.hidden = false; edit.hidden = true; }
      lockLine.remove();
      finish(locked ? [own(String.fromCharCode(10003)), ' ', 'Sent to your own mailbox only:', ' ', own(mailbox + ', ' + clock() + '.'), ' ', 'It did not go to', ' ', own(them + '.')]
        : [own(String.fromCharCode(10003)), ' ', 'Sent from', ' ', own(mailbox), ' ', 'to', ' ', own(them + ', ' + clock() + '.'), ' ', 'It is in your Sent folder in Gmail too.'], 'vera-draft-ok');
      return;
    }
    const why = String((j && (j.reason || j.error)) || err || ('the send came back with ' + status));
    send.disabled = false; no.disabled = false; change.disabled = !edit.hidden;
    if (!locked && why.startsWith('test lock')) {
      // The server holds the lock the screen did not know of: said as held, and the own-address send is what Send now does.
      locked = true; sayLock();
      pieces(out, 'vera-draft-out vera-draft-held', ['Held, not sent. Nothing left your mailbox. Press Send again to deliver it to your own mailbox.']);
      return;
    }
    pieces(out, 'vera-draft-out state stalled', ['Not sent. Nothing left your mailbox.', ' ', mk('span', 'vera-draft-why', why + (why.endsWith('.') ? '' : '.'))]);
  });
  return api;
}

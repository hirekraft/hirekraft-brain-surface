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

// People from a header: "Name <a@b.c>, d@e.f" -> [{ name, email }]. A comma inside a quoted name stays with the name.
export function people(s) {
  const parts = []; let cur = ''; let quoted = false;
  for (const ch of String(s || '')) { if (ch === '"') quoted = !quoted; if (ch === ',' && !quoted) { parts.push(cur); cur = ''; } else cur += ch; }
  parts.push(cur);
  return parts.map((p) => {
    const a = p.indexOf('<'), b = p.indexOf('>');
    const email = (a >= 0 && b > a ? p.slice(a + 1, b) : p).trim().toLowerCase();
    const name = a >= 0 ? p.slice(0, a).split('"').join('').trim() : '';
    return { name, email };
  }).filter((x) => x.email.includes('@') && !x.email.includes(' '));
}
// The name people call someone by: "Doe, Jane" and "Jane Doe" are both Jane; an address alone gives its first part.
export function firstName(p) {
  const n = String((p && p.name) || '').trim();
  if (n) return (n.includes(',') ? n.split(',')[1] : n).trim().split(' ')[0] || n;
  const local = String((p && p.email) || '').split('@')[0].split('.')[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : '';
}

// Who the email is from and what it is, as lens-ask reads it. One shape for the composer and the conversation.
// THE EMAIL SHE OPENED (seat mail-invites, 2026-10-29): o.focusId names the message open on her screen, so a reply answers that
// message and its people, not whichever message happens to be last in the conversation (her own reply, after she answered).
function shapeOf(o) {
  const t = o.thread;
  const msgs = (t && t.messages) || [];
  const last = msgs[msgs.length - 1] || {};
  const mailbox = String(o.mailbox || '').toLowerCase();
  const focus = (o.focusId && msgs.find((m) => m.id === o.focusId)) || null;
  const other = (focus && String(focus.from_email || '').toLowerCase() !== mailbox ? focus : null)
    || [...msgs].reverse().find((m) => String(m.from_email || '').toLowerCase() !== mailbox) || last;
  const base = focus || other;
  const anchor = t ? {
    source_key: o.sourceKey, thread_id: t.thread_id, from_email: other.from_email || '', from_name: other.from_name || '',
    subject: t.subject || '', date: last.date || '', text: threadText(t),
  } : null;
  return { t, msgs, last, base, mailbox, other, anchor };
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

// WHO THE REPLY GOES TO, ALWAYS A VISIBLE CHOICE (seat mail-invites, 2026-10-29; Alex 14:39 PT on a thread with six people: Draft a
// reply for me showed To: the sender only, no Cc). At the top of the composer two choices, "Just <first name>" and "Everyone on this
// email (n)"; To and Cc are chips with each person's name, each removable, and "Add someone". The mailbox's own address and the
// person's own are never added. The last choice on this conversation is remembered in this browser; Reply opens on Just, Reply all
// on Everyone, and Draft a reply for me (mode 'auto') on Everyone when the email also went to people outside the business, else on
// Just. Switching changes only who it goes to: the words she wrote stay. SUPERSEDES the free-text To and Cc fields of round two.
const WHO_KEY = 'tool.replyWho.';
function whoRemembered(threadId) { try { return localStorage.getItem(WHO_KEY + threadId); } catch (_) { return null; } }
function whoRemember(threadId, w) { try { localStorage.setItem(WHO_KEY + threadId, w); } catch (_) { /* no storage: it is simply not remembered */ } }

// THE COMPOSER. o: { sourceKey, mailbox, thread, focusId, mode: 'reply' | 'replyall' | 'forward' | 'auto', onDiscard(), onSent() }.
// Returns { el, mode, who, fill(draft), setMode(m), setWho(w), status(text, cls), body(), recipients() }.
export function composer(C, o) {
  const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = text; return n; };
  const s = shapeOf(o);
  const viewer = String((C.viewer && C.viewer() && C.viewer().email) || '').toLowerCase();
  const own = new Set([s.mailbox, viewer].filter(Boolean));
  const ownDomain = s.mailbox.split('@')[1] || '';
  const sender = { name: s.other.from_name && s.other.from_name !== s.other.from_email ? s.other.from_name : '', email: String(s.other.from_email || '').toLowerCase() };
  const uniq = (list) => { const seen = new Set(); return list.filter((p) => { if (!p.email || own.has(p.email) || seen.has(p.email)) return false; seen.add(p.email); return true; }); };
  const toAll = uniq([sender].concat(people(s.base.to)));
  const ccAll = uniq(people(s.base.cc)).filter((p) => !toAll.some((q) => q.email === p.email));
  const everyone = toAll.length + ccAll.length;
  const outsiders = toAll.concat(ccAll).filter((p) => p.email !== sender.email && p.email.split('@')[1] !== ownDomain).length;

  const box = mk('section', 'mailx-compose');
  box.setAttribute('aria-label', 'Your reply');
  const head = mk('p', 'mailx-compose-kind');
  const drafted = mk('p', 'mailx-compose-drafted', 'Drafted from the emails and your books. Change anything before you send.');
  drafted.hidden = true;
  const whoRow = mk('div', 'mailx-who-pick');
  whoRow.setAttribute('role', 'group');
  whoRow.setAttribute('aria-label', 'Who the reply goes to');
  const justB = mk('button', 'mailx-who-btn'); justB.type = 'button';
  justB.append(mk('span', null, 'Just'), document.createTextNode(' '));
  const jn = mk('span', 'mailx-who-name', firstName(sender) || sender.email); jn.translate = false; justB.appendChild(jn);
  const allB = mk('button', 'mailx-who-btn'); allB.type = 'button';
  allB.append(mk('span', null, 'Everyone on this email'), document.createTextNode(' '));
  const an = mk('span', 'mailx-who-n', '(' + everyone + ')'); an.translate = false; allB.appendChild(an);
  whoRow.append(justB, allB);
  const chipsRow = (label) => { const r = mk('div', 'mailx-compose-field mailx-chips-field'); r.appendChild(mk('span', 'mailx-chips-label', label)); const c = mk('div', 'mailx-chips'); r.appendChild(c); return { row: r, chips: c }; };
  const toF = chipsRow('To');
  const ccF = chipsRow('Cc');
  const addI = mk('input', 'mailx-chip-add'); addI.type = 'email'; addI.autocomplete = 'off'; addI.placeholder = 'Add someone';
  addI.setAttribute('aria-label', 'Add someone');
  const subjI = mk('input'); subjI.type = 'text';
  const subjL = mk('label', 'mailx-compose-field'); subjL.appendChild(mk('span', null, 'Subject')); subjL.appendChild(subjI);
  const hint = mk('p', 'mailx-compose-drafted mailx-compose-hint'); hint.hidden = true;
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
  box.append(head, drafted, whoRow, toF.row, ccF.row, subjL, hint, bodyI, fwdNote, fwdPre, row);

  let to = [], cc = [], added = [];
  const drawChips = () => {
    toF.chips.innerHTML = ''; ccF.chips.innerHTML = '';
    const chip = (p, list, where) => {
      const c = mk('span', 'mailx-chip');
      const nm = mk('span', 'mailx-chip-name', p.name || p.email); nm.translate = false; nm.title = p.email;
      const x = mk('button', 'mailx-chip-x', '×'); x.type = 'button';
      x.setAttribute('aria-label', 'Remove'); x.title = 'Remove';
      x.addEventListener('click', () => { const i = list.indexOf(p); if (i >= 0) list.splice(i, 1); added = added.filter((q) => q !== p); drawChips(); });
      c.append(nm, x); where.appendChild(c);
    };
    for (const p of to) chip(p, to, toF.chips);
    for (const p of cc) chip(p, cc, ccF.chips);
    toF.chips.appendChild(addI);
    ccF.row.hidden = !cc.length;
    const all = api.who === 'all';
    justB.setAttribute('aria-pressed', all ? 'false' : 'true');
    allB.setAttribute('aria-pressed', all ? 'true' : 'false');
  };
  const addTyped = () => {
    const v = addI.value.trim();
    if (!v) return true;
    const got = people(v);
    if (!got.length) { api.status('That is not an email address.', 'state stalled'); return false; }
    for (const p of got) if (!own.has(p.email) && !to.concat(cc).some((q) => q.email === p.email)) { to.push(p); added.push(p); }
    addI.value = ''; api.status('', ''); drawChips();
    return true;
  };
  addI.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTyped(); } });
  addI.addEventListener('blur', () => { addTyped(); });

  const fwdBlock = () => ['---------- Forwarded message ----------',
    'From: ' + (s.base.from_name ? s.base.from_name + ' <' + (s.base.from_email || '') + '>' : (s.base.from_email || '')),
    'Date: ' + (s.base.date || ''), 'Subject: ' + ((s.t && s.t.subject) || ''), 'To: ' + (s.base.to || ''), '', s.base.body || ''].join(NL);
  const threadId = s.t && s.t.thread_id;
  const api = { el: box, mode: null, who: 'one' };
  api.setWho = (w) => {
    api.who = w === 'all' ? 'all' : 'one';
    to = (api.who === 'all' ? toAll.slice() : (sender.email && !own.has(sender.email) ? [sender] : [])).concat(added.filter((p) => !toAll.concat(ccAll).some((q) => q.email === p.email)));
    cc = api.who === 'all' ? ccAll.slice() : [];
    if (threadId && api.mode !== 'forward') whoRemember(threadId, api.who);
    drawChips();
  };
  api.setMode = (m) => {
    const fwd = m === 'forward';
    api.mode = fwd ? 'forward' : 'reply';
    head.textContent = fwd ? 'Forward' : 'Reply';
    whoRow.hidden = fwd || everyone < 2;
    subjI.value = prefixed(fwd ? 'Fwd:' : 'Re:', s.t && s.t.subject);
    bodyI.placeholder = fwd ? 'Add a note above the forwarded email' : 'Write your reply';
    fwdNote.hidden = !fwd; fwdPre.hidden = !fwd;
    fwdPre.textContent = fwd ? fwdBlock() : '';
    if (fwd) { api.who = 'one'; to = added.slice(); cc = []; drawChips(); return; }
    const remembered = threadId ? whoRemembered(threadId) : null;
    const w = m === 'replyall' ? 'all' : m === 'reply' ? 'one' : (remembered || (outsiders > 0 ? 'all' : 'one'));
    api.setWho(w);
  };
  justB.addEventListener('click', () => api.setWho('one'));
  allB.addEventListener('click', () => api.setWho('all'));
  api.fill = (d) => {
    if (d.subject) subjI.value = d.subject;
    bodyI.value = d.text || '';
    drafted.hidden = false;
    api.status('Nothing is sent until you press Send.', '');
  };
  api.status = (text, cls) => { said.textContent = text; said.className = 'mailx-compose-said' + (cls ? ' ' + cls : ''); };
  api.body = () => ({ subject: subjI.value, text: bodyI.value });
  api.recipients = () => ({ to: to.map((p) => p.email), cc: cc.map((p) => p.email) });
  // A line over the text (Suggest another time): drawn as its own words, so it shows in her language like every other line.
  api.hint = (text) => { hint.textContent = text; hint.hidden = !text; };
  api.focus = () => { (to.length ? bodyI : addI).focus(); };
  discard.addEventListener('click', () => { if (o.onDiscard) o.onDiscard(); });
  send.addEventListener('click', async () => {
    if (!addTyped()) return;
    const fwd = api.mode === 'forward';
    const r = api.recipients();
    if (!r.to.length) { api.status('Put at least one person in To.', 'state stalled'); return; }
    if (!bodyI.value.trim() && !fwd) { api.status('Write your reply first, or press Draft a reply for me.', 'state stalled'); return; }
    const text = fwd ? bodyI.value.trimEnd() + NL + NL + fwdBlock() : bodyI.value;
    const d = { source_key: o.sourceKey, thread_id: fwd ? '' : s.t.thread_id, to: r.to, cc: r.cc, subject: subjI.value, text };
    send.disabled = true;
    api.status('Sending from ' + s.mailbox + '.', 'working');
    try {
      const hash = await draftHash(d);
      const { status, j } = await post(C, SEND, Object.assign({ action: 'send', hash }, d));
      if (j && j.ok === true && j.sent) {
        const n = r.to.length + r.cc.length;
        api.status('Sent from ' + s.mailbox + ' to ' + n + ' address' + (n === 1 ? '' : 'es') + '. It is in your Sent folder in Gmail too.', 'mailx-compose-ok');
        for (const el of [subjI, bodyI, addI]) el.readOnly = true;
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

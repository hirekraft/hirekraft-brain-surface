// THE ONE BOX (seat one-box, 2026-10-08). Alex that day: "It's an important feature, something you
// don't have anywhere else, and it is almost not visible. People should be able to just say 'I'm
// looking for that specific email about this or that'. Maybe we just need one box, but more
// prominent, explaining what you can do with it."
// Capability, in her words: "I tell the Tool what I need: find it, explain it, or do it."
//
// ONE BOX, AT THE TOP, ON EVERY TAB. It decides what she means and hands the request to what
// already does it; it does none of the work itself:
//   FIND  -> the Mail tab's inbox column becomes a list of emails from every mailbox she can open
//            (mail.js findMail, which calls worklens-live search per mailbox and its meaning search).
//   ASK   -> lens-ask, exactly as before: about the open email when one is open on Mail
//            (mail.js askFromMailBar), otherwise the one conversation (lens.js ask).
//   DO    -> the Answer flow on the open email (mail.js doFromBox).
// WHERE INTENT IS DECIDED, AND WHY HERE (seat call, 2026-10-08): in this file, by word rules, with
// no model. A find must start at once, and a model call first would put a round trip in front of
// every find. When the rules cannot tell, it does the cheap thing (find) and the list offers to ask
// instead in one line. If the rules prove too blunt, the place to improve them is intentOf() below.
// No pattern here carries a backslash (the repository write tool mangles them; STANDING-CLAUSES).
//
// SCOPE IS A CHIP, NOT A SETTING. With a mailbox open on Mail the box shows "in <mailbox>"; with an
// email open, "about this email". Removing a chip widens the request; choosing another mailbox or
// email brings the chip back. With no chip, a find covers every mailbox she can open.
// EXAMPLES are built from what she can see on this screen right now (the open email, the senders in
// the inbox she has loaded, her mailboxes). None is written here as a fixed question, because an
// offered question the Tool cannot answer teaches that the box is decoration (index.html, dock note).

let C = null;
const off = { mailbox: null, email: null };   // which chip she removed, by what it named

const DEFAULT_PH = 'Find an email, ask anything, or say what to do';
const DO_FIRST = ['reply', 'respond', 'answer', 'draft', 'forward', 'fwd'];
const FIND_FIRST = ['find', 'search', 'locate', 'show', 'pull', 'open', 'get'];
const ASK_FIRST = ['what', 'who', 'whom', 'whose', 'why', 'how', 'when', 'which', 'is', 'are', 'was',
  'were', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'tell', 'explain', 'summarize',
  'summarise', 'compare', 'list', 'give', 'calculate', 'total', 'count'];
const FIND_PHRASES = ['looking for', 'that email', 'the email', 'an email', 'that message', 'the message',
  'the thread', 'that thread', 'pull up', 'show me the'];

function wordsOf(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9@' ]+/g, ' ').split(' ').filter(Boolean);
}

// 'do' | 'do-none' (a DO with no email open) | 'find' | 'ask' | 'unsure' (treated as find, offers ask)
export function intentOf(text, emailOpen) {
  const t = String(text || '').trim();
  const w = wordsOf(t);
  if (!w.length) return 'find';
  const first = w[0], joined = ' ' + w.join(' ') + ' ';
  if (DO_FIRST.includes(first) || (first === 'write' && (w[1] === 'back' || joined.includes(' reply ')))) {
    return emailOpen ? 'do' : 'do-none';
  }
  if (first === 'where' && ['is', 'are', "where's", 'was'].includes(w[1] || '')) return 'find';
  if (first === "where's") return 'find';
  if (FIND_FIRST.includes(first)) return 'find';
  if (FIND_PHRASES.some((p) => joined.includes(' ' + p + ' '))) return 'find';
  if (t.endsWith('?') || ASK_FIRST.includes(first)) return 'ask';
  if (w.includes('from') || w.includes('invoice') || w.includes('attachment')) return 'find';
  return w.length <= 6 ? 'find' : 'unsure';
}

const $ = (s) => document.querySelector(s);

// What the box asks about right now, after any chip she removed.
function scope() {
  const s = C.mailScope();
  const onMail = C.onMail();
  const mailbox = onMail && s && s.key && off.mailbox !== s.key ? { key: s.key, address: s.address || s.key } : null;
  const email = onMail && s && s.emailOpen && off.email !== s.threadKey;
  return { mailbox, email: !!email, raw: s, onMail };
}

function chip(label, onRemove) {
  const c = C.el('span', 'onebox-chip');
  c.appendChild(document.createTextNode(label));
  const x = C.el('button');
  x.type = 'button';
  x.textContent = 'x';
  x.title = 'Remove: ask more widely';
  x.setAttribute('aria-label', 'Remove ' + label);
  x.addEventListener('click', () => { onRemove(); drawBox(); $('#ask-input')?.focus(); });
  c.appendChild(x);
  return c;
}

export function drawBox() {
  if (!C) return;
  const host = $('#onebox-chips'), input = $('#ask-input');
  if (!host || !input) return;
  const sc = scope();
  host.innerHTML = '';
  if (sc.mailbox) host.appendChild(chip('in ' + sc.mailbox.address, () => { off.mailbox = sc.mailbox.key; }));
  if (sc.email) host.appendChild(chip('about this email', () => { off.email = sc.raw.threadKey; }));
  input.placeholder = C.placeholder() || (sc.email ? 'Ask about this email, have it answered, or find another'
    : DEFAULT_PH);
}

function firstName(n) {
  const s = String(n || '').trim();
  if (!s || s.includes('@')) return '';
  return s.split(' ')[0].replace(/[^A-Za-z'-]/g, '');
}

function domainLabel(email) {
  const d = String(email || '').split('@')[1] || '';
  const parts = d.split('.');
  const root = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return root ? root.charAt(0).toUpperCase() + root.slice(1) : '';
}

const MACHINE = ['noreply', 'no-reply', 'donotreply', 'notification', 'notifications', 'mailer', 'info', 'news'];

// At most four, each something the Tool can do with what is on this screen.
function examples() {
  const h = C.mailHints() || {};
  const sc = scope();
  const out = [];
  if (sc.email && h.open) {
    out.push("Reply to this saying we'll confirm by Friday");
    const fn = firstName(h.open.from_name);
    if (fn) out.push('What else do we know about ' + fn + '?');
  }
  const own = new Set((C.mailboxAddresses() || []).map((a) => String(a).split('@')[1]));
  const people = (h.recent || []).filter((r) => {
    const local = String(r.from_email || '').split('@')[0];
    return firstName(r.from_name) && !MACHINE.some((m) => local.includes(m));
  });
  if (people[0]) out.push('Find the latest email from ' + firstName(people[0].from_name));
  const outside = people.find((r) => {
    const d = String(r.from_email || '').split('@')[1];
    return d && !own.has(d) && !['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'].includes(d);
  });
  if (outside && domainLabel(outside.from_email)) out.push('What does the company know about ' + domainLabel(outside.from_email) + '?');
  if ((C.mailboxAddresses() || []).length) out.push(sc.mailbox ? 'Find the latest invoice in ' + sc.mailbox.address : 'Find the latest invoice in any mailbox');
  return [...new Set(out)].slice(0, 4);
}

function showTips(on) {
  const tips = $('#onebox-tips'), input = $('#ask-input');
  if (!tips || !input) return;
  if (!on || input.value.trim()) { tips.hidden = true; return; }
  const list = examples();
  tips.innerHTML = '';
  const lead = C.el('p', 'quiet');
  lead.textContent = 'Say what you need, in your own words. It finds emails, answers from everything the company knows, or drafts the reply.';
  tips.appendChild(lead);
  for (const e of list) {
    const b = C.el('button', 'onebox-tip');
    b.type = 'button';
    b.textContent = e;
    // mousedown, so it lands before the input's blur hides the list
    b.addEventListener('mousedown', (ev) => { ev.preventDefault(); input.value = ''; tips.hidden = true; submit(e); });
    tips.appendChild(b);
  }
  tips.hidden = false;
}

function submit(text) {
  const t = String(text || '').trim();
  if (!t) return;
  const sc = scope();
  const intent = intentOf(t, sc.email);
  if (intent === 'do' && C.doFromBox(t, wordsOf(t)[0] === 'forward' || wordsOf(t)[0] === 'fwd' ? 'forward' : 'reply')) return;
  if (intent === 'ask') {
    if (sc.onMail && C.askFromMailBar(t, !sc.email)) return;
    C.ask(t);
    return;
  }
  find(t, intent === 'unsure', intent === 'do-none' || intent === 'do'
    ? 'Open the email you want answered, then say it again in the box; these may be it.' : '');
}

// A MAILBOX SHE NAMES GOES TO THE DOOR (seat refusal-wire, 2026-10-08). Until now "open accounting@" was a
// find across the mailboxes she can already open, so a mailbox kept from her was never asked about: nothing
// refused, nothing recorded, an empty search. Now an address she names AS A MAILBOX (after open, in, inbox,
// mailbox, check or read; as a possessive, alex@'s; or alone) at one of her own company's domains is matched
// to her mailboxes: hers, and the find is scoped to it; not hers, and the find is sent to it anyway, so the
// door (worklens-live) refuses it, records it and says so. This file decides nothing about access. An address
// used any other way (emails from kevin@client.com) stays an ordinary find and is never sent to the door.
const REACH_BEFORE = ['open', 'in', 'into', 'inbox', 'mailbox', 'check', 'read'];
function namedMailbox(text) {
  const raw = String(text || '').toLowerCase().split(' ').filter(Boolean);
  const mine = (C.mailboxAddresses() || []).map((a) => String(a).toLowerCase());
  const domains = [...new Set(mine.map((a) => a.split('@')[1]).filter(Boolean))];
  for (let i = 0; i < raw.length; i++) {
    const poss = raw[i].endsWith("'s");
    const tok = (poss ? raw[i].slice(0, -2) : raw[i]).replace(/[^a-z0-9@._+-]/g, '');
    const at = tok.indexOf('@');
    if (at <= 0) continue;
    if (!(poss || REACH_BEFORE.includes(raw[i - 1] || '') || raw.length <= 2)) continue;
    const local = tok.slice(0, at), domain = tok.slice(at + 1);
    const hit = mine.find((a) => domain ? a === tok : a.split('@')[0] === local);
    const rest = raw.filter((w, k) => k !== i && !FIND_FIRST.includes(w) && !REACH_BEFORE.includes(w) && w !== 'me').join(' ');
    if (hit) return { key: 'gmail:' + hit, rest };
    if (domain && !domains.includes(domain)) return null;
    const dom = domain || domains[0];
    return dom ? { key: 'gmail:' + local + '@' + dom, rest } : null;
  }
  return null;
}

// Find across the mailboxes the door lists for her (the same list the Mail tab draws), the one
// the chip names, or the one she names (above).
function find(text, unsure, note) {
  const sc = scope();
  const named = sc.mailbox ? null : namedMailbox(text);
  const keys = sc.mailbox ? [sc.mailbox.key] : named ? [named.key] : C.readingMailboxKeys();
  C.showMail();
  C.findMail(named ? (named.rest || 'in:inbox') : text, keys, { unsure, note, askInstead: () => { C.clearFind(); if (!C.askFromMailBar(text, true)) C.ask(text); } });
}

export function initBox(ctx) {
  C = ctx;
  const input = $('#ask-input'), send = $('#ask-send');
  if (!input || !send) return;
  const go = () => { const v = input.value; input.value = ''; showTips(false); submit(v); };
  send.addEventListener('click', go);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); go(); }
    if (e.key === 'Escape') showTips(false);
  });
  input.addEventListener('focus', () => showTips(true));
  input.addEventListener('input', () => showTips(true));
  input.addEventListener('blur', () => setTimeout(() => showTips(false), 120));
  drawBox();
  ownerLines();
}

// THE OWNER IS TOLD (seat refusal-wire, 2026-10-08). When the owner opens the Tool and someone was told today
// that an attempt was recorded and the owner can see it (or crossed an alert), one line per person sits at the
// top of the box, once per page load, until she closes it. The lines are the brain's own (refusal_watch, owner
// only); nothing here counts or decides. If the read itself fails, that is said in the same place, never
// shown as nothing. Anyone else sees nothing here, and the brain refuses them the read anyway.
async function ownerLines(tries = 0) {
  const v = C.viewer ? C.viewer() : null;
  if (!v) { if (tries < 40) setTimeout(() => ownerLines(tries + 1), 500); return; }
  if (!v.all_access || !C.refusalWatch) return;
  let data = null, err = '';
  try { data = await C.refusalWatch(); } catch (e) { err = String((e && e.message) || e); }
  if (!err && (!data || data.ok !== true)) err = (data && data.note) || 'no reason was given';
  const lines = !err && Array.isArray(data.lines) ? data.lines : [];
  if (!lines.length && !err) return;
  const host = $('#onebox');
  if (!host || $('#onebox-watch')) return;
  const box = C.el('div', 'notice onebox-watch');
  box.id = 'onebox-watch';
  box.setAttribute('role', 'status');
  for (const l of lines) { const p = C.el('p'); p.textContent = l; box.appendChild(p); }
  if (err) { const p = C.el('p', 'quiet'); p.textContent = 'Refused attempts could not be read: ' + err; box.appendChild(p); }
  const x = C.el('button');
  x.type = 'button';
  x.textContent = 'x';
  x.setAttribute('aria-label', 'Close');
  x.addEventListener('click', () => box.remove());
  box.appendChild(x);
  host.insertBefore(box, host.firstChild);
}

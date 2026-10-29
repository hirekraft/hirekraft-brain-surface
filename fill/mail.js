// THE MAIL TAB (seat mail-redesign, 2026-10-07; Alex's rulings 2026-10-06).
// Three columns across the window: on the left, who is signed in and every mailbox she can
// open, grouped by company domain with full addresses; in the middle, the chosen mailbox's
// inbox; on the right, the chosen email with what you did not know, where it stands, and
// what to do with it.
//
// WHO MAY OPEN WHICH MAILBOX IS NOT DECIDED HERE. The left column is mailbox_state(), read by
// lens.js. The inbox and the email come from worklens-live, which asks mailbox_state() again,
// as the caller, and refuses any mailbox it does not list (v30). This file draws what those
// two return and nothing else; a refusal is shown with its reason, never as an empty inbox.
//
// THIS REPLACES THE JULY PAGE AT /mail/ (archived 2026-10-07 on branch archive/mail-2026-07;
// the old address now opens this tab). Kept from it: the live read, what you didn't know,
// where this stands, Answer and Forward. Left behind on purpose, Alex 2026-10-06: its own
// ask box (the one Ask bar below every tab stays, and what she asks is kept in Work); the
// "more of this story we can't reach" note (either she can read a mailbox or not; sources
// that cannot be opened are one line on the Brain tab now); the identity shield panel; and
// Just register, which wrote into the July case tracker that is archived too (kept work
// lives in Work).
//
// No colour, size or spacing here; those are in skin.css under MAIL.
//
// READING (seat reading, 2026-10-07; Alex that day: "Workability is very important, it's not a
// luxury"). An email reads like email. HTML mail is shown as it was sent, inside a sandboxed
// frame: no scripts, so nothing inside it can run on this page or read it (the frame note below);
// links open in a new tab; remote pictures stay hidden until she asks, because loading them
// tells the sender she opened it. Plain mail keeps its line breaks, with links clickable. The
// earlier quoted reply folds away. A newsletter is said in one line, not listed. The columns
// fill the window and scroll by themselves; on a narrow screen one shows at a time (data-view
// on the frame). The frame's colours are read from skin.css when it is drawn, so no colour is
// written here either.
//
// THE CONVERSATION ABOUT AN EMAIL STAYS WITH THAT EMAIL (seat email-workspace, 2026-10-07; Alex that
// day, after an answer about one mailbox stayed on screen over the next: "Either it resets, or we
// find another way to show the answers to the email"). What she asks while an email is open, from
// Answer, Forward or the one Ask bar, is answered in the reading column under that email (answer.js),
// and the email folds to its first lines while she talks. Opening another email or mailbox takes it
// off the screen; it is kept in Work as a chat named after the email; returning to the email shows
// it again, from memory on this page or, after a reload, from what Work kept (work_about). Discard
// is one click on the conversation. With no email open, a question asked here is answered in the
// reading column too, so nothing on the Mail tab ever draws a band of conversation under the columns.

import { conversation } from './answer.js?v=2026-10-22-dates';
import { fmtDate } from './dates.js?v=2026-10-22-dates';
import { plainWords } from './plain.js?v=2026-10-27-mail-views';
import { screenLang, screenLangName } from './words.js?v=2026-10-28-language';   // See it in <language> (seat language-and-nudge)

// VIEWS IN THE LEFT COLUMN (seat mail-views, 2026-10-27; Alex 14:41 PT: "Worth your attention should be ... on the left-hand
// side instead of an email, like a label ... worth your attention, and the other would be starred"). At the top of the left
// column, across every mailbox she may open: Worth your attention, Starred, Labels (her Gmail labels by mailbox). Choosing a
// view fills the middle list; choosing an item fills the right pane. SUPERSEDES the Worth your attention block above the
// three columns (seat attention, same day), which took a third of the screen and squeezed the mail ("very crowded"); the
// block and its styles are removed. Starred and a label are read live from Gmail by the same search the box uses (FIND,
// worklens-live 'search' with is:starred or label:...), each mailbox behind the same door; their counts are the Tool's kept
// marks (stars-labels). Nothing in any mailbox is changed by looking.
// SINCE seat mail-inbox (2026-10-29, decision 1033): the column reads Worth your attention, Mark all as seen, Mailboxes, Caught (the
// Suspicious view renamed; its code keeps the name 'suspicious'), then Starred and Labels under "Your Gmail", read from what the Tool
// keeps; every number is not yet seen by you. See drawSide.
let view = null;           // { kind: 'attention' } | { kind: 'suspicious' } | { kind: 'starred' } | { kind: 'label', name, address } | { kind: 'mailbox' }
let pick = null;            // the Worth your attention item open in the right pane
let marks = null;           // { loading } | { labels, starred } | { error }
let labelsOpen = false;
let userChose = false;      // she chose a view or a mailbox herself: a late reading never moves her
let afterOpen = null;       // what to do once the email an item opened is on screen ('reply')
const LAST = 'tool.mail.last';
function lastBox() { try { return localStorage.getItem(LAST) || null; } catch (_) { return null; } }
function keepLastBox(k) { try { localStorage.setItem(LAST, k); } catch (_) { /* this browser keeps nothing */ } }

const LIVE = '/functions/v1/worklens-live';

let C = null;              // what lens.js hands over (initMail)
let chosen = null;         // source key of the open mailbox
let inbox = null;          // { pages, next, estimate, error, loading, more }
let open = null;           // { id, thread, related, error, full }
// NEW SINCE YOU LAST LOOKED (seat attention, 2026-10-27, decision 1024 item 6; Alex 2026-10-26 on Gmail's unread counts:
// "they just don't tell much"). Beside each mailbox: how many emails arrived since this person last opened that mailbox here,
// per person, kept by the Tool. Zero shows nothing. SUPERSEDES Gmail's unread count from worklens-live 'counts' (retired here
// 2026-10-27, seat attention; worklens-live still answers it for any other caller). Since seat mail-inbox (2026-10-29) the number
// is "not yet seen by you" (below), read from mail_inbox_view; mail_new stays in the brain for any other caller.
const unread = new Map();  // source key -> not yet seen by her (mail_inbox_view)
// SEEN, PER PERSON, IN THE TOOL (seat mail-inbox, 2026-10-29, decision 1033 item 1; Alex 08:49 PT: "opening an item ... does not
// lower any count; nothing marks what he has seen"). Opening an email, a caught scam or a Worth your attention item marks it seen
// for her in the brain (mail_seen_mark); Gmail's own read state is never touched. Every count in the left column is "not yet seen
// by you", from one reading (mail_inbox_view) and one rule in the brain (mail_is_unseen). Mark all as seen covers every mailbox
// and view and can be undone for a day. SUPERSEDES markSeen on opening a mailbox (seat attention, 2026-10-27): it reset a
// mailbox's number the moment the inbox was listed, though nothing had been read; removed, so opening a mailbox marks nothing.
let iv = null;             // { loading } | { data } | { error }: mail_inbox_view
const unseenIds = new Map(); // source key -> Set of message ids on the page she has not seen (mail_seen_state)
const seenHere = new Set();  // 'kind|place|item' she opened on this page view, so the screen does not wait for the brain
let markAllSaid = null;      // the line after Mark all as seen, with its Undo
let parts = null;          // the three columns once drawn
const imagesShown = new Set(); // message ids whose remote pictures she chose to load
const convos = new Map();      // 'mail:<source_key>:<thread_id>' -> the conversation about that email
let found = null;              // a find from the one box (box.js): emails from every mailbox, in the inbox column
let findSeq = 0;

// SOMEONE PRETENDING TO BE US (seat fraud-watch, 2026-10-27; Alex 2026-10-26: "Impersonating accounts, because it's
// been an issue for us"). The brain checks every email as it arrives and keeps one plain warning on any that pretends
// to be a person of the business, comes from a look-alike address, or presses for a payment to someone new
// (fraud_flag). item_warnings hands back the warnings for the emails on screen, to anyone who can open that mailbox;
// who may see it is decided there, not here. A check that could not run is said, never shown as no warning.
const warns = new Map();       // 'source key|message id' -> the warning, or null when asked and there is none
let warnsError = null;
const warnKey = (s, id) => s + '|' + id;
function warnFor(s, ids) {
  for (const id of ids) { const w = id ? warns.get(warnKey(s, id)) : null; if (w) return w; }
  return null;
}
async function askWarnings(pairs) {
  const need = pairs.filter((p) => p[0] && p[1] && !warns.has(warnKey(p[0], p[1])));
  if (!need.length) return;
  for (const p of need) warns.set(warnKey(p[0], p[1]), null);   // asked once per page view, even if the check fails
  let fresh = 0;
  const had = warnsError;
  try {
    const { data, error } = await C.sb.rpc('item_warnings', { p_sources: need.map((p) => p[0]), p_ids: need.map((p) => p[1]) });
    if (error || !data || data.ok === false) throw new Error((error && error.message) || (data && data.reason) || 'no answer came back');
    for (const w of data.warnings || []) { warns.set(warnKey(w.source, w.id), w); fresh++; }
    warnsError = null;
  } catch (e) {
    warnsError = 'Whether these emails pretend to be someone could not be checked just now. ' + plainWords(String((e && e.message) || e || ''));
  }
  if (!parts || (!fresh && had === warnsError)) return;
  drawList();
  const t = open && open.thread;
  if (t && warnFor(chosen, (t.messages || []).map((m) => m.id).concat([t.thread_id]))) drawRead();
}
function firstSentence(line) {
  const s = String(line || ''); const i = s.indexOf('. ');
  return i > 0 ? s.slice(0, i + 1) : s;
}
function warnBox(w) {
  const box = mk('div', 'mailx-warning');
  box.setAttribute('role', 'alert');
  box.appendChild(mk('p', 'mailx-warning-line', w.line));
  if (w.books) box.appendChild(mk('p', 'mailx-warning-books', w.books));
  return box;
}
function warnTag(b, w) {
  b.classList.add('warned');
  b.appendChild(mk('span', 'mailx-warn', firstSentence(w.line)));
}
let pendingOpen = null;        // an email an answer asked to open (lens.js emailList), waiting for the columns
const NL = String.fromCharCode(10);
const TAB = String.fromCharCode(9);
// worklens-live finds at most this many related conversations (RELATED_THREADS there), so a
// count that reaches it is a floor, said as "at least".
const RELATED_CAP = 12;

// Which column a narrow screen shows: 'side', 'list' or 'read'. A wide screen shows all three.
function setView(v) { if (parts) parts.wrap.dataset.view = v; }
function navButton(label, view, extra) {
  const b = mk('button', 'mailx-nav' + (extra || ''), label);
  b.type = 'button';
  b.addEventListener('click', () => setView(view));
  return b;
}

export function initMail(ctx) { C = ctx; }

// The Brain tab's list and the old /mail/ address both arrive here with a mailbox in hand.
export function chooseMailbox(key) {
  if (!key) return;
  userChose = true; keepLastBox(key);
  const wasView = view && view.kind !== 'mailbox';
  view = { kind: 'mailbox' }; pick = null;
  // Choosing a mailbox ends a find: the list column goes back to being that inbox (seat one-box).
  if (found) { found = null; if (key === chosen && parts) { setView('list'); drawSide(); drawList(); drawRead(); return; } }
  if (key === chosen) { setView('list'); if (wasView && parts) { drawSide(); drawList(); drawRead(); } return; }
  chosen = key; inbox = null; open = null;
  if (parts) { setView('list'); parts.list.scrollTop = 0; drawSide(); drawList(); drawRead(); }
}

// Every count in the left column, from one reading of the brain.
let ivSeq = 0;
async function loadInboxView() {
  const seq = ++ivSeq;
  if (!iv) iv = { loading: true };
  try {
    const { data, error } = await C.sb.rpc('mail_inbox_view');
    if (error || !data || data.ok === false) throw new Error((error && error.message) || (data && data.reason) || '');
    if (seq !== ivSeq) return;
    iv = { data };
    unread.clear();
    for (const m of data.mailboxes || []) if (m.unseen !== null && m.unseen !== undefined) unread.set(m.source_key, Number(m.unseen));
  } catch (e) {
    if (seq !== ivSeq) return;
    iv = { error: plainWords(String((e && e.message) || e || '')) };
  }
  if (parts) drawSide();
}
// She opened it: it is seen, for her, in the Tool. The count drops on the screen at once; the brain is read again after.
let ivAgain = null;
function markSeen(kind, place, items) {
  const fresh = (items || []).filter((x) => x && !seenHere.has(kind + '|' + place + '|' + x));
  if (!place || !fresh.length) return;
  for (const x of fresh) seenHere.add(kind + '|' + place + '|' + x);
  if (kind === 'email') {
    const u = unseenIds.get(place);
    let drop = 0;
    if (u) for (const x of fresh) if (u.delete(x)) drop++;
    if (drop && unread.has(place)) unread.set(place, Math.max(0, unread.get(place) - drop));
  }
  if (parts) { drawSide(); drawList(); }
  C.sb.rpc('mail_seen_mark', { p_kind: kind, p_place: place, p_items: fresh }).then(() => {
    clearTimeout(ivAgain); ivAgain = setTimeout(loadInboxView, 800);
  }, () => {});
}
function seenLocally(kind, place, item) { return seenHere.has(kind + '|' + place + '|' + item); }
// Which emails on this page she has not seen, by the brain's one rule (kept emails only; one the Tool never kept is not counted).
async function askUnseen(key, ids) {
  const want = (ids || []).filter(Boolean).slice(0, 300);
  if (!key || !want.length) return;
  try {
    const { data } = await C.sb.rpc('mail_seen_state', { p_source: key, p_ids: want });
    if (!data || data.ok === false) return;
    const u = unseenIds.get(key) || new Set();
    for (const x of data.unseen || []) if (!seenLocally('email', key, x)) u.add(String(x));
    unseenIds.set(key, u);
    if (parts) drawList();
  } catch (_) { /* no bold is shown, never a wrong count */ }
}
function attnSeenAt(it) {
  const m = iv && iv.data && iv.data.attention_seen ? iv.data.attention_seen[it.key] : null;
  return m ? new Date(m) : null;
}
function attnUnseen(it) {
  if (seenLocally('attention', 'attention', it.key)) return false;
  const s = attnSeenAt(it);
  if (!s) return true;
  return !!(it.at && new Date(it.at) > s);
}
function scamUnseen(it) { return !!it.unseen && !seenLocally('scam', it.source, it.id); }

// MARK ALL AS SEEN: every mailbox, Caught, Starred, Labels and Worth your attention; undo for a day.
async function markAll(btn, out) {
  btn.disabled = true;
  out.className = 'working'; out.textContent = 'Marking everything as seen. Gmail is not changed.';
  let r = null;
  try { const x = await C.sb.rpc('mail_seen_all', { p_attention: attnItems().concat(attnMore()).map((it) => it.key) }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  btn.disabled = false;
  if (!r || r.ok !== true) { markAllSaid = { line: 'Nothing was marked. ' + plainWords(String((r && r.reason) || '')) }; if (parts) drawSide(); return; }
  markAllSaid = { line: String(r.line || 'Everything is marked as seen.'), id: r.id, until: r.undo_until };
  for (const s of unseenIds.values()) s.clear();
  await Promise.all([loadInboxView(), loadScams()]);
  if (parts) { drawSide(); drawList(); }
}
async function undoMarkAll(id, btn) {
  btn.disabled = true;
  let r = null;
  try { const x = await C.sb.rpc('mail_seen_all_undo', { p_id: id }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  markAllSaid = { line: r && r.ok ? String(r.line || 'Undone.') : 'Not undone. ' + plainWords(String((r && r.reason) || '')) };
  seenHere.clear(); unseenIds.clear();
  await Promise.all([loadInboxView(), loadScams()]);
  if (inbox && inbox.pages && chosen) askUnseen(chosen, inbox.pages.map((x) => x.id));
  if (parts) { drawSide(); drawList(); }
}

// WORTH YOUR ATTENTION (seat attention, 2026-10-27, decision 1024 item 5; Alex 2026-10-26: "something that I would actually
// want to see first... you learn with time what is of importance to me"). The brain's short ranked list (attention, read as
// her: only mailboxes she may open; books for the owner only), each with what, why and what was checked. It only puts things
// first: nothing is hidden or changed, the rest is counted in the quiet lines. What it learned from you lists every rule,
// each undoable. No AI, no cost. SINCE seat mail-views (same day) it is a view in the left column: one line of what and one
// of why per item in the middle list, the item in the right pane.
let attn = null;            // { loading } | { data, more, gone, said } | { error }
let attnSeen = false;
async function loadAttention() {
  attn = { loading: true };
  if (parts) { drawSide(); if (view && view.kind === 'attention') drawList(); }
  try {
    const { data, error } = await C.sb.rpc('attention', { p_days: 14 });
    if (error || !data || data.ok === false) throw new Error((error && error.message) || (data && data.reason) || '');
    attn = { data, more: false, gone: new Set(), said: new Map() };
  } catch (e) {
    attn = { error: plainWords(String((e && e.message) || e || '')) };
  }
  // Opening Mail selects Worth your attention when it has items, otherwise the last mailbox she opened (brief item 3).
  if (!userChose && view && view.kind === 'attention' && attn.data && !attnItems().length) toMailbox(lastBox());
  if (parts) { drawSide(); drawList(); drawRead(); }
  if (attn.data && !attnSeen) { attnSeen = true; C.sb.rpc('seen_mark_set', { p_place: 'attention' }).then(() => {}, () => {}); }
}
function attnUnseenCount() { return attnItems().filter(attnUnseen).length; }
function attnItems() { return attn && attn.data ? (attn.data.items || []).filter((x) => !attn.gone.has(x.key)) : []; }
function attnMore() { return attn && attn.data ? (attn.data.more || []).filter((x) => !attn.gone.has(x.key)) : []; }
function attnTeach(rows) { return C.sb.rpc('find_signal_add', { p_signals: rows }).then(({ data }) => data, () => null); }
function whoOf(it) { return String(it.what || '').split(': ')[0].split(' (')[0]; }

// ACTIONS FIT THE ITEM (seat mail-views; Alex 14:51 PT: "couldn't the options ... depend more on the email itself ... not
// say not useful ... whenever we suggest anything ... they should be smarter"). Each kind gets its own two or three actions,
// each labeled with what happens; each dismissal says what the Tool learns. SUPERSEDES the same Open / Not important pair on
// every item (seat attention). The kinds (attention_for_identity; email items carry 'about' since migration mail-views):
//   impostor (someone pretending to be us)  Warn <who reads that mailbox>, Report it in Gmail, Not a scam
//   invoice, invoices (money owed to us)    Open the invoice, Draft a reminder, Already paid
//   bill (money we owe)                     Open the bill, Already paid
//   email about money                       Draft a reply, Already paid, Not important
//   email about a question waiting for you  Draft a reply, Not mine
//   email waiting on them to confirm        Draft a follow-up, Not important
//   thought left for her                    Read it, See the original, Reply with a thoughtgram
//   anything else (watch, finding, email)   Open, Not important
function kindOf(it) {
  if (!it) return 'other';
  if (it.kind === 'thought' || it.kind === 'impostor' || it.kind === 'bill') return it.kind;
  if (it.kind === 'invoice' || it.kind === 'invoices') return 'invoice';
  if (it.kind === 'email' && ['money', 'question', 'waiting'].includes(it.about)) return 'email-' + it.about;
  return 'other';
}
function settle(it, line) {
  attn.said.set(it.key, line);
  drawRead();
}
function gone(it, line) {
  attn.gone.add(it.key);
  attn.said.set(it.key, line);
  drawSide(); drawList(); drawRead();
}
async function dismiss(it, btn, rows, line) {
  btn.disabled = true;
  const r = await attnTeach(rows);
  if (!r || r.ok !== true) { btn.disabled = false; btn.textContent = 'Not kept. Try again'; return; }
  gone(it, line);
}
// Open the email an item rests on, in its own mailbox; then, if asked, start the reply (a draft, never sent by itself).
function openFor(it, then) {
  if (it.from_key) attnTeach([{ key: it.from_key, signal: 'opened', title: 'Mail from ' + whoOf(it) }]);
  afterOpen = then || null;
  openEmail(it.open_source, it.open_id);
}
function gmailHref(it) {
  const box = String(it.open_source || '').split(':').slice(1).join(':');
  return 'https://mail.google.com/mail/u/?authuser=' + encodeURIComponent(box) + '#all/' + encodeURIComponent(it.open_id || '');
}
function actionsFor(it, row, out) {
  const b = (label, fn, primary) => { const x = mk('button', primary ? 'go' : 'go ghost', label); x.type = 'button'; x.addEventListener('click', () => fn(x)); row.appendChild(x); return x; };
  const a = (label, href, primary) => { const x = mk('a', primary ? 'go' : 'go ghost', label); x.href = href; x.target = '_blank'; x.rel = 'noopener'; row.appendChild(x); return x; };
  const who = whoOf(it);
  const books = Array.isArray(it.checked) ? it.checked.filter((c) => String(c).startsWith('Books')).join(' ') : '';
  const paid = (x, what) => dismiss(it, x, [{ key: it.key, signal: 'dismissed', title: what + ' you said was paid' }],
    (books ? 'The Tool checked your books: ' + books.replace(/^Books: /, '') + ' ' : 'Your books were not checked for this. ')
      + 'If it was paid, it leaves this list once the payment is in the books. Until then it is moved lower for you; undo under What it learned from you.');
  const k = kindOf(it);
  if (k === 'impostor') {
    const names = (Array.isArray(it.readers) ? it.readers : []).map((p) => String(p.name || '')).filter(Boolean);
    if (names.length && C.startThought) {
      b('Warn ' + names.join(', '), () => {
        C.startThought({ for: names });
        const i = document.getElementById('ask-input');
        if (i) i.value = 'Some emails pretend to be someone of our business. Do not pay anything they ask, do not open their links or attachments, and tell the owner.';
        settle(it, 'Your warning for ' + names.join(', ') + ' is in the box at the top. Press Go: it is read back to you before it is kept, and only you and they will see it.');
      }, true);
    } else {
      out.appendChild(mk('p', 'mailx-att-checked', 'Nobody else who signs in to the Tool reads these mailboxes, so the Tool has nobody to warn. Whoever works them in Gmail does not see this warning: tell them yourself.'));
    }
    if (it.open_id) a('Report it in Gmail', gmailHref(it));
    out.appendChild(mk('p', 'mailx-att-checked', 'Report it in Gmail opens the latest one there, where Report phishing is in the message menu. The Tool changes nothing in your mailbox.'));
    b('Not a scam', (x) => {
      x.disabled = true;
      const f = mk('div', 'mailx-att-why-box');
      const lab = mk('label', null, 'In one line, why is it not a scam?');
      const inp = mk('input', 'mailx-att-input'); inp.type = 'text'; inp.maxLength = 280;
      lab.appendChild(inp);
      const keep = mk('button', 'go', 'Keep');
      keep.type = 'button';
      keep.addEventListener('click', async () => {
        const why = inp.value.trim();
        if (!why) { inp.focus(); return; }
        keep.disabled = true;
        const fe = String(it.from_email || '').toLowerCase();
        const r = await attnTeach([{ key: 'fraud:' + fe, signal: 'dismissed', value: 'not_scam', title: 'Mail from ' + fe + ' (you said it is not a scam)', about: why }]);
        if (!r || r.ok !== true) { keep.disabled = false; keep.textContent = 'Not kept. Try again'; return; }
        settle(it, 'Kept, with your reason. Mail from ' + fe + ' is no longer raised here for you. The warning stays on those emails for anyone else who reads that mailbox. Undo under What it learned from you.');
        loadAttention();
      });
      f.append(lab, keep);
      out.appendChild(f);
      inp.focus();
    });
    return;
  }
  if (k === 'invoice') {
    if (it.open_url) a('Open the invoice', it.open_url, true);
    if (C.ask) b('Draft a reminder', () => {
      C.ask('Draft a short, polite payment reminder email for this, and do not send it: ' + String(it.what || '') + '. ' + String(it.why || ''));
      settle(it, 'The reminder is being drafted in the conversation on the right. Nothing is sent: you copy it or ask for changes.');
    });
    b('Already paid', (x) => paid(x, 'An invoice'));
    return;
  }
  if (k === 'bill') {
    if (it.open_url) a('Open the bill', it.open_url, true);
    b('Already paid', (x) => paid(x, 'A bill'));
    return;
  }
  const canOpen = !!(it.open_source && it.open_id);
  if (k === 'email-money' || k === 'email-question' || k === 'email-waiting') {
    if (canOpen) b(k === 'email-waiting' ? 'Draft a follow-up' : 'Draft a reply', () => openFor(it, 'reply'), true);
    if (k === 'email-money') b('Already paid', (x) => paid(x, 'Mail from ' + who));
    if (k === 'email-question') {
      b('Not mine', (x) => dismiss(it, x, [{ key: it.from_key || it.key, signal: 'dismissed', title: 'Questions from ' + who + ' (not yours)' }, { key: it.key, signal: 'dismissed', title: String(it.what || '').slice(0, 150) }],
        'Got it: questions from ' + who + ' come lower for you from now on. The email stays in the inbox; undo under What it learned from you.'));
      return;
    }
  } else if (canOpen) {
    b('Open', () => openFor(it), true);
  } else if (it.open_url) {
    a('Open in QuickBooks', it.open_url, true);
  }
  b('Not important', (x) => {
    const key = it.from_key || ('kind:' + it.kind);
    const title = it.from_key ? 'Mail from ' + who : (it.kind === 'watch' ? 'What you asked to watch' : it.kind === 'finding' ? 'Records that do not match' : 'This kind of item');
    dismiss(it, x, [{ key, signal: 'dismissed', title }, { key: it.key, signal: 'dismissed', title: String(it.what || '').slice(0, 150) }],
      'Got it: ' + (it.from_key ? 'mail from ' + who : 'items like this') + ' comes lower from now on. Nothing is hidden or changed in the inbox; undo under What it learned from you.');
  });
}

// A thought left for her: Read it shows it whole (and marks it read, which its author can see), See the original shows the
// speaker's own words, Reply with a thoughtgram leaves one back (seat every-voice, decision 1025).
function thoughtActions(it, row, said) {
  const read = mk('button', 'go', 'Read it');
  read.type = 'button';
  read.addEventListener('click', () => {
    said.textContent = String(it.text || it.why || '');
    read.remove();
    C.sb.rpc('thought_mark_read', { p_ids: [it.thought_id] }).then(() => {}, () => {});
  });
  row.appendChild(read);
  if (it.translated) {
    let orig = null;
    const o = mk('button', 'go ghost', 'See the original');
    o.type = 'button';
    o.addEventListener('click', () => {
      if (orig) { orig.remove(); orig = null; o.textContent = 'See the original'; return; }
      orig = mk('p', 'mailx-att-why thought-original', String(it.original || '')); orig.lang = it.lang || '';
      said.after(orig); o.textContent = 'Hide the original';
    });
    row.appendChild(o);
  }
  if (C.startThought) {
    const rp = mk('button', 'go ghost', 'Reply with a thoughtgram');
    rp.type = 'button';
    rp.addEventListener('click', () => C.startThought({ for: [String(it.from || '')] }));
    row.appendChild(rp);
  }
}

// The middle list: one line of what, one line of why, per item; the rest ranked lower one press away; the quiet lines.
function drawAttnList(list) {
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('All views', 'side'));
  head.appendChild(mk('h3', null, 'Worth your attention'));
  list.appendChild(head);
  if (!attn || attn.loading) { list.appendChild(mk('p', 'quiet working', 'Looking through your mail and books. Nothing in your mailboxes is changed.')); return; }
  if (attn.error) { list.appendChild(mk('p', 'state stalled', 'Worth your attention could not be read just now. ' + attn.error + ' This is not a claim that nothing needs you.')); return; }
  const j = attn.data;
  const items = attnItems();
  const more = attnMore();
  if (!items.length) list.appendChild(mk('p', 'quiet', 'Nothing from the last ' + (j.days || 14) + ' days needs you first.'));
  const ul = mk('ul', 'mailx-msgs mailx-att-rows');
  for (const it of items.concat(attn.more ? more : [])) {
    const li = mk('li');
    const b = mk('button', 'mailx-msg mailx-att-row' + (it.kind === 'thought' ? ' mailx-att-thought' : ''));
    b.type = 'button';
    if (pick && pick.key === it.key) b.setAttribute('aria-current', 'true');
    b.appendChild(mk('span', 'mailx-subj mailx-att-what', String(it.what || '')));
    if (it.why) b.appendChild(mk('span', 'mailx-snip mailx-att-line', String(it.why)));
    if (it.kind === 'impostor') b.classList.add('warned');
    if (attnUnseen(it)) b.classList.add('unread');
    b.addEventListener('click', () => { pick = it; open = null; markSeen('attention', 'attention', [it.key]); setView('read'); drawList(); drawRead(); });
    li.appendChild(b);
    ul.appendChild(li);
  }
  list.appendChild(ul);
  if (more.length) {
    const b = mk('button', 'go ghost', attn.more ? 'Show fewer' : 'Show ' + more.length + ' more, ranked lower');
    b.type = 'button';
    b.addEventListener('click', () => { attn.more = !attn.more; drawList(); });
    list.appendChild(b);
  }
  // Thought lines lead j.lines for the other doors (box, own AI); here the items show them, so they are skipped (seat every-voice).
  const lines = (j.lines || []).filter((x) => !String(x).startsWith('Left for you: ') && !String(x).startsWith('- ')).slice(1).filter((x) => !/^[0-9]+[.] /.test(x) && !String(x).includes(' more worth a look'));
  for (const x of lines) list.appendChild(mk('p', 'mailx-att-quiet', x));
  const learned = mk('button', 'go ghost', 'What it learned from you');
  learned.type = 'button';
  const out = mk('div', 'mailx-att-learned');
  learned.addEventListener('click', () => attnLearned(out));
  list.append(learned, out);
  list.appendChild(mk('p', 'mailx-att-quiet', `Tell the box "always show me anything from ..." or "I don't care about ...", and it keeps that as a rule.`));
}

// The right pane: the item, why it is here, what was checked, and the actions that fit it.
function drawAttnCard(read, it) {
  read.appendChild(navButton('Back to the list', 'list', ' mailx-back'));
  const card = mk('article', 'mailx-att-card' + (it.kind === 'thought' ? ' mailx-att-thought' : ''));
  card.appendChild(mk('p', 'eyebrow', it.kind === 'thought' ? 'Left for you' : it.kind === 'impostor' ? 'Pretending to be someone of your business' : 'Worth your attention'));
  card.appendChild(mk('h2', 'mailx-subject', String(it.what || '')));
  const said = mk('p', 'mailx-att-why', String(it.why || ''));
  card.appendChild(said);
  const checked = Array.isArray(it.checked) ? it.checked.join(' ') : '';
  if (checked) card.appendChild(mk('p', 'mailx-att-checked', (it.kind === 'thought' ? '' : 'What was checked: ') + checked));
  const row = mk('div', 'mailx-att-acts');
  const out = mk('div', 'mailx-att-out');
  if (it.kind === 'thought') thoughtActions(it, row, said); else actionsFor(it, row, out);
  card.append(row, out);
  const line = attn && attn.said && attn.said.get(it.key);
  if (line) { const p = mk('p', 'find-lesson'); p.setAttribute('aria-live', 'polite'); p.textContent = line; card.appendChild(p); }
  read.appendChild(card);
}

async function attnLearned(out) {
  if (out.childNodes.length) { out.innerHTML = ''; return; }
  out.appendChild(mk('p', 'quiet working', 'Reading what it learned.'));
  let rows = null, err = null;
  try { const r = await C.sb.rpc('find_learned', {}); if (r.error) err = r.error.message; else rows = r.data; } catch (e) { err = String((e && e.message) || e); }
  out.innerHTML = '';
  if (err) { out.appendChild(mk('p', 'state stalled', 'What it learned could not be read just now. ' + plainWords(err))); return; }
  if (!rows || !rows.length) { out.appendChild(mk('p', 'quiet', 'Nothing yet. It learns from what you open first, mark Not important, and tell it.')); return; }
  const ul = mk('ul', 'find-learned-list');
  for (const r of rows) {
    const li = mk('li');
    const rm = mk('button', 'go ghost', 'Forget this');
    rm.type = 'button';
    rm.addEventListener('click', async () => {
      rm.disabled = true;
      let ok = false;
      try { const x = await C.sb.rpc('find_learned_remove', { p_id: r.id }); ok = !x.error && x.data && x.data.ok === true; } catch (_) { ok = false; }
      if (ok) { li.remove(); loadAttention(); } else { rm.disabled = false; rm.textContent = 'Not removed. Try again'; }
    });
    li.append(mk('span', null, String(r.line || '')), rm);
    ul.appendChild(li);
  }
  out.appendChild(ul);
}

// SUSPICIOUS (seat scam-view, 2026-10-28, decision 1027; Alex 2026-10-27 15:01 PT: "it should show and say these are like
// malicious things coming in that clearly can't be you ... I have to look at them sometimes and see who is this coming from ...
// a way to just put everything in spam that you agree ... Probably on the left again"). A view in the left column beside
// Worth your attention, Starred and Labels: every email the fraud check flagged, across the mailboxes she may open (scam_list,
// behind the Mail gate), each with the investigation already done in plain words. THE TOOL MOVES NOTHING ON ITS OWN. Move to
// Spam happens only on her press, through mail-send (the one path that changes a mailbox), and is undone from here for 30 days
// (Gmail empties Spam after 30). Until Google allows the Tool to move mail (gmail.modify), the buttons say so and do nothing.
// Not a scam asks one line why; by the owner it clears the warning for everyone and teaches the check, by anyone else it is hers.
// Links, pictures and attachments of a suspected email are never live here: "Show the original anyway" is a second press and
// shows its words as plain text. SUPERSEDES, for the owner, the impostor item in Worth your attention and the six findings
// raised in the conversation (seat fraud-watch): the brain removed both the same day; a reader keeps the item, with the warning
// in her language.
let scam = null;            // { loading } | { data, ready: Map|null, readyWhy, said: Map } | { error }
let scamPick = null;        // the suspected email open in the right pane
let scamBusy = null;        // a line while a press is being carried out, next to the button
const SEND = '/functions/v1/mail-send';
async function mailSend(body) {
  const { data } = await C.sb.auth.getSession();
  const jwt = data && data.session && data.session.access_token;
  if (!jwt) throw new Error('You are not signed in on this browser, so there is nobody to act as.');
  const r = await fetch(C.url + SEND, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  if (!j) throw new Error('No answer came back.');
  return j;
}
function scamItems() { return scam && scam.data ? scam.data.items || [] : []; }
function scamCount() { return scam && scam.data ? scamItems().length : null; }
async function loadScams() {
  const keep = scam && scam.ready ? { ready: scam.ready, readyWhy: scam.readyWhy } : null;
  scam = { loading: true };
  if (parts && view && view.kind === 'suspicious') drawList();
  try {
    const { data, error } = await C.sb.rpc('scam_list');
    if (error || !data || data.ok === false) throw new Error((error && error.message) || (data && data.reason) || '');
    scam = { data, ready: keep ? keep.ready : null, readyWhy: keep ? keep.readyWhy : null, said: new Map() };
  } catch (e) {
    scam = { error: plainWords(String((e && e.message) || e || '')) };
  }
  if (scamPick && scam.data) scamPick = scamItems().find((x) => x.id === scamPick.id) || null;
  if (parts) { drawSide(); if (view && view.kind === 'suspicious') { drawList(); drawRead(); } }
  if (scam.data && !scam.ready && scamItems().length) askReady();
}
// May the Tool move mail in these mailboxes? Asked of Google through mail-send; nothing is changed by asking.
async function askReady() {
  const keys = [...new Set(scamItems().map((x) => x.source))];
  try {
    const j = await mailSend({ action: 'spam_ready', source_keys: keys });
    if (!scam || !scam.data) return;
    scam.ready = new Map(Object.entries((j && j.ready) || {}));
    scam.readyWhy = j && j.reason ? plainWords(String(j.reason)) : null;
  } catch (e) {
    if (!scam || !scam.data) return;
    scam.ready = new Map();
    scam.readyWhy = 'Whether the Tool may move mail could not be checked just now. ' + plainWords(String((e && e.message) || e || ''));
  }
  if (parts && view && view.kind === 'suspicious') { drawList(); drawRead(); }
}
const cap = (x) => { const t = String(x || ''); return t ? t[0].toUpperCase() + t.slice(1) : t; };
function canMove(it) { return !!(scam && scam.ready && scam.ready.get(it.source) === true); }
function permissionLine() {
  return cap(scam && scam.readyWhy) || 'The Tool is not yet allowed to move mail in this mailbox. The owner gives that permission once, in Google’s admin console.';
}
async function moveToSpam(items, btn, where) {
  const ids = items.map((x) => x.id);
  if (!ids.length) return;
  btn.disabled = true;
  scamBusy = ids.length === 1 ? 'Moving it to Spam in Gmail.' : 'Moving ' + ids.length + ' emails to Spam in Gmail.';
  where.textContent = scamBusy;
  where.className = 'working';
  let j = null, err = null;
  try { j = await mailSend({ action: 'spam', flag_ids: ids }); } catch (e) { err = plainWords(String((e && e.message) || e || '')); }
  scamBusy = null;
  const moved = j ? Number(j.moved || 0) : 0;
  const line = err ? 'Nothing was moved. ' + err
    : moved === ids.length ? (moved === 1 ? 'Moved to Spam in Gmail. Undo it below, under Moved to Spam, for 30 days.' : 'Moved ' + moved + ' emails to Spam in Gmail. Undo any of them below, under Moved to Spam, for 30 days.')
    : (moved ? 'Moved ' + moved + ' of ' + ids.length + ' to Spam. ' : 'Nothing was moved. ') + cap(plainWords(String((j && j.reason) || '')));
  if (scam && scam.said) scam.said.set('list', line);
  scamPick = null;
  setView('list');
  await loadScams();
  if (scam && scam.said) scam.said.set('list', line);
  if (parts) { drawList(); drawRead(); }
}
async function undoMove(row, btn, out) {
  btn.disabled = true;
  out.textContent = 'Putting it back in Gmail.'; out.className = 'working';
  let j = null, err = null;
  try { j = await mailSend({ action: 'spam_undo', action_ids: [row.action_id] }); } catch (e) { err = plainWords(String((e && e.message) || e || '')); }
  const ok = j && Number(j.restored || 0) === 1;
  const line = ok ? 'Put back where it was in Gmail. It is in Caught again.' : 'It was not put back. ' + cap(err || plainWords(String((j && j.reason) || '')));
  await loadScams();
  if (scam && scam.said) scam.said.set('list', line);
  if (parts) drawList();
}
function notScam(it, out) {
  out.innerHTML = '';
  const f = mk('div', 'mailx-att-why-box');
  const lab = mk('label', null, 'In one line, why is it not a scam?');
  const inp = mk('input', 'mailx-att-input'); inp.type = 'text'; inp.maxLength = 280;
  lab.appendChild(inp);
  const keep = mk('button', 'go', 'Keep');
  keep.type = 'button';
  const said = mk('p', 'find-lesson'); said.setAttribute('aria-live', 'polite');
  keep.addEventListener('click', async () => {
    const why = inp.value.trim();
    if (!why) { inp.focus(); return; }
    keep.disabled = true;
    let r = null;
    try { const x = await C.sb.rpc('scam_not_scam', { p_flag: it.id, p_why: why }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
    if (!r || r.ok !== true) { keep.disabled = false; said.textContent = 'Not kept. ' + plainWords(String((r && r.reason) || '')); return; }
    scamPick = null;
    setView('list');
    await loadScams();
    if (scam && scam.said) scam.said.set('list', String(r.line || 'Kept.'));
    warns.clear();
    if (parts) { drawList(); drawRead(); }
  });
  f.append(lab, keep, said);
  out.appendChild(f);
  inp.focus();
}
async function undoNotScam(row, btn, out) {
  btn.disabled = true;
  let r = null;
  try { const x = await C.sb.rpc('scam_not_scam_undo', { p_action: row.action_id }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  if (!r || r.ok !== true) { btn.disabled = false; out.textContent = 'Not undone. ' + plainWords(String((r && r.reason) || '')); return; }
  await loadScams();
  if (scam && scam.said) scam.said.set('list', String(r.line || 'Undone.'));
  warns.clear();
  if (parts) drawList();
}
function scamWho(it) { return it.pretends ? 'Pretends to be ' + it.pretends : 'Pretends to be someone you pay'; }

function drawScamList(list) {
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('All views', 'side'));
  head.appendChild(mk('h3', null, 'Caught'));
  list.appendChild(head);
  if (!scam || scam.loading) { list.appendChild(mk('p', 'quiet working', 'Reading what the check found. Nothing in your mailboxes is changed.')); return; }
  if (scam.error) { list.appendChild(mk('p', 'state stalled', 'What the scam check caught could not be read just now. ' + scam.error + ' This is not a claim that there are none.')); return; }
  const j = scam.data;
  const items = scamItems();
  const said = scam.said && scam.said.get('list');
  if (said) { const p = mk('p', 'find-lesson'); p.setAttribute('aria-live', 'polite'); p.textContent = said; list.appendChild(p); }
  if (!items.length) list.appendChild(mk('p', 'quiet', 'Nothing caught in the mailboxes you can open. The Tool checks every email as it arrives.'));
  else {
    list.appendChild(mk('p', 'mailx-att-quiet', items.length + (items.length === 1 ? ' email pretends' : ' emails pretend') + ' to be someone, or press for a payment to someone new. Each one below says who really sent it. The Tool moved and changed nothing.'));
    if (items[0].warn) list.appendChild(mk('p', 'mailx-warning-line', String(items[0].warn)));
    // The red Gmail label (seat mail-inbox, decision 1033 item 3): put on by the Tool on arrival, once Google allows it.
    const lab = j.labels || {};
    list.appendChild(mk('p', 'mailx-att-quiet', Number(lab.waiting_permission || 0) > 0
      ? 'The red Suspected scam label in Gmail is waiting for your permission: the Tool may not change labels yet, so these emails look ordinary in Gmail. The owner gives that permission once, in Google’s admin console.'
      : 'Each one carries the red Suspected scam label in Gmail, so it stands out there too.'));
    const row = mk('div', 'mailx-att-acts');
    const out = mk('p', 'quiet');
    out.setAttribute('aria-live', 'polite');
    const movable = items.filter(canMove);
    const all = mk('button', 'go', items.length === 1 ? 'Move it to Spam' : 'Move all ' + items.length + ' shown to Spam');
    all.type = 'button';
    if (!scam.ready) { all.disabled = true; out.textContent = 'Checking whether the Tool may move mail.'; out.className = 'working'; }
    else if (movable.length < items.length) { all.disabled = true; all.textContent = 'Move to Spam: needs your permission'; out.textContent = permissionLine(); }
    all.addEventListener('click', () => moveToSpam(movable, all, out));
    row.appendChild(all);
    list.append(row, out);
  }
  const ul = mk('ul', 'mailx-msgs mailx-att-rows');
  for (const it of items) {
    const li = mk('li');
    const b = mk('button', 'mailx-msg mailx-att-row warned' + (scamUnseen(it) ? ' unread' : ''));
    b.type = 'button';
    if (scamPick && scamPick.id === it.id) b.setAttribute('aria-current', 'true');
    const r1 = mk('div', 'mailx-r1');
    r1.appendChild(mk('span', 'mailx-from', scamWho(it)));
    r1.appendChild(mk('span', 'mailx-when', when(it.at)));
    b.appendChild(r1);
    b.appendChild(mk('span', 'mailx-subj mailx-att-what', 'Really from ' + String(it.from_email || '')));
    b.appendChild(mk('span', 'mailx-snip mailx-att-line', String(it.subject || '') + ' · ' + String(it.mailbox || '')));
    b.addEventListener('click', () => { scamPick = it; open = null; markSeen('scam', it.source, [it.id]); setView('read'); drawList(); drawRead(); });
    li.appendChild(b);
    ul.appendChild(li);
  }
  list.appendChild(ul);
  const moved = j.moved || [];
  if (moved.length) {
    list.appendChild(mk('h4', 'mailx-domain', 'Moved to Spam (' + moved.length + ')'));
    const mu = mk('ul', 'mailx-scam-done');
    for (const m of moved) {
      const li = mk('li');
      li.appendChild(mk('span', null, String(m.subject || '') + ', really from ' + String(m.from_email || '') + '. Undo until ' + fmtDate(new Date(m.undo_until), 'short') + '.'));
      const u = mk('button', 'go ghost', 'Undo'); u.type = 'button';
      const o = mk('span', 'quiet'); o.setAttribute('aria-live', 'polite');
      u.addEventListener('click', () => undoMove(m, u, o));
      li.append(u, o);
      mu.appendChild(li);
    }
    list.appendChild(mu);
  }
  // HANDLED (seat mail-inbox, decision 1033 item 3; Alex: "handled I like"): who took care of it, when, what was done and their
  // line. The warning stays on the email; it no longer counts in Caught; Undo puts it back.
  const done = j.handled || [];
  if (done.length) {
    list.appendChild(mk('h4', 'mailx-domain', 'Handled (' + done.length + ')'));
    const hu = mk('ul', 'mailx-scam-done');
    for (const h of done) {
      const li = mk('li');
      li.appendChild(mk('span', null, String(h.subject || '') + ', really from ' + String(h.from_email || '') + '. ' + String(h.what || 'Handled')
        + ' (' + (h.by_me ? 'you' : String(h.by || 'someone')) + ', ' + when(h.at) + ')' + (h.line ? ': ' + String(h.line) : '.')));
      const o = mk('span', 'quiet'); o.setAttribute('aria-live', 'polite');
      if (h.can_undo) { const u = mk('button', 'go ghost', 'Undo'); u.type = 'button'; u.addEventListener('click', () => undoHandled(h, u, o)); li.appendChild(u); }
      li.appendChild(o);
      hu.appendChild(li);
    }
    list.appendChild(hu);
  }
  const safe = j.not_scam || [];
  if (safe.length) {
    list.appendChild(mk('h4', 'mailx-domain', 'Not a scam (' + safe.length + ')'));
    const su = mk('ul', 'mailx-scam-done');
    for (const s of safe) {
      const li = mk('li');
      li.appendChild(mk('span', null, String(s.from_email || '') + (s.for_all ? ', for everyone' : ', for you') + (s.why ? ': ' + String(s.why) : '')));
      const o = mk('span', 'quiet'); o.setAttribute('aria-live', 'polite');
      if (s.can_undo) { const u = mk('button', 'go ghost', 'Undo'); u.type = 'button'; u.addEventListener('click', () => undoNotScam(s, u, o)); li.appendChild(u); }
      li.appendChild(o);
      su.appendChild(li);
    }
    list.appendChild(su);
  }
  if (j.note) list.appendChild(mk('p', 'mailx-att-quiet', String(j.note)));
}

// The right pane: the investigation, the warning, and the three presses.
function drawScamCard(read, it) {
  read.appendChild(navButton('Back to the list', 'list', ' mailx-back'));
  const card = mk('article', 'mailx-att-card');
  card.appendChild(mk('p', 'eyebrow', 'Caught'));
  card.appendChild(mk('h2', 'mailx-subject', String(it.subject || '')));
  card.appendChild(warnBox({ line: it.line, books: null }));
  card.appendChild(mk('p', 'eyebrow', 'What the Tool found'));
  const ul = mk('ul', 'mailx-scam-facts');
  for (const f of it.facts || []) ul.appendChild(mk('li', null, String(f)));
  card.appendChild(ul);
  if (it.books) card.appendChild(mk('p', 'mailx-att-checked', String(it.books)));
  if (it.warn) card.appendChild(mk('p', 'mailx-warning-line', String(it.warn)));
  // Whoever reads the mailbox is told in Gmail too (seat mail-inbox): the warning email and the red label, each said as it stands.
  if (it.warning_email) card.appendChild(mk('p', 'mailx-att-checked', String(it.warning_email)));
  card.appendChild(mk('p', 'mailx-att-checked', it.gmail_label === 'applied' ? 'It carries the red Suspected scam label in Gmail.'
    : 'The red Suspected scam label in Gmail is waiting for your permission to change labels.'));
  const row = mk('div', 'mailx-att-acts');
  const out = mk('div', 'mailx-att-out');
  const status = mk('p', 'quiet'); status.setAttribute('aria-live', 'polite');
  const hd = mk('button', 'go ghost', 'Handled'); hd.type = 'button';
  hd.addEventListener('click', () => handledForm(it, out));
  const mv = mk('button', 'go', 'Move to Spam'); mv.type = 'button';
  if (!scam || !scam.ready) { mv.disabled = true; status.textContent = 'Checking whether the Tool may move mail.'; status.className = 'working'; }
  else if (!canMove(it)) { mv.disabled = true; mv.textContent = 'Move to Spam: needs your permission'; status.textContent = permissionLine(); }
  mv.addEventListener('click', () => moveToSpam([it], mv, status));
  const ns = mk('button', 'go ghost', 'Not a scam'); ns.type = 'button';
  ns.addEventListener('click', () => notScam(it, out));
  const orig = mk('button', 'go ghost', 'Show the original anyway'); orig.type = 'button';
  orig.addEventListener('click', () => showOriginal(it, orig, out));
  row.append(mv, hd, ns, orig);
  card.append(row, status, out);
  read.appendChild(card);
}

// Handled: what was done (one choice) and an optional line; recorded with who and when, for everyone who can open the mailbox.
const HANDLED = [['told', 'Told the person it was sent to'], ['deleted', 'Deleted it in Gmail'], ['blocked', 'Blocked the sender in Gmail'],
  ['checked', 'Checked: nothing was opened or paid'], ['other', 'Something else']];
function handledForm(it, out) {
  out.innerHTML = '';
  const f = mk('div', 'mailx-att-why-box');
  f.appendChild(mk('p', null, 'What was done about it?'));
  const opts = mk('div', 'mailx-handled-opts');
  let what = null;
  const keep = mk('button', 'go', 'Keep'); keep.type = 'button'; keep.disabled = true;
  for (const [k, label] of HANDLED) {
    const o = mk('button', 'go ghost', label); o.type = 'button';
    o.addEventListener('click', () => { what = k; for (const x of opts.children) x.setAttribute('aria-pressed', 'false'); o.setAttribute('aria-pressed', 'true'); keep.disabled = false; });
    o.setAttribute('aria-pressed', 'false');
    opts.appendChild(o);
  }
  const lab = mk('label', null, 'A line for the others (optional)');
  const inp = mk('input', 'mailx-att-input'); inp.type = 'text'; inp.maxLength = 280;
  lab.appendChild(inp);
  const said = mk('p', 'find-lesson'); said.setAttribute('aria-live', 'polite');
  keep.addEventListener('click', async () => {
    if (!what) return;
    keep.disabled = true;
    said.className = 'working'; said.textContent = 'Keeping it.';
    let r = null;
    try { const x = await C.sb.rpc('scam_handle', { p_flag: it.id, p_what: what, p_line: inp.value.trim() || null }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
    if (!r || r.ok !== true) { keep.disabled = false; said.className = 'find-lesson'; said.textContent = 'Not kept. ' + plainWords(String((r && r.reason) || '')); return; }
    scamPick = null;
    setView('list');
    await loadScams();
    if (scam && scam.said) scam.said.set('list', String(r.line || 'Marked as handled.'));
    loadInboxView();
    if (parts) { drawList(); drawRead(); }
  });
  f.append(opts, lab, keep, said);
  out.appendChild(f);
}
async function undoHandled(h, btn, out) {
  btn.disabled = true;
  let r = null;
  try { const x = await C.sb.rpc('scam_handle_undo', { p_action: h.action_id }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  if (!r || r.ok !== true) { btn.disabled = false; out.textContent = 'Not undone. ' + plainWords(String((r && r.reason) || '')); return; }
  await loadScams();
  if (scam && scam.said) scam.said.set('list', String(r.line || 'Undone.'));
  loadInboxView();
  if (parts) drawList();
}

// THE ORIGINAL, ON A SECOND PRESS, AS WORDS ONLY: no link can be followed, no picture is loaded (loading one tells the sender
// it was opened), no attachment is offered. Read live from Gmail by the same thread read as any email (worklens-live).
function showOriginal(it, btn, out) {
  out.innerHTML = '';
  const ask = mk('div', 'mailx-att-why-box');
  ask.appendChild(mk('p', null, 'This shows the email’s words only. Its links, pictures and attachments stay switched off. Show it?'));
  const yes = mk('button', 'go ghost', 'Yes, show the words'); yes.type = 'button';
  ask.appendChild(yes);
  out.appendChild(ask);
  yes.addEventListener('click', async () => {
    yes.disabled = true;
    out.innerHTML = '';
    out.appendChild(mk('p', 'working', 'Reading it from Gmail.'));
    let t = null, err = null;
    try { t = await live('thread', { source_key: it.source, thread_id: it.source_id }); } catch (e) { err = String((e && e.message) || e || ''); }
    out.innerHTML = '';
    if (err || !t) { out.appendChild(mk('p', 'state stalled', 'The original could not be read just now. ' + plainWords(err || ''))); return; }
    const msgs = t.messages || [];
    const m = msgs.find((x) => x.id === it.source_id) || msgs[msgs.length - 1] || {};
    let text = String(m.body || '');
    if (!text && m.html) { try { text = new DOMParser().parseFromString(String(m.html), 'text/html').body.textContent || ''; } catch (_) { text = ''; } }
    const box = mk('article', 'mailx-mail mailx-scam-original');
    const r1 = mk('div', 'mailx-r1');
    r1.appendChild(mk('span', 'mailx-from', String(m.from_name || '') + ' <' + String(m.from_email || it.from_email || '') + '>'));
    r1.appendChild(mk('span', 'mailx-when', when(m.date || it.at)));
    box.appendChild(r1);
    box.appendChild(mk('div', 'mailx-text', text.trim() || '(no text)'));
    box.appendChild(mk('p', 'quiet', 'Links are shown as text and cannot be followed here. Pictures and attachments are not shown.'));
    out.appendChild(box);
  });
}

// STARRED AND LABELS: their counts from the Tool's kept marks (mail_labels, mail_starred: behind the mailbox gate).
async function loadMarks() {
  marks = { loading: true };
  try {
    // Every label, for All labels and the box's examples. The Starred count is the inbox view's now (seat mail-inbox).
    const l = await C.sb.rpc('mail_labels');
    if (l.error || !l.data || l.data.ok === false) throw new Error((l.error && l.error.message) || (l.data && l.data.reason) || '');
    marks = { labels: l.data.labels || [] };
  } catch (e) {
    marks = { error: plainWords(String((e && e.message) || e || '')) };
  }
  if (parts) drawSide();
  setBar();
}
// Gmail's own search words for a label: spaces and slashes become hyphens (Gmail's rule), lower case.
function labelQuery(name) { return 'label:' + String(name || '').toLowerCase().split('/').join('-').split(' ').join('-'); }
function readingKeys() { return [...C.mailboxes().values()].filter((m) => m.state === 'reading').map((m) => m.source_key); }
// STARRED AND A LABEL, AS THE INBOX VIEW SHOWS THEM (seat mail-inbox, decision 1033 item 1; Alex 08:49 PT: Starred "about 4,700,
// mixed across mailboxes ... oldest and newest together, including automated senders"). From what the Tool keeps
// (mail_marked_view): grouped by mailbox, newest first, the last 90 days, automated senders left out unless from the last 14 days;
// Show older lists the rest; "Search all of Gmail" is the live search it was before (findMail), for stars the Tool never kept.
// SUPERSEDES the live Gmail search as the first list (seat mail-views, 2026-10-27).
let marked = null;          // { key, loading } | { key, data, older } | { key, error }
function markedKey(v) { return v.kind === 'starred' ? 'starred' : 'label|' + v.address + '|' + v.name; }
async function loadMarked(v, older) {
  const key = markedKey(v);
  marked = { key, loading: true, older: !!older };
  if (parts) drawList();
  try {
    const args = v.kind === 'starred' ? { p_older: !!older } : { p_source: 'gmail:' + v.address, p_label: v.name, p_older: !!older };
    const { data, error } = await C.sb.rpc('mail_marked_view', args);
    if (error || !data || data.ok === false) throw new Error((error && error.message) || (data && data.reason) || '');
    if (!marked || marked.key !== key) return;
    marked = { key, data, older: !!older };
  } catch (e) {
    if (!marked || marked.key !== key) return;
    marked = { key, error: plainWords(String((e && e.message) || e || '')) };
  }
  if (parts) drawList();
}
function drawMarkedList(list) {
  const v = view;
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('All views', 'side'));
  head.appendChild(mk('h3', null, v.kind === 'starred' ? 'Starred' : v.name));
  list.appendChild(head);
  if (!marked || marked.key !== markedKey(v) || marked.loading) { list.appendChild(mk('p', 'quiet working', 'Reading what you ' + (v.kind === 'starred' ? 'starred' : 'filed under this label') + '. Nothing in Gmail is changed.')); return; }
  if (marked.error) { list.appendChild(mk('p', 'state stalled', (v.kind === 'starred' ? 'Your starred emails' : 'This label') + ' could not be read just now. ' + marked.error + ' This is not a claim that there are none.')); return; }
  const d = marked.data;
  const items = d.items || [];
  list.appendChild(mk('p', 'mailx-found-line', (marked.older ? 'All ' : '') + items.length + (items.length === 1 ? ' email' : ' emails') + (marked.older ? ' the Tool keeps' : ' from the last 90 days') + ', newest first'
    + (Number(d.unseen) ? ', ' + d.unseen + ' not yet seen by you.' : '.')));
  if (!items.length) list.appendChild(mk('p', 'quiet', marked.older ? 'Nothing kept in the Tool carries this.' : 'Nothing from the last 90 days.'));
  const by = new Map();
  for (const it of items) { const k = String(it.mailbox || ''); if (!by.has(k)) by.set(k, []); by.get(k).push(it); }
  for (const [addr, rows] of by) {
    if (v.kind === 'starred') list.appendChild(mk('h4', 'mailx-domain', addr + ' (' + rows.length + ')'));
    const ul = mk('ul', 'mailx-msgs');
    for (const r of rows) {
      const li = mk('li');
      const b = mk('button', 'mailx-msg' + (r.unseen && !seenLocally('email', r.source, r.id) ? ' unread' : ''));
      b.type = 'button';
      if (open && open.id === r.id) b.setAttribute('aria-current', 'true');
      const r1 = mk('span', 'mailx-r1');
      r1.appendChild(mk('span', 'mailx-from', String(r.from_name || r.from_email || '')));
      r1.appendChild(mk('span', 'mailx-when', when(r.date)));
      b.appendChild(r1);
      b.appendChild(mk('span', 'mailx-subj', String(r.subject || '(no subject)')));
      b.addEventListener('click', () => openThread(r.id, r.source));
      li.appendChild(b);
      ul.appendChild(li);
    }
    list.appendChild(ul);
  }
  const left = [];
  if (Number(d.left_out_automated)) left.push(d.left_out_automated + ' from automated senders older than 14 days');
  if (Number(d.older)) left.push(d.older + ' older than 90 days');
  if (left.length) list.appendChild(mk('p', 'mailx-att-quiet', 'Left out: ' + left.join(', and ') + '.'));
  const row = mk('div', 'mailx-att-acts');
  if (!marked.older && left.length) { const o = mk('button', 'go ghost', 'Show older'); o.type = 'button'; o.addEventListener('click', () => loadMarked(v, true)); row.appendChild(o); }
  if (Number(d.not_kept)) list.appendChild(mk('p', 'mailx-att-quiet', d.not_kept + ' more ' + (d.not_kept === 1 ? 'is' : 'are') + ' in Gmail but not kept in the Tool (for example set aside as junk), so they are not listed here.'));
  const g = mk('button', 'go ghost', 'Search all of Gmail'); g.type = 'button';
  g.addEventListener('click', () => {
    if (v.kind === 'starred') findMail('is:starred', readingKeys(), { title: 'Starred, everything in Gmail', view: true });
    else findMail(labelQuery(v.name), ['gmail:' + v.address], { title: v.name + ', everything in Gmail', view: true });
  });
  row.appendChild(g);
  list.appendChild(row);
}
function chooseView(v) {
  userChose = true;
  view = v; pick = null; open = null; found = null;
  if (v.kind === 'starred' || v.kind === 'label') loadMarked(v, false);
  if (v.kind === 'suspicious') { scamPick = null; if (scam && scam.said) scam.said.clear(); if (!scam || scam.error) loadScams(); }
  if (parts) { setView('list'); parts.list.scrollTop = 0; drawSide(); drawList(); drawRead(); }
}
function toMailbox(key) {
  view = { kind: 'mailbox' }; found = null; pick = null;
  const rows = [...C.mailboxes().values()];
  if (key && rows.some((m) => m.source_key === key)) { if (key !== chosen) { chosen = key; inbox = null; open = null; } }
}

const mk = (tag, cls, text) => {
  const n = C.el(tag, cls);
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
};

function when(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date();
  if (fmtDate(d) === fmtDate(now)) return fmtDate(d, 'time');
  if (fmtDate(d, 'year') === fmtDate(now, 'year')) return fmtDate(d, 'short');
  return fmtDate(d);
}

async function live(action, extra) {
  const { data } = await C.sb.auth.getSession();
  const jwt = data && data.session && data.session.access_token;
  if (!jwt) throw new Error('You are not signed in on this browser, so there is nobody to read as.');
  const r = await fetch(C.url + LIVE, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ action }, extra || {})),
  });
  const j = await r.json().catch(() => null);
  // Raw words never reach her (plain.js); a reply with nothing in it says so plainly too (seat mail-views).
  if (!r.ok || !j || j.ok === false) throw new Error(plainWords((j && j.error) || ''));
  return j;
}

// ── the frame ────────────────────────────────────────────────────────────────
// Called by lens.js on every reading. The columns are built once; a later reading
// (the doorbell, a refresh) redraws only the left column, so an open inbox and email
// keep their place.
export function drawMail(body) {
  if (!parts || !body.contains(parts.wrap)) {
    body.innerHTML = '';
    const wrap = mk('div', 'mailx');
    const side = mk('aside', 'mailx-side');
    side.setAttribute('aria-label', 'Views and mailboxes you can open');
    const list = mk('section', 'mailx-list');
    list.setAttribute('aria-label', 'The list');
    const read = mk('section', 'mailx-read');
    read.setAttribute('aria-label', 'The open item');
    read.setAttribute('aria-live', 'polite');
    wrap.append(side, list, read);
    body.append(wrap);
    parts = { wrap, side, list, read };
    // On a phone the left column is the first screen, like Gmail's menu (brief item 5); elsewhere the list.
    wrap.dataset.view = window.matchMedia('(max-width: 720px)').matches && !pendingOpen ? 'side' : 'list';
  }
  if (!view) view = pendingOpen ? { kind: 'mailbox' } : { kind: 'attention' };
  pickDefault();
  drawSide();
  drawList();
  drawRead();
  if (!attn) loadAttention();
  if (!scam) loadScams();
  if (!marks) loadMarks();
  // A missing count is shown as no count, never as zero (mail_inbox_view; it replaced mail_new here, seat mail-inbox).
  if (!iv) loadInboxView();
  flushOpen();
}

// A new reading of the brain refreshes only what comes from it here: the mailbox column with each mailbox's state
// (seat conversation-panel, round 4). The open email, the inbox page and a find are this tab's own and stay as they are.
export function mailReading() {
  if (!parts || !parts.wrap.isConnected) return;
  drawSide();
}

// The last mailbox she opened here, else her own mailbox if she can open it, else the first one that is being read.
function pickDefault() {
  const rows = [...C.mailboxes().values()];
  if (chosen && rows.some((m) => m.source_key === chosen)) return;
  const me = (C.viewer() && C.viewer().email) || '';
  const last = lastBox();
  const prior = rows.find((m) => m.source_key === last && m.state === 'reading');
  const own = rows.find((m) => m.address === me && m.state === 'reading');
  const first = rows.find((m) => m.state === 'reading');
  const choice = prior || own || first || null;
  if (choice && choice.source_key !== chosen) { chosen = choice.source_key; inbox = null; open = null; }
}

// ── left: the views, then who, then every mailbox she can open, by company ──
function viewButton(label, count, on, fn, title) {
  const b = mk('button', 'mailx-box mailx-view');
  b.type = 'button';
  if (on) b.setAttribute('aria-current', 'true');
  // The views are the Tool's own words (they follow the screen's language); a label or mailbox name never does (words.js).
  b.appendChild(mk('span', VIEW_WORDS.includes(label) ? 'mailx-addr mailx-viewname' : 'mailx-addr', label));
  if (count !== null && count !== undefined && count !== '' && Number(count) !== 0) { const n = mk('span', 'mailx-count', String(count)); if (title) n.title = title; b.appendChild(n); }
  b.addEventListener('click', fn);
  return b;
}
const VIEW_WORDS = ['Worth your attention', 'Caught', 'Starred', 'Labels', 'All labels'];
const NOT_SEEN = 'Not yet seen by you in the Tool';
// THE INBOX VIEW'S LEFT COLUMN (seat mail-inbox, decision 1033 item 1): Worth your attention as it was; Mark all as seen; Mailboxes;
// Caught (the Suspicious view renamed); Starred and Labels under "Your Gmail". Every number is not yet seen by you.
// SUPERSEDES the order of seat mail-views (Worth your attention, Suspicious, Starred, Labels above the mailboxes).
function viewList(side, rows) {
  const ul = mk('ul', 'mailx-boxes mailx-views');
  for (const r of rows) { const x = mk('li'); x.appendChild(r); ul.appendChild(x); }
  side.appendChild(ul);
  return ul;
}
function drawMarkAll(side) {
  const wrap = mk('div', 'mailx-markall');
  const b = mk('button', 'go ghost', 'Mark all as seen'); b.type = 'button';
  b.title = 'Every mailbox and view. Gmail is not changed. You can undo it for a day.';
  const out = mk('p', 'quiet'); out.setAttribute('aria-live', 'polite');
  b.addEventListener('click', () => markAll(b, out));
  wrap.appendChild(b);
  const last = markAllSaid || (iv && iv.data && iv.data.mark_all ? { line: 'You marked everything as seen ' + when(iv.data.mark_all.at) + '.', id: iv.data.mark_all.id, until: iv.data.mark_all.undo_until } : null);
  if (last) {
    out.textContent = last.line;
    if (last.id && last.until && new Date(last.until) > new Date()) {
      const u = mk('button', 'go ghost', 'Undo'); u.type = 'button';
      u.title = 'Until ' + fmtDate(new Date(last.until), 'time');
      u.addEventListener('click', () => undoMarkAll(last.id, u));
      wrap.append(out, u);
    } else wrap.appendChild(out);
  }
  side.appendChild(wrap);
}
function caughtCount() {
  if (scam && scam.data) return scamItems().filter(scamUnseen).length;
  return iv && iv.data && iv.data.caught ? Number(iv.data.caught.unseen) : null;
}
function drawLabels(side) {
  const recent = (iv && iv.data && iv.data.labels) || [];
  const wrap = mk('div', 'mailx-labels');
  const all = labelsOpen === 'all';
  if (!all) {
    if (!iv || iv.loading) wrap.appendChild(mk('p', 'quiet working', 'Reading your labels.'));
    else if (iv.error) wrap.appendChild(mk('p', 'state stalled', 'Your labels could not be read just now. ' + iv.error));
    else if (!recent.length) wrap.appendChild(mk('p', 'quiet', 'No label holds mail from the last 90 days.'));
  }
  const rows = all ? ((marks && marks.labels) || []).map((l) => ({ mailbox: l.mailbox, name: l.name, n: l.gmail_total, title: 'In Gmail under this label' }))
    : recent.map((l) => ({ mailbox: l.mailbox, name: l.name, n: l.unseen, title: NOT_SEEN }));
  if (all && marks && marks.error) wrap.appendChild(mk('p', 'state stalled', 'Your labels could not be read just now. ' + marks.error));
  const by = new Map();
  for (const l of rows) { const k = String(l.mailbox || ''); if (!by.has(k)) by.set(k, []); by.get(k).push(l); }
  for (const [addr, list] of [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    wrap.appendChild(mk('h4', 'mailx-domain', addr));
    const lu = mk('ul', 'mailx-boxes');
    for (const l of list.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)))) {
      const on = view && view.kind === 'label' && view.name === l.name && view.address === addr;
      const x = mk('li');
      x.appendChild(viewButton(String(l.name), l.n === null || l.n === undefined ? '' : l.n, on, () => chooseView({ kind: 'label', name: String(l.name), address: addr }), l.title));
      lu.appendChild(x);
    }
    wrap.appendChild(lu);
  }
  const total = iv && iv.data ? Number(iv.data.labels_all || 0) : 0;
  if (total > recent.length || all) {
    const t = mk('button', 'go ghost mailx-all-labels', all ? 'Only labels with mail from the last 90 days' : 'All labels (' + total + ')'); t.type = 'button';
    t.addEventListener('click', () => { labelsOpen = all ? true : 'all'; drawSide(); });
    wrap.appendChild(t);
  }
  side.appendChild(wrap);
}
function drawSide() {
  const side = parts.side;
  const top = side.scrollTop;
  side.innerHTML = '';
  const n = attn && attn.data ? attnUnseenCount() : null;
  viewList(side, [viewButton('Worth your attention', n === null ? '' : n, view && view.kind === 'attention', () => chooseView({ kind: 'attention' }), NOT_SEEN)]);
  drawMarkAll(side);
  drawBoxes(side);
  const sc = caughtCount();
  const cb = viewButton('Caught', sc ? sc : '', view && view.kind === 'suspicious', () => chooseView({ kind: 'suspicious' }), 'Suspected scams not yet seen by you, across the mailboxes you can open');
  if (sc) cb.classList.add('mailx-view-warn');
  viewList(side, [cb]).classList.add('mailx-caught');
  side.appendChild(mk('h3', 'mailx-domain mailx-group', 'Your Gmail'));
  const st = iv && iv.data && iv.data.starred ? Number(iv.data.starred.unseen) : null;
  const lb = viewButton('Labels', '', false, () => { labelsOpen = !labelsOpen; drawSide(); }, '');
  lb.setAttribute('aria-expanded', labelsOpen ? 'true' : 'false');
  viewList(side, [viewButton('Starred', st === null ? '' : st, view && view.kind === 'starred', () => chooseView({ kind: 'starred' }), NOT_SEEN), lb]);
  if (labelsOpen) drawLabels(side);
  if (iv && iv.error) side.appendChild(mk('p', 'state stalled', 'What you have not seen yet could not be counted just now. ' + iv.error + ' The numbers are left off rather than shown wrong.'));
  side.scrollTop = top;
}
function drawBoxes(side) {
  side.appendChild(mk('h3', 'mailx-domain mailx-group', 'Mailboxes'));
  const v = C.viewer();
  const who = mk('p', 'mailx-who');
  if (v) {
    who.appendChild(mk('b', null, v.name));
    who.appendChild(document.createTextNode(', signed in'));
  } else {
    who.textContent = C.readingState() === 'unbound' ? 'Nobody is signed in on this browser.'
      : C.readingState() === 'signedout' ? 'You are signed out.' : 'Reading who you are.';
  }
  side.appendChild(who);

  if (C.mbxError()) {
    side.appendChild(mk('p', 'state stalled', 'Your mailboxes could not be read just now, so this list is not a claim either way. ' + plainWords(C.mbxError())));
    return;
  }
  const rows = [...C.mailboxes().values()];
  if (!rows.length) {
    if (C.readingState() === null) { side.appendChild(mk('p', 'quiet working', 'Reading your mailboxes.')); return; }
    side.appendChild(mk('p', 'quiet', 'No mailbox is open to you here yet.'));
    const b = mk('button', 'go ghost', 'Connect yours in Brain');
    b.type = 'button';
    b.addEventListener('click', () => C.openConnect('email'));
    side.appendChild(b);
    return;
  }

  const byDomain = new Map();
  for (const m of rows) {
    const d = String(m.address || '').split('@')[1] || '';
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(m);
  }
  for (const [domain, list] of [...byDomain.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    side.appendChild(mk('h4', 'mailx-domain', domain));
    const ul = mk('ul', 'mailx-boxes');
    for (const m of list) {
      const li = mk('li');
      const b = mk('button', 'mailx-box');
      b.type = 'button';
      if (m.source_key === chosen && view && view.kind === 'mailbox') b.setAttribute('aria-current', 'true');
      b.appendChild(mk('span', 'mailx-addr', m.address));
      if (unread.has(m.source_key) && unread.get(m.source_key) > 0) {
        const n = mk('span', 'mailx-count', String(unread.get(m.source_key)));
        n.title = NOT_SEEN;
        b.appendChild(n);
      }
      b.addEventListener('click', () => chooseMailbox(m.source_key));
      li.appendChild(b);
      // A mailbox that is being read says nothing; one that is not says why, with the fix
      // on the same line (the Brain tab's own line, not a second wording).
      if (m.tone !== 'green') li.appendChild(C.mailboxLine(m));
      ul.appendChild(li);
    }
    side.appendChild(ul);
  }
}

// ── middle: the inbox ────────────────────────────────────────────────────────
function boxRow() { return C.mailboxes().get(chosen) || null; }

async function loadInbox(more) {
  if (!chosen) return;
  const key = chosen;
  if (!inbox || !more) inbox = { pages: [], next: null, estimate: null, error: null, loading: true, more: false };
  else inbox.more = true;
  drawList();
  try {
    const j = await live('inbox', Object.assign({ source_key: key }, more && inbox.next ? { page_token: inbox.next } : {}));
    if (key !== chosen) return;
    inbox.pages = inbox.pages.concat(j.messages || []);
    inbox.next = j.next_page_token || null;
    inbox.estimate = j.total_estimate || null;
    inbox.error = null;
    askUnseen(key, (j.messages || []).map((x) => x.id));
  } catch (e) {
    if (key !== chosen) return;
    inbox.error = String((e && e.message) || e);
  }
  inbox.loading = false; inbox.more = false;
  drawList();
}

function drawList() {
  const list = parts.list;
  list.innerHTML = '';
  if (found) { drawFound(list); return; }
  if (view && (view.kind === 'starred' || view.kind === 'label')) { drawMarkedList(list); return; }
  if (view && view.kind === 'attention') { drawAttnList(list); return; }
  if (view && view.kind === 'suspicious') { drawScamList(list); return; }
  const m = boxRow();
  if (!m) { list.appendChild(mk('p', 'quiet', 'Choose a mailbox on the left.')); return; }
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('All views', 'side'));
  head.appendChild(mk('h3', null, m.address));
  list.appendChild(head);
  if (m.state !== 'reading') {
    list.appendChild(mk('p', 'quiet', m.headline + (m.detail ? '. ' + m.detail : '')));
    return;
  }
  if (!inbox) { loadInbox(false); return; }
  if (inbox.loading && !inbox.pages.length) { list.appendChild(mk('p', 'quiet working', 'Reading this inbox from Gmail.')); return; }
  if (inbox.error && !inbox.pages.length) {
    list.appendChild(mk('p', 'state stalled', 'This inbox could not be opened. ' + inbox.error));
    return;
  }
  const n = inbox.pages.length;
  head.appendChild(mk('span', 'quiet', n + (inbox.estimate ? ' of about ' + inbox.estimate : '') + ', read live from Gmail'));
  if (!n) { list.appendChild(mk('p', 'quiet', 'Nothing in this inbox right now.')); return; }

  askWarnings(inbox.pages.map((x) => [chosen, x.id]));
  if (warnsError) list.appendChild(mk('p', 'state stalled', warnsError));
  const ul = mk('ul', 'mailx-msgs');
  for (const x of inbox.pages) {
    const li = mk('li');
    // Bold means not yet seen by her in the Tool (mail_seen_state), not Gmail's unread (seat mail-inbox).
    const u = unseenIds.get(chosen);
    const b = mk('button', 'mailx-msg' + (u && u.has(String(x.id)) && !seenLocally('email', chosen, x.id) ? ' unread' : ''));
    b.type = 'button';
    if (open && open.id === x.thread_id) b.setAttribute('aria-current', 'true');
    const r1 = mk('span', 'mailx-r1');
    if (x.details_unavailable) {
      r1.appendChild(mk('span', 'mailx-from', 'Sender and subject could not be loaded'));
    } else {
      r1.appendChild(mk('span', 'mailx-from', x.from_name || x.from_email || ''));
      r1.appendChild(mk('span', 'mailx-when', when(x.date)));
    }
    b.appendChild(r1);
    if (!x.details_unavailable) {
      b.appendChild(mk('span', 'mailx-subj', x.subject || '(no subject)'));
      if (x.snippet) b.appendChild(mk('span', 'mailx-snip', String(x.snippet).slice(0, 140)));
    }
    const xw = warnFor(chosen, [x.id]);
    if (xw) warnTag(b, xw);
    b.addEventListener('click', () => openThread(x.thread_id));
    li.appendChild(b);
    ul.appendChild(li);
  }
  list.appendChild(ul);
  if (inbox.error) list.appendChild(mk('p', 'state stalled', 'The next page could not be read. ' + inbox.error));
  if (inbox.next) {
    const more = mk('button', 'go ghost', inbox.more ? 'Reading more' : 'More mail');
    more.type = 'button';
    more.disabled = inbox.more;
    more.addEventListener('click', () => loadInbox(true));
    list.appendChild(more);
  } else {
    list.appendChild(mk('p', 'quiet', 'That is the whole inbox.'));
  }
}

// ── right: the open email ────────────────────────────────────────────────────
async function openThread(threadId, from) {
  // An email from a find may sit in another mailbox: open it there, and keep the find on screen.
  if (from && from !== chosen) { chosen = from; inbox = null; drawSide(); }
  const key = chosen;
  open = { id: threadId, thread: null, related: 'loading', error: null, full: false };
  setView('read'); parts.read.scrollTop = 0;
  drawList(); drawRead();
  try {
    const t = await live('thread', { source_key: key, thread_id: threadId });
    if (!open || open.id !== threadId) return;
    open.thread = t; drawRead();
    markSeen('email', key, (t.messages || []).map((m) => m.id).concat([threadId]));   // opened: seen, for her (seat mail-inbox)
    restoreKept(key, t);
    // Opened from Worth your attention with Draft a reply: the reply starts here (a draft; nothing is sent by itself).
    if (afterOpen === 'reply') { afterOpen = null; convoFor(t, true).start('reply'); drawRead(); }
    // THE THREAD'S OWN ID, NOT THE ONE WE WERE GIVEN (seat mail-views, 2026-10-27). An email opened from an answer or from Worth
    // your attention arrives by its MESSAGE id; the thread read finds its thread (worklens-live liveThread), but the related
    // read does not, so asking it with the message id came back "gmail thread <id>: 404" on every email that was not the first
    // of its thread. That was the raw error on Alex's screen; nothing had been deleted.
    const r = await live('related', { source_key: key, thread_id: t.thread_id || threadId });
    if (!open || open.id !== threadId) return;
    open.related = r;
  } catch (e) {
    if (!open || open.id !== threadId) return;
    if (!open.thread) open.error = String((e && e.message) || e);
    else open.related = { error: String((e && e.message) || e) };
  }
  drawRead();
}

// What the rest of the mail and the documents add that this email alone did not show.
// Composed only from what came back; it never claims a connection it was not handed.
function didntKnow(t, r) {
  const mail = (r && r.mail && r.mail.threads) || [];
  const docs = (r && r.documents && r.documents.docs) || [];
  // A NOTIFICATION (worklens-live notice: an applicant from a job board, an invoice, a sign-in
  // notice, an invitation) comes from a machine, so "earlier conversations with" its sender says
  // nothing. What matters is what else carries the same subject: for an applicant notification,
  // the other applications to the same job. worklens-live searches by subject only for these.
  if (t.notice) {
    const same = mail.filter((x) => x.why === 'same subject');
    const lead = same[0];
    const m = same.length
      ? (same.length >= RELATED_CAP ? 'At least ' : '') + same.length + ' other email' + (same.length === 1 ? '' : 's') + ' in this mailbox carr' + (same.length === 1 ? 'ies' : 'y')
        + ' the same subject, the latest from ' + (lead.from_name || lead.from_email || 'someone') + ', ' + when(lead.date) + '.'
      : 'Nothing else in this mailbox carries this subject.';
    const d = docs.length ? ' Your files hold ' + docs.length + ' document' + (docs.length === 1 ? '' : 's') + ' that match it, starting with ' + (docs[0].name || 'one without a name') + '.' : '';
    return m + d;
  }
  const who = (r && r.anchor && r.anchor.from_email) || 'this correspondent';
  const nThreads = mail.length + ' earlier conversation' + (mail.length === 1 ? '' : 's');
  const nDocs = docs.length + ' document' + (docs.length === 1 ? '' : 's');
  if (docs.length && mail.length) return 'This connects to ' + nDocs + ' in your files, starting with ' + (docs[0].name || 'one without a name') + ', and to ' + nThreads + ' with ' + who + '.';
  if (docs.length) return 'Your files hold ' + nDocs + ' that match this, starting with ' + (docs[0].name || 'one without a name') + ', which the email alone would not have shown you.';
  if (mail.length) return 'This is not the first time: there ' + (mail.length === 1 ? 'is ' : 'are ') + nThreads + ' with ' + who + ' that belong with it.';
  return 'This one stands alone: nothing else in this mailbox or your files connects to it.';
}

function whereItStands(t) {
  const msgs = t.messages || [];
  const last = msgs[msgs.length - 1];
  if (msgs.length <= 1) return 'A single message, no reply yet.';
  return msgs.length + ' messages; the last was from ' + ((last && (last.from_name || last.from_email)) || 'someone') + ', ' + when(last && last.date) + '.';
}

function drawRead() {
  const read = parts.read;
  read.innerHTML = '';
  setBar();
  if (!open && pick && view && view.kind === 'attention') { drawAttnCard(read, pick); return; }
  if (!open && view && view.kind === 'suspicious') {
    if (scamPick) drawScamCard(read, scamPick); else read.appendChild(mk('p', 'quiet', 'Choose one to see who really sent it and what you can do.'));
    return;
  }
  if (!open) {
    read.appendChild(mk('p', 'quiet', view && view.kind === 'attention' ? 'Choose an item to see why it is here and what you can do.' : 'Choose an email to read it here.'));
    return;
  }
  read.appendChild(navButton('Back to the list', 'list', ' mailx-back'));
  if (pick && view && view.kind === 'attention') {
    const back = mk('button', 'mailx-toggle', 'Back to why it is here');
    back.type = 'button';
    back.addEventListener('click', () => { open = null; drawRead(); });
    read.appendChild(back);
  }
  if (open.error) { read.appendChild(mk('p', 'state stalled', 'This email could not be opened. ' + open.error)); return; }
  const t = open.thread;
  if (!t) { read.appendChild(mk('p', 'quiet working', 'Opening it.')); return; }

  const head = mk('div', 'mailx-head');
  head.appendChild(mk('h2', 'mailx-subject', t.subject || '(no subject)'));
  if (t.gmail_url) {
    const a = mk('a', 'quiet', 'Open in Gmail');
    a.href = t.gmail_url; a.target = '_blank'; a.rel = 'noopener';
    head.appendChild(a);
  }
  read.appendChild(head);
  // The warning goes above everything else about the email, for anyone who can open this mailbox.
  const tIds = (t.messages || []).map((m) => m.id).concat([t.thread_id]);
  askWarnings(tIds.map((id) => [chosen, id]));
  const tw = warnFor(chosen, tIds);
  if (tw) read.appendChild(warnBox(tw));

  const r = open.related;
  // A NEWSLETTER IS SAID ONCE (Alex, 2026-10-07: thirteen earlier issues listed under "Belongs
  // with it" is noise, not knowledge). worklens-live flags the thread as bulk when every
  // message in it carries List-Unsubscribe and is not a notification (its noticeOf(): applicants
  // from job boards, invoices, receipts, sign-in and security notices, invitations are shown as
  // person mail is; Alex 2026-10-07). Then one line replaces what you didn't know, where it
  // stands, and the list below.
  if (t.bulk) {
    read.appendChild(mk('p', 'mailx-bulk', newsletterLine(t, r)));
  } else {
    const know = mk('div', 'mailx-know');
    know.appendChild(mk('p', 'eyebrow', 'What you didn’t know'));
    if (r === 'loading') know.appendChild(mk('p', 'quiet', 'Pulling the rest of the story together.'));
    else if (r && r.error) know.appendChild(mk('p', 'state stalled', 'What connects to this email could not be put together just now. ' + r.error));
    else know.appendChild(mk('p', null, didntKnow(t, r)));
    read.appendChild(know);

    const stands = mk('div', 'mailx-stands');
    stands.appendChild(mk('p', 'eyebrow', 'Where this stands'));
    stands.appendChild(mk('p', null, whereItStands(t)));
    read.appendChild(stands);
  }

  read.appendChild(actions(t));

  const conv = convos.get(aboutKey(chosen, t.thread_id)) || null;
  if (open.keptError) read.appendChild(mk('p', 'quiet', open.keptError));
  // WHILE SHE TALKS ABOUT IT, THE EMAIL FOLDS to who sent it and its first lines, one click to
  // unfold (Alex 2026-10-07: the email frame felt boxed in, and the conversation belongs with it).
  if (conv && conv.count() && !open.unfold) {
    const m = (t.messages || [])[(t.messages || []).length - 1] || {};
    const box = mk('article', 'mailx-mail mailx-folded');
    const mh = mk('div', 'mailx-r1');
    mh.appendChild(mk('span', 'mailx-from', m.from_name || m.from_email || ''));
    mh.appendChild(mk('span', 'mailx-when', when(m.date)));
    box.appendChild(mh);
    box.appendChild(mk('p', 'mailx-first', String(m.body || '').split(NL).filter((l) => l.trim()).slice(0, 4).join(' ').slice(0, 320)));
    const un = mk('button', 'mailx-toggle', 'Show the whole email');
    un.type = 'button';
    un.addEventListener('click', () => { open.unfold = true; drawRead(); });
    box.appendChild(un);
    read.appendChild(box);
    read.appendChild(conv.el);
    return;
  }
  if (conv && conv.count()) {
    const fold = mk('button', 'mailx-toggle', 'Fold the email');
    fold.type = 'button';
    fold.addEventListener('click', () => { open.unfold = false; drawRead(); });
    read.appendChild(fold);
  }

  // The newest message, with the earlier ones one click away.
  const msgs = t.messages || [];
  const show = open.full ? msgs : msgs.slice(-1);
  const hidden = msgs.length - show.length;
  if (msgs.length > 1) {
    const tg = mk('button', 'mailx-toggle', hidden > 0 ? 'Show ' + hidden + ' earlier message' + (hidden === 1 ? '' : 's') : 'Show only the latest');
    tg.type = 'button';
    tg.addEventListener('click', () => { open.full = !open.full; drawRead(); });
    read.appendChild(tg);
  }
  for (const m of show) {
    const box = mk('article', 'mailx-mail');
    const mh = mk('div', 'mailx-r1');
    mh.appendChild(mk('span', 'mailx-from', m.from_name || m.from_email || ''));
    mh.appendChild(mk('span', 'mailx-when', when(m.date)));
    box.appendChild(mh);
    if (m.to) box.appendChild(mk('p', 'quiet', 'to ' + m.to));
    box.appendChild(messageContent(m));
    read.appendChild(box);
  }
  if (conv) read.appendChild(conv.el);

  // What the related read found, each openable where it lives.
  if (!t.bulk && r && r !== 'loading' && !r.error) {
    const mail = (r.mail && r.mail.threads) || [];
    const docs = (r.documents && r.documents.docs) || [];
    if (mail.length || docs.length) {
      const rel = mk('div', 'mailx-rel');
      rel.appendChild(mk('p', 'eyebrow', 'Belongs with it'));
      const ul = mk('ul');
      for (const x of mail) {
        const li = mk('li');
        const b = mk('button', 'mailx-link', (x.subject || '(no subject)') + ' · ' + (x.from_name || x.from_email || '') + ', ' + when(x.date));
        b.type = 'button';
        b.addEventListener('click', () => openThread(x.thread_id));
        li.appendChild(b);
        ul.appendChild(li);
      }
      for (const d of docs) {
        const li = mk('li');
        const a = mk('a', 'mailx-link', d.name || 'A document without a name');
        if (d.drive_url) { a.href = d.drive_url; a.target = '_blank'; a.rel = 'noopener'; }
        li.appendChild(a);
        ul.appendChild(li);
      }
      rel.appendChild(ul);
      read.appendChild(rel);
    }
  }
}

function newsletterLine(t, r) {
  const msgs = t.messages || [];
  const last = msgs[msgs.length - 1] || {};
  const said = 'A newsletter from ' + (last.from_name || last.from_email || 'one sender');
  if (r === 'loading') return said + '.';
  if (!r || r.error) return said + '; how many earlier issues this mailbox holds could not be read just now.';
  const all = (r.mail && r.mail.threads) || [];
  const sender = String(last.from_email || '').toLowerCase();
  const n = all.filter((x) => String(x.from_email || '').toLowerCase() === sender).length;
  if (!n) return said + '; the first from them in this mailbox.';
  return said + '; ' + (all.length >= RELATED_CAP ? 'at least ' : '') + n + ' earlier issue' + (n === 1 ? '' : 's') + ' in this mailbox.';
}

// ── one message, as it was written ──────────────────────────────────────────
function messageContent(m) {
  const wrap = mk('div', 'mailx-body');
  if (m.html) { htmlMessage(wrap, m); return seeItIn(wrap, m); }
  if (m.html_too_large) wrap.appendChild(mk('p', 'quiet', 'This email is too large to show as it was laid out, so its text is shown instead.'));
  wrap.appendChild(plainMessage(m.body));
  return seeItIn(wrap, m);
}

// SEE IT IN <LANGUAGE> (seat language-and-nudge, decision 1026 item 2): the customer's own mail always shows as written.
// When the screen is in another language, one press under the email puts it in that language, marked as a translation,
// made for her then (screen-words action passage) and never kept. The original stays above, unchanged.
function seeItIn(wrap, m) {
  if (screenLang() === 'en') return wrap;
  const holder = mk('div', 'mailx-seeit');
  const b = mk('button', 'go ghost mailx-seeit-btn', 'See it in ' + screenLangName());
  b.type = 'button';
  const out = mk('div', 'mailx-seeit-out');
  out.setAttribute('aria-live', 'polite');
  b.addEventListener('click', async () => {
    b.disabled = true;
    out.innerHTML = '';
    out.appendChild(mk('p', 'working', 'Putting this email in ' + screenLangName()));
    let text = String(m.body || '');
    if (!text && m.html) { try { text = new DOMParser().parseFromString(String(m.html), 'text/html').body.textContent || ''; } catch (_) { text = ''; } }
    const { data } = await C.sb.auth.getSession();
    const jwt = data?.session?.access_token;
    const r = jwt ? await fetch(C.url + '/functions/v1/screen-words', {
      method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'passage', lang: screenLang(), text }),
    }).then((x) => x.json()).catch(() => null) : null;
    out.innerHTML = '';
    b.disabled = false;
    if (!r || r.ok !== true) { out.appendChild(mk('p', 'state stalled', String(r?.reason || 'The translation could not be made just now. The email is unchanged above.'))); return; }
    out.appendChild(mk('p', 'eyebrow', 'Translated by the Tool into ' + screenLangName() + '. The email above is the original.'));
    const t = mk('div', 'mailx-text mailx-seeit-text', r.text);
    t.lang = r.lang || '';
    out.appendChild(t);
    if (r.cut) out.appendChild(mk('p', 'quiet', 'Only the first part of a long email was translated.'));
  });
  holder.append(b, out);
  const outer = mk('div', 'mailx-body-wrap');
  outer.append(wrap, holder);
  return outer;
}

// Plain text: line breaks kept (white-space in skin.css), links clickable, and the quoted
// earlier reply folded behind one line, the way Gmail does it. Only what follows new text is
// folded; a message that is all quote is shown whole.
const RX_WROTE = /^(On|Am|El|Le) .+(wrote|schrieb|escribió|a écrit) ?:?$/i;
const RX_ORIGINAL = /^--+ ?(Original Message|Ursprüngliche Nachricht|Mensaje original)/i;
const RX_URL = new RegExp('https?://[^ ' + TAB + NL + '<>"]+', 'g');
const URL_TRAIL = ".,;:!?)]'";

function quoteStart(lines) {
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i].trim();
    const two = l + ' ' + String(lines[i + 1] || '').trim();
    if (RX_WROTE.test(l) || RX_WROTE.test(two) || RX_ORIGINAL.test(l)) return i;
    if (l.length >= 8 && /^_+$/.test(l)) return i;
  }
  let q = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (!l) continue;
    if (l.startsWith('>')) q = i; else break;
  }
  return q;
}

function linkify(node, text) {
  let at = 0;
  for (const hit of text.matchAll(RX_URL)) {
    let u = hit[0];
    while (u && URL_TRAIL.includes(u[u.length - 1])) u = u.slice(0, -1);
    node.appendChild(document.createTextNode(text.slice(at, hit.index)));
    const a = mk('a', 'mailx-url', u);
    a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer';
    node.appendChild(a);
    at = hit.index + u.length;
  }
  node.appendChild(document.createTextNode(text.slice(at)));
}

function plainMessage(text) {
  const box = mk('div', 'mailx-text');
  if (!text) { box.textContent = '(no text)'; return box; }
  const lines = String(text).split(NL);
  const cut = quoteStart(lines);
  linkify(box, (cut > 0 ? lines.slice(0, cut) : lines).join(NL).trimEnd());
  if (cut > 0) {
    const d = mk('details', 'mailx-quote');
    d.appendChild(mk('summary', null, 'Show the earlier message'));
    const q = mk('div', 'mailx-text');
    linkify(q, lines.slice(cut).join(NL));
    d.appendChild(q);
    box.appendChild(d);
  }
  return box;
}

// HTML mail, as it was sent. THE FRAME IS THE SECURITY BOUNDARY: sandbox WITHOUT allow-scripts,
// so nothing in the email runs: no script element, no onerror or onload handler, no javascript:
// link. allow-popups so a link can open in a new tab, escaping the sandbox so the site it opens
// works normally. A content policy inside the frame allows inline styles and embedded pictures
// only; remote pictures are added to it when she presses Show images. Belt and braces, before the
// frame is filled: scripts, frames, plugins, meta refresh and base are removed, and any link that
// is not http, https, mailto or tel loses its target.
// THE FRAME GROWS TO FIT THE EMAIL (decided 2026-10-07, Alex's call, carried by seat
// email-workspace): allow-same-origin is added so THIS page can measure the email's height and
// size the frame to it; there is no box inside a box. It gives the email nothing, because nothing
// in it can run: reaching this page's session or storage takes a script, and scripts stay off.
// The rule that keeps this safe is therefore one line: allow-scripts must never be added beside
// allow-same-origin, since the two together let an email remove its own sandbox. Proven the same
// day in a real browser with a planted script, an onerror handler, an onload handler and a
// javascript: link (none ran), against a control frame with scripts allowed (which did).
// SUPERSEDES seat reading's note here (fixed height, scrolling inside), which named this exact
// change as the usual practice and left it to HQ.
const SAFE_LINK = /^(https?:|mailto:|tel:|#)/i;
function prepareHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, noscript, meta, link, base, iframe, frame, frameset, object, embed, applet')
    .forEach((n) => n.remove());
  for (const el of doc.querySelectorAll('*')) {
    for (const name of ['href', 'xlink:href', 'action', 'formaction']) {
      const v = el.getAttribute(name);
      if (v !== null && !SAFE_LINK.test(v.trim())) el.removeAttribute(name);
    }
  }
  foldQuote(doc);
  const lower = html.toLowerCase();
  const remoteImg = [...doc.querySelectorAll('img, image, video, source, [background]')].some((n) => {
    const s = (n.getAttribute('src') || n.getAttribute('background') || n.getAttribute('href') || n.getAttribute('srcset') || '').trim().toLowerCase();
    return s && !s.startsWith('data:') && !s.startsWith('cid:');
  });
  const remote = remoteImg || lower.includes('url(http') || lower.includes("url('http") || lower.includes('url("http') || lower.includes('url(//');
  return { doc, remote };
}

// The earlier message in a reply, folded behind one line inside the frame (details works
// without a script). Gmail and Apple wrap it in one element; Outlook marks where it starts
// and puts it after the marker. A forward is not folded: the forwarded mail is the content.
function foldQuote(doc) {
  const q = doc.querySelector('.gmail_quote, blockquote[type="cite"], .yahoo_quoted, #divRplyFwdMsg, #appendonsend');
  if (!q || !q.parentNode) return;
  if (/forwarded message/i.test(String(q.textContent || '').slice(0, 300))) return;
  const d = doc.createElement('details');
  d.className = 'mailx-quote';
  const s = doc.createElement('summary');
  s.textContent = 'Show the earlier message';
  d.appendChild(s);
  q.parentNode.insertBefore(d, q);
  const outlook = q.id === 'divRplyFwdMsg' || q.id === 'appendonsend';
  let n = q;
  while (n) { const next = outlook ? n.nextSibling : null; d.appendChild(n); n = next; }
}

function frameDoc(doc, images) {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  const csp = "default-src 'none'; style-src 'unsafe-inline'; font-src data:; form-action 'none'; img-src data: cid:" + (images ? ' https: http:' : '');
  const style = 'html{background:' + v('--paper') + '}'
    + 'body{margin:0;padding:' + v('--frame-pad') + ';max-width:' + v('--frame-measure') + ';color:' + v('--ink-2')
    + ';font-size:' + v('--t-read') + ';line-height:' + v('--lead-read') + ';font-family:' + v('--font') + ';overflow-wrap:break-word}'
    + 'img{max-width:100%;height:auto}a{color:' + v('--act') + '}'
    + 'details.mailx-quote>summary{cursor:pointer;color:' + v('--ink-3') + ';font-size:' + v('--t-small') + ';margin:' + v('--gap') + ' 0}';
  return '<!doctype html><html><head><meta charset="utf-8">'
    + '<meta http-equiv="Content-Security-Policy" content="' + csp + '">'
    + '<base target="_blank"><style>' + style + '</style>' + doc.head.innerHTML + '</head>'
    + doc.body.outerHTML + '</html>';
}

function htmlMessage(wrap, m) {
  const prepared = prepareHtml(m.html);
  const frame = mk('iframe', 'mailx-frame');
  frame.setAttribute('sandbox', 'allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.title = 'The email as it was sent';
  const fill = () => { frame.srcdoc = frameDoc(prepared.doc, imagesShown.has(m.id)); };
  if (prepared.remote && !imagesShown.has(m.id)) {
    const line = mk('p', 'mailx-imgs', 'Pictures in this email are hidden, because loading them tells the sender you opened it. ');
    const b = mk('button', 'mailx-show', 'Show images');
    b.type = 'button';
    b.addEventListener('click', () => { imagesShown.add(m.id); line.remove(); fill(); });
    line.appendChild(b);
    wrap.appendChild(line);
  }
  fitFrame(frame);
  fill();
  wrap.appendChild(frame);
}

// The frame takes the height of what is in it, measured from this page, and again when pictures
// arrive or an earlier message is unfolded inside it. If it cannot be measured it keeps the
// height skin.css gives it and scrolls inside, which is how it looked before.
function fitFrame(frame) {
  const size = () => {
    try {
      const d = frame.contentDocument;
      if (!d || !d.body) return;
      const h = Math.ceil(Math.max(d.body.scrollHeight, d.body.getBoundingClientRect().height));
      if (h > 0) frame.style.height = h + 'px';
    } catch (_) { /* not measurable: the fallback height stands */ }
  };
  frame.addEventListener('load', () => {
    size();
    try {
      if (frame._fit) frame._fit.disconnect();
      frame._fit = new ResizeObserver(size);
      frame._fit.observe(frame.contentDocument.body);
    } catch (_) { /* no observer: the load-time size stands */ }
    for (const ms of [300, 1200, 4000]) setTimeout(size, ms);
  });
}

// Answer and Forward start the conversation about this email (answer.js): a briefing of what the
// company knows about it, then a draft when she asks, and Send as its own press. "Ask about this"
// puts her in the one Ask bar, which asks about the open email while one is open; the answer lands
// in the same conversation, with this email, and is kept in Work as a chat named after it.
// SUPERSEDED 2026-10-07 (seat email-workspace): "Ask about this" used to start a question in the Ask
// bar that was answered in the band under the columns and kept in whichever Work chat was open.
function actions(t) {
  const row = mk('div', 'mailx-acts');
  const note = mk('p', 'quiet mailx-said');
  note.setAttribute('aria-live', 'polite');
  const btn = (label, primary, fn) => {
    const b = mk('button', primary ? 'go' : 'go ghost', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    row.appendChild(b);
  };
  btn('Answer', true, () => { note.textContent = ''; convoFor(t, true).start('reply'); });
  btn('Forward', false, () => { note.textContent = ''; convoFor(t, true).start('forward'); });
  // FROM AN EMAIL (seat thoughtgram, 2026-10-25): a thought linked to this email and its topic, said or typed in the box.
  if (C.thought) btn('Add a thoughtgram', false, () => { note.textContent = ''; C.thought({ source: chosen, source_id: open && open.thread ? open.thread.thread_id : '', subject: t.subject || '' }); });
  btn('Ask about this', false, () => {
    const i = document.getElementById('ask-input');
    if (i) i.focus();
    note.textContent = 'Ask in the box at the top; the answer appears here, with this email.';
  });
  const wrap = mk('div');
  wrap.append(row, note);
  return wrap;
}

// ── the conversation about an email ─────────────────────────────────────────
function aboutKey(sourceKey, threadId) { return 'mail:' + sourceKey + ':' + threadId; }

function convoFor(t, create, keptChat) {
  const key = aboutKey(chosen, t.thread_id);
  if (convos.has(key) || !create) return convos.get(key) || null;
  const m = boxRow();
  const threadId = t.thread_id;
  const conv = conversation(C, {
    sourceKey: chosen, mailbox: (m && m.address) || chosen.split(':').slice(1).join(':'), thread: t,
    keep: { chat: keptChat || null, about: key, title: t.subject || '(no subject)' },
    // The first question folds the email; later ones leave the page as it is.
    onTurn: () => { if (open && open.id === threadId && conv.count() === 1) drawRead(); },
    onDiscard: () => { convos.delete(key); if (open && open.id === threadId) { open.unfold = false; drawRead(); } },
  });
  convos.set(key, conv);
  return conv;
}

// After a reload the page has forgotten, but Work has not: an email she talked about before shows
// its conversation again, drawn from what was kept. A failed lookup is said, never shown as none.
async function restoreKept(key, t) {
  const about = aboutKey(key, t.thread_id);
  if (convos.has(about)) return;
  try {
    const a = await C.sb.rpc('work_about', { p_about: about });
    if (a.error || !a.data || !a.data.ok) throw new Error((a.error && a.error.message) || (a.data && a.data.note) || 'no reason was given');
    if (!a.data.chat_id || convos.has(about)) return;
    const w = await C.sb.rpc('work_open', { p_chat: a.data.chat_id });
    if (w.error || !w.data || !w.data.ok) throw new Error((w.error && w.error.message) || (w.data && w.data.note) || 'no reason was given');
    if (key !== chosen || !open || open.id !== t.thread_id || convos.has(about)) return;
    convoFor(t, true, a.data.chat_id).restore(w.data.turns);
  } catch (e) {
    if (open && open.id === t.thread_id) open.keptError = 'Whether you talked about this email before could not be read just now. ' + plainWords(String((e && e.message) || e || ''));
  }
  if (open && open.id === t.thread_id) drawRead();
}

// The one box says what it will ask about, as chips (box.js drawBox): told whenever the open
// mailbox or email changes. SUPERSEDES the placeholder this function set until 2026-10-08.
function setBar() { if (C && C.scopeChanged) C.scopeChanged(); }

// What the one box needs to know about this tab (box.js): which mailbox and email are open, and the
// senders already on screen, so its examples are drawn from what she can see.
export function mailScope() {
  const m = boxRow();
  const on = !!(parts && parts.wrap.isConnected && parts.wrap.offsetParent);
  // A view she chose (Starred, a label) is a chip in the box, as a mailbox is (seat mail-views): she sees it can be typed.
  const v = on && view && (view.kind === 'starred' || view.kind === 'label') ? { kind: view.kind, name: view.name || '', address: view.address || '' } : null;
  return { key: on && view && view.kind === 'mailbox' ? chosen : null, address: (m && m.address) || '', emailOpen: on && !!(open && open.thread),
    threadKey: open && open.thread ? aboutKey(chosen, open.thread.thread_id) : null, view: v };
}

export function mailHints() {
  const msgs = (open && open.thread && open.thread.messages) || [];
  const mine = String((boxRow() && boxRow().address) || '').toLowerCase();
  const other = [...msgs].reverse().find((x) => String(x.from_email || '').toLowerCase() !== mine);
  return {
    open: other ? { from_name: other.from_name, from_email: other.from_email } : null,
    recent: ((inbox && inbox.pages) || []).filter((x) => !x.details_unavailable).slice(0, 25)
      .map((x) => ({ from_name: x.from_name, from_email: x.from_email })),
    // Real things for the box's examples (seat mail-views): her labels that hold mail, and who is on Worth your attention.
    labels: ((marks && marks.labels) || []).filter((l) => Number(l.gmail_total) > 0).map((l) => String(l.name)),
    starred: !!(iv && iv.data && iv.data.starred && Number(iv.data.starred.count) > 0),
    domains: attnItems().filter((x) => x.kind === 'email').map((x) => (String(x.what || '').split(' (')[1] || '').split(')')[0]).filter(Boolean),
  };
}

// DO, from the one box: the Answer flow on the open email. A reply is asked as said, so lens-ask
// drafts it; a forward opens the forward flow. False when no email is open.
export function doFromBox(text, verb) {
  if (!parts || !open || !open.thread) return false;
  const conv = convoFor(open.thread, true);
  setView('read');
  if (verb === 'forward') conv.start('forward'); else conv.ask(text);
  return true;
}

// -- FIND (seat one-box, 2026-10-08) --
// What she asked the one box to find, from every mailbox in keys at once: each mailbox is searched by
// worklens-live (Gmail's own search, everywhere in that mailbox) and drawn as it lands, so a slow or
// refused mailbox never holds up or hides the others; it says so on its own line. The brain's meaning
// search runs beside them and adds what the words alone missed, marked as such. Newest first.
export function findMail(text, keys, opts) {
  const o = opts || {};
  const seq = ++findSeq;
  found = { text, keys: keys.slice(), per: new Map(keys.map((k) => [k, { state: 'loading' }])),
    meaning: { state: o.view ? 'done' : 'loading', mail: [], failed: [], docs: [], docsGate: {} }, unsure: !!o.unsure, note: o.note || '',
    askInstead: o.askInstead || null, seq, title: o.title || '', view: !!o.view };
  // A find from the box leaves any view; a view (Starred, a label) is a find with a title and no meaning search (seat mail-views).
  if (!o.view) { view = { kind: 'mailbox' }; pick = null; }
  if (parts) { setView('list'); parts.list.scrollTop = 0; drawSide(); drawList(); }
  const mine = () => found && found.seq === seq;
  for (const k of keys) {
    live('search', { source_key: k, text }).then((j) => {
      if (!mine()) return;
      found.per.set(k, { state: 'done', items: (j.messages || []).map((x) => Object.assign({}, x, { source_key: k })),
        query: j.query_used || '', estimate: j.total_estimate || null, more: !!j.next_page_token });
    }).catch((e) => {
      if (!mine()) return;
      found.per.set(k, { state: 'error', error: String((e && e.message) || e) });
    }).finally(() => { if (mine() && parts) drawList(); });
  }
  if (!o.view) live('meaning', { text }).then((j) => {
    if (!mine()) return;
    found.meaning = { state: 'done', mail: j.mail || [], failed: j.mail_failed || [],
      docs: (j.documents && j.documents.docs) || [], docsGate: (j.documents && j.documents.gate) || {} };
  }).catch((e) => {
    if (!mine()) return;
    found.meaning = { state: 'error', error: String((e && e.message) || e) };
  }).finally(() => { if (mine() && parts) drawList(); });
}

export function clearFind() { found = null; if (view && view.kind !== 'attention') view = { kind: 'mailbox' }; if (parts) { drawSide(); drawList(); } }

// AN EMAIL OPENED FROM AN ANSWER (seat talk-to-the-tool, 2026-10-12). The conversation shows the emails an answer
// rests on; pressing one brings her here with that email open in its own mailbox. The id may be a message id (the
// brain keeps emails by message id): worklens-live's thread read finds the thread it belongs to. Whether she may
// open that mailbox is decided there, by the same door as the inbox, and a refusal is shown in the reading column.
// Held until the columns exist, because lens.js draws them after the tab change.
export function openEmail(sourceKey, id) {
  if (!sourceKey || !id) return;
  pendingOpen = { sourceKey, id };
  flushOpen();
}
function flushOpen() {
  if (!pendingOpen || !parts || !parts.wrap.isConnected) return;
  const p = pendingOpen;
  pendingOpen = null;
  openThread(p.id, p.sourceKey);
}

function addrOf(key) {
  const m = C.mailboxes().get(key);
  return (m && m.address) || String(key || '').split(':').slice(1).join(':');
}

function drawFound(list) {
  const f = found;
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('All views', 'side'));
  head.appendChild(mk('h3', null, f.title || 'Found'));
  // A view (Starred, a label) is left by choosing another on the left; a find has its own close.
  if (!f.view) {
    const x = mk('button', 'mailx-close', 'x');
    x.type = 'button';
    x.title = 'Back to the inbox';
    x.setAttribute('aria-label', 'Close the search and go back to the inbox');
    x.addEventListener('click', clearFind);
    head.appendChild(x);
  }
  list.appendChild(head);

  const box = mk('div', 'mailx-found');
  list.appendChild(box);
  if (!f.keys.length) {
    box.appendChild(mk('p', 'state stalled', C.readingState() === null
      ? 'Your mailboxes are still being read, so there is nowhere to search yet. Try again in a moment.'
      : 'No mailbox is open to you here, so there is nowhere to search.'));
    return;
  }

  // Every mailbox's live results, then what the meaning search adds, one row per conversation.
  const seen = new Set();
  const rows = [];
  for (const [, p] of f.per) {
    if (p.state !== 'done') continue;
    for (const it of p.items) {
      const k = it.source_key + '|' + it.thread_id;
      if (seen.has(k)) continue;
      seen.add(k); rows.push(it);
    }
  }
  let byMeaning = 0;
  if (f.meaning.state === 'done') {
    for (const it of f.meaning.mail) {
      const k = it.source_key + '|' + it.thread_id;
      if (seen.has(k)) continue;
      seen.add(k); byMeaning++;
      rows.push(Object.assign({}, it, { by_meaning: true }));
    }
  }
  rows.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const done = [...f.per.values()].filter((p) => p.state === 'done');
  const waiting = [...f.per.values()].filter((p) => p.state === 'loading').length;
  const boxes = new Set(rows.map((r) => r.source_key)).size;
  const said = rows.length + ' email' + (rows.length === 1 ? '' : 's') + (f.view ? (f.title === 'Starred' ? ' starred' : ' under this label') : ' for ' + String.fromCharCode(8220) + f.text + String.fromCharCode(8221))
    + (rows.length ? ', in ' + boxes + ' of ' + f.keys.length + ' mailbox' + (f.keys.length === 1 ? '' : 'es') : ' so far')
    + ', newest first.';
  box.appendChild(mk('p', 'mailx-found-line', said));
  const q = done.find((p) => p.query);
  if (f.view) box.appendChild(mk('p', 'quiet', 'Read live from Gmail just now. Nothing in your mailboxes is changed. Ask the box about these, for example ' + String.fromCharCode(8220) + (f.title === 'Starred' ? 'what did I star about invoices last month?' : 'what is waiting under ' + f.title + '?') + String.fromCharCode(8221) + '.'));
  else if (q) box.appendChild(mk('p', 'quiet', 'Gmail was searched for: ' + q.query + (byMeaning ? '. ' + byMeaning + ' more found by meaning in what the company has read.' : '.')));
  else if (byMeaning) box.appendChild(mk('p', 'quiet', byMeaning + ' found by meaning in what the company has read.'));
  if (f.note) box.appendChild(mk('p', 'quiet', f.note));
  if (f.unsure && f.askInstead) {
    const b = mk('button', 'go ghost mailx-instead', 'Ask this as a question instead');
    b.type = 'button';
    b.addEventListener('click', f.askInstead);
    box.appendChild(b);
  }

  // A mailbox still searching, or one that could not be searched, says so: never silently missing.
  const status = mk('ul', 'mailx-found-status');
  for (const [k, p] of f.per) {
    if (p.state === 'loading') status.appendChild(mk('li', 'quiet', addrOf(k) + ': searching'));
    else if (p.state === 'error') status.appendChild(mk('li', 'state stalled', addrOf(k) + ' could not be searched. ' + p.error));
    else if (p.more) status.appendChild(mk('li', 'quiet', addrOf(k) + ': showing the newest ' + p.items.length + (p.estimate ? ' of about ' + p.estimate : '') + '; add a word to narrow it'));
  }
  if (f.meaning.state === 'loading') status.appendChild(mk('li', 'quiet', 'Also searching by meaning'));
  else if (f.meaning.state === 'error') status.appendChild(mk('li', 'state stalled', 'The search by meaning could not run. ' + f.meaning.error));
  else for (const x of f.meaning.failed || []) status.appendChild(mk('li', 'state stalled', x.count + ' found by meaning in ' + addrOf(x.source_key) + ' could not be opened. ' + plainWords(x.error)));
  if (status.children.length) box.appendChild(status);

  if (!rows.length) {
    if (!waiting && f.meaning.state !== 'loading') box.appendChild(mk('p', 'quiet', f.view ? (f.title === 'Starred' ? 'Nothing is starred in the mailboxes you can open.' : 'Nothing in Gmail carries this label right now.') : 'Nothing found. Try fewer or different words, or a name.'));
  } else {
    askWarnings(rows.slice(0, 150).map((r) => [r.source_key, r.id]));
    if (warnsError) box.appendChild(mk('p', 'state stalled', warnsError));
    const ul = mk('ul', 'mailx-msgs');
    for (const r of rows.slice(0, 150)) {
      const li = mk('li');
      const b = mk('button', 'mailx-msg');
      b.type = 'button';
      if (open && open.id === r.thread_id && chosen === r.source_key) b.setAttribute('aria-current', 'true');
      const r1 = mk('span', 'mailx-r1');
      const who = mk('span', 'mailx-from');
      who.appendChild(mk('span', 'mailx-tag', addrOf(r.source_key)));
      who.appendChild(document.createTextNode(r.details_unavailable ? 'Sender and subject could not be loaded' : (r.from_name || r.from_email || '')));
      r1.appendChild(who);
      if (!r.details_unavailable) r1.appendChild(mk('span', 'mailx-when', when(r.date)));
      b.appendChild(r1);
      if (!r.details_unavailable) {
        b.appendChild(mk('span', 'mailx-subj', r.subject || '(no subject)'));
        if (r.snippet) b.appendChild(mk('span', 'mailx-snip', String(r.snippet).slice(0, 140)));
      }
      if (r.by_meaning) b.appendChild(mk('span', 'mailx-why', 'found by meaning'));
      const rw = warnFor(r.source_key, [r.id]);
      if (rw) warnTag(b, rw);
      b.addEventListener('click', () => openThread(r.thread_id, r.source_key));
      li.appendChild(b);
      ul.appendChild(li);
    }
    list.appendChild(ul);
  }

  // Files the company has read, when the meaning search found any she may open.
  const docs = (f.meaning.state === 'done' && f.meaning.docs) || [];
  if (docs.length) {
    const fh = mk('h4', 'mailx-files-head', 'Files');
    const fl = mk('ul', 'mailx-files');
    for (const d of docs) {
      const li = mk('li');
      const a = mk('a', null, d.name || '(untitled)');
      if (d.drive_url && /^https:/.test(d.drive_url)) { a.href = d.drive_url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      li.appendChild(a);
      fl.appendChild(li);
    }
    list.append(fh, fl);
  }
  if (f.meaning.state === 'done' && f.meaning.docsGate && f.meaning.docsGate.failed_closed) {
    list.appendChild(mk('p', 'quiet mailx-files-head', 'Files could not be checked just now, so none are shown; that is not a claim there are none.'));
  }
}

// Called by box.js for a question about the open email (the "about this email" chip): it lands with that
// email, in the reading column. Returns false when no email is open or the Mail tab is not on screen, and the
// question goes to the conversation panel instead. Mail's own conversation about no one email is retired
// (seat conversation-panel, 2026-10-12): the panel is the one place a general conversation is shown.
export function askFromMailBar(text) {
  if (!parts || !parts.wrap.isConnected || !parts.wrap.offsetParent) return false;
  if (!open || !open.thread) return false;
  const conv = convoFor(open.thread, true);
  setView('read');
  conv.ask(text);
  return true;
}

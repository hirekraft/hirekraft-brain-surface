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

import { conversation } from './answer.js?v=2026-10-07-workspace';

const LIVE = '/functions/v1/worklens-live';

let C = null;              // what lens.js hands over (initMail)
let chosen = null;         // source key of the open mailbox
let inbox = null;          // { pages, next, estimate, error, loading, more }
let open = null;           // { id, thread, related, error, full }
const unread = new Map();  // source key -> unread conversations, when Gmail says
let countsAsked = false;
let parts = null;          // the three columns once drawn
const imagesShown = new Set(); // message ids whose remote pictures she chose to load
const convos = new Map();      // 'mail:<source_key>:<thread_id>' -> the conversation about that email
let general = null;            // what she asked on Mail with no email open
let found = null;              // a find from the one box (box.js): emails from every mailbox, in the inbox column
let findSeq = 0;
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
  // Choosing a mailbox ends a find: the list column goes back to being that inbox (seat one-box).
  if (found) { found = null; if (key === chosen && parts) { setView('list'); drawList(); return; } }
  if (key === chosen) { setView('list'); return; }
  chosen = key; inbox = null; open = null;
  if (parts) { setView('list'); parts.list.scrollTop = 0; drawSide(); drawList(); drawRead(); }
}

const mk = (tag, cls, text) => {
  const n = C.el(tag, cls);
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
};

function when(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
  if (!r.ok || !j || j.ok === false) throw new Error((j && j.error) || ('the mail read came back with ' + r.status));
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
    side.setAttribute('aria-label', 'Mailboxes you can open');
    const list = mk('section', 'mailx-list');
    list.setAttribute('aria-label', 'Inbox');
    const read = mk('section', 'mailx-read');
    read.setAttribute('aria-label', 'The open email');
    read.setAttribute('aria-live', 'polite');
    wrap.append(side, list, read);
    body.appendChild(wrap);
    parts = { wrap, side, list, read };
    wrap.dataset.view = 'list';
  }
  pickDefault();
  drawSide();
  drawList();
  drawRead();
  if (!countsAsked && C.mailboxes().size) {
    countsAsked = true;
    live('counts').then((j) => {
      for (const m of j.mailboxes || []) if (m.reachable && m.unread !== null) unread.set(m.source_key, m.unread);
      drawSide();
    }).catch(() => { /* a missing count is shown as no count, never as zero */ });
  }
}

// Her own mailbox first, if she can open it; otherwise the first one that is being read.
function pickDefault() {
  const rows = [...C.mailboxes().values()];
  if (chosen && rows.some((m) => m.source_key === chosen)) return;
  const me = (C.viewer() && C.viewer().email) || '';
  const own = rows.find((m) => m.address === me && m.state === 'reading');
  const first = rows.find((m) => m.state === 'reading');
  const pick = own || first || null;
  if (pick && pick.source_key !== chosen) { chosen = pick.source_key; inbox = null; open = null; }
}

// ── left: who, then every mailbox she can open, by company ──────────────────
function drawSide() {
  const side = parts.side;
  side.innerHTML = '';
  const v = C.viewer();
  const who = mk('p', 'mailx-who');
  if (v) {
    who.appendChild(mk('b', null, v.name));
    who.appendChild(document.createTextNode(', signed in'));
  } else {
    who.textContent = C.readingState() === 'unbound' ? 'Nobody is signed in on this browser.' : 'Reading who you are.';
  }
  side.appendChild(who);

  if (C.mbxError()) {
    side.appendChild(mk('p', 'state stalled', 'Your mailboxes could not be read just now (' + C.mbxError() + '), so this list is not a claim either way.'));
    return;
  }
  const rows = [...C.mailboxes().values()];
  if (!rows.length) {
    if (C.readingState() === null) { side.appendChild(mk('p', 'quiet', 'Reading your mailboxes.')); return; }
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
    side.appendChild(mk('h3', 'mailx-domain', domain));
    const ul = mk('ul', 'mailx-boxes');
    for (const m of list) {
      const li = mk('li');
      const b = mk('button', 'mailx-box');
      b.type = 'button';
      if (m.source_key === chosen) b.setAttribute('aria-current', 'true');
      b.appendChild(mk('span', 'mailx-addr', m.address));
      if (unread.has(m.source_key) && unread.get(m.source_key) > 0) {
        b.appendChild(mk('span', 'mailx-count', String(unread.get(m.source_key))));
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
  const m = boxRow();
  if (!m) { list.appendChild(mk('p', 'quiet', 'Choose a mailbox on the left.')); return; }
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('Mailboxes', 'side'));
  head.appendChild(mk('h3', null, m.address));
  list.appendChild(head);
  if (m.state !== 'reading') {
    list.appendChild(mk('p', 'quiet', m.headline + (m.detail ? '. ' + m.detail : '')));
    return;
  }
  if (!inbox) { loadInbox(false); return; }
  if (inbox.loading && !inbox.pages.length) { list.appendChild(mk('p', 'quiet', 'Reading this inbox from Gmail.')); return; }
  if (inbox.error && !inbox.pages.length) {
    list.appendChild(mk('p', 'state stalled', 'This inbox could not be opened: ' + inbox.error));
    return;
  }
  const n = inbox.pages.length;
  head.appendChild(mk('span', 'quiet', n + (inbox.estimate ? ' of about ' + inbox.estimate : '') + ', read live from Gmail'));
  if (!n) { list.appendChild(mk('p', 'quiet', 'Nothing in this inbox right now.')); return; }

  const ul = mk('ul', 'mailx-msgs');
  for (const x of inbox.pages) {
    const li = mk('li');
    const b = mk('button', 'mailx-msg' + (x.unread ? ' unread' : ''));
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
    b.addEventListener('click', () => openThread(x.thread_id));
    li.appendChild(b);
    ul.appendChild(li);
  }
  list.appendChild(ul);
  if (inbox.error) list.appendChild(mk('p', 'state stalled', 'The next page could not be read: ' + inbox.error));
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
    restoreKept(key, t);
    const r = await live('related', { source_key: key, thread_id: threadId });
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
  if (!open) {
    read.appendChild(mk('p', 'quiet', 'Choose an email to read it here.'));
    if (general) read.appendChild(general.el);
    return;
  }
  read.appendChild(navButton('Back to the inbox', 'list', ' mailx-back'));
  if (open.error) { read.appendChild(mk('p', 'state stalled', 'This email could not be opened: ' + open.error)); return; }
  const t = open.thread;
  if (!t) { read.appendChild(mk('p', 'quiet', 'Opening it.')); return; }

  const head = mk('div', 'mailx-head');
  head.appendChild(mk('h2', 'mailx-subject', t.subject || '(no subject)'));
  if (t.gmail_url) {
    const a = mk('a', 'quiet', 'Open in Gmail');
    a.href = t.gmail_url; a.target = '_blank'; a.rel = 'noopener';
    head.appendChild(a);
  }
  read.appendChild(head);

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
    else if (r && r.error) know.appendChild(mk('p', 'state stalled', 'The rest of the story could not be put together: ' + r.error));
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
  if (m.html) { htmlMessage(wrap, m); return wrap; }
  if (m.html_too_large) wrap.appendChild(mk('p', 'quiet', 'This email is too large to show as it was laid out, so its text is shown instead.'));
  wrap.appendChild(plainMessage(m.body));
  return wrap;
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
    if (open && open.id === t.thread_id) open.keptError = 'Whether you talked about this email before could not be read just now (' + ((e && e.message) || e) + ').';
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
  return { key: on ? chosen : null, address: (m && m.address) || '', emailOpen: on && !!(open && open.thread),
    threadKey: open && open.thread ? aboutKey(chosen, open.thread.thread_id) : null };
}

export function mailHints() {
  const msgs = (open && open.thread && open.thread.messages) || [];
  const mine = String((boxRow() && boxRow().address) || '').toLowerCase();
  const other = [...msgs].reverse().find((x) => String(x.from_email || '').toLowerCase() !== mine);
  return {
    open: other ? { from_name: other.from_name, from_email: other.from_email } : null,
    recent: ((inbox && inbox.pages) || []).filter((x) => !x.details_unavailable).slice(0, 25)
      .map((x) => ({ from_name: x.from_name, from_email: x.from_email })),
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
    meaning: { state: 'loading' }, unsure: !!o.unsure, note: o.note || '', askInstead: o.askInstead || null, seq };
  if (parts) { setView('list'); parts.list.scrollTop = 0; drawList(); }
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
  live('meaning', { text }).then((j) => {
    if (!mine()) return;
    found.meaning = { state: 'done', mail: j.mail || [], failed: j.mail_failed || [],
      docs: (j.documents && j.documents.docs) || [], docsGate: (j.documents && j.documents.gate) || {} };
  }).catch((e) => {
    if (!mine()) return;
    found.meaning = { state: 'error', error: String((e && e.message) || e) };
  }).finally(() => { if (mine() && parts) drawList(); });
}

export function clearFind() { found = null; if (parts) drawList(); }

function addrOf(key) {
  const m = C.mailboxes().get(key);
  return (m && m.address) || String(key || '').split(':').slice(1).join(':');
}

function drawFound(list) {
  const f = found;
  const head = mk('div', 'mailx-head');
  head.appendChild(navButton('Mailboxes', 'side'));
  head.appendChild(mk('h3', null, 'Found'));
  const x = mk('button', 'mailx-close', 'x');
  x.type = 'button';
  x.title = 'Back to the inbox';
  x.setAttribute('aria-label', 'Close the search and go back to the inbox');
  x.addEventListener('click', clearFind);
  head.appendChild(x);
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
  const said = rows.length + ' email' + (rows.length === 1 ? '' : 's') + ' for ' + String.fromCharCode(8220) + f.text + String.fromCharCode(8221)
    + (rows.length ? ', in ' + boxes + ' of ' + f.keys.length + ' mailbox' + (f.keys.length === 1 ? '' : 'es') : ' so far')
    + ', newest first.';
  box.appendChild(mk('p', 'mailx-found-line', said));
  const q = done.find((p) => p.query);
  if (q) box.appendChild(mk('p', 'quiet', 'Gmail was searched for: ' + q.query + (byMeaning ? '. ' + byMeaning + ' more found by meaning in what the company has read.' : '.')));
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
    else if (p.state === 'error') status.appendChild(mk('li', 'state stalled', addrOf(k) + ' could not be searched: ' + p.error));
    else if (p.more) status.appendChild(mk('li', 'quiet', addrOf(k) + ': showing the newest ' + p.items.length + (p.estimate ? ' of about ' + p.estimate : '') + '; add a word to narrow it'));
  }
  if (f.meaning.state === 'loading') status.appendChild(mk('li', 'quiet', 'Also searching by meaning'));
  else if (f.meaning.state === 'error') status.appendChild(mk('li', 'state stalled', 'The search by meaning could not run: ' + f.meaning.error));
  else for (const x of f.meaning.failed || []) status.appendChild(mk('li', 'state stalled', x.count + ' found by meaning in ' + addrOf(x.source_key) + ' could not be opened: ' + x.error));
  if (status.children.length) box.appendChild(status);

  if (!rows.length) {
    if (!waiting && f.meaning.state !== 'loading') box.appendChild(mk('p', 'quiet', 'Nothing found. Try fewer or different words, or a name.'));
  } else {
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

// Called by lens.js for a question typed in the Ask bar while the Mail tab is on screen. With an
// email open the question is about it and lands with it; with none open it lands in the reading
// column. Returns false when the Mail tab is not on screen, so lens.js asks as it always has.
export function askFromMailBar(text, notAboutEmail) {
  if (!parts || !parts.wrap.isConnected || !parts.wrap.offsetParent) return false;
  // She removed the "about this email" chip: the question goes to the Mail conversation about no one
  // email, so the open email is put away to show it (seat one-box).
  if (notAboutEmail && open) { open = null; drawList(); }
  if (open && open.thread) {
    const conv = convoFor(open.thread, true);
    setView('read');
    conv.ask(text);
    return true;
  }
  if (!general) {
    general = conversation(C, {
      sourceKey: chosen, mailbox: '', thread: null, keep: { chat: null, about: null, title: null },
      onDiscard: () => { general = null; drawRead(); },
    });
  }
  if (!open) { setView('read'); drawRead(); }
  general.ask(text);
  return true;
}

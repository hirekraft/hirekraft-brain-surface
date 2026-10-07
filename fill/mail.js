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

const LIVE = '/functions/v1/worklens-live';

let C = null;              // what lens.js hands over (initMail)
let chosen = null;         // source key of the open mailbox
let inbox = null;          // { pages, next, estimate, error, loading, more }
let open = null;           // { id, thread, related, error, full }
const unread = new Map();  // source key -> unread conversations, when Gmail says
let countsAsked = false;
let parts = null;          // the three columns once drawn

export function initMail(ctx) { C = ctx; }

// The Brain tab's list and the old /mail/ address both arrive here with a mailbox in hand.
export function chooseMailbox(key) {
  if (!key || key === chosen) return;
  chosen = key; inbox = null; open = null;
  if (parts) { drawSide(); drawList(); drawRead(); }
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
  const m = boxRow();
  if (!m) { list.appendChild(mk('p', 'quiet', 'Choose a mailbox on the left.')); return; }
  const head = mk('div', 'mailx-head');
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
async function openThread(threadId) {
  const key = chosen;
  open = { id: threadId, thread: null, related: 'loading', error: null, full: false };
  drawList(); drawRead();
  try {
    const t = await live('thread', { source_key: key, thread_id: threadId });
    if (!open || open.id !== threadId) return;
    open.thread = t; drawRead();
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
  if (!open) { read.appendChild(mk('p', 'quiet', 'Choose an email to read it here.')); return; }
  if (open.error) { read.appendChild(mk('p', 'state stalled', 'This email could not be opened: ' + open.error)); return; }
  const t = open.thread;
  if (!t) { read.appendChild(mk('p', 'quiet', 'Opening it.')); return; }

  const head = mk('div', 'mailx-head');
  head.appendChild(mk('h3', null, t.subject || '(no subject)'));
  if (t.gmail_url) {
    const a = mk('a', 'quiet', 'Open in Gmail');
    a.href = t.gmail_url; a.target = '_blank'; a.rel = 'noopener';
    head.appendChild(a);
  }
  read.appendChild(head);

  const know = mk('div', 'mailx-know');
  know.appendChild(mk('p', 'eyebrow', 'What you didn’t know'));
  const r = open.related;
  if (r === 'loading') know.appendChild(mk('p', 'quiet', 'Pulling the rest of the story together.'));
  else if (r && r.error) know.appendChild(mk('p', 'state stalled', 'The rest of the story could not be put together: ' + r.error));
  else know.appendChild(mk('p', null, didntKnow(t, r)));
  read.appendChild(know);

  const stands = mk('div', 'mailx-stands');
  stands.appendChild(mk('p', 'eyebrow', 'Where this stands'));
  stands.appendChild(mk('p', null, whereItStands(t)));
  read.appendChild(stands);

  read.appendChild(actions(t));

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
    box.appendChild(mk('div', 'mailx-text', m.body || '(no text)'));
    read.appendChild(box);
  }

  // What the related read found, each openable where it lives.
  if (r && r !== 'loading' && !r.error) {
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

// Answer and Forward say plainly that the Tool reads and does not yet write. "Ask about
// this" puts a question about this email into the one Ask bar, for her to finish and send;
// the answer lands in the conversation and is kept in Work like every other question.
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
  const writeNote = (verb) => {
    note.textContent = verb + ' means writing into this mailbox, and the Tool holds permission to read it only. '
      + 'When you want that, you grant it once, deliberately, and you will see exactly what changed.';
  };
  btn('Answer', true, () => writeNote('Replying'));
  btn('Forward', false, () => writeNote('Forwarding'));
  btn('Ask about this', false, () => {
    const first = (t.messages || [])[0] || {};
    const from = first.from_name || first.from_email || 'the sender';
    C.prefillAsk('About the email "' + (t.subject || 'with no subject') + '" from ' + from + ': ');
    note.textContent = 'Your question is started in the Ask bar below. Finish it and press Ask; the answer is kept in Work.';
  });
  const wrap = mk('div');
  wrap.append(row, note);
  return wrap;
}

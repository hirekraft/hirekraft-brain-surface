// fill/thoughts.js - THINKROOMS (seat thinkrooms-a, 2026-10-29, decision 1035; the file keeps its name, the tab does not).
// A Thinkroom is a subject plus the people in it: one person is private thinking, two is a one-on-one, many is asking the team.
// A meeting that never needs scheduling, across languages and time zones. Step A, built from the approved mockup "Thinkrooms
// mockup" (Main and Phone): the list of her rooms (Open and Decided, newest activity first, a dot for something new), a room
// with its thoughts (each shown in the reader's language, the original one tap away), and the shaping composer: she types or
// speaks in any language, the Tool answers right there with how it would put it (tidied, never changed in meaning), who it is
// for, whether she is telling or asking, and the email line said truthfully; she adds it or changes it. A new Thinkroom starts
// from what is on her mind: the Tool proposes a title and who is in (chips), and she starts it or keeps it just for her.
// The box hands over "tell Erin that ...", "ask the team what they think about ...", "note for the brain: ..." by opening
// this tab with the composer filled; nothing is ever a form in the side conversation (Alex, 2026-10-29: the old card was messy).
// SUPERSEDES the Thoughts tab of seat thoughtgram (2026-10-25: Moving, Topics, Mine, For you, the read-back card in the side
// panel, the free-text For field, the email checkbox, Change topic and Merge). Topics still file a thought in the brain; she
// never sees them. Positions and the running page come in step B; decisions, minutes and the agenda in step C.
// Who sees what is decided in the brain only (rooms_view, thought_keep, chunk_permitted): a room's thoughts open to its members,
// the owner included. This file decides nothing about access. No regex literals (STANDING-CLAUSES).

import { fmtDate } from "./dates.js?v=2026-10-22-dates";
import { micFor } from "./box.js?v=2026-10-29-thinkrooms";

let C = null;   // { sb, el, $, openPanel, askBody, startThought, foundCard, findCtx, goThoughts, url, key }
let view = 'open';        // 'open' | 'decided'
let roomOpen = null;      // the room on screen, or null
let pending = null;       // { draft, heard, email, room, title } handed over by the box, an email, or Reply

const ONCE = { what: 'tool.room.said-what', why: 'tool.thought.said-why', call: 'tool.thought.said-call' };
const PREFIXES = ['note for the brain', 'notes for the brain', 'a note for the brain', 'thought for the brain', 'a thought for the brain',
  'note to the brain', 'add a thought', 'leave a thought', 'leave a thoughtgram', 'thoughtgram', 'keep this thought', 'start a thinkroom', 'new thinkroom', 'thinkroom'];
const ASKS = ['what they think', 'what she thinks', 'what he thinks', 'what everyone thinks', 'what you all think', 'their view', 'their thoughts', 'for thoughts', 'for their opinion'];

export function initThoughts(ctx) { C = ctx; }

function once(key) {
  try { if (localStorage.getItem(key)) return false; localStorage.setItem(key, String(Date.now())); return true; } catch (_) { return false; }
}
function day(iso) { return fmtDate(iso, 'day'); }
function el(tag, cls, text) { const e = C.el(tag, cls || ''); if (text !== undefined) e.textContent = text; return e; }
function own(tag, cls, text) { const e = el(tag, cls, text); e.setAttribute('translate', 'no'); return e; }   // her words, names, titles: never translated by the screen
function button(label, cls, fn) { const b = el('button', cls || 'go ghost', label); b.type = 'button'; b.addEventListener('click', fn); return b; }
async function rpc(name, args) {
  try {
    const { data, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, why: error.message };
    return data || { ok: false, why: 'No answer came back.' };
  } catch (e) { return { ok: false, why: String(e?.message || e) }; }
}
function working(host, text, slowText) {
  const w = el('p', 'working', text);
  host.appendChild(w);
  const t = setTimeout(() => { w.textContent = slowText; }, 10000);
  return () => { clearTimeout(t); w.remove(); };
}
function names(list) {
  const span = own('span', 'room-names');
  span.textContent = list.join(', ');
  return span;
}
function whoLine(members) {
  const others = (members || []).filter((m) => !m.me).map((m) => m.first || m.name);
  const p = el('p', 'room-people');
  if (!others.length) { p.appendChild(el('span', '', 'Just you')); return p; }
  p.appendChild(el('span', '', 'You, '));
  p.appendChild(names(others));
  return p;
}

// -- THE BOX HANDS OVER -------------------------------------------------------------------------------------------------
// "tell Erin that ...", "ask the team what they think about ...", "note for the brain: ...", "stop emailing me about
// Thinkrooms": true means it was for here and is handled. Anything else is a question for the box.
export function thoughtFromBox(text) {
  if (!C) return false;
  const raw = String(text || '').trim();
  const low = raw.toLowerCase();
  const em = emailWords(low);
  if (em !== null) { emailsSay(em); return true; }
  if (low.startsWith('tell ') && !low.startsWith('tell me') && !low.startsWith('tell us') && low.indexOf(' that ') > 0) { openComposer({ draft: raw, auto: true }); return true; }
  if (low.startsWith('ask ') && ASKS.some((a) => low.indexOf(a) > 0)) { openComposer({ draft: raw, auto: true }); return true; }
  const p = PREFIXES.find((x) => low.startsWith(x));
  if (!p) return false;
  const next = low.slice(p.length, p.length + 1);
  if (next && ' :,.-'.indexOf(next) < 0) return false;   // "thinkrooms are ..." is a question, not a thought
  let rest = raw.slice(p.length).trim();
  while (rest && ':,.-'.includes(rest[0])) rest = rest.slice(1).trim();
  openComposer({ draft: rest, auto: !!rest });
  return true;
}

// Open this tab with the composer: a new Thinkroom, or the room named (Reply). o: { draft, auto, heard, email, room, title };
// auto: the draft is a whole thought (said in the box), so it is shaped at once; otherwise it waits for her.
export function openComposer(o) {
  pending = Object.assign({}, o || {});
  if (pending.room) roomOpen = pending.room;
  else roomOpen = null;
  if (C && C.goThoughts) C.goThoughts(roomOpen || null);
}
// The box's thought mode and an open email both come here (seat thoughtgram's card in the side panel is retired).
export function keepThought(text, opts) { openComposer(Object.assign({}, opts || {}, { draft: String(text || ''), auto: !!String(text || '').trim() })); }
export function thoughtOnEmail(email) { openComposer({ email, draft: '' }); }

// -- THE CONSULTANT, AT THE MOMENT IT APPLIES -----------------------------------------------------------------------------
export function afterAnswer(question, body, slot) {
  if (!C || !slot) return;
  const q = String(question || '').toLowerCase().trim();
  if (!(q.startsWith('why did we') || q.startsWith('why did i') || q.startsWith('why do we') || q.startsWith('why are we'))) return;
  const cited = Array.isArray(body?.citations) ? body.citations : [];
  if (cited.some((c) => { const s = String(c?.source || c?.where || '').toLowerCase(); return s.startsWith('thought') || s.startsWith('room'); })) return;
  if (!once(ONCE.why)) return;
  slot.appendChild(el('p', 'quiet thought-teach', 'None of your own thoughts are kept on this. Next time you decide something, add why in a Thinkroom (Add a thought, under the +), and the Tool will have your reasons when this is asked again.'));
}

export async function afterCall() {
  if (!C) return;
  const r = await rpc('thought_offer_after_call', {});
  if (!r || r.ok !== true || !r.meeting) return;
  if (!once(ONCE.call + ':' + r.meeting.id)) return;
  const log = C.$('#dock-turns');
  if (!log) return;
  const t = el('div', 'turn said thought-turn');
  log.appendChild(t);
  C.openPanel();
  const p = el('p', '');
  p.append(el('span', '', 'Your meeting '), own('span', '', '"' + r.meeting.title + '"'), el('span', '', ' ended at ' + fmtDate(r.meeting.end, 'time') + '. Want to add a thought about it while it is fresh?'));
  t.appendChild(p);
  const acts = el('div', 'actions');
  acts.appendChild(button('Add a thought', 'go', () => { t.remove(); openComposer({ draft: '', title: r.meeting.title }); }));
  acts.appendChild(button('Not now', 'go ghost', () => t.remove()));
  t.appendChild(acts);
}

// -- THE TAB ---------------------------------------------------------------------------------------------------------------
export async function loadThoughts(openId) {
  if (!C) return;
  const host = C.$('#thoughts');
  if (!host) return;
  if (typeof openId === 'string' && openId.length === 36) roomOpen = openId;
  host.innerHTML = '';
  const wrap = el('div', 'room-wrap');
  const side = el('aside', 'room-side');
  const main = el('div', 'room-main');
  wrap.append(side, main);
  host.appendChild(wrap);
  const mode = () => { wrap.dataset.mode = roomOpen ? 'room' : pending ? 'new' : 'list'; };
  side.appendChild(button('New Thinkroom', 'go room-new', () => { pending = { draft: '' }; roomOpen = null; drawNew(main, wrap); wrap.dataset.mode = 'new'; markRows(side); }));
  const chips = el('div', 'room-chips');
  chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Show');
  for (const [k, label] of [['open', 'Open'], ['decided', 'Decided']]) {
    const b = button(label, 'go ghost room-chip', () => { view = k; loadThoughts(); });
    b.setAttribute('aria-pressed', String(view === k));
    chips.appendChild(b);
  }
  side.appendChild(chips);
  const list = el('ul', 'room-list');
  side.appendChild(list);
  const stop = working(list, 'Reading your Thinkrooms', 'Still reading your Thinkrooms: it is taking longer than usual');
  const r = await rpc('rooms_view', { p_view: view });
  stop();
  if (!r || r.ok !== true) { list.appendChild(el('li', 'state stalled', String(r?.why || 'Your Thinkrooms could not be read just now.'))); return; }
  drawList(list, r, main, wrap);
  if (roomOpen) await drawRoom(main, wrap, roomOpen);
  else if (pending) drawNew(main, wrap);
  else drawEmpty(main, r);
  mode();
}

function drawList(list, r, main, wrap) {
  const rooms = Array.isArray(r.rooms) ? r.rooms : [];
  if (!rooms.length) {
    list.appendChild(el('li', 'quiet room-none', view === 'decided'
      ? 'Nothing decided yet. A Thinkroom moves here once it records what you are going with; recording a decision comes next.'
      : 'No Thinkrooms yet. Press New Thinkroom, or tell the box what is on your mind.'));
    return;
  }
  for (const rm of rooms) {
    const li = el('li', '');
    const b = el('button', 'room-row');
    b.type = 'button';
    b.dataset.room = rm.id;
    if (rm.id === roomOpen) b.setAttribute('aria-current', 'true');
    const top = el('span', 'room-row-top');
    top.appendChild(own('span', 'room-row-title', rm.title));
    if (rm.unseen > 0) { const d = el('span', 'room-dot'); d.setAttribute('role', 'img'); d.setAttribute('aria-label', 'Something new'); top.appendChild(d); }
    b.appendChild(top);
    b.appendChild(whoLine(rm.members));
    const st = el('span', 'room-row-state');
    const last = rm.last;
    if (rm.unseen > 0 && last && !last.mine) { st.append(el('span', '', 'New from '), own('span', '', last.who_first || '')); }
    else if (last && last.mine) st.append(el('span', '', 'You added a thought'), el('span', '', ', ' + day(last.at)));
    else if (last) st.append(own('span', '', last.who_first || ''), el('span', '', ' added a thought'), el('span', '', ', ' + day(last.at)));
    else st.appendChild(el('span', '', 'No thoughts yet'));
    b.appendChild(st);
    b.addEventListener('click', async () => { roomOpen = rm.id; pending = null; markRows(list); wrap.dataset.mode = 'room'; await drawRoom(main, wrap, rm.id); });
    li.appendChild(b);
    list.appendChild(li);
  }
}
function markRows(scope) {
  for (const b of (scope.closest('.room-wrap') || scope).querySelectorAll('.room-row')) {
    if (b.dataset.room === roomOpen) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  }
}

function drawEmpty(main, r) {
  main.innerHTML = '';
  const box = el('section', 'room-card room-empty');
  box.appendChild(el('h3', 'room-h', 'Thinkrooms'));
  box.appendChild(el('p', '', 'A Thinkroom is a subject and the people in it. Each of you adds thoughts in your own words and language, when it suits you, and reads the others in yours. A meeting that never needs scheduling.'));
  box.appendChild(el('p', 'quiet', (r.rooms || []).length ? 'Choose a Thinkroom on the left, or start a new one.' : 'Start one with New Thinkroom: say what is on your mind, and the Tool suggests a title and who should be in it.'));
  main.appendChild(box);
}

function back(wrap) {
  const b = button('All Thinkrooms', 'go ghost room-back', () => { roomOpen = null; pending = null; wrap.dataset.mode = 'list'; markRows(wrap); });
  b.setAttribute('aria-label', 'Back to all Thinkrooms');
  return b;
}

// -- A ROOM -------------------------------------------------------------------------------------------------------------------
async function drawRoom(main, wrap, id) {
  main.innerHTML = '';
  const stop = working(main, 'Opening the Thinkroom', 'Still opening the Thinkroom: it is taking longer than usual');
  const r = await rpc('rooms_view', { p_view: view, p_room: id });
  stop();
  main.appendChild(back(wrap));
  if (!r || r.ok !== true) { main.appendChild(el('p', 'state stalled', String(r?.why || 'This Thinkroom could not be opened just now.'))); return; }
  const rm = r.room;
  const head = el('header', 'room-head');
  head.appendChild(own('h3', 'room-h', rm.title));
  const ppl = whoLine(rm.members);
  ppl.appendChild(el('span', '', rm.decided_at ? ' · Decided' : ' · Open'));
  head.appendChild(ppl);
  const av = el('div', 'room-avatars'); av.setAttribute('aria-hidden', 'true');
  for (const m of rm.members || []) av.appendChild(own('span', 'room-av' + (m.me ? ' me' : ''), String(m.first || m.name || '?').slice(0, 1).toUpperCase()));
  head.appendChild(av);
  main.appendChild(head);
  if (once(ONCE.what)) main.appendChild(el('p', 'quiet thought-teach', 'Everyone here adds thoughts in their own words and language. Each of you reads the others in your own language, with the original one tap away. Only the people in this room can see it.'));
  const sec = el('section', 'room-thoughts'); sec.setAttribute('aria-label', 'Thoughts');
  const ths = Array.isArray(r.thoughts) ? r.thoughts : [];
  if (!ths.length) sec.appendChild(el('p', 'quiet', 'No thoughts here yet. Add the first one below.'));
  for (const th of ths) sec.appendChild(thoughtCard(th, r));
  main.appendChild(sec);
  if (!rm.decided_at) main.appendChild(composer({ room: rm, wrap, main }));
  // Seen: the dot on its row goes.
  const row = wrap.querySelector('.room-row[data-room="' + id + '"] .room-dot');
  if (row) row.remove();
  if (pending && pending.room === id) { const p = pending; pending = null; const ta = main.querySelector('.room-input'); if (ta && p.draft) { ta.value = p.draft; if (p.auto) main.querySelector('.room-go')?.click(); else ta.focus(); } }
}

function thoughtCard(th, r) {
  const art = el('article', 'room-thought' + (th.mine ? ' mine' : '') + (th.state === 'retracted' ? ' retracted' : ''));
  const meta = el('p', 'room-meta');
  meta.appendChild(th.mine ? el('strong', '', 'You') : own('strong', '', th.who_first || th.who || ''));
  meta.appendChild(el('span', '', ' · ' + day(th.at)));
  if (th.heard) meta.appendChild(el('span', '', ' · spoken'));
  if (th.new) meta.appendChild(el('span', 'room-new-tag', 'New'));
  art.appendChild(meta);
  const said = own('p', 'thought-said', th.text);
  art.appendChild(said);
  for (const a of Array.isArray(th.attach) ? th.attach : []) {
    const p = el('p', 'room-attach');
    if (a.url) { const l = own('a', '', a.title || a.url); l.href = a.url; l.target = '_blank'; l.rel = 'noopener noreferrer'; p.append(el('span', '', 'Link: '), l); }
    else p.append(el('span', '', 'Document: '), own('span', '', a.title || ''));
    art.appendChild(p);
  }
  if (th.email && th.email.subject) { const p = el('p', 'quiet'); p.append(el('span', '', 'On the email: '), own('span', '', th.email.subject)); art.appendChild(p); }
  if (th.translated) {
    const row = el('p', 'room-tr');
    row.appendChild(el('span', 'quiet', 'Translated from ' + th.lang_name + ' by the Tool'));
    let orig = null;
    const b = button('See the original', 'link room-orig-btn', () => {
      if (orig) { orig.remove(); orig = null; b.textContent = 'See the original'; return; }
      orig = own('p', 'thought-said thought-original', th.original); orig.lang = th.lang || '';
      row.after(orig); b.textContent = 'Hide the original';
    });
    row.appendChild(b);
    art.appendChild(row);
  } else if (th.untranslated) art.appendChild(el('p', 'quiet', 'In ' + th.lang_name + ', not translated yet.'));
  if (th.state === 'retracted') art.appendChild(el('p', 'quiet', 'You took this back: it is out of answers and kept here.'));
  return art;
}

// -- THE COMPOSER: type or speak, the Tool shapes it, she adds it or changes it -------------------------------------------------
// o: { room?, wrap, main }. With no room it is the New Thinkroom composer.
function composer(o) {
  const inRoom = !!o.room;
  const sec = el('section', 'room-card room-compose');
  sec.setAttribute('aria-label', inRoom ? 'Add a thought' : 'New Thinkroom');
  const lab = el('label', 'room-label', inRoom ? 'Add a thought to this room' : 'Your thought');
  lab.htmlFor = 'room-input';
  sec.appendChild(lab);
  const row = el('div', 'room-row-in');
  const ta = el('textarea', 'thought-text room-input');
  ta.id = 'room-input'; ta.rows = inRoom ? 2 : 3;
  ta.placeholder = inRoom ? 'Type, or press the microphone and talk, in any language' : 'Type, or press the microphone and talk';
  const mic = el('button', 'mic room-mic');
  mic.type = 'button'; mic.id = 'room-mic';
  mic.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path></svg>';
  const go = button('Go', 'go room-go', () => shape());
  const talk = el('p', 'quiet room-hold', 'Hold to talk, in any language');
  row.append(ta, mic, talk, go);
  sec.appendChild(row);
  const said = el('p', 'onebox-mic-said'); said.id = 'room-mic-said'; said.hidden = true;
  sec.appendChild(said);
  let heard = false;
  mic.addEventListener('pointerdown', () => { heard = true; });
  mic.addEventListener('click', () => { heard = true; });
  // Attach: a link, or a text file kept as a document in her Chats.
  const attach = [];
  const attRow = el('div', 'room-attach-row');
  const chipsAt = el('div', 'room-attach-chips');
  const linkBtn = button('Add a link', 'go ghost room-small', () => { linkBox.hidden = !linkBox.hidden; if (!linkBox.hidden) linkIn.focus(); });
  const fileIn = el('input', ''); fileIn.type = 'file'; fileIn.accept = '.txt,.md,.csv,text/plain,text/markdown,text/csv'; fileIn.hidden = true;
  fileIn.setAttribute('aria-label', 'Attach a text file');
  const fileBtn = button('Attach a document', 'go ghost room-small', () => fileIn.click());
  attRow.append(linkBtn, fileBtn, fileIn);
  const linkBox = el('div', 'room-link'); linkBox.hidden = true;
  const linkIn = el('input', 'thought-newtopic'); linkIn.type = 'url'; linkIn.placeholder = 'Paste a link (https://...)'; linkIn.setAttribute('aria-label', 'A link');
  linkBox.append(linkIn, button('Add', 'go ghost room-small', () => {
    const u = linkIn.value.trim();
    if (!(u.startsWith('https://') || u.startsWith('http://'))) { attSaid.textContent = 'A link starts with https://'; return; }
    attach.push({ kind: 'link', url: u, title: u }); linkIn.value = ''; linkBox.hidden = true; drawAtt();
  }));
  const attSaid = el('p', 'quiet');
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files && fileIn.files[0];
    fileIn.value = '';
    if (!f) return;
    attSaid.textContent = '';
    if (f.size > 400000) { attSaid.textContent = 'That file is too large to attach here. Save it to your drive and add its link.'; return; }
    const stop = working(sec, 'Keeping ' + f.name + ' as a document', 'Still keeping the document');
    let text = '';
    try { text = await f.text(); } catch (_) { text = ''; }
    if (!text.trim()) { stop(); attSaid.textContent = 'Only text files can be attached here yet (.txt, .md, .csv). For a PDF or a Word file, save it to your drive and add its link.'; return; }
    const r = await chatImport({ action: 'keep', came_from: 'paste', title: f.name, exact: true, messages: [{ role: 'person', text }] });
    stop();
    if (!r || r.ok !== true) { attSaid.textContent = 'The document could not be kept just now: ' + String(r?.note || r?.reason || ''); return; }
    attach.push({ kind: 'file', id: String(r.chat_id || f.name), title: f.name });
    attSaid.textContent = 'Kept in your Chats as a document. Others in the room see its name; the document itself stays private to you until you share it there.';
    drawAtt();
  });
  function drawAtt() {
    chipsAt.innerHTML = '';
    attach.forEach((a, i) => {
      const c = el('span', 'onebox-chip');
      c.appendChild(own('span', '', a.title));
      const x = button('x', 'room-x', () => { attach.splice(i, 1); drawAtt(); }); x.setAttribute('aria-label', 'Remove');
      c.appendChild(x);
      chipsAt.appendChild(c);
    });
  }
  sec.append(attRow, linkBox, chipsAt, attSaid);
  if (!inRoom && pending && pending.email && pending.email.subject) { const p = el('p', 'quiet'); p.append(el('span', '', 'On the email: '), own('span', '', pending.email.subject)); sec.appendChild(p); }
  const email = !inRoom && pending ? pending.email || null : null;
  const out = el('div', 'room-shaped'); out.setAttribute('aria-live', 'polite');
  sec.appendChild(out);
  // The microphone: the box's own (box.js), into this box. On a touch screen it is held to talk.
  setTimeout(() => micFor({ btn: '#room-mic', input: '#room-input', said: '#room-mic-said' }), 0);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); shape(); } });

  async function shape() {
    const text = ta.value.trim();
    out.innerHTML = '';
    if (!text) { out.appendChild(el('p', 'quiet', 'Say or type your thought first.')); ta.focus(); return; }
    go.disabled = true;
    const stop = working(out, 'Reading what you said', 'Still reading what you said: it is taking longer than usual');
    const r = await C.askBody({ shape: { text, heard, room: inRoom ? o.room.id : null } });
    stop(); go.disabled = false;
    if (!r || r.ok !== true || r.state !== 'shaped') { out.appendChild(el('p', 'state stalled', String(r?.why || r?.error || 'Your thought could not be read just now.') + ' Your words are still here.')); return; }
    if (inRoom) shapedInRoom(r); else shapedNew(r);
  }
  function lineFor(people, send) {
    const p = el('p', 'quiet room-email');
    if (!people.length) { p.textContent = inRoom ? 'Only you are in this room.' : 'Just for you: nobody else will see it.'; return p; }
    p.appendChild(names(people.map((x) => x.first || x.name)));
    p.appendChild(el('span', '', people.length === 1 ? ' gets a short email that it is waiting, never your words.' : ' get a short email that it is waiting, never your words.'));
    if (send === 'held') p.appendChild(el('span', '', ' While sending from HireKraft is being proven, that email is kept, not sent.'));
    return p;
  }
  function said2(r) {
    const card = el('div', 'room-card room-shape');
    if (r.shaped_by !== 'reading') card.appendChild(el('p', 'quiet', 'I could not tidy it just now, so here are your words as you said them.'));
    return card;
  }
  function shapedInRoom(r) {
    const card = said2(r);
    card.appendChild(el('p', 'room-shape-lead', "Here's how I'd add it:"));
    card.appendChild(own('blockquote', 'thought-said room-put', r.put));
    const people = Array.isArray(r.for) && r.for.length ? r.for : (Array.isArray(r.people) ? r.people : []);
    if (people.length) card.appendChild(el('p', 'quiet', r.kind === 'asking' ? 'You are asking the room for their thoughts.' : 'You are telling the room.'));
    card.appendChild(lineFor(people, r.send));
    const acts = el('div', 'actions');
    const add = button('Add it', 'go', () => keep(r.put, o.room.id, add, acts, card));
    acts.append(add, button('Change', 'go ghost', () => { ta.value = r.put; card.remove(); ta.focus(); }));
    card.appendChild(acts);
    out.appendChild(card);
  }
  function shapedNew(r) {
    const card = said2(r);
    const lead = el('p', 'room-shape-lead');
    lead.appendChild(el('span', '', r.kind === 'asking' ? 'This sounds like a question for the team. ' : ''));
    lead.appendChild(el('span', '', "I'd start a Thinkroom called"));
    card.appendChild(lead);
    const tIn = own('textarea', 'thought-newtopic room-title-in'); tIn.rows = 1; tIn.value = pending && pending.title ? pending.title : r.title; tIn.setAttribute('aria-label', 'The title of the Thinkroom');
    const fit = () => { tIn.style.height = 'auto'; tIn.style.height = tIn.scrollHeight + 2 + 'px'; };
    tIn.addEventListener('input', fit); setTimeout(fit, 0);
    card.appendChild(tIn);
    card.appendChild(el('p', 'room-shape-lead', 'and add your thought:'));
    card.appendChild(own('blockquote', 'thought-said room-put', r.put));
    const all = Array.isArray(r.people) ? r.people : [];
    const chosen = new Set((Array.isArray(r.for) ? r.for : []).map((p) => p.id));
    const em = el('div', '');
    const drawEm = () => { em.innerHTML = ''; em.appendChild(lineFor(all.filter((p) => chosen.has(p.id)), r.send)); };
    if (all.length) {
      const cr = el('div', 'room-who');
      cr.appendChild(el('span', 'room-who-lab', "Who's in:"));
      for (const p of all) {
        const b = el('button', 'room-person'); b.type = 'button';
        b.appendChild(own('span', '', p.first || p.name));
        b.setAttribute('aria-pressed', String(chosen.has(p.id)));
        b.addEventListener('click', () => { if (chosen.has(p.id)) chosen.delete(p.id); else chosen.add(p.id); b.setAttribute('aria-pressed', String(chosen.has(p.id))); drawEm(); });
        cr.appendChild(b);
      }
      card.appendChild(cr);
    } else card.appendChild(el('p', 'quiet', 'Nobody else is signed in here yet, so this room is just for you.'));
    drawEm();
    card.appendChild(em);
    const acts = el('div', 'actions');
    const start = button('Start it', 'go', () => begin([...chosen]));
    const mine = button('Keep it just for me', 'go ghost', () => begin([]));
    acts.append(start, mine, button('Change', 'go ghost', () => { ta.value = r.put; card.remove(); ta.focus(); }));
    card.appendChild(acts);
    out.appendChild(card);
    async function begin(ids) {
      const title = tIn.value.trim();
      if (!title) { tIn.focus(); return; }
      start.disabled = true; mine.disabled = true;
      const stop = working(card, 'Starting the Thinkroom', 'Still starting the Thinkroom');
      const s = await rpc('room_start', { p_title: title, p_members: ids });
      stop();
      if (!s || s.ok !== true) { start.disabled = false; mine.disabled = false; card.appendChild(el('p', 'state stalled', String(s?.why || 'The Thinkroom could not be started just now.'))); return; }
      await keep(r.put, s.room.id, null, acts, card);
    }
  }
  async function keep(text, roomId, btn, acts, card) {
    if (btn) btn.disabled = true;
    const stop = working(card, 'Adding your thought', 'Still adding your thought: translating it for the others can take a little longer');
    const r = await C.askBody({ thought: { text, heard, room: roomId, attach: attach.slice(), email } });
    stop();
    if (!r || r.ok !== true || r.state !== 'thought_kept') {
      if (btn) btn.disabled = false;
      card.appendChild(el('p', 'state stalled', String(r?.why || r?.error || 'Your thought could not be added just now.') + ' Your words are still here.'));
      return;
    }
    pending = null; roomOpen = roomId;
    await loadThoughts(roomId);
  }
  return sec;
}

function drawNew(main, wrap) {
  main.innerHTML = '';
  main.appendChild(back(wrap));
  const sec = el('section', 'room-card room-newbox');
  sec.appendChild(el('h3', 'room-h', "What's on your mind?"));
  sec.appendChild(el('p', 'quiet', "Say it the way you'd say it out loud, in any language. I'll put it clearly, suggest who should be in the room, and you decide."));
  main.appendChild(sec);
  const c = composer({ room: null, wrap, main });
  main.appendChild(c);
  const p = pending;
  if (p && p.draft) {
    const ta = c.querySelector('.room-input');
    ta.value = p.draft;
    setTimeout(() => { if (p.auto) c.querySelector('.room-go')?.click(); else { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }, 0);
  } else setTimeout(() => c.querySelector('.room-input')?.focus(), 0);
}

async function chatImport(body) {
  try {
    const { data } = await C.sb.auth.getSession();
    const jwt = data?.session?.access_token;
    if (!jwt) return { ok: false, note: 'Sign in first.' };
    const r = await fetch(C.url + '/functions/v1/chat-import', {
      method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await r.json().catch(() => ({ ok: false, note: 'No answer came back.' }));
  } catch (e) { return { ok: false, note: String(e?.message || e) }; }
}

// THE RECIPIENT'S SWITCH, SAID IN THE BOX (decision 1026 item 3): "stop emailing me about Thinkrooms" turns the emails off;
// "email me about Thinkrooms" turns them back on. The same switch sits under her name at the top (words.js).
function emailWords(low) {
  if (!(low.indexOf('thinkroom') >= 0 || low.indexOf('thoughtgram') >= 0) || !(low.indexOf('email') >= 0 || low.indexOf('mail') >= 0)) return null;
  if (low.startsWith('stop') || low.startsWith('no more') || low.startsWith("don't") || low.startsWith('do not') || low.startsWith('turn off')) return false;
  if (low.startsWith('email me') || low.startsWith('start') || low.startsWith('turn on') || low.startsWith('send me')) return true;
  return null;
}
async function emailsSay(on) {
  const log = C.$('#dock-turns');
  const x = await rpc('thoughtgram_emails_set', { p_on: on });
  if (!log) return;
  const t = el('div', 'turn said thought-turn');
  log.appendChild(t);
  C.openPanel();
  t.appendChild(el('p', x.ok ? '' : 'state stalled', x.ok ? String(x.said) : String(x.why || 'That could not be changed just now.')));
}

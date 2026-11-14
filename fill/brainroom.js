// THE BRAIN ENGINE ROOM (seat brain-tab-room, 2026-11-05; decision 1086, mock-up 8Bj7WB5GCDdBhUwPkBiXsB v1793842374-3f07).
// The Brain tab's running view: one status sentence; Health, This month, AI balance; What is connected; AI assistants
// connected to your brain; Your AI in three layers; Your database; See how your brain works. Every tile and square opens
// its own page, on the same tab, with a way back.
//
// NOTHING HERE COUNTS OR PRICES. Every number is read from what already exists, and each reading is the one the rest of
// the Tool uses, so this tab cannot disagree with it:
//   sources and their states   sources_view (fill/brainview.js readSources), rows drawn by brainview's own row()
//   understanding more         the row's Details: read_estimate and source_read_approve (fill/sources.js readChooser)
//   Health                     tool_health(), the same reading as the header gauge
//   This month, AI balance,    lens-ask {ai_tab:true}, the AI tab's own reading (ai_spend_plain, limit, balance); the
//   the three layers           limit, the balance and the three lines are drawn by fill/ai.js's own blocks
//   AI assistants              connector_status(): the chatbots the signed-in person approved (only her own)
//   Connect an assistant       the Chats tab's own Connect your Claude part (#chats/connect), opened as a door
//   Add a source               the connect stage that was Brain's Add a source part (#connect-stage), moved onto the page
// LEFT OUT, OWED (nothing behind them yet, decision 1075: no dead buttons): Top up and automatic top-up (Stripe), Statements,
// Download everything, Open my database, Disconnect an assistant, attachments understood only when opened, and the Scans and
// photos square until seat scans-photos ships fill/scans.js (the square appears by itself when that file exists).
// No regex literals and no backslashes (STANDING-CLAUSES).

import { filesBlock, understandProgress, busy } from './brainpress.js?v=2026-11-14-day-one-fixes-3';   // the files press and the reading's progress (seat brain-status-2; understandBlock retired here by seat audit-fix-screen)
const READY_FOR_STEP = './ready.js?v=2026-11-14-day-one-fixes-3';   // the same module instance lens.js loads (step 4 opens there)
import { drawToday } from './today.js?v=2026-11-14-day-one-fixes-3';   // Today: what came in and whether the Tool is keeping up (seat keeping-up, decision 1176)

let C = null;   // { sb, el, $, askBody, isOwner, viewDeps, readSources, drawGroup, aiBlocks, door, goto, openAdd, closeAdd, connectSystem, me }
let reading = null;   // the latest set of readings, so a page opens on what the room shows
let scans = null;     // fill/scans.js, if seat scans-photos has shipped it

const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null; };
const usd0 = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + Math.round(x).toLocaleString('en-US') : null; };
const ARROW_BACK = String.fromCharCode(8592);
const ARROW_GO = String.fromCharCode(8594);
const DOT = String.fromCharCode(183);

// One set of symbols, always with a word (decision 1085 (2)).
const SYM = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="2"/>',
  folder: '<path d="M3 6h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2"/>',
  person: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="2"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  file: '<path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  box: '<path d="M4 8l8-4 8 4v9l-8 4-8-4z M4 8l8 4 8-4 M12 12v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="M4 18l6-5 4 3 3-2 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  find: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  heart: '<path d="M3 12h4l2-5 4 10 2-5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  coin: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 12.5h3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
};
function sym(name) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', 'br-ic');
  s.innerHTML = SYM[name] || '';
  return s;
}

// The states a square or a line can be in, each a word and a color (never a color alone).
const CHIP = { up_to_date: ['Up to Date', 'ok'], reading: ['Reading', 'read'], needs_you: ['Needs You', 'warn'], none: ['Not Connected', 'off'],
  empty: ['Empty', 'off'], connected: ['Connected', 'ok'], healthy: ['Healthy', 'ok'], fixing: ['Being Fixed', 'read'],
  red: ['Being Fixed', 'read'], ok: ['Passing', 'ok'], said: ['Good to Know', 'off'], answering: ['Answering', 'ok'], unknown: ['Not Checked', 'off'] };
function chip(state, word) {
  const [w, k] = CHIP[state] ?? CHIP.unknown;
  const c = C.el('span', 'br-chip br-' + k);
  c.appendChild(C.el('i'));
  c.appendChild(document.createTextNode(word ?? w));
  return c;
}
function txt(tag, cls, text) { const e = C.el(tag, cls); e.textContent = text; return e; }

// THE SQUARES OF WHAT IS CONNECTED, in the mock-up's order. keep(r) picks a square's rows from sources_view. Downloads are
// the systems the brain says were "Brought in once" (a whole export read once: CATS applicant records, the old system's
// records); decision 1086 makes them their own kind, separate from Loose files. door: the square opens a part of the Tool
// that already is that page (the old Drives, Systems and Loose files tabs, now doors inside Brain, decision 1079).
const ONCE = 'Brought in once';
const SQUARES = [
  { key: 'mail', title: 'Mail', icon: 'mail', keep: (r) => r.group === 'email', one: 'mailbox', many: 'mailboxes' },
  { key: 'drives', title: 'Drives', icon: 'folder', keep: (r) => r.group === 'drives', one: 'drive or folder', many: 'drives and folders' },
  { key: 'calendar', title: 'Calendar', icon: 'cal', keep: (r) => r.group === 'calendar', one: 'calendar', many: 'calendars' },
  { key: 'contacts', title: 'Contacts', icon: 'person', keep: (r) => r.group === 'contacts', one: 'address book', many: 'address books' },
  // QuickBooks is its own square (picture; seat brain-status-2): the books arrive as records
  { key: 'books', title: 'QuickBooks', icon: 'coin', keep: (r) => r.group === 'systems' && String(r.source_key).startsWith('qbo:'), one: 'company file', many: 'company files' },
  { key: 'systems', title: 'Systems', icon: 'plug', keep: (r) => r.group === 'systems' && r.what !== ONCE && !String(r.source_key).startsWith('qbo:'), one: 'system', many: 'systems', names: true },
  { key: 'chats', title: 'Chats', icon: 'chat' },
  { key: 'downloads', title: 'Downloads', icon: 'box', keep: (r) => r.group === 'systems' && r.what === ONCE, one: 'brought in', many: 'brought in' },
  { key: 'scans', title: 'Scans and Photos', icon: 'photo' },
  { key: 'loose', title: 'Loose Files', icon: 'file', keep: (r) => r.group === 'loose', one: 'file set', many: 'file sets' },
  { key: 'add', title: 'Add a Source', icon: 'plus' },
];

// A square is found BY ITS KEY, never by its place in the list (seat day-one-fixes, audit fix 2: SQUARES[6] was Chats, so Downloads
// opened blank, and SQUARES[4] was QuickBooks, so Systems opened titled QuickBooks after the QuickBooks square was put in).
const sq = (key) => SQUARES.find((x) => x.key === key);

export function initRoom(c) { C = c; }

// Systems grouped by kind (decision 1086). Ready: a system the Tool connects today (lens.js PICKERS.systems, pressed through
// connectSystem). Coming: named so she knows, never a button.
const SYSTEM_KINDS = [
  ['Accounting', ['QuickBooks'], 'Xero, FreshBooks'],
  ['Bank and payments', ['Mercury', 'Wise'], 'Stripe, other banks'],
  ['CRM and sales', ['HubSpot'], 'Salesforce, Pipedrive, Zoho'],
  ['Email marketing', ['Elastic Email'], 'Mailchimp, Constant Contact, Brevo'],
  ['Website', ['WordPress'], 'Wix, Squarespace'],
  ['Analytics', ['Google Analytics and Search Console'], ''],
  ['Social', [], 'Facebook and Instagram pages, Google Business Profile. LinkedIn comes in today by download, on Marketing and sales.'],
  ['Team chat', ['Slack'], 'Microsoft Teams'],
  ['Staffing', ['CATS'], 'Other applicant tracking'],
];

// ---------------------------------------------------------------------------------------------------------------------
// THE ROOM

export async function drawRoom(fresh) {
  const host = C.$('#brain-room');
  if (!host) return;
  if (!host.dataset.built) build(host);
  if (scans === null) { scans = false; import('./scans.js').then((m) => { scans = m; paint(); }).catch(() => { scans = false; }); }
  const owner = C.isOwner();
  const R = { owner };
  const jobs = [
    C.readSources(C.sb, fresh).then((v) => { R.src = v; }, (e) => { R.srcErr = e; }),
    C.sb.rpc('tool_health').then(({ data, error }) => { if (error) R.healthErr = error; else R.health = data; }, (e) => { R.healthErr = e; }),
    C.sb.rpc('connector_status').then(({ data, error }) => { if (error) R.connErr = error; else R.conn = data; }, (e) => { R.connErr = e; }),
    // THE ROAD (seat brain-status-build, decisions 1106/1108/1114): findable and understood as counts, the what-it-knows test
    C.sb.rpc('brain_road').then(({ data, error }) => { if (error || !data || data.ok !== true) R.roadErr = error?.message ?? data?.error ?? 'no reason was given'; else R.road = data; }, (e) => { R.roadErr = e?.message ?? e; }),
    // per mailbox and drive: in line, waiting for your yes, minutes left (seat findable-all's source_read_progress)
    C.sb.rpc('source_read_progress').then(({ data, error }) => { if (!error) R.prog = data ?? []; }, () => { /* the panels say the per-mailbox lines could not be read */ }),
  ];
  // TODAY (seat keeping-up, decision 1176): the owner's card first on the tab; keeping_up refuses anyone else, and the card stays hidden
  if (owner) jobs.push(drawToday(C.$('#br-today'), C.sb, fresh).then(() => {}, () => { /* the card says a failed reading itself */ }));
  else { const t = C.$('#br-today'); if (t) t.hidden = true; }
  if (owner) jobs.push(C.askBody({ ai_tab: true }).then((r) => { if (r && r.ok === true && r.ai && r.ai.ok === true) R.ai = r.ai; else R.aiErr = r?.error ?? r?.ai?.error ?? 'no reason was given'; }, (e) => { R.aiErr = e?.message ?? e; }));
  // each part is painted as its reading lands, so the slow AI reading never holds the sources back
  reading = R;
  jobs.forEach((j) => j.then(() => { if (reading === R) paint(); }));
  await Promise.all(jobs);
  // WHILE SOMETHING IS BEING READ the room reads itself again every minute, so the road moves while she watches (seat
  // brain-status-2). Stops when nothing is in line; a page open in the side panel is left as it is.
  clearTimeout(poll);
  if (busy(R)) poll = setTimeout(() => { if (!pageOpen()) drawRoom(true); }, 60000);
}
let poll = null;

// THE PAGE AS THE APPROVED PICTURE (seat brain-status-build, 2026-11-06; picture VFFCoxg6cAHGmBVyMo4EPs, decisions 1106-1115).
// Two tabs: Your brain (the road, Needs you, your sources, assistants, Health) and AI and costs (owner only: every cent,
// Getting started, Every month). Colors are traffic lights (1110 amended): green understood / ready, yellow findable /
// learning, red not read / needs you; always with a word. The tiles, layers and pages of seat brain-tab-room are kept and
// moved, not copied. SUPERSEDES (2026-11-06, Alex's yes 1114) the one status sentence and the three tiles at the top.
function build(host) {
  host.dataset.built = '1';
  host.innerHTML = '';
  const room = C.el('div', 'br-room');
  room.id = 'br-view';
  const tabs = C.el('div', 'br-tabs'); tabs.id = 'br-tabs'; tabs.setAttribute('role', 'tablist');
  for (const [k, w] of [['brain', 'Your Brain'], ['ai', 'AI and Costs']]) {
    const b = C.el('button', 'br-tab' + (k === 'brain' ? ' on' : '')); b.type = 'button'; b.dataset.btab = k; b.textContent = w;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', k === 'brain' ? 'true' : 'false');
    if (k === 'ai') b.hidden = true;   // money and AI show only to the owner (picture's colleague line)
    b.addEventListener('click', () => showTab(k));
    tabs.appendChild(b);
  }
  // ---- YOUR BRAIN
  const mine = C.el('div', 'br-pane'); mine.id = 'br-p-brain';
  const today = C.el('section', 'br-card br-today'); today.id = 'br-today'; today.hidden = true;   // seat keeping-up: Today, drawn by fill/today.js
  const road = C.el('section', 'br-card br-road'); road.id = 'br-road';
  road.appendChild(txt('p', 'br-small', 'Reading your brain'));
  const needH = txt('h3', 'br-h', 'Needs You'); needH.id = 'br-need-h';
  const need = C.el('div', 'br-needs'); need.id = 'br-needs';
  const conn = C.el('section', 'br-sec');
  const ch = C.el('h3', 'br-h'); ch.append(document.createTextNode('Your Sources'));
  const leg = C.el('span', 'br-legend');
  for (const [k, w] of [['u', 'Understood'], ['f', 'Searchable'], ['n', 'Not Read']]) { const i = C.el('span'); i.append(C.el('i', 'br-k' + k), document.createTextNode(w)); leg.appendChild(i); }
  ch.appendChild(leg);
  conn.appendChild(ch);
  const grid = C.el('div', 'br-grid'); grid.id = 'br-squares'; conn.appendChild(grid);
  const asst = C.el('section', 'br-sec'); asst.id = 'br-assist-sec';
  asst.append(txt('h3', 'br-h', 'AI Assistants Connected to Your Brain'));
  const ag = C.el('div', 'br-grid'); ag.id = 'br-assist'; asst.appendChild(ag);
  const hl = C.el('button', 'br-card br-healthline'); hl.type = 'button'; hl.id = 'br-healthline';
  hl.addEventListener('click', () => openPage('health'));
  const who = txt('p', 'br-small br-note', 'A colleague sees the road, what needs her, the sources she may open and Health. Money and AI show only to the owner.');
  // A mailbox the Tool could read but that is not yet allowed here: the offer to adopt it, as a Needs you item (inventory
  // row 34; lens.js fillAdoptable draws into it on every reading). Moved here from the retired #brain-old (seat brain-status-2).
  const adopt = C.el('div', 'br-adopt'); adopt.id = 'adopt'; adopt.setAttribute('aria-live', 'polite');
  mine.append(today, road, needH, need, adopt, conn, asst, hl, who);
  // ---- AI AND COSTS (owner)
  const ai = C.el('div', 'br-pane'); ai.id = 'br-p-ai'; ai.hidden = true;
  ai.appendChild(txt('p', 'br-cent', 'Every cent you spend on AI goes to the AI companies. We add nothing. AI work costs money, like electricity for a machine. Our only fee is the flat monthly price of the Tool.'));
  const start = C.el('section', 'br-card br-start'); start.id = 'br-start';
  const month = C.el('section', 'br-card br-month');
  month.append(txt('h2', 'br-ph', 'Every Month ' + DOT + ' ongoing'), txt('p', 'br-small', 'Keeping up with new mail and files, and answering your questions. This is what your monthly limit is for.'));
  const tiles = C.el('div', 'br-tiles'); tiles.id = 'br-tiles'; tiles.setAttribute('aria-label', 'At a glance');
  const lim = C.el('div', 'br-limit'); lim.id = 'br-limit';
  month.append(tiles, lim);
  const lay = C.el('section', 'br-sec'); lay.id = 'br-ai-sec';
  lay.append(txt('h3', 'br-h', 'Your AI, This Month, by Step'));
  const layers = C.el('div', 'br-layers'); layers.id = 'br-layers'; lay.appendChild(layers);
  const more = C.el('button', 'go ghost'); more.type = 'button';
  more.textContent = 'Month by Month, Day by Day, Next Month, and Which AI Does Each Step';
  more.addEventListener('click', () => C.door('ai'));
  ai.append(start, month, lay, more);
  room.append(tabs, mine, ai);
  // the pages open as a side panel over the Brain (picture), with a way back
  const scrim = C.el('div', 'br-scrim'); scrim.id = 'br-scrim'; scrim.hidden = true; scrim.addEventListener('click', closePage);
  const page = C.el('div', 'br-page'); page.id = 'br-page'; page.hidden = true;
  page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true');
  const back = C.el('button', 'go ghost br-back'); back.type = 'button'; back.textContent = 'Close';
  back.addEventListener('click', closePage);
  const body = C.el('div', 'br-page-body'); body.id = 'br-page-body';
  page.append(back, body);
  host.append(room, scrim, page);
  if (C.adopt) { try { C.adopt(); } catch (_) { /* drawn at the next reading */ } }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !C.$('#br-page')?.hidden && C.$('#s-summary') && !C.$('#s-summary').hidden) closePage(); });
}

let tabNow = 'brain';
export function showTab(k) {
  if (k === 'ai' && !reading?.owner) k = 'brain';
  tabNow = k;
  for (const b of document.querySelectorAll('#br-tabs .br-tab')) { const on = b.dataset.btab === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }
  const a = C.$('#br-p-brain'), z = C.$('#br-p-ai');
  if (a) a.hidden = k !== 'brain';
  if (z) z.hidden = k !== 'ai';
}

// The four steps (1108, 1111). Connected from sources_view; Findable and Understood from brain_road (counts, never a
// percentage understood: STANDING-CLAUSES, read and understood are different states); Ready only when 2 and 3 are done.
// seat getting-ready-screen (2026-11-07): the Getting ready screen (fill/ready.js) reads the road's four steps from here, so the
// screen and the Brain cannot disagree on connected, findable, understood and ready.
export function roadSteps(R) { return steps(R); }
function steps(R) {
  const rows = rowsOf(R), d = R.road;
  const n = (g) => rows.filter((r) => r.group === g).length;
  const out = [];
  const nc = rows.length;
  out.push({ k: 'c', name: 'Connected', state: R.src ? (nc ? 'done' : 'zero') : 'wait',
    big: R.src ? (nc ? 'Done' : 'Nothing yet') : String.fromCharCode(8230),
    sub: R.src ? [n('email') ? num(n('email')) + (n('email') === 1 ? ' mailbox' : ' mailboxes') : '', n('drives') ? num(n('drives')) + ' drives' : '', n('systems') ? num(n('systems')) + ' systems' : ''].filter(Boolean).join(', ') || 'Add a source to begin' : 'Reading' });
  if (!d) {
    const w = R.roadErr ? 'Could not be read just now' : 'Reading';
    out.push({ k: 'f', name: 'Searchable', state: 'wait', big: String.fromCharCode(8230), sub: w });
    out.push({ k: 'u', name: 'Understood', state: 'wait', big: String.fromCharCode(8230), sub: w });
    out.push({ k: 'r', name: 'Ready', state: 'next', big: 'Not yet', sub: 'When 2 and 3 are done' });
    return out;
  }
  const F = d.findable, M = d.mail, Fi = d.files, U = d.understood;
  // SEARCHABLE IS THE BRAIN'S (seat audit-fix-screen, ruling 1142.1, audit-fix-brain I1): done when nothing a press can still read is
  // waiting (brain_road ready.searchable); what can never be read (too large, held by policy, recordings, pictures) is said beside it,
  // never counted against it. SUPERSEDED: findable.left = 0, which counted those and so could never be reached on HireKraft.
  const RS = d.ready && typeof d.ready === 'object' && typeof d.ready.searchable === 'boolean' ? d.ready : null;
  const fDone = RS ? RS.searchable === true : Number(F.left) === 0;
  const NS = RS && RS.not_searchable && RS.not_searchable.note ? String(RS.not_searchable.note) : '';
  out.push({ k: 'f', name: 'Searchable', state: fDone ? 'done' : 'now', big: fDone ? 'Done' : num(F.pct) + '%', pct: Number(F.pct),
    sub: RS ? (fDone ? 'Everything that can be read can be found and quoted' : (Number(F.reading) > 0 ? num(F.reading) + ' files being read now. ' : '') + num(RS.to_read) + ' left to make searchable') + (NS ? '. Not counted: ' + NS : '') : fDone ? 'everything can be found and quoted' : (Number(F.reading) > 0 ? num(F.reading) + ' files being read now. ' : '') + num(F.left) + ' left: ' + [Number(M.attach_waiting) + Number(M.attach_cannot) + Number(M.attach_held) + Number(M.attach_reading || 0) ? num(Number(M.attach_waiting) + Number(M.attach_cannot) + Number(M.attach_held) + Number(M.attach_reading || 0)) + ' mail attachments' : '', Number(Fi.not_read) + Number(Fi.waiting) + Number(Fi.waiting_yes) ? num(Number(Fi.not_read) + Number(Fi.waiting) + Number(Fi.waiting_yes)) + ' drive files' : ''].filter(Boolean).join(', ') });
  const files = Number(Fi.read) + Number(Fi.not_read) + Number(Fi.waiting) + Number(Fi.waiting_yes);
  // READY IS THE BRAIN'S (seat setup-wire, decision 1141 ruling 1): brain_road 'ready' decides understood and ready, one rule for the
  // Brain and Getting started: everything connected searchable, the groups she chose understood with nothing waiting, keeping up.
  // Not every email. SUPERSEDED 2026-11-10 (HQ ruling 1141, seat setup-wire): understood only when every email and file was understood,
  // which a choice of groups could never reach. A brain whose road predates the 'ready' object keeps the old rule.
  const RD = d.ready && typeof d.ready === 'object' ? d.ready : null;
  const uDone = RD ? RD.understood === true : Number(U.mail) >= Number(M.emails) && Number(U.files) >= files;
  // seat brain-status-2: while the reader works the step is yellow (learning) with its progress; until anything is pressed it
  // is red and says the rest waits for her.
  const W = d.understanding || {};
  const uNow = Number(W.waiting) > 0;
  out.push({ k: 'u', name: 'Understood', state: uDone ? 'done' : uNow ? 'now' : 'zero',
    big: num(U.mail) + ' emails ' + DOT + ' ' + num(U.files) + ' files',
    sub: uNow ? 'Understanding: ' + num(W.done) + ' of ' + num(W.pressed) + ' read' + (Number(W.minutes_left) > 0 ? ', about ' + (Number(W.minutes_left) < 90 ? num(W.minutes_left) + ' minutes' : Math.round(Number(W.minutes_left) / 60) + ' hours') + ' left' : '')
      : uDone && RD ? 'What you chose is understood; the rest stays searchable' : 'Of ' + num(M.emails) + ' emails and ' + num(files) + ' files. The rest waits for you.',
    pct: uNow && Number(W.pressed) > 0 ? Number(W.done) * 100 / Number(W.pressed) : undefined });
  const ready = (RD ? RD.ok === true : fDone && uDone) && out[0].state === 'done';
  out.push({ k: 'r', name: 'Ready', state: ready ? 'done' : 'next', big: ready ? 'You are ready' : 'Not yet', sub: ready ? 'Keeps up every day' : RD && RD.keeping_up === false ? num(RD.refresh_errors) + (Number(RD.refresh_errors) === 1 ? ' connection' : ' connections') + ' could not refresh: see Connected' : 'When 2 and 3 are done' });
  return out;
}

// What the masthead button says (1110): Ready, Learning step N of 4, Needs you (n), Stopped.
export function brainState(R) {
  R = R || reading;
  if (!R) return null;
  const st = steps(R);
  const needN = needList(R).length;
  const step = st.findIndex((s) => s.state !== 'done');
  const H = R.health;
  if (H && H.overall === 'stopped') return { kind: 'stopped', word: 'Stopped: answers are not reliable', step: step < 0 ? 4 : step + 1, need: needN };
  if (needN) return { kind: 'needs', word: 'Needs you (' + needN + ')', step: step < 0 ? 4 : step + 1, need: needN };
  if (step < 0) return { kind: 'ready', word: 'Ready', step: 4, need: 0 };
  return { kind: 'learning', word: 'Learning'   /* SUPERSEDED 2026-11-13 (seat setup-polish, decision 1150.1): Learning, step N of 4 in the header beside Getting started's Step N of 5; the Brain page's own road keeps its four steps */, step: step + 1, need: 0 };
}

function paintRoad(R) {
  const box = C.$('#br-road');
  if (!box) return;
  const st = steps(R);
  const wrap = C.el('div', 'br-stations');
  for (const [i, s] of st.entries()) {
    const b = C.el('button', 'br-stn br-stn-' + s.state); b.type = 'button';
    b.append(txt('span', 'br-stn-k', (i + 1) + ' ' + DOT + ' ' + s.name), txt('b', 'br-stn-b', s.big), txt('span', 'br-stn-s', s.sub));
    if (s.pct !== undefined) { const pb = C.el('span', 'br-pb'); const f = C.el('i', s.k === 'u' ? 'br-ku' : 'br-kf'); f.style.width = Math.max(0, Math.min(100, s.pct)) + '%'; pb.appendChild(f); b.appendChild(pb); }
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ' of 4, ' + s.name + ': ' + s.big + '. ' + s.sub);
    b.addEventListener('click', () => openPage('step', s.k));
    wrap.appendChild(b);
  }
  const ready = st[3].state === 'done';
  const stat = C.el('p', 'br-stat');
  if (ready) stat.append(txt('b', null, 'You are ready to use the Tool now.'), document.createTextNode(' It keeps up every day; if anything slips, the step drops back and says why.'));
  else if (st[2].state !== 'done') stat.append(txt('b', null, 'Searchable, not understood yet.'), document.createTextNode(' Search works; counting, totaling and comparing need step 3.'));
  else stat.append(txt('b', null, 'Still learning.'), document.createTextNode(' Answers may be incomplete until it is ready.'));
  const horse = C.el('div', 'br-horse');
  for (const [ic, n, w] of [['find', 'Find', 'reads everything once, so you can search all of it by meaning.'], ['tag', 'Understand', 'turns each email and file into facts: who, what, how much, when.'], ['chat', 'Reason', 'answers you from those facts, with the proof.']]) {
    const d = C.el('div', 'br-hz'); const t = C.el('span'); t.append(txt('b', null, n), document.createTextNode(' ' + w)); d.append(sym(ic), t); horse.appendChild(d);
  }
  const chips = C.el('div', 'br-chips');
  if (R.owner && st[2].state !== 'done') { const u = C.el('button', 'go'); u.type = 'button'; u.textContent = 'Make It Understood'; u.addEventListener('click', () => { showTab('ai'); C.$('#br-start')?.scrollIntoView({ block: 'start' }); }); chips.appendChild(u); }
  const how = C.el('button', 'go ghost'); how.type = 'button'; how.textContent = 'How Your Brain Works'; how.addEventListener('click', () => C.openStory());
  const bel = C.el('button', 'go ghost'); bel.type = 'button'; bel.textContent = 'What Your Tool Believes About Your Business'; bel.addEventListener('click', () => C.goto('s-recognition'));
  chips.append(how, bel);
  const asof = R.road?.as_of ? txt('p', 'br-small br-note', 'Counted ' + when(R.road.as_of) + '.') : txt('p', 'br-small br-note', R.roadErr ? 'The counts could not be read just now: ' + String(R.roadErr) + '. It tries again on its own.' : ' ');
  box.replaceChildren(wrap, stat, horse, chips, asof);
}

function needList(R) {
  const rows = rowsOf(R).filter((r) => r.state === 'needs_you');
  return rows;
}
function paintNeeds(R) {
  const box = C.$('#br-needs'), h = C.$('#br-need-h');
  if (!box || !h) return;
  if (R.srcErr || (R.src && !R.src.ok)) { h.textContent = 'Needs You'; box.replaceChildren(txt('p', 'br-small', 'Your sources could not be read just now. This is the reading failing, not your brain being empty. It tries again on its own.')); return; }
  if (!R.src) { h.textContent = 'Needs You'; box.replaceChildren(txt('p', 'br-small', 'Reading')); return; }
  const need = needList(R);
  h.textContent = need.length ? (need.length === 1 ? '1 Thing Needs You' : need.length + ' Things Need You') : 'Nothing Needs You';
  const out = [];
  for (const r of need) {
    const d = C.el('div', 'br-nd');
    const w = C.el('span', 'br-nd-w'); w.appendChild(C.el('span', 'br-dot br-bad'));
    const t = C.el('span'); t.appendChild(document.createTextNode((r.name ? r.name + ': ' : '') + (r.line || 'needs you.')));
    w.appendChild(t); d.appendChild(w);
    if (r.action) {
      const b = C.el('button', 'go'); b.type = 'button'; b.textContent = r.action;
      b.addEventListener('click', () => C.viewDeps().act(r, () => openPage(squareOf(r)?.key ?? 'mail'), b));
      d.appendChild(b);
    }
    out.push(d);
  }
  if (!out.length) out.push(txt('p', 'br-small', 'Nothing is waiting on you. When something does, it shows here with the one press that fixes it.'));
  box.replaceChildren(...out);
}

function paintHealth(R) {
  const b = C.$('#br-healthline');
  if (!b) return;
  const H = R.health;
  const dot = C.el('span', 'br-dot');
  let say;
  if (R.healthErr || (H && H.ok === false && !H.word)) { dot.classList.add('br-off'); say = 'Health: not checked. It could not be read just now.'; }
  else if (!H) { dot.classList.add('br-off'); say = 'Health: checking.'; }
  else {
    dot.classList.add(H.overall === 'healthy' ? 'br-ok' : H.overall === 'needs_you' || H.overall === 'stopped' ? 'br-bad' : 'br-yel');
    const fixed = (H.repairs ?? []).length;
    say = 'Health: ' + String(H.word || 'checked').toLowerCase() + '.' + (fixed ? ' ' + num(fixed) + (fixed === 1 ? ' thing' : ' things') + ' fixed by the Tool in the last day.' : '') + (H.checked_at ? ' Checked ' + when(H.checked_at) + '.' : '');
  }
  const t = txt('span', 'br-hl-t', say);
  b.replaceChildren(dot, t, txt('span', 'br-small br-right', 'Open'));
  b.setAttribute('aria-label', say + ' Open Health.');
}

// GETTING STARTED, one time (1112): making findable and understanding the past, priced and approved by her press, not
// counted against the monthly limit. seat brain-status-2: the two presses are real now (fill/brainpress.js): Read them for
// the files attached to older mail, Go for understanding per source and how far back, each with its price and a preview
// first (1115: only she presses; nothing here presses for her). The chooser is drawn once and kept, so a reading that lands
// while she is choosing or confirming does not throw her choice away.
let pickHost = null, filesHost = null;
function paintStart(R) {
  const box = C.$('#br-start');
  const tb = document.querySelector('#br-tabs [data-btab=ai]');
  if (tb) tb.hidden = !R.owner;
  if (!R.owner && tabNow === 'ai') showTab('brain');
  if (!box) return;
  const d = R.road;
  const out = [txt('h2', 'br-ph', 'Getting Started ' + DOT + ' one time'),
    txt('p', 'br-small', 'Reading and understanding your past once, so the Tool knows your business. You approve its price before it starts; it does not count against your monthly limit.')];
  if (!d) { out.push(txt('p', 'br-small', R.roadErr ? 'Could not be read just now: ' + String(R.roadErr) + '.' : 'Reading')); box.replaceChildren(...out); return; }
  if (!R.owner) { box.replaceChildren(...out); return; }   // the presses and their prices are the owner's (picture's colleague line)
  const F = d.findable, M = d.mail, U = d.understood;
  const l1 = C.el('div', 'br-line br-line-col');
  const a = C.el('span', 'br-line-l'); a.append(txt('b', null, 'Make searchable'), C.el('br'),
    txt('span', 'br-small', Number(F.left) === 0 ? 'Done: everything since ' + String(M.from).slice(0, 4) + ' can be found.' : 'Everything since ' + String(M.from).slice(0, 4) + ' ' + DOT + ' ' + num(F.pct) + '% ' + DOT + ' ' + num(F.left) + ' left, mostly mail attachments.'));
  const pb = C.el('span', 'br-pb'); const fi = C.el('i', 'br-kf'); fi.style.width = Math.max(0, Math.min(100, Number(F.pct))) + '%'; pb.appendChild(fi); a.appendChild(pb);
  l1.appendChild(a);
  if (!filesHost) { filesHost = C.el('div', 'br-press'); filesHost.id = 'br-files'; }
  if (!filesHost.dataset.hold) filesBlock(C, filesHost, R, () => drawRoom(true));
  l1.appendChild(filesHost);
  const l2 = C.el('div', 'br-line br-line-col'); l2.id = 'br-und';
  const b = C.el('span', 'br-line-l');
  b.append(txt('b', null, 'Make It Understood'), C.el('br'),
    txt('span', 'br-small', 'So far ' + num(U.mail) + ' emails and ' + num(U.files) + ' files are understood (facts with the sentence they came from), and ' + num(U.records) + ' people from your records. Choose per source how far back; you see the price and the time before anything starts, and new ones are understood as they arrive.'));
  l2.appendChild(b);
  const pr = understandProgress(C, R);
  if (pr) l2.appendChild(pr);
  // ONE PRESS FOR UNDERSTANDING (seat audit-fix-screen, ruling 1142.3): understanding is started in Getting started, step 4 (a sample
  // first, then her limit, through lens-ask). SUPERSEDED: brainpress understandBlock's own Go here, a second door to the same press
  // with no limit, which the revoke of source_read_approve 'understand' for signed-in people would refuse.
  if (!pickHost) { pickHost = C.el('div', 'br-press'); pickHost.id = 'br-und-pick';
    const go = C.el('button', 'go'); go.type = 'button'; go.textContent = 'Choose in Getting Started, Step 4';
    go.addEventListener('click', () => { import(READY_FOR_STEP).then((M) => M.openStep(C, 'understand')).catch(() => C.goto('s-ready')); });
    pickHost.append(txt('p', 'br-small', 'A sample of your own mail first, then your limit, never passed.'), go); }
  l2.appendChild(pickHost);
  out.push(l1, l2, txt('p', 'br-small br-note', 'When this is done, it says Getting Started: done and folds away.'));
  box.replaceChildren(...out);
}

function paint() {
  const R = reading;
  if (!R) return;
  paintRoad(R); paintNeeds(R); paintTiles(R); paintSquares(R); paintAssist(R); paintLayers(R); paintHealth(R); paintStart(R);
  if (C.onState) { try { C.onState(brainState(R)); } catch (_) { /* the masthead draws itself at the next reading */ } }
}

function rowsOf(R) { return R.src?.ok ? (R.src.rows ?? []) : []; }

function squareOf(r) { return SQUARES.find((s) => s.keep && s.keep(r)); }

function tile(key, icon, label, big, tone, small, extra) {
  const b = C.el('button', 'br-tile'); b.type = 'button';
  const l = C.el('span', 'br-lab br-ttl'); l.append(sym(icon), document.createTextNode(label));
  const n = txt('span', 'br-big' + (tone ? ' br-t-' + tone : ''), big);
  b.append(l, n);
  if (extra) b.appendChild(extra);
  b.appendChild(txt('span', 'br-small', small));
  b.addEventListener('click', () => openPage(key));
  return b;
}

function paintTiles(R) {
  const box = C.$('#br-tiles');
  if (!box) return;
  const out = [];
  // THIS MONTH and AI BALANCE: owner only; the AI tab's own reading
  if (R.owner) {
    const p = R.ai?.plain;
    if (R.aiErr) out.push(tile('month', 'coin', 'This Month So Far', 'Not Read', 'off', 'Could not be read just now'));
    else if (!p) out.push(tile('month', 'coin', 'This Month So Far', ' ', null, 'Reading'));
    else {
      const total = Number(p.this_month_usd) || 0;
      const bar = C.el('span', 'br-bar'); bar.setAttribute('aria-hidden', 'true');
      if (p.adds_up === true && total > 0) for (const l of (p.lines ?? [])) {
        const s = C.el('span', 'br-l-' + (l.key || 'x')); s.style.width = Math.max(0, (Number(l.usd) || 0) / total * 100).toFixed(1) + '%'; bar.appendChild(s);
      }
      const L = R.ai.limit || {};
      out.push(tile('month', 'coin', 'This Month So Far', usd(total) ?? '$0.00', null,
        String(p.month || 'This month') + ' ' + DOT + ' ' + (L.set === true ? 'your limit ' + usd0(L.limit_usd) : 'no monthly limit set'), bar));
      const b = p.balance || {};
      if (!b.set_up) out.push(tile('balance', 'wallet', 'AI Balance', 'None', 'off', 'No prepaid balance set up'));
      else {
        const low = b.state === 'low' || b.state === 'answers_within_margin' || b.state === 'stopped_at_zero';
        out.push(tile('balance', 'wallet', 'AI Balance', usd0(Math.max(0, Number(b.left_usd) || 0)) ?? '$0', low ? 'warn' : null,
          b.state === 'stopped_at_zero' ? 'Used up' : (low ? 'Low' : 'Left') + (b.lasts_days !== null && b.lasts_days !== undefined ? ' ' + DOT + ' about ' + b.lasts_days + ' days at this pace' : '')));
      }
    }
  }
  box.classList.toggle('br-one', out.length === 1);
  box.replaceChildren(...out);
  const lim = C.$('#br-limit');
  if (lim && R.owner && R.ai?.limit && C.aiBlocks?.limitBlock) lim.replaceChildren(C.aiBlocks.limitBlock(R.ai.limit, { el: C.el, askBody: C.askBody }, () => drawRoom(true)));
}

function when(ts) {
  try { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); } catch (_) { return ''; }
}

function stateOf(rows) {
  if (!rows.length) return 'none';
  if (rows.some((r) => r.state === 'needs_you')) return 'needs_you';
  if (rows.some((r) => r.state === 'reading')) return 'reading';
  return 'up_to_date';
}
function since(rows) {
  const ys = rows.map((r) => Number(r.back_to)).filter((y) => Number.isFinite(y) && y > 1900);
  return ys.length ? 'since ' + Math.min(...ys) : '';
}

// A source's level as a bar and a pill (seat brain-status-build; picture): green understood, yellow findable, red not read.
// Mail and Drives are counted by brain_road; the other kinds come in as findable whole, so they show findable or needs you.
function level(s, mine, R) {
  const d = R.road;
  if (!mine.length) return null;
  const lv = levelOf(s, R);
  if (mine.some((r) => r.state === 'needs_you')) lv.pill = ['r', 'Needs You'];
  return lv;
}
function levelOf(s, R) {
  const d = R.road;
  const pc = (a, b) => (b > 0 ? Math.max(0, Math.min(100, a * 100 / b)) : 0);
  if (s.key === 'mail' && d) {
    // ONE NUMBER (seat drive-gap, HQ ruling F): what a press can still read is the brain's own count (brain_road mail.attach_left), the same
    // one the Findable step shows. SUPERSEDED 2026-11-11: added up here from waiting + could not be read + held + being read, so this card
    // said 37,651 while the step said 37,596. A brain without attach_left keeps the old sum.
    const M = d.mail, hasLeft = M.attach_left != null;
    const left = hasLeft ? Number(M.attach_left) : Number(M.attach_waiting) + Number(M.attach_cannot) + Number(M.attach_held) + Number(M.attach_reading || 0);
    const of = Number(M.emails) + Number(M.attach_read) + left;
    const u = pc(Number(d.understood.mail), of);
    return { u, f: pc(Number(M.emails) + Number(M.attach_read), of) - u, pill: left > 0 ? ['y', 'Searchable ' + DOT + ' ' + num(left) + ' attachments not read yet'] : ['y', 'Searchable'] };
  }
  if (s.key === 'drives' && d) {
    const F = d.files, of = Number(F.read) + Number(F.not_read) + Number(F.waiting) + Number(F.waiting_yes), left = of - Number(F.read);
    const u = pc(Number(d.understood.files), of);
    return { u, f: pc(Number(F.read), of) - u, pill: left > 0 ? ['y', 'Searchable ' + DOT + ' ' + num(left) + ' files not read yet'] : ['y', 'Searchable'] };
  }
  return { u: 0, f: 100, pill: ['y', 'Searchable'] };
}

function square(s, line, st, word, onClick, lv) {
  const b = C.el('button', 'br-sq' + (st === 'needs_you' ? ' br-sq-warn' : '')); b.type = 'button';
  b.dataset.square = s.key;
  const t = C.el('span', 'br-ttl'); t.append(sym(s.icon), txt('span', 'br-t', s.title));
  b.append(t, txt('span', 'br-l', line));
  if (lv) {
    const bar = C.el('span', 'br-lvl'); bar.setAttribute('aria-hidden', 'true');
    const u = C.el('i', 'br-ku'); u.style.width = lv.u.toFixed(1) + '%';
    const f = C.el('i', 'br-kf'); f.style.width = Math.max(0, lv.f).toFixed(1) + '%';
    bar.append(u, f); b.appendChild(bar);
    const pl = C.el('span', 'br-pill br-pill-' + lv.pill[0]); pl.append(C.el('i'), document.createTextNode(lv.pill[1])); b.appendChild(pl);
  } else if (st) b.appendChild(chip(st, word));
  b.addEventListener('click', onClick ?? (() => openPage(s.key)));
  return b;
}

function paintSquares(R) {
  const box = C.$('#br-squares');
  if (!box) return;
  const rows = rowsOf(R);
  const out = [];
  for (const s of SQUARES) {
    if (s.key === 'scans') { if (scans && scans.scansSquare) { try { const q = scans.scansSquare({ ...C, square: (line, st, word) => square(s, line, st, word) }); if (q) out.push(q); } catch (_) { /* its own seat's part */ } } continue; }
    if (s.key === 'add') { out.push(square(s, 'Mail, drive, system, files', null)); continue; }
    if (s.key === 'chats') {
      const c = R.conn;
      out.push(square(s, c?.ok ? (c.saves ? num(c.saves) + ' saved from your own AI ' + DOT + ' imports' : 'Saved AI chats and imports') : 'Saved AI chats and imports', null));
      continue;
    }
    if (!R.src) { out.push(square(s, R.srcErr ? 'Could not be read just now' : 'Reading', null)); continue; }
    const mine = rows.filter(s.keep);
    const st = mine.length ? stateOf(mine) : (s.key === 'loose' ? 'empty' : 'none');
    let line;
    if (!mine.length) line = s.key === 'loose' ? 'Drop a file to add it' : s.key === 'downloads' ? 'Whole downloads from other systems' : 'Not connected yet';
    else if (s.names) line = num(mine.length) + ' ' + DOT + ' ' + mine.slice(0, 3).map((r) => r.name).join(', ') + (mine.length > 3 ? String.fromCharCode(8230) : '');
    else line = [num(mine.length) + ' ' + (mine.length === 1 ? s.one : s.many), since(mine)].filter(Boolean).join(' ' + DOT + ' ');
    const lv = level(s, mine, R);
    if (!lv && s.key === 'loose') { const q = square(s, line, null); const pl = C.el('span', 'br-pill br-pill-o'); pl.append(C.el('i'), document.createTextNode('Empty')); q.appendChild(pl); out.push(q); continue; }
    out.push(square(s, line, st, null, null, lv));
  }
  box.replaceChildren(...out);
}

function paintAssist(R) {
  const box = C.$('#br-assist');
  if (!box) return;
  const c = R.conn;
  const out = [];
  const add = { key: 'assistadd', title: 'Connect an Assistant', icon: 'plus', door: 'chats/connect' };
  if (R.connErr || (c && !c.ok)) out.push(square({ key: 'assist', title: 'Your Assistants', icon: 'chat' }, 'Could not be read just now', 'unknown'));
  else if (c) {
    // one square per kind of assistant; the same assistant approved twice (two computers) is one square
    const byName = new Map();
    for (const x of (c.connections ?? [])) { const k = String(x.client || 'A chatbot'); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(x); }
    const who = C.me()?.name || 'You';
    for (const [name, list] of byName) {
      const q = square({ key: 'assist', title: name, icon: 'chat' }, who + ' ' + DOT + ' asks the brain from their own ' + name, 'connected', null, () => openPage('assist', { name, list }));
      q.querySelector('.br-t').setAttribute('translate', 'no');
      out.push(q);
    }
  }
  out.push(square(add, 'Claude, and others that can connect', null));
  // Your database, a square of this grid (picture; inventory row 7). Its state is what this page just saw.
  out.push(square({ key: 'db', title: 'Your Database', icon: 'box' }, 'In your own account at Supabase ' + DOT + ' yours if you leave',
    R.src?.ok ? 'answering' : 'unknown', R.src?.ok ? null : (R.srcErr ? 'Did not answer' : 'Checking')));
  box.replaceChildren(...out);
}

function paintLayers(R) {
  const sec = C.$('#br-ai-sec'), box = C.$('#br-layers');
  if (!sec || !box) return;
  if (!R.owner || (!R.ai && !R.aiErr)) { sec.hidden = !R.owner; if (R.owner) box.replaceChildren(txt('p', 'br-small', 'Reading')); return; }
  sec.hidden = false;
  if (R.aiErr) { box.replaceChildren(txt('p', 'br-small', 'What each layer cost could not be read just now: ' + String(R.aiErr) + '.')); return; }
  const p = R.ai.plain || {};
  const by = {}; for (const l of (p.lines ?? [])) by[l.key] = l;
  // seat brain-status-build (1114): the middle line is the sorting model (what kind, who may see it), so it says Sort, not
  // Understand; understanding (facts with their sentence) has no cost line until seat understand-reader's reader runs.
  const L = [['find', 'finds', 'Find', 'find', 'Search by Meaning'], ['understand', 'understands', 'Sort', 'tag', 'What kind each item is, who may see it'], ['reason', 'thinks', 'Reason', 'chat', 'Answers and Drafts']];
  const out = [];
  for (const [key, line, name, icon, what] of L) {
    const b = C.el('button', 'br-layer'); b.type = 'button';
    const l = C.el('span', 'br-lab br-ttl br-k-' + key); l.append(sym(icon), document.createTextNode(name));
    const shown = p.adds_up === true && by[line];
    b.append(l, txt('span', 'br-n', shown ? (usd(by[line].usd) ?? '$0.00') : String.fromCharCode(8212)), txt('span', 'br-small', what));
    b.addEventListener('click', () => C.door('ai'));
    b.setAttribute('aria-label', name + ': ' + (shown ? usd(by[line].usd) : 'not shown') + ' this month. ' + what + '. Opens which AI does it.');
    out.push(b);
  }
  if (p.adds_up !== true) out.push(txt('p', 'br-small', 'The three parts do not add up to this month' + String.fromCharCode(8217) + 's total, so they are not shown. This is being looked at.'));
  box.replaceChildren(...out);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PAGES. Each one opens on the Brain tab, in place of the room; the back button and Escape return to the room where she was.

let addMoved = null;   // the Add a source part while it sits on the page
export function openPage(key, arg) {
  const s = SQUARES.find((x) => x.key === key);
  if (s?.door) { C.door(s.door); return; }
  const view = C.$('#br-view'), page = C.$('#br-page'), body = C.$('#br-page-body');
  if (!view || !page || !body) return;
  putAddBack();
  body.replaceChildren();
  page.hidden = false; const sc = C.$('#br-scrim'); if (sc) sc.hidden = false;
  document.body.classList.add('br-panel-open');
  page.scrollTop = 0;
  const P = PAGES[key];
  if (P) P(body, arg); else body.appendChild(txt('p', 'quiet', 'This page is not there.'));
  page.querySelector('.br-back')?.focus({ preventScroll: true });
}
// LEAVING BUTTONS (seat setup-findable-table 2026-11-12, setup-one-path finding B): a button in a page that leads to another tab
// carries br-leave; while Getting started shows this page over a step (body.gr-over, before Ready) skin.css hides it, because the
// router would hold it and it would read as a dead button.
export function closePage() {
  const view = C.$('#br-view'), page = C.$('#br-page');
  if (!view || !page || page.hidden) return;
  putAddBack();
  page.hidden = true; view.hidden = false; const sc = C.$('#br-scrim'); if (sc) sc.hidden = true;
  document.body.classList.remove('br-panel-open');
  try { if (location.hash.startsWith('#brain/')) history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* link stays */ }
  window.dispatchEvent(new Event('br-closed'));   // seat setup-one-path (decision 1150.1): Getting started opens these pages over its step and returns to it here
}
export function pageOpen() { const p = C?.$('#br-page'); return !!p && !p.hidden; }
function putAddBack() {
  if (!addMoved) return;
  C.closeAdd(addMoved);
  addMoved = null;
}

function title(body, text, state, word) {
  body.appendChild(txt('h2', 'br-ph', text));
  if (state) body.appendChild(chip(state, word));
}
function panel(body) { const p = C.el('div', 'br-panel'); body.appendChild(p); return p; }
function line(parent, head, sub, right) {
  const d = C.el('div', 'br-line');
  const l = C.el('span', 'br-line-l');
  l.appendChild(txt('b', null, head));
  if (sub) { l.appendChild(C.el('br')); l.appendChild(txt('span', 'br-small', sub)); }
  d.appendChild(l);
  if (right) d.appendChild(typeof right === 'string' ? txt('span', 'br-line-r', right) : right);
  parent.appendChild(d);
  return d;
}
function note(body, text) { body.appendChild(txt('p', 'br-small br-note', text)); }

// A square's page: its rows, the same as Sources, with Details (how far back, understanding more), Remove and Needs you.
async function groupPage(body, s, lede) {
  const rows = rowsOf(reading).filter(s.keep);
  title(body, s.title, rows.length ? stateOf(rows) : 'none');
  if (lede) body.appendChild(txt('p', 'br-lede', lede));
  const box = C.el('div', 'br-rows'); body.appendChild(box);
  const drawn = await C.drawGroup(box, C.viewDeps(), s.keep);
  if (!drawn.length) box.replaceChildren(txt('p', 'quiet', s.key === 'downloads' ? 'Nothing brought in yet.' : 'Nothing connected here yet.'));
  return drawn;
}

const STEP = {
  c: ['Connected', 'Your mailboxes, drives, calendar, contacts and systems are linked. You signed in with each company; the Tool never sees your passwords.'],
  f: ['Searchable', 'Everything is read once so you can find it and quote it, by meaning, not only by words. Search works on whatever is searchable.'],
  u: ['Understood', 'Each email and file is turned into facts: who, what, how much, when, each with the sentence it came from, tied to the company or person. Only then can the Tool count, total and compare across them. An item counts as understood only when that is so.'],
  r: ['Ready', 'Everything you chose is connected, searchable and understood, and keeps up every day. Then the Tool says plainly: you are ready.'],
};
const PAGES = {
  step(body, k) {
    const st = steps(reading || {}).find((x) => x.k === k);
    const [name, what] = STEP[k] ?? ['Step', ''];
    title(body, name);
    body.appendChild(txt('p', 'br-lede', what));
    if (st) { const q = panel(body); line(q, st.big, st.sub, null); }
    const d = reading?.road;
    if (d && k === 'f') {
      const q = panel(body), M = d.mail, F = d.files;
      line(q, 'Emails', num(M.emails) + ' since ' + String(M.from).slice(0, 4) + ', all searchable', null);
      line(q, 'Mail attachments', num(M.attach_read) + ' read ' + DOT + ' ' + num(M.attach_left != null ? M.attach_left : M.attach_waiting) + ' waiting to be read ' + DOT + ' ' + num(M.attach_cannot) + ' could not be read ' + DOT + ' ' + num(M.attach_held) + ' held by a privacy rule', null);
      line(q, 'Drive files', num(F.read) + ' read ' + DOT + ' ' + num(F.not_read) + ' not read yet ' + DOT + ' ' + num(F.waiting) + ' waiting ' + DOT + ' ' + num(F.waiting_yes) + ' waiting for your yes', null);
      note(body, 'Left out by design and not counted: ' + num(M.attach_by_design) + ' mail attachments (pictures, automatic mail, copies) and ' + num(F.by_design) + ' drive files (pictures, videos, folders you left out, deleted).');
      const ch = C.el('div', 'br-chips');
      for (const [k, w] of [['mail', 'See Mail'], ['drives', 'See Drives']]) { const b = C.el('button', 'go ghost'); b.type = 'button'; b.textContent = w; b.addEventListener('click', () => openPage(k)); ch.appendChild(b); }
      body.appendChild(ch);
    }
    if (d && k === 'u') {
      const q = panel(body), U = d.understood;
      line(q, 'Emails understood', null, num(U.mail));
      line(q, 'Files understood', 'Contracts read so far, and files about people', num(U.files));
      line(q, 'People understood from your records', 'Title and employer facts with the line they came from', num(U.records));
      note(body, 'Everything else is searchable or sorted (what kind it is, who may see it), not understood. Understanding the rest is your choice, priced first, on AI and costs.');
      const pr = understandProgress(C, reading);
      if (pr) body.appendChild(pr);
      if (reading?.owner) { const b = C.el('button', 'go'); b.type = 'button'; b.textContent = 'Choose and See the Price'; b.classList.add('br-leave'); b.addEventListener('click', () => { closePage(); showTab('ai'); C.$('#br-und')?.scrollIntoView({ block: 'start' }); }); body.appendChild(b); }
    }
    if (k === 'c') { const b = C.el('button', 'go ghost'); b.type = 'button'; b.textContent = 'Add a Source'; b.addEventListener('click', () => openPage('add')); body.appendChild(b); }
  },
  health(body) {
    const H = reading?.health;
    if (!H || reading.healthErr) { title(body, 'Health', 'unknown'); body.appendChild(txt('p', 'br-lede', 'The Tool could not read its own health just now. It tries again in a few minutes.')); return; }
    title(body, 'Health', H.overall === 'healthy' ? 'healthy' : H.overall === 'needs_you' ? 'needs_you' : 'fixing', H.word);
    body.appendChild(txt('p', 'br-lede', 'The Tool checks itself, so you do not have to. A check that fails shows here in plain words and stays until it passes.'));
    const p = panel(body);
    const AREA = { ok: 'ok', fixing: 'fixing', red: 'red', needs_you: 'needs_you' };
    for (const a of (H.areas ?? [])) line(p, a.name, a.say, chip(AREA[a.state] ?? 'unknown', a.state === 'ok' ? 'Passing' : a.state === 'needs_you' ? 'Needs You' : 'Being Fixed'));
    const items = H.studio?.items ?? [];
    const seen = new Set();
    const fixing = items.filter((x) => x.state !== 'said' && !seen.has(x.say) && seen.add(x.say));
    const said = items.filter((x) => x.state === 'said' && !seen.has(x.say) && seen.add(x.say));
    if (fixing.length) { body.appendChild(txt('h3', 'br-h3', 'What Is Being Fixed')); const q = panel(body); for (const x of fixing) line(q, x.say, x.since ? 'Since ' + new Date(x.since).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '', chip(x.state === 'fixing' ? 'fixing' : 'red')); }
    if (said.length) { body.appendChild(txt('h3', 'br-h3', 'Good to Know')); const q = panel(body); for (const x of said) line(q, x.say, '', null); }
    const fixed = H.repairs ?? [];
    if (fixed.length) { body.appendChild(txt('h3', 'br-h3', 'Fixed on Its Own in the Last Day')); const q = panel(body); for (const r of fixed.slice(0, 8)) line(q, r.what, r.at ? when(r.at) : '', null); }
    if (H.checked_at) note(body, 'Last checked ' + new Date(H.checked_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '.');
  },
  month(body) {
    const ai = reading?.ai;
    title(body, 'This Month So Far');
    if (!ai) { body.appendChild(txt('p', 'br-lede', reading?.aiErr ? 'Could not be read just now: ' + String(reading.aiErr) + '.' : 'Still reading.')); return; }
    if (!C.aiBlocks?.boughtLines) { body.appendChild(txt('p', 'br-lede', 'Still loading. Press Brain and open it again in a moment.')); return; }
    const p = ai.plain || {};
    body.appendChild(txt('p', 'br-lede', String(p.month || '') + '. At the AI companies' + String.fromCharCode(8217) + ' exact prices.'));
    const q = panel(body);
    if (p.adds_up === true) q.appendChild(C.aiBlocks.boughtLines(p.lines, p.this_month_usd, C.el, true));
    else q.appendChild(txt('p', 'quiet', 'The three parts do not add up to this month' + String.fromCharCode(8217) + 's total (' + (usd(p.check_usd) ?? 'unknown') + ' on the meter), so they are not shown. This is being looked at.'));
    if (p.sentence) q.appendChild(txt('p', 'br-small', String(p.sentence)));
    if (ai.limit) body.appendChild(C.aiBlocks.limitBlock(ai.limit, { el: C.el, askBody: C.askBody }, () => drawRoom(true).then(() => openPage('month'))));
    const more = C.el('button', 'go ghost'); more.type = 'button'; more.textContent = 'Month by Month, Day by Day, and Which AI Does What'; more.classList.add('br-leave');
    more.addEventListener('click', () => C.door('ai'));
    body.appendChild(more);
  },
  balance(body) {
    const ai = reading?.ai;
    title(body, 'AI Balance');
    if (!ai) { body.appendChild(txt('p', 'br-lede', reading?.aiErr ? 'Could not be read just now: ' + String(reading.aiErr) + '.' : 'Still reading.')); return; }
    if (!C.aiBlocks?.balance) { body.appendChild(txt('p', 'br-lede', 'Still loading. Press Brain and open it again in a moment.')); return; }
    const p = ai.plain || {};
    body.appendChild(C.aiBlocks.balance(p.balance || {}, p, C.el));
    note(body, 'Adding to the balance from a card is not built yet; the studio adds to it for you.');
  },
  // MAIL (picture; seat brain-status-2): its level, the files attached to older mail with Read them and their progress, then
  // each mailbox with Details (Read further, with the understanding prices), Open in Mail and Remove.
  async mail(body) {
    const R = reading || {};
    const s = sq('mail');
    const mine = rowsOf(R).filter(s.keep);
    const lv = mine.length ? level(s, mine, R) : null;
    const d = R.road;
    title(body, 'Mail', mine.length ? stateOf(mine) : 'none');
    if (d) body.appendChild(txt('p', 'br-lede', num(mine.length) + (mine.length === 1 ? ' mailbox' : ' mailboxes') + ', ' + String(d.mail.from).slice(0, 4) + ' to today. ' + num(d.mail.emails) + ' emails, all searchable; ' + num(d.understood.mail) + ' understood. ' + num(d.mail.attach_read) + ' attached files read.'));
    if (lv) { const bar = C.el('span', 'br-lvl'); bar.setAttribute('aria-hidden', 'true'); const u = C.el('i', 'br-ku'); u.style.width = lv.u.toFixed(1) + '%'; const f = C.el('i', 'br-kf'); f.style.width = Math.max(0, lv.f).toFixed(1) + '%'; bar.append(u, f); body.appendChild(bar); }
    const files = C.el('div', 'br-press'); body.appendChild(files);
    if (R.prog) filesBlock(C, files, R, () => drawRoom(true).then(() => { if (pageOpen()) openPage('mail'); }));
    else files.appendChild(txt('p', 'br-small', 'How many files wait in each mailbox could not be read just now.'));
    const box = C.el('div', 'br-rows'); body.appendChild(box);
    const drawn = await C.drawGroup(box, C.viewDeps(), s.keep);
    if (!drawn.length) box.replaceChildren(txt('p', 'quiet', 'Nothing connected here yet.'));
    note(body, 'On each mailbox: Details (how far back, and what understanding it would cost), Open in Mail, Remove. Understanding all of your mail at once is on AI and costs, Getting started.');
  },
  // DRIVES (picture): how well the Tool knows them, in two tabs; the Drive tab is where she browses and organizes them.
  drives(body) {
    title(body, 'Drives', rowsOf(reading).some((r) => r.group === 'drives') ? stateOf(rowsOf(reading).filter((r) => r.group === 'drives')) : 'none');
    const top = C.el('div', 'br-chips');
    const open = C.el('button', 'go ghost'); open.type = 'button'; open.textContent = 'Open the Drive Tab'; open.classList.add('br-leave'); open.addEventListener('click', () => { closePage(); C.door('drives'); });
    top.appendChild(open);
    body.append(txt('p', 'br-lede', 'Here: how well the Tool knows your drives. The Drive tab is where you browse them.'), top);
    const tabs = C.el('div', 'br-ptabs'); tabs.setAttribute('role', 'tablist');
    const v1 = C.el('div', 'br-rows'), v2 = C.el('div', 'br-rows'); v2.hidden = true;
    const show = (k) => { for (const b of tabs.children) { const on = b.dataset.pt === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); } v1.hidden = k !== 'd1'; v2.hidden = k !== 'd2'; if (k === 'd2' && !v2.dataset.drawn) { v2.dataset.drawn = '1'; C.drawOrganize(v2, { sb: C.sb, el: C.el }); } };
    for (const [k, w] of [['d1', 'Drives and Folders'], ['d2', 'Organize']]) { const b = C.el('button', 'br-tab'); b.type = 'button'; b.dataset.pt = k; b.textContent = w; b.setAttribute('role', 'tab'); b.addEventListener('click', () => show(k)); tabs.appendChild(b); }
    body.append(tabs, v1, v2);
    show('d1');
    C.drawDrives(v1, C.viewDeps());
  },
  // QUICKBOOKS (picture): the books arrive as records (amounts, dates and customers are fields), as of the last check.
  async books(body) {
    await groupPage(body, sq('books'), 'Invoices, payments and bills arrive as records from QuickBooks, as they are kept there. QuickBooks stays the record; nothing is written back.');
  },
  chats(body) {
    const c = reading?.conn;
    title(body, 'Chats');
    body.appendChild(txt('p', 'br-lede', c?.ok ? (c.saves ? num(c.saves) + ' conversations and documents saved from your own AI, searchable. ' : 'Nothing saved from your own AI yet. ') + 'You can also bring in an export of your chats.' : 'Saved AI chats and imports.'));
    const b = C.el('button', 'go ghost'); b.type = 'button'; b.textContent = 'Open Chats'; b.classList.add('br-leave'); b.addEventListener('click', () => { closePage(); C.door('chats'); });
    body.appendChild(b);
  },
  loose(body) {
    const rows = rowsOf(reading).filter((r) => r.group === 'loose');
    title(body, 'Loose Files', rows.length ? stateOf(rows) : 'empty', rows.length ? null : 'Empty');
    body.appendChild(txt('p', 'br-lede', 'Files that live nowhere else. Pick them to see what reading them would cost; nothing is sent or read to count them.'));
    const st = C.el('div'); body.appendChild(st);
    if (C.stageLoose) C.stageLoose(st);
  },
  assistadd(body) {
    title(body, 'Connect an Assistant');
    const h = C.el('div', 'br-rows'); body.appendChild(h);
    if (C.connectAssistant) C.connectAssistant(h); else h.appendChild(txt('p', 'quiet', 'This part could not be loaded.'));
  },
  calendar(body) { return groupPage(body, sq('calendar')); },
  contacts(body) { return groupPage(body, sq('contacts'), 'Business contacts are kept. Only you see your own address book.'); },
  async systems(body) {
    await groupPage(body, sq('systems'), 'Connected now. To add one, choose it below.');
    body.appendChild(txt('h3', 'br-h3', 'Add a System'));
    const q = panel(body);
    for (const [kind, ready, coming] of SYSTEM_KINDS) {
      const d = C.el('div', 'br-kind');
      d.appendChild(txt('b', 'br-kind-n', kind));
      const td = C.el('div', 'br-ready');
      for (const name of ready) { const bt = C.el('button', 'go ghost br-mini'); bt.type = 'button'; bt.textContent = name; bt.setAttribute('translate', 'no'); bt.setAttribute('aria-label', 'Connect ' + name); bt.addEventListener('click', () => C.connectSystem(name)); td.appendChild(bt); }
      if (ready.length) d.appendChild(td);
      if (coming) d.appendChild(txt('span', 'br-small', 'Coming: ' + coming));
      q.appendChild(d);
    }
    // Your Google sign-in, folded (picture): what Google allowed for mail, drive, calendar, contacts, and sign in again.
    const g = C.el('details', 'br-fold'); const gs = C.el('summary'); gs.textContent = 'Your Google Sign-In'; g.appendChild(gs);
    const gb = C.el('div'); g.appendChild(gb); body.appendChild(g);
    g.addEventListener('toggle', () => { if (g.open && !gb.dataset.drawn && C.googleSignin) { gb.dataset.drawn = '1'; C.googleSignin(gb); } });
    const all = C.el('button', 'go ghost'); all.type = 'button'; all.textContent = 'Systems in Full'; all.classList.add('br-leave');
    all.addEventListener('click', () => { closePage(); C.door('systems'); });
    body.appendChild(all);
  },
  downloads(body) { return groupPage(body, sq('downloads'), 'A whole download from a system, read once: the Tool recognizes what it is and files everything in the right place.'); },
  add(body) {
    title(body, 'Add a Source');
    body.appendChild(txt('p', 'br-lede', 'Choose what to add. You sign in on their page, not ours, and see the price before anything is read.'));
    addMoved = C.openAdd(body);
  },
  assist(body, arg) {
    const name = arg?.name || 'Your assistant';
    title(body, name + ', connected', 'connected');
    const q = panel(body);
    line(q, 'Who', null, C.me()?.name || 'You');
    line(q, 'What it can see', 'Exactly what you can open in the Tool, and nothing more', chip('ok', 'Same as You'));
    line(q, 'What it can do', 'Find and read your emails, files, records, contacts and meetings; save chats and documents back, with your yes', null);
    line(q, 'Cost', 'It thinks on your own ' + name + ' plan; the business pays only for finding', null);
    const list = arg?.list ?? [];
    line(q, 'Connected', list.length > 1 ? 'Approved ' + list.length + ' times' : null, list.length ? 'since ' + new Date(list[list.length - 1].since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
    const c = reading?.conn;
    if (c?.ok) line(q, 'Saved from it', null, c.last_save ? num(c.saves) + ', last on ' + new Date(c.last_save).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Nothing yet');
    note(body, 'This shows your own connections. To stop it, remove HireKraft under Connectors in your ' + name + '.');
  },
  db(body) {
    title(body, 'Your Database', reading?.src?.ok ? 'answering' : 'unknown', reading?.src?.ok ? 'Answering' : 'Not Checked');
    const q = panel(body);
    line(q, 'Your own database, at Supabase', 'It answered just now, when this tab read your sources', null);
    const v = reading?.src;
    line(q, 'What it holds', 'Every email, file and record the Tool read, with what the AI labelled', v?.ok ? num(v.counts?.total) + ' sources' : '');
    note(body, 'Cancel any time. Your brain stays yours.');
  },
};

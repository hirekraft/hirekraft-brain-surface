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
const CHIP = { up_to_date: ['Up to date', 'ok'], reading: ['Reading', 'read'], needs_you: ['Needs you', 'warn'], none: ['Not connected', 'off'],
  empty: ['Empty', 'off'], connected: ['Connected', 'ok'], healthy: ['Healthy', 'ok'], fixing: ['Being fixed', 'read'],
  red: ['Being fixed', 'read'], ok: ['Passing', 'ok'], said: ['Good to know', 'off'], answering: ['Answering', 'ok'], unknown: ['Not checked', 'off'] };
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
  { key: 'drives', title: 'Drives', icon: 'folder', keep: (r) => r.group === 'drives', one: 'drive or folder', many: 'drives and folders', door: 'drives' },
  { key: 'calendar', title: 'Calendar', icon: 'cal', keep: (r) => r.group === 'calendar', one: 'calendar', many: 'calendars' },
  { key: 'contacts', title: 'Contacts', icon: 'person', keep: (r) => r.group === 'contacts', one: 'address book', many: 'address books' },
  { key: 'systems', title: 'Systems', icon: 'plug', keep: (r) => r.group === 'systems' && r.what !== ONCE, one: 'system', many: 'systems', names: true },
  { key: 'chats', title: 'Chats', icon: 'chat', door: 'chats' },
  { key: 'downloads', title: 'Downloads', icon: 'box', keep: (r) => r.group === 'systems' && r.what === ONCE, one: 'brought in', many: 'brought in' },
  { key: 'scans', title: 'Scans and photos', icon: 'photo' },
  { key: 'loose', title: 'Loose files', icon: 'file', keep: (r) => r.group === 'loose', one: 'file set', many: 'file sets', door: 'loose' },
  { key: 'add', title: 'Add a source', icon: 'plus' },
];

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
  ];
  if (owner) jobs.push(C.askBody({ ai_tab: true }).then((r) => { if (r && r.ok === true && r.ai && r.ai.ok === true) R.ai = r.ai; else R.aiErr = r?.error ?? r?.ai?.error ?? 'no reason was given'; }, (e) => { R.aiErr = e?.message ?? e; }));
  // each part is painted as its reading lands, so the slow AI reading never holds the sources back
  reading = R;
  jobs.forEach((j) => j.then(() => { if (reading === R) paint(); }));
  await Promise.all(jobs);
}

function build(host) {
  host.dataset.built = '1';
  host.innerHTML = '';
  const room = C.el('div', 'br-room');
  room.id = 'br-view';
  const status = C.el('header', 'br-status'); status.id = 'br-status';
  status.append(txt('p', 'br-lab', 'Your brain'), txt('h2', 'br-head', 'Reading your brain'));
  const tiles = C.el('section', 'br-tiles'); tiles.id = 'br-tiles'; tiles.setAttribute('aria-label', 'At a glance');
  const conn = C.el('section', 'br-sec');
  conn.append(txt('h3', 'br-h', 'What is connected'));
  const grid = C.el('div', 'br-grid'); grid.id = 'br-squares'; conn.appendChild(grid);
  const asst = C.el('section', 'br-sec'); asst.id = 'br-assist-sec';
  asst.append(txt('h3', 'br-h', 'AI assistants connected to your brain'));
  const ag = C.el('div', 'br-grid'); ag.id = 'br-assist'; asst.appendChild(ag);
  const ai = C.el('section', 'br-sec'); ai.id = 'br-ai-sec'; ai.hidden = true;
  ai.append(txt('h3', 'br-h', 'Your AI, this month'));
  const layers = C.el('div', 'br-layers'); layers.id = 'br-layers'; ai.appendChild(layers);
  const db = C.el('section', 'br-sec');
  db.append(txt('h3', 'br-h', 'Your database'));
  const dbb = C.el('button', 'br-card br-db'); dbb.type = 'button'; dbb.id = 'br-db';
  dbb.addEventListener('click', () => openPage('db'));
  db.appendChild(dbb);
  const how = C.el('button', 'br-card br-how'); how.type = 'button';
  const hl = C.el('span');
  hl.append(txt('b', null, 'See how your brain works'), C.el('br'), txt('span', 'br-small', 'The picture and the story, any time'));
  how.append(hl, txt('span', 'br-go', ARROW_GO));
  how.setAttribute('aria-label', 'See how your brain works');
  how.addEventListener('click', () => C.openStory());   // How the Tool works, the story of seat brain-tab-setup (decision 1084)
  room.append(status, tiles, conn, asst, ai, db, how);
  const page = C.el('div', 'br-page'); page.id = 'br-page'; page.hidden = true;
  const back = C.el('button', 'go ghost br-back'); back.type = 'button'; back.textContent = ARROW_BACK + ' Brain';
  back.addEventListener('click', closePage);
  const body = C.el('div', 'br-page-body'); body.id = 'br-page-body';
  page.append(back, body);
  host.append(room, page);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !C.$('#br-page')?.hidden && C.$('#s-summary') && !C.$('#s-summary').hidden) closePage(); });
}

function paint() {
  const R = reading;
  if (!R) return;
  paintStatus(R); paintTiles(R); paintSquares(R); paintAssist(R); paintLayers(R); paintDb(R);
}

function rowsOf(R) { return R.src?.ok ? (R.src.rows ?? []) : []; }

function paintStatus(R) {
  const box = C.$('#br-status');
  if (!box) return;
  const head = txt('h2', 'br-head', '');
  const lines = [];
  if (R.srcErr || (R.src && !R.src.ok)) {
    head.textContent = 'Your sources could not be read just now.';
    lines.push(txt('p', 'br-small', 'This is the reading failing, not your brain being empty. It tries again on its own.'));
  } else if (!R.src) {
    head.textContent = 'Reading your brain';
  } else {
    const need = rowsOf(R).filter((r) => r.state === 'needs_you');
    const h = R.health?.overall;
    if (need.length) head.textContent = 'Everything else is running. ' + (need.length === 1 ? '1 thing needs you.' : need.length + ' things need you.');
    else if (h === 'healthy') head.textContent = 'Everything is running.';
    else if (h === 'needs_you') head.textContent = 'Everything is connected. One thing needs a person.';
    else if (h === 'fixing') head.textContent = 'Everything is connected. A few things are being fixed, nothing for you to do.';
    else head.textContent = 'Everything is connected.';
    for (const r of need.slice(0, 3)) {
      const p = C.el('p', 'br-need');
      p.appendChild(C.el('span', 'br-dot br-warn'));
      const t = C.el('span'); t.textContent = (r.name ? r.name + ': ' : '') + (r.line || 'needs you.');
      p.appendChild(t);
      if (r.action) {
        const b = C.el('button', 'go ghost br-fix'); b.type = 'button'; b.textContent = r.action;
        b.addEventListener('click', () => C.viewDeps().act(r, () => openPage(squareOf(r)?.key ?? 'mail'), b));
        p.appendChild(b);
      }
      lines.push(p);
    }
  }
  box.replaceChildren(txt('p', 'br-lab', 'Your brain'), head, ...lines);
}

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
  // HEALTH: the Tool's own reading, shown as it is, red included (brief: show the real state in plain words)
  const H = R.health;
  if (R.healthErr || (H && H.ok === false && !H.word)) out.push(tile('health', 'heart', 'Health', 'Not checked', 'off', 'Could not be read just now'));
  else if (!H) out.push(tile('health', 'heart', 'Health', 'Checking', 'off', ' '));
  else {
    const tone = H.overall === 'healthy' ? 'ok' : H.overall === 'needs_you' ? 'warn' : 'read';
    const red = (H.areas ?? []).filter((a) => a.state !== 'ok').length;
    out.push(tile('health', 'heart', 'Health', H.word || 'Not checked', tone,
      red ? red + (red === 1 ? ' area' : ' areas') + ' being looked at' + (H.checked_at ? ' ' + DOT + ' checked ' + when(H.checked_at) : '') : 'Checked ' + (H.checked_at ? when(H.checked_at) : 'often')));
  }
  // THIS MONTH and AI BALANCE: owner only; the AI tab's own reading
  if (R.owner) {
    const p = R.ai?.plain;
    if (R.aiErr) out.push(tile('month', 'coin', 'This month so far', 'Not read', 'off', 'Could not be read just now'));
    else if (!p) out.push(tile('month', 'coin', 'This month so far', ' ', null, 'Reading'));
    else {
      const total = Number(p.this_month_usd) || 0;
      const bar = C.el('span', 'br-bar'); bar.setAttribute('aria-hidden', 'true');
      if (p.adds_up === true && total > 0) for (const l of (p.lines ?? [])) {
        const s = C.el('span', 'br-l-' + (l.key || 'x')); s.style.width = Math.max(0, (Number(l.usd) || 0) / total * 100).toFixed(1) + '%'; bar.appendChild(s);
      }
      const L = R.ai.limit || {};
      out.push(tile('month', 'coin', 'This month so far', usd(total) ?? '$0.00', null,
        String(p.month || 'This month') + ' ' + DOT + ' ' + (L.set === true ? 'your limit ' + usd0(L.limit_usd) : 'no monthly limit set'), bar));
      const b = p.balance || {};
      if (!b.set_up) out.push(tile('balance', 'wallet', 'AI balance', 'None', 'off', 'No prepaid balance set up'));
      else {
        const low = b.state === 'low' || b.state === 'answers_within_margin' || b.state === 'stopped_at_zero';
        out.push(tile('balance', 'wallet', 'AI balance', usd0(Math.max(0, Number(b.left_usd) || 0)) ?? '$0', low ? 'warn' : null,
          b.state === 'stopped_at_zero' ? 'Used up' : (low ? 'Low' : 'Left') + (b.lasts_days !== null && b.lasts_days !== undefined ? ' ' + DOT + ' about ' + b.lasts_days + ' days at this pace' : '')));
      }
    }
  }
  box.classList.toggle('br-one', out.length === 1);
  box.replaceChildren(...out);
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

function square(s, line, st, word, onClick) {
  const b = C.el('button', 'br-sq' + (st === 'needs_you' ? ' br-sq-warn' : '')); b.type = 'button';
  b.dataset.square = s.key;
  const t = C.el('span', 'br-ttl'); t.append(sym(s.icon), txt('span', 'br-t', s.title));
  b.append(t, txt('span', 'br-l', line));
  if (st) b.appendChild(chip(st, word));
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
    out.push(square(s, line, st));
  }
  box.replaceChildren(...out);
}

function paintAssist(R) {
  const box = C.$('#br-assist');
  if (!box) return;
  const c = R.conn;
  const out = [];
  const add = { key: 'assistadd', title: 'Connect an assistant', icon: 'plus', door: 'chats/connect' };
  if (R.connErr || (c && !c.ok)) out.push(square({ key: 'assist', title: 'Your assistants', icon: 'chat' }, 'Could not be read just now', 'unknown'));
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
  const L = [['find', 'finds', 'Find', 'find', 'Search by meaning'], ['understand', 'understands', 'Understand', 'tag', 'Labels what comes in'], ['reason', 'thinks', 'Reason', 'chat', 'Answers and drafts']];
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

function paintDb(R) {
  const b = C.$('#br-db');
  if (!b) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 56 56'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'br-db-ic');
  svg.innerHTML = '<ellipse cx="28" cy="44" rx="20" ry="6" class="br-db-f"/><rect x="8" y="14" width="40" height="30" class="br-db-f" stroke="none"/><line x1="8" y1="14" x2="8" y2="44" class="br-db-s"/><line x1="48" y1="14" x2="48" y2="44" class="br-db-s"/><ellipse cx="28" cy="14" rx="20" ry="6" class="br-db-top"/>';
  const t = C.el('span', 'br-db-t');
  t.append(txt('b', null, 'Your own database, at Supabase'), txt('span', 'br-small', 'Everything the Tool read and labelled ' + DOT + ' yours to keep'));
  // the state is what this page just saw: the database answered (or did not) the reading of your sources
  const st = R.src?.ok ? chip('answering') : R.srcErr ? chip('unknown', 'Did not answer') : chip('unknown', 'Checking');
  st.classList.add('br-right');
  b.replaceChildren(svg, t, st);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PAGES. Each one opens on the Brain tab, in place of the room; the back button and Escape return to the room where she was.

let roomScroll = 0;
let addMoved = null;   // the Add a source part while it sits on the page
export function openPage(key, arg) {
  const s = SQUARES.find((x) => x.key === key);
  if (s?.door) { C.door(s.door); return; }
  if (key === 'assistadd') { C.door('chats/connect'); return; }
  const view = C.$('#br-view'), page = C.$('#br-page'), body = C.$('#br-page-body');
  if (!view || !page || !body) return;
  roomScroll = window.scrollY;
  putAddBack();
  body.replaceChildren();
  view.hidden = true; page.hidden = false;
  window.scrollTo({ top: 0 });
  const P = PAGES[key];
  if (P) P(body, arg); else body.appendChild(txt('p', 'quiet', 'This page is not there.'));
  page.querySelector('.br-back')?.focus({ preventScroll: true });
}
export function closePage() {
  const view = C.$('#br-view'), page = C.$('#br-page');
  if (!view || !page || page.hidden) return;
  putAddBack();
  page.hidden = true; view.hidden = false;
  try { if (location.hash.startsWith('#brain/')) history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* link stays */ }
  window.scrollTo({ top: roomScroll });
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

const PAGES = {
  health(body) {
    const H = reading?.health;
    if (!H || reading.healthErr) { title(body, 'Health', 'unknown'); body.appendChild(txt('p', 'br-lede', 'The Tool could not read its own health just now. It tries again in a few minutes.')); return; }
    title(body, 'Health', H.overall === 'healthy' ? 'healthy' : H.overall === 'needs_you' ? 'needs_you' : 'fixing', H.word);
    body.appendChild(txt('p', 'br-lede', 'The Tool checks itself, so you do not have to. A check that fails shows here in plain words and stays until it passes.'));
    const p = panel(body);
    const AREA = { ok: 'ok', fixing: 'fixing', red: 'red', needs_you: 'needs_you' };
    for (const a of (H.areas ?? [])) line(p, a.name, a.say, chip(AREA[a.state] ?? 'unknown', a.state === 'ok' ? 'Passing' : a.state === 'needs_you' ? 'Needs you' : 'Being fixed'));
    const items = H.studio?.items ?? [];
    const seen = new Set();
    const fixing = items.filter((x) => x.state !== 'said' && !seen.has(x.say) && seen.add(x.say));
    const said = items.filter((x) => x.state === 'said' && !seen.has(x.say) && seen.add(x.say));
    if (fixing.length) { body.appendChild(txt('h3', 'br-h3', 'What is being fixed')); const q = panel(body); for (const x of fixing) line(q, x.say, x.since ? 'Since ' + new Date(x.since).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '', chip(x.state === 'fixing' ? 'fixing' : 'red')); }
    if (said.length) { body.appendChild(txt('h3', 'br-h3', 'Good to know')); const q = panel(body); for (const x of said) line(q, x.say, '', null); }
    const fixed = H.repairs ?? [];
    if (fixed.length) { body.appendChild(txt('h3', 'br-h3', 'Fixed on its own in the last day')); const q = panel(body); for (const r of fixed.slice(0, 8)) line(q, r.what, r.at ? when(r.at) : '', null); }
    if (H.checked_at) note(body, 'Last checked ' + new Date(H.checked_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '.');
  },
  month(body) {
    const ai = reading?.ai;
    title(body, 'This month so far');
    if (!ai) { body.appendChild(txt('p', 'br-lede', reading?.aiErr ? 'Could not be read just now: ' + String(reading.aiErr) + '.' : 'Still reading.')); return; }
    if (!C.aiBlocks?.boughtLines) { body.appendChild(txt('p', 'br-lede', 'Still loading. Press Brain and open it again in a moment.')); return; }
    const p = ai.plain || {};
    body.appendChild(txt('p', 'br-lede', String(p.month || '') + '. At the AI makers' + String.fromCharCode(8217) + ' exact prices.'));
    const q = panel(body);
    if (p.adds_up === true) q.appendChild(C.aiBlocks.boughtLines(p.lines, p.this_month_usd, C.el, true));
    else q.appendChild(txt('p', 'quiet', 'The three parts do not add up to this month' + String.fromCharCode(8217) + 's total (' + (usd(p.check_usd) ?? 'unknown') + ' on the meter), so they are not shown. This is being looked at.'));
    if (p.sentence) q.appendChild(txt('p', 'br-small', String(p.sentence)));
    if (ai.limit) body.appendChild(C.aiBlocks.limitBlock(ai.limit, { el: C.el, askBody: C.askBody }, () => drawRoom(true).then(() => openPage('month'))));
    const more = C.el('button', 'go ghost'); more.type = 'button'; more.textContent = 'Month by month, day by day, and which AI does what';
    more.addEventListener('click', () => C.door('ai'));
    body.appendChild(more);
  },
  balance(body) {
    const ai = reading?.ai;
    title(body, 'AI balance');
    if (!ai) { body.appendChild(txt('p', 'br-lede', reading?.aiErr ? 'Could not be read just now: ' + String(reading.aiErr) + '.' : 'Still reading.')); return; }
    if (!C.aiBlocks?.balance) { body.appendChild(txt('p', 'br-lede', 'Still loading. Press Brain and open it again in a moment.')); return; }
    const p = ai.plain || {};
    body.appendChild(C.aiBlocks.balance(p.balance || {}, p, C.el));
    note(body, 'Adding to the balance from a card is not built yet; the studio adds to it for you.');
  },
  mail(body) { return groupPage(body, SQUARES[0], 'Each mailbox, how far back it goes, and its state. Open Details on a mailbox to see what reading older mail would cost and to choose how far back.'); },
  calendar(body) { return groupPage(body, SQUARES[2]); },
  contacts(body) { return groupPage(body, SQUARES[3], 'Business contacts are kept. Only you see your own address book.'); },
  async systems(body) {
    await groupPage(body, SQUARES[4], 'Connected now. To add one, choose it below.');
    body.appendChild(txt('h3', 'br-h3', 'Add a system'));
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
    const all = C.el('button', 'go ghost'); all.type = 'button'; all.textContent = 'Systems in full, with your Google sign-in';
    all.addEventListener('click', () => C.door('systems'));
    body.appendChild(all);
  },
  downloads(body) { return groupPage(body, SQUARES[6], 'A whole download from a system, read once: the Tool recognizes what it is and files everything in the right place.'); },
  add(body) {
    title(body, 'Add a source');
    body.appendChild(txt('p', 'br-lede', 'Choose what to add. You sign in on their page, not ours, and see the price before anything is read.'));
    addMoved = C.openAdd(body);
  },
  assist(body, arg) {
    const name = arg?.name || 'Your assistant';
    title(body, name + ', connected', 'connected');
    const q = panel(body);
    line(q, 'Who', null, C.me()?.name || 'You');
    line(q, 'What it can see', 'Exactly what you can open in the Tool, and nothing more', chip('ok', 'Same as you'));
    line(q, 'What it can do', 'Find and read your emails, files, records, contacts and meetings; save chats and documents back, with your yes', null);
    line(q, 'Cost', 'It thinks on your own ' + name + ' plan; the business pays only for finding', null);
    const list = arg?.list ?? [];
    line(q, 'Connected', list.length > 1 ? 'Approved ' + list.length + ' times' : null, list.length ? 'since ' + new Date(list[list.length - 1].since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
    const c = reading?.conn;
    if (c?.ok) line(q, 'Saved from it', null, c.last_save ? num(c.saves) + ', last on ' + new Date(c.last_save).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Nothing yet');
    note(body, 'This shows your own connections. To stop it, remove HireKraft under Connectors in your ' + name + '.');
  },
  db(body) {
    title(body, 'Your database', reading?.src?.ok ? 'answering' : 'unknown', reading?.src?.ok ? 'Answering' : 'Not checked');
    const q = panel(body);
    line(q, 'Your own database, at Supabase', 'It answered just now, when this tab read your sources', null);
    const v = reading?.src;
    line(q, 'What it holds', 'Every email, file and record the Tool read, with what the AI labelled', v?.ok ? num(v.counts?.total) + ' sources' : '');
    note(body, 'Cancel any time. Your brain stays yours.');
  },
};

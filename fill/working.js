// fill/working.js - ALL RUNNING WORK, ONE SMALL INDICATOR (seat work-indicator, 2026-11-12; decision 1152 point 1, words 1155).
// Part of SHOW; it adds no mechanism of its own.
//
// A quiet chip in the header, the same on every screen (setup and every tab): "Working: 2 things". It opens the list: each
// piece of background work with what it is, done of total, the pace as measured, and the time left at that pace. It moves
// by itself. When a line has not moved it says so plainly ("Nothing has moved for 12 minutes") and gives no time.
// Nothing running: no chip (healthy is silent). What finished while she was here stays in the list for three minutes.
//
// NOTHING HERE COUNTS, PACES OR ESTIMATES. Every number is the brain's, from ONE reading: work_running() (brain file
// 2026-11-12-work-indicator-1), read as the signed-in person. The owner sees all of it; anyone else their own sources.
// A brain that does not carry the reading yet shows no chip. A reading that fails while work was showing says
// "could not be read just now" and keeps the last numbers, marked as such; a failure is never shown as nothing running.
//
// OTHER SCREENS READ THE SAME READING, NEVER A SECOND ONE: after each answer this file sets window.toolWork and sends the
// document event 'tool:work' (detail: the answer). A screen that just started something sends 'tool:work-refresh'.
// fill/scans.js shows each drive's pictures from it.
// The working sign is seat working-sign's (.working, .working-bar), not a second one.
// The brain is called with then(ok, failed), never with catch on the call itself (STANDING-CLAUSES, decision 1145).
// No regex literals and no backslashes (STANDING-CLAUSES).

let C = null;
let W = null;            // the latest good answer
let failed = null;       // why the latest reading failed, while there is something to show
let absent = false;      // this brain does not carry the reading
let timer = null;
let reading = null;
let seq = 0;
let host = null, chip = null, list = null;
let open = false;
let prev = new Map();    // key -> item, from the answer before
let finished = [];       // { item, at }

const DOT = String.fromCharCode(183);
const FAST = 20000, SLOW = 90000, KEEP = 180000;
const num = (n) => Number(n || 0).toLocaleString('en-US');

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
function name(text) { const s = el('b', 'wk-name', text); s.setAttribute('translate', 'no'); return s; }

// What it is, in her words. The Tool's words and the name are separate pieces, so the words can be in her language and the
// name stays as it is.
export function workTitle(it) {
  const f = document.createDocumentFragment();
  if (it.kind === 'pictures') { f.append(el('span', null, 'Reading pictures in'), ' ', name(it.name || 'a drive')); }
  else if (it.kind === 'searchable') { f.append(el('span', null, 'Making searchable:'), ' ', name(it.name || 'a source')); }
  else if (it.kind === 'understand') { f.append(el('span', null, 'Understanding your mail and files')); }
  else if (it.kind === 'agreements') { f.append(el('span', null, 'Reading agreements')); }
  else if (it.kind === 'privacy') { f.append(el('span', null, 'Privacy check on newly searchable items')); }
  else { f.append(el('span', null, 'Working')); }
  return f;
}

// "about 8 minutes left", "about 3 hours left": the brain's minutes, said in the largest plain unit.
export function leftWords(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || minutes === null || minutes === undefined) return null;
  if (m <= 1) return ['about a minute left'];
  if (m < 90) return ['about', num(m), 'minutes left'];
  const h = Math.round(m / 6) / 10;
  if (h < 36) return ['about', h.toLocaleString('en-US'), 'hours left'];
  return ['about', (Math.round(h / 2.4) / 10).toLocaleString('en-US'), 'days left'];
}

// The numbers of one item as a line of pieces: 35 of 233 . 13 a minute . about 15 minutes left
export function workFacts(it) {
  const p = el('span', 'wk-facts');
  const n = (v) => { const s = el('span', 'wk-n', num(v)); s.setAttribute('translate', 'no'); return s; };
  p.append(n(it.done), ' ', el('span', null, 'of'), ' ', n(it.total));
  if (it.state === 'stalled') {
    const s = el('span', 'wk-stall');
    s.append(el('span', null, 'Nothing has moved for'), ' ', n(it.idle_minutes), ' ', el('span', null, Number(it.idle_minutes) === 1 ? 'minute' : 'minutes'));
    p.append(' ' + DOT + ' ', s);
  } else {
    if (Number(it.per_minute) > 0) { const s = el('span', 'wk-n', Number(it.per_minute).toLocaleString('en-US')); s.setAttribute('translate', 'no'); p.append(' ' + DOT + ' ', s, ' ', el('span', null, 'a minute')); }
    else p.append(' ' + DOT + ' ', el('span', null, 'pace not measured yet'));
    const l = leftWords(it.minutes_left);
    if (l) { p.append(' ' + DOT + ' '); l.forEach((w, i) => { if (i) p.append(' '); if (i === 1 && l.length === 3) { const s = el('span', 'wk-n', w); s.setAttribute('translate', 'no'); p.append(s); } else p.append(el('span', null, w)); }); }
  }
  if (Number(it.not_read) > 0) { p.append(' ' + DOT + ' ', n(it.not_read), ' ', el('span', null, 'could not be read')); }
  return p;
}

export function workBar(it) {
  const bar = el('span', 'working-bar wk-bar');
  const fill = el('span');
  const t = Number(it.total) || 0;
  fill.style.width = (t > 0 ? Math.max(0, Math.min(100, Math.round(100 * Number(it.done || 0) / t))) : 0) + '%';
  bar.appendChild(fill);
  bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(t)); bar.setAttribute('aria-valuenow', String(Number(it.done || 0)));
  return bar;
}

function items() { return (W && Array.isArray(W.items)) ? W.items : []; }

function paint() {
  if (!host) return;
  const now = Date.now();
  finished = finished.filter((f) => now - f.at < KEEP);
  const its = items();
  const n = its.length;
  const stalled = its.filter((x) => x.state === 'stalled').length;
  const show = !absent && (n > 0 || finished.length > 0 || (failed && prev.size > 0));
  host.hidden = !show;
  if (!show) { if (open) toggle(false); return; }

  chip.replaceChildren();
  chip.classList.toggle('wk-still', n === 0 || stalled === n);
  const sign = el('span', n > 0 && stalled < n ? 'working no-late wk-sign' : 'wk-sign');
  if (failed) sign.append(el('span', null, 'Working:'), ' ', el('span', null, 'could not be read just now'));
  else if (n === 0) sign.append(el('span', null, 'Finished just now'));
  else {
    const c = el('span', 'wk-n', num(n)); c.setAttribute('translate', 'no');
    sign.append(el('span', null, 'Working:'), ' ', c, ' ', el('span', null, n === 1 ? 'thing' : 'things'));
  }
  chip.appendChild(sign);
  if (!failed && stalled > 0) {
    const s = el('span', 'wk-stall'); const c = el('span', 'wk-n', num(stalled)); c.setAttribute('translate', 'no');
    s.append(c, ' ', el('span', null, 'not moving'));
    chip.append(' ' + DOT + ' ', s);
  }
  chip.setAttribute('aria-expanded', open ? 'true' : 'false');

  if (!open) return;
  list.replaceChildren(el('p', 'wk-head', 'What the Tool is working on'));
  if (failed) list.appendChild(el('p', 'wk-note wk-stall', 'This could not be read just now, so the numbers below are from the last reading. It is the reading failing, not the work stopping.'));
  const ul = el('ul', 'wk-items');
  for (const it of its) {
    const li = el('li', 'wk-item' + (it.state === 'stalled' ? ' wk-item-still' : ''));
    li.dataset.key = it.key;
    const t = el('p', 'wk-what'); t.appendChild(workTitle(it));
    li.append(t, workBar(it), workFacts(it));
    ul.appendChild(li);
  }
  for (const f of finished) {
    const li = el('li', 'wk-item wk-item-done');
    const t = el('p', 'wk-what'); t.append(el('span', 'wk-fin', 'Finished:'), ' ', workTitle(f.item));
    li.appendChild(t);
    ul.appendChild(li);
  }
  if (!its.length && !finished.length) ul.appendChild(el('li', 'wk-item', 'Nothing is running right now.'));
  list.appendChild(ul);
  list.appendChild(el('p', 'wk-note', 'Counts and pace are measured as the work runs. A time is given only once the pace is measured.'));
}

function toggle(to) {
  open = to === undefined ? !open : !!to;
  if (list) list.hidden = !open;
  paint();
  if (open) tick(true);
}

function mount() {
  const head = document.querySelector('.masthead');
  if (!head || host) return;
  host = el('div', 'wk'); host.id = 'working'; host.hidden = true;
  chip = el('button', 'wk-chip'); chip.type = 'button'; chip.id = 'wk-chip';
  chip.setAttribute('aria-controls', 'wk-list'); chip.setAttribute('aria-expanded', 'false');
  list = el('div', 'wk-list'); list.id = 'wk-list'; list.hidden = true;
  list.setAttribute('role', 'region'); list.setAttribute('aria-label', 'What the Tool is working on'); list.setAttribute('aria-live', 'polite');
  host.append(chip, list);
  const who = head.querySelector('#whoami');
  if (who) head.insertBefore(host, who); else head.appendChild(host);
  chip.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener('click', (e) => { if (open && !host.contains(e.target)) toggle(false); });
  document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') { toggle(false); chip.focus(); } });
}

function took(data) {
  const now = Date.now();
  const next = new Map();
  for (const it of (Array.isArray(data.items) ? data.items : [])) next.set(it.key, it);
  for (const [k, it] of prev) if (!next.has(k) && !finished.some((f) => f.item.key === k)) finished.push({ item: it, at: now });
  finished = finished.filter((f) => !next.has(f.item.key));
  prev = next;
  W = data; failed = null; absent = false;
  window.toolWork = data;
  try { document.dispatchEvent(new CustomEvent('tool:work', { detail: data })); } catch (_) { /* a listener's own trouble is not this file's */ }
}

function read() {
  if (reading) return reading;
  const mine = ++seq;
  const done = () => { if (mine === seq) reading = null; };
  reading = C.sb.rpc('work_running').then(({ data, error }) => {
    if (mine !== seq) return;                 // a newer reading was asked for; this answer is the older one
    done();
    if (error) {
      const code = String(error.code || ''), msg = String(error.message || '');
      if (code === 'PGRST202' || code === '42883' || msg.includes('work_running')) { absent = true; W = null; failed = null; window.toolWork = null; return; }
      failed = msg || 'no reason was given'; return;
    }
    if (!data || data.ok !== true) {
      // refused (not signed in): nobody to show it to, so nothing is shown; anything else is a failed reading
      if (data && data.reason === 'unbound') { W = null; failed = null; prev = new Map(); window.toolWork = null; return; }
      failed = (data && data.note) || 'no reason was given'; return;
    }
    took(data);
  }, (e) => { if (mine !== seq) return; done(); failed = (e && e.message) || String(e); });
  return reading;
}

function tick(now) {
  if (!C) return;
  if (timer) { clearTimeout(timer); timer = null; }
  if (document.hidden && !now) return;
  read().then(() => {
    paint();
    if (timer) clearTimeout(timer);
    if (absent) return;                       // this brain has no such reading: nothing to wait for
    timer = setTimeout(() => tick(), (items().length > 0 || open || finished.length > 0) ? FAST : SLOW);
  });
}

export function initWorking(ctx) {
  if (C) return;
  C = ctx;
  window.toolWorkParts = { facts: workFacts, bar: workBar, title: workTitle };   // one wording of a line of work, for any screen that shows one
  mount();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(true); });
  document.addEventListener('tool:work-refresh', () => { reading = null; seq++; tick(true); });
  tick(true);
}

export function workNow() { return W; }

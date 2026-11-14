// fill/today.js - TODAY: WHAT CAME IN AND WHETHER THE TOOL IS KEEPING UP (seat keeping-up, 2026-11-14; decision 1176). Part of SHOW.
//
// After setup (the cutoff, decision 1174) the Tool reads and understands what comes in every day on its own. This shows it: on the
// Brain tab, first, a card "Today" (Yesterday and Last 7 Days one tap away): what came in per kind (emails, attachments, files,
// records, meetings), how much is searchable, how much was understood, what could not be read and why, what it cost, and whether
// every source is keeping up (and if not, which and why). One line of the same in the Working list (fill/working.js todayLine).
//
// NOTHING HERE COUNTS. Every number is the brain's, from ONE reading: keeping_up(p_days, p_zone) (brain file
// 2026-11-14-keeping-up-1), read as the signed-in person, in the time zone she chose (fill/dates.js zone()). Owner only: the
// brain refuses anyone else with a reason, and then this card is not shown (as the AI and costs tab). A reading that fails says
// so, never an empty day. The Brain card and the Working line share the reading (one call a minute at most).
// Making searchable is priced at the measured price per item (the brain says 'estimated'); understanding is what the meter shows.
// The brain is called with then(ok, failed), never with catch on the call itself (STANDING-CLAUSES, decision 1145).
// No regex literals and no backslashes (STANDING-CLAUSES).

import { zone } from './dates.js?v=2026-10-22-dates';

const DOT = String.fromCharCode(183);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const KEEP = 60000;

let got = null;        // { at, data } the latest answer (refused or not)
let failed = null;     // why the latest reading failed
let pending = null;
let tried = 0;         // when the latest reading was asked for, so a failing reading is not asked again at once
let view = 'today';    // today | yesterday | week

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
function n(v) { const s = el('b', 'td-n', num(v)); s.setAttribute('translate', 'no'); return s; }
function money(v) {
  const x = Number(v || 0);
  const s = el('b', 'td-n', x > 0 && x < 0.01 ? 'under $0.01' : '$' + x.toFixed(2));
  s.setAttribute('translate', 'no');
  return s;
}

// ONE READING, shared. fresh: ask again even if the last answer is under a minute old.
export function readToday(sb, fresh) {
  if (pending) return pending;
  if (!fresh && got && Date.now() - got.at < KEEP) return Promise.resolve(got.data);
  tried = Date.now();
  pending = sb.rpc('keeping_up', { p_days: 8, p_zone: zone() }).then(({ data, error }) => {
    pending = null;
    if (error) { failed = error.message || 'no reason was given'; return got ? got.data : null; }
    failed = null; got = { at: Date.now(), data };
    return data;
  }, (e) => { pending = null; failed = (e && e.message) || String(e); return got ? got.data : null; });
  return pending;
}

// the day (or the seven days) asked for, added up the same way the brain adds a day
function pick(data, which) {
  const days = Array.isArray(data?.days) ? data.days : [];
  if (which === 'today') return days.find((d) => d.which === 'today') || null;
  if (which === 'yesterday') return days.find((d) => d.which === 'yesterday') || null;
  const seven = days.slice(0, 7);
  if (!seven.length) return null;
  const keys = ['emails', 'attachments', 'files', 'records', 'meetings', 'came_in', 'searchable', 'set_aside', 'waiting', 'could_not_read',
    'chosen_to_understand', 'understood', 'could_not_understand', 'understand_waiting', 'cost_usd'];
  const t = { which: 'week', reasons: [], sources: [] };
  for (const k of keys) t[k] = seven.reduce((a, d) => a + Number(d[k] || 0), 0);
  const rs = new Map();
  for (const d of seven) for (const r of (d.reasons || [])) { const key = r.group + '|' + r.reason; rs.set(key, { group: r.group, reason: r.reason, n: (rs.get(key)?.n || 0) + Number(r.n || 0) }); }
  t.reasons = [...rs.values()].sort((a, b) => b.n - a.n);
  const ss = new Map();
  for (const d of seven) for (const s of (d.sources || [])) {
    const o = ss.get(s.source_key) || { source_key: s.source_key, name: s.name, type: s.type };
    for (const k of keys) o[k] = Number(o[k] || 0) + Number(s[k] || 0);
    ss.set(s.source_key, o);
  }
  t.sources = [...ss.values()];
  return t;
}

// "20 emails, 5 files came in", as pieces so the words can be in her language and the numbers stay as they are
function cameIn(d) {
  const p = el('span', 'td-came');
  const parts = [['emails', 'email', 'emails'], ['attachments', 'attachment', 'attachments'], ['files', 'file', 'files'], ['records', 'record', 'records'], ['meetings', 'meeting', 'meetings']]
    .filter(([k]) => Number(d[k]) > 0);
  if (!parts.length) { p.appendChild(el('span', null, 'Nothing new came in')); return p; }
  parts.forEach(([k, one, many], i) => { if (i) p.append(', '); p.append(n(d[k]), ' ', el('span', null, Number(d[k]) === 1 ? one : many)); });
  p.append(' ', el('span', null, 'came in'));
  return p;
}

// the one line: came in · searchable · understood · could not be read · cost
export function lineOf(d) {
  const p = el('p', 'td-line');
  p.appendChild(cameIn(d));
  const walk = Number(d.emails || 0) + Number(d.attachments || 0) + Number(d.files || 0);
  const bits = [];
  if (walk > 0) {
    if (Number(d.searchable) === walk) bits.push(el('span', 'td-ok', 'all searchable'));
    else { const s = el('span'); s.append(n(d.searchable), ' ', el('span', null, 'searchable')); bits.push(s); }
    if (Number(d.set_aside) > 0) { const s = el('span'); s.append(n(d.set_aside), ' ', el('span', null, 'set aside')); bits.push(s); }
    if (Number(d.waiting) > 0) { const s = el('span'); s.append(n(d.waiting), ' ', el('span', null, 'waiting')); bits.push(s); }
  }
  if (Number(d.chosen_to_understand) > 0) {
    const s = el('span'); s.append(n(d.understood), ' ', el('span', null, 'understood')); bits.push(s);
    if (Number(d.understand_waiting) > 0) { const w = el('span'); w.append(n(d.understand_waiting), ' ', el('span', null, 'waiting to be understood')); bits.push(w); }
  }
  const bad = Number(d.could_not_read || 0) + Number(d.could_not_understand || 0);
  if (bad > 0) { const s = el('span', 'td-bad'); s.append(n(bad), ' ', el('span', null, 'could not be read')); bits.push(s); }
  if (walk > 0 || Number(d.chosen_to_understand) > 0) bits.push(money(d.cost_usd));
  for (const b of bits) p.append(' ' + DOT + ' ', b);
  return p;
}

const REASON_HEAD = { could_not_read: 'Could not be read', could_not_understand: 'Could not be understood', set_aside: 'Set aside' };

function reasonsOf(d) {
  const box = el('div', 'td-why');
  const rs = (d.reasons || []).filter((r) => Number(r.n) > 0);
  if (!rs.length) return null;
  for (const r of rs) {
    const p = el('p', 'td-reason' + (r.group === 'set_aside' ? '' : ' td-bad'));
    p.append(el('span', null, REASON_HEAD[r.group] || 'Not read'), ': ', n(r.n), ' ' + DOT + ' ', el('span', null, r.reason || 'no reason was given'));
    box.appendChild(p);
  }
  return box;
}

function perSource(d) {
  const ss = (d.sources || []).filter((s) => Number(s.came_in) > 0 || Number(s.chosen_to_understand) > 0);
  if (!ss.length) return null;
  const det = el('details', 'td-src');
  det.appendChild(el('summary', null, 'Each Source'));
  for (const s of ss) {
    const row = el('div', 'td-srow');
    const nm = el('b', 'td-sname', s.name || s.source_key); nm.setAttribute('translate', 'no');
    row.append(nm, lineOf(s));
    det.appendChild(row);
  }
  return det;
}

// KEEPING UP: green when every source is within its promised time; otherwise each source behind, with the brain's reason
function verdict(data) {
  const box = el('div', 'td-verdict');
  if (data.keeping_up === true) {
    box.classList.add('td-good');
    box.append(el('span', 'td-dot'), el('b', null, 'Keeping Up'), ' ', el('span', null, 'Everything new is made searchable within an hour, and what you chose to be understood within a day.'));
    return box;
  }
  box.classList.add('td-behind');
  const head = el('p', 'td-vh'); head.append(el('span', 'td-dot'), el('b', null, 'Not Keeping Up'));
  box.appendChild(head);
  for (const b of (data.behind || [])) box.appendChild(el('p', 'td-vline', b.say || 'A source is behind its promised time.'));
  return box;
}

// THE CARD on the Brain tab. host: the section; sb: the database client. Hidden for anyone the brain refuses, and before setup's cutoff.
export function drawToday(host, sb, fresh) {
  if (!host) return Promise.resolve();
  if (!host.dataset.built) {
    host.dataset.built = '1';
    host.setAttribute('aria-live', 'polite');
  }
  return readToday(sb, fresh).then((data) => paintCard(host, sb, data));
}

function paintCard(host, sb, data) {
  if (!data && !failed) { host.hidden = true; return; }
  if (data && data.ok !== true) { host.hidden = true; return; }               // refused (not the owner, not signed in): the brain's reason, not shown here
  if (data && data.state === 'setup') { host.hidden = true; return; }         // before the cutoff there is no keeping up yet
  host.hidden = false;
  const top = el('div', 'td-top');
  const h = el('h2', 'br-ph', view === 'today' ? 'Today' : view === 'yesterday' ? 'Yesterday' : 'Last 7 Days');
  const seg = el('div', 'td-seg'); seg.setAttribute('role', 'tablist');
  for (const [k, w] of [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last 7 Days']]) {
    const b = el('button', 'td-tab' + (k === view ? ' on' : ''), w); b.type = 'button';
    b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', k === view ? 'true' : 'false');
    b.addEventListener('click', () => { view = k; paintCard(host, sb, got ? got.data : data); });
    seg.appendChild(b);
  }
  top.append(h, seg);
  const out = [top];
  if (!data) {
    out.push(el('p', 'br-small td-bad', 'What came in could not be read just now: ' + String(failed) + '. This is the reading failing, not nothing arriving. It tries again on its own.'));
    host.replaceChildren(...out);
    return;
  }
  const d = pick(data, view);
  if (!d) out.push(el('p', 'br-small', 'This day is from before setup finished, so it is counted as setup, not as keeping up.'));
  else {
    out.push(lineOf(d));
    const why = reasonsOf(d); if (why) out.push(why);
    const ps = perSource(d); if (ps) out.push(ps);
  }
  out.push(verdict(data));
  const note = el('p', 'br-small br-note');
  note.append(el('span', null, 'Mail counts on the day it was sent, files on the day the Tool found them.'), ' ',
    el('span', null, 'Making things searchable is priced at the measured price per item; understanding is what the AI company charged.'));
  if (failed) note.append(' ', el('span', 'td-bad', 'The latest reading failed, so these are the numbers from the reading before.'));
  out.push(note);
  host.replaceChildren(...out);
}

// ONE LINE in the Working list. Returns the line drawn from the latest answer (or null: nothing to show, or not the owner) and
// asks again when that answer is over a minute old; onFresh is called when a new answer lands, so the list can paint again.
export function todayLine(sb, onFresh) {
  const stale = (!got || Date.now() - got.at >= KEEP) && Date.now() - tried >= KEEP;
  if (stale && !pending) readToday(sb, true).then(() => { if (onFresh) onFresh(); });
  const data = got ? got.data : null;
  if (!data || data.ok !== true || data.state === 'setup') return null;
  const d = pick(data, 'today');
  if (!d) return null;
  const p = el('div', 'wk-today');
  const h = el('p', 'wk-what'); h.append(el('b', null, 'Today'), ' ', el('span', data.keeping_up === true ? 'td-ok' : 'td-bad', data.keeping_up === true ? 'Keeping Up' : 'Not Keeping Up'));
  p.append(h, lineOf(d));
  return p;
}

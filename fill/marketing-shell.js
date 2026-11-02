// fill/marketing-shell.js - THE MARKETING AND SALES TAB'S SHELL (seat marketing-build-a, 2026-11-02, decision 1059; design round 2,
// artifact Ha5qD1aq92RUxXAiwzY9h3 v7, approved). Part of SHOW.
//
// WHAT IT DOES FOR HER. One line says where the week stands; the four steps (Plan, Sending, What came back, Signals) and the
// three helpers beside them (Lists, Website, What this reads) are one row; ONE card says the next thing to do, from today's plan,
// with its one button. "Viewing as" picks whose items lead (hers by default); it never widens what she may see: every item comes
// from the brain's own door (mk_plan_week, as the signed-in person), and items she may not open are counted, not hidden.
// THE MOUNT CONTRACT (agreed with seat marketing-build-b, 2026-11-02): each part file exports mount(el, ctx); ctx = { sb, el, url,
// key, viewer, who, lang, t, week, go, note, refresh, handoff }. A file may instead register window.MK_PARTS[name] = { mount }. The
// shell knows each file by one line in PARTS below; marketing-build-b keeps the lines of its own files (send, lists, back).
// Words are written in English; words.js puts them in her language on the page (t is the identity, kept for the contract).
// No colour, size or font here (skin.css, MARKETING SHELL). No regex literals, no backslashes.

import { screenLang } from './words.js?v=2026-10-29-thinkrooms-3';

const PARTS = [
  { key: 'foundation', label: 'Foundation', step: 1, file: './marketing-foundation.js?v=2026-11-02-marketing-vault' }, /* seat marketing-vault's entry (decision 1060): the foundation comes first */ { key: 'plan', label: 'Plan', step: 2, file: './marketing-plan.js?v=2026-11-02-plan-fixes' },
  { key: 'send', label: 'Sending', step: 3, file: './marketing-send.js?v=2026-11-02-marketing-build-b', legacy: 'drawSend' },   // marketing-build-b's line
  { key: 'back', label: 'What came back', step: 4, file: './marketing-back.js?v=2026-11-02-marketing-build-b', legacy: 'drawBack' }, // marketing-build-b's line
  { key: 'signals', label: 'Signals', step: 5 },
  { key: 'lists', label: 'Lists', file: './marketing-lists.js?v=2026-11-02-marketing-build-b' },                                    // marketing-build-b's line
  { key: 'website', label: 'Website', file: './marketing-website.js?v=2026-11-02-plan-fixes' },
  { key: 'reads', label: 'What this reads' },
];

const WEEK = './marketing-week.js?v=2026-11-02-marketing-week'; let C = null, S = null;   // WEEK: this week's finished pieces above the Plan board (seat marketing-week, decision 1060). C: the tab's context from lens.js; S: { week, data, who, part, handoff, own, note }
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const dayName = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' }); };
const shortDay = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const addDays = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const dow = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return ((d.getDay() + 6) % 7) + 1; };   // Monday 1 .. Sunday 7

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

// WHOSE an item is: the plan names owners by first name ("Erin", "Alex"); an item with no owner is everyone's.
export function isWhose(it, who) { if (!who) return true; const o = String(it.owned_by || '').trim().toLowerCase(); return o !== '' && o.split(' ')[0] === who.toLowerCase(); }
export function ownerNames(d) {
  const set = new Map();
  for (const it of [...((d && d.items) || []), ...((d && d.every) || [])]) {
    const o = String(it.owned_by || '').trim().split(' ')[0];
    if (o) set.set(o.toLowerCase(), o);
  }
  return [...set.values()].sort();
}

// THE NEXT STEP: the first open item of hers today (dated before weekly, posts and emails before the rest); else the first open item
// today nobody owns; else her first open item on a later day this week. Returned with why it was chosen, so the card can say it.
const KIND_RANK = { post: 0, email: 1, page: 2, campaign: 3, follow_up: 4, other: 5 };
export function nextStep(d, who) {
  if (!d || d.ok !== true) return null;
  const today = d.today, week = d.week_of, end = addDays(week, 6);
  const open = (x) => x.state === 'open';
  const rank = (a, b) => (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9);
  const dated = (day) => (d.items || []).filter((x) => open(x) && x.day === day);
  const weekly = (day) => (d.every || []).filter((x) => open(x) && (x.days || []).includes(dow(day)));
  const inWeek = today >= week && today <= end;
  const days = inWeek ? [today] : [week];
  for (let k = 1; k < 7; k++) { const nd = addDays(days[0], k); if (nd <= end) days.push(nd); }
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const mine = [...dated(day).filter((x) => isWhose(x, who)).sort(rank), ...weekly(day).filter((x) => isWhose(x, who)).sort(rank)];
    if (mine.length) return { it: mine[0], day, when: i === 0 && inWeek ? 'today' : 'later', more: mine.length - 1 };
    if (i === 0 && inWeek) {
      const nobody = dated(day).filter((x) => !String(x.owned_by || '').trim()).sort(rank);
      if (nobody.length) return { it: nobody[0], day, when: 'today', more: nobody.length - 1, nobody: true };
    }
  }
  return { it: null };
}

export async function drawShell(body, ctx, own) {
  C = ctx;
  S = { week: null, data: null, who: null, part: 'plan', handoff: null, own, note: null };
  body.innerHTML = '';
  const wrap = mk('div', 'mk mk2');
  const top = mk('div', 'mk2-top');
  const status = mk('p', 'mk2-status'); status.setAttribute('aria-live', 'polite');
  const viewing = mk('label', 'mk2-viewing');
  viewing.appendChild(mk('span', null, 'Viewing as'));
  const sel = C.el('select'); sel.className = 'mk-hand-pick'; sel.setAttribute('aria-label', 'Viewing as');
  viewing.appendChild(sel);
  top.append(status, viewing);
  const path = mk('nav', 'mk2-path'); path.setAttribute('aria-label', 'Marketing and sales');
  const next = mk('section', 'mk2-next'); next.setAttribute('aria-live', 'polite');
  const stage = mk('div', 'mk-stage');
  const weekBox = mk('div', 'mk-week-host'); wrap.append(top, path, next, weekBox, stage);   // weekBox: seat marketing-week
  body.appendChild(wrap);
  S.els = { status, sel, path, next, stage, weekBox };
  for (const p of PARTS) {
    const b = mk('button', 'mk2-step' + (p.step ? '' : ' mk2-aside')); b.type = 'button'; b.dataset.part = p.key;
    if (p.step) { const n = mk('span', 'mk2-step-n', String(p.step)); n.translate = false; b.appendChild(n); }
    b.appendChild(mk('span', null, p.label));
    b.addEventListener('click', () => go(p.key));
    path.appendChild(b);
  }
  sel.addEventListener('change', () => { S.who = sel.value || null; drawTop(); go(S.part, S.handoff, true); });
  status.textContent = 'Reading this week’s plan';
  await loadWeek(null);
  go('plan');
}

async function loadWeek(week) {
  const r = await rpc('mk_plan_week', { p_week: week });
  S.data = r;
  if (r && r.ok === true) {
    S.week = r.week_of;
    if (S.who === null) {
      const names = ownerNames(r), me = String((r.me && r.me.first) || '');
      S.who = names.some((x) => x.toLowerCase() === me.toLowerCase()) ? names.find((x) => x.toLowerCase() === me.toLowerCase()) : '';
    }
  }
  drawTop();
  return r;
}

function drawTop() {
  const { status, sel, next } = S.els;
  const d = S.data;
  sel.innerHTML = '';
  const names = d && d.ok === true ? ownerNames(d) : [];
  const all = C.el('option'); all.value = ''; all.textContent = 'Everyone'; sel.appendChild(all);
  for (const n of names) { const o = C.el('option'); o.value = n; o.textContent = n; o.translate = false; if (n === S.who) o.selected = true; sel.appendChild(o); }
  if (!d || d.ok !== true) {
    status.className = 'mk2-status stalled';
    status.textContent = 'The plan could not be read just now: ' + String((d && d.reason) || 'no reason was given') + '. Nothing here is a claim either way.';
    next.innerHTML = '';
    return;
  }
  // THE LINE COUNTS WHAT THE BOARD SHOWS (seat plan-fixes, 2026-11-02): dated items, and each weekly item once per day it falls on
  // (once for 'any day'), for the person viewed; the week tabs count the same way (the brain's weeks[].by).
  const mine = (d.items || []).filter((x) => isWhose(x, S.who));
  const weekly = (d.every || []).filter((x) => isWhose(x, S.who));
  const occ = (x) => Math.max((x.days || []).length, 1);
  const closed = (x) => x.state === 'done' || x.state === 'skipped';
  const total = mine.length + weekly.reduce((n, x) => n + occ(x), 0);
  const done = mine.filter(closed).length + weekly.filter(closed).reduce((n, x) => n + occ(x), 0);
  const today = mine.filter((x) => x.day === d.today).length + weekly.filter((x) => (x.days || []).includes(dow(d.today))).length;
  const bits = ['Week of ' + shortDay(d.week_of) + ': ' + total + (S.who ? ' for ' + S.who : ' planned') + ', ' + done + ' done'];
  if (d.today >= d.week_of && d.today <= addDays(d.week_of, 6)) bits.push(today + ' today');
  if (Number(d.held_back)) bits.push(d.held_back + ' held back from you');
  status.className = 'mk2-status';
  status.textContent = bits.join(' · ') + '.';
  drawNext();
}

function drawNext() {
  const { next } = S.els;
  next.innerHTML = '';
  const d = S.data;
  const n = nextStep(d, S.who);
  if (!n) return;
  next.appendChild(mk('p', 'eyebrow', 'Next step'));
  if (S.note) { next.appendChild(mk('p', S.note.bad ? 'stalled' : 'state', S.note.text)); S.note = null; }
  if (!n.it) {
    next.appendChild(mk('p', 'mk2-next-line', S.who ? 'Nothing open for ' + S.who + ' this week.' : 'Nothing open this week.'));
  } else {
    if (n.when !== 'today' && S.data.today >= S.data.week_of) next.appendChild(mk('p', 'state', S.who ? 'Nothing of ' + S.who + '’s is open today. Next:' : 'Nothing is open today. Next:'));
    const line = mk('p', 'mk2-next-line');
    line.append(mk('span', null, n.when === 'today' ? 'Today:' : dayName(n.day) + ':'), document.createTextNode(' '), data_('span', 'mk2-next-title', n.it.title));
    next.appendChild(line);
    const meta = [n.it.channel || 'Other'];
    if (n.it.cadence) meta.push(n.it.cadence);
    if (n.nobody) meta.push('nobody named for it');
    else if (n.it.owned_by) meta.push('for ' + n.it.owned_by);
    if (n.more > 0) meta.push(n.more + ' more ' + plural(n.more, 'item', 'items') + ' ' + (n.when === 'today' ? 'today' : 'that day'));
    next.appendChild(data_('p', 'mk-item-meta', meta.join(' · ')));
    const acts = mk('div', 'mk-acts');
    const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
    next.append(acts, said);
    import(PARTS.find((x) => x.key === 'plan').file).then((M) => { if (M.fireButton) acts.appendChild(M.fireButton(n.it, said, ctxFor('plan'))); }).catch(() => {});
  }
  if (Number(d.held_back)) next.appendChild(mk('p', 'state', d.held_back + ' ' + plural(d.held_back, 'item this week comes', 'items this week come') + ' from chats private to the person who saved them, or not shared with you, so ' + plural(d.held_back, 'it is', 'they are') + ' not shown. They appear when the chat is shared.'));
}

function ctxFor(key) {
  return { sb: C.sb, el: C.el, $: C.$, url: C.url, key: C.key, viewer: C.viewer, who: S.who, lang: screenLang(), t: (s) => s,
    week: S.data, handoff: key === S.part ? S.handoff : null,
    go: (k, h) => go(k, h), note: (text, bad) => { S.note = { text, bad }; drawNext(); }, refresh: async (week) => { await loadWeek(week === undefined ? S.week : week); return S.data; } };
}

async function go(key, handoff, same) {
  const { path, stage } = S.els;
  S.part = key; S.handoff = handoff || null;
  for (const b of path.children) b.setAttribute('aria-current', b.dataset.part === key ? 'step' : 'false');
  stage.innerHTML = '';
  S.els.weekBox.innerHTML = ''; if (key === 'plan') import(WEEK).then((M) => M.mount(S.els.weekBox, ctxFor('week'))).catch((e) => { S.els.weekBox.appendChild(mk('p', 'notice flagged', 'This week’s finished pieces could not be opened: ' + String((e && e.message) || e))); });   // seat marketing-week
  const p = PARTS.find((x) => x.key === key);
  if (key === 'signals') { S.own.signals(stage); return; }
  if (key === 'reads') { S.own.reads(stage); return; }
  const w = mk('p', 'working no-late', 'Opening ' + p.label);
  stage.appendChild(w);
  try {
    const M = await import(p.file);
    w.remove();
    const reg = (window.MK_PARTS && window.MK_PARTS[key]) || null;
    const ctx = ctxFor(key);
    if (typeof M.mount === 'function') await M.mount(stage, ctx);
    else if (reg && typeof reg.mount === 'function') await reg.mount(stage, ctx);
    else if (p.legacy && typeof M[p.legacy] === 'function') await M[p.legacy](stage, { ...C, ...ctx });
    else stage.appendChild(mk('p', 'notice flagged', p.label + ' is not ready yet.'));
  } catch (e) {
    w.remove();
    stage.appendChild(mk('p', 'notice flagged', p.label + ' could not be opened: ' + String((e && e.message) || e)));
  }
}

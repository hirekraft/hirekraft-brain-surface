// fill/today.js - TODAY (seat tool-build-1, 2026-11-03; decisions 1061, 1065, 1067, 1069; design whole-tool-design-3,
// snapshot 2e2adc7e, build order step 2). Part of SHOW. The first framed place: drawn only with fill/frame.js blocks.
//
// One calm page to start the day: ready questions for the Ask box; one card with the date and a line for each status sign
// (the same reading as the corner, so they cannot disagree); Needs you (the brain's attention list, read as her: only what
// she may open); This week (her own calendar and the invitations in her mailboxes: my_week, decision 1067 (1), one press to
// the full calendar); Owed to you for the owner (books_truth: what the books say beside what we believe, the same reading
// Money draws). Every part shows its own working sign and fills when its reading arrives: the attention list takes about
// 5 seconds, so the page and the signs never wait for it (design-3 finding 7). A part that could not be read says so with
// the reason, never an empty card or a zero (rule 7). A record marked test is greyed, carries the Test pill and is never
// counted (rule 8; decision 1067 (4)).
// No regex literals and no backslashes (STANDING-CLAUSES).
import { h, nameSpan, card, list, row, pill, button, link, say, working, pair, words, icon, onSigns, signState } from './frame.js?v=2026-11-03-tool-build-1';

const READY_OWNER = ['Who owes us money?', 'What came in today?', 'Can I pay everyone this month?'];
const READY = ['What do I still owe an answer?', 'What is on this week?', 'Who wrote to me today?'];

let unsub = null;

export function mount(el, ctx) {
  if (unsub) { unsub(); unsub = null; }
  el.textContent = '';
  const root = h('div', 'vf vf-place');
  root.dataset.place = 'today';
  el.appendChild(root);
  const owner = !!ctx.who?.all_access;
  const loc = ctx.lang === 'de' ? 'de-DE' : 'en-US';
  const tz = ctx.tz || 'UTC';

  // Ask first (rule 5): the box itself sits in the frame on every place; these put a ready question into it.
  const ask = h('div', 'vf-ask');
  for (const q of owner ? READY_OWNER : READY) { const b = h('button', 'vf-chip', q); b.type = 'button'; b.addEventListener('click', () => ctx.ask(q)); ask.appendChild(b); }
  root.appendChild(ask);

  // The date and the two signs, one line each.
  let dateText = '';
  try { dateText = new Intl.DateTimeFormat(loc, { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz }).format(new Date()); } catch (_) { dateText = new Date().toDateString(); }
  const top = card(dateText);
  top.head.setAttribute('translate', 'no');
  const status = list();
  top.el.appendChild(status);
  root.appendChild(top.el);
  unsub = onSigns((g) => drawStatus(status, g, ctx));

  const grid = h('div', 'vf-grid');
  root.appendChild(grid);
  const needs = card('Needs you', '');
  needs.el.appendChild(working('Reading what needs you.'));
  grid.appendChild(needs.el);
  const week = card('This week');
  week.el.appendChild(working('Reading your calendar.'));
  grid.appendChild(week.el);

  let owed = null;
  if (owner) { owed = card('Owed to you'); owed.el.appendChild(working('Reading your books.')); root.appendChild(owed.el); }

  const rpc = async (fn, args) => { try { const { data, error } = await ctx.sb.rpc(fn, args ?? {}); return error ? { ok: false, note: error.message } : data; } catch (e) { return { ok: false, note: String(e?.message ?? e) }; } };
  rpc('attention', { p_days: 14 }).then((d) => drawNeeds(needs, d, ctx));
  rpc('my_week', { p_tz: tz }).then((d) => drawWeek(week, d, ctx, loc, tz));
  if (owed) rpc('books_truth').then((d) => drawOwed(owed, d, ctx));
  return root;
}

function clear(c) { while (c.el.childNodes.length > 1) c.el.removeChild(c.el.lastChild); }
const reason = (d, what) => { const r = String(d?.note ?? d?.reason ?? 'No answer came back.'); return what + '. ' + r + (r.endsWith('.') ? '' : '.'); };

function drawStatus(mount, g, ctx) {
  mount.textContent = '';
  const line = (kind, title, s, linkText, go) => {
    const r = h('div', 'vf-status');
    r.dataset.sign = kind; r.dataset.state = s.state;
    const ic = h('span', 'vf-status-ic' + (s.state === 'amber' ? ' amber' : s.state === 'unknown' ? ' unknown' : ''));
    ic.appendChild(icon(kind, 24));
    const t = h('span', 'vf-status-txt');
    t.append(h('span', 'vf-status-t', title), h('span', 'vf-status-s', s.line));
    r.append(ic, t);
    if (s.state === 'amber') r.appendChild(link(linkText, go));
    mount.appendChild(r);
  };
  line('check', 'Is everything okay', g.check, 'Fix', () => ctx.openCheck());
  if (g.shield.state !== 'none') line('shield', 'Security', g.shield, 'Look', () => ctx.go('security'));
}

function drawNeeds(c, d, ctx) {
  clear(c);
  if (!d || d.ok === false) { c.side.hidden = true; c.el.appendChild(say(reason(d, 'What needs you could not be read'), true)); return; }
  const all = (d.items ?? []).concat(d.more ?? []);
  const real = all.filter((it) => !it.test);
  c.side.hidden = !real.length;
  c.side.textContent = real.length === 1 ? '1 thing' : real.length + ' things';
  if (!all.length) c.el.appendChild(say('Nothing needs you right now.'));
  const l = list();
  let shown = 0, firstButton = true;
  for (const it of all) {
    if (shown >= 5) break;
    const title = it.who ? it.who + (it.org && it.org !== it.who ? ' · ' + it.org : '') : (it.what ?? '');
    let right = null;
    if (!it.test) {
      if (firstButton) { right = button('Open', () => ctx.go('email')); firstButton = false; }
      else if (it.is_money) right = pill('act', 'Money');
    }
    l.appendChild(row({ title: words(title, 8), line: words(it.subject ?? it.why ?? '', 12), right, test: !!it.test, nameTitle: true }));
    shown += 1;
  }
  if (shown) c.el.appendChild(l);
  if (real.length > shown) c.el.appendChild(link('Show all ' + real.length, () => ctx.go('email')));
  const held = Number(d.held ?? 0);
  if (held > 0) c.el.appendChild(say(held + (held === 1 ? ' more is' : ' more are') + ' not shown to you, because ' + (held === 1 ? 'it sits' : 'they sit') + ' in mail you may not open.'));
}

function drawWeek(c, d, ctx, loc, tz) {
  clear(c);
  if (!d || d.ok === false) { c.el.appendChild(say(reason(d, 'Your week could not be read'), true)); return; }
  const rows = d.rows ?? [];
  if (d.refused) { c.el.appendChild(say(reason({ note: d.reason }, 'Your week could not be read'), true)); return; }
  if (!d.calendar && !rows.length) {
    c.el.appendChild(say('Your calendar is not connected yet, so no meetings are shown.', true));
    c.el.appendChild(link('Connect your calendar', () => ctx.go('calendar')));
    return;
  }
  const dayKey = (iso) => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso)); } catch (_) { return String(iso).slice(0, 10); } };
  const todayKey = d.today ?? dayKey(new Date().toISOString());
  const byDay = new Map();
  for (const r of rows) { if (!r.start) continue; const k = r.all_day ? String(r.start).slice(0, 10) : dayKey(r.start); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(r); }
  if (!byDay.has(todayKey)) byDay.set(todayKey, []);
  const keys = [...byDay.keys()].sort().slice(0, 5);
  const wk = h('div', 'vf-week');
  for (const k of keys) {
    const day = h('div', 'vf-day' + (k === todayKey ? ' vf-today' : ''));
    let label = 'Today';
    if (k !== todayKey) { try { label = new Intl.DateTimeFormat(loc, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(k + 'T12:00:00Z')); } catch (_) { label = k; } }
    const dd = h('span', 'vf-day-d', label); if (k !== todayKey) dd.setAttribute('translate', 'no');
    const m = h('span', 'vf-day-m');
    const list = byDay.get(k);
    if (!list.length) m.appendChild(h('span', 'vf-small', 'No meetings'));
    for (const r of list.slice(0, 3)) {
      m.appendChild(nameSpan(words(r.title || '(no title)', 8), 'vf-row-t'));
      let when = 'All day';
      if (!r.all_day) { try { when = new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(r.start)); } catch (_) { when = ''; } }
      const s = h('span', 'vf-small', when + (r.from_invitation ? ' · not on your calendar yet' : ''));
      m.appendChild(s);
    }
    if (list.length > 3) m.appendChild(h('span', 'vf-small', (list.length - 3) + ' more'));
    day.append(dd, m);
    wk.appendChild(day);
  }
  c.el.appendChild(wk);
  c.el.appendChild(link('Open the calendar', () => ctx.go('calendar')));
}

function drawOwed(c, d, ctx) {
  clear(c);
  if (!d || d.ok === false) {
    if (d && d.reason === 'not_owner') { c.el.hidden = true; return; }
    c.el.appendChild(say(reason(d, 'What you are owed could not be worked out'), true)); return;
  }
  const de = ctx.lang === 'de';
  const money = (n) => { const x = Math.round(Number(n ?? 0)); return de ? x.toLocaleString('de-DE') + ' $' : '$' + x.toLocaleString('en-US'); };
  const open = Number(d.open_invoices ?? 0), late = Number(d.past_due ?? 0);
  c.el.appendChild(pair(
    { label: 'Your books say', num: money(d.books), line: open + (open === 1 ? ' open invoice, ' : ' open invoices, ') + late + ' past due' },
    { label: 'We believe', num: money(d.believed), line: Number(d.gap ?? 0) > 0 ? 'Less money that arrived' : 'The same as your books' }));
  const n = (d.cleanup ?? []).length;
  c.el.appendChild(link(n ? 'Clean up the books: ' + n : 'Open Money', () => ctx.go('money')));
}

export { signState };

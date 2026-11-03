// fill/frame.js - THE SCREEN FRAME (seat tool-build-1, 2026-11-03; decisions 1061, 1065, 1067, 1069; design
// whole-tool-design-3, snapshot 2e2adc7e). Part of SHOW.
//
// ONE list of the six places, the two status signs in the top corner, and the building blocks every framed place draws
// with. lens.js builds its tabs from PLACES and calls wireSigns() once; a framed place mounts with mount(el, ctx),
// ctx = { sb, who, lang, t, go } (the marketing contract made general). A framed place never sets a font, size, color or
// corner: those live once in the SCREEN FRAME block of skin.css (vf- tokens).
//
// THE AUTOMATIC CHECK (studio-walkers .github/workflows/frame-check.yml, scripts/frame-check/check.py) imports this file
// as served, renders every framed place at 1440 and 390, writes each run to the brain's frame_check_run, and
// frame_check_selftest judges it daily through selftest_run, with a planted run that must turn every rule red.
//
// THE CHECK MARK COUNTS ONLY WHAT THE SIGNED-IN PERSON CAN FIX HERSELF (decision 1069): my_fixes() in the brain. Problems
// that are ours show inside as "We are on it" (tool_health's areas) and never turn it amber. A sign whose reading did
// not come back is dashed and grey, never green (rule 5). The shield is the owner's: places open beyond the company still to decide, from audit_panel,
// the same reading the Security tab draws; anyone else sees no shield.
// No regex literals and no backslashes (STANDING-CLAUSES).

// The six places (decision 1067). framed: drawn in the frame now; step: the build step that brings it in (decision 1067's
// order). Keys are the tab keys lens.js routes (Mail is email, People is contacts), so links and remembered tabs keep working.
// Orders has no page of its own until step 5: it says so and opens For you in Mail, where requirements and enquiries arrive.
export const PLACES = [
  { key: 'today', label: 'Today', framed: true },
  { key: 'email', label: 'Mail', step: 5 },
  { key: 'orders', label: 'Orders', step: 5 },
  { key: 'money', label: 'Money', owner: true, step: 3 },
  { key: 'marketing', label: 'Marketing and sales', step: 4 },
  { key: 'contacts', label: 'People', step: 5 },
];
// The phone's bottom bar (decision 1069): Today, Mail, Marketing and sales, Money, then More (Orders and People inside).
export const PHONE_BAR = ['today', 'email', 'marketing', 'money'];

// ── blocks ──────────────────────────────────────────────────────────────────
export function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
}
// A name or text from her own records: never translated, never judged by the word check (data-name).
export function nameSpan(text, cls) { const s = h('span', cls, text); s.setAttribute('translate', 'no'); s.dataset.name = ''; return s; }
export function card(title, side) {
  const c = h('section', 'vf-card');
  const head = h('div', 'vf-head');
  const t = h('h3', null, title);
  head.appendChild(t);
  const s = h('span', 'vf-side', side ?? '');
  if (side === undefined) s.hidden = true;
  head.appendChild(s);
  c.appendChild(head);
  return { el: c, head: t, side: s };
}
export function list() { return h('div', 'vf-list'); }
// A row: title, one line, and on the right a pill, an amount or one button. A test record is greyed, carries the Test
// pill, and is left out of every count by the caller (rule 8).
export function row({ title, line, right, test, nameTitle }) {
  const r = h('div', 'vf-row' + (test ? ' vf-test' : ''));
  if (test) r.dataset.test = '';
  const txt = h('div', 'vf-row-txt');
  txt.appendChild(nameTitle ? nameSpan(title, 'vf-row-t') : h('span', 'vf-row-t', title));
  if (line) txt.appendChild(h('span', 'vf-row-s', line));
  r.appendChild(txt);
  if (test) r.appendChild(pill('plain', 'Test'));
  else if (right) r.appendChild(right);
  return r;
}
export function pill(kind, text) { return h('span', 'vf-pill ' + kind, text); }
export function button(text, onClick) { const b = h('button', 'vf-button', text); b.type = 'button'; if (onClick) b.addEventListener('click', onClick); return b; }
export function link(text, onClick) { const b = h('button', 'vf-link', text); b.type = 'button'; if (onClick) b.addEventListener('click', onClick); return b; }
export function say(text, refused) { const p = h('p', 'vf-say' + (refused ? ' vf-refused' : ''), text); if (refused) p.dataset.refused = ''; return p; }
export function working(text) { return h('p', 'working', text); }
export function pair(a, b) {
  const g = h('div', 'vf-pair');
  for (const [x, cls] of [[a, ''], [b, 'vf-we']]) {
    const d = h('div', cls);
    d.append(h('div', 'vf-num-label', x.label), h('div', 'vf-num', x.num));
    if (x.line) d.appendChild(h('div', 'vf-num-line', x.line));
    g.appendChild(d);
  }
  return g;
}
// A place not yet in the frame (Orders until build step 5): one card that says where its work is today, one button there.
export function drawWaiting(el, title, line, action, go) {
  el.textContent = '';
  const root = h('div', 'vf vf-place'); root.dataset.place = 'waiting';
  const c = card(title);
  c.el.append(say(line), button(action, go));
  root.appendChild(c.el); el.appendChild(root);
  return root;
}
export function behind(summary) { const d = h('details', 'vf-behind'); d.appendChild(h('summary', null, summary)); return d; }
// Words, counted the way the check counts them: a long line from data is cut at a word, never mid-word.
export function words(text, max) {
  const w = String(text ?? '').split(' ').filter(Boolean);
  return w.length <= max ? w.join(' ') : w.slice(0, max).join(' ') + '…';
}

// ── icons (drawn, no color of their own: currentColor) ───────────────────────
const SVGNS = 'http://www.w3.org/2000/svg';
export function icon(kind, size) {
  const s = document.createElementNS(SVGNS, 'svg');
  const n = String(size ?? 20);
  s.setAttribute('width', n); s.setAttribute('height', n); s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('aria-hidden', 'true');
  const add = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); s.appendChild(e); };
  if (kind === 'check') { add('circle', { cx: '12', cy: '12', r: '9' }); add('path', { d: 'M8 12.5l2.6 2.6L16 9.5' }); }
  else { add('path', { d: 'M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z' }); }
  return s;
}

// ── the two status signs ─────────────────────────────────────────────────────
// state: 'good' | 'amber' | 'unknown' | 'none' (not shown to this person). Read once here; the corner and Today draw the
// same reading, so they cannot disagree.
const signs = {
  check: { state: 'unknown', count: 0, line: 'Checking.', fixes: [], areas: [], at: null },
  shield: { state: 'unknown', count: 0, line: 'Checking.' },
};
const listeners = new Set();
export function signState() { return signs; }
export function onSigns(fn) { listeners.add(fn); fn(signs); return () => listeners.delete(fn); }
function changed() { for (const fn of listeners) { try { fn(signs); } catch (_) { /* one drawer never stops the others */ } } }

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
export async function readSigns(sb, withShield = true) {
  const call = async (fn, args) => { try { const { data, error } = await sb.rpc(fn, args ?? {}); return error ? { ok: false, reason: error.message } : data; } catch (e) { return { ok: false, reason: String(e?.message ?? e) }; } };
  const [fx, th, au] = await Promise.all([call('my_fixes'), call('tool_health'), withShield ? call('audit_panel', { p_tz: 'UTC' }) : null]);
  const c = signs.check;
  c.areas = th && th.ok ? (th.areas ?? []).filter((a) => a.state !== 'ok') : [];
  c.at = th && th.ok ? th.checked_at : null;
  if (!fx || fx.ok !== true || !th || th.ok !== true) {
    c.state = 'unknown'; c.count = 0; c.fixes = [];
    c.line = 'Not checked just now. It will try again in a few minutes.';
  } else {
    c.fixes = fx.items ?? []; c.count = c.fixes.length;
    c.state = c.count ? 'amber' : 'good';
    c.line = c.count ? plural(c.count, 'thing needs you', 'things need you') + ': ' + (c.fixes[0].say ?? '')
      : c.areas.length ? 'Nothing for you to do. We are on it: ' + plural(c.areas.length, 'part', 'parts') + '.' : 'Everything is working.';
  }
  const s = signs.shield;
  if (!withShield) { /* the shield keeps its last reading: audit_panel is read at open and every 30 minutes */ }
  else if (au && au.ok === true) {
    /* places open beyond the company (anyone with the link, or someone outside) she has not decided on, or that grew critical files since she did: Security's own openings list, without the ones open only inside the company */ s.count = (au.places ?? []).filter((p) => (p.state === 'decide' || p.state === 'alert') && p.opening !== 'company').length;
    s.state = s.count ? 'amber' : 'good';
    s.line = s.count ? plural(s.count, 'place', 'places') + ' can be opened by people outside the company. Decide each one.' : 'Nothing is open outside the company that you have not decided on.';
  } else if (au && (au.reason === 'not_owner' || au.reason === 'unbound')) {
    s.state = 'none'; s.count = 0; s.line = au.note ?? '';
  } else {
    s.state = 'unknown'; s.count = 0; s.line = 'Not checked just now: ' + (au?.note ?? au?.reason ?? 'no answer') + '.';
  }
  changed();
  return signs;
}

function drawSign(btn, kind, title) {
  const g = signs[kind];
  btn.hidden = g.state === 'none';
  btn.className = 'vf-sign' + (g.state === 'amber' ? ' amber' : g.state === 'unknown' ? ' unknown' : '');
  btn.dataset.state = g.state;
  btn.textContent = '';
  btn.appendChild(icon(kind));
  if (g.state === 'amber') btn.appendChild(h('span', 'vf-badge', g.count));
  const label = title + ': ' + (g.state === 'good' ? 'all fine' : g.state === 'amber' ? plural(g.count, 'thing to look at', 'things to look at') : 'not checked');
  btn.setAttribute('aria-label', label); btn.title = label;
}

// The check mark's page, opened in place: what she can fix (each with Fix), then what is ours ("We are on it").
function drawCheckPanel(panel, ctx) {
  const g = signs.check;
  panel.textContent = '';
  const c = card('Is everything okay');
  panel.appendChild(c.el);
  c.el.appendChild(say(g.line, g.state === 'unknown'));
  if (g.fixes.length) {
    const l = list();
    for (const f of g.fixes) l.appendChild(row({ title: f.say ?? '', right: button('Fix', () => ctx.go(f.go ?? 'systems')) }));
    c.el.appendChild(l);
  }
  if (g.areas.length) {
    const b = behind('We are on it: ' + g.areas.length);
    const l = list();
    for (const a of g.areas) l.appendChild(row({ title: a.name ?? '', line: a.say ?? '' }));
    b.appendChild(l);
    c.el.appendChild(b);
  }
}

// Called once by lens.js. after: the element the signs sit after. ctx: { sb, go, owner }.
export function wireSigns(after, ctx) {
  if (!after) return null;
  const wrap = h('div', 'vf-signs'); wrap.id = 'health';
  const chk = h('button'); chk.type = 'button'; chk.setAttribute('aria-expanded', 'false');
  const shd = h('button'); shd.type = 'button';
  const panel = h('div', 'vf vf-sign-panel'); panel.hidden = true; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Is everything okay');
  wrap.append(chk, shd, panel);
  after.after(wrap);
  const close = () => { panel.hidden = true; chk.setAttribute('aria-expanded', 'false'); };
  chk.addEventListener('click', (e) => { e.stopPropagation(); if (panel.hidden) { drawCheckPanel(panel, { go: (k) => { close(); ctx.go(k); } }); panel.hidden = false; chk.setAttribute('aria-expanded', 'true'); } else close(); });
  shd.addEventListener('click', () => { close(); ctx.go('security'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); chk.focus(); } });
  document.addEventListener('click', (e) => { if (!panel.hidden && !wrap.contains(e.target)) close(); });
  onSigns(() => { drawSign(chk, 'check', 'Is everything okay'); drawSign(shd, 'shield', 'Security'); if (!panel.hidden) drawCheckPanel(panel, { go: (k) => { close(); ctx.go(k); } }); });
  readSigns(ctx.sb);
  let n = 0;
  setInterval(() => { n += 1; readSigns(ctx.sb, n % 6 === 0); }, 5 * 60 * 1000);
  return wrap;
}

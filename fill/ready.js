// GETTING READY (seat getting-ready-screen, 2026-11-07; decisions 1117 to 1124; picture 5y8NLrpbGds7NpcJ9ovp6K, copy
// studio-walkers briefs/mockups/getting-ready.html). Until the brain is Ready the Tool opens here, not on a tab: a row of
// steps from her real state, the current step only on the left, the right column kept for Vera, the other tabs dimmed with
// one line. After Ready the Tool opens on Mail and the Brain is the engine room.
// ONE TRUTH: connected, findable, understood and ready are brainroom.js's own road (roadSteps), from the same readings
// the Brain shows. The presses are brainpress.js's own (Read them), shown here as a sheet (C.sheet) with a toast after.
// What this file adds: the screen, the spend line, the Start step's choices and the recorded yes (getting_ready_mark),
// and the top-up request (topup_request) until card payments exist (topup_start, seat stripe-payments).
// Never presses on her behalf (decision 1115). No regex literals and no backslashes (STANDING-CLAUSES).
import { roadSteps } from './brainroom.js?v=2026-11-07-getting-ready-1';
import { filesBlock, estimates } from './brainpress.js?v=2026-11-07-getting-ready-1';
import { LANGS, screenLang, setLang } from './words.js?v=2026-10-29-thinkrooms-3';

const DOT = String.fromCharCode(183);
const ARROW = String.fromCharCode(8594);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => { const x = Number(n); if (!Number.isFinite(x)) return null; return x < 10 ? '$' + x.toFixed(2) : '$' + Math.round(x).toLocaleString('en-US'); };
const TERMS_V = 'getting-ready-terms-1';
const TERMS = 'The Tool helps; you decide. What it shows you is help, not legal, tax or financial advice, and every decision is yours: we are not responsible for what you decide or sign based on what you see here. Your data stays yours: cancel any time and keep your database. Nothing that costs money starts without your yes, and every price is shown before it starts.';
const LOCAL = 'tool.ready.marks';

let C = null, R = null, at = null, host = null, poll = null;

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function btn(cls, text, fn) { const b = el('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
// A word with its meaning: opens on hover, on focus AND on a tap (phones have no hover).
function term(word, meaning) {
  const t = el('span', 'gr-term', word); t.tabIndex = 0; t.setAttribute('role', 'button'); t.setAttribute('aria-expanded', 'false');
  const p = el('span', 'gr-pop', meaning); p.setAttribute('role', 'tooltip'); t.appendChild(p);
  t.addEventListener('click', (e) => { e.stopPropagation(); const o = !t.classList.contains('open'); document.querySelectorAll('.gr-term.open').forEach((x) => { x.classList.remove('open'); x.setAttribute('aria-expanded', 'false'); }); t.classList.toggle('open', o); t.setAttribute('aria-expanded', String(o)); });
  return t;
}
const FIND = () => term('findable', 'Read once, so you can search all of it by meaning and the Tool can quote it to you. It cannot yet count or compare across it.');
const UND = () => term('understood', 'Turned into facts: who, which company, how much, when, what was promised. Then the Tool can count, total and compare.');
function fold(q, ...body) { const d = el('details', 'gr-why'); d.appendChild(el('summary', null, q)); const b = el('div'); b.append(...body); d.appendChild(b); return d; }
function p(cls, ...parts) { const e = el('p', cls); for (const x of parts) e.append(typeof x === 'string' ? document.createTextNode(x) : x); return e; }
function act(title, small, ...buttons) { const d = el('div', 'gr-act'); const t = el('span'); t.append(el('b', null, title)); if (small) t.append(el('small', null, small)); d.append(t, ...buttons); return d; }

// ---------------------------------------------------------------------------------------------------------------------
// THE READINGS
function localMarks() { try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); } catch (_) { return {}; } }
async function read(fresh) {
  const S = { owner: C.isOwner() };
  const jobs = [
    C.readSources(C.sb, fresh).then((v) => { S.src = v; }, (e) => { S.srcErr = e; }),
    C.sb.rpc('brain_road').then(({ data, error }) => { if (error || !data || data.ok !== true) S.roadErr = error?.message ?? data?.error ?? 'no reason was given'; else S.road = data; }, (e) => { S.roadErr = e?.message ?? String(e); }),
    C.sb.rpc('source_read_progress').then(({ data, error }) => { if (!error) S.prog = data ?? []; }, () => {}),
    C.sb.rpc('getting_ready_marks').then(({ data, error }) => { if (!error && data && data.ok === true) S.marks = data; else S.marksErr = error?.message ?? data?.reason ?? 'no reason was given'; }, (e) => { S.marksErr = e?.message ?? String(e); }),
  ];
  if (S.owner) jobs.push(C.askBody({ ai_tab: true }).then((r) => { if (r && r.ok === true && r.ai && r.ai.ok === true) S.ai = r.ai; else S.aiErr = r?.error ?? 'no reason was given'; }, (e) => { S.aiErr = e?.message ?? String(e); }));
  await Promise.all(jobs);
  if (S.owner && S.marks?.groups) await C.sb.rpc('understand_groups').then(({ data, error }) => { if (!error && data && data.ok !== false) S.groups = data; else S.groupsErr = error?.message ?? data?.reason; }, (e) => { S.groupsErr = e?.message ?? String(e); });
  return S;
}
function mark(S, key) { const m = S.marks?.mine?.[key]; if (m) return m; if (S.marksErr) return localMarks()[key] ?? null; return null; }

// The seven steps from real state. state: done, now (the current one), todo, wait (not read).
function stepsOf(S) {
  const road = roadSteps(S);
  const live = !!(S.road || S.src);
  const out = [
    { k: 'start', n: 'Start', name: 'Welcome', done: !!mark(S, 'agreed') },
    { k: 'db', n: '1', name: 'Your database', done: live, wait: !live },
    { k: 'connect', n: '2', name: 'Connect', done: road[0].state === 'done', wait: road[0].state === 'wait' },
    { k: 'business', n: '3', name: 'Your business', done: !!mark(S, 'business') },
    { k: 'find', n: '4', name: 'Make findable', done: road[1].state === 'done', wait: road[1].state === 'wait', pct: road[1].pct },
    { k: 'understand', n: '5', name: 'Understand', done: road[2].state === 'done', wait: road[2].state === 'wait' },
    { k: 'ready', n: '6', name: 'Ready', done: road[3].state === 'done' },
  ];
  const cur = out.findIndex((s) => !s.done);
  out.forEach((s, i) => { s.state = s.done ? 'done' : i === cur ? 'now' : s.wait ? 'wait' : 'todo'; });
  return out;
}
const isReady = (S) => roadSteps(S)[3].state === 'done';

// lens.js asks this once at opening: true sends her to Getting ready. A reading that failed answers false, so the Tool opens
// as before and the Brain carries the failure; it never traps her on a screen built on a reading that did not come back.
export async function notReady(c) {
  C = c;
  try {
    const S = { owner: c.isOwner() };
    await Promise.all([
      c.readSources(c.sb, false).then((v) => { S.src = v; }, (e) => { S.srcErr = e; }),
      c.sb.rpc('brain_road').then(({ data, error }) => { if (!error && data && data.ok === true) S.road = data; }, () => {}),
    ]);
    if (!S.road || !S.src || S.src.ok === false) return false;
    return !isReady(S);
  } catch (_) { return false; }
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SCREEN
export async function mount(c) {
  C = c;
  host = C.$('#gr');
  if (!host) return;
  document.body.classList.add('gr-on');
  if (!host.dataset.built) build();
  C.$('#gr-left').replaceChildren(p('working no-late', 'Reading where your Tool stands'));
  R = await read(true);
  draw();
  paidReturn(R);
  clearTimeout(poll);
  if ((Number(R.road?.findable?.reading) || 0) > 0 || (Number(R.road?.understanding?.waiting) || 0) > 0) poll = setTimeout(() => { if (!C.$('#s-ready')?.hidden && !C.$('#gr-sheet')) mount(C); }, 60000);
}
export function unmount() { document.body.classList.remove('gr-on'); C?.$('#gr-meter')?.remove(); clearTimeout(poll); }

function build() {
  host.dataset.built = '1';
  const dim = p('gr-dim', 'The rest of the Tool opens when your brain is ready.');
  const steps = el('div', 'gr-steps'); steps.id = 'gr-steps'; steps.setAttribute('role', 'list');
  const left = el('div', 'gr-card'); left.id = 'gr-left';
  const main = el('div', 'gr-main'); main.append(steps, left);
  // THE RIGHT COLUMN IS VERA'S (seat vera-guide fills it). Until she lives here, it says how to reach her, and nothing else.
  const vera = el('aside', 'gr-vera'); vera.id = 'gr-vera'; vera.setAttribute('aria-label', 'Vera, your AI guide');
  const vh = el('div', 'gr-vh'); vh.append(el('span', 'gr-av', 'V'), (() => { const t = el('span'); t.append(el('b', null, guideName()), el('small', null, 'your AI guide')); return t; })());
  vera.append(vh, p('gr-vnote', 'Ask me anything about getting ready, or about your business. I can open any step for you.'),
    btn('go', 'Talk to ' + guideName(), () => C.$('#vera-btn')?.click()));
  const grid = el('div', 'gr-grid'); grid.append(main, vera);
  host.replaceChildren(dim, grid);
  document.addEventListener('click', () => document.querySelectorAll('.gr-term.open').forEach((x) => x.classList.remove('open')));
}
function guideName() { const m = R ? mark(R, 'guide_name') : null; const n = String(m?.value?.name ?? m?.name ?? '').trim(); return n || 'Vera'; }

function draw() {
  const S = R;
  // A COLLEAGUE before Ready sees one line: the owner is setting it up (decision 1124). No prices, no presses.
  if (!S.owner) {
    C.$('#gr-steps').replaceChildren();
    const who = String(S.marks?.owner_name || '').trim() || 'Your business owner';
    C.$('#gr-left').replaceChildren(el('h1', 'gr-h', who + ' is setting up the Tool.'), p('gr-lead', 'It opens for you when it is ready. You do not need to do anything; you will see it here.'));
    C.$('#gr-meter')?.remove();
    return;
  }
  const st = stepsOf(S);
  if (!at || !st.find((s) => s.k === at)) at = (st.find((s) => s.state === 'now') || st[st.length - 1]).k;
  const row = C.$('#gr-steps');
  row.replaceChildren(...st.map((s) => {
    const b = btn('gr-st gr-' + s.state, '', () => { at = s.k; draw(); });
    b.setAttribute('role', 'listitem');
    b.append(el('small', null, s.n + (s.k === 'find' && !s.done && Number.isFinite(Number(s.pct)) ? ' ' + DOT + ' ' + num(s.pct) + '%' : '') + (s.done ? ' ' + DOT + ' done' : '')), el('b', null, s.name));
    if (s.k === at) b.setAttribute('aria-current', 'step');
    return b;
  }));
  const card = C.$('#gr-left');
  card.replaceChildren(...(CARDS[at] || CARDS.ready)(S, st));
  card.appendChild(more());
  meter(S);
}

function more() {
  const d = el('div', 'gr-more');
  d.append(el('span', null, 'You can close this page. It goes on by itself, and this screen shows where it stands when you come back.'),
    btn('gr-link', 'See everything in your brain ' + ARROW, () => openBrain()));
  return d;
}
// THE BRAIN, ONE PRESS AWAY (inventory: nothing of the Brain is lost). It opens the Brain itself, with a way back.
function openBrain() {
  C.goto('s-summary');
  const sec = C.$('#s-summary');
  if (sec && !sec.querySelector('#gr-back')) { const b = btn('go ghost door-back', String.fromCharCode(8592) + ' Getting ready', () => C.goto('s-ready')); b.id = 'gr-back'; sec.prepend(b); }
}

// THE SPEND LINE in the masthead: what one-time reading has cost so far this month (the meter) and what this step costs.
function stepPrice(S, k) {
  if (k === 'find') { const n = (S.prog ?? []).filter((r) => r.kind === 'gmail').reduce((a, r) => a + (Number(r.files_waiting_for_owner) || 0), 0); return { n, rate: true }; }
  if (k === 'understand') return S.groups && Number.isFinite(Number(S.groups.total_usd)) ? { usd: Number(S.groups.total_usd) } : { counting: true };
  return { free: true };
}
function soFar(S) { const d = S.ai?.plain?.daily; if (!Array.isArray(d)) return null; return d.reduce((a, x) => a + (Number(x.one_time_usd) || 0), 0); }
function balanceLeft(S) { const b = S.ai?.plain?.balance; return b && b.set_up ? Math.max(0, Number(b.left_usd) || 0) : null; }
async function meter(S) {
  const head = C.$('.masthead');
  if (!head) return;
  let m = C.$('#gr-meter');
  if (!m) { m = btn('gr-meter', ''); m.id = 'gr-meter'; head.appendChild(m); }
  const sf = soFar(S), pr = stepPrice(S, at);
  let step = pr.free ? 'free' : pr.counting ? 'counting' : pr.usd !== undefined ? 'about ' + usd(pr.usd) : null;
  if (pr.rate) {
    if (!pr.n) step = 'nothing waiting';
    else { const E = await estimates({ askBody: C.askBody }).catch(() => null); const rate = Number(E?.all?.estimate?.per_file_findable_usd); step = Number.isFinite(rate) && rate > 0 ? 'up to about ' + usd(pr.n * rate) : 'not priced yet'; }
  }
  const a = el('span', null, 'So far '); a.append(el('b', null, sf === null ? 'not read' : usd(sf)));
  const b = el('span', null, 'This step '); b.append(el('b', null, step));
  m.replaceChildren(a, el('span', null, DOT), b);
  m.setAttribute('aria-label', 'So far ' + (sf === null ? 'not read' : usd(sf)) + ' on one-time reading this month. This step: ' + step + '.');
  m.onclick = () => { const bl = balanceLeft(S); toast('So far ' + (sf === null ? 'not read' : usd(sf)) + ' on one-time reading this month, from the AI meter. This step: ' + step + '. ' + (bl === null ? 'No AI balance is set up.' : 'Your AI balance: ' + usd(bl) + '.')); };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SHEET AND THE TOAST (one of each, used by every spend on this screen, and by brainpress through C.sheet / C.toast)
export function toast(text) {
  C.$('#gr-toast')?.remove();
  const t = el('div', 'gr-toast', text); t.id = 'gr-toast'; t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}
const sheet = {
  open(title, body) {
    sheet.close();
    const scrim = el('div', 'gr-scrim'); scrim.id = 'gr-scrim';
    const s = el('div', 'gr-sheet'); s.id = 'gr-sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', title);
    s.append(el('h2', null, title), body);
    // the scrim is Not now: it presses the sheet's own Not now, so the button that opened it is given back
    scrim.addEventListener('click', () => { const no = s.querySelector('.go.ghost'); if (no) no.click(); else sheet.close(); });
    document.body.append(scrim, s);
    s.querySelector('button')?.focus();
  },
  close() { C?.$('#gr-sheet')?.remove(); C?.$('#gr-scrim')?.remove(); },
};
const PRESS = () => ({ sb: C.sb, el: (t, c) => el(t, c), askBody: C.askBody, sheet, toast });

// TOP UP. With card payments (seat stripe-payments: topup_start), the press goes to Stripe's own page; until then it
// records a request Verrandi sees, and says so. Either way a sheet first, and nothing until Yes.
// The card fee is its own line before she pays (decision 1081): Stripe's US price, 2.9% + 30 cents on the whole charge,
// the same sum studio-core pay_fee() puts on Stripe's page. While Stripe is in test mode the sheet says so: a test
// payment is shown, never added to the balance (HQ money rule, 2026-11-07).
const cardFee = (a) => Math.round((Math.ceil(((a + 0.30) / (1 - 0.029)) * 100) / 100 - a) * 100) / 100;
function cardOf(S) { return S.ai?.plain?.balance?.card ?? null; }
function topUp(S) {
  const pay = !!S.marks?.payments;
  const card = cardOf(S);
  const test = !card || card.mode !== 'live';
  const body = el('div');
  body.appendChild(p('gr-small', pay ? "You pay on Stripe's own page; the Tool never sees your card. Your balance goes up when the payment is through." : 'Top up by card is coming. For now your request goes to Verrandi, who adds it to your balance and tells you.'));
  if (pay && test) body.appendChild(p('gr-small gr-test', 'Card payments are in test mode: on Stripe use the test card 4242 4242 4242 4242, any future date, any 3 digits. A test payment is shown here and is never added to your balance.'));
  let pick = 50;
  const fee = p('gr-small gr-fee', '');
  const say = () => { yes.textContent = (pay ? 'Pay $' : 'Ask for $') + pick; if (pay) { const f = cardFee(pick); fee.textContent = 'Top-up $' + pick.toFixed(2) + ' + card fee at cost $' + f.toFixed(2) + ' = $' + (pick + f).toFixed(2) + '. The fee is what the card company charges, passed on exactly.'; } };
  const seg = el('div', 'gr-seg');
  for (const a of [25, 50, 100, 250]) { const b = btn('gr-amt' + (a === pick ? ' on' : ''), '$' + a, () => { pick = a; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); say(); }); seg.appendChild(b); }
  const out = p('gr-small', '');
  const yes = btn('go', (pay ? 'Pay $' : 'Ask for $') + pick, async () => {
    yes.disabled = true; no.disabled = true; out.className = 'working no-late gr-small'; out.textContent = pay ? 'Opening the payment page' : 'Sending your request';
    try {
      const { data, error } = await C.sb.rpc(pay ? 'topup_start' : 'topup_request', { p_amount_usd: pick });
      if (error) throw error;
      if (!data || data.ok !== true) { out.className = 'gr-small'; out.textContent = 'Not sent: ' + String(data?.note ?? data?.reason ?? 'no reason was given') + '.'; yes.disabled = false; no.disabled = false; return; }
      if (pay && data.url) { location.href = String(data.url); return; }
      sheet.close(); toast(String(data.note || 'Your request is with Verrandi.'));
    } catch (e) { out.className = 'gr-small'; out.textContent = 'Not sent: ' + String(e?.message ?? e) + '.'; yes.disabled = false; no.disabled = false; }
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no);
  say();
  body.append(seg);
  if (pay) body.append(fee);
  body.append(acts, out);
  if (pay) body.append(autoBlock(S));
  sheet.open('Top up your AI balance', body);
}

// AUTOMATIC TOP-UP: her saved card adds her chosen amount when the balance falls under her line, within her monthly
// limit; she turns it off with one press. The card is saved by Stripe at her first payment; before that, one line says so.
function autoBlock(S) {
  const card = cardOf(S);
  const box = el('div', 'gr-auto');
  box.appendChild(el('b', null, 'Automatic top-up'));
  if (!card?.card) { box.appendChild(p('gr-small', 'After your first card payment your card is saved by Stripe, and it can top up for you when the balance runs low.')); return box; }
  const A = card.auto || {};
  const out = p('gr-small', '');
  const send = async (on, below, amount, cap) => {
    out.className = 'working no-late gr-small'; out.textContent = on ? 'Switching it on' : 'Switching it off';
    const { data, error } = await C.sb.rpc('topup_auto_set', on ? { p_on: true, p_below_usd: below, p_amount_usd: amount, p_month_cap_usd: cap } : { p_on: false }).catch((e) => ({ error: e }));
    out.className = 'gr-small';
    if (error || !data || data.ok !== true) { out.textContent = 'Not changed: ' + String(error?.message ?? data?.note ?? 'no reason was given') + '.'; return; }
    sheet.close(); toast(String(data.note));
  };
  if (A.on) {
    box.appendChild(p('gr-small', 'On: when your balance falls under $' + Number(A.below_usd).toFixed(0) + ', ' + card.card + ' adds $' + Number(A.amount_usd).toFixed(0) + ' plus the card fee, up to $' + Number(A.month_cap_usd).toFixed(0) + ' a month ($' + Number(A.this_month_usd || 0).toFixed(0) + ' so far this month).'));
    box.append(btn('go ghost', 'Turn off', () => send(false)), out);
    return box;
  }
  const num = (label, v) => { const f = el('label', 'gr-field', label); const i = el('input'); i.type = 'number'; i.min = '0'; i.step = '5'; i.value = String(v); i.inputMode = 'numeric'; f.appendChild(i); return [f, i]; };
  const [f1, below] = num('When it falls under $', 30), [f2, amount] = num('add $', 50), [f3, cap] = num('up to $ a month', 200);
  const row = el('div', 'gr-row3'); row.append(f1, f2, f3);
  box.append(p('gr-small', 'Use ' + card.card + ' to top up by itself when the balance runs low.'), row,
    btn('go ghost', 'Turn on', () => send(true, Number(below.value), Number(amount.value), Number(cap.value))), out);
  return box;
}
// Back from Stripe (?paid=<id>), or from a refusal on the way there (?pay_note=<reason>): say what happened, from the payment's own record, once; then clean the address.
function paidReturn(S) {
  const q = new URLSearchParams(location.search);
  if (!q.has('paid') && !q.has('pay_note')) return;
  const note = q.get('pay_note');
  q.delete('paid'); q.delete('pay_note'); const done = q.get('done'); q.delete('done');
  history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash);
  const last = cardOf(S)?.payments?.[0];
  if (note) toast(String(note));
  else if (done === '0') toast('Payment not finished: nothing was charged.');
  else if (last && last.status !== 'open') toast(String(last.line));
  else toast('Payment received by Stripe; the Tool records it in a moment. Press Top up to see it.');
}
function balanceAct(S) {
  const bl = balanceLeft(S);
  const last = cardOf(S)?.payments?.[0];
  return act('Your AI balance: ' + (bl === null ? 'none yet' : usd(bl)), last ? String(last.line) : "AI is paid from it at the makers' price, nothing added.", btn('go ghost', 'Top up', () => topUp(S)));
}

// ---------------------------------------------------------------------------------------------------------------------
// THE STEPS
const H = (t) => el('h1', 'gr-h', t);
const CARDS = {
  start(S) {
    const out = [H('Your business, read by AI that works for you.'), p('gr-lead', 'Before you use the Tool, it gets to know your business. Six steps, and ' + guideName() + ' with you the whole way.')];
    const row = el('div', 'gr-row2');
    const lf = el('label', 'gr-field', 'Your language'); const sel = el('select'); for (const [code, , own] of LANGS) { const o = el('option', null, own); o.value = code; if (code === screenLang()) o.selected = true; sel.appendChild(o); }
    sel.addEventListener('change', () => setLang(sel.value, { say: (t) => toast(String(t)) })); lf.appendChild(sel);
    const gf = el('label', 'gr-field', "Your guide's name"); const gi = el('input'); gi.value = guideName(); gi.maxLength = 30; gi.setAttribute('autocomplete', 'off'); gf.appendChild(gi);
    gi.addEventListener('change', () => save('guide_name', { name: gi.value.trim() || 'Vera' }));
    row.append(lf, gf);
    const layers = el('div', 'gr-layers');
    for (const [n, w, e] of [['Find', 'Reads everything once so you can search it.', 'A few dollars, priced first'], ['Understand', 'Turns what matters into facts.', 'You choose, priced first'], ['Reason', 'Answers you from those facts, with the proof.', 'About 1 cent a question']]) { const d = el('div', 'gr-ly'); d.append(el('b', null, n), el('span', null, w), el('em', null, e)); layers.appendChild(d); }
    const prom = el('div', 'gr-promise');
    for (const [b, t] of [['Your database is yours.', 'Leave any time and keep it.'], ['AI at cost.', 'Every cent goes to the AI makers. We add nothing.'], ['Nothing without your yes.', 'Every price is shown before it starts.']]) { const d = el('div'); d.append(el('b', null, b), document.createTextNode(t)); prom.appendChild(d); }
    const agreed = mark(S, 'agreed');
    const lab = el('label', 'gr-agree'); const box = el('input'); box.type = 'checkbox'; box.checked = !!agreed; box.disabled = !!agreed;
    const words = el('span'); words.append(document.createTextNode('I have read the plain-words terms: the Tool helps, you decide; it is not legal or financial advice; cancel any time and keep your data.'));
    lab.append(box, words);
    const terms = fold('Read the terms (2 minutes)', p(null, TERMS), p('gr-small', 'These are the plain words. The full user agreement follows them.'));
    const go = btn('go', agreed ? 'Next: your database' : 'Start', async () => {
      if (agreed) { at = 'db'; draw(); return; }
      if (!box.checked) { toast('Check the box first: it says you have read the terms.'); box.focus(); return; }
      go.disabled = true; await save('agreed', { yes: true }, TERMS_V); go.disabled = false;
    });
    out.push(row, layers, prom, lab, terms, (() => { const d = el('div', 'gr-go'); d.appendChild(go); return d; })());
    if (agreed) out.push(p('gr-small', 'You agreed on ' + new Date(agreed.at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '.'));
    if (S.marksErr) out.push(p('gr-small', 'Your yes is kept in this browser for now, because the Tool could not record it just now (' + String(S.marksErr) + ').'));
    return out;
  },
  db(S) {
    const live = !!(S.road || S.src);
    return [H('Step 1 ' + DOT + ' A home for your brain that belongs to you.'),
      p('gr-lead', live ? 'Done. Your brain has its own database, and it is answering.' : 'Your database did not answer just now. It tries again on its own.'),
      act('Your database ' + DOT + ' ' + (live ? 'answering' : 'not answering'), 'Cancel the Tool any time: we step out, and everything stays yours.', el('span', live ? 'gr-ok' : 'gr-bad', live ? 'Done' : 'Not answering')),
      fold('Why my own database?', p(null, 'So it is always yours. You keep not just your emails and files but everything the Tool worked out about them, ready for any AI you choose later.'))];
  },
  connect(S) {
    const rows = S.src?.rows ?? [];
    const by = (g) => rows.filter((r) => r.group === g).length;
    const list = el('div', 'gr-conn');
    for (const [g, one, many] of [['email', 'mailbox', 'mailboxes'], ['drives', 'drive', 'drives'], ['calendar', 'calendar', 'calendars'], ['contacts', 'contact list', 'contact lists'], ['systems', 'system', 'systems']]) {
      const n = by(g); const d = el('div', 'gr-cn'); d.append(el('span', null, n ? num(n) + ' ' + (n === 1 ? one : many) : 'No ' + many + ' yet'), el('span', n ? 'gr-ok' : 'gr-soft', n ? 'Connected' : ''));
      list.appendChild(d);
    }
    const n = rows.length;
    return [H('Step 2 ' + DOT + ' Connect what you use.'),
      p('gr-lead', S.src ? (n ? 'Done. You signed in with each company, so the Tool never saw your passwords.' : 'Nothing is connected yet. Start with your mailbox.') : 'What is connected could not be read just now. It tries again on its own.'),
      list, act('Anything missing?', "A colleague's mailbox, a drive, another system.", btn('go ghost', 'Add something', () => C.goto('s-connect')))];
  },
  business(S) {
    const said = mark(S, 'business')?.value ?? {};
    const Q = ['What kind of business is it?', 'How do you make money?', 'What does your ideal customer look like?', 'How does a job go, from the first request to getting paid?', 'Who do you pay to get the work done?', 'How do new customers find you?'];
    const ol = el('ol', 'gr-secs');
    Q.forEach((q, i) => { const li = el('li', said['a' + i] ? 'done' : ''); li.append(el('span', 'gr-c'), (() => { const t = el('span'); t.append(el('b', null, q), el('small', null, said['a' + i] ? String(said['a' + i]) : 'Not told yet')); return t; })()); ol.appendChild(li); });
    return [H('Step 3 ' + DOT + ' Tell us about your business.'),
      p('gr-lead', 'Talk to ' + guideName() + ', or type. Say whatever comes to mind, in your own words and the language of your trade. There are no wrong answers. About two minutes, free.'),
      ol, p('gr-small', 'Your words become "How your business works". The Tool reads everything through them. Change them any time.'),
      act(guideName() + ' asks you, one at a time', 'In the conversation on the right.', btn('go', 'Start with ' + guideName(), () => C.$('#vera-btn')?.click()))];
  },
  find(S) {
    const d = S.road;
    const out = [H('Step 4 ' + DOT + ' Make everything '), null];
    out[0].append(FIND(), document.createTextNode('.'));
    if (!d) { out[1] = p('gr-lead', 'How much is findable could not be counted just now (' + String(S.roadErr) + '). It tries again on its own.'); return out; }
    const F = d.findable, M = d.mail, Fi = d.files;
    const att = Number(M.attach_waiting) + Number(M.attach_cannot) + Number(M.attach_held) + Number(M.attach_reading || 0);
    const drv = Number(Fi.not_read) + Number(Fi.waiting) + Number(Fi.waiting_yes);
    const done = Number(F.left) === 0;
    out[1] = p('gr-lead', done ? 'Done. Everything can be found and quoted.' : num(F.pct) + '% done. ' + num(M.emails) + ' emails are findable. What is left is files: ' + num(att) + ' attached to mail and ' + num(drv) + ' in drives.');
    const big = el('div', 'gr-big'); big.append(ring(Number(F.pct)), (() => { const t = el('div'); t.append(el('div', 'gr-num', num(F.pct) + '%'), el('div', 'gr-soft', done ? 'nothing left' : num(F.left) + ' files left')); return t; })());
    out.push(big);
    const press = el('div', 'gr-press'); out.push(press);
    filesBlock(PRESS(), press, { ...S, owner: true }, () => setTimeout(() => mount(C), 2000));
    if (!press.children.length && !done) press.appendChild(p('gr-small', 'Nothing here is waiting for your yes. ' + (Number(F.reading) > 0 ? num(F.reading) + ' files are being read now.' : 'What is left is pictures and recordings, which this step does not read, or files that cannot be read; the Brain lists each with its reason.')));
    const tr = el('div', 'gr-try');
    tr.append(el('b', null, 'Try it now, on what is read so far'),
      el('small', null, 'All your emails' + (done ? ' and files' : ' and ' + num(F.pct) + '% of your files') + ' can be searched by meaning. ' + (done ? '' : 'The ' + num(F.left) + ' files still waiting will not show up yet, and every answer says so.')));
    const sg = el('span', 'gr-sug');
    for (const q of ['Find the latest signed contract', 'Show emails about overdue invoices']) sg.appendChild(btn(null, q, () => C.ask(q)));
    tr.appendChild(sg); out.push(tr);
    out.push(fold('Can I stop here?', p(null, 'Yes. Findable alone is the Search plan, $40 a month ($20 founding): search everything by meaning, across every mailbox, drive and system, with the source shown. What it cannot do is count, total or compare, or watch things for you; that needs step 5. You can come back to it any time.')),
      fold('Why is this so cheap?', p(null, 'Making things findable reads each file with no AI model, or a small one that only takes a fingerprint of it. Understanding, step 5, reads properly and costs more, so you choose what is worth it.')));
    return out;
  },
  understand(S) {
    const out = [H('Step 5 ' + DOT + ' Understand what matters.')];
    out.push(p('gr-lead', 'Not every email needs it. Your mail is sorted into groups first: your real business conversations, money mail, automated mail and everything else. You see each group with its count, examples and price before anything starts.'));
    const G = S.groups;
    if (!G || !Array.isArray(G.groups)) {
      out.push(act('Sorting your mail into groups', 'Counting. The groups, their examples and prices show here when the count is done; until then nothing can be started here.', el('span', 'gr-soft', 'counting')));
    } else {
      const list = el('div', 'gr-groups');
      for (const g of G.groups) {
        const d = el('details', 'gr-gr'); const s = el('summary');
        const t = el('span'); t.append(el('b', null, String(g.title ?? g.name ?? 'Group')), el('small', null, num(g.count) + ' ' + String(g.unit ?? 'emails') + (g.note ? ' ' + DOT + ' ' + String(g.note) : '')));
        s.append(t, el('span', 'gr-pr', Number.isFinite(Number(g.usd)) ? 'about ' + usd(g.usd) : String(g.price_word ?? 'counting')));
        d.appendChild(s);
        const ex = el('ul'); for (const x of (g.examples ?? []).slice(0, 3)) ex.appendChild(el('li', null, String(x))); d.appendChild(ex);
        list.appendChild(d);
      }
      out.push(list, p('gr-small', "Go with a price ceiling and a Stop while it runs comes with the groups; until then the Brain's own Go is one press away under See everything in your brain."));
    }
    out.push(balanceAct(S));
    out.push(fold('What does it cost me every month after this?', p(null, 'Keeping up with new mail and answering your questions. Your monthly limit, set in the next step, keeps it there. The figure for a normal month is measured before it is shown.')));
    return out;
  },
  ready(S, st) {
    const ok = st[st.length - 1].done;
    const out = [H('Step 6 ' + DOT + ' Ready.'), p('gr-lead', ok ? 'You are ready to use the Tool now. It keeps up every day by itself.' : 'When steps 3 to 5 are done, this turns green and you are told. From then on the Tool keeps up every day by itself.')];
    const bills = el('div', 'gr-bills');
    const b1 = el('div', 'gr-bill'); b1.append(el('b', null, 'From Supabase: your database'), line('Each month', 'about $25'), el('small', 'gr-soft', 'On your own account.'));
    const b2 = el('div', 'gr-bill'); b2.append(el('b', null, 'From us: one statement'), line('The Tool, you + 4 colleagues', '$50 founding ' + DOT + ' $100'), line("AI, at the makers' price", 'at cost'), line('Card fee', 'at cost'));
    bills.append(b1, b2); out.push(bills);
    const lim = el('div', 'gr-limit'); out.push(lim);
    if (S.ai?.limit) import('./ai.js?v=2026-11-05-brain-tab-room').then((A) => lim.replaceChildren(A.limitBlock(S.ai.limit, { el: (t, c) => el(t, c), askBody: C.askBody }, () => mount(C)))).catch(() => lim.replaceChildren(p('gr-small', 'Your monthly AI limit could not be shown just now.')));
    else lim.appendChild(p('gr-small', 'Your monthly AI limit could not be read just now' + (S.aiErr ? ' (' + String(S.aiErr) + ')' : '') + '.'));
    out.push(balanceAct(S));
    const mail = btn('go', 'Open Mail', () => { unmount(); C.goTab('email'); }); mail.disabled = !ok;
    out.push(act('Then: open your Mail', 'It looks like the mail you know, with ' + guideName() + ' beside it.', mail),
      act('Already use Claude?', 'Ask your brain from inside Claude too.', btn('go ghost', 'Connect my Claude', () => { openBrain(); C.roomPage('assistadd'); })),
      act('Invite your team', 'Each person sees only what your own systems let them open.', btn('go ghost', 'Invite', () => { unmount(); location.hash = '#security/people'; C.goTab('security'); })));
    return out;
  },
};
function line(a, b) { const d = el('div', 'gr-l'); d.append(el('span', null, a), el('span', null, b)); return d; }
function ring(pct) {
  const NS = 'http://www.w3.org/2000/svg'; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 120 120'); s.setAttribute('class', 'gr-ring'); s.setAttribute('aria-hidden', 'true');
  const c = (cls, dash) => { const x = document.createElementNS(NS, 'circle'); for (const [k, v] of [['cx', '60'], ['cy', '60'], ['r', '50'], ['fill', 'none'], ['stroke-width', '14'], ['class', cls]]) x.setAttribute(k, v); if (dash) { x.setAttribute('stroke-dasharray', dash); x.setAttribute('stroke-linecap', 'round'); x.setAttribute('transform', 'rotate(-90 60 60)'); } return x; };
  s.append(c('gr-ring-bg'), c('gr-ring-fg', (Math.max(0, Math.min(100, pct || 0)) * 3.14).toFixed(1) + ' 314'));
  return s;
}

// A recorded yes or choice: the brain keeps it per person (getting_ready_mark), and it is read back before it is shown as
// kept. When the brain cannot take it, it is kept in this browser and the screen says so.
async function save(key, value, wording) {
  try {
    const { data, error } = await C.sb.rpc('getting_ready_mark', { p_key: key, p_value: value, p_wording: wording ?? null });
    if (error || !data || data.ok !== true) throw new Error(error?.message ?? data?.note ?? data?.reason ?? 'not kept');
  } catch (e) {
    try { const m = localMarks(); m[key] = { value, wording, at: new Date().toISOString() }; localStorage.setItem(LOCAL, JSON.stringify(m)); } catch (_) { /* the screen says it below */ }
    toast('Kept in this browser for now: ' + String(e?.message ?? e) + '.');
  }
  R = await read(false);
  if (key === 'agreed') at = null;
  draw();
}

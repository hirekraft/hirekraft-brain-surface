// GETTING READY (seat getting-ready-screen, 2026-11-07; decisions 1117 to 1124; picture 5y8NLrpbGds7NpcJ9ovp6K, copy
// studio-walkers briefs/mockups/getting-ready.html). Until the brain is Ready the Tool opens here, not on a tab: a row of
// steps from her real state, the current step only on the left, the right column kept for Vera, the other tabs dimmed with
// one line. After Ready the Tool opens on Mail and the Brain is the engine room.
// ONE TRUTH: connected, findable, understood and ready are brainroom.js's own road (roadSteps), from the same readings
// the Brain shows. The presses are brainpress.js's own (Read them), shown here as a sheet (C.sheet) with a toast after.
// What this file adds: the screen, the spend line, the Start step's choices and the recorded yes (getting_ready_mark),
// and the top-up request (topup_request) until card payments exist (topup_start, seat stripe-payments).
// Never presses on her behalf (decision 1115). No regex literals and no backslashes (STANDING-CLAUSES).
// SEAT getting-ready-fix-1 (Alex's walk 2026-11-06 16:35-16:43 PT): Welcome in Alex's approved words with the story one press
// away; language and guide name off Welcome (1127: language from the sign-in, switched beside her name in the masthead; the
// guide's name through Vera's "Call me something else", Settings has no place yet); the spend line is setup spending with
// cents, never the balance (it read "$15" from $14.52 of one-time reading, rounded, beside a $15.03 balance); the top Ask box
// hidden here (skin.css), Vera's column the one place to ask; step 3 answered IN PLACE under each question (the one business
// conversation is vera.js's window.veraBusiness; its done-state reads the profile store business_profile_list, so setup_mark
// 'business', never written by anyone, is no longer read); THE WAY BACK: while not Ready, the masthead Brain button, the
// Brain line under the tabs and every dimmed tab lead back here at the step she left, and any other page shows one line
// "Back to getting ready".
// SEAT setup-front-door (2026-11-10; decisions 1131 to 1135; spec studio-walkers briefs/mockups/getting-started-spec.md, every
// word approved copy): the front door "How Verrandi Works" (fill/setup.js) is the first thing an owner of a brain that is not
// Ready sees, once per browser until Get started; then GETTING STARTED in the approved order: 1 Your database, 2 AI credit,
// 3 Connect and search, then today's Understand (4) and Ready (5), unchanged until HQ sends their approved picture.
// NO VERA BEFORE CREDIT (1132): steps 1 and 2 carry Questions in place and no Vera; from step 3 her column and Ask Vera.
// RETIRED: the Welcome card with its layers, promises and terms box (replaced by the front door; the terms are not in the
// approved copy, said to HQ), and the separate Make findable step (folded into step 3). The business questions moved off
// the step row (1132: Vera asks them while Understand reads); until step 4 is approved they open from step 4's card.
import { micFor } from './box.js?v=2026-10-29-thinkrooms-b';
import { roadSteps } from './brainroom.js?v=2026-11-07-getting-ready-1';
import { ic, points, card, openStory, doorPassed, storyOpen } from './setup.js?v=2026-11-10-setup-front-door';

const DOT = String.fromCharCode(183);
const ARROW = String.fromCharCode(8594);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => { const x = Number(n); if (!Number.isFinite(x)) return null; return x < 10 ? '$' + x.toFixed(2) : '$' + Math.round(x).toLocaleString('en-US'); };
const LOCAL = 'tool.ready.marks';
// THE TERMS YES (seat setup-screens-2, HQ 2026-11-10 06:35 UTC): one line with a check box above the credit step's button,
// "I agree to the terms of use", the existing plain words opened in place, kept by getting_ready_mark 'agreed' with the
// wording it was given to. A brain that already holds 'agreed' shows it checked. Built as one helper (termsLine) so HQ can
// move it after Alex's word on its place. The words are the retired Welcome card's (getting-ready-terms-1), unchanged.
const TERMS_V = 'getting-ready-terms-1';
const TERMS = 'The Tool helps; you decide. What it shows you is help, not legal, tax or financial advice, and every decision is yours: we are not responsible for what you decide or sign based on what you see here. Your data stays yours: cancel any time and keep your database. Nothing that costs money starts without your yes, and every price is shown before it starts.';

let C = null, R = null, at = null, host = null, poll = null, pending = false;
let bz = { open: null, draft: '', more: false, done: false };   // step 3 on the card: which question is open, what is typed
const usd2 = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + x.toFixed(2) : null; };

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function btn(cls, text, fn) { const b = el('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
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
    C.sb.rpc('source_read_progress').then(({ data, error }) => { if (!error) S.prog = data ?? []; else S.progErr = error.message; }, (e) => { S.progErr = e?.message ?? String(e); }),
    C.sb.rpc('connector_status').then(({ data, error }) => { if (!error) S.conn = data; }, () => {}),
    C.sb.rpc('getting_ready_marks').then(({ data, error }) => { if (!error && data && data.ok === true) S.marks = data; else S.marksErr = error?.message ?? data?.reason ?? 'no reason was given'; }, (e) => { S.marksErr = e?.message ?? String(e); }),
  ];
  if (S.owner) jobs.push(C.askBody({ ai_tab: true }).then((r) => { if (r && r.ok === true && r.ai && r.ai.ok === true) S.ai = r.ai; else S.aiErr = r?.error ?? 'no reason was given'; }, (e) => { S.aiErr = e?.message ?? String(e); }));
  if (S.owner) jobs.push(C.sb.rpc('business_profile_list').then(({ data, error }) => { if (!error && data && data.ok === true) S.prof = data.statements ?? []; else S.profErr = error?.message ?? data?.note ?? 'no reason was given'; }, (e) => { S.profErr = e?.message ?? String(e); }));
  if (S.owner) jobs.push(readPlan(S), readSearchProgress(S));   // step 3's priced card and its live line (seat setup-screens-2)
  if (S.owner) jobs.push(C.sb.rpc('understand_progress', { p_source: null }).then(({ data, error }) => { if (!error && data && data.ok === true) S.uprog = data.sources ?? []; }, () => {}));   // step 4's live card
  await Promise.all(jobs);
  return S;
}
// What she already told Vera about her business, in the one profile store (business_profile_owner_say keeps it there).
const PRE = 'how your business works, in your words: ';
function keptWords(S) { const o = {}; for (const s of S.prof ?? []) { const a = String(s.area || ''); if (a.startsWith(PRE) && s.status !== 'rejected') o[a.slice(PRE.length)] = String(s.statement || ''); } return o; }
function mark(S, key) { const m = S.marks?.mine?.[key]; if (m) return m; if (S.marksErr) return localMarks()[key] ?? null; return null; }

// The five steps from real state (spec page 2). state: done, now (the current one), todo, wait (not read).
// Credit counts as done at $20 or more, or once step 3 is done (spending the credit on step 3 must not send her back).
function stepsOf(S) {
  const road = roadSteps(S);
  const live = !!(S.road || S.src);
  const bal = balanceLeft(S);
  const searchable = road[0].state === 'done' && road[1].state === 'done';
  const out = [
    { k: 'db', n: '1', name: 'Your database', done: live, wait: !live },
    { k: 'credit', n: '2', name: 'AI credit', done: (bal !== null && bal >= 20) || searchable },
    { k: 'connect', n: '3', name: 'Connect and search', done: searchable, wait: road[1].state === 'wait' },
    { k: 'understand', n: '4', name: 'Understand', done: road[2].state === 'done', wait: road[2].state === 'wait' },
    { k: 'ready', n: '5', name: 'Ready', done: road[3].state === 'done' },
  ];
  const cur = out.findIndex((s) => !s.done);
  out.forEach((s, i) => { s.state = s.done ? 'done' : i === cur ? 'now' : s.wait ? 'wait' : 'todo'; });
  return out;
}
const NOVERA = ['db', 'credit'];   // no Vera before credit (1132)
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
  C.$('#gr-way')?.remove();
  wayBack();
  if (!host.dataset.built) build();
  if (!R) C.$('#gr-left').replaceChildren(p('working no-late', 'Reading where your Tool stands'));
  const was = R;
  R = await read(true);
  if (was?.mgroups && !was.mgroups.err && Date.now() - gAt < 300000) R.mgroups = was.mgroups;   // the groups are counted once per five minutes, not on every refresh
  pending = !isReady(R);
  document.body.classList.toggle('gr-pending', pending);
  document.body.dataset.guide = guideName();
  if (!typing()) draw();
  paidReturn(R);
  clearTimeout(poll);
  searchPoll();
  if ((Number(R.road?.findable?.reading) || 0) > 0 || (Number(R.road?.understanding?.waiting) || 0) > 0) poll = setTimeout(() => { if (!C.$('#s-ready')?.hidden && !C.$('#gr-sheet')) mount(C); }, 60000);
}
// Leaving Getting ready while the brain is not Ready: one line at the top of the page she goes to, back to the step she left.
export function unmount() {
  document.body.classList.remove('gr-on', 'gr-novera'); C?.$('#gr-meter')?.remove(); clearTimeout(poll);
  if (pending && C && !C.$('#gr-way')) {
    const w = el('div', 'gr-way'); w.id = 'gr-way'; w.setAttribute('role', 'status');
    w.append(el('span', null, 'Your brain is not ready yet.'), btn('gr-link', String.fromCharCode(8592) + ' Back to getting ready', () => C.goto('s-ready')));
    const tabs = C.$('#tabs'); if (tabs) tabs.after(w); else document.body.prepend(w);
  }
}
// She is typing an answer on the card: a reading that comes back must not redraw it away.
function typing() { const t = C?.$('#gr-q-in'); return !!t && (document.activeElement === t || t.value.trim().length > 0); }
// THE WAY BACK (Alex 16:43 PT: he left setup and did not know how to return). While not Ready, the masthead Brain button,
// the Brain line under the tabs and every tab lead back to Getting ready, at the step she left (at is kept). Capture phase,
// so the press never reaches the tab it was on. The Brain itself stays one press away under See everything in your brain.
let wired = false;
function wayBack() {
  if (wired) return;
  wired = true;
  window.addEventListener('gr-refresh', () => { if (C && !C.$('#s-ready')?.hidden) mount(C); });
  window.addEventListener('fd-start', () => { at = 'db'; if (C && R && !C.$('#s-ready')?.hidden) { draw(); window.scrollTo({ top: 0 }); } });
  document.addEventListener('click', (e) => {
    if (!pending || !document.body.classList.contains('gr-pending') || !e.target.closest) return;
    const t = e.target.closest('#brain-engine, #brain-banner button, #tabs .tab');
    if (!t || t.classList.contains('tab-more')) return;
    const here = !C.$('#s-ready')?.hidden;
    if (t.classList.contains('tab-ask')) {   // on Getting ready the one place to ask is Vera's column
      if (!here) return;
      e.preventDefault(); e.stopImmediatePropagation(); C.$('#panel-input')?.focus(); return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    C.$('#tabs')?.classList.remove('more-open');
    if (here) toast('The rest of the Tool opens when your brain is ready.'); else C.goto('s-ready');
  }, true);
}

function build() {
  host.dataset.built = '1';
  const dim = p('gr-dim', 'The rest of the Tool opens when your brain is ready.');
  const top = el('div', 'gs-top');
  const lab = el('span', 'am-lab'); lab.append(ic('steps'), document.createTextNode('Verrandi ' + DOT + ' Getting started'));
  top.append(lab, btn('gr-link gs-how', 'See how it works', () => door()));
  const steps = el('div', 'gr-steps'); steps.id = 'gr-steps'; steps.setAttribute('role', 'list');
  const fill = el('div', 'gs-fill'); fill.id = 'gs-fill';
  const left = el('div', 'gr-card'); left.id = 'gr-left';
  const main = el('div', 'gr-main'); main.append(top, steps, fill, left);
  // THE RIGHT COLUMN IS VERA'S (seat vera-guide fills it), from step 3 on. Until she lives here, it says how to reach her.
  const vera = el('aside', 'gr-vera'); vera.id = 'gr-vera'; vera.setAttribute('aria-label', 'Vera, your guide');
  const vh = el('div', 'gr-vh'); vh.id = 'gr-vh'; vh.append(el('span', 'gr-av', 'V'), (() => { const t = el('span'); t.append(el('b', null, 'Vera'), el('small', null, 'your guide')); return t; })());
  vera.append(vh, p('gr-vnote', 'Ask me anything about getting ready, or about your business. I can open any step for you.'),
    btn('go', 'Talk to ' + guideName(), () => C.$('#vera-btn')?.click()));
  const grid = el('div', 'gr-grid'); grid.id = 'gr-grid'; grid.append(main, vera);
  host.replaceChildren(dim, grid);
}
// THE FRONT DOOR (fill/setup.js): Get started opens step 1 (the fd-start event above).
function door() { openStory({ owner: !!R?.owner }); }
function guideName() { const m = R ? mark(R, 'guide_name') : null; const n = String(m?.value?.name ?? m?.name ?? '').trim(); return n || 'Vera'; }

function draw() {
  const S = R;
  // A COLLEAGUE before Ready sees one line: the owner is setting it up (decision 1124). No prices, no presses.
  if (!S.owner) {
    C.$('#gr-steps').replaceChildren(); C.$('#gs-fill')?.replaceChildren();
    document.body.classList.remove('gr-novera'); const vc = C.$('#gr-vera'); if (vc) vc.hidden = false; C.$('#gr-grid')?.classList.remove('gr-solo');
    const who = String(S.marks?.owner_name || '').trim() || 'Your business owner';
    C.$('#gr-left').replaceChildren(el('h1', 'gr-h', who + ' is setting up the Tool.'), p('gr-lead', 'It opens for you when it is ready. You do not need to do anything; you will see it here.'));
    C.$('#gr-meter')?.remove();
    return;
  }
  const vb = C.$('#gr-vh b'); if (vb) vb.textContent = guideName();
  const va = C.$('#gr-vh .gr-av'); if (va) va.textContent = guideName().slice(0, 1).toUpperCase();
  C.$('#gr-vera')?.setAttribute('aria-label', guideName() + ', your guide');
  const st = stepsOf(S);
  if (!at || !st.find((s) => s.k === at)) at = (st.find((s) => s.state === 'now') || st[st.length - 1]).k;
  const nov = NOVERA.includes(at);
  document.body.classList.toggle('gr-novera', nov);
  const vcol = C.$('#gr-vera'); if (vcol) vcol.hidden = nov;
  C.$('#gr-grid')?.classList.toggle('gr-solo', nov);
  const row = C.$('#gr-steps');
  row.replaceChildren(...st.map((s) => {
    const b = btn('gr-st gr-' + s.state, '', () => { at = s.k; bz.open = null; bz.draft = ''; draw(); });
    b.setAttribute('role', 'listitem'); b.dataset.step = s.k;
    const n = el('span', 'gs-n', s.n); if (s.done) n.classList.add('gs-done');
    b.append(n, el('b', null, s.name));
    b.setAttribute('aria-label', 'Step ' + s.n + ', ' + s.name + (s.done ? ', done' : ''));
    if (s.k === at) b.setAttribute('aria-current', 'step');
    return b;
  }));
  fillBar(st);
  const box = C.$('#gr-left');
  box.replaceChildren(...(CARDS[at] || CARDS.ready)(S, st));
  box.appendChild(more());
  if (at === 'understand' && S.owner && !S.mgroups && !S.gLoad) { S.gLoad = true; readGroups(S).then(() => { if (R === S && at === 'understand' && !typing() && !C.$('#gr-sheet')) draw(); }); }   // step 4's groups, read when she is on it
  if (nov) C.$('#gr-meter')?.remove(); else meter(S);
  // The front door first, once per browser, until Get started (and never over a sheet or a story already open).
  if (!doorShown && !doorPassed() && pending && !storyOpen() && !C.$('#gr-sheet')) { doorShown = true; door(); }
}
let doorShown = false;
// THE FILL-UP BAR under the step buttons: how far she is, from the same five steps.
function fillBar(st) {
  const f = C.$('#gs-fill'); if (!f) return;
  const done = st.filter((s) => s.done).length;
  const cur = st.find((s) => s.state === 'now');
  const n = cur ? Number(cur.n) : st.length;
  const bar = el('div', 'gs-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(st.length)); bar.setAttribute('aria-valuenow', String(done));
  const i = el('i'); i.style.width = Math.round((done / st.length) * 100) + '%'; bar.appendChild(i);
  f.replaceChildren(bar, el('span', 'gs-line', 'Step ' + n + ' of ' + st.length + (done / st.length > 0.5 ? ' ' + DOT + ' more than halfway' : '')));
}

function more() {
  const d = el('div', 'gr-more');
  d.append(el('span', null, 'You can close this page. It goes on by itself, and this screen shows where it stands when you come back.'),
    btn('gr-link', 'See everything in your brain ' + ARROW, () => openBrain()));
  return d;
}
// THE BRAIN, ONE PRESS AWAY (inventory: nothing of the Brain is lost). It opens the Brain itself, with a way back.
// SUPERSEDED (seat getting-ready-fix-1): the "Getting ready" pill this added to the Brain; the way back is now the one line
// unmount() puts at the top of any page while the brain is not Ready.
function openBrain() { C.goto('s-summary'); }

// THE SPEND LINE in the masthead: what setup has spent on AI so far (the meter's one-time reading lines this month, never the
// balance; the balance is only in its own place) and what this step costs. Always in cents, so it cannot be mistaken for the
// balance (seat getting-ready-fix-1: $14.52 spent read as "$15" beside a $15.03 balance).
function stepPrice(S, k) {
  if (k === 'connect') { if (!S.splan) return { counting: true }; const pk = chosenOf(S.splan); return { exact: Math.round(pk.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100 }; }   // search_plan's price for what is checked
  if (k === 'understand') { const G = S.mgroups; if (!G || G.err || !G.priced) return { counting: true }; return { usd: G.groups.filter((g) => g.always || !uOff[g.group]).reduce((a, g) => a + (g.usd || 0), 0) }; }   // mail_groups' estimate for what is checked
  return { free: true };
}
function soFar(S) {
  const pl = S.ai?.plain; if (!pl) return null;
  if (Number.isFinite(Number(pl.one_time_usd)) && pl.one_time_usd !== null) return Number(pl.one_time_usd);
  const d = pl.daily; if (!Array.isArray(d)) return null; return d.reduce((a, x) => a + (Number(x.one_time_usd) || 0), 0);
}
function balanceLeft(S) { const b = S.ai?.plain?.balance; return b && b.set_up ? Math.max(0, Number(b.left_usd) || 0) : null; }
async function meter(S) {
  const head = C.$('.masthead');
  if (!head) return;
  let m = C.$('#gr-meter');
  if (!m) { m = btn('gr-meter', ''); m.id = 'gr-meter'; head.appendChild(m); }
  const sf = soFar(S), pr = stepPrice(S, at);
  const step = pr.free ? 'free' : pr.counting ? 'counting' : pr.exact !== undefined ? usd2(pr.exact) : pr.usd !== undefined ? 'about ' + usd(pr.usd) : null;
  const spent = sf === null ? 'not read' : usd2(sf);
  const a = el('span', null, 'Setup so far '); a.append(el('b', null, spent));
  const b = el('span', null, 'This step '); b.append(el('b', null, step));
  m.replaceChildren(a, el('span', null, DOT), b);
  m.setAttribute('aria-label', 'Setup has spent ' + spent + ' on AI so far. This step: ' + step + '.');
  m.onclick = () => toast('Setup has spent ' + spent + ' on AI so far: reading your mail and files once, this month, from the AI meter. This step: ' + step + '.');
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
  return act('Your AI balance: ' + (bl === null ? 'none yet' : usd2(bl)), last ? String(last.line) : "AI is paid from it at the makers' price, nothing added.", btn('go ghost', 'Top up', () => topUp(S)));
}

// ---------------------------------------------------------------------------------------------------------------------
// THE STEPS
// STEP 3's PARTS. Every count is source_read_progress's (the progress function, per source); every name the one reading's.
const nameOf = (rows, key) => String(rows.find((r) => r.source_key === key)?.name || key);
const totalOf = (x) => (Number(x.done) || 0) + (Number(x.waiting) || 0) + (Number(x.waiting_for_owner) || 0) + (Number(x.files_waiting_for_owner) || 0);
function tileBtn(icon, title, line1, word, on, fn) {
  const b = btn('gs-tile' + (on ? ' gs-on' : ''), '', fn);
  const t = el('span', 'gs-tt'); t.append(ic(icon), el('b', null, title));
  b.append(t);
  if (line1) b.appendChild(el('small', null, line1));
  b.appendChild(el('span', on ? 'gs-chip gs-chip-ok' : 'gs-chip', word));
  b.setAttribute('aria-label', title + (line1 ? ', ' + line1 : '') + ': ' + word);
  return b;
}
// THE LIVE CARD, once Make it all searchable is pressed (seat setup-screens-2): search_progress (seat searchable-plan),
// polled every 15 seconds while it reads. The start time, the count, the bar, minutes left from the measured pace (or
// "measuring"), and what is being read now ('<mailbox>: <year>' or a drive's name; never a subject or a person).
const hm = (iso) => { const d = new Date(iso); return Number.isFinite(d.getTime()) ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null; };
function liveCard(S) {
  const g = S.sprog;
  if (!g || g.ok !== true || g.state !== 'reading') return null;
  const all = Number(g.items_total) || 0, done = Number(g.items_done) || 0;
  const c = el('section', 'am-step gs-live'); c.id = 'gs-live';
  const t = hm(g.started_at);
  c.appendChild(el('span', 'am-num', 'Making it searchable' + (t ? ' ' + DOT + ' started ' + t : '')));
  c.appendChild(el('div', 'gs-big', num(done) + ' of ' + num(all) + ' items'));
  const bar = el('div', 'gs-bar gs-thick'); const i = el('i'); i.style.width = (all ? Math.min(100, Math.round((done / all) * 100)) : 0) + '%'; bar.appendChild(i); c.appendChild(bar);
  const ml = g.minutes_left;
  c.appendChild(p('gr-small', ml === null || ml === undefined ? 'Time: measuring' : 'about ' + num(ml) + ' minutes left'));
  if (g.now_reading) { const d = el('p', 'gs-now'); d.append(el('i', 'gs-pulse'), document.createTextNode('Reading ' + String(g.now_reading))); c.appendChild(d); }
  c.appendChild(p('gr-small', 'You can close this page or keep working. It keeps going, and every box below shows where it is.'));
  return c;
}
// MAKE EVERYTHING SEARCHABLE (spec step 3; seat setup-screens-2 over seat searchable-plan's search_plan and search_go).
// How far back (2 years, 4 years, Everything), a check box per source with its counts and exact price, the total, what is
// left of the credit or how much to add, the time from the measured pace or "measuring", and the one press: a preview
// first (search_go without confirm), then Yes (search_go with confirm). Every number is the brain's; the boundary line
// under the total says what it counts. The balance passed is the meter's (lens-ask read_estimate), as the interface says;
// the guarantee that nothing is spent past it is the AI proxy's own stop.
let plan = { months: 24, off: {} };
function planRows(P) { return (P?.sources ?? []).filter((r) => r.state !== 'not_connected'); }
function chosenOf(P) { return planRows(P).filter((r) => r.state === 'to_read' && !plan.off[r.key]); }
function countLine(r) {
  if (r.kind === 'mail') { const a = (Number(r.attachments) || 0) + (Number(r.attachments_estimated) || 0); return num(r.emails) + ' emails ' + DOT + ' ' + num(a) + ' attachments' + (Number(r.attachments_estimated) ? ' (some estimated)' : ''); }
  return num(r.files) + ' files';
}
function searchCard(S) {
  const c = card('eye', 'Make everything searchable', null);
  c.classList.add('gs-plan'); c.id = 'gs-plan';
  const P = S.splan;
  if (!P || P.ok !== true) {
    c.appendChild(p('gr-small', S.splanErr ? 'What is counted could not be read just now: ' + String(S.splanErr) + '. It tries again on its own.' : 'Connect something and it is counted here, for free.'));
    return c;
  }
  // How far back: the three choices, each with its own total, or "counting" while a choice is not complete.
  const seg = el('div', 'gr-seg gs-back'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'How far back');
  for (const ch of (P.choices ?? [])) {
    const m = ch.months === null || ch.months === undefined ? null : Number(ch.months);
    const on = m === (plan.months === null ? null : Number(plan.months));
    const b = btn('gr-amt' + (on ? ' on' : ''), String(ch.label || (m ? m / 12 + ' years' : 'Everything')), async () => { if (on) return; plan.months = m; plan.off = {}; await rePlan(); });
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    seg.appendChild(b);
  }
  c.append(el('b', 'gs-lab', 'How far back'), seg);
  const list = el('div', 'gs-rows');
  for (const r of planRows(P)) {
    const row = el('label', 'gs-row gs-tick');
    const l = el('span', 'gs-rl');
    if (r.state === 'to_read') {
      const box = el('input'); box.type = 'checkbox'; box.checked = !plan.off[r.key]; box.setAttribute('aria-label', String(r.label));
      box.addEventListener('change', () => { plan.off[r.key] = !box.checked; draw(); });
      row.appendChild(box);
    }
    l.append(el('b', null, String(r.label || r.key)), el('small', null, r.state === 'not_counted' ? String(r.note || 'Not counted yet.') : countLine(r)));
    row.appendChild(l);
    if (r.state === 'to_read') row.appendChild(el('b', 'gs-pv', usd2(r.usd) ?? 'not priced'));
    else if (r.state === 'searchable') row.appendChild(el('span', 'gs-chip gs-chip-ok', 'Searchable'));
    else row.appendChild(el('span', 'gs-chip', 'counting'));
    list.appendChild(row);
  }
  c.appendChild(list);
  const pick = chosenOf(P);
  const cur = (P.choices ?? []).find((ch) => (ch.months ?? null) === (plan.months ?? null));
  const complete = !cur || cur.complete !== false;
  const items = pick.reduce((a, r) => a + (Number(r.to_read) || 0), 0);
  const cost = Math.round(pick.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100;
  const tl = el('div', 'gs-pl gs-totalrow');
  tl.append(el('b', 'gs-total', complete ? 'Total: ' + num(items) + ' items' : 'Total: counting'), el('b', 'gs-pv', complete ? usd2(cost) : 'counting'));
  c.appendChild(tl);
  if (P.boundary) c.appendChild(el('p', 'am-small', String(P.boundary)));
  const bal = Number(P.balance_usd);
  const known = P.balance_known === true && Number.isFinite(bal);
  const over = known && cost > bal + 0.000001;
  if (!known) c.appendChild(p('gr-small', 'Your credit could not be read just now, so nothing can be started. It tries again on its own.'));
  else if (over) c.appendChild(p('gr-small gs-over', 'This is more than your credit: add ' + usd2(Math.ceil(Number(((cost - bal) * 100).toFixed(6))) / 100) + ' first, or untick something.'));
  else c.appendChild(p('gr-small', 'From your $20 credit, leaving ' + usd2(Math.max(0, bal - cost)) + '.'));
  // Time: the chosen sources run side by side, so the longest one; any unmeasured one makes it "measuring".
  const mins = pick.length && pick.every((r) => r.minutes !== null && r.minutes !== undefined) ? Math.max(...pick.map((r) => Number(r.minutes) || 0)) : null;
  c.appendChild(p('gr-small', mins !== null ? 'about ' + num(mins) + ' minutes' : 'Time: measuring'));
  c.appendChild(p(null, 'Untick anything you do not need. Counted for free; nothing is read until you press.'));
  const out = p('gr-small', '');
  const go = btn('go', 'Make it all searchable', () => searchPreview(S, pick, out, go));
  go.disabled = !known || over || !complete || !pick.length || S.sprog?.state === 'reading';
  const gw = el('div', 'gr-go'); gw.appendChild(go);
  c.append(gw, out);
  if (S.sprog?.state === 'reading') c.appendChild(p('gr-small', 'It is being made searchable now; the box above shows where it is.'));
  c.appendChild(el('p', 'am-small', 'Connect or upload something more, and it joins the count before you press. Scans and photos are priced on their own.'));
  return c;
}
async function rePlan() {
  const card0 = C.$('#gs-plan'); if (card0) card0.replaceChildren(p('working no-late', 'Counting, for free'));
  await readPlan(R);
  draw();
}
// The preview, then Yes: both are search_go, the one press (nothing else starts reading from this card).
async function searchPreview(S, pick, out, go) {
  go.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Working out the exact price';
  const args = { p_months: plan.months, p_sources: pick.map((r) => r.key), p_balance_usd: S.splan?.balance_usd ?? null };
  const { data, error } = await C.sb.rpc('search_go', { ...args, p_confirm: false }).catch((e) => ({ error: e }));
  out.className = 'gr-small'; out.textContent = ''; go.disabled = false;
  if (error || !data || data.ok !== true) { out.textContent = 'Not started: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; return; }
  if (data.nothing_to_read) { out.textContent = 'Everything you chose is already searchable.'; return; }
  const body = el('div');
  body.append(priceRow('Items to make searchable', num(data.total_items)), priceRow('Price, one time', usd2(data.total_usd)),
    p('gr-small', data.minutes === null || data.minutes === undefined ? 'Time: measuring' : 'about ' + num(data.minutes) + ' minutes'));
  if (data.note) body.appendChild(p('gr-small', String(data.note)));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, make it searchable ' + DOT + ' ' + usd2(data.total_usd), async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting';
    const r = await C.sb.rpc('search_go', { ...args, p_confirm: true }).catch((e) => ({ error: e }));
    if (r.error || !r.data || r.data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + String(r.error?.message ?? r.data?.note ?? r.data?.reason ?? 'no reason was given') + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(r.data.note || 'Started. You get one short email when it is done.'));
    mount(C);
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no);
  body.append(acts, said);
  sheet.open('Make it all searchable?', body);
}
// THE BALANCE FOR THE PLAN: the meter's own (lens-ask read_estimate balance), kept for five minutes.
// The same reading gives step 4 and step 5 their monthly figure and price per email (S.est).
let balAt = 0, balV = null, estV = null;
async function meterBalance() {
  if (estV && Date.now() - balAt < 300000) return balV;
  const r = await C.askBody({ read_estimate: { months: 24 } }).catch(() => null);
  const b = Number(r?.balance?.balance_left_usd ?? r?.estimate?.balance?.balance_left_usd);
  balV = Number.isFinite(b) ? b : null; balAt = Date.now(); estV = r && r.ok === true ? r : null;
  return balV;
}
async function readPlan(S) {
  const b = await meterBalance();
  S.est = estV;
  const { data, error } = await C.sb.rpc('search_plan', { p_months: plan.months, p_balance_usd: b }).catch((e) => ({ error: e }));
  if (error || !data || data.ok !== true) { S.splan = null; S.splanErr = error?.message ?? data?.note ?? data?.reason ?? 'no reason was given'; }
  else { S.splan = data; S.splanErr = null; }
}
async function readSearchProgress(S) {
  const { data, error } = await C.sb.rpc('search_progress', {}).catch((e) => ({ error: e }));
  if (!error && data && data.ok === true) S.sprog = data; else S.sprog = null;
}
// While it reads, the live card and the progress rows are refreshed every 15 seconds (only on step 3, only while shown).
let sPoll = null;
function searchPoll() {
  clearTimeout(sPoll);
  if (R?.sprog?.state !== 'reading') return;
  sPoll = setTimeout(async () => {
    if (C.$('#s-ready')?.hidden || at !== 'connect' || C.$('#gr-sheet')) { searchPoll(); return; }
    await readSearchProgress(R);
    const live = C.$('#gs-live'), next = liveCard(R);
    if (live && next) live.replaceWith(next); else if (!next) { mount(C); return; }
    searchPoll();
  }, 15000);
}
// PROGRESS: one row per source with its own meter and chip (Reading amber, Waiting grey, Searchable green).
function progressCard(S, rows, prog) {
  const bal = balanceLeft(S);
  const c = card('steps', 'Progress' + (bal !== null ? ' ' + DOT + ' your credit ' + usd2(bal) + ' left of $20' : ''), null);
  const list = el('div', 'gs-rows');
  for (const x of prog) {
    const all = totalOf(x), done = Number(x.done) || 0;
    const st = x.state === 'reading' ? ['Reading', 'gs-chip gs-chip-warn'] : x.state === 'up_to_date' ? ['Searchable', 'gs-chip gs-chip-ok'] : ['Waiting', 'gs-chip'];
    const r = el('div', 'gs-row');
    const bar = el('div', 'gs-bar'); const i = el('i'); i.style.width = (all ? Math.round((done / all) * 100) : 0) + '%'; bar.appendChild(i);
    const l = el('span', 'gs-rl'); l.append(el('b', null, nameOf(rows, x.source)), bar);
    r.append(l, el('span', st[1], st[0]));
    list.appendChild(r);
  }
  if (!prog.length) list.appendChild(p('gr-small', S.progErr ? 'Progress could not be read just now (' + String(S.progErr) + ').' : 'Nothing is being read yet.'));
  c.appendChild(list);
  return c;
}
// QUESTIONS (steps 1 to 3): details that open in place, the approved questions and answers.
function questions(list) {
  const d = el('div', 'gs-qs');
  d.append(el('h2', 'am-h2', 'Questions'), ...list.map(([q, a]) => fold(q, p(null, a))));
  return d;
}
function okMark(text) { const d = el('div', 'gs-okline'); d.append(ic('check', 'gs-okic'), el('b', null, text)); return d; }
function goOn(to, label) { const d = el('div', 'gr-go'); d.appendChild(btn('go', label || 'Continue', () => { at = to; draw(); window.scrollTo({ top: 0 }); })); return d; }
function priceRow(a, b, small) { const d = el('div', 'gs-pl'); const l = el('span'); l.appendChild(el('b', null, a)); if (small) l.appendChild(el('small', null, small)); d.append(l, el('b', 'gs-pv', b)); return d; }
// THE BRAIN'S OWN PANELS, one press away (the room's own presses: the one connect flow, Downloads, Loose files, Scans,
// Connect your Claude). The Brain opens with the way back line (unmount) at the top.
function brainPanel(key) {
  if (key === 'add') { C.goto('s-connect'); return; }   // the one connect flow: the Brain's Add a source
  C.goto('s-summary', 'panel');   // 'panel': the Brain opens even with nothing connected yet (lens.js goto)
  if (key === 'scans' || key === 'mail') {   // these open from their own square on the room, which draws first
    let n = 0;
    const t = setInterval(() => { const q = C.$('#s-summary [data-square="' + key + '"]'); n += 1; if (q) { clearInterval(t); q.click(); } else if (n > 30) { clearInterval(t); toast('That panel could not be opened just now. It is on the Brain, under ' + (key === 'mail' ? 'Mail' : 'Scans and photos') + '.'); } }, 100);
    return;
  }
  C.roomPage(key);
}
function termsLine(S) {
  const agreed = mark(S, 'agreed');
  const w = el('div', 'gs-terms'); w.id = 'gs-terms';
  const lab = el('label', 'gr-agree'); const box = el('input'); box.type = 'checkbox'; box.id = 'gs-agree'; box.checked = !!agreed; box.disabled = !!agreed;
  lab.append(box, el('span', null, 'I agree to the terms of use'));
  const said = p('gr-small', agreed ? 'You agreed on ' + new Date(agreed.at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '.' : '');
  box.addEventListener('change', async () => {
    if (!box.checked) return;
    box.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Keeping your yes';
    const { data, error } = await C.sb.rpc('getting_ready_mark', { p_key: 'agreed', p_value: { yes: true }, p_wording: TERMS_V }).catch((e) => ({ error: e }));
    said.className = 'gr-small';
    if (error || !data || data.ok !== true) { box.checked = false; box.disabled = false; said.textContent = 'Not kept: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; return; }
    R = await read(false); draw();
  });
  w.append(lab, fold('Read the terms (2 minutes)', p(null, TERMS), p('gr-small', 'These are the plain words. The full user agreement follows them.')), said);
  return w;
}
const agreedNow = () => !!C.$('#gs-agree')?.checked;
const H = (t) => el('h1', 'gr-h', t);
const CARDS = {
  db(S) {
    const live = !!(S.road || S.src);
    const out = [H("First, your own AI database. It's yours."),
      points([
        ['database', 'A real database of your own, where everything Verrandi learns about your business is kept.'],
        ['brain', 'An ', ['AI database', true], ': it keeps not only your emails and files, but what they mean, the facts in them and how everything connects. That is what lets AI work with your business.'],
        ['key', 'It lives in your own account with ', ['Supabase', true], ', the database company we chose and use ourselves.'],
        ['hand', 'All of it is yours, always. If you leave, it stays with you.'],
      ]),
      card('coin', 'What it costs, every month', null, priceRow('Your own database, by Supabase', 'about $25 / month', 'The cost of having a real database that belongs to you. Paid to Supabase directly, on your own card. Not a Verrandi charge. Very large businesses pay a little more as it grows.'))];
    // ONE SUPABASE SIGN-IN IS NOT BUILT (spec): a brain that exists shows it is set up; a brain that does not answer says so.
    if (live) out.push(okMark('Your database is set up'), goOn('credit'));
    else out.push(p('gr-lead', 'Your database did not answer just now. It tries again on its own.'));
    out.push(questions([
      ['What makes it an AI database?', 'A regular database keeps your records as they are. Yours also keeps what the Tool works out about each one: a fingerprint of its meaning, so it can be found by what it is about; what it is, who it is about and which client; and how people, companies, money and promises connect. Your data becomes AI-quality data, and any AI you choose, now or later, can use it.'],
      ['What is Supabase?', 'A well-known company that runs databases for businesses of every size. Your database runs on their computers, in your name, in your account.'],
      ['Why my own database, and not yours?', 'Most software keeps your data in its own database. Verrandi does not: your business' + String.fromCharCode(8217) + 's memory is never ours. That is the whole idea.'],
      ['What if I stop using Verrandi?', 'The database and everything in it stay yours: your mail, your files, and everything the Tool worked out about them. That worked-out part is valuable, and any AI you choose later can use it.'],
      ['Why does it cost every month?', 'A database is a real computer, kept running for you all the time. Supabase charges about $25 a month for it.'],
      ['Will the database cost more as it grows?', 'A little. The $25 includes 8 GB of room; beyond that Supabase charges about 12.5 cents per GB a month. A business with years of mail, like one with 136,000 emails, fills about 18 GB: a few dollars more a month. A very busy business may need a bigger computer from Supabase, which costs more. Your Supabase account shows your usage.'],
      ['What does Verrandi do inside it?', "Verrandi's software works inside your database to read and organize what you connect, only to do what you set up."],
      ['Who sets it up?', 'The company, through its owner or the admin of its Google or Microsoft account. It is the company' + String.fromCharCode(8217) + 's database, so company data always stays with the company.'],
      ['Can one person try it first?', 'Yes. Set it up for the company, then let one person try it. They see only what they can already open, and if they leave, everything stays with the company.'],
      ['Do I need to know anything technical?', 'No. You sign in once with Supabase, and Verrandi sets everything up inside your account.'],
    ]));
    return out;
  },
  credit(S) {
    const bal = balanceLeft(S);
    const out = [H('Add your first $20 of AI credit.'),
      points([
        ['ai', 'A one-time amount, paid ahead, for the AI work of making everything you connect searchable.'],
        ['coin', 'It goes to the AI companies at their own price. Verrandi adds nothing.'],
        ['eye', 'Whatever is left stays in your balance for later.'],
        ['shield', "You type your card on Stripe's own page. Your card number never reaches Verrandi."],
      ])];
    if (bal !== null && bal >= 20) {
      const gw = goOn('connect'); const cb = gw.querySelector('button'); cb.addEventListener('click', (e) => { if (!agreedNow()) { e.stopImmediatePropagation(); toast('Check the box first: it says you agree to the terms of use.'); } }, true);
      out.push(card('coin', 'Your AI balance', null, priceRow('AI credit', usd2(bal))), okMark('Your credit is in'), termsLine(S), gw);
    } else {
      // THE FEE is studio-core pay_fee's sum (the same sum cardFee() carries, proven equal on 8 of 8 amounts by seat
      // stripe-payments, and topup_start answers it again); never a typed figure.
      const f = cardFee(20);
      out.push(card('coin', 'What you pay, once', null, priceRow('AI credit', '$20.00'), priceRow('Card fee, at the card company' + String.fromCharCode(8217) + 's price', usd2(f)), priceRow('Total', usd2(20 + f))));
      if (bal !== null) out.push(p('gr-small', 'Your AI balance now: ' + usd2(bal) + '.'));
      const pay = !!S.marks?.payments;
      const card0 = cardOf(S);
      if (pay && (!card0 || card0.mode !== 'live')) out.push(p('gr-small gr-test', 'Card payments are in test mode: on Stripe use the test card 4242 4242 4242 4242, any future date, any 3 digits. A test payment is shown here and is never added to your balance.'));
      const msg = p('gr-small', '');
      const go = btn('go', 'Add $20 with Stripe', async () => {
        if (!agreedNow()) { msg.textContent = 'Check the box first: it says you agree to the terms of use.'; C.$('#gs-agree')?.focus(); return; }
        if (!pay) { msg.textContent = 'Card payments are not switched on for this brain yet, so nothing was started.'; return; }
        go.disabled = true; msg.className = 'working no-late gr-small'; msg.textContent = 'Opening the payment page';
        try {
          const { data, error } = await C.sb.rpc('topup_start', { p_amount_usd: 20 });
          if (error) throw error;
          if (!data || data.ok !== true || !data.url) { msg.className = 'gr-small'; msg.textContent = 'Not started: ' + String(data?.note ?? data?.reason ?? 'no reason was given') + '.'; go.disabled = false; return; }
          location.href = String(data.url);
        } catch (e) { msg.className = 'gr-small'; msg.textContent = 'Not started: ' + String(e?.message ?? e) + '.'; go.disabled = false; }
      });
      const gw = el('div', 'gr-go'); gw.appendChild(go);
      out.push(termsLine(S), gw, msg);
    }
    out.push(questions([
      ['What does "searchable" mean?', 'Every email, attachment and file you connect is read once and gets a fingerprint of its meaning, so you can find it by what it is about, not only by its exact words. It shows you your own documents and never invents anything.'],
      ['Which AI does this step use?', 'Two, each tested for its job: OpenAI makes the search fingerprint of every item, and Claude, by Anthropic, gives every item a quick privacy check, so sensitive things reach only the right people.'],
      ['Why pay ahead?', 'So you are never surprised by a bill, and the Tool never spends money you did not put in.'],
      ['Is $20 enough?', 'A business with years of mail in several mailboxes uses about $20; a smaller one uses less. Before anything is read, you see the exact price for what you connected.'],
      ['What happens to what is left?', 'It stays in your balance for the next steps.'],
      ['Is my card safe?', "You type it on Stripe's own page. Verrandi only ever sees the card brand and the last four digits."],
      ['When does Vera, my guide, join?', 'As soon as your credit is in. Her answers are paid from it, about 2 cents a question.'],
    ]));
    return out;
  },
  connect(S) {
    const rows = S.src?.rows ?? [];
    const by = (g) => rows.filter((r) => r.group === g);
    const out = [H('Connect everything you use.'), p('gr-lead', 'Tap each one and sign in on their page. Everything you connect is counted for free, then made searchable in one go.')];
    const prog = S.prog ?? [];
    const live = liveCard(S); if (live) out.push(live);
    // WHERE YOUR BUSINESS LIVES: from the one reading of sources (sources_view); connected = green.
    const t1 = el('div', 'gs-tiles');
    for (const [g, icon, title, sq, one, many, line0] of [
      ['email', 'mail', 'Mail', 'mail', 'mailbox', 'mailboxes'], ['drives', 'folder', 'Drives', 'drives', 'drive', 'drives'],
      ['calendar', 'calendar', 'Calendar', 'calendar'], ['contacts', 'person', 'Contacts', 'contacts'],
      ['systems', 'systems', 'Systems', 'systems', null, null, 'Accounting, bank, CRM, email marketing, website and more'],
    ]) {
      const n = by(g).length;
      const line1 = one && n ? num(n) + ' ' + (n === 1 ? one : many) : (line0 || '');
      t1.appendChild(tileBtn(icon, title, line1, n ? 'Connected' : 'Connect', !!n, () => brainPanel(n ? sq : 'add')));
    }
    out.push(card('link', 'Where your business lives', null, t1, el('p', 'am-small', 'For the Tool to work well, connect at least your mail, your files, your calendar and your accounting. Every mailbox and every drive is its own connection.')));
    const saves = Number(S.conn?.saves) || 0;
    const t2 = el('div', 'gs-tiles');
    t2.append(tileBtn('chat', 'Your AI chats', 'Your Claude or ChatGPT history, from their download', saves ? 'Added' : 'Upload', !!saves, () => brainPanel('chats')),
      tileBtn('book', 'Downloads', 'A whole export from a system you used before', 'Upload', false, () => brainPanel('downloads')),
      tileBtn('file', 'Loose files', 'Single documents from your computer', 'Upload', by('loose').length > 0, () => brainPanel('loose')),
      tileBtn('photo', 'Scans and photos', 'Documents in pictures, read as a choice with its own price', 'Choose', false, () => brainPanel('scans')));
    out.push(card('upload', 'Bring in what you already have', null, t2, el('p', 'am-small', 'Saved AI chats stay private to the person who added them. A big download is counted and priced before anything is read.')));
    out.push(card('ai', 'Your own AI assistant', null, (() => { const d = el('div', 'gr-act'); const t = el('span'); t.append(el('b', null, 'Connect your Claude'), el('small', null, 'Ask your brain from inside Claude, with what you are allowed to see. It works as soon as your brain is searchable.')); d.append(t, btn('go ghost', 'Connect', () => brainPanel('assistadd'))); return d; })()));
    out.push(searchCard(S));
    out.push(progressCard(S, rows, prog));
    const stop = card('check', 'You could stop here', null, p(null, 'Once everything is green, you already have a working tool: search across your whole business, by meaning, in a second. If that is all you need, the ', el('b', null, 'Search'), ' plan is $40 a month (founding price $20). Understanding comes next, if you want it.'));
    stop.classList.add('gs-green'); out.push(stop);
    const green = rows.length > 0 && prog.length > 0 && prog.every((r) => r.state === 'up_to_date');
    const acts = el('div', 'gr-chips');
    const cont = btn('go', 'Continue', () => { at = 'understand'; draw(); window.scrollTo({ top: 0 }); }); cont.disabled = !green;
    acts.append(cont, btn('go ghost', 'Ask Vera', () => { const b = C.$('#vera-btn'); if (b) b.click(); C.$('#panel-input')?.focus(); }));
    out.push(acts);
    out.push(questions([
      ['Is connecting safe?', 'You sign in with the company itself, on their page, so the Tool never sees your password. Each connection gives permission to read, the way you let a phone app read your calendar.'],
      ['Does it change anything in my mail or files?', 'It reads. Your email still looks like your email, and your files stay where they are.'],
      ['Who in my company will see what?', 'Everyone sees only what they can already open in your own systems. Your owner sees what your owner can see; a new hire sees what a new hire can see.'],
      ['What about pay, health and personal matters?', 'Every item gets a quick privacy check when it comes in, so sensitive things reach only the people who should see them. Anything made from private information stays just as private.'],
      ['How far back does it go?', 'The last 2 years, unless you choose otherwise. Older mail can be added any time, with its price shown first.'],
      ['Is everything made searchable, even junk mail?', 'Yes: everything you connect, so nothing is missed. Pictures and recordings are separate choices. Sorting out what matters comes at the next step.'],
      ['Can I disconnect something later?', 'Yes, any time, in Settings. You see every connection there.'],
    ]));
    return out;
  },
  business(S) {
    const V = window.veraBusiness;
    const out = [H('Tell us about your business.'),
      p('gr-lead', 'Say whatever comes to mind, in your own words and the language of your trade. There are no wrong answers. About two minutes, free.')];
    if (!V) { out.push(p('gr-small', guideName() + ' could not be loaded just now, so this step cannot be answered here. Reload the page to try again.')); return out; }
    const kept = keptWords(S);
    const T = V.state();
    const ol = el('ol', 'gr-secs gr-qs');
    V.questions.forEach((q, i) => {
      const now = T ? T.said[i] : '';
      const old = kept[V.keys[i]] || '';
      const skipped = !!(T && T.skipped[i]);
      const li = el('li', (now || (!T && old)) ? 'done' : skipped ? 'skipped' : '');
      if (bz.open === i) li.classList.add('open');
      const body = el('span');
      body.appendChild(el('b', null, q));
      if (now) {
        body.appendChild(el('span', 'gr-words', now));
        const v = el('span', 'gr-vline'); v.append(el('span', 'gr-av', guideName().slice(0, 1).toUpperCase()), el('span', null, V.thanks)); body.appendChild(v);
      } else if (old) {
        body.appendChild(el('span', 'gr-words', old));
        body.appendChild(el('small', null, 'What you told ' + guideName() + ' before.'));
      } else if (skipped) body.appendChild(el('small', null, 'Skipped.'));
      if (bz.open === i) body.appendChild(answerBox(i, now ? 'Add to it' : null));
      else body.appendChild(btn('gr-link gr-qbtn', (now || old ? 'Add more with ' : 'Answer with ') + guideName(), () => openQ(i)));
      li.append(el('span', 'gr-c'), body);
      ol.appendChild(li);
    });
    out.push(ol);
    const all = T && V.questions.every((_, i) => T.said[i] || T.skipped[i]);
    if (T && (all || bz.done)) {
      const sum = el('div', 'gr-sum');
      sum.append(el('b', null, 'Here is what you told me, in your words.'), p('gr-small', 'Each answer is under its question above.'));
      if (T.extra) sum.appendChild(p(null, 'Anything else: ' + T.extra));
      sum.appendChild(p(null, 'Is this right, and is there anything else you want to say?'));
      if (bz.more) sum.appendChild(answerBox(-1, null));
      const acts = el('div', 'gr-chips');
      const keep = btn('go', 'That is right, keep it', async () => {
        keep.disabled = true; const r = await V.keep(); bz = { open: null, draft: '', more: false, done: false };
        toast(String(r?.note || 'Kept.')); R = await read(false); draw();
      });
      acts.append(keep, btn('go ghost', 'Something else to add', () => { bz.more = true; draw(); C.$('#gr-q-in')?.focus(); }),
        btn('go ghost', 'Stop for now', () => { V.stop(); bz = { open: null, draft: '', more: false, done: false }; draw(); }));
      sum.appendChild(acts);
      out.push(sum);
    } else if (!T || bz.open === null) {
      const first = V.questions.findIndex((_, i) => !(T ? (T.said[i] || T.skipped[i]) : kept[V.keys[i]]));
      const startAt = first < 0 ? 0 : first;
      out.push(act(Object.keys(kept).length && !T ? 'Kept as How your business works' : guideName() + ' asks, one question at a time', 'Answer right here, under each question. Skip any.', btn('go', T ? 'Go on' : (Object.keys(kept).length ? 'Change or add' : 'Start with ' + guideName()), () => openQ(startAt))));
    }
    if (S.profErr) out.push(p('gr-small', 'What you told ' + guideName() + ' before could not be read just now (' + String(S.profErr) + ').'));
    out.push(p('gr-small', 'Your words become "How your business works". The Tool reads everything through them. Nothing is kept until you say it is right. Change them any time.'));
    return out;
  },
  // STEP 4 · UNDERSTAND (spec part 2, approved 2026-11-09; seat setup-screens-2). Every number is the brain's: the groups,
  // counts and prices are mail_groups' (per mailbox, summed), priced with the meter's measured price of one email
  // (read_estimate per_message_usd), each estimate with its range (1137); the time from mail_groups' hours. The three
  // answers, the sample, the limit before the read and overnight half price are seat understand-step's brain side, which had
  // not landed when this was built: they are shown as "coming", never as working (1075). The live card and Stop are the
  // existing ones (understand_progress, source_read_approve 'understand_stop').
  understand(S, st) {
    const out = [H('Understand what matters.'), p('gr-lead', 'Everything is searchable now. Understanding reads each conversation once and notes the facts in it, so you can ask exact questions. You choose what is worth it.')];
    const live = understandLive(S); if (live) out.push(live);
    // THREE QUICK QUESTIONS (1136): the brain side that keeps the answers and turns them into sorting is not built yet.
    const qs = card('chat', 'Three quick questions ' + DOT + ' free', null, el('p', 'am-small', 'Already filled in from what was counted. Tap anything that is not right.'));
    for (const [q, taps] of [['What is each mailbox for?', ['Everything', 'Sales', 'Accounting', 'Hiring', 'Old, searchable only']], ['Who do you work with?', ['Businesses', 'People', 'Both']], ['What do you call the money paperwork?', ['Invoice', 'Timesheet', 'Purchase order', 'Receipt', 'Bill', '+ your word']]]) {
      const d = el('div', 'gs-q'); d.appendChild(el('b', null, q));
      const seg = el('div', 'gr-seg'); for (const t of taps) { const b = btn('gr-amt', t); b.disabled = true; seg.appendChild(b); } d.appendChild(seg);
      qs.appendChild(d);
    }
    qs.append(el('span', 'gs-coming', 'coming'), el('p', 'am-small', 'Your answers will sort what is worth reading. Until they can be kept, the standard sorting is used: your conversations and money mail.'));
    out.push(qs);
    out.push(groupsCard(S));
    const M = monthlyOf(S);
    const how = card('coin', 'How your price works', null);
    const ol = el('ol', 'gs-num3');
    for (const [n, t] of [['1', 'A small sample first, about $2. 100 of your conversations are read, and you see the price measured on your own mail.'], ['2', 'You set the limit. It starts at that price, it is never passed, and Stop works any time: you pay only for what was read.'], ['3', 'Then only new mail, ' + (M === null ? 'its monthly price measured' : 'about ' + usd2(M) + ' a month') + ', shown measured after your first month, in Settings.']]) { const li = el('li'); li.append(el('span', 'gs-n', n), el('span', null, t)); ol.appendChild(li); }
    how.appendChild(ol);
    if (M !== null) how.appendChild(el('p', 'am-small', 'The monthly figure is an estimate from your own mail' + String.fromCharCode(8217) + 's pace, from the AI meter.'));
    out.push(how);
    const model = understandModel(S);
    const ai = card('ai', 'The AI that does the work', null);
    const row = el('div', 'gs-pl'); const l = el('span'); l.append(el('b', null, model || 'Claude, by Anthropic'), el('small', null, 'Best score on our test of real business questions. You can change it in Settings.'));
    row.append(l, el('span', 'gs-rec', 'Recommended')); ai.appendChild(row);
    out.push(ai);
    const done = st.find((x) => x.k === 'understand')?.done;
    const acts = el('div', 'gr-chips');
    const cont = btn('go', 'Continue', () => { at = 'ready'; draw(); window.scrollTo({ top: 0 }); }); cont.disabled = !done;
    acts.append(cont, btn('go ghost', 'Ask Vera', () => { const b = C.$('#vera-btn'); if (b) b.click(); C.$('#panel-input')?.focus(); }));
    out.push(acts);
    out.push(questions([
      ['Is this one time?', 'Yes. This reads your past mail once. After that, only new mail in the same groups is read as it arrives, ' + (M === null ? 'its monthly price measured' : 'about ' + usd2(M) + ' a month') + ' at your pace, plus about 1 cent for each question you ask.'],
      ['Why a sample first?', 'Every business' + String.fromCharCode(8217) + 's mail is different. The sample measures what your own mail costs to understand, so the price you agree to is yours, not an average.'],
      ['Can it cost more than I agreed?', 'No. It stops before your limit. If something is left, it tells you how much and what it would cost, and you decide.'],
      ['What happens to the mail I do not choose?', 'It stays searchable. If a question needs it later, that piece is read then, with its price shown.'],
      ['What is overnight at half price?', 'The AI companies charge about half for work that can wait until morning. Same result, ready the next day.'],
      ['Will I know when it is done?', 'Yes, one short email from your own mailbox to you. You can close the page in the meantime.'],
    ]));
    return out;
  },
  // STEP 5 · READY (spec part 2). The brain's rows from the same readings the Brain shows (brain_road, the one reading of
  // sources); the monthly costs: the database from the AI tab's own estimate (Supabase's list price), keeping up from the
  // meter's monthly estimate per source (read_estimate monthly_usd), questions and the plan as approved words.
  ready(S, st) {
    const ok = st[st.length - 1].done;
    const out = [H(ok ? 'Your brain is ready.' : 'Your brain is not ready yet.')];
    out.push(ok ? (() => { const d = okMark('Everything is connected and searchable, and what matters is understood. It keeps up by itself.'); return d; })() : p('gr-lead', 'When steps 1 to 4 are done, this turns green and you are told. From then on it keeps up by itself.'));
    out.push(brainCard(S));
    const M = monthlyOf(S);
    const db = S.ai?.cost?.database;
    const cost = card('coin', 'What it costs from now on, every month', null,
      priceRow('Your database, paid to Supabase', db?.known && Number.isFinite(Number(db.estimate_usd)) ? 'about ' + usd(db.estimate_usd) : 'about $25', db?.known ? 'From Supabase' + String.fromCharCode(8217) + 's published price for your ' + String(db.plan || '') + ' plan; the exact figure is on their invoice.' : 'Supabase' + String.fromCharCode(8217) + 's price; the exact figure is on their invoice.'),
      priceRow('Keeping new mail searchable and understood', M === null ? 'measured after your first month' : 'about ' + usd2(M), M === null ? null : 'Estimated from your own mail' + String.fromCharCode(8217) + 's pace, from the AI meter.'),
      priceRow('Your questions', 'about 1 cent each'),
      priceRow('The Tool', 'your plan'),
      el('p', 'am-small', 'Estimates until your first month is measured; then the measured numbers are in Settings, with your monthly limit.'));
    out.push(cost);
    const t = el('div', 'gs-tiles');
    const mail = tileBtn('mail', 'Open my Mail', 'It looks like the mail you know, with ' + guideName() + ' beside it', ok ? 'Open' : 'When ready', ok, () => { if (!ok) { toast('Your Mail opens when your brain is ready.'); return; } unmount(); C.goTab('email'); });
    const claude = tileBtn('ai', 'Connect my Claude', 'Ask your brain from inside Claude', 'Connect', false, () => brainPanel('assistadd'));
    const team = tileBtn('person', 'Invite your team', 'Each sees only what they can already open', 'coming', false, () => toast('Inviting your team from here is coming. Each person will see only what they can already open.'));
    t.append(mail, claude, team);
    out.push(card('hand', 'Start working', null, t));
    if (ok) { const g = el('div', 'gr-go'); g.appendChild(btn('go ghost', 'Open Settings', () => C.goto('s-settings'))); out.push(g); }
    out.push(questions([
      ['Where do I change my choices?', 'In Settings: your connections, how far back, what is understood, which AI, your monthly limit, your card, your language and your guide' + String.fromCharCode(8217) + 's name.'],
      ['How do I know it is working?', 'The Brain shows how everything stands, in green, yellow and red, always with words. If something stops, it says what and what is being done.'],
      ['Can I add more later?', 'Yes, any time, from Settings. Each addition shows its price before anything is read.'],
    ]));
    return out;
  },
};
// THE BRAIN, ONE ROW PER KIND (step 5): counts from brain_road and the one reading of sources; Understood only where the
// brain counts understood items of that kind, otherwise Searchable.
function brainCard(S) {
  const rows = S.src?.rows ?? [], d = S.road;
  const n = (g) => rows.filter((r) => r.group === g).length;
  const c = card('brain', 'Your brain', null);
  const list = el('div', 'gs-rows');
  const add = (title, line1, understood) => { const r = el('div', 'gs-row'); const l = el('span', 'gs-rl'); l.append(el('b', null, title), el('small', null, line1)); r.append(l, el('span', understood ? 'gs-chip gs-chip-ok' : 'gs-chip gs-chip-read', understood ? 'Understood' : 'Searchable')); list.appendChild(r); };
  if (!d) { c.appendChild(p('gr-small', 'Your brain could not be read just now' + (S.roadErr ? ' (' + String(S.roadErr) + ')' : '') + '. It tries again on its own.')); return c; }
  const U = d.understood || {};
  if (n('email')) add('Mail', num(n('email')) + (n('email') === 1 ? ' mailbox' : ' mailboxes') + ' ' + DOT + ' ' + num(d.mail?.emails) + ' emails' + (Number(U.mail) ? ' ' + DOT + ' ' + num(U.mail) + ' understood' : ''), Number(U.mail) > 0);
  const files = ['read', 'not_read', 'waiting', 'waiting_yes'].reduce((a, k) => a + (Number(d.files?.[k]) || 0), 0);
  if (n('drives')) add('Drives', num(n('drives')) + (n('drives') === 1 ? ' drive' : ' drives') + ' ' + DOT + ' ' + num(files) + ' files' + (Number(U.files) ? ' ' + DOT + ' ' + num(U.files) + ' understood' : ''), Number(U.files) > 0);
  if (n('systems')) add('Systems', num(n('systems')) + (n('systems') === 1 ? ' system' : ' systems') + (Number(U.records) ? ' ' + DOT + ' ' + num(U.records) + ' records understood' : ''), Number(U.records) > 0);
  if (n('calendar') || n('contacts')) add('Calendar and contacts', [n('calendar') ? num(n('calendar')) + ' calendar' + (n('calendar') === 1 ? '' : 's') : '', n('contacts') ? num(n('contacts')) + ' contact list' + (n('contacts') === 1 ? '' : 's') : ''].filter(Boolean).join(' ' + DOT + ' '), false);
  if (Number(S.conn?.saves)) add('Your AI chats', num(S.conn.saves) + ' saved', false);
  if (!list.children.length) list.appendChild(p('gr-small', 'Nothing is connected yet.'));
  c.appendChild(list);
  return c;
}
// THE MONTHLY FIGURE for keeping up: the meter's estimate per source (read_estimate monthly_usd), summed; null when none.
function monthlyOf(S) {
  const list = S.est?.estimate?.sources;
  if (!Array.isArray(list)) return null;
  const v = list.map((x) => Number(x.monthly_usd)).filter(Number.isFinite);
  return v.length ? Math.round(v.reduce((a, x) => a + x, 0) * 100) / 100 : null;
}
// The model that understands, from the AI tab (which AI does what), or null.
function understandModel(S) {
  const st = (S.ai?.steps ?? []).find((x) => String(x.title || '').toLowerCase().includes('understand'));
  return st ? String(st.model_name || '') + (st.maker ? ', by ' + String(st.maker) : '') : null;
}
// UNDERSTAND YOUR PAST MAIL · ONE TIME: mail_groups per mailbox, summed by group. Money mail is always chosen; automated and
// everything else are off by default and stay searchable. Read the sample, the limit and Understand my mail come with seat
// understand-step's sample (not built when this was drawn): the button says so and starts nothing.
let uOff = { automated: true, rest: true }, gAt = 0;
function groupsCard(S) {
  const c = card('brain', 'Understand your past mail ' + DOT + ' one time', null);
  c.classList.add('gs-plan'); c.id = 'gs-under';
  const G = S.mgroups;
  if (!G) { c.appendChild(p('working no-late gr-small', 'Sorting your mail into groups, for free')); return c; }
  if (G.err) { c.appendChild(p('gr-small', 'The groups could not be read just now: ' + String(G.err) + '. It tries again on its own.')); return c; }
  c.appendChild(el('p', 'am-small', 'Sorted for free with your answers. Untick anything you do not need.'));
  const list = el('div', 'gs-rows');
  const priced = G.priced;
  for (const g of G.groups) {
    const row = el('label', 'gs-row gs-tick' + (g.always ? ' gs-fixed' : ''));
    const box = el('input'); box.type = 'checkbox'; box.checked = g.always || !uOff[g.group]; box.disabled = !!g.always; box.setAttribute('aria-label', g.title);
    box.addEventListener('change', () => { uOff[g.group] = !box.checked; draw(); });
    const l = el('span', 'gs-rl');
    const keep = g.group === 'automated' || g.group === 'rest' ? '; stays searchable' : '';
    l.append(el('b', null, g.title + (g.always ? ' (always)' : '')), el('small', null, g.what + ' ' + DOT + ' ' + num(g.to_read) + ' conversations' + keep));
    row.append(box, l, el('b', 'gs-pv', priced && Number.isFinite(g.usd) ? usd2(g.usd) : 'measuring'));
    list.appendChild(row);
  }
  c.appendChild(list);
  const pick = G.groups.filter((g) => g.always || !uOff[g.group]);
  const convs = pick.reduce((a, g) => a + g.to_read, 0);
  const tot = Math.round(pick.reduce((a, g) => a + (g.usd || 0), 0) * 100) / 100;
  const lo = Math.round(pick.reduce((a, g) => a + (g.low || 0), 0)), hi = Math.round(pick.reduce((a, g) => a + (g.high || 0), 0));
  const tl = el('div', 'gs-pl gs-totalrow'); tl.append(el('b', 'gs-total', 'Total: ' + num(convs) + ' conversations ' + DOT + ' one time'), el('b', 'gs-pv', priced ? usd2(tot) : 'measuring'));
  c.appendChild(tl);
  if (priced) c.appendChild(p(null, 'Likely between $' + num(lo) + ' and $' + num(hi) + '. A small sample of your own mail turns this into your real price before the rest is read.'));
  c.appendChild(el('p', 'am-small', priced ? 'The measured price of one email of average length on your own meter, times each conversation' + String.fromCharCode(8217) + 's length; the range runs from your cheapest to your dearest mailbox.' : 'What understanding costs has not been measured on your mail yet, so no price is given.'));
  const hrs = pick.length && pick.every((g) => Number.isFinite(g.hours)) ? Math.max(...G.byBox.map((bx) => pick.reduce((a, g) => a + (bx[g.group] || 0), 0))) : null;
  const when = el('div', 'gs-when');
  const now = btn('gr-amt on', 'Now ' + DOT + ' ' + (hrs === null ? 'time measuring' : 'about ' + num(Math.max(1, Math.round(hrs))) + ' hours')); now.setAttribute('aria-pressed', 'true');
  const night = btn('gr-amt', 'Overnight ' + DOT + ' half price'); night.disabled = true;
  when.append(now, night, el('span', 'gs-coming', 'overnight: coming'));
  c.append(el('b', 'gs-lab', 'When'), when);
  const bal = balanceLeft(S);
  c.appendChild(priceRow('Your balance', bal === null ? 'not read' : usd2(bal)));
  c.appendChild(p('gr-small', 'Nothing beyond the sample is read until you set your limit.'));
  const go = btn('go', 'Read the sample ' + DOT + ' about $2'); go.disabled = true;
  const gw = el('div', 'gr-go'); gw.append(go, el('span', 'gs-coming', 'coming'));
  c.append(gw, el('p', 'am-small', 'The sample, its measured price, your limit and Understand my mail are being built. Until then nothing is read from here.'));
  return c;
}
// mail_groups for every mailbox (2 years), summed by group; kept for the visit. Owner only (the brain refuses anyone else).
async function readGroups(S) {
  const boxes = (S.src?.rows ?? []).filter((r) => r.group === 'email').map((r) => r.source_key);
  if (!boxes.length) { S.mgroups = { groups: [], byBox: [], priced: false }; return; }
  if (!S.est) { await meterBalance(); S.est = estV; }
  const E = S.est;
  const per = Number(E?.estimate?.per_message_usd);
  const rates = Number.isFinite(per) && per > 0 ? { items: { understand_mail: { usd: per } } } : null;
  const all = await Promise.all(boxes.map((k) => C.sb.rpc('mail_groups', { p_source_key: k, p_months: 24, p_rates: rates }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: e?.message ?? String(e) }))));
  const bad = all.find((x) => !x || x.ok !== true);
  if (bad && all.every((x) => !x || x.ok !== true)) { S.mgroups = { err: String(bad?.note ?? bad?.reason ?? 'no reason was given') }; return; }
  const by = {}; const byBox = [];
  for (const r of all) {
    if (!r || r.ok !== true) continue;
    const bx = {};
    for (const g of r.groups ?? []) {
      const k = String(g.group);
      const o = by[k] || (by[k] = { group: k, title: String(g.title || k), what: String(g.what || ''), always: !!g.always, to_read: 0, usd: 0, low: 0, high: 0, hours: 0 });
      o.to_read += Number(g.to_read) || 0; o.usd += Number(g.usd) || 0; o.low += Number(g.low_usd) || 0; o.high += Number(g.high_usd) || 0;
      if (Number.isFinite(Number(g.hours))) { o.hours += Number(g.hours); bx[k] = Number(g.hours); } else o.hours = NaN;
    }
    byBox.push(bx);
  }
  gAt = Date.now();
  const order = ['people', 'money', 'automated', 'rest'];
  S.mgroups = { groups: order.filter((k) => by[k]).map((k) => by[k]).concat(Object.keys(by).filter((k) => !order.includes(k)).map((k) => by[k])), byBox, priced: !!rates, held: all.filter((x) => !x || x.ok !== true).length };
}
// WHILE IT IS UNDERSTOOD: understand_progress (counts, spent, the limit, minutes left), and Stop through the one press
// (source_read_approve 'understand_stop'): what is mid-read finishes, nothing more is taken.
function understandLive(S) {
  const rows = (S.uprog ?? []).filter((x) => x.state === 'reading' || x.state === 'at_ceiling');
  if (!rows.length) return null;
  const total = rows.reduce((a, x) => a + (Number(x.total) || 0), 0), done = rows.reduce((a, x) => a + (Number(x.done) || 0), 0);
  const spent = rows.reduce((a, x) => a + (Number(x.spent_usd) || 0), 0);
  const lim = rows.every((x) => Number.isFinite(Number(x.ceiling_usd)) && x.ceiling_usd !== null) ? rows.reduce((a, x) => a + Number(x.ceiling_usd), 0) : null;
  const c = el('section', 'am-step gs-live'); c.id = 'gs-ulive';
  c.appendChild(el('span', 'am-num', 'Understanding your mail'));
  c.appendChild(el('div', 'gs-big', num(done) + ' of ' + num(total)));
  const bar = el('div', 'gs-bar gs-thick'); const i = el('i'); i.style.width = (total ? Math.min(100, Math.round((done / total) * 100)) : 0) + '%'; bar.appendChild(i); c.appendChild(bar);
  const mins = rows.every((x) => x.minutes_left !== null && x.minutes_left !== undefined) ? Math.max(...rows.map((x) => Number(x.minutes_left) || 0)) : null;
  c.appendChild(p('gr-small', mins === null ? 'Time: measuring' : 'about ' + num(mins) + ' minutes left'));
  c.appendChild(p(null, 'So far ' + usd2(spent) + (lim !== null ? ', your limit ' + usd2(lim) : '') + '.'));
  const out = p('gr-small', '');
  const stop = btn('go ghost', 'Stop', async () => {
    stop.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Stopping';
    const res = await Promise.all(rows.map((x) => C.sb.rpc('source_read_approve', { p_source_key: x.source_key, p_mode: 'understand_stop', p_months: null, p_confirm: true }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: String(e?.message ?? e) }))));
    out.className = 'gr-small'; out.textContent = res.map((r) => String(r?.note ?? r?.reason ?? 'no reason was given')).join(' ');
    setTimeout(() => mount(C), 2500);
  });
  const g = el('div', 'gr-go'); g.appendChild(stop); c.append(g, out);
  c.appendChild(p('gr-small', 'You can close this page or keep working. It keeps going, and you get one short email when it is done.'));
  return c;
}
// SETTINGS uses these, so every Change there is the same function as here (one path): Top up (with the card and automatic
// top-up in its sheet), the balance, and the readings.
export function topUpFor(c, S) { C = c; topUp(S); }
export { balanceLeft, cardOf, cardFee, monthlyOf, understandModel, brainCard };
// THE ANSWER BOX under a question (i), or under the summary for anything else (i = -1): large, growing as she types, the one
// microphone of the Tool beside it (box.js micFor), Continue and Skip.
function answerBox(i, hint) {
  const V = window.veraBusiness;
  const w = el('div', 'gr-ans');
  const t = el('textarea', 'gr-ans-in'); t.id = 'gr-q-in'; t.rows = 3; t.value = bz.draft || ''; t.placeholder = hint || 'Type, or press the microphone and say it';
  t.setAttribute('aria-label', i >= 0 ? V.questions[i] : 'Anything else you want to say');
  const fit = () => { t.style.height = 'auto'; t.style.height = Math.max(96, Math.min(t.scrollHeight, 360)) + 'px'; };
  t.addEventListener('input', () => { bz.draft = t.value; fit(); });
  const mic = el('button', 'onebox-icon onebox-mic gr-ans-mic'); mic.id = 'gr-q-mic'; mic.type = 'button'; mic.setAttribute('aria-label', 'Speak instead of typing'); mic.title = 'Speak instead of typing';
  mic.appendChild((() => { const NS = 'http://www.w3.org/2000/svg'; const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); const pa = document.createElementNS(NS, 'path'); pa.setAttribute('d', 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2z'); s.appendChild(pa); return s; })());
  const said = el('p', 'onebox-mic-said'); said.id = 'gr-q-said'; said.hidden = true; said.setAttribute('role', 'status');
  const row = el('div', 'gr-ans-row'); row.append(t, mic);
  const go = btn('go', 'Continue', () => {
    const v = t.value.trim();
    if (!v) { toast('Say or type something first, or press Skip.'); t.focus(); return; }
    bz.draft = '';
    if (i < 0) { V.more(v); bz.more = false; draw(); return; }
    V.answer(i, v); nextQ(i);
  });
  const skip = btn('go ghost', i < 0 ? 'Nothing else' : 'Skip', () => { bz.draft = ''; if (i < 0) { bz.more = false; draw(); return; } const st = V.state(); if (!st?.said[i]) V.skip(i); nextQ(i); });
  const acts = el('div', 'gr-chips'); acts.append(go, skip);
  w.append(row, said, acts);
  setTimeout(() => { try { micFor({ btn: '#gr-q-mic', input: '#gr-q-in', said: '#gr-q-said' }); } catch (_) { /* typing still works */ } fit(); t.focus({ preventScroll: false }); }, 0);
  return w;
}
async function openQ(i) {
  const V = window.veraBusiness;
  if (!V) return;
  if (!V.running()) { const ok = await V.begin(); if (!ok) { toast('Only the owner tells ' + guideName() + ' how the business works.'); return; } }
  bz.open = i; bz.draft = ''; bz.more = false;
  V.ask(i);
  draw();
}
function nextQ(i) {
  const V = window.veraBusiness; const T = V.state();
  const n = V.questions.findIndex((_, k) => k > i && !(T.said[k] || T.skipped[k]));
  const m = n >= 0 ? n : V.questions.findIndex((_, k) => !(T.said[k] || T.skipped[k]));
  if (m >= 0) { bz.open = m; V.ask(m); }
  else { bz.open = null; bz.done = true; V.summary(); }
  draw();
}
function line(a, b) { const d = el('div', 'gr-l'); d.append(el('span', null, a), el('span', null, b)); return d; }

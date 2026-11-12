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
// SEAT setup-wire (2026-11-10; decision 1141; brief studio-walkers briefs/seat-setup-wire.md): the screens wired to the brain parts
// that landed after them. STEP 3 asks lens-ask {search_plan} / {search_go}, which reads the balance from the AI meter itself (the
// screen sends none), and each mailbox row carries "Old, searchable only" (source_mark_old, her press, undo). STEP 4: the three
// questions pre-filled (understand_answers_suggest / _set / _moved, what moved with real counts only), Read the sample
// (understand_sample, its measured price with its range), her limit starting at the predicted price and shared out over her
// mailboxes by the sample's prediction (each mailbox press has its own limit: said under the field), Understand my mail
// (source_read_approve per mailbox), "so far, on track for", minutes only once the pace is measured, Stop; overnight hidden (not
// built). READY is the brain's own (brain_road 'ready', read through brainroom.js roadSteps). RETIRED here (ruling 1141.2): the
// business conversation card (CARDS.business, its answer box, the microphone import, the kept-words reading) and the dead helpers
// setup-screens-2 named (balanceAct, act, line); Vera asks about the business later in the Tool (vera.js keeps her conversation).
// SEAT ready-never-spins (2026-11-11; Alex 2026-11-10 16:09 PT: the Tool stayed on "Reading where your Tool stands" and never
// stopped). THE CAUSE: readSearchProgress put .catch(...) on the database client's rpc call. That call object has then and NO catch,
// so the line threw before anything was sent, the first reading rejected and mount() was left on its line forever, on every load,
// for every owner (and six presses carried the same line). Every served check passed because each harness gave this file an
// invented client whose rpc returned a real promise. THE FIX IS THE CLASS, in four rules this file now keeps:
// 1. ONE DOOR TO THE BRAIN: rpc() below (brainDoor). It always answers { data, error } as a real promise and cannot throw. No line in
//    this file or settings.js calls the client's own rpc (the served check counts them: 0).
// 2. EVERY READING HAS A LIMIT (capped, WAIT_MS): a reading that has not answered is named in S.late, the screen is drawn without
//    it, and it still lands when it does answer.
// 3. NOTHING ON THE FIRST SCREEN WAITS ON A PRICE: mount() draws from the brain's own readings; the credit, the estimate and the
//    plan (lens-ask, which reads the AI meter) land after, each drawn when it is in. Until the credit is read, step 2 is never
//    shown as a pay page and never decides which step opens (a failed reading used to show a funded business "Add your first
//    $20"): the last answer seen in this browser stands in, said as not read.
// 4. WHAT COULD NOT BE READ IS SAID IN WORDS AND TRIED AGAIN (netLine, settle): after 10, 20, 40, then every 60 seconds. A draw
//    that throws says so and tries again (paint); mount() can no longer be left on its first line.
// SEAT setup-one-path (2026-11-11; decision 1150 points 1, 2, 3 and 6; picture Cbdma9KRabK6Pb5YFdwkrd Parts 0 and 1; Alex 15:14 PT: lost
// between two pages with two numberings). ONE PATH: until Ready this is the only page. Its five steps are the only numbers; the
// Brain's road is not shown during setup. Every tile opens the Brain's own page OVER the step she is on (brainPanel: the same
// side panel, drawn by brainroom.js, never a second copy); Close returns her to the same step and the same spot (closeOver).
// The one router asks held() before it moves, so nothing on this page or in a panel can carry her to another page. The tabs are
// greyed with one line (LINE). ORDER: Your database, Connect (free), Make it searchable (the first money: the AI credit is asked
// there, creditAsk, the amount the checked press needs plus a cushion, never asked of a balance that covers it), Understand, Ready.
// SAME SHAPE (shape): what it does and what you get, cost and time with their source, then the progress in that same place after
// the press; one enabled main button per step; the Settings line at the foot of every step (more).
// SUPERSEDED HERE, 2026-11-11, Alex's yes on 1150: the separate AI credit step and its card (1131, 1138.1, 1142.6: creditDone,
// creditSeen, fundedBefore, stepNeed), no Vera before credit (1132), See everything in your brain (the way onto the Brain page),
// and brainPanel going to the Brain page.
// SEAT setup-findable-table (2026-11-12; decision 1150, picture Parts 1 to 3; brief studio-walkers briefs/seat-setup-findable-table.md).
// STEP 3 SHOWS ONLY WHAT NEEDS HER (searchCard): reading now, needs your yes, the rest folded; plain names. THE FINDABLE TABLE
// opens over step 3 (findSheet). AN OLD MAILBOX is offered only behind the More button of a mailbox not on the business's own
// address (oldLine, markOld). STEP 4's words name the attached files and the sample's limit (seat understand-files' report).
// SEAT step3-fresh (2026-11-12; decision 1156, picture 8d4DD3SsnG4ouQHp3j5PgT): step 3 rebuilt as the approved fresh look. See
// STEP 3, THE FRESH LOOK above heroCard for what it shows, where each number comes from and what it supersedes.
import { roadSteps } from './brainroom.js?v=2026-11-12-step3-fresh';
import { brainDoor } from './door.js?v=2026-11-11-findable-fix-1';
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

const LINE = 'Mail, Drives and the rest open when step 5 says Ready.';
let C = null, R = null, at = null, host = null, poll = null, pending = false;
const usd2 = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + x.toFixed(2) : null; };

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function btn(cls, text, fn) { const b = el('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
function fold(q, ...body) { const d = el('details', 'gr-why'); d.appendChild(el('summary', null, q)); const b = el('div'); b.append(...body); d.appendChild(b); return d; }
function p(cls, ...parts) { const e = el('p', cls); for (const x of parts) e.append(typeof x === 'string' ? document.createTextNode(x) : x); return e; }

// ---------------------------------------------------------------------------------------------------------------------
// THE ONE DOOR TO THE BRAIN (rule 1). The client's call object is not a promise: it has then, and no catch or finally. This
// wraps it in a real one that always answers { data, error } and never throws or rejects.
// (seat findable-fix, 2026-11-11: the function itself lives in fill/door.js, so brainpress.js uses the same one.)
export { brainDoor };
const rpc = (name, args) => brainDoor(C.sb, name, args);
// EVERY READING HAS A LIMIT (rule 2). Answers when the reading settles or after WAIT_MS, whichever is first; never rejects. A late
// reading is named in S.late and, when it does land, taken off and drawn (landed).
const WAIT_MS = 8000;
function capped(S, name, job) {
  let fin = false, over = false;
  const run = Promise.resolve().then(job).catch((e) => { S.threw = String(e?.message ?? e); }).then(() => { fin = true; if (over) { S.late.delete(name); landed(S); } });
  return Promise.race([run, new Promise((r) => setTimeout(() => { if (!fin) { over = true; S.late.add(name); } r(); }, WAIT_MS))]);
}
function landed(S) { if (R !== S) return; if (S.moneyIn) reopen(S); paint(); settle(S); }
// The open step was chosen before the credit was read (autoAt): now that it is read, it is chosen again, and the address it wrote
// meanwhile does not hold it there.
function reopen(S) {
  if (!autoAt || !S.ai) return;
  at = null; autoAt = false;
  if (String(location.hash || '').startsWith('#gs-')) { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* the step is still chosen again */ } }
}
// ---------------------------------------------------------------------------------------------------------------------
// THE READINGS
function localMarks() { try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); } catch (_) { return {}; } }
function read(fresh) {
  const S = { owner: C.isOwner(), late: new Set(), moneyIn: false };
  const core = [
    capped(S, 'sources', () => C.readSources(C.sb, fresh).then((v) => { S.src = v; }, (e) => { S.srcErr = e; })),
    capped(S, 'road', () => rpc('brain_road').then(({ data, error }) => { if (error || !data || data.ok !== true) S.roadErr = error?.message ?? data?.error ?? 'no reason was given'; else S.road = data; })),
    capped(S, 'progress', () => rpc('source_read_progress').then(({ data, error }) => { if (!error) S.prog = data ?? []; else S.progErr = error.message; })),
    capped(S, 'connections', () => rpc('connector_status').then(({ data, error }) => { if (!error) S.conn = data; })),
    capped(S, 'marks', () => rpc('getting_ready_marks').then(({ data, error }) => { if (!error && data && data.ok === true) S.marks = data; else S.marksErr = error?.message ?? data?.reason ?? 'no reason was given'; })),
  ];
  // search_progress is no longer read by this page (seat step3-fresh): step 3's Working line is source_read_progress's, read above
  // step 4's live card: understand_progress through its owner door (seat setup-wire: understand_progress itself is the service's only,
  // so the call this replaced always failed, silently, and the card could never show)
  if (S.owner) core.push(capped(S, 'understand progress', () => rpc('understand_progress_mine').then(({ data, error }) => { if (!error && data && data.ok === true) S.uprog = data.sources ?? []; else S.uprogErr = String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given'); })));
  S.core = Promise.all(core);
  // THE PRICED READINGS (rule 3), lens-ask's, which reads the AI meter: the credit and step 3's plan. Never awaited by the first
  // draw. A failure keeps the last value this page saw (mount carries it over) and sets its Err, said by netLine.
  // THE ESTIMATE IS ASKED ONLY WHERE IT IS SHOWN (steps 4 and 5; needEst, from draw). It was asked on every opening and was the
  // slowest reading of the three (5 to 7 s on HireKraft, measured 2026-11-11) for figures steps 1 to 3 never show.
  S.money = (S.owner ? Promise.all([
    capped(S, 'credit', () => C.askBody({ ai_tab: true }).then((r) => { if (r && r.ok === true && r.ai && r.ai.ok === true) { S.ai = r.ai; S.aiErr = null; } else S.aiErr = r?.error ?? 'no reason was given'; }, (e) => { S.aiErr = e?.message ?? String(e); })),
    capped(S, 'plan', () => readPlan(S, true)),
  ]) : Promise.resolve()).then(() => { S.moneyIn = true; });
  return S;
}
function needEst(S) {
  if (!S.owner || S.est || S.estAsked) return;
  S.estAsked = true;
  capped(S, 'estimate', () => meterBalance().then(() => { if (estV) { S.est = estV; S.estErr = null; } else S.estErr = 'no reason was given'; })).then(() => { if (R !== S) return; if (at === 'understand' || at === 'ready') paint(); settle(S); });
}
// What could not be read (failed, or not answered within the limit), in her words; empty when everything is in.
function notRead(S) {
  const brain = !!(S.roadErr || S.srcErr || S.late.has('road') || S.late.has('sources'));
  const bad = (err, name) => !!(err || S.late.has(name));
  const ai = bad(S.aiErr, 'credit'), pl = bad(S.splanErr, 'plan'), es = bad(S.estErr, 'estimate');
  const money = S.owner && S.moneyIn && (ai || pl || es);
  const last = brain ? !!(S.road && S.src) : !!((ai && S.ai) || (pl && S.splan) || (es && S.est));   // an earlier reading is still on the screen in its place
  return { brain, money, last, any: brain || money || S.late.size > 0 || !!S.threw };
}
function mark(S, key) { const m = S.marks?.mine?.[key]; if (m) return m; if (S.marksErr) return localMarks()[key] ?? null; return null; }

// The five steps from real state (decision 1150.2). state: done, now (the current one), todo, wait (not read). No step waits on
// the credit any more: it is asked inside Make it searchable, only when the checked press costs more than the balance.
function stepsOf(S) {
  const road = roadSteps(S);
  const live = !!(S.road || S.src);
  const searchable = road[0].state === 'done' && road[1].state === 'done';
  const out = [
    { k: 'db', n: '1', name: 'Your database', done: live, wait: !live },
    { k: 'connect', n: '2', name: 'Connect', done: road[0].state === 'done', wait: road[0].state === 'wait' },
    { k: 'search', n: '3', name: 'Make it searchable', done: searchable, wait: road[1].state === 'wait' },
    { k: 'understand', n: '4', name: 'Understand', done: road[2].state === 'done', wait: road[2].state === 'wait' },
    { k: 'ready', n: '5', name: 'Ready', done: road[3].state === 'done' },
  ];
  const cur = out.findIndex((s) => !s.done);
  out.forEach((s, i) => { s.state = s.done ? 'done' : i === cur ? 'now' : s.wait ? 'wait' : 'todo'; });
  return out;
}
const NOVERA = [];   // her column is beside every step (decision 1150.4; seat setup-vera fills it)
const isReady = (S) => roadSteps(S)[3].state === 'done';

// lens.js asks this once at opening: true sends her to Getting ready. A reading that failed answers false, so the Tool opens
// as before and the Brain carries the failure; it never traps her on a screen built on a reading that did not come back.
export async function notReady(c) {
  C = c;
  try {
    const S = { owner: c.isOwner(), late: new Set() };
    await Promise.all([
      capped(S, 'sources', () => c.readSources(c.sb, false).then((v) => { S.src = v; }, (e) => { S.srcErr = e; })),
      capped(S, 'road', () => brainDoor(c.sb, 'brain_road').then(({ data, error }) => { if (!error && data && data.ok === true) S.road = data; })),
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
  if (!R) C.$('#gr-left').replaceChildren(p('working', 'Reading where your Tool stands'));
  const was = R, S = read(true);
  await S.core;   // the brain's own readings, each inside its limit: this cannot wait longer than WAIT_MS and cannot reject
  if (was?.mgroups && !was.mgroups.err && Date.now() - gAt < 300000) S.mgroups = was.mgroups;   // the groups are counted once per five minutes, not on every refresh
  if (was?.uans && was.uans.ok === true) S.uans = was.uans;   // the three answers' suggestions: counted once per visit
  if (S.progErr && was?.prog) S.prog = was.prog;   // a failed progress reading keeps the last count seen (C5)
  if (S.uprogErr && was?.uprog) S.uprog = was.uprog;
  for (const k of ['ai', 'est', 'splan']) if (S[k] === undefined && was && was[k]) S[k] = was[k];   // the last prices seen stay until the new ones land
  if (was && !S.road && was.road) S.road = was.road;   // a refresh whose brain reading failed keeps the last one, said by netLine
  if (was && !S.src && was.src) S.src = was.src;
  R = S;
  pending = !isReady(R);
  document.body.classList.toggle('gr-pending', pending);
  document.body.dataset.guide = guideName();
  paint();
  S.money.then(() => { if (R !== S) return; reopen(S); paint(); paidReturn(S); settle(S); });
  clearTimeout(poll);
  searchPoll();
  if ((Number(R.road?.findable?.reading) || 0) > 0 || (Number(R.road?.understanding?.waiting) || 0) > 0 || R.uprogErr) poll = setTimeout(() => { if (!C.$('#s-ready')?.hidden && !C.$('#gr-sheet')) mount(C); }, 60000);
}
// THE DRAW, GUARDED (rule 4): a draw that throws says so in words and is tried again; the screen is never left on a working line.
function paint() {
  if (!R || typing()) return;
  try { draw(); R.threw = null; }
  catch (e) { R.threw = String(e?.message ?? e); C.$('#gr-left')?.replaceChildren(p('gr-lead', 'This page could not be drawn just now (' + R.threw + '). Trying again.')); settle(R); }
}
// TRIED AGAIN ON ITS OWN (rule 4): while something could not be read, the readings are made again after 10, 20, 40, then every 60
// seconds, only while this page is shown and she is not in a sheet or typing. Everything in: the count starts over.
let again = null, tries = 0;
function settle(S) {
  clearTimeout(again);
  if (R !== S) return;
  if (!notRead(S).any) { tries = 0; return; }
  again = setTimeout(() => { if (C.$('#s-ready')?.hidden) return; if (C.$('#gr-sheet') || typing()) { settle(S); return; } mount(C); }, Math.min(60000, 10000 * Math.pow(2, tries++)));
}
// WHAT COULD NOT BE READ, IN WORDS (rule 4), one line above the card.
function netLine(S) {
  const n = notRead(S);
  if (!n.brain && !n.money) return null;
  const l = p('gr-small gs-over gs-net', n.brain ? 'Your brain could not be read just now.' : 'Your prices could not be read just now.', n.last ? ' What you see is the last reading.' : '', ' Retrying.');
  l.id = 'gs-net'; l.setAttribute('role', 'status');
  return l;
}
// Leaving Getting ready while the brain is not Ready: one line at the top of the page she goes to, back to the step she left.
export function unmount() {
  document.body.classList.remove('gr-on', 'gr-novera'); C?.$('#gr-meter')?.remove(); clearTimeout(poll); clearTimeout(again);
  if (String(location.hash || '').startsWith('#gs-')) { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* harmless */ } }   // the kept step belongs to this page only
  if (pending && C && !C.$('#gr-way')) {
    const w = el('div', 'gr-way'); w.id = 'gr-way'; w.setAttribute('role', 'status');
    w.append(el('span', null, 'Your brain is not ready yet.'), btn('gr-link', String.fromCharCode(8592) + ' Back to getting ready', () => C.goto('s-ready')));
    const tabs = C.$('#tabs'); if (tabs) tabs.after(w); else document.body.prepend(w);
  }
}
// She is typing an answer on the card: a reading that comes back must not redraw it away.
function typing() { for (const q of ['#gs-word-in', '#gs-limit', '#gs-try-in']) { const t = C?.$(q); if (t && document.activeElement === t) return true; } const w = C?.$('#gs-word-in'); return !!w && w.value.trim().length > 0; }
// THE WAY BACK (Alex 16:43 PT: he left setup and did not know how to return). While not Ready, the masthead Brain button,
// the Brain line under the tabs and every tab lead back to Getting ready, at the step she left (at is kept). Capture phase,
// so the press never reaches the tab it was on. The Brain itself stays one press away under See everything in your brain.
let wired = false;
function wayBack() {
  if (wired) return;
  wired = true;
  window.addEventListener('gr-refresh', () => { if (C && !C.$('#s-ready')?.hidden) mount(C); });
  // the Brain's page closed (brainroom.js closePage): back to the step and the spot she was on, unless another page opened in its place
  window.addEventListener('br-closed', () => setTimeout(() => { const pg = C?.$('#br-page'); if (!pg || pg.hidden) closeOver(true); }, 0));
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
    if (here) toast(LINE); else C.goto('s-ready');
  }, true);
}

function build() {
  host.dataset.built = '1';
  const dim = p('gr-dim', LINE);
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
  // A RELOAD RETURNS TO THE STEP SHE WAS ON (seat audit-fix-screen, ruling 1142.7): the open step is kept in the address as
  // #gs-<step> and opened first; the first step not done only when the address names none (it used to be always, so a reload
  // in step 3 or 4 on HireKraft landed on step 2's payment).
  if (!at) { const h = String(location.hash || ''); const k = h.startsWith('#gs-') ? h.slice(4) : ''; if (st.find((s) => s.k === k)) at = k; }
  if (!at || !st.find((s) => s.k === at)) { at = (st.find((s) => s.state === 'now') || st[st.length - 1]).k; autoAt = false; }   // chosen before the credit was read: chosen again when it is (landed, mount)
  if (!C.$('#s-ready')?.hidden && location.hash !== '#gs-' + at) { try { history.replaceState(null, '', location.pathname + location.search + '#gs-' + at); } catch (_) { /* the step still opens */ } }
  const nov = NOVERA.includes(at);
  document.body.classList.toggle('gr-novera', nov);
  const vcol = C.$('#gr-vera'); if (vcol) vcol.hidden = nov;
  C.$('#gr-grid')?.classList.toggle('gr-solo', nov);
  const row = C.$('#gr-steps');
  row.replaceChildren(...st.map((s) => {
    const b = btn('gr-st gr-' + s.state, '', () => { at = s.k; autoAt = false; draw(); });
    b.setAttribute('role', 'listitem'); b.dataset.step = s.k;
    const n = el('span', 'gs-n', s.n); if (s.done) n.classList.add('gs-done');
    b.append(n, el('b', null, s.name));
    b.setAttribute('aria-label', 'Step ' + s.n + ', ' + s.name + (s.done ? ', done' : ''));
    if (s.k === at) b.setAttribute('aria-current', 'step');
    return b;
  }));
  fillBar(st);
  const box = C.$('#gr-left');
  const kids = (CARDS[at] || CARDS.ready)(S, st);
  const nl = netLine(S); if (nl) kids.unshift(nl);
  kids.push(more());
  // STEP 3 RE-READS WITHOUT JUMPING (seat step3-fresh, decision 1156): while step 3 stays the open step, a card whose shape did
  // not change keeps its place and only its marked numbers change (inPlace); any other draw replaces the step as before.
  if (at === 'search' && box.dataset.step === 'search') inPlace(box, kids);
  else { box.replaceChildren(...kids); if (at === 'search') for (const n of kids) n.dataset.sig = sigOf(n); }
  box.dataset.step = at;
  if (at === 'understand' && S.owner && !S.gLoad) { S.gLoad = true; Promise.all([S.mgroups ? null : readGroups(S), S.uans ? null : readAnswers(S)]).then(() => readSample(S)).then(() => { if (R === S && at === 'understand' && !typing() && !C.$('#gr-sheet')) draw(); }); }   // step 4's groups, answers and sample, read when she is on it
  uPoll();
  if (at === 'understand' || at === 'ready') needEst(S);   // the monthly figure and the price per email, asked where they are shown
  if (nov) C.$('#gr-meter')?.remove(); else meter(S);
  // The front door first, once per browser, until Get started (and never over a sheet or a story already open).
  if (!doorShown && !doorPassed() && pending && !storyOpen() && !C.$('#gr-sheet')) { doorShown = true; door(); }
}
let doorShown = false, autoAt = false;
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
  d.id = 'gr-more';
  // step 3 does not say it (decision 1156.6): its Working line at the top says the reading keeps going
  if (at !== 'search') d.appendChild(el('span', null, 'You can close this page. It goes on by itself, and this screen shows where it stands when you come back.'));
  d.append(
    el('span', 'gs-set', 'You can come back to this in Settings.'));
  return d;
}
// OVER THE STEP (decision 1150.1). The Brain's page is shown over this page: #s-summary is un-hidden with only its side panel
// visible (skin.css body.gr-over), the router is not used, so this page neither scrolls nor redraws. closeOver puts the spot back
// and reads again, so what she just connected shows.
let overY = null;
function closeOver(refresh) {
  if (!document.body.classList.contains('gr-over')) return;
  document.body.classList.remove('gr-over');
  const sec = C.$('#s-summary'); if (sec && !C.$('#s-ready')?.hidden) sec.hidden = true;
  const y = overY; overY = null;
  if (y === null) return;
  window.scrollTo({ top: y });
  if (refresh) mount(C).then(() => window.scrollTo({ top: y }));
}
// THE ROUTER ASKS HERE BEFORE IT MOVES (lens.js goto). While the brain is not Ready and this page is shown: the Brain page opens
// over the step (Add a source) or closes back to it, Settings and the stories stay open to her, and anything else stays shut with
// the one line. True means: held, do not move.
const FREE = ['s-ready', 's-settings', 's-intro', 's-accessmap', 's-tests', 's-totest'];
export function held(id, part) {
  if (!pending || !C || !document.body.classList.contains('gr-on')) return false;
  if (FREE.includes(id)) { closeOver(false); return false; }
  if (id === 's-summary') { if (part === 'add') brainPanel('add'); else { if (C.overClose) C.overClose(); closeOver(true); } return true; }
  toast(LINE);
  return true;
}
// Back from a sign-in on a provider's page (lens.js): the step she left.
export function stepAt(k) { at = k; autoAt = false; }
// EVERY STEP THE SAME SHAPE (decision 1150.3): what it does and what you get; cost and time, each measured or said as measured
// before you press; where the figures come from; and, after the press, the progress in this same place (act).
function shape(does, cost, time, src, act) {
  const c = el('section', 'am-step gs-shape'); c.id = 'gs-shape';
  const g = el('div', 'gs-ct');
  for (const [a, b] of [['Cost', cost], ['Time', time]]) { const d = el('div'); d.append(el('small', null, a), el('b', null, b)); g.appendChild(d); }
  c.append(p('gs-does', does), g, el('p', 'am-small', src));
  if (act) c.appendChild(act);
  return c;
}
const leftWords = (m) => { const x = Number(m); if (m === null || m === undefined || !Number.isFinite(x)) return 'time left: measuring'; if (x < 90) return 'about ' + num(Math.max(1, Math.round(x))) + ' minutes left'; return 'about ' + num(Math.round(x / 60)) + ' hours left'; };

// THE SPEND LINE in the masthead: what setup has spent on AI so far (the meter's one-time reading lines this month, never the
// balance; the balance is only in its own place) and what this step costs. Always in cents, so it cannot be mistaken for the
// balance (seat getting-ready-fix-1: $14.52 spent read as "$15" beside a $15.03 balance).
function stepPrice(S, k) {
  if (k === 'search') { if (!S.splan) return { counting: true }; const pk = chosenOf(S.splan); return { exact: Math.round(pk.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100 }; }   // search_plan's price for what is checked
  if (k === 'understand' && S.usam?.ok === true && S.usam.state === 'done' && Number.isFinite(Number(S.usam.predicted_remaining_usd))) return { usd: Number(S.usam.predicted_remaining_usd) };   // measured on her own mail
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
  const spent = sf === null ? (S.moneyIn ? 'not read' : 'reading') : usd2(sf);
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
      const { data, error } = await rpc(pay ? 'topup_start' : 'topup_request', { p_amount_usd: pick });
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
    const { data, error } = await rpc('topup_auto_set', on ? { p_on: true, p_below_usd: below, p_amount_usd: amount, p_month_cap_usd: cap } : { p_on: false });
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

// ---------------------------------------------------------------------------------------------------------------------
// THE STEPS
// STEP 3's PARTS. Every count is source_read_progress's (the progress function, per source); every name the one reading's.
function tileBtn(icon, title, line1, word, on, fn) {
  const b = btn('gs-tile' + (on ? ' gs-on' : ''), '', fn);
  const t = el('span', 'gs-tt'); t.append(ic(icon), el('b', null, title));
  b.append(t);
  if (line1) b.appendChild(el('small', null, line1));
  b.appendChild(el('span', on ? 'gs-chip gs-chip-ok' : 'gs-chip', word));
  b.setAttribute('aria-label', title + (line1 ? ', ' + line1 : '') + ': ' + word);
  return b;
}
// SEAT audit-fix-screen (C5): when a progress reading is refused or fails, the card says so in words (progressFailed, step 4's live card).
const NOREAD = 'Could not read the progress just now.';
function progressFailed(id, title, why) {
  const c = el('section', 'am-step gs-live'); c.id = id;
  c.append(el('span', 'am-num', title), p(null, NOREAD + ' Anything you started keeps going.'), el('p', 'am-small', 'Why: ' + String(why) + '. It tries again on its own.'));
  return c;
}
// STEP 3, THE FRESH LOOK (seat step3-fresh, 2026-11-12; decision 1156, picture 8d4DD3SsnG4ouQHp3j5PgT; Alex 20:41 PT: the page
// was an airplane cockpit, and every user knows what she has, so it should just show it). FOUR PARTS, each a card with its own
// id: the answer first (heroCard: one percentage for everything, the Working line, what searchable gets her, a box to try it,
// and that she can stop here), her sources as she knows them in Google (treeCard: Gmail, Google Drive, Your systems, each
// folding, each with + Add that opens the one connect sheet over the step), the one box that asks (yesCard, only when
// something needs her yes; money in one line at the button; the terms only until she has agreed) and what is not searchable
// and why, folded (notCard). Every number is the brain's: the percentage is brain_road's (done of what can be read), the counts
// and states search_plan's, the names and each system's line sources_view's, the Working line source_read_progress's (the one
// indicator of seat work-indicator had not landed; when it has, it goes where workWords is). A RE-READ CHANGES NUMBERS IN
// PLACE (inPlace): a card whose shape is the same keeps its place and only the marked numbers (K) change.
// NOT SHOWN, because the brain does not hold or send it (said in the seat's report): a drive's own top folder names, and when
// a system's copy was last refreshed. MEETINGS are told by the drive's own name (Meet, meeting): the screen's reading.
// SUPERSEDED 2026-11-12, Alex's yes on 1156: the three places of seat setup-findable-table (Reading now, Needs your yes with
// a price per row, N sources already searchable), the head card with the press's count as the page's headline (liveCard,
// searchShape; with it the line of seat press-while-reading saying it counts several presses), the Findable line and its
// sheet (findLine, findSheet: now notCard, word searchable, decision 1155), You could stop here at the foot, and You can
// close this page. The paragraph below is kept only as the record of what this replaced.
// BEFORE 1156: MAKE EVERYTHING SEARCHABLE (spec step 3; seat setup-screens-2 over seat searchable-plan's search_plan and search_go).
// How far back (2 years, 4 years, Everything), then ONLY WHAT NEEDS HER (seat setup-findable-table, 2026-11-12; decision 1150,
// picture Cbdma9KRabK6Pb5YFdwkrd Part 1): what is being read now, each source in its own row with its meter; what needs her yes,
// each with its counted price, the total, the credit and the one press; and everything already searchable folded into one line
// she can open. ONE LIST: every source is in exactly one of the three places. A source is called by its name, never by its key,
// and two with the same name say whose (names). Every number is the brain's (search_plan through lens-ask, which reads the
// balance from the AI meter itself; the pace is source_read_progress's). The press is a preview first (search_go without
// confirm), then Yes. SUPERSEDED 2026-11-12, Alex's yes on 1150: one row per source whatever its state (about 40 rows on
// HireKraft), the separate Progress card that listed every source a second time with a second meter (progressCard), and
// "Old, searchable only" under every mailbox (oldRow; see oldLine).
let plan = { months: 24, off: {} };
let open3 = {}, listOpen = false;
function planRows(P) { return (P?.sources ?? []).filter((r) => r.state !== 'not_connected'); }
function chosenOf(P) { return planRows(P).filter((r) => r.state === 'to_read' && !plan.off[r.key]); }
// PLAIN NAMES. The plan's own label; where that is missing or is a key, the name the one reading of sources gives it
// (sources_view); never the key. Two sources with the same name say whose, in sources_view's own words ("Shared drive",
// "Folder in Erin's My Drive").
const isKey = (t, r) => !t || t === r.key || t.startsWith('drive:') || t.startsWith('gmail:');
function names(S, rows) {
  const src = S.src?.rows ?? [];
  const sv = (r) => src.find((x) => x.source_key === r.key);
  const base = rows.map((r) => { const a = String(r.label || '').trim(); if (!isKey(a, r)) return a; const b = String(sv(r)?.name || '').trim(); if (!isKey(b, r)) return b; return r.kind === 'mail' ? 'A mailbox' : 'A drive or folder'; });
  const out = {};
  rows.forEach((r, i) => { const twice = base.filter((n) => n.toLowerCase() === base[i].toLowerCase()).length > 1; const whose = String(sv(r)?.what || '').trim(); out[r.key] = twice && whose ? base[i] + ' ' + DOT + ' ' + whose : base[i]; });
  return out;
}
// THE BUSINESS'S OWN ADDRESS: the one most of its connected mailboxes are on (HireKraft: hirekraft.ai). One mailbox: its own.
// A tie: not known, and then no mailbox is offered Old. The brain keeps no such field; this is the screen's reading of the
// plan's own rows, named for HQ in the seat's report.
const domOf = (r) => { const a = String(r.label || r.key || ''); const i = a.lastIndexOf('@'); return i >= 0 ? a.slice(i + 1).toLowerCase() : null; };
function ownDomain(P) {
  const c = {};
  for (const r of planRows(P)) if (r.kind === 'mail') { const d = domOf(r); if (d) c[d] = (c[d] || 0) + 1; }
  const top = Object.entries(c).sort((a, b) => b[1] - a[1]);
  if (!top.length || (top.length > 1 && top[0][1] === top[1][1])) return null;
  return top[0][0];
}
// A NUMBER THAT CHANGES IN PLACE (K), and the two ways a re-read lands (draw): sigOf is a card's shape with its marked numbers
// blanked; inPlace keeps every card whose shape did not change and copies only the marked numbers into it, replaces a card
// whose shape changed where it stands, and removes what is gone. A marked part she filled by opening it (the fold) is left as it is.
const K = (e, k) => { e.dataset.k = k; return e; };
function sigOf(n) {
  const c = n.cloneNode(true);
  for (const e of c.querySelectorAll('[data-k]')) { e.textContent = ''; e.removeAttribute('style'); e.removeAttribute('hidden'); e.removeAttribute('disabled'); }
  for (const d of c.querySelectorAll('details')) d.removeAttribute('open');
  return c.outerHTML;
}
function inPlace(box, fresh) {
  const keep = new Set();
  let prev = null;
  for (const n of fresh) {
    const o = n.id ? [...box.children].find((x) => x.id === n.id) : null, sg = sigOf(n);
    if (o && o.dataset.sig === sg) {
      const a = o.querySelectorAll('[data-k]');
      n.querySelectorAll('[data-k]').forEach((x, i) => {
        const y = a[i]; if (!y) return;
        if (!x.children.length && !y.children.length && y.textContent !== x.textContent) y.textContent = x.textContent;
        if (x.style.width) y.style.width = x.style.width;
        y.hidden = x.hidden; if ('disabled' in x) y.disabled = x.disabled;
      });
      keep.add(o); prev = o; continue;
    }
    n.dataset.sig = sg;
    if (o) o.replaceWith(n); else if (prev) prev.after(n); else box.prepend(n);
    keep.add(n); prev = n;
  }
  for (const x of [...box.children]) if (!keep.has(x)) x.remove();
}
const chip = (tone, text) => el('span', 'gs-chip' + (tone ? ' gs-chip-' + tone : ''), text);
const WORD = { searchable: ['Searchable', 'ok'], reading: ['Reading', 'warn'], to_read: ['Needs your yes', 'warn'], not_counted: ['Counting', ''] };   // search_plan's states
const SV = { needs_you: ['Needs you', 'warn'], reading: ['Reading', 'warn'], up_to_date: ['Connected', 'ok'] };   // sources_view's states
const MEET = [' meet ', ' meeting ', ' meetings '];
const FINDS = ['find', 'search', 'show', 'where'];
// THE WORKING LINE: everything being read now, done of total, and the time left at the measured pace (source_read_progress;
// never a guessed time: measuring is said). Empty when nothing is being read.
function workWords(S) {
  const rd = (S.prog ?? []).filter((x) => x.state === 'reading');
  if (!rd.length) return '';
  const done = rd.reduce((a, x) => a + (Number(x.line_done) || 0), 0), all = rd.reduce((a, x) => a + (Number(x.line_total) || 0), 0);
  const left = rd.every((x) => x.minutes_left !== null && x.minutes_left !== undefined) ? Math.max(...rd.map((x) => Number(x.minutes_left) || 0)) : null;
  return 'Working ' + DOT + ' ' + num(done) + ' of ' + num(all) + ' ' + DOT + ' ' + leftWords(left);
}
// THE ANSWER FIRST: one percentage for everything searchable (brain_road: done of what can be read), the Working line, what
// searchable gets her, a box to try it on what is already searchable (the Tool's own conversation, as a find; her guide's
// column shows what it found), and that she can stop here.
function heroCard(S) {
  const c = el('section', 'am-step gs-hero'); c.id = 'gs-hero';
  const F = S.road?.findable;
  c.appendChild(el('span', 'am-num', 'Step 3 ' + DOT + ' Make it searchable'));
  const top = el('div', 'gs-herotop'), l = el('div');
  l.append(K(el('div', 'gs-pct', F ? num(F.pct) + '%' : ''), 'pct'), el('p', 'gr-small', F ? 'of your mail and files are searchable' : 'Your brain could not be read just now, so the percentage is not shown. It tries again on its own.'));
  const w = K(chip('warn', workWords(S)), 'work'); w.id = 'gs-work'; w.hidden = !w.textContent; w.setAttribute('role', 'status');
  top.append(l, w);
  const bar = el('div', 'gs-bar gs-thick'), i = K(el('i'), 'bar'); i.style.width = (F ? Math.min(100, Number(F.pct) || 0) : 0) + '%'; bar.appendChild(i);
  const inp = el('input'); inp.id = 'gs-try-in'; inp.type = 'search'; inp.placeholder = 'Try it: search what is already searchable'; inp.setAttribute('aria-label', 'Search what is already searchable');
  const go = () => { const q = inp.value.trim(); if (!q) { inp.focus(); return; } inp.value = ''; C.ask(FINDS.includes(q.split(' ')[0].toLowerCase()) ? q : 'Find ' + q); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  const f = el('div', 'gs-try'); f.id = 'gs-try'; f.append(ic('eye'), inp, btn('go ghost', 'Search', go));
  const stop = el('div', 'gs-stop'); stop.id = 'gs-stop';
  stop.append(el('b', null, 'You can stop after this step.'), document.createTextNode(' Searching everything by meaning is already the Search plan ($40 a month, founding price $20). Step 4 adds understanding: totals, who owes what, what each agreement says.'));
  c.append(top, bar, p(null, el('b', null, 'Searchable'), ' means you can find anything across all your mail and files ', el('b', null, 'by what it is about'), ', not only by the exact words. Ask for the rate you agreed with a client and it finds the email, even if it never says the word rate.'),
    f, el('small', 'gs-srcnote', 'What it finds opens with ' + guideName() + ', beside this step.'), stop);
  return c;
}
// ONE ROW: the name with its count in small words and one status word. A source's row adds, under it, its own meter while it
// is being read (the press's own done of total, search_plan's; the time left at source_read_progress's measured pace), the
// Old line of a mailbox marked old, and the More button of a mailbox that is not on the business's own address (oldLine, markOld).
function leaf(name, mini, word, tone) {
  const r = el('div', 'gs-r'), l = el('span', 'gs-rn');
  l.appendChild(el('b', null, name)); if (mini) l.appendChild(K(el('small', null, mini), 'm'));
  r.appendChild(l); if (word) r.appendChild(chip(tone, word));
  return r;
}
function srcLeaf(S, q, nm, own, mini, word, tone) {
  const w = el('div', 'gs-src'), line = el('div', 'gs-srcline');
  line.appendChild(leaf(nm, mini, word, tone));
  const dom = q && q.kind === 'mail' ? domOf(q) : null;
  if (dom && own && dom !== own && q.state !== 'not_counted' && q.old_searchable_only !== true) { const m = btn('gs-dots', String.fromCharCode(8943), () => markOld(q, true, nm, own)); m.setAttribute('aria-label', 'More for ' + nm); m.title = 'More'; line.appendChild(m); }
  w.appendChild(line);
  if (q && q.state === 'reading') {
    const all = Number(q.reading_total) || 0, done = Number(q.reading_done) || 0, pg = (S.prog ?? []).find((x) => x.source === q.key);
    const bar = el('div', 'gs-bar'), i = K(el('i'), 'w'); i.style.width = (all ? Math.min(100, Math.round((done / all) * 100)) : 0) + '%'; bar.appendChild(i);
    w.append(bar, K(el('small', 'gs-srcnote', num(done) + ' of ' + num(all) + ' done ' + DOT + ' ' + leftWords(pg ? pg.minutes_left : null)), 'n'));
  }
  if (q && q.kind === 'mail' && q.old_searchable_only === true) w.appendChild(oldLine(q, nm));
  return w;
}
// ONE FOLDING GROUP: its name, one line of what is in it, a summary word, then its rows; open unless she folded it.
function grp(key, icon, title, sub, word, tone, kids) {
  const d = el('details', 'gs-grp'); d.id = 'gs-g-' + key; d.open = open3[key] !== false;
  d.addEventListener('toggle', () => { open3[key] = d.open; });
  const s = el('summary'), t = el('span', 'gs-rn');
  t.append(el('b', null, title), K(el('small', null, sub), 's'));
  s.append(ic(icon), t); if (word) s.appendChild(K(chip(tone, word), 'c'));
  const b = el('div', 'gs-sub'); b.append(...kids);
  d.append(s, b);
  return d;
}
// YOUR MAIL AND FILES, as she knows them in Google. The rows are the one reading of sources (sources_view), so the list is
// there before any price is; the counts and the status words are search_plan's and land when it does.
function treeCard(S) {
  const c = el('section', 'am-step gs-tree'); c.id = 'gs-tree';
  const hd = el('div', 'gs-treehd'); hd.append(el('h2', 'am-h2', 'Your mail and files'), el('small', 'gs-srcnote', 'as they are in Google ' + DOT + ' tap a group to fold it'));
  c.appendChild(hd);
  const src = S.src?.rows ?? [], P = S.splan && S.splan.ok === true ? S.splan : null, pr = P ? planRows(P) : [];
  const by = (r) => pr.find((q) => q.key === r.source_key), nm = names(S, pr), own = P ? ownDomain(P) : null;
  if (!P) c.appendChild(S.splanErr || S.late?.has('plan') ? p('gr-small', 'The counts could not be read just now' + (S.splanErr ? ': ' + String(S.splanErr) : '') + '. It tries again on its own.') : p('working gr-small', 'Counting what there is to read, for free'));
  const show = (r) => { const q = by(r); return q ? nm[q.key] : isKey(String(r.name || ''), { key: r.source_key }) ? String(r.what || 'Drive') : String(r.name); };
  const row = (r, mini) => { const q = by(r), w = q ? (WORD[q.state] || [String(q.state), '']) : (SV[r.state] || ['', '']); return srcLeaf(S, q, show(r), own, !q ? '' : q.state === 'not_counted' ? String(q.note || 'Not counted yet') : mini(q), w[0], w[1]); };
  const tally = (rows) => {
    const qs = rows.map(by).filter(Boolean), n = (s) => qs.filter((q) => q.state === s).length;
    const t = [[n('to_read'), n('to_read') === 1 ? ' needs your yes' : ' need your yes'], [n('reading'), ' reading'], [n('not_counted'), ' counting']].filter((x) => x[0]).map((x) => num(x[0]) + x[1]);
    if (t.length) return [(n('searchable') ? [num(n('searchable')) + ' searchable'] : []).concat(t).join(' ' + DOT + ' '), 'warn'];
    return qs.length ? ['Searchable', 'ok'] : ['', ''];
  };
  const add = (t) => btn('gr-link gs-add', '+ Add ' + t, () => brainPanel('add'));
  const tree = el('div', 'gs-groups');
  // GMAIL: each mailbox by its address, its emails, one status word.
  const mail = src.filter((r) => r.group === 'email'), mt = tally(mail);
  const emails = mail.map(by).filter(Boolean).reduce((a, q) => a + (Number(q.emails) || 0), 0);
  tree.appendChild(grp('mail', 'mail', 'Gmail', mail.length ? num(mail.length) + (mail.length === 1 ? ' mailbox' : ' mailboxes') + (P ? ' ' + DOT + ' ' + num(emails) + ' emails' : '') : 'none connected yet', mt[0], mt[1],
    mail.map((r) => row(r, (q) => num(q.emails) + ' emails')).concat([add('a mailbox')])));
  // GOOGLE DRIVE: shared drives, meetings, folders shared with the Tool, each by its own name with its files. A drive with
  // nothing in it is not a row: it is said in one plain line.
  const dr = src.filter((r) => r.group === 'drives');
  const none = (r) => { const q = by(r); return !!q && q.state === 'searchable' && !(Number(q.files) > 0); };
  const isMeet = (r) => MEET.some((m) => (' ' + String(r.name || '').toLowerCase() + ' ').includes(m));
  const full = dr.filter((r) => !none(r)), meet = full.filter(isMeet), dt = tally(full);
  const shared = full.filter((r) => r.place === 'shared' && !isMeet(r)), rest = full.filter((r) => r.place !== 'shared' && !isMeet(r));
  const files = (q) => num(q.files) + ' files' + (q.state === 'to_read' ? ' ' + DOT + ' ' + num(q.to_read) + (Number(q.to_read) === 1 ? ' older one waits' : ' older ones wait') : '');
  const part = (title, rows) => (rows.length ? [el('span', 'gs-oncelab', title)].concat(rows.map((r) => row(r, files))) : []);
  const kids = part('Shared drives', shared).concat(part('Meetings', meet), part('Folders shared with the Tool', rest));
  const empty = dr.filter(none);
  if (empty.length) {
    const who = empty.map((r) => { const a = String(r.source_key).split(':')[2] || '', n = a.split('@')[0]; return r.what === 'Drive' && a.includes('@') && n ? n[0].toUpperCase() + n.slice(1) + String.fromCharCode(8217) + 's' : null; });
    const mine = who.every(Boolean), e = el('div', 'gs-empty'); e.id = 'gs-empty';
    e.append(el('small', 'gs-srcnote', mine ? (who.length > 1 ? who.slice(0, -1).join(', ') + ' and ' + who[who.length - 1] : who[0]) + ' own My Drive: only the folders shared with the Tool are read'
      : num(empty.length) + (empty.length === 1 ? ' more has nothing in it yet: ' : ' more have nothing in them yet: ') + empty.map(show).join(', ')),
      fold('What does this mean?', p(null, mine ? 'A person' + String.fromCharCode(8217) + 's own My Drive is private to them. The Tool reads only the drives and folders that were shared with it, each shown above by its own name. Nothing else in a My Drive is read. To share another folder, add a drive or folder below.'
        : 'They are connected and there is nothing in them to read. They fill in on their own when something is put there.')));
    kids.push(e);
  }
  tree.appendChild(grp('drive', 'folder', 'Google Drive', [shared.length ? num(shared.length) + (shared.length === 1 ? ' shared drive' : ' shared drives') : '', meet.length ? 'meetings' : '', rest.length ? num(rest.length) + (rest.length === 1 ? ' folder' : ' folders') : ''].filter(Boolean).join(' ' + DOT + ' ') || (dr.length ? 'nothing in them yet' : 'none connected yet'),
    dt[0], dt[1], kids.concat([add('a drive or folder')])));
  // YOUR SYSTEMS (with calendar and contacts): each by its name with the brain's own line of what it keeps, cut to its first part.
  const sys = src.filter((r) => ['systems', 'calendar', 'contacts'].includes(r.group));
  const holds = (r) => { let t = String(r.line || ''); const a = t.indexOf(': '); if (t.startsWith('Up to date') && a > 0) t = t.slice(a + 2); for (const cut of [';', '. ']) { const i = t.indexOf(cut); if (i > 0) t = t.slice(0, i); } return t.endsWith('.') ? t.slice(0, -1) : t; };
  const bad = sys.filter((r) => r.state === 'needs_you').length;
  const sk = sys.map((r) => { const w = SV[r.state] || ['', ''], d = el('div', 'gs-src'); d.appendChild(leaf(String(r.name), holds(r), w[0], w[1])); return d; });
  if (sys.length) sk.push(el('small', 'gs-srcnote', 'The Tool keeps a copy of each system so answers come in a second, refreshed on its own; when an answer depends on the very latest, it checks the system live and says so.'));
  tree.appendChild(grp('sys', 'systems', 'Your systems', sys.length ? num(sys.length) + ' connected' : 'none connected yet', !sys.length ? '' : bad ? num(bad) + (bad === 1 ? ' needs you' : ' need you') : 'Connected', bad ? 'warn' : 'ok', sk.concat([add('a system')])));
  c.appendChild(tree);
  return c;
}
// THE ONE BOX THAT ASKS, only when something needs her yes (search_plan's to_read): how many items and what they are, the
// price and the time in one sentence, See the list (each source with its check box, how far back, the boundary), then one
// button with the money in one line beside it. The terms line is drawn only until she has agreed; the credit is asked here
// only when what is checked costs more than her balance (creditAsk). The press is a preview first (search_go without confirm),
// then Yes (searchPreview). The button reads what is checked at the moment of the press, never what was checked when it was drawn.
// A PRESS WHILE ANOTHER READS (seat press-while-reading, 2026-11-12): the button is live while another source is being read;
// the brain leaves alone only what is already pressed and reading (search_go, per source).
function yesCard(S) {
  const P = S.splan && S.splan.ok === true ? S.splan : null;
  if (!P) return null;
  const all = planRows(P), need = all.filter((r) => r.state === 'to_read');
  if (!need.length) return null;
  const nm = names(S, all), pick = chosenOf(P);
  const c = el('section', 'am-step gs-yes'); c.id = 'gs-need';
  c.appendChild(el('h2', 'am-h2', 'One thing needs your yes'));
  const sum = (rows) => rows.reduce((a, r) => a + (Number(r.to_read) || 0), 0);
  const cost = Math.round(pick.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100;
  const cur = (P.choices ?? []).find((ch) => (ch.months ?? null) === (plan.months ?? null)), complete = !cur || cur.complete !== false;
  const part = (rows, one, many, where) => (rows.length ? num(sum(rows)) + ' ' + (sum(rows) === 1 ? one : many) + ' in ' + (rows.length === 1 ? nm[rows[0].key] : num(rows.length) + ' ' + where) : '');
  const what = [part(pick.filter((r) => r.kind === 'mail'), 'attachment', 'attachments', 'mailboxes'), part(pick.filter((r) => r.kind !== 'mail'), 'older file', 'older files', 'drives or folders')].filter(Boolean).join(' and ');
  const mins = pick.length && pick.every((r) => r.minutes !== null && r.minutes !== undefined) ? Math.max(...pick.map((r) => Number(r.minutes) || 0)) : null;
  const say = el('p', 'gs-say');
  say.append(K(el('span', null, pick.length ? num(sum(pick)) + (sum(pick) === 1 ? ' item: ' : ' items: ') + what + '. ' : 'Nothing is checked. '), 'what'),
    K(el('b', null, !pick.length ? '' : complete ? usd2(cost) : 'counting'), 'usd'), K(el('span', null, !pick.length ? '' : mins !== null ? ', about ' + num(mins) + ' minutes.' : ', time measured as it reads.'), 'mins'));
  c.appendChild(say);
  const d = el('details', 'gs-fold'); d.id = 'gs-list'; d.open = listOpen;
  d.addEventListener('toggle', () => { listOpen = d.open; });
  d.appendChild(el('summary', null, 'See the list'));
  for (const r of need) {
    const lab = el('label', 'gs-row gs-tick'), box = el('input'); box.type = 'checkbox'; box.checked = !plan.off[r.key]; box.setAttribute('aria-label', nm[r.key]);
    box.addEventListener('change', () => { plan.off[r.key] = !box.checked; draw(); });
    const l = el('span', 'gs-rl'); l.append(el('b', null, nm[r.key]), K(el('small', null, num(r.to_read) + (r.kind === 'mail' ? ' attachments wait' : ' older files wait')), 'n'));
    lab.append(box, l); d.appendChild(lab);
  }
  // How far back: the three choices; the count is made again for the one she picks.
  const seg = el('div', 'gr-seg gs-back'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'How far back');
  for (const ch of (P.choices ?? [])) {
    const m = ch.months === null || ch.months === undefined ? null : Number(ch.months);
    const on = m === (plan.months === null ? null : Number(plan.months));
    const b = btn('gr-amt' + (on ? ' on' : ''), String(ch.label || (m ? m / 12 + ' years' : 'Everything')), async () => { if (on) return; plan.months = m; plan.off = {}; await rePlan(); });
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    seg.appendChild(b);
  }
  d.append(el('b', 'gs-lab', 'How far back'), seg);
  if (P.boundary) d.appendChild(el('p', 'am-small', String(P.boundary)));
  d.appendChild(el('p', 'am-small', 'Uncheck anything you do not need. Counted for free; nothing is read until you press.'));
  c.appendChild(d);
  const bal = Number(P.balance_usd), known = P.balance_known === true && Number.isFinite(bal), over = known && cost > bal + 0.000001;
  if (pick.length && !mark(S, 'agreed')) c.appendChild(termsLine(S));   // the yes to the terms, kept once, before the first press that costs
  if (over) c.appendChild(creditAsk(S, cost, bal));
  const out = p('gr-small', ''); out.id = 'gs-out';
  const go = K(btn('go', 'Make them searchable' + (complete && pick.length ? ' ' + DOT + ' ' + usd2(cost) : ''), () => {
    if (!agreedNow()) { out.textContent = 'Check the box first: it says you agree to the terms of use.'; C.$('#gs-agree')?.focus(); return; }
    searchPreview(R, chosenOf(R.splan), out, go);
  }), 'go');
  go.id = 'gs-go'; go.disabled = !known || over || !complete || !pick.length;
  const act = el('div', 'gs-act');
  act.append(go, K(el('small', 'gs-srcnote', !known ? 'Your credit could not be read just now, so nothing can be started. It tries again on its own.' : over ? 'Add the credit above first.' : 'Paid from your credit (' + usd2(bal) + ' left)'), 'bal'));
  c.append(act, out);
  return c;
}
// WHAT IS NOT SEARCHABLE, AND WHY, folded at the foot (decision 1156.5). The table is drawn when she opens the fold, from the
// reading on the page at that moment (notBody), and again each time she opens it.
function notCard(S) {
  const c = el('section', 'am-step gs-not'); c.id = 'gs-not';
  const d = el('details', 'gs-fold'); d.id = 'gs-notfold';
  const b = K(el('div', 'gs-notbody'), 'b');
  d.append(el('summary', null, 'What is not searchable, and why'), b);
  d.addEventListener('toggle', () => {
    if (!d.open) return;
    b.replaceChildren();
    if (R?.road?.findable) notBody(R, b); else b.appendChild(p('gr-small', 'Your brain could not be read just now. It tries again on its own.'));
  });
  c.appendChild(d);
  return c;
}
// WHAT IS NOT SEARCHABLE, AND WHY (the table of seat setup-findable-table; since seat step3-fresh 2026-11-12, decision 1156.5,
// folded at the foot of step 3 and drawn by notBody into the fold when she opens it; word searchable, decision 1155): what is searchable now, what is
// being read, what waits for her yes, what is not read by her choice with its price, and what is not read and why. Every count
// is brain_road's (the page reads drive_coverage only through it: that table is the service's). The percentage is the brain's
// own and counts only what a press can read; a row that puts mail and drives together adds two of the brain's counts and says
// both. The one measured price that exists is for pictures in drives (source_pictures_state, the Scans page's own reading);
// for pictures, recordings and scans in mail there is no price and no press yet, and the row says how the price will be
// measured, never a guess. NOT HERE YET, said on the sheet: each held or unreadable item by name (no brain function lists them).
function tRow(title, sub, value, act) {
  const d = el('div', 'gs-pl gs-trow'); const l = el('span'); l.appendChild(el('b', null, title)); if (sub) l.appendChild(el('small', null, sub));
  const r = el('span', 'gs-tval'); if (value !== null && value !== undefined) r.appendChild(el('b', 'gs-pv', value)); if (act) r.appendChild(act);
  d.append(l, r); return d;
}
const split = (a, b) => 'In mail: ' + num(a) + ' ' + DOT + ' in drives: ' + num(b) + '.';
function notBody(S, host) {
  const D = S.road, F = D.findable, M = D.mail ?? {}, Fi = D.files ?? {}, NS = F.not_searchable ?? D.ready?.not_searchable ?? {};
  const n = (v) => Number(v) || 0;
  const body = el('div', 'gs-table'); body.id = 'gs-table';
  body.appendChild(p('gr-small', 'The percentage counts only what a press can read. What cannot be read is said below with its reason, never counted as missing.'));
  body.appendChild(tRow('Searchable now', 'Emails, attachments and drive files', num(F.done)));
  const rd = n(M.attach_reading) + n(Fi.waiting);
  body.appendChild(tRow('Reading now', rd > 0 ? leftWords(F.minutes_left) : 'Nothing is being read just now', num(rd)));
  const wy = n(M.attach_waiting) + n(Fi.waiting_yes);
  body.appendChild(tRow('Waiting for your yes', 'Attachments and drive files a press can read. ' + split(M.attach_waiting, Fi.waiting_yes), num(wy),
    wy > 0 ? btn('gr-link', 'Yes' + String.fromCharCode(8230), () => C.$('#gs-need')?.scrollIntoView({ block: 'start' })) : null));
  const HOW = ' No price yet: it is measured on a small sample of your own before you are asked. Not offered yet.';
  const pics = el('div', 'gs-tpics'); pics.id = 'gs-tpics';
  const choice = [
    [n(NS.pictures_and_video), 'Pictures and videos in mail', 'Logos and photos in emails. Reading text in a picture uses AI.' + HOW],
    [n(NS.recordings), 'Recordings in mail', 'Voice recordings attached to emails. Turning speech into text uses AI.' + HOW],
    [n(NS.scans), 'Scans in mail', 'Scanned documents attached to emails; they need text recognition, which uses AI.' + HOW],
  ].filter((x) => x[0] > 0);
  body.append(el('span', 'gs-oncelab gs-thead', 'Not read, your choice'), pics);
  for (const [k, t, s] of choice) body.appendChild(tRow(t, s, num(k)));
  const held = [n(NS.held_by_policy), n(NS.drive_held_by_policy)], cant = [n(NS.could_not_read), n(NS.drive_could_not_read)];
  body.appendChild(el('span', 'gs-oncelab gs-thead', 'Not read, and why'));
  body.appendChild(tRow('Held back as private or not business', 'A privacy rule kept them out, so nobody finds them by mistake. ' + split(held[0], held[1]), num(held[0] + held[1])));
  body.appendChild(tRow('Could not be read', 'The Tool tried and could not open them. ' + split(cant[0], cant[1]), num(cant[0] + cant[1])));
  if (n(NS.drive_not_read) > 0) body.appendChild(tRow('Read only in part', 'Drive files the Tool did not read to the end. This is ours to fix; there is nothing for you to do.', num(NS.drive_not_read)));
  body.appendChild(el('p', 'am-small', 'Each of these by name, with where it is and its reason, is not listed here yet.'));
  host.appendChild(body);
  // pictures in your drives are read each time the fold is opened (notCard)
  // pictures in drives: the one measured price, read when the table opens (owner only; the brain gives the price to nobody else)
  pics.appendChild(p('working no-late gr-small', 'Reading the price of pictures in your drives'));
  rpc('source_pictures_state', { p_source_key: null }).then(({ data, error }) => {
    if (!pics.isConnected) return;
    if (error || !data || data.ok !== true) { pics.replaceChildren(p('gr-small', 'Pictures in your drives could not be read just now (' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + ').')); return; }
    if (!(n(data.waiting) > 0)) { pics.replaceChildren(); if (!choice.length) pics.appendChild(p('gr-small', 'Nothing is left out by choice.')); return; }
    const price = usd2(data.estimate_usd);
    pics.replaceChildren(tRow('Pictures in your drives', 'Scanned contracts, photographed receipts and invoices. Reading text in a picture uses AI. ' + (price ? 'The price is ' + String(data.measured || 'measured') + '.' : 'The price is shown to the owner.'),
      num(data.waiting), btn('gr-link', (price ? price + ' ' + DOT + ' ' : '') + 'Yes' + String.fromCharCode(8230), () => brainPanel('scans'))));
  });
}
// THE AI CREDIT, ASKED WHERE THE FIRST MONEY IS SPENT (decision 1150.2; supersedes the AI credit step). Only when what is checked
// costs more than the balance: the shortfall plus a quarter as a cushion, in whole dollars, never under the $5 a card payment
// takes (topup_start's own floor). The fee is cardFee's sum (studio-core pay_fee's, which topup_start answers again). A balance
// that covers the press is never asked. Other amount opens the one Top up sheet.
function creditAsk(S, cost, bal) {
  const gap = Math.ceil(Number(((cost - bal) * 100).toFixed(6))) / 100;
  const add = Math.max(5, Math.ceil(gap * 1.25));
  const f = cardFee(add);
  const d = el('div', 'gs-credit'); d.id = 'gs-credit';
  d.append(el('b', null, 'Add AI credit first ' + DOT + ' ' + usd2(add)),
    p('gr-small', 'What is checked costs ' + usd2(cost) + ' and your credit is ' + (bal < 0 ? usd2(-bal) + ' under zero' : usd2(bal)) + '. ' + usd2(add) + ' covers the ' + usd2(gap) + ' this step needs, with a cushion so it cannot stop halfway. What is left stays in your balance for the next step. Or uncheck something in the list.'),
    priceRow('AI credit', usd2(add)), priceRow('Card fee, at the card company' + String.fromCharCode(8217) + 's price', usd2(f)), priceRow('Total, one time', usd2(add + f)),
    el('p', 'am-small', 'From the count above and your AI meter' + String.fromCharCode(8217) + 's balance. The credit goes to the AI companies at their own price; Verrandi adds nothing. You type your card on Stripe' + String.fromCharCode(8217) + 's own page.' + (add === 5 && gap * 1.25 < 5 ? ' $5 is the smallest card payment.' : '')));
  const pay = !!S.marks?.payments, card0 = cardOf(S);
  if (pay && (!card0 || card0.mode !== 'live')) d.appendChild(p('gr-small gr-test', 'Card payments are in test mode: on Stripe use the test card 4242 4242 4242 4242, any future date, any 3 digits. A test payment is shown here and is never added to your balance.'));
  const msg = p('gr-small', '');
  const go = btn('go', 'Add ' + usd2(add) + ' with Stripe', async () => {
    if (!agreedNow()) { msg.textContent = 'Check the box first: it says you agree to the terms of use.'; C.$('#gs-agree')?.focus(); return; }
    if (!pay) { msg.textContent = 'Card payments are not switched on for this brain yet, so nothing was started.'; return; }
    go.disabled = true; msg.className = 'working no-late gr-small'; msg.textContent = 'Opening the payment page';
    const { data, error } = await rpc('topup_start', { p_amount_usd: add });
    if (error || !data || data.ok !== true || !data.url) { msg.className = 'gr-small'; msg.textContent = 'Not started: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; go.disabled = false; return; }
    location.href = String(data.url);
  });
  const gw = el('div', 'gr-go gs-two'); gw.append(go, btn('go ghost', 'Other amount', () => topUp(S)));
  d.append(gw, msg);
  return d;
}
function understandShape(S) {
  const U = S.usam, live = understandLive(S);
  const m = !!U && U.ok === true && U.state === 'done' && Number.isFinite(Number(U.predicted_remaining_usd));
  // drives beside the mailboxes, and the time from the sample's own pace (seat understand-drives 2026-11-12, decisions 1153, 1152)
  return shape('Each conversation you choose, every file attached to it and every file in the drives you choose is read once and the facts in it are noted. You get exact answers: who, how much, when.',
    live ? 'inside your limit' : m ? usd2(U.predicted_remaining_usd) + ', likely ' + usd2(U.low_usd) + ' to ' + usd2(U.high_usd) : 'measured before you press',
    live ? 'reading now' : m && U.time && U.time.measured === true ? howLong(U.time.minutes) : 'measured once it starts',
    m ? 'Measured on a sample of your own mail and files. Your limit is never passed.' : 'A small sample, never more than $' + SAMPLE_CAP + ', measures the price on your own mail and files first. Your limit is never passed.', live);
}
// AN OLD MAILBOX (decision 1140; source_mark_old, seat privacy-check-rules; arranged by seat setup-findable-table 2026-11-12 on
// decision 1150, picture Part 3). Offered only behind the row's own More button, and only for a mailbox that is not on the
// business's own address (ownDomain); the live mailboxes do not offer it. Both sides of the trade in four lines, then her yes.
// After, the row says "Old: only you search it" with Undo. A mailbox already marked old always shows that line and its Undo,
// whatever address it is on. SUPERSEDED 2026-11-12, Alex's yes on 1150: "Old, searchable only" under every mailbox (oldRow).
function oldLine(r, nm) {
  const d = el('div', 'gs-oldrow');
  d.append(el('small', null, 'Old: only you search it'), btn('gr-link', 'Undo', () => markOld(r, false, nm, null)));
  return d;
}
function markOld(r, old, nm, own) {
  const body = el('div');
  if (old) {
    if (own) body.appendChild(p('gr-small', nm + ' is not on your company' + String.fromCharCode(8217) + 's address (' + own + ').'));
    body.appendChild(points([
      ['eye', ['You', true], ' can still search everything in it.'],
      ['lock', ['Nobody else', true], ' in your company can find what is in it.'],
      ['brain', ['The Tool will not understand it', true], ', so nothing in it counts when you ask about the business.'],
      ['coin', ['It costs less:', true], ' no privacy check, no understanding.'],
    ]));
  } else body.appendChild(p(null, 'Its emails and attachments then get the privacy check, within the daily limit, your team can find what they are allowed to see, and it can be understood like your other mailboxes.'));
  const said = p('gr-small', '');
  const yes = btn('go', old ? 'Yes, mark it old' : 'Yes, undo', async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = old ? 'Marking it old' : 'Undoing';
    const { data, error } = await rpc('source_mark_old', { p_source_key: r.key, p_old: old, p_identity: null });
    if (error || !data || data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not changed: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(old ? 'Marked old: only you search it.' : 'No longer old.');
    await rePlan();
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no);
  body.append(acts, said);
  sheet.open(old ? 'Mark this mailbox old?' : 'Undo old for ' + nm + '?', body);
}
async function rePlan() {
  const card0 = C.$('#gs-need'); if (card0) { card0.replaceChildren(p('working no-late', 'Counting, for free')); card0.dataset.sig = ''; }
  await readPlan(R);
  draw();
}
// The preview, then Yes: both are search_go, the one press (nothing else starts reading from this card).
async function searchPreview(S, pick, out, go) {
  go.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Working out the exact price';
  const args = { months: plan.months, sources: pick.map((r) => r.key) };
  const { data, error } = await goAsk({ ...args, confirm: false });
  out.className = 'gr-small'; out.textContent = ''; go.disabled = false;
  if (error || !data || data.ok !== true) { out.textContent = 'Not started: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; return; }
  if (data.nothing_to_read) { out.textContent = 'Everything you chose is already searchable.'; return; }
  const body = el('div');
  body.append(priceRow('Items to make searchable', num(data.total_items)), priceRow('Price, one time', usd2(data.total_usd)),
    p('gr-small', data.minutes === null || data.minutes === undefined ? 'Time: measuring' : 'about ' + num(data.minutes) + ' minutes'));
  if (data.note) body.appendChild(p('gr-small', String(data.note)));
  const busy = Array.isArray(data.already_reading) ? data.already_reading.length : 0;   // chosen, but already pressed and reading: left to that press, not in this price
  if (busy) body.appendChild(p('gr-small gs-busy', busy === 1 ? 'One source you chose is already being read. It is left as it is and is not in this price.' : num(busy) + ' sources you chose are already being read. They are left as they are and are not in this price.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, make it searchable ' + DOT + ' ' + usd2(data.total_usd), async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting';
    const r = await goAsk({ ...args, confirm: true });
    if (r.error || !r.data || r.data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + String(r.error?.message ?? r.data?.note ?? r.data?.reason ?? 'no reason was given') + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(r.data.note || 'Started. You get one short email when it is done.'));
    mount(C);
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no);
  body.append(acts, said);
  sheet.open('Make them searchable?', body);
}
// THE METER'S READ ESTIMATE (lens-ask read_estimate), kept for five minutes: step 4 and step 5's monthly figure and price per
// email (S.est). Step 3's plan no longer uses its balance (lens-ask reads the meter itself).
let balAt = 0, balV = null, estV = null, estFly = null;
function meterBalance() {
  if (estV && Date.now() - balAt < 300000) return Promise.resolve(balV);
  if (!estFly) estFly = C.askBody({ read_estimate: { months: 24 } }).catch(() => null).then((r) => {   // one request, however many ask at once
    const b = Number(r?.balance?.balance_left_usd ?? r?.estimate?.balance?.balance_left_usd);
    balV = Number.isFinite(b) ? b : null; balAt = Date.now(); estV = r && r.ok === true ? r : null; estFly = null;
    return balV;
  });
  return estFly;
}
// THE PLAN AND THE PRESS, THROUGH LENS-ASK (ruling 1141.5): the same JSON as the brain's search_plan / search_go, with the balance
// lens-ask reads from the meter. A refusal or an unreachable Tool comes back as { error } with its reason, never as an empty plan.
async function planAsk(months) {
  const r = await C.askBody({ search_plan: { months } });
  return r && r.ok === true ? { data: r } : { error: { message: String(r?.note ?? r?.reason ?? r?.error ?? 'no reason was given') } };
}
async function goAsk(q) {
  const r = await C.askBody({ search_go: q });
  return r && r.ok === true ? { data: r } : { data: r && typeof r === 'object' && r.ok === false && (r.note || r.reason) ? r : null, error: r && r.ok === false && (r.note || r.reason) ? null : { message: String(r?.error ?? 'no reason was given') } };
}
async function readPlan(S, keepLast) {
  const pl = await planAsk(plan.months);
  if (pl.error) { if (!keepLast) S.splan = null; S.splanErr = pl.error.message; } else { S.splan = pl.data; S.splanErr = null; }
}
// While anything is being read, the Working line at the top of step 3 is refreshed every 15 seconds from source_read_progress
// (only on step 3, only while shown), in place; the rows and the percentage follow on the page's own re-read every minute.
let sPoll = null;
function searchPoll() {
  clearTimeout(sPoll);
  if (!(R?.prog ?? []).some((x) => x.state === 'reading')) return;
  sPoll = setTimeout(async () => {
    if (!C.$('#s-ready')?.hidden && at === 'search' && !C.$('#gr-sheet')) {
      const S = R, { data, error } = await rpc('source_read_progress');
      if (R === S && !error && Array.isArray(data)) { S.prog = data; const w = C.$('#gs-work'), t = workWords(S); if (w) { w.textContent = t; w.hidden = !t; } }
    }
    searchPoll();
  }, 15000);
}
// QUESTIONS (steps 1 to 3): details that open in place, the approved questions and answers.
function questions(list) {
  const d = el('div', 'gs-qs'); d.id = 'gs-qs';
  d.append(el('h2', 'am-h2', 'Questions'), ...list.map(([q, a]) => fold(q, p(null, a))));
  return d;
}
function okMark(text) { const d = el('div', 'gs-okline'); d.append(ic('check', 'gs-okic'), el('b', null, text)); return d; }
function goOn(to, label) { const d = el('div', 'gr-go'); d.appendChild(btn('go', label || 'Continue', () => { at = to; draw(); window.scrollTo({ top: 0 }); })); return d; }
function priceRow(a, b, small) { const d = el('div', 'gs-pl'); const l = el('span'); l.appendChild(el('b', null, a)); if (small) l.appendChild(el('small', null, small)); d.append(l, el('b', 'gs-pv', b)); return d; }
// THE BRAIN'S OWN PANELS, one press away (the room's own presses: the one connect flow, Downloads, Loose files, Scans,
// Connect your Claude). The Brain opens with the way back line (unmount) at the top.
function brainPanel(key) {
  const sec = C.$('#s-summary');
  if (!sec || !C.overRoom) { toast('That could not be opened just now.'); return; }
  if (overY === null) overY = window.scrollY;
  document.body.classList.add('gr-over'); sec.hidden = false;
  if (key !== 'scans' && key !== 'mail') { C.overRoom(key); return; }
  C.overRoom(null);
  if (key === 'scans' || key === 'mail') {   // these open from their own square on the room, which draws first
    let n = 0;
    const t = setInterval(() => { const q = C.$('#s-summary [data-square="' + key + '"]'); n += 1; if (q) { clearInterval(t); q.click(); } else if (n > 30) { clearInterval(t); closeOver(false); toast('That could not be opened just now. Try again in a moment.'); } }, 100);
  }
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
    const { data, error } = await rpc('getting_ready_mark', { p_key: 'agreed', p_value: { yes: true }, p_wording: TERMS_V });
    said.className = 'gr-small';
    if (error || !data || data.ok !== true) { box.checked = false; box.disabled = false; said.textContent = 'Not kept: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; return; }
    mount(C);
  });
  w.append(lab, fold('Read the terms (2 minutes)', p(null, TERMS), p('gr-small', 'These are the plain words. The full user agreement follows them.')), said);
  return w;
}
const agreedNow = () => !!(R && mark(R, 'agreed')) || !!C.$('#gs-agree')?.checked;   // once agreed, the terms line is not drawn again (decision 1156.4)
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
    out.splice(1, 0, shape('A database of your own, where everything the Tool learns about your business is kept. You get a memory that stays yours.', 'about $25 a month', live ? 'done: it is set up' : 'not answering just now', 'Paid to Supabase on your own card, at Supabase' + String.fromCharCode(8217) + 's published price. Not a Verrandi charge.'));
    if (live) out.push(okMark('Your database is set up'), goOn('connect'));
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
  connect(S) {
    const rows = S.src?.rows ?? [];
    const by = (g) => rows.filter((r) => r.group === g);
    const out = [H('Connect everything you use.'), shape('Tap each one and sign in on their page. You get everything you use in one place, counted for free.', 'free', 'one sign-in each, on their own page', 'Connecting and counting use no AI, so they cost nothing. Step 3 shows the count and its price before anything is read.')];
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
    out.push(rows.length ? goOn('search') : (() => { const d = el('div', 'gr-go'); d.appendChild(btn('go', 'Connect your first one', () => brainPanel('add'))); return d; })());
    out.push(questions(CARDS.connectQs().filter((q, i) => i < 4 || i === 7)));
    return out;
  },
  // STEP 3 · MAKE IT SEARCHABLE (decision 1150.2): the count and its price, the AI credit asked here when it is short, the one
  // press. SINCE DECISION 1156 (seat step3-fresh, 2026-11-12): the answer first, her sources as she knows them, the one box that
  // asks, and what is not searchable; each card has its id, so a re-read changes numbers in place (draw, inPlace).
  search(S) {
    const rows = S.src?.rows ?? [];
    const prog = S.prog ?? [];
    const out = [heroCard(S), treeCard(S)];
    const yes = yesCard(S); if (yes) out.push(yes);
    out.push(notCard(S));
    const green = rows.length > 0 && prog.length > 0 && prog.every((r) => r.state === 'up_to_date');
    const acts = el('div', 'gr-chips'); acts.id = 'gs-cont';
    const cont = K(btn('go', 'Continue', () => { at = 'understand'; draw(); window.scrollTo({ top: 0 }); }), 'c'); cont.disabled = !(green || roadSteps(S)[1].state === 'done');   // the brain's searchable rule (1142.1), or every row green
    acts.append(cont);
    out.push(acts);
    out.push(questions(CARDS.connectQs().filter((q, i) => i >= 4 && i < 7).concat([
      ['What does searchable mean?', 'Every email, attachment and file you connect is read once and gets a fingerprint of its meaning, so you can find it by what it is about, not only by its exact words. It shows you your own documents and never invents anything.'],
      ['Which AI does this step use?', 'Two, each tested for its job: OpenAI makes the search fingerprint of every item, and Claude, by Anthropic, gives every item a quick privacy check, so sensitive things reach only the right people.'],
      ['Why pay ahead?', 'So you are never surprised by a bill, and the Tool never spends money you did not put in.'],
      ['What happens to what is left?', 'It stays in your balance for the next steps.'],
      ['Is my card safe?', 'You type it on the page of Stripe, the payment company. Verrandi only ever sees the card brand and the last four digits.'],
    ])));
    return out;
  },
  // the approved questions of connecting and searching, shared by steps 2 and 3 (not a step)
  connectQs: () => ([
      ['Is connecting safe?', 'You sign in with the company itself, on their page, so the Tool never sees your password. Each connection gives permission to read, the way you let a phone app read your calendar.'],
      ['Does it change anything in my mail or files?', 'It reads. Your email still looks like your email, and your files stay where they are.'],
      ['Who in my company will see what?', 'Everyone sees only what they can already open in your own systems. Your owner sees what your owner can see; a new hire sees what a new hire can see.'],
      ['What about pay, health and personal matters?', 'Every item gets a quick privacy check when it comes in, so sensitive things reach only the people who should see them. Anything made from private information stays just as private.'],
      ['How far back does it go?', 'The last 2 years, unless you choose otherwise. Older mail can be added any time, with its price shown first.'],
      ['What does it cost after this?', 'Making new mail and files searchable as they arrive costs a few cents a month. Understanding, the next step, has its own price, shown there first.'],
      ['Is everything made searchable, even junk mail?', 'Yes: everything you connect, so nothing is missed. Pictures and recordings are separate choices. Sorting out what matters comes at the next step.'],
      ['Can I disconnect something later?', 'Yes, any time, in Settings. You see every connection there.'],
    ]),
  // STEP 4 · UNDERSTAND (spec part 2, approved 2026-11-09). Every number is the brain's: the groups, counts and prices are
  // mail_groups' (per mailbox, summed), priced with the meter's measured price of one email (read_estimate per_message_usd), each
  // estimate with its range (1137). SEAT setup-wire wired what seat understand-step landed: the three questions (answersCard), the
  // sample and its measured price, her limit and Understand my mail (sampleBlock), and the live card through its owner door.
  understand(S, st) {
    const out = [H('Understand what matters.'), understandShape(S)];
    out.push(answersCard(S));
    out.push(groupsCard(S));
    const M = monthlyOf(S);
    const how = card('coin', 'How your price works', null);
    const ol = el('ol', 'gs-num3');
    for (const [n, t] of [['1', 'A small sample first, never more than $' + SAMPLE_CAP + '. About 100 of your conversations and some of your files (attached to mail and in the drives you chose) are read, and you see the price measured on your own mail and files.'], ['2', 'You set the limit. It starts at that price, it is never passed, and Stop works any time: you pay only for what was read.'], ['3', 'Then only new mail, ' + (M === null ? 'its monthly price measured' : 'about ' + usd2(M) + ' a month') + ', shown measured after your first month, in Settings.']]) { const li = el('li'); li.append(el('span', 'gs-n', n), el('span', null, t)); ol.appendChild(li); }
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
    acts.append(cont);
    out.push(acts);
    out.push(questions([
      ['Is this one time?', 'Yes. This reads your past mail once. After that, only new mail in the same groups is read as it arrives, ' + (M === null ? 'its monthly price measured' : 'about ' + usd2(M) + ' a month') + ' at your pace, plus about 1 cent for each question you ask.'],
      ['Why a sample first?', 'Every business' + String.fromCharCode(8217) + 's mail is different. The sample measures what your own mail costs to understand, so the price you agree to is yours, not an average.'],
      ['Can it cost more than I agreed?', 'No. It stops before your limit. If something is left, it tells you how much and what it would cost, and you decide.'],
      ['What happens to the mail I do not choose?', 'It stays searchable. If a question needs it later, that piece is read then, with its price shown.'],
      ['Will I know when it is done?', 'Yes, one short email from your own mailbox to you. You can close the page in the meantime.'],
    ]));
    return out;
  },
  // STEP 5 · READY (spec part 2). The brain's rows from the same readings the Brain shows (brain_road, the one reading of
  // sources); the monthly costs: the database from the AI tab's own estimate (Supabase's list price), keeping up from the
  // meter's monthly estimate per source (read_estimate monthly_usd), questions and the plan as approved words.
  ready(S, st) {
    const ok = st[st.length - 1].done;
    const out = [H(ok ? 'Your brain is ready.' : 'Your brain is not ready yet.'), shape('Mail, Drives and the rest of the Tool open, and your brain keeps up by itself.', 'your monthly costs, below', ok ? 'now' : 'when steps 1 to 4 are done', 'Each monthly figure below says where it comes from.')];
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
// everything else are off by default and stay searchable. Under the groups, the sample and the limit (sampleBlock).
let uOff = { automated: true, rest: true }, gAt = 0;
function groupsCard(S) {
  const c = card('brain', 'Understand your past mail and files ' + DOT + ' one time', null);
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
    box.addEventListener('change', async () => { uOff[g.group] = !box.checked; uLimit = null; draw(); await readSample(R); if (at === 'understand' && !C.$('#gr-sheet')) draw(); });   // the sample's prediction follows her choice
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
  // OVERNIGHT AT HALF PRICE is not built (seat understand-step: it needs a second way of reading), so it is not shown. Time is
  // given once the reading has started and its pace is measured (the live card), never guessed here.
  c.appendChild(sampleBlock(S));
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
  const all = await Promise.all(boxes.map((k) => rpc('mail_groups', { p_source_key: k, p_months: 24, p_rates: rates }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: e?.message ?? String(e) }))));
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
// pressed: a mailbox keeps its groups, a drive has none, and both keep the limit the press gave them (seat understand-drives 2026-11-12)
const pressedRow = (x) => (Array.isArray(x.groups) && x.groups.length > 0) || (x.ceiling_usd !== null && x.ceiling_usd !== undefined);
function understandLive(S) {
  // a mailbox counts here once it is pressed (its groups are kept); a sample alone is shown by its own block (sampleBlock)
  const rows = (S.uprog ?? []).filter((x) => (x.state === 'reading' || x.state === 'at_ceiling') && pressedRow(x));
  if (!rows.length) return S.uprogErr ? progressFailed('gs-ulive', 'Understanding your mail', S.uprogErr) : null;
  const total = rows.reduce((a, x) => a + (Number(x.total) || 0), 0), done = rows.reduce((a, x) => a + (Number(x.done) || 0), 0);
  const spent = rows.reduce((a, x) => a + (Number(x.so_far_usd ?? x.spent_usd) || 0), 0);
  const lim = rows.every((x) => Number.isFinite(Number(x.ceiling_usd)) && x.ceiling_usd !== null) ? rows.reduce((a, x) => a + Number(x.ceiling_usd), 0) : null;
  const c = el('section', 'am-step gs-live'); c.id = 'gs-ulive';
  c.appendChild(el('span', 'am-num', rows.some((x) => String(x.source_key || '').startsWith('drive:')) ? 'Understanding your mail and files' : 'Understanding your mail'));
  c.appendChild(el('div', 'gs-big', num(done) + ' of ' + num(total)));
  const bar = el('div', 'gs-bar gs-thick'); const i = el('i'); i.style.width = (total ? Math.min(100, Math.round((done / total) * 100)) : 0) + '%'; bar.appendChild(i); c.appendChild(bar);
  // minutes left only when every reading mailbox has its pace measured (understand_progress pace_measured); on track only when
  // every one has a measured total (on_track_usd), otherwise said plainly
  const mins = rows.every((x) => x.pace_measured === true && x.minutes_left !== null && x.minutes_left !== undefined) ? Math.max(...rows.map((x) => Number(x.minutes_left) || 0)) : null;
  c.appendChild(p('gr-small', mins === null ? 'Time: measuring the pace' : 'about ' + num(mins) + ' minutes left'));
  const track = rows.every((x) => x.on_track_usd !== null && x.on_track_usd !== undefined && Number.isFinite(Number(x.on_track_usd))) ? rows.reduce((a, x) => a + Number(x.on_track_usd), 0) : null;
  c.appendChild(p(null, 'So far ' + usd2(spent) + (track !== null ? ', on track for ' + usd2(track) : ', on track for: measuring') + (lim !== null ? ' ' + DOT + ' your limit ' + usd2(lim) : '') + '.'));
  if (S.uprogErr) c.appendChild(p('gr-small gs-over', NOREAD + ' It keeps going. The count above is the last one seen.'));
  if (rows.some((x) => x.state === 'at_ceiling')) c.appendChild(p('gr-small', 'It stopped before your limit. What is left is not read; you can raise the limit and press again.'));
  const out = p('gr-small', '');
  const stop = btn('go ghost', 'Stop', async () => {
    stop.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Stopping';
    const res = await Promise.all(rows.map((x) => rpc('source_read_approve', { p_source_key: x.source_key, p_mode: 'understand_stop', p_months: null, p_confirm: true }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: String(e?.message ?? e) }))));
    out.className = 'gr-small'; out.textContent = res.map((r) => String(r?.note ?? r?.reason ?? 'no reason was given')).join(' ');
    setTimeout(() => mount(C), 2500);
  });
  const g = el('div', 'gr-go'); g.appendChild(stop); c.append(g, out);
  c.appendChild(p('gr-small', 'You can close this page or keep working. It keeps going, and you get one short email when it is done.'));
  return c;
}
// ---------------------------------------------------------------------------------------------------------------------
// STEP 4, WIRED (seat setup-wire over seat understand-step's brain side). All owner only: the brain refuses anyone else.
const GROUP_TITLE = { people: 'Your conversations', money: 'Money mail', automated: 'Automated mail', rest: 'Everything else' };
const MAILBOX_FOR = [['everything', 'Everything'], ['sales', 'Sales'], ['accounting', 'Accounting'], ['hiring', 'Hiring'], ['old', 'Old, searchable only']];
const WORK_WITH = [['businesses', 'Businesses'], ['people', 'People'], ['both', 'Both']];
const SAMPLE_CAP = 5;   // the sample's own limit, never passed (understand_sample p_cap_usd, the brain's own default). SUPERSEDED 2026-11-12 (seat setup-findable-table on seat understand-files' report): 3 and the words "about $2"; the sample now reads attached files too and costs more, so the honest words are its limit
let ua = null;          // her three answers as she taps them: { mailboxes: {key: for}, work_with, money_words: [] }
const fmtShort = (k) => String(k || '').split(':').pop();
function chosenGroups(S) { const G = S.mgroups; if (!G || G.err || !G.groups) return ['money', 'people'].filter((g) => g === 'money' || !uOff[g]); return G.groups.filter((g) => g.always || !uOff[g.group]).map((g) => g.group); }
async function readAnswers(S) {
  const [a, m] = await Promise.all([
    rpc('understand_answers_suggest', { p_identity: null }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: String(e?.message ?? e) })),
    rpc('understand_answers_moved', { p_identity: null }).then(({ data, error }) => (error ? null : data), () => null),
  ]);
  S.uans = a || { ok: false, note: 'no reason was given' };
  S.umoved = m && m.ok === true ? m : null;
}
// STEP 4 THROUGH LENS-ASK (seat audit-fix-screen, ruling 1142.3, audit-fix-brain I3): the sample and Understand my mail are asked of
// lens-ask {understand_sample} / {understand_go}, which reads the balance from the AI meter itself, refuses a limit above it and
// refuses no limit; the screen sends no balance. SUPERSEDED here: the direct understand_sample RPC and one source_read_approve
// 'understand' press per mailbox with a share of the limit worked out on the page (seat setup-wire); the brain now presses every
// chosen mailbox under one press and shares the limit itself.
const noteOf = (r) => String(r?.note ?? r?.reason ?? r?.error ?? 'no reason was given');
async function sampleAsk(S, confirm) {
  const r = await C.askBody({ understand_sample: { groups: chosenGroups(S), months: 24, confirm, cap: SAMPLE_CAP } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
  return r && typeof r === 'object' && r.ok === true ? r : { ...(r && typeof r === 'object' ? r : {}), ok: false, note: noteOf(r) };
}
async function readSample(S) { S.usam = await sampleAsk(S, false); }
// While the sample or a press reads, step 4 refreshes every 20 seconds (only while it is shown and nothing is typed or open).
let uT = null;
function uPoll() {
  clearTimeout(uT);
  const S = R;
  if (!S || at !== 'understand') return;
  const busy = S.usam?.state === 'reading' || (S.uprog ?? []).some((x) => x.state === 'reading' && pressedRow(x));
  if (!busy) return;
  uT = setTimeout(async () => {
    if (C.$('#s-ready')?.hidden || at !== 'understand' || C.$('#gr-sheet') || typing()) { uPoll(); return; }
    await Promise.all([readSample(R), rpc('understand_progress_mine').then(({ data, error }) => { if (!error && data && data.ok === true) { R.uprog = data.sources ?? []; R.uprogErr = null; } else R.uprogErr = String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given'); }, (e) => { R.uprogErr = String(e?.message ?? e); })]);
    draw();
  }, 20000);
}
// her answers as kept, or else as suggested from counts (nothing read by AI)
function answersFrom(A) {
  if (A.answers && typeof A.answers === 'object') return { mailboxes: { ...(A.answers.mailboxes || {}) }, work_with: A.answers.work_with || A.work_with?.suggested || 'businesses', money_words: [...(A.answers.money_words || [])] };
  const mb = {}; for (const m of A.mailboxes ?? []) mb[m.source_key] = m.suggested || 'everything';
  return { mailboxes: mb, work_with: A.work_with?.suggested || 'businesses', money_words: (A.money_words ?? []).filter((w) => w.suggested).map((w) => w.word) };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function seg(list, now, fn, label) {
  const d = el('div', 'gr-seg'); d.setAttribute('role', 'group'); if (label) d.setAttribute('aria-label', label);
  for (const [v, t] of list) { const b = btn('gr-amt' + (v === now ? ' on' : ''), t, () => fn(v)); b.setAttribute('aria-pressed', v === now ? 'true' : 'false'); d.appendChild(b); }
  return d;
}
// THREE QUICK QUESTIONS (1136): pre-filled, tap what is not right, Keep my answers (understand_answers_set), then what moved
// (understand_answers_moved: the conversations per group before and now, only counts that changed).
function answersCard(S) {
  const c = card('chat', 'Three quick questions ' + DOT + ' free', null, el('p', 'am-small', 'Already filled in from what was counted. Tap anything that is not right.'));
  c.id = 'gs-answers';
  const A = S.uans;
  if (!A) { c.appendChild(p('working no-late gr-small', 'Filling in your answers from what was counted')); return c; }
  if (A.ok !== true) { c.appendChild(p('gr-small', 'Your answers could not be read just now: ' + String(A.note ?? A.reason ?? 'no reason was given') + '. The standard sorting is used: your conversations and money mail.')); return c; }
  if (!ua) ua = answersFrom(A);
  const q1 = el('div', 'gs-q'); q1.appendChild(el('b', null, 'What is each mailbox for?'));
  for (const m of A.mailboxes ?? []) {
    const r = el('div', 'gs-qrow'); const l = el('span', 'gs-rl');
    l.append(el('b', null, fmtShort(m.mailbox || m.source_key)), el('small', null, num(m.emails_2y) + ' emails kept in 2 years (junk left out)'));
    r.append(l, seg(MAILBOX_FOR, ua.mailboxes[m.source_key] || 'everything', (v) => { ua.mailboxes[m.source_key] = v; draw(); }, 'What ' + fmtShort(m.mailbox || m.source_key) + ' is for'));
    q1.appendChild(r);
  }
  q1.appendChild(el('p', 'am-small', 'Old, searchable only: it stays searchable and is not read for understanding.'));
  const q2 = el('div', 'gs-q'); q2.append(el('b', null, 'Who do you work with?'), seg(WORK_WITH, ua.work_with, (v) => { ua.work_with = v; draw(); }, 'Who you work with'));
  q2.appendChild(el('p', 'am-small', 'Anyone you have ever written to always counts as someone you work with.'));
  const q3 = el('div', 'gs-q'); q3.appendChild(el('b', null, 'What do you call the money paperwork?'));
  const words = el('div', 'gr-seg'); words.setAttribute('role', 'group'); words.setAttribute('aria-label', 'Your money paperwork');
  const listed = (A.money_words ?? []).map((w) => w.word);
  const own = ua.money_words.filter((w) => !listed.includes(w));
  for (const w of [...(A.money_words ?? []).map((x) => [x.word, x.conversations]), ...own.map((x) => [x, null])]) {
    const on = ua.money_words.includes(w[0]);
    const b = btn('gr-amt' + (on ? ' on' : ''), w[0].slice(0, 1).toUpperCase() + w[0].slice(1) + (w[1] ? ' ' + DOT + ' ' + num(w[1]) : ''), () => { ua.money_words = on ? ua.money_words.filter((x) => x !== w[0]) : [...ua.money_words, w[0]]; draw(); });
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); words.appendChild(b);
  }
  q3.appendChild(words);
  const add = el('div', 'gs-wordadd'); const inp = el('input'); inp.id = 'gs-word-in'; inp.type = 'text'; inp.maxLength = 40; inp.placeholder = 'Your own word'; inp.setAttribute('aria-label', 'Your own word for money paperwork');
  const addIt = () => { const v = inp.value.trim().toLowerCase(); if (!v) return; if (!ua.money_words.includes(v)) ua.money_words = [...ua.money_words, v]; inp.value = ''; draw(); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addIt(); });
  add.append(inp, btn('go ghost', '+ Add', addIt)); q3.append(add, el('p', 'am-small', 'The numbers are conversations in your last 2 years whose subject uses that word.'));
  c.append(q1, q2, q3);
  const kept = A.answers && typeof A.answers === 'object';
  const changed = !kept || !same(answersFrom(A), ua);
  const out = p('gr-small', '');
  const keep = btn('go ghost', kept ? 'Keep my changes' : 'Keep my answers', async () => {
    keep.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Keeping your answers and sorting again';
    const { data, error } = await rpc('understand_answers_set', { p_answers: ua, p_identity: null });
    if (error || !data || data.ok !== true) { out.className = 'gr-small'; out.textContent = 'Not kept: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; keep.disabled = false; return; }
    toast(String(data.note || 'Kept. Your mail is sorted again with your answers.'));
    R.uans = null; R.mgroups = null; gAt = 0; ua = null; R.gLoad = false; R.usam = null;
    draw();
  });
  keep.disabled = !changed;
  const g = el('div', 'gr-go'); g.appendChild(keep); c.append(g, out);
  if (!changed) c.appendChild(p('gr-small', 'Kept. Change any tap and press Keep my changes.'));
  c.appendChild(movedBlock(S));
  return c;
}
// WHAT MOVED: real counts only, the groups that changed, from understand_answers_moved.
function movedBlock(S) {
  const M = S.umoved;
  const d = el('div', 'gs-moved');
  if (!M || M.answered !== true) { d.appendChild(el('p', 'am-small', 'Until you keep your answers, the standard sorting is used: your conversations and money mail.')); return d; }
  const keys = [...new Set([...Object.keys(M.before || {}), ...Object.keys(M.now || {})])];
  const ch = keys.map((k) => [k, Number(M.before?.[k]?.conversations) || 0, Number(M.now?.[k]?.conversations) || 0]).filter(([, a, b]) => a !== b);
  d.appendChild(el('b', null, 'What your answers moved'));
  if (M.state === 'sorting') d.appendChild(p('gr-small', 'Sorting again with your answers: ' + num(M.left_to_sort_again) + ' emails left. The counts follow when it is done.'));
  if (!ch.length) d.appendChild(p('gr-small', M.state === 'sorting' ? 'Nothing has moved yet.' : 'Your answers did not move any conversation.'));
  for (const [k, a, b] of ch) d.appendChild(priceRow(GROUP_TITLE[k] || k, num(a) + ' ' + ARROW + ' ' + num(b), 'conversations in your last 2 years'));
  return d;
}
// THE SAMPLE, THE MEASURED PRICE, THE LIMIT AND UNDERSTAND MY MAIL (1137).
// EACH MAILBOX AND EACH DRIVE IS A ROW WITH A CHOICE (seat understand-drives 2026-11-12, decision 1153 point 1; time 1152): Understood
// or Findable only, from the brain's own rows (understand_sample 'rows': every connected mailbox and drive, chosen or not, with
// its counts and, once the sample is read, its own measured price and time). Her tap is kept by understand_choice_set (the
// brain holds the choice: the sample, the price and the press all read it there) and the sample is read again for the exact
// price and range; until that answers, the total is the sum of the chosen rows on the page and the press waits. Plain names
// (names(): the brain's own name, else the one reading of sources, never a key). A brain that sends no rows (before this
// seat's file) shows none, and step 4 is as it was.
const CHOICES = [['understood', 'Understood'], ['findable', 'Findable only']];
let uPick = {};         // her taps not yet answered by the brain: { source_key: 'understood' | 'findable' }
const howLong = (m) => { const x = Number(m); if (m === null || m === undefined || !Number.isFinite(x)) return 'time not measured'; if (x < 1) return 'under a minute'; if (x < 90) return 'about ' + num(Math.round(x)) + ' minutes'; if (x < 48 * 60) return 'about ' + num(Math.round(x / 60)) + ' hours'; return 'about ' + num(Math.round(x / 1440)) + ' days'; };
const rowsOf = (U) => (Array.isArray(U?.rows) ? U.rows : []);
const pickOf = (r) => uPick[r.source_key] || r.choice;
const picking = () => Object.keys(uPick).length > 0;
const leftOf = (r) => (Number(r.conversations_left) || 0) + (Number(r.files_left) || 0);
const chosenRows = (U) => rowsOf(U).filter((r) => pickOf(r) === 'understood' && leftOf(r) > 0);
function chosenWords(U) {
  const c = chosenRows(U), m = c.filter((r) => r.kind === 'mailbox').length, dv = c.length - m;
  return [m ? num(m) + (m === 1 ? ' mailbox' : ' mailboxes') : '', dv ? num(dv) + (dv === 1 ? ' drive' : ' drives') : ''].filter(Boolean).join(' and ');
}
async function pick(S, r, v) {
  if (pickOf(r) === v) return;
  uPick[r.source_key] = v; uLimit = null; draw();
  const { data, error } = await rpc('understand_choice_set', { p_choice: { [r.source_key]: v }, p_identity: null });
  if (error || !data || data.ok !== true) {
    delete uPick[r.source_key];
    toast('Not changed: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given'));
    if (at === 'understand' && !C.$('#gr-sheet')) draw();
    return;
  }
  await readSample(R);
  if (R?.usam?.ok === true && Array.isArray(R.usam.rows)) delete uPick[r.source_key];   // the brain's rows now carry it
  if (at === 'understand' && !C.$('#gr-sheet')) draw();
}
function choiceRows(S, U) {
  const rows = rowsOf(U); if (!rows.length) return null;
  const priced = U.state === 'done';
  const nm = names(S, rows.map((r) => ({ key: r.source_key, label: r.name, kind: r.kind === 'mailbox' ? 'mail' : 'drive' })));
  const w = el('div', 'gs-urows'); w.id = 'gs-urows';
  w.appendChild(el('p', 'am-small', 'Choose for each mailbox and drive. Understood: read once, so the Tool can answer who, how much, when. Findable only: you can still search it; nothing in it is read, and it costs nothing here.'));
  for (const [kind, title] of [['mailbox', 'Mailboxes'], ['drive', 'Drives and folders']]) {
    const list = rows.filter((r) => r.kind === kind); if (!list.length) continue;
    w.appendChild(el('span', 'gs-uh', title));
    for (const r of list) {
      const on = pickOf(r) === 'understood', left = leftOf(r);
      const row = el('div', 'gs-row gs-urow' + (on ? '' : ' off'));
      const l = el('span', 'gs-rl');
      const cv = Number(r.conversations_left) || 0, fl = Number(r.files_left) || 0;
      const counts = left === 0 ? ((Number(r.conversations) || 0) + (Number(r.files) || 0) > 0 ? 'already understood' : 'nothing to read')
        : [cv ? num(cv) + ' conversations' : '', fl ? num(fl) + (kind === 'mailbox' ? ' attached files' : ' files') : ''].filter(Boolean).join(' ' + DOT + ' ');
      const notes = [];
      if (priced && kind === 'drive' && fl > 0 && !(Number(r.sampled) > 0)) notes.push('not in the sample: priced at the rate of your other files');
      if (kind === 'mailbox' && r.by_default === true && r.choice === 'findable') notes.push('marked old, so findable only unless you choose');
      l.append(el('b', null, nm[r.source_key] || (kind === 'mailbox' ? 'A mailbox' : 'A drive or folder')), el('small', null, [counts, ...notes].join(' ' + DOT + ' ')));
      const sg = seg(CHOICES, pickOf(r), (v) => pick(S, r, v), nm[r.source_key] || title);
      const pv = el('b', 'gs-pv gs-up');
      if (priced && left > 0) { pv.append(r.usd === null || r.usd === undefined ? 'not measured' : usd2(r.usd), el('small', null, howLong(r.minutes))); }
      row.append(l, sg, pv);
      w.appendChild(row);
    }
  }
  return w;
}
function sampleBlock(S) {
  const d = el('div', 'gs-sample'); d.id = 'gs-sample';
  const U = S.usam;
  const bal = balanceLeft(S);
  d.appendChild(priceRow('Your balance', bal === null ? 'not read' : usd2(bal)));
  if (!U) { d.appendChild(p('working no-late gr-small', 'Reading where the sample stands')); return d; }
  if (U.ok === true) { const cr = choiceRows(S, U); if (cr) d.appendChild(cr); }
  if (U.ok !== true) {
    d.appendChild(p('gr-small', 'The sample ' + (U.reason === 'too_few_read' ? 'could not measure a price: ' : 'could not be read just now: ') + String(U.note ?? U.reason ?? 'no reason was given') + (U.reason === 'too_few_read' ? '' : '. It tries again on its own.')));
    return d;
  }
  if (U.state === 'preview') {
    d.appendChild(p('gr-small', 'Nothing beyond the sample is read until you set your limit.'));
    const short = bal === null || bal < SAMPLE_CAP;
    if (short) d.appendChild(p('gr-small gs-over', 'The sample needs ' + usd2(SAMPLE_CAP) + ' of credit' + (bal === null ? '; your balance could not be read.' : '; your balance is ' + usd2(bal) + '.')));
    const go = btn('go', 'Read the sample ' + DOT + ' never more than ' + capWords(U), () => samplePress(S, U));
    go.disabled = short || picking() || !((Number(U.conversations) || 0) + (Number(U.files) || 0) > 0);   // a choice of drives alone can be sampled too (seat understand-drives)
    const gw = el('div', 'gr-go'); gw.appendChild(go); if (short) gw.appendChild(btn('go ghost', 'Top up', () => topUp(S)));
    if (picking()) d.appendChild(p('working no-late gr-small', 'Keeping your choice'));
    d.append(gw, el('p', 'am-small', String(U.note || '')));
    return d;
  }
  if (U.state === 'reading') {
    const c = el('div', 'gs-live gs-inline');
    c.append(el('b', null, 'Reading the sample: ' + num(U.read) + ' of ' + num(U.size)), p('gr-small', 'So far ' + usd2(U.spent_usd) + ', never more than ' + usd2(U.cap_usd) + '. Your measured price appears here when it is read.'));
    const out = p('gr-small', '');
    const stop = btn('go ghost', 'Stop', () => stopAll(S, (U.by_mailbox ?? []).map((x) => x.source_key), out, stop));
    c.append(stop, out); d.appendChild(c);
    return d;
  }
  // done: the price measured on her mail, her limit, and the press
  const rem = Number(U.predicted_remaining_usd), lo = Number(U.low_usd), hi = Number(U.high_usd);
  const hasRows = rowsOf(U).length > 0, wait = picking();
  if (wait) {
    // her tap is being kept: the total is the chosen rows on the page added up; the exact price and its range follow
    const cr = chosenRows(U), known = cr.every((r) => r.usd !== null && r.usd !== undefined);
    const mins = cr.every((r) => r.minutes !== null && r.minutes !== undefined) ? cr.reduce((a, r) => a + Number(r.minutes), 0) : null;
    d.appendChild(priceRow('For what you chose now', known ? usd2(cr.reduce((a, r) => a + Number(r.usd), 0)) : 'measuring', (mins !== null && U.time?.measured === true ? howLong(mins) + '. ' : '') + 'The rows you chose, added up.'));
    d.appendChild(p('working no-late gr-small', 'Working out the exact price and range for your choice'));
    return d;
  }
  d.appendChild(priceRow('Measured on your own mail and files, for the rest', usd2(rem), partsWords(U) + 'Likely between ' + usd2(lo) + ' and ' + usd2(hi) + '. The sample cost ' + usd2(U.sample_spent_usd) + ' (' + num(U.read) + ' read' + (Number(U.could_not_read) ? ', ' + num(U.could_not_read) + ' could not be read' : '') + ').'));
  if (U.time && typeof U.time === 'object') d.appendChild(priceRow('Time, for what you chose', U.time.measured === true ? howLong(U.time.minutes) : 'not measured', String(U.time.basis || '') + (U.time.measured === true ? '. Measured, not promised: it follows how fast the reading goes.' : '')));
  d.appendChild(el('p', 'am-small', String(U.basis || '')));
  if (Number(U.drive_files?.drives_not_sampled) > 0) {
    const n = Number(U.drive_files.drives_not_sampled);
    const again = el('div', 'gr-go'); again.appendChild(btn('go ghost', 'Read a sample of ' + (n === 1 ? 'that drive' : 'those drives') + ' too ' + DOT + ' never more than ' + capWords(U), () => sampleAgain(S, U, n)));
    d.append(p('gr-small', num(n) + (n === 1 ? ' drive you chose was' : ' drives you chose were') + ' not in the sample, so ' + (n === 1 ? 'its' : 'their') + ' files are priced at the rate measured on your other files.'), again);
  }
  if (Array.isArray(U.groups_not_sampled) && U.groups_not_sampled.length) d.appendChild(el('p', 'am-small', 'Not in the sample: ' + U.groups_not_sampled.map((g) => GROUP_TITLE[g] || g).join(', ') + '. They are priced at the rate measured on the rest.'));
  const boxes = (U.by_mailbox ?? []).filter((x) => Number(x.conversations) > 0);
  const lab = el('label', 'gr-field gs-limit', 'Your limit, $');
  const inp = el('input'); inp.id = 'gs-limit'; inp.type = 'number'; inp.min = '0'; inp.step = '0.01'; inp.inputMode = 'decimal';
  // THE LIMIT STARTS AT THE BRAIN'S SUGGESTION (ruling 1142.5): the measured price plus the worst case of the largest conversation
  // left, so a limit at the first figure does not leave the last stretch unread; its reason is said under it. SUPERSEDED: the
  // measured price rounded up (setup-audit M3: a limit there left mail unread).
  const sug = Number(U.suggested_limit_usd);
  inp.value = String(uLimit !== null ? uLimit : Number.isFinite(sug) && sug > 0 ? Math.ceil(sug * 100) / 100 : Math.ceil(rem));
  lab.appendChild(inp); d.appendChild(lab);
  if (U.suggested_reason) d.appendChild(el('p', 'am-small', String(U.suggested_reason)));
  const shareLine = el('p', 'am-small'); const over = p('gr-small gs-over', ''); const out = p('gr-small', '');
  const go = btn('go', '', () => understandPress(S, U, Number(inp.value), boxes, out, go));
  const tw = el('div', 'gr-go'); tw.appendChild(go);
  const topBtn = btn('go ghost', 'Top up', () => topUp(S));
  const card0 = cardOf(S);
  const test = p('gr-small gr-test', 'Card payments are in test mode: a test payment is shown but never added to your balance, so it cannot pay for this step.');
  const say = () => {
    const L = Number(inp.value);
    uLimit = Number.isFinite(L) ? L : null;
    shareLine.textContent = hasRows ? (chosenRows(U).length > 1 ? 'One limit for your ' + chosenWords(U) + ', never passed; the Tool shares it by what each is predicted to cost.' : '')
      : boxes.length > 1 ? 'One limit for your ' + num(boxes.length) + ' mailboxes, never passed; the Tool shares it by what each is predicted to cost.' : '';
    const gap = bal === null ? null : Math.round((L - bal) * 100) / 100;
    over.textContent = gap !== null && gap > 0 ? 'This is more than your balance: add ' + usd2(gap) + ' first, or lower your limit.' : '';
    topBtn.hidden = !(gap !== null && gap > 0);
    test.hidden = topBtn.hidden || !!(card0 && card0.mode === 'live');
    go.textContent = pressWords(U) + ' ' + DOT + ' up to ' + (Number.isFinite(L) ? usd2(L) : '$0.00');
    go.disabled = !Number.isFinite(L) || L <= 0 || bal === null || (gap !== null && gap > 0) || !(hasRows ? chosenRows(U).length : boxes.length);
  };
  inp.addEventListener('input', say);
  tw.appendChild(topBtn);
  d.append(shareLine, over, test, tw, out, el('p', 'am-small', 'It stops before your limit, even with what is being read at that moment. Stop works any time; you pay only for what was read.'));
  say();
  return d;
}
let uLimit = null;
// mail and attached files, each part of the measured price as the brain gives it (understand_sample 'mail' and 'attached_files')
// (the brain's 'attached_files' is every file, attached and in drives; 'drive_files' is the drives' part of it: seat understand-drives)
const partsWords = (U) => {
  const m = Number(U?.mail?.predicted_remaining_usd), f = Number(U?.attached_files?.predicted_remaining_usd), dv = Number(U?.drive_files?.predicted_remaining_usd);
  if (!(Number.isFinite(m) && Number.isFinite(f) && Number(U?.attached_files?.left) > 0)) return '';
  if (Number(U?.drive_files?.left) > 0 && Number.isFinite(dv)) return usd2(m) + ' mail, ' + usd2(Math.max(0, f - dv)) + ' attached files, ' + usd2(dv) + ' drive files. ';
  return usd2(m) + ' mail, ' + usd2(f) + ' attached files. ';
};
const pressWords = (U) => (Number(U?.drive_files?.left) > 0 ? 'Understand my mail and drives' : 'Understand my mail');
// A CHOSEN DRIVE THE SAMPLE DID NOT READ: one more sample, her yes first (the brain reads a new one that includes it).
function sampleAgain(S, U, n) {
  const body = el('div');
  body.append(priceRow('Read first', 'a new sample', 'about 100 more conversations and some files, with at least two from every drive you chose'),
    priceRow('Never more than', usd2(Number(U.cap_usd) || SAMPLE_CAP)),
    p('gr-small', 'Then the price for ' + (n === 1 ? 'that drive' : 'those drives') + ' is measured on ' + (n === 1 ? 'its' : 'their') + ' own files. Nothing else is read until you set your limit.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, read the sample', async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting the sample';
    const data = await sampleAsk(S, true);
    if (data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + noteOf(data) + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(data.note || 'The sample is being read.')); R.usam = data; draw();
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no); body.append(acts, said);
  sheet.open('Read one more sample?', body);
}
// RETIRED (seat audit-fix-screen, ruling 1142.4): shares(), the page's own split of her limit over mailboxes; understand_go shares it.
const capWords = (U) => { const c = Number(U?.cap_usd); const v = Number.isFinite(c) && c > 0 ? c : SAMPLE_CAP; return Number.isInteger(v) ? '$' + v : usd2(v); };
function samplePress(S, U) {
  const body = el('div');
  body.append(priceRow('Conversations read first', num(U.size), 'chosen across your mailboxes and lengths'));
  if (Number(U.files_size) > 0) body.appendChild(Number(U.drive_files) > 0
    ? priceRow('Files read first', num(U.files_size) + ' or more', 'of your ' + num(U.files) + ' files, attached to mail and in your drives, with at least two from every drive you chose; an agreement among them is read for its terms too')
    : priceRow('Attached files read first', num(U.files_size), 'of your ' + num(U.files) + ' attached files; an agreement among them is read for its terms too'));
  body.append(priceRow('Never more than', usd2(Number(U.cap_usd) || SAMPLE_CAP)),
    p('gr-small', 'Then you see the price measured on your own mail and files, and set your limit. Nothing else is read until then.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, read the sample', async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting the sample';
    const data = await sampleAsk(S, true);
    if (data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + noteOf(data) + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(data.note || 'The sample is being read.')); R.usam = data; draw();
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no); body.append(acts, said);
  sheet.open('Read the sample?', body);
}
async function understandPress(S, U, L, boxes, out, go) {
  const groups = chosenGroups(S);
  // what is pressed is the brain's own choice (understand_choice: the rows above); a brain that sends no rows gets the mailboxes as before
  const hasRows = rowsOf(U).length > 0, dl = Number(U.drive_files?.left) || 0, al = (Number(U.attached_files?.left) || 0) - dl;
  const q = hasRows ? { groups, months: 24, limit: L } : { groups, months: 24, limit: L, sources: boxes.map((x) => x.source_key) };
  go.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Checking your limit against your credit';
  const pv = await C.askBody({ understand_go: { ...q, confirm: false } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
  out.className = 'gr-small'; out.textContent = ''; go.disabled = false;
  if (!pv || pv.ok !== true) { out.textContent = 'Not started: ' + noteOf(pv) + '.'; return; }
  const body = el('div');
  body.append(priceRow('Conversations to understand', num((Number(U.conversations) || 0) - (Number(U.already_read) || 0)), groups.map((g) => GROUP_TITLE[g] || g).join(', ') + ', last 2 years'),
    ...(al > 0 ? [priceRow('Attached files to understand', num(al), 'every file attached to the mail of the mailboxes you chose')] : []),
    ...(dl > 0 ? [priceRow('Drive files to understand', num(dl), 'every file in the drives you chose')] : []),
    priceRow('Measured price', usd2(U.predicted_remaining_usd), 'likely between ' + usd2(U.low_usd) + ' and ' + usd2(U.high_usd)), priceRow('Your limit, never passed', usd2(Number.isFinite(Number(pv.limit_usd)) ? pv.limit_usd : L)));
  if (pv.note) body.appendChild(p('gr-small', String(pv.note)));
  body.appendChild(p('gr-small', 'Stop works any time; you pay only for what was read. You get one short email when it is done.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, ' + pressWords(U).charAt(0).toLowerCase() + pressWords(U).slice(1) + ' ' + DOT + ' up to ' + usd2(L), async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting';
    const r = await C.askBody({ understand_go: { ...q, confirm: true } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
    if (!r || r.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + noteOf(r) + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(r.note || 'Started: your mail is being understood. It stops before ' + usd2(L) + '. You get one short email when it is done.'));
    uPick = {}; mount(C);
  });
  const no = btn('go ghost', 'Not now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no); body.append(acts, said);
  sheet.open(pressWords(U) + '?', body);
}
async function stopAll(S, keys, out, b) {
  b.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Stopping';
  const res = await Promise.all(keys.map((k) => rpc('source_read_approve', { p_source_key: k, p_mode: 'understand_stop', p_months: null, p_confirm: true }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: String(e?.message ?? e) }))));
  out.className = 'gr-small'; out.textContent = res.map((r) => String(r?.note ?? r?.reason ?? 'no reason was given')).join(' ');
  setTimeout(() => mount(C), 2500);
}
// Settings' Change on the answers opens this step (one path).
export function openStep(c, k) { C = c; at = k; c.goto('s-ready'); }
// SETTINGS uses these, so every Change there is the same function as here (one path): Top up (with the card and automatic
// top-up in its sheet), the balance, and the readings.
export function topUpFor(c, S) { C = c; topUp(S); }
export { balanceLeft, cardOf, cardFee, monthlyOf, understandModel, brainCard, capped };

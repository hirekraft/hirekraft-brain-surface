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
// SEAT step4-fresh (2026-11-12; decision 1158, picture RYtvsKoVGVx2ELoeqN5PNx): step 4 rebuilt as the approved fresh look on step 3's
// own tree. See STEP 4, THE FRESH LOOK above heroU. The line under the steps names the step that is open (it named the first
// step not done: "Step 3 of 5" while step 4 was open).
import { roadSteps } from './brainroom.js?v=2026-11-14-ready-alive';
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
  if (S.owner) core.push(capped(S, 'understand door', () => readDoor(S)));   // fast or overnight (seat overnight-batch 2026-11-12)
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
/* ONE RULE FOR GREEN (seat setup-polish 2026-11-13, audit fix 2): step 3 is green when the brain says so (brain_road ready.searchable, through roadSteps). The step button, the Done chip, the green line and Continue all ask this. SUPERSEDED: three rules that could disagree (the plan rows on the page, every row up to date, the brain). */ const green3 = (S) => { const r = roadSteps(S); return r[0].state === 'done' && r[1].state === 'done'; }; /* A STEP WITH EXCEPTIONS CARRIES A SMALL MARK AND ITS COUNT (HQ 2026-11-13: Alex saw step 4 green and step 3 not green with no sign why). open: something waits for her on that step; otherwise what is settled and explained there (what could not be read). */ function stepMarks(S) { const M = {}, L = step3Left(S), o3 = !green3(S) && (L ? L.need.length > 0 : Number(S.road?.ready?.to_read) > 0) ? 1 : 0; const AS = S.road?.ready?.set_aside === true; if (o3) M.search = { n: L && L.need.length ? L.need.reduce((a, x) => a + (Number(x.to_read) || 0), 0) || 1 : Number(S.road?.ready?.to_read) || 1, open: !AS, say: AS ? 'set aside' : 'not searchable yet, waiting for your yes' };   /* seat ready-alive 2026-11-14, decision 1174 (3): the count of what is open, its meaning in words beside it (markLine), green once set aside */ const cnr = pressSettled(S) ? pressAll(S).reduce((a, x) => a + (Number(x.could_not_read) || 0), 0) : 0; if (cnr > 0) M.understand = { n: cnr, open: false, say: 'could not be read, listed on the step' }; return M; } function stepsOf(S) {
  const road = roadSteps(S);
  const live = !!(S.road || S.src);
  const searchable = green3(S);
  const out = [
    { k: 'db', n: '1', name: 'Your Database', done: live, wait: !live },
    { k: 'connect', n: '2', name: 'Connect', done: road[0].state === 'done', wait: road[0].state === 'wait' },
    { k: 'search', n: '3', name: 'Make It Searchable', done: searchable, wait: road[1].state === 'wait' },
    { k: 'understand', n: '4', name: 'Understand', done: road[2].state === 'done', wait: road[2].state === 'wait' },
    { k: 'ready', n: '5', name: 'Ready', done: road[3].state === 'done' },
  ];
  const cur = out.findIndex((s) => !s.done);
  out.forEach((s, i) => { s.state = s.done ? 'done' : i === cur ? 'now' : s.wait ? 'wait' : 'todo'; }); const M = stepMarks(S); out.forEach((s) => { s.mark = M[s.k] || null; });
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
  if (was?.usam && was.usam.ok === true) S.usam = was.usam;   // step 4's last answer stays on the page until the new one lands in its place (seat step4-fresh)
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
  S.money.then(() => { if (R !== S) return; reopen(S); paint(); paidReturn(S); settle(S); });   /* seat ready-alive 2026-11-14: small costs are started by the brain on its own schedule, page open or not (small_cost_tick, decisions 1171 and 1173); SUPERSEDED: this page starting them once her credit was read */
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
  // VERA TAKES IT IN WORDS (decision 1163): "understand <mailbox>, only <year>" opens step 4 and that source's sheet with the year checked, for the owner to confirm (fill/vera.js partAsk)
  document.addEventListener('tool:understand-part', (e) => { const d = e.detail || {}; if (C && R && R.owner && d.source) partOpen(String(d.source), Array.isArray(d.years) ? d.years : []); });
  document.addEventListener('tool:work', () => { for (const q of ['#gs-work', '#gs-uwork']) { const w = C?.$(q); if (w && R) workInto(w, R); } runMarks(); if (R && (at === 'understand' || at === 'search') && !typing() && !C?.$('#gr-sheet') && !C?.$('#s-ready')?.hidden) paint(); });   // the one indicator's reading moved (fill/working.js): the Working lines of steps 3 and 4 follow, in place
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
  top.append(lab, btn('gr-link gs-how', 'See How It Works', () => door()));
  const steps = el('div', 'gr-steps'); steps.id = 'gr-steps'; steps.setAttribute('role', 'list');
  const fill = el('div', 'gs-fill'); fill.id = 'gs-fill';
  const left = el('div', 'gr-card'); left.id = 'gr-left';
  const main = el('div', 'gr-main'); main.append(top, steps, fill, left);
  // THE RIGHT COLUMN IS VERA'S (seat vera-guide fills it), from step 3 on. Until she lives here, it says how to reach her.
  const vera = el('aside', 'gr-vera'); vera.id = 'gr-vera'; vera.setAttribute('aria-label', 'Vera, your guide');
  const vh = el('div', 'gr-vh'); vh.id = 'gr-vh'; vh.append(el('span', 'gr-av', 'V'), (() => { const t = el('span'); t.append(el('b', null, 'Vera'), el('small', null, 'Your Guide')); return t; })());
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
    const n = el('span', 'gs-n', s.done ? CHECK : s.n); if (s.done) n.classList.add('gs-done');   /* a done step shows its check (picture part 3) */
    b.append(n, el('b', null, s.name)); if (s.mark) { const mk = el('span', 'gs-mark' + (s.mark.open ? ' gs-mark-open' : ' gs-mark-ok'), s.mark.n > 99 ? '99+' : num(s.mark.n)); mk.setAttribute('aria-hidden', 'true'); b.appendChild(mk); }
    b.setAttribute('aria-label', 'Step ' + s.n + ', ' + s.name + (s.done ? ', done' : '') + (s.mark ? ', ' + num(s.mark.n) + ' ' + s.mark.say : ''));
    if (s.k === at) b.setAttribute('aria-current', 'step');
    return b;
  }));
  fillBar(st); runMarks(); markLine(st);
  const box = C.$('#gr-left');
  const kids = (CARDS[at] || CARDS.ready)(S, st);
  const nl = netLine(S); if (nl) kids.unshift(nl);
  kids.push(more());
  // STEP 3 RE-READS WITHOUT JUMPING (seat step3-fresh, decision 1156): while step 3 stays the open step, a card whose shape did
  // not change keeps its place and only its marked numbers change (inPlace); any other draw replaces the step as before.
  const still = at === 'search' || at === 'understand';   // step 4 lands the same way (seat step4-fresh, decision 1158)
  if (still && box.dataset.step === at) inPlace(box, kids);
  else { box.replaceChildren(...kids); if (still) for (const n of kids) n.dataset.sig = sigOf(n); }
  box.dataset.step = at;
  if (still) { const w = C.$(at === 'search' ? '#gs-work' : '#gs-uwork'); if (w) workInto(w, S); }   // a kept top card: its Working line is redrawn, not copied
  if (at === 'understand') { const li = C.$('#gs-limit'); if (li && uLimit === null && S.usam?.ok === true && S.usam.state === 'done' && document.activeElement !== li) li.value = sugOf(S, S.usam).toFixed(2); limitSay(); }   // a kept card: the limit she has not typed follows the price; the button follows the limit
  if (at === 'understand' && S.owner && !S.gLoad) { S.gLoad = true; Promise.all([S.uans ? null : readAnswers(S), readSample(S)]).then(() => { if (R === S && at === 'understand' && !typing() && !C.$('#gr-sheet')) draw(); }); }   // step 4's answer (rows, prices) and her words, read when she is on it
  uPoll();
  if (at === 'understand' || at === 'ready') needEst(S);   // the monthly figure and the price per email, asked where they are shown
  C.$('#gr-meter')?.remove();   /* THE SETUP MONEY LEFT THE HEADER (seat setup-clean 2026-11-13, decision 1172.1): money is said on the step that spends it. SUPERSEDED: the spend line in the masthead (meter: Setup so far, This step), a second reading of money beside step 4's own */
  // The front door first, once per browser, until Get started (and never over a sheet or a story already open).
  if (!doorShown && !doorPassed() && pending && !storyOpen() && !C.$('#gr-sheet')) { doorShown = true; door(); }
}
let doorShown = false, autoAt = false;
// THE FILL-UP BAR under the step buttons: how far she is, from the same five steps.
// THE MARKS, IN WORDS (seat ready-alive 2026-11-14, decision 1174 (3)): under the row of steps, one short line per mark saying what
// its number counts. Green once it is settled, explained or set aside; amber while it waits for her.
function markLine(st) {
  const row = C.$('#gr-steps'); if (!row) return;
  let ln = C.$('#gr-marks'); const ms = st.filter((s) => s.mark);
  if (!ms.length) { if (ln) ln.remove(); return; }
  if (!ln) { ln = el('p', 'gs-marks'); ln.id = 'gr-marks'; row.after(ln); }
  ln.replaceChildren(...ms.map((s) => { const x = el('span', 'gs-markw' + (s.mark.open ? ' gs-markw-open' : '')); x.append(el('b', null, 'Step ' + s.n + ': '), num(s.mark.n) + ' ' + s.mark.say); return x; }));
}
function fillBar(st) {
  const f = C.$('#gs-fill'); if (!f) return;
  const done = st.filter((s) => s.done).length;
  const cur = st.find((s) => s.k === at) || st.find((s) => s.state === 'now');   // the step that is open (seat step4-fresh)
  const n = cur ? Number(cur.n) : st.length;
  const bar = el('div', 'gs-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(st.length)); bar.setAttribute('aria-valuenow', String(done));
  const i = el('i'); i.style.width = Math.round((done / st.length) * 100) + '%'; bar.appendChild(i);
  f.replaceChildren(); f.hidden = true;   /* REMOVED (seat setup-clean 2026-11-13, decision 1172.5): the bar and the line under the steps (Step N of 5, more than halfway). The green checks in the row of steps say it. */
}

function more() {
  const d = el('div', 'gr-more');
  d.id = 'gr-more';
  // step 3 does not say it (decision 1156.6): its Working line at the top says the reading keeps going
  // step 4 does not say it either (seat step4-fresh, decision 1158): its live card says the reading keeps going
  if (at !== 'search' && at !== 'understand') d.appendChild(el('span', null, 'You can close this page. It goes on by itself, and this screen shows where it stands when you come back.'));
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
/* STEP 5 SAYS WHAT IS NOT UNDERSTOOD, AND WHY (seat setup-polish 2026-11-13, decision 1169 for later steps, audit fix 8): the brain's own counts (brain_road ready: could_not_read, searchable_only), each in one line as on steps 3 and 4. Neither holds Ready back. */ function exc5(S) { const RD = S.road?.ready; if (!RD || typeof RD !== 'object') return null; const cnr = Number(RD.could_not_read) || 0, only = Number(RD.searchable_only) || 0; if (!cnr && !only) return null; const c = card('eye', 'What Is Not Understood, and Why', null); c.id = 'gs-exc5'; const line = (n, words, lab, why) => { const d = el('div', 'gs-ex'), t = el('span'); t.append(el('b', null, num(n)), ' ' + words + ' ', el('b', 'gs-exno', lab), why); d.appendChild(t); c.appendChild(d); }; if (cnr) line(cnr, 'could not be read.', 'Cannot be put in: ', 'the AI gave no usable answer after three tries. ' + (cnr === 1 ? 'It stays' : 'They stay') + ' searchable; step 4 says where.'); if (only) line(only, (only === 1 ? 'mailbox is' : 'mailboxes are') + ' kept searchable only, by your choice.', 'Can be put in: ', 'choose Understand for ' + (only === 1 ? 'it' : 'them') + ' on step 4.'); return c; } /* WHAT HER GUIDE SAYS BESIDE STEPS 3 AND 4 (seat setup-polish 2026-11-13, decision 1150.4, audit fix 6). Steps 3 and 4 have their own cards and no Cost and Time card, so Vera had no figures there: her two questions were missing and a typed setup question got no answer. This gives her the step as it stands, from the same readings the cards are drawn from (fill/vera.js head and opener read it; one wording, here). null where she should say nothing (not the owner, another step). */ window.toolSetup = () => { const S = R; if (!S || !S.owner) return null; /* EVERY STEP SAYS HOW IT STANDS (seat setup-clean 2026-11-13, decision 1172, Also: her opener matches the step's real state; step 5 has no Cost and Time card any more) */ if (at === 'db') return { open: S.road || S.src ? 'Step 1 is done: your database is set up, and it is yours.' : '' }; if (at === 'connect') { const rs = S.src?.rows ?? [], g = (k) => rs.filter((r) => r.group === k).length; return { open: rs.length ? 'Step 2: ' + [g('email') ? num(g('email')) + (g('email') === 1 ? ' mailbox' : ' mailboxes') : '', g('drives') ? num(g('drives')) + (g('drives') === 1 ? ' drive' : ' drives') : '', g('systems') ? num(g('systems')) + (g('systems') === 1 ? ' system' : ' systems') : ''].filter(Boolean).join(', ') + ' connected. You can add more any time; connecting and counting are free.' : '' }; } if (at === 'ready') { const ok = isReady(S), M = monthlyOf(S), RD = S.road?.ready || {}; const why = RD.searchable === false ? 'step 3 is still making your mail and files searchable' : RD.understood === false ? 'step 4 is not finished' : RD.keeping_up === false ? 'a connection could not refresh' : 'steps 1 to 4 are not all done'; return { open: ok ? 'Your brain is ready. Mail, Drives and the rest of the Tool are open, and it keeps up by itself.' : 'Your brain is not ready yet: ' + why + '. This step turns green when that is done.', cost: dbCost(S).say + ' a month for your database, paid to Supabase' + (M === null ? '; keeping new mail understood is measured after your first month' : ', and about ' + usd2(M) + ' a month to keep new mail searchable and understood'), time: ok ? 'it is ready now' : 'when ' + why.replace('is still', 'has finished').replace('is not finished', 'is finished'), src: 'Each monthly figure on the card says where it comes from' }; } if (at !== 'search' && at !== 'understand') return null; if (at === 'search') { const L = step3Left(S); if (!L) return { open: '', cost: 'not known until the count is read', time: 'not known until the count is read', src: '' }; if (green3(S)) return { open: 'Step 3 is done: everything that can be read is searchable. What could not go in is on the card, each with its reason.', cost: 'nothing more to pay on this step', time: 'done', src: 'New mail and files are made searchable as they arrive' }; const pk = chosenOf(L.P), cost = Math.round(pk.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100, n = pk.reduce((a, r) => a + (Number(r.to_read) || 0), 0), mins = pk.length && pk.every((r) => r.minutes !== null && r.minutes !== undefined) ? Math.max(...pk.map((r) => Number(r.minutes) || 0)) : null; if (L.need.length) return { open: 'Step 3 makes what you connected searchable. One thing is left: ' + num(n) + ' items from before you connected, ' + usd2(cost) + '. The button is at the top of the card.', cost: usd2(cost) + ' for the ' + num(n) + ' items that are not searchable yet', time: mins !== null ? 'about ' + num(mins) + ' minutes' : 'measured as it reads', src: 'Counted for free on your own mail and files; nothing is read until you press' }; return { open: 'Step 3 is making what you connected searchable. It keeps going by itself.', cost: 'agreed when you pressed; nothing more is charged for it', time: workWords(S) || 'being measured', src: '' }; } const all = mainAll(S), spent = all.reduce((a, x) => a + (Number(x.so_far_usd ?? x.spent_usd) || 0), 0), lim = limOf(all), cnr = all.reduce((a, x) => a + (Number(x.could_not_read) || 0), 0); if (pressRows(S).length) return { open: 'Step 4 is reading what you chose. You get one short email when it is done.', cost: usd2(spent) + ' spent so far' + (lim !== null ? ', of your limit ' + usd2(lim) + ', which is never passed' : ''), time: pressRows(S).every((x) => x.door === 'overnight') ? 'overnight: ' + OVERNIGHT_WHEN : 'on the card, once the pace is measured', src: 'From the count of what has been read' }; if (pressSettled(S)) return { open: 'Step 4 is done: what you chose is understood.' + (cnr ? ' ' + num(cnr) + ' could not be read; the card says where and why.' : ''), cost: usd2(spent) + ' spent' + (lim !== null ? ', of your limit ' + usd2(lim) : ''), time: 'done', src: 'New mail and files in what you chose are understood as they arrive' }; const P = uPrice(S); return { open: '', cost: P && P.usd !== undefined ? 'about ' + usd2(P.usd) + ' for what is chosen, at the speed chosen' : 'measured first on a small sample of your own mail, never more than ' + usd2(SAMPLE_CAP), time: doorOf(S) === 'overnight' ? 'overnight: ' + OVERNIGHT_WHEN : S.usam?.time?.measured === true ? howLong(S.usam.time.minutes) : 'measured on your sample', src: 'Measured on a sample of your own mail and files' }; }; function stepPrice(S, k) {
  if (k === 'search') { if (!S.splan) return { counting: true }; const pk = chosenOf(S.splan); return { exact: Math.round(pk.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100 }; }   // search_plan's price for what is checked
  if (k === 'understand' && pressAll(S).length && (pressSettled(S) || pressRows(S).length)) return { spent: pressAll(S).reduce((a, x) => a + (Number(x.so_far_usd ?? x.spent_usd) || 0), 0) };   /* a pressed step says what it spent, from the reading step 4 shows (audit fix 1); SUPERSEDED there: what a next press would cost, on a finished step */ if (k === 'understand') { const P = uPrice(S); if (P && P.usd !== undefined) return { usd: P.usd }; }   // step 4's one price: her choices at her speed (uPrice; seat step4-words, decision 1159.3)
  if (k === 'understand') return { counting: true };   // no price before her own sample (mail_groups' estimate is no longer shown: seat step4-fresh)
  return { free: true };
}
function soFar(S) {
  const pl = S.ai?.plain; if (!pl) return null;
  if (Number.isFinite(Number(pl.one_time_usd)) && pl.one_time_usd !== null) return Number(pl.one_time_usd);
  const d = pl.daily; if (!Array.isArray(d)) return null; return d.reduce((a, x) => a + (Number(x.one_time_usd) || 0), 0);
}
function balanceLeft(S) { const b = S.ai?.plain?.balance; return b && b.set_up ? Math.max(0, Number(b.left_usd) || 0) : null; }

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
// WHAT IS SHORT COMES FIRST (seat step4-pressed 2026-11-12, decision 1160; Alex needed $123.68 and was offered $25 / $50 /
// $100 / $250): opened from a shortfall (short, in dollars) the sheet offers that amount rounded up to the whole dollar first,
// already chosen, then the fixed amounts, and a field for any amount from the smallest card payment up. The fee line follows
// whatever is chosen. Opened plainly: the fixed amounts and the field.
const MINPAY = 5;       // the smallest card payment (topup_start's own floor)
function topUp(S, short) {
  const need = Number.isFinite(Number(short)) && short !== null && Number(short) > 0 ? Math.max(MINPAY, Math.ceil(Number(Number(short).toFixed(6)))) : null;
  const pay = !!S.marks?.payments;
  const card = cardOf(S);
  const test = !card || card.mode !== 'live';
  const body = el('div');
  body.appendChild(p('gr-small', pay ? "You pay on Stripe's own page; the Tool never sees your card. Your credit goes up when the payment is through." : 'Top up by card is coming. For now your request goes to Verrandi, who adds it to your credit and tells you.'));
  if (pay && test) body.appendChild(p('gr-small gr-test', 'Card payments are in test mode: on Stripe use the test card 4242 4242 4242 4242, any future date, any 3 digits. A test payment is shown here and is never added to your credit.'));
  let pick = need !== null ? need : 50;
  const fee = p('gr-small gr-fee', ''); fee.id = 'gs-tfee';
  const amt = (a) => (Number.isInteger(a) ? String(a) : a.toFixed(2));
  const good = () => Number.isFinite(pick) && pick >= MINPAY;
  const say = () => {
    yes.disabled = !good();
    yes.textContent = (pay ? 'Pay $' : 'Ask for $') + (good() ? amt(pick) : '0');
    if (!good()) { fee.textContent = 'The smallest card payment is $' + MINPAY + '.'; return; }
    if (pay) { const f = cardFee(pick); fee.textContent = 'Top-up $' + pick.toFixed(2) + ' + card fee at cost $' + f.toFixed(2) + ' = $' + (pick + f).toFixed(2) + '. The fee is what the card company charges, passed on exactly.'; } else fee.textContent = '';
  };
  const seg = el('div', 'gr-seg gs-tamts');
  const any = el('input'); any.id = 'gs-tany'; any.type = 'number'; any.min = String(MINPAY); any.step = '1'; any.inputMode = 'decimal';
  const marks = (b) => seg.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
  for (const a of (need !== null ? [need] : []).concat([25, 50, 100, 250].filter((x) => x !== need))) {
    const b = btn('gr-amt' + (a === pick ? ' on' : ''), '', () => { pick = a; any.value = ''; marks(b); say(); });
    b.dataset.amt = String(a); b.setAttribute('aria-pressed', a === pick ? 'true' : 'false');
    b.appendChild(el('b', null, '$' + a)); if (a === need) b.appendChild(el('small', null, 'what is short'));
    seg.appendChild(b);
  }
  any.addEventListener('input', () => { const v = Number(any.value); pick = any.value === '' ? NaN : Math.round(v * 100) / 100; marks(null); say(); });
  const anyLab = el('label', 'gr-field gs-tany'); anyLab.append(el('span', null, 'Any amount, $'), any);
  if (need !== null) body.appendChild(p('gr-small', 'You are ' + usd2(Number(short)) + ' short for what you chose' + (need > Number(short) ? ': $' + need + ' covers it' + (need === MINPAY && Number(short) < MINPAY ? ' ($' + MINPAY + ' is the smallest card payment).' : '.') : '.')));
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
  const no = btn('go ghost', 'Not Now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no);
  say();
  body.append(seg, anyLab, fee, acts, out);
  if (pay) body.append(autoBlock(S));
  sheet.open('Add Credit', body);
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
    box.appendChild(p('gr-small', 'On: when your credit falls under $' + Number(A.below_usd).toFixed(0) + ', ' + card.card + ' adds $' + Number(A.amount_usd).toFixed(0) + ' plus the card fee, up to $' + Number(A.month_cap_usd).toFixed(0) + ' a month ($' + Number(A.this_month_usd || 0).toFixed(0) + ' so far this month).'));
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
// and states search_plan's, the names and each system's line sources_view's, the Working line the one indicator's (fill/working.js,
// seat work-indicator: its reading and its wording; source_read_progress's where a brain does not carry it). A RE-READ CHANGES NUMBERS IN
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
const WORD = { searchable: ['Searchable', 'ok'], reading: ['Reading', 'warn'], to_read: ['Not All Searchable Yet', 'warn'], not_counted: ['Counting', ''] };   // search_plan's states
const SV = { needs_you: ['Needs You', 'warn'], reading: ['Reading', 'warn'], up_to_date: ['Connected', 'ok'] };   // sources_view's states
const MEET = [' meet ', ' meeting ', ' meetings '];
const FINDS = ['find', 'search', 'show', 'where'];
// GOOGLE DRIVE IN THREE PARTS, for steps 3 and 4 alike: shared drives, meetings (told by the drive's own name), folders shared with the Tool.
const isMeet = (r) => MEET.some((m) => (' ' + String(r.name || '').toLowerCase() + ' ').includes(m));
const driveParts = (full) => ({ meet: full.filter(isMeet), shared: full.filter((r) => r.place === 'shared' && !isMeet(r)), rest: full.filter((r) => r.place !== 'shared' && !isMeet(r)) });
// THE WORKING LINE WHERE THE BRAIN DOES NOT CARRY THE ONE INDICATOR'S READING (work_running): everything being read now, done of
// total, and the time left at the measured pace (source_read_progress; never a guessed time: measuring is said). Empty when
// nothing is being read.
function workWords(S) {
  const rd = (S.prog ?? []).filter((x) => x.state === 'reading');
  if (!rd.length) return '';
  const done = rd.reduce((a, x) => a + (Number(x.line_done) || 0), 0), all = rd.reduce((a, x) => a + (Number(x.line_total) || 0), 0);
  const left = rd.every((x) => x.minutes_left !== null && x.minutes_left !== undefined) ? Math.max(...rd.map((x) => Number(x.minutes_left) || 0)) : null;
  return 'Working ' + DOT + ' ' + num(done) + ' of ' + num(all) + ' ' + DOT + ' ' + leftWords(left);
}
// THE WORKING LINE IS THE ONE INDICATOR'S (fill/working.js, seat work-indicator, decision 1152.1): the same reading it shows in
// the header (window.toolWork, kept current by its tool:work event) in its own wording (window.toolWorkParts), one line for
// each piece of running work. Never a second reading or a second wording of it.
// EACH STEP'S TOP CARD SHOWS ONLY ITS OWN WORK (seat step4-pressed 2026-11-12, decision 1162.2): step 3 what is being made
// searchable, step 4 what is being understood. The header's indicator stays the one place for all of it. SUPERSEDED: every
// running line on both steps (a mailbox being made searchable stood on step 4's card).
// THE SIGN THAT IT IS ALIVE is the one shared piece (fill/working.js workPulse, decision 1164), never a second one.
const STEP_WORK = { 'gs-work': ['searchable', 'pictures', 'privacy'], 'gs-uwork': ['understand', 'agreements'] };
function workInto(w, S) {
  const W = window.toolWork, parts = window.toolWorkParts;
  if (W && Array.isArray(W.items) && parts) {
    // after her press is done (mode after) a line of understanding is shown only while a source is being read by the brain's own
    // count (understand_progress): what a source's part of the limit left unread is not work that stands still (seat step4-after)
    const mine = STEP_WORK[w.id], quiet = w.dataset.mode === 'after' && !pressAll(S).some((x) => x.state === 'reading');
    const its = W.items.filter((it) => (!mine || mine.includes(it.kind)) && !(quiet && it.kind === 'understand'));
    if (w.dataset.mode === 'pulse') {   // step 4 while a press runs: the card's numbers are its own; here only the sign of life
      const it = its.find((x) => x.kind === 'understand');
      w.replaceChildren(...(it && parts.pulse ? [parts.pulse(pressItem(it, W, S))] : [])); w.hidden = !w.children.length; return;
    }
    w.replaceChildren(...its.map((it) => { const l = el('span', 'gs-workline'); l.append(parts.title(it), ' ' + DOT + ' ', parts.facts(it)); if (parts.pulse && it.state !== 'stalled') l.append(' ', parts.pulse(it)); return l; }));
    w.hidden = !its.length; return;
  }
  if (w.id === 'gs-uwork') { w.replaceChildren(); w.hidden = true; return; }   // the older reading below is step 3's work only
  const t = workWords(S); w.textContent = t; w.hidden = !t;
}
// NOT MOVING IS COUNTED FROM THE PRESS, AND NEVER SAID OF A PART THAT IS OUT (decision 1162.5). A brain that gives its own
// verdict (item.alive, brain file 2026-11-12-step4-pressed-1) is taken as it is. One that does not yet counted from the last
// thing read, which could be an earlier sample's ("Nothing has moved for 312 minutes", seconds after Alex's press), and knew
// nothing of parts out at the AI company. For that brain the item is put right here from its own two times (last_moved, since)
// and from understand_progress (how many are out), and only for this card.
function pressItem(it, W, S) {
  if (typeof it.alive === 'boolean') return it;
  const out = pressRows(S).reduce((a, x) => a + (Number(x.out_in_batches) || 0), 0);
  const at = Date.parse(W.at), m = Date.parse(it.last_moved), si = Date.parse(it.since);
  const from = Math.max(Number.isFinite(m) ? m : 0, Number.isFinite(si) ? si : 0);
  const idle = Number.isFinite(at) && from > 0 ? Math.max(0, Math.floor((at - from) / 60000)) : null;
  const still = out === 0 && idle !== null && idle >= (Number(it.stall_after) || 6);
  // parts out, on a press younger than the 24 hours the AI company promises: every part out is within its promised time, so it is alive
  const within = out > 0 && !S.uprogErr && Number.isFinite(at) && Number.isFinite(si) && at - si < 24 * 3600000;
  return { ...it, state: still ? 'stalled' : 'working', idle_minutes: idle === null ? it.idle_minutes : idle, out, alive: within ? true : undefined };
}
// THE ANSWER FIRST: one percentage for everything searchable (brain_road: done of what can be read), the Working line, what
// searchable gets her, a box to try it on what is already searchable (the Tool's own conversation, as a find; her guide's
// column shows what it found), and that she can stop here.
function heroCard(S) {
  const c = el('section', 'am-step gs-hero'); c.id = 'gs-hero';
  const F = S.road?.findable;
  c.appendChild(el('span', 'am-num', 'Step 3 ' + DOT + ' Make It Searchable'));
  const top = el('div', 'gs-herotop'), l = el('div');
  l.append(K(el('div', 'gs-pct', F ? num(F.pct) + '%' : ''), 'pct'), el('p', 'gr-small', F ? 'Of your mail and files are searchable.' : 'Your brain could not be read just now, so the percentage is not shown. It tries again on its own.'));
  const w = K(el('div', 'gs-work'), 'work'); w.id = 'gs-work'; w.setAttribute('role', 'status'); workInto(w, S);
  /* green is the one rule, green3 (seat setup-polish) */
  top.append(l, w); if (green3(S)) top.appendChild(chip('ok', 'Done'));   // green when nothing a press can read is left (decision 1169)
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
  l.appendChild(el('b', null, name)); if (mini) l.appendChild(K(el('small', null, cap(mini)), 'm'));   /* every line starts with a capital (decision 1172.4) */
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
    /* ONE COUNT AND ONE TIME LEFT PER THING (decision 1172.2 and .5): where the one indicator's reading carries this source, the row says its numbers, the same the top line and the header's list say. SUPERSEDED there: the plan's count under the line's count (16 of 98 under 1,101 of 1,178, 52 minutes under 37). */
    const wi = (window.toolWork && Array.isArray(window.toolWork.items) ? window.toolWork.items : []).find((x) => x.kind === 'searchable' && x.source_key === q.key), pg0 = (S.prog ?? []).find((x) => x.source === q.key);
    const all = wi ? Number(wi.total) || 0 : Number(q.reading_total) || 0, done = wi ? Number(wi.done) || 0 : Number(q.reading_done) || 0, pg = wi ? { minutes_left: wi.state === 'stalled' ? null : wi.minutes_left } : pg0;
    const bar = el('div', 'gs-bar'), i = K(el('i'), 'w'); i.style.width = (all ? Math.min(100, Math.round((done / all) * 100)) : 0) + '%'; bar.appendChild(i);
    w.append(bar, K(el('small', 'gs-srcnote', num(done) + ' of ' + num(all) + ' done ' + DOT + ' ' + (wi && wi.state === 'stalled' ? 'nothing has moved for ' + num(wi.idle_minutes) + (Number(wi.idle_minutes) === 1 ? ' minute' : ' minutes') : leftWords(pg ? pg.minutes_left : null))), 'n'));
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
  const hd = el('div', 'gs-treehd'); hd.append(el('h2', 'am-h2', 'Your Mail and Files'), el('small', 'gs-srcnote', 'As they are in Google. Tap a group to fold it.'));
  c.appendChild(hd);
  const src = S.src?.rows ?? [], P = S.splan && S.splan.ok === true ? S.splan : null, pr = P ? planRows(P) : [];
  const by = (r) => pr.find((q) => q.key === r.source_key), nm = names(S, pr), own = P ? ownDomain(P) : null;
  if (!P) c.appendChild(S.splanErr || S.late?.has('plan') ? p('gr-small', 'The counts could not be read just now' + (S.splanErr ? ': ' + String(S.splanErr) : '') + '. It tries again on its own.') : p('working gr-small', 'Counting what there is to read, for free'));
  const show = (r) => { const q = by(r); return q ? nm[q.key] : isKey(String(r.name || ''), { key: r.source_key }) ? String(r.what || 'Drive') : String(r.name); };
  const row = (r, mini) => { const q = by(r), w = q ? (WORD[q.state] || [String(q.state), '']) : (SV[r.state] || ['', '']); return srcLeaf(S, q, show(r), own, !q ? '' : q.state === 'not_counted' ? String(q.note || 'Not counted yet') : mini(q), w[0], w[1]); };
  const tally = (rows) => {
    const qs = rows.map(by).filter(Boolean), n = (s) => qs.filter((q) => q.state === s).length;
    const t = [[n('to_read'), n('to_read') === 1 ? ' is not all searchable yet' : ' are not all searchable yet'], [n('reading'), ' reading'], [n('not_counted'), ' counting']].filter((x) => x[0]).map((x) => num(x[0]) + x[1]);
    if (t.length) return [(n('searchable') ? [num(n('searchable')) + ' searchable'] : []).concat(t).join(' ' + DOT + ' '), 'warn'];
    return qs.length ? ['Searchable', 'ok'] : ['', ''];
  };
  const add = (t) => btn('gr-link gs-add', '+ Add ' + t, () => brainPanel('add'));
  const tree = el('div', 'gs-groups');
  // GMAIL: each mailbox by its address, its emails, one status word.
  const mail = src.filter((r) => r.group === 'email'), mt = tally(mail);
  const emails = mail.map(by).filter(Boolean).reduce((a, q) => a + (Number(q.emails) || 0), 0);
  tree.appendChild(grp('mail', 'mail', 'Gmail', mail.length ? num(mail.length) + (mail.length === 1 ? ' mailbox' : ' mailboxes') + (P ? ' ' + DOT + ' ' + num(emails) + ' emails' + winWords(P.months) : '') : 'None connected yet', mt[0], mt[1],   /* the count says what it counts (decision 1172.5); step 5 says the same count (mailCount) */
    mail.map((r) => row(r, (q) => num(q.emails) + ' emails')).concat([add('a Mailbox')])));
  // GOOGLE DRIVE: shared drives, meetings, folders shared with the Tool, each by its own name with its files. A drive with
  // nothing in it is not a row: it is said in one plain line.
  const dr = src.filter((r) => r.group === 'drives');
  const none = (r) => { const q = by(r); return !!q && q.state === 'searchable' && !(Number(q.files) > 0); };
  const full = dr.filter((r) => !none(r)), dt = tally(full), { shared, meet, rest } = driveParts(full);
  const files = (q) => num(q.files) + ' files' + (q.state === 'to_read' ? ' ' + DOT + ' ' + num(q.to_read) + (Number(q.to_read) === 1 ? ' from before you connected is not searchable yet' : ' from before you connected are not searchable yet') : '');
  const part = (title, rows) => (rows.length ? [el('span', 'gs-oncelab', title)].concat(rows.map((r) => row(r, files))) : []);
  const kids = part('Shared Drives', shared).concat(part('Meetings', meet), part('Folders Shared With the Tool', rest));
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
  tree.appendChild(grp('drive', 'folder', 'Google Drive', [shared.length ? num(shared.length) + (shared.length === 1 ? ' shared drive' : ' shared drives') : '', meet.length ? 'meetings' : '', rest.length ? num(rest.length) + (rest.length === 1 ? ' folder' : ' folders') : ''].filter(Boolean).join(' ' + DOT + ' ') || (dr.length ? 'Nothing in them yet' : 'None connected yet'),
    dt[0], dt[1], kids.concat([add('a Drive or Folder')])));
  // YOUR SYSTEMS (with calendar and contacts): each by its name with the brain's own line of what it keeps, cut to its first part.
  const sys = src.filter((r) => ['systems', 'calendar', 'contacts'].includes(r.group));
  const holds = (r) => { let t = String(r.line || ''); const a = t.indexOf(': '); if (t.startsWith('Up to date') && a > 0) t = t.slice(a + 2); for (const cut of [';', '. ']) { const i = t.indexOf(cut); if (i > 0) t = t.slice(0, i); } return t.endsWith('.') ? t.slice(0, -1) : t; };
  const bad = sys.filter((r) => r.state === 'needs_you').length;
  const sk = sys.map((r) => { const w = SV[r.state] || ['', ''], d = el('div', 'gs-src'); d.appendChild(leaf(String(r.name), holds(r), w[0], w[1])); return d; });
  if (sys.length) sk.push(el('small', 'gs-srcnote', 'The Tool keeps a copy of each system so answers come in a second, refreshed on its own; when an answer depends on the very latest, it checks the system live and says so.'));
  /* THE SAME LIST, THE SAME NUMBER (decision 1172.5): systems are counted as step 5 counts them; the calendar and the contacts are named, not counted as systems. SUPERSEDED: 12 connected here beside 10 systems on step 5. */ const nG = (g) => sys.filter((r) => r.group === g).length, sysSay = [nG('systems') ? num(nG('systems')) + (nG('systems') === 1 ? ' system' : ' systems') : '', nG('calendar') ? 'calendar' : '', nG('contacts') ? 'contacts' : ''].filter(Boolean).join(' ' + DOT + ' ');
  tree.appendChild(grp('sys', 'systems', 'Your Systems', sys.length ? sysSay : 'None connected yet', !sys.length ? '' : bad ? num(bad) + (bad === 1 ? ' needs you' : ' need you') : 'Connected', bad ? 'warn' : 'ok', sk.concat([add('a System')])));
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
// SINCE DECISION 1169 (seat steps-green 2026-11-12) this is the first line of the step's exceptions (excCard), not a card of its
// own at the foot: Alex saw "2 need your yes" in the list and could not find where the yes was. SUPERSEDED: the heading
// "One thing needs your yes" and the card's place under the whole list.
function yesInto(c, S, P, need) {
  const all = planRows(P), nm = names(S, all), pick = chosenOf(P);
  const sum = (rows) => rows.reduce((a, r) => a + (Number(r.to_read) || 0), 0);
  const cost = Math.round(pick.reduce((a, r) => a + (Number(r.usd) || 0), 0) * 100) / 100;
  const cur = (P.choices ?? []).find((ch) => (ch.months ?? null) === (plan.months ?? null)), complete = !cur || cur.complete !== false;
  const part = (rows, one, many, where) => (rows.length ? num(sum(rows)) + ' ' + (sum(rows) === 1 ? one : many) + ' in ' + (rows.length === 1 ? nm[rows[0].key] : num(rows.length) + ' ' + where) : '');
  const what = [part(pick.filter((r) => r.kind === 'mail'), 'attachment', 'attachments', 'mailboxes'), part(pick.filter((r) => r.kind !== 'mail'), 'file', 'files', 'drives or folders')].filter(Boolean).join(' and ');
  const mins = pick.length && pick.every((r) => r.minutes !== null && r.minutes !== undefined) ? Math.max(...pick.map((r) => Number(r.minutes) || 0)) : null;
  const say = el('p', 'gs-say');
  say.append(K(el('span', null, pick.length ? num(sum(pick)) + (sum(pick) === 1 ? ' item from before you connected is' : ' items from before you connected are') + ' not searchable yet: ' + what + '. ' : 'Nothing is checked. '), 'what'),
    'Nothing from before you connected is read without your yes. ', el('b', null, 'Can be put in: '), 'press once, ',
    K(el('b', null, !pick.length ? '' : complete ? usd2(cost) : 'counting'), 'usd'), K(el('span', null, !pick.length ? '' : mins !== null ? ', about ' + num(mins) + ' minutes.' : ', time measured as it reads.'), 'mins'));
  c.appendChild(say);
  const d = el('details', 'gs-fold'); d.id = 'gs-list'; d.open = listOpen;
  d.addEventListener('toggle', () => { listOpen = d.open; });
  d.appendChild(el('summary', null, 'See the List'));
  for (const r of need) {
    const lab = el('label', 'gs-row gs-tick'), box = el('input'); box.type = 'checkbox'; box.checked = !plan.off[r.key]; box.setAttribute('aria-label', nm[r.key]);
    box.addEventListener('change', () => { plan.off[r.key] = !box.checked; draw(); });
    const l = el('span', 'gs-rl'); l.append(el('b', null, nm[r.key]), K(el('small', null, num(r.to_read) + (r.kind === 'mail' ? ' attachments not searchable yet' : ' files not searchable yet')), 'n'));
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
  d.append(el('b', 'gs-lab', 'How Far Back'), seg);
  if (P.boundary) d.appendChild(el('p', 'am-small', String(P.boundary)));
  d.appendChild(el('p', 'am-small', 'Uncheck anything you do not need. Counted for free; nothing is read until you press.'));
  c.appendChild(d);
  const bal = Number(P.balance_usd), known = P.balance_known === true && Number.isFinite(bal), over = known && cost > bal + 0.000001;
  if (pick.length && !mark(S, 'agreed')) c.appendChild(termsLine(S));   // the yes to the terms, kept once, before the first press that costs
  if (over) c.appendChild(creditAsk(S, cost, bal));
  const out = p('gr-small', ''); out.id = 'gs-out';
  const go = K(btn('go', 'Make Them Searchable' + (complete && pick.length ? ' ' + DOT + ' ' + usd2(cost) : ''), () => {
    if (!agreedNow()) { out.textContent = 'Check the box first: it says you agree to the terms of use.'; C.$('#gs-agree')?.focus(); return; }
    searchPreview(R, chosenOf(R.splan), out, go);
  }), 'go');
  go.id = 'gs-go'; go.disabled = !known || over || !complete || !pick.length;
  const act = el('div', 'gs-act');
  act.append(go, K(el('small', 'gs-srcnote', !known ? 'Your credit could not be read just now, so nothing can be started. It tries again on its own.' : over ? 'Add credit above first.' : 'Paid from your credit (' + usd2(bal) + ' left).'), 'bal'));
  c.append(act, out);
}
// A STEP IS GREEN OR SHOWS ITS EXCEPTIONS, NOTHING ELSE (seat steps-green 2026-11-12, decision 1169; Alex 12:38 PT: "management
// by exception, a fraction of the stuff should be very clearly what didn't go, and can we put it in? If yes, this is how you
// put it in. If no, this is why, and that's it, right? And then boom, it goes to green."). Right under the answer: when
// nothing a press can read is left, one green line; what did not go in, each in ONE line with its count and either "Can be
// put in:" how, with its one button and price, or "Cannot be put in:" why. Every count is the brain's (search_plan's states,
// brain_road's not_searchable). The step is green when nothing she can put in with a press is left (the brain's own rule for
// searchable); what cannot be put in is explained and does not hold it back.
const step3Left = (S) => { const P = S.splan && S.splan.ok === true ? S.splan : null; if (!P) return null; const r = planRows(P); return { need: r.filter((x) => x.state === 'to_read'), busy: r.some((x) => x.state === 'reading' || x.state === 'not_counted'), off: (P.sources ?? []).filter((x) => x.state === 'not_connected'), P }; };
function excCard(S) {
  const L = step3Left(S);
  if (!L) return null;
  const NS = S.road?.findable?.not_searchable ?? S.road?.ready?.not_searchable ?? {}, n = (v) => Number(v) || 0;
  const no = [], ex = (count, words, why, act, lab) => { const d = el('div', 'gs-ex'), t = el('span'); t.append(K(el('b', null, num(count)), 'x'), ' ' + words + ' ', el('b', 'gs-exno', lab || (act ? 'Can be put in: ' : 'Cannot be put in: ')), why); d.appendChild(t); if (act) d.appendChild(act); no.push(d); };
  if (L.off.length) ex(L.off.length, (L.off.length === 1 ? 'drive or folder is' : 'drives or folders are') + ' no longer connected, so nothing in ' + (L.off.length === 1 ? 'it' : 'them') + ' is read.', 'connect ' + (L.off.length === 1 ? 'it' : 'them') + ' again.', btn('gr-link', '+ Add a Drive or Folder', () => brainPanel('add')));
  const cant = n(NS.could_not_read) + n(NS.drive_could_not_read), held = n(NS.held_by_policy) + n(NS.drive_held_by_policy), media = n(NS.pictures_and_video) + n(NS.recordings) + n(NS.scans);
  if (cant) ex(cant, cant === 1 ? 'file could not be opened.' : 'files could not be opened.', 'damaged, locked with a password, or in a format the Tool does not read.');
  if (held) ex(held, held === 1 ? 'is held back as private or not business.' : 'are held back as private or not business.', 'a privacy rule keeps them out, so nobody finds them by mistake.');
  if (media) ex(media, 'pictures, recordings and scans in mail are not read.', 'reading them uses AI. It is offered once its price has been measured on a sample of your own mail.');
  if (n(NS.drive_not_read)) ex(n(NS.drive_not_read), 'drive files were read only in part.', 'there is nothing for you to do.', null, 'Ours to fix: ');   /* SUPERSEDED 2026-11-13: Cannot be put in for files that are ours to finish reading */
  /* WHAT WENT THROUGH ON ITS OWN IS SAID AFTERWARDS (decision 1171), from what the brain kept (getting_ready_mark small_search) */ { const sm = smallMark(S, 'small_search'); if (sm) { const d = el('div', 'gs-ex'), t = el('span'); t.id = 'gs-small3done'; t.append(el('b', null, num(sm.items)), (Number(sm.items) === 1 ? ' item was' : ' items were') + ' made searchable on ' + (Number(sm.items) === 1 ? 'its' : 'their') + ' own, ' + whenWords(sm.at) + ' ' + DOT + ' ', el('b', null, usd2(sm.usd)), smallUnder(S) !== null ? ' (under ' + usdT(smallUnder(S)) + ', so no need to ask).' : '.'); d.appendChild(t); no.unshift(d); } }
  if (!L.need.length && L.busy && !no.length) return null;   // still being made searchable and nothing to say yet: the answer card's Working line says it
  const c = el('section', 'am-step gs-yes gs-exc'); c.id = 'gs-need';
  if (L.need.length) {
    c.appendChild(el('h2', 'am-h2', 'What Is Not Searchable Yet'));
    /* SMALL LEFTOVERS GO ON THEIR OWN (seat ready-alive 2026-11-14, decisions 1171 and 1173 (1)): the brain starts them on its schedule, within about half an hour, page open or not; the step says so and asks nothing. The amount and the verdict are the brain's (brain_road ready.small). */
    if (S.road?.ready?.small?.on_its_own === true && mark(S, 'agreed')) { const n3 = L.need.reduce((a, x) => a + (Number(x.to_read) || 0), 0), u3 = L.need.reduce((a, x) => a + (Number(x.usd) || 0), 0); const rl = p('gs-runline gs-still', el('b', null, num(n3)), (n3 === 1 ? ' new item is' : ' new items are') + ' not searchable yet. ' + (n3 === 1 ? 'It goes' : 'They go') + ' in on ' + (n3 === 1 ? 'its' : 'their') + ' own within the half hour ' + DOT + ' ', el('b', null, usd2(u3)), ' (under ' + usdT(S.road.ready.small.under_usd) + ', so no need to ask).'); rl.id = 'gs-small3'; c.appendChild(rl); }
    else {
      c.appendChild(el('small', 'gs-srcnote', 'This waits for your yes. When it is in, or set aside on step 5, this step is green.'));
      if (smallWhy.search) c.appendChild(p('gr-small gs-over', 'This was not started on its own: ' + dotted(smallWhy.search)));
      yesInto(c, S, L.P, L.need);
    }
  } else if (L.busy || !green3(S)) c.appendChild(el('h2', 'am-h2', 'What Is Not Searchable, So Far'));
  else {
    const d = el('div', 'gs-exdone'); d.id = 'gs-green';
    d.append(chip('ok', 'Done'), el('b', null, 'Step 3 is green: everything that can be read is searchable.'));
    c.appendChild(d);
    if (no.length) c.appendChild(el('small', 'gs-srcnote', 'What could not go in is said here, each with its reason. Nothing is waiting on you.'));
  }
  if (no.length) { const b = el('div', 'gs-exlist'); b.id = 'gs-exlist'; b.append(...no); c.appendChild(b); }
  return c;
}
// WHAT IS NOT SEARCHABLE, AND WHY, folded at the foot (decision 1156.5). The table is drawn when she opens the fold, from the
// reading on the page at that moment (notBody), and again each time she opens it.
function notCard(S) {
  const c = el('section', 'am-step gs-not'); c.id = 'gs-not';
  const d = el('details', 'gs-fold'); d.id = 'gs-notfold';
  const b = K(el('div', 'gs-notbody'), 'b');
  d.append(el('summary', null, 'What Is Not Searchable, and Why'), b);
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
  body.appendChild(p('gr-small', 'The percentage counts only what can be read. What cannot be read is said below with its reason, never counted as missing.'));
  body.appendChild(tRow('Searchable now', 'Emails, attachments and drive files', num(F.done)));
  const rd = n(M.attach_reading) + n(Fi.waiting);
  body.appendChild(tRow('Reading now', rd > 0 ? leftWords(F.minutes_left) : 'Nothing is being read just now', num(rd)));
  const wy = n(M.attach_waiting) + n(Fi.waiting_yes);
  body.appendChild(tRow('Not searchable yet, can be put in', 'Attachments and drive files that can be read once you say yes. ' + split(M.attach_waiting, Fi.waiting_yes), num(wy),
    wy > 0 ? btn('gr-link', 'Put them in' + String.fromCharCode(8230), () => C.$('#gs-need')?.scrollIntoView({ block: 'start' })) : null));
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
  d.append(el('b', null, 'Add Credit First ' + DOT + ' ' + usd2(add)),
    p('gr-small', 'What is checked costs ' + usd2(cost) + ' and your credit is ' + (bal < 0 ? usd2(-bal) + ' under zero' : usd2(bal)) + '. ' + usd2(add) + ' covers the ' + usd2(gap) + ' this step needs, with a cushion so it cannot stop halfway. What is left stays in your credit for the next step. Or uncheck something in the list.'),
    priceRow('Top-up', usd2(add)), priceRow('Card fee, at the card company' + String.fromCharCode(8217) + 's price', usd2(f)), priceRow('Total, one time', usd2(add + f)),
    el('p', 'am-small', 'From the count above and your credit. It goes to the AI companies at their own price; Verrandi adds nothing. You type your card on Stripe' + String.fromCharCode(8217) + 's own page.' + (add === 5 && gap * 1.25 < 5 ? ' $5 is the smallest card payment.' : '')));
  const pay = !!S.marks?.payments, card0 = cardOf(S);
  if (pay && (!card0 || card0.mode !== 'live')) d.appendChild(p('gr-small gr-test', 'Card payments are in test mode: on Stripe use the test card 4242 4242 4242 4242, any future date, any 3 digits. A test payment is shown here and is never added to your credit.'));
  const msg = p('gr-small', '');
  const go = btn('go', 'Add ' + usd2(add) + ' with Stripe', async () => {
    if (!agreedNow()) { msg.textContent = 'Check the box first: it says you agree to the terms of use.'; C.$('#gs-agree')?.focus(); return; }
    if (!pay) { msg.textContent = 'Card payments are not switched on for this brain yet, so nothing was started.'; return; }
    go.disabled = true; msg.className = 'working no-late gr-small'; msg.textContent = 'Opening the payment page';
    const { data, error } = await rpc('topup_start', { p_amount_usd: add });
    if (error || !data || data.ok !== true || !data.url) { msg.className = 'gr-small'; msg.textContent = 'Not started: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; go.disabled = false; return; }
    location.href = String(data.url);
  });
  const gw = el('div', 'gr-go gs-two'); gw.append(go, btn('go ghost', 'Other Amount', () => topUp(S, gap)));
  d.append(gw, msg);
  return d;
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
  const no = btn('go ghost', 'Not Now', () => sheet.close());
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
  body.append(priceRow('Items to Make Searchable', num(data.total_items)), priceRow('Price, One Time', usd2(data.total_usd)),
    p('gr-small', data.minutes === null || data.minutes === undefined ? 'Time: measuring' : 'about ' + num(data.minutes) + ' minutes'));
  if (data.note) body.appendChild(p('gr-small', String(data.note)));
  const busy = Array.isArray(data.already_reading) ? data.already_reading.length : 0;   // chosen, but already pressed and reading: left to that press, not in this price
  if (busy) body.appendChild(p('gr-small gs-busy', busy === 1 ? 'One source you chose is already being read. It is left as it is and is not in this price.' : num(busy) + ' sources you chose are already being read. They are left as they are and are not in this price.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, Make It Searchable ' + DOT + ' ' + usd2(data.total_usd), async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting';
    const r = await goAsk({ ...args, confirm: true });
    if (r.error || !r.data || r.data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + String(r.error?.message ?? r.data?.note ?? r.data?.reason ?? 'no reason was given') + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(r.data.note || 'Started. You get one short email when it is done.'));
    mount(C);
  });
  const no = btn('go ghost', 'Not Now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no);
  body.append(acts, said);
  sheet.open('Make Them Searchable?', body);
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
      if (R === S && !error && Array.isArray(data)) { S.prog = data; const w = C.$('#gs-work'); if (w) workInto(w, S); }
    }
    searchPoll();
  }, 15000);
}
// QUESTIONS (steps 1 to 3): details that open in place, the approved questions and answers.
function questions(list, top) {
  const d = el('div', 'gs-qs'); d.id = 'gs-qs';
  const all = list.map(([q, a]) => fold(q, p(null, a)));
  if (!top || all.length <= top) { d.append(el('h2', 'am-h2', 'Questions'), ...all); return d; }
  const more = el('details', 'gs-fold gs-moreq'); more.id = 'gs-moreq'; more.append(el('summary', null, 'More Questions'), ...all.slice(top));   /* the list folds to its first three (seat setup-clean 2026-11-13, decision 1172) */
  d.append(el('h2', 'am-h2', 'Questions'), ...all.slice(0, top), more);
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
      card('coin', 'What It Costs, Every Month', null, priceRow('Your Own Database, by Supabase', cap(dbCost(S).say) + ' / month', 'The cost of having a real database that belongs to you. Paid to Supabase directly, on your own card. Not a Verrandi charge. Very large businesses pay a little more as it grows.'))];
    // ONE SUPABASE SIGN-IN IS NOT BUILT (spec): a brain that exists shows it is set up; a brain that does not answer says so.
    out.splice(1, 0, shape('A database of your own, where everything the Tool learns about your business is kept. You get a memory that stays yours.', cap(dbCost(S).say) + ' a month', live ? 'Done. It is set up.' : 'Not answering just now.', 'Paid to Supabase on your own card, at Supabase' + String.fromCharCode(8217) + 's published price. Not a Verrandi charge.'));
    if (live) out.push(okMark('Your database is set up'), goOn('connect', 'Continue to Step 2 ' + DOT + ' Connect'));
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
    const out = [H('Connect everything you use.'), shape('Tap each one and sign in on their page. You get everything you use in one place, counted for free.', 'Free', 'One sign-in each, on their own page', 'Connecting and counting use no AI, so they cost nothing. Step 3 shows the count and its price before anything is read.')];
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
    out.push(card('link', 'Where Your Business Lives', null, t1, el('p', 'am-small', 'For the Tool to work well, connect at least your mail, your files, your calendar and your accounting. Every mailbox and every drive is its own connection.')));
    const saves = Number(S.conn?.saves) || 0;
    const t2 = el('div', 'gs-tiles');
    t2.append(tileBtn('chat', 'Your AI Chats', 'Your Claude or ChatGPT history, from their download', saves ? 'Added' : 'Upload', !!saves, () => brainPanel('chats')),
      tileBtn('book', 'Downloads', 'A whole export from a system you used before', 'Upload', false, () => brainPanel('downloads')),
      tileBtn('file', 'Loose Files', 'Single documents from your computer', 'Upload', by('loose').length > 0, () => brainPanel('loose')),
      tileBtn('photo', 'Scans and Photos', 'Documents in pictures, read as a choice with its own price', 'Choose', false, () => brainPanel('scans')));
    out.push(card('upload', 'Bring In What You Already Have', null, t2, el('p', 'am-small', 'Saved AI chats stay private to the person who added them. A big download is counted and priced before anything is read.')));
    out.push(card('ai', 'Your Own AI Assistant', null, (() => { const d = el('div', 'gr-act'); const t = el('span'); t.append(el('b', null, 'Connect Your Claude'), el('small', null, 'Ask your brain from inside Claude, with what you are allowed to see. It works as soon as your brain is searchable.')); d.append(t, btn('go ghost', 'Connect', () => brainPanel('assistadd'))); return d; })()));
    out.push(rows.length ? goOn('search', 'Continue to Step 3 ' + DOT + ' Make It Searchable') : (() => { const d = el('div', 'gr-go'); d.appendChild(btn('go', 'Connect Your First One', () => brainPanel('add'))); return d; })());
    out.push(questions(CARDS.connectQs().filter((q, i) => i < 4 || i === 7)));
    return out;
  },
  // STEP 3 · MAKE IT SEARCHABLE (decision 1150.2): the count and its price, the AI credit asked here when it is short, the one
  // press. SINCE DECISION 1156 (seat step3-fresh, 2026-11-12): the answer first, her sources as she knows them, the one box that
  // asks, and what is not searchable; each card has its id, so a re-read changes numbers in place (draw, inPlace).
  search(S) {
    const rows = S.src?.rows ?? [];
    const prog = S.prog ?? [];
    const out = [heroCard(S)];
    const exc = excCard(S); if (exc) out.push(exc);   // green, or the exceptions, right under the answer (decision 1169)
    out.push(treeCard(S), notCard(S));
    /* SUPERSEDED 2026-11-13 (seat setup-polish): a second rule for green here (every row up to date). Green is the one rule, green3. */
    const acts = el('div', 'gr-chips'); acts.id = 'gs-cont';
    const cont = K(btn('go', 'Continue to Step 4 ' + DOT + ' Understand', () => { at = 'understand'; draw(); window.scrollTo({ top: 0 }); }), 'c'); cont.id = 'gs-cont3'; cont.disabled = !green3(S);   // the brain's searchable rule (1142.1), or every row green
    acts.append(cont, K(el('small', 'gs-srcnote', green3(S) ? '' : 'Opens when this step is green: what is left is at the top of this page.'), 'cn'));
    out.push(acts);
    out.push(questions(CARDS.connectQs().filter((q, i) => i >= 4 && i < 7).concat([
      ['What does searchable mean?', 'Every email, attachment and file you connect is read once and gets a fingerprint of its meaning, so you can find it by what it is about, not only by its exact words. It shows you your own documents and never invents anything.'],
      ['Which AI does this step use?', 'Two, each tested for its job: OpenAI makes the search fingerprint of every item, and Claude, by Anthropic, gives every item a quick privacy check, so sensitive things reach only the right people.'],
      ['Why pay ahead?', 'So you are never surprised by a bill, and the Tool never spends money you did not put in.'],
      ['What happens to what is left?', 'It stays in your credit for the next steps.'],
      ['Is my card safe?', 'You type it on the page of Stripe, the payment company. Verrandi only ever sees the card brand and the last four digits.'],
    ]), 3));   /* three shown, the rest folded (decision 1172, Also) */
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
  // STEP 4 · UNDERSTAND, THE FRESH LOOK (seat step4-fresh, 2026-11-12, decision 1158): the answer first, the live card while a
  // press reads, What to understand, How fast with the one button. See STEP 4, THE FRESH LOOK above heroU.
  understand(S, st) {
    // A STEP CHANGES SHAPE ONCE PRESSED (seat step4-pressed 2026-11-12, decision 1162): while her press runs the step is about
    // that press: the top card is the progress, what she chose is read-only, and How fast with its button is one line.
    // ONCE IT IS DONE the step tells that press's story first, and the choices open again under it (seat step4-after 2026-11-12).
    const pr = pressRows(S), all = mainAll(S), after = !pr.length && pressSettled(S);   /* her own press; what went through on its own (decision 1171) is one line on its card */
    const out = pr.length ? [pressHero(S, all), treeU(S, true), nowLine(all)] : [after ? afterHero(S, all, st) : heroU(S)];
    if (!pr.length) {
      if (S.uprogErr) out.push(progressFailed('gs-ulive', 'Understanding your mail', S.uprogErr));
      if (after) out.push(nextFold(S)); else out.push(treeU(S));
      const sp = after ? null : speedCard(S); if (sp) out.push(sp);
    }
    if (!after && st.find((x) => x.k === 'understand')?.done) { const acts = el('div', 'gr-chips'); acts.id = 'gs-ucont'; acts.appendChild(btn('go ghost', 'Continue', () => { at = 'ready'; draw(); window.scrollTo({ top: 0 }); })); out.push(acts); }
    return out;
  },
  // STEP 5 · READY (spec part 2). The brain's rows from the same readings the Brain shows (brain_road, the one reading of
  // sources); the monthly costs: the database from the AI tab's own estimate (Supabase's list price), keeping up from the
  // meter's monthly estimate per source (read_estimate monthly_usd), questions and the plan as approved words.
  ready(S, st) {
    const ok = st[st.length - 1].done;
    /* THE TWO BOXES THAT SAID NOTHING GO (seat setup-clean 2026-11-13, decision 1172, Also): Cost "your monthly costs, below" and Time "now". One line says what Ready is; the costs are in their own card below. Her guide reads this step from window.toolSetup. */
    const out = [H(ok ? 'Your brain is ready.' : 'Your brain is not ready yet.'), p('gs-does', 'Mail, Drives and the rest of the Tool open, and your brain keeps up by itself.')];
    const RD5 = S.road?.ready || {}, aside5 = ok && RD5.set_aside === true && RD5.by_itself === false;   /* seat ready-alive 2026-11-14, decision 1173 (2) */
    out.push(ok ? okMark(aside5 ? 'Ready. You opened the Tool with a few things set aside; they are listed below. It keeps up by itself.' : 'Everything is connected and searchable, and what matters is understood. It keeps up by itself.') : p('gr-lead', 'When what is open below is settled, or you choose Continue Anyway, this says Ready. From then on it keeps up by itself.'));
    if (!ok || aside5) { const so = stillOpen(S); if (so) out.push(so); } { const x5 = exc5(S); if (x5) out.push(x5); }
    out.push(brainCard(S));
    const M = monthlyOf(S);
    const db = S.ai?.cost?.database;
    const cost = card('coin', 'What It Costs From Now On, Every Month', null,
      priceRow('Your Database, Paid to Supabase', cap(dbCost(S).say), db?.known ? 'From Supabase' + String.fromCharCode(8217) + 's published price for your ' + String(db.plan || '') + ' plan; the exact figure is on their invoice.' : 'Supabase' + String.fromCharCode(8217) + 's price; the exact figure is on their invoice.'),
      priceRow('Keeping New Mail Searchable and Understood', M === null ? 'Measured after your first month' : 'About ' + usd2(M), M === null ? null : 'Estimated from the pace of your own mail.'),
      priceRow('Your Questions', 'About 1 cent each'),
      priceRow('The Tool', 'Your plan'),
      el('p', 'am-small', 'Estimates until your first month is measured; then the measured numbers are in Settings, with your monthly limit.'));
    out.push(cost);
    const t = el('div', 'gs-tiles');
    const mail = tileBtn('mail', 'Open My Mail', 'It looks like the mail you know, with ' + guideName() + ' beside it', ok ? 'Open' : 'When Ready', ok, () => { if (!ok) { toast('Your Mail opens when your brain is ready.'); return; } unmount(); C.goTab('email'); });
    const claude = tileBtn('ai', 'Connect My Claude', 'Ask your brain from inside Claude', 'Connect', false, () => brainPanel('assistadd'));
    const team = tileBtn('person', 'Invite Your Team', 'Each sees only what they can already open', ok ? 'Invite' : 'When Ready', ok, () => { if (!ok) { toast('You can invite your team when your brain is ready. Each person will see only what they can already open.'); return; } unmount(); try { history.replaceState(null, '', location.pathname + location.search + '#security/people'); } catch (_) { /* Security still opens, on its first part */ } C.goTab('security'); });   /* People and Access is Security's part 'people' (decision 1172, Also) */   /* inviting is built (Security, People and access: fill/people.js); SUPERSEDED 2026-11-13: the word coming */
    t.append(mail, claude, team);
    out.push(card('hand', 'Start Working', null, t));
    if (ok) { const g = el('div', 'gr-go'); g.appendChild(btn('go ghost', 'Open Settings', () => C.goto('s-settings'))); out.push(g); }
    out.push(questions([
      ['Where do I change my choices?', 'In Settings: your connections, how far back, what is understood, which AI, your monthly limit, your card, your language and your guide' + String.fromCharCode(8217) + 's name.'],
      ['How do I know it is working?', 'The Brain shows how everything stands, in green, yellow and red, always with words. If something stops, it says what and what is being done.'],
      ['Can I add more later?', 'Yes, any time, from Settings. Each addition shows its price before anything is read.'],
    ]));
    return out;
  },
};
// READY SETTLES WHAT IS OPEN IN PLACE (seat ready-alive 2026-11-14, decisions 1173 (2) and 1174 (2); Alex 18:04 PT: "There has to
// be also a place to say just ignore and move on"; 18:09 PT: "it would make sense to have that in the Ready tab ... now if I click
// on it, it takes me to step 3"). The brain's own reasons (brain_road 'ready'), each in one line, and its action right here: what
// can be put in is put in from this card (step 3's own press, yesInto), and Continue Anyway (the owner's, kept by the brain as
// setup_mark ready_anyway) opens the Tool with the rest set aside. Once set aside, the same list stays under Ready, titled Set
// Aside. Never a second rule, never a link to another step. SUPERSEDED 2026-11-14: rows that each sent her to another step.
let anyBusy = false, anyWhy = '';
function stillOpen(S) {
  const RD = S.road?.ready;
  if (!RD || typeof RD !== 'object') return null;
  const aside = RD.set_aside === true, rows = [], add = (n, t) => rows.push([n, t]);
  const L = step3Left(S), need = L && S.owner ? L.need : [];
  if (RD.searchable === false && !need.length) { if (Number(RD.not_counted) > 0) add(RD.not_counted, (Number(RD.not_counted) === 1 ? 'mailbox or drive is' : 'mailboxes or drives are') + ' not counted yet. Counting is free and goes on by itself.'); else if (Number(RD.to_read) > 0) add(RD.to_read, (Number(RD.to_read) === 1 ? 'email or file is' : 'emails and files are') + ' being made searchable now.'); }
  if (RD.understood === false) {
    const miss = Number(RD.mailboxes_to_choose) - Number(RD.mailboxes_chosen);
    if (miss > 0) add(miss, (miss === 1 ? 'mailbox is' : 'mailboxes are') + ' not understood yet: Understand was not started for ' + (miss === 1 ? 'it' : 'them') + '.');
    if (Number(RD.stopped) > 0) add(RD.stopped, (Number(RD.stopped) === 1 ? 'mailbox was' : 'mailboxes were') + ' stopped while being understood.');
    if (Number(RD.waiting) > 0) add(RD.waiting, (Number(RD.waiting) === 1 ? 'email or file is' : 'emails and files are') + ' still being understood.');
  }
  if (RD.keeping_up === false) add(RD.refresh_errors, (Number(RD.refresh_errors) === 1 ? 'connection' : 'connections') + ' could not refresh. The Tool tries again on its own.');
  if (!rows.length && !(RD.searchable === false && need.length)) return null;
  const c = card('hand', aside ? 'Set Aside' : 'What Is Still Open', null); c.id = 'gs-open';
  if (aside) c.appendChild(p('gr-small', 'You opened the Tool with this still open' + (RD.set_aside_at ? ' on ' + whenWords(RD.set_aside_at) : '') + '. It stays listed here until it is settled.'));
  for (const [n, t] of rows) { const d = el('div', 'gs-ex'), x = el('span'); x.append(el('b', null, num(n)), ' ' + t); d.appendChild(x); c.appendChild(d); }
  if (RD.searchable === false && need.length) { const box = el('div', 'gs-openput'); box.id = 'gs-openput'; yesInto(box, S, L.P, need); c.appendChild(box); }
  if (!aside && S.owner) {
    const out = p('gr-small', anyWhy), go = btn('go ghost', anyBusy ? 'Opening' : 'Continue Anyway', async () => {
      if (anyBusy) return; anyBusy = true; anyWhy = ''; paint();
      const r = await rpc('getting_ready_mark', { p_key: 'ready_anyway', p_value: { at: new Date().toISOString(), to_read: Number(RD.setup_to_read ?? RD.to_read) || 0, waiting: Number(RD.waiting) || 0 } });
      anyBusy = false;
      if (r.error || !r.data || r.data.ok !== true) { anyWhy = 'Not opened: ' + dotted(String(r.error?.message ?? r.data?.note ?? r.data?.reason ?? 'no reason was given')); if (R === S) paint(); return; }
      mount(C);
    });
    go.id = 'gs-anyway'; go.disabled = anyBusy; out.id = 'gs-anyout';
    const act = el('div', 'gs-act gs-anyact'); act.append(go, el('small', 'gs-srcnote', 'Opens Mail, Drives and the rest now. What is open stays listed here, and you can settle it any time.'));
    c.append(act, out);
  }
  return c;
}
// THE BRAIN, ONE ROW PER KIND (step 5): counts from brain_road and the one reading of sources; Understood only where the
// brain counts understood items of that kind, otherwise Searchable.
function brainCard(S) {
  const rows = S.src?.rows ?? [], d = S.road;
  const n = (g) => rows.filter((r) => r.group === g).length;
  const c = card('brain', 'Your Brain', null);
  const list = el('div', 'gs-rows');
  const add = (title, line1, understood) => { const r = el('div', 'gs-row'); const l = el('span', 'gs-rl'); l.append(el('b', null, title), el('small', null, line1)); r.append(l, el('span', understood ? 'gs-chip gs-chip-ok' : 'gs-chip gs-chip-read', understood ? 'Understood' : 'Searchable')); list.appendChild(r); };
  if (!d) { c.appendChild(p('gr-small', 'Your brain could not be read just now' + (S.roadErr ? ' (' + String(S.roadErr) + ')' : '') + '. It tries again on its own.')); return c; }
  const U = d.understood || {};
  /* ONE COUNT FROM ONE READING (decision 1172.5): the emails are the plan's count, as step 3 says them, with what it counts; attached files that are understood are said here and no longer counted as drive files (brain_road understood.attachments, brain file setup-clean-1). SUPERSEDED: every email the brain keeps, whatever its date. */
  const MC = mailCount(S);
  if (n('email')) add('Mail', num(n('email')) + (n('email') === 1 ? ' mailbox' : ' mailboxes') + (MC ? ' ' + DOT + ' ' + num(MC.n) + ' emails' + MC.words : '') + (Number(U.mail) ? ' ' + DOT + ' ' + num(U.mail) + ' understood' : '') + (Number(U.attachments) ? ' ' + DOT + ' ' + num(U.attachments) + ' attached files understood' : ''), Number(U.mail) > 0);
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
// WHILE IT IS UNDERSTOOD: understand_progress (counts, spent, the limit, minutes left), and Stop through the one press
// (source_read_approve 'understand_stop'): what is mid-read finishes, nothing more is taken.
// pressed: a mailbox keeps its groups, a drive has none, and both keep the limit the press gave them (seat understand-drives 2026-11-12)
const pressedRow = (x) => (Array.isArray(x.groups) && x.groups.length > 0) || (x.ceiling_usd !== null && x.ceiling_usd !== undefined);
// EVERYTHING HER PRESSES HOLD, DONE OR NOT (seat step4-after 2026-11-12): the top card and each row count from all of it.
// SUPERSEDED: counting only the sources still reading or stopped at their part of the limit. On HireKraft the morning after
// the overnight press (17 sources, 28,897 understood) step 4 said "433 of 706" and "Stopped at your limit $4.43": one drive.
const pressAll = (S) => (S?.uprog ?? []).filter(pressedRow);
const mailedOf = (x) => { const t = Date.parse(x?.mailed_at); return Number.isFinite(t) ? t : null; };   // the brain's own "this press was told done", where it says it
// A PRESS IS SETTLED when none of its sources is being read, or the brain says every one was told done (then what is read
// afterwards, new mail or a second try, is a quiet line and never the headline).
const pressSettled = (S) => { const a = mainAll(S); return a.length > 0 && (a.every((x) => x.state !== 'reading') || a.every((x) => mailedOf(x) !== null)); };
const pressRows = (S) => (pressSettled(S) ? [] : mainAll(S).filter((x) => x.state === 'reading' || x.state === 'at_ceiling'));
/* THE LIMIT AS SHE TYPED IT (seat setup-polish 2026-11-13, audit fix 4: she set $340 and the page said $339.93, the sum of each source's share rounded down to the cent). Where the brain sends the limit of the press (press_limit_usd, with press_id) that is shown, once per press; a brain that does not send it yet shows the sum of the shares as before. */ const limOf = (rows) => { const t = {}; for (const x of rows) { const v = Number(x.press_limit_usd); if (x.press_limit_usd === null || x.press_limit_usd === undefined || !Number.isFinite(v)) return shareOf(rows); t[String(x.press_id || x.source_key)] = v; } const vs = Object.values(t); return vs.length ? vs.reduce((a, v) => a + v, 0) : null; }; const shareOf = (rows) => (rows.length && rows.every((x) => x.ceiling_usd !== null && x.ceiling_usd !== undefined && Number.isFinite(Number(x.ceiling_usd))) ? rows.reduce((a, x) => a + Number(x.ceiling_usd), 0) : null);
const pctOf = (done, total) => (total > 0 ? Math.floor((done / total) * 100) : null);
const srcWords = (rows) => { const m = rows.filter((x) => String(x.source_key || '').startsWith('gmail:')).length, d = rows.length - m; return [m ? num(m) + (m === 1 ? ' mailbox' : ' mailboxes') : '', d ? num(d) + (d === 1 ? ' drive' : ' drives') : ''].filter(Boolean).join(' and '); };
// WHAT HER LIMIT LEFT UNREAD: one exception line with its count and how it can be put in (decision 1169). SINCE ONE LIMIT IS
// ONE POOL (seat steps-green 2026-11-12, decision 1166, brain file steps-green-1) a source stops only when the WHOLE press has
// used its limit, so the limit named here is hers. SUPERSEDED: "Your press set aside $4.43 of your $339.93 for it", the
// wording of a share per source, which the brain no longer keeps as a stop.
function leftLine(rows, lim) {
  const a = rows.filter((x) => x.state === 'at_ceiling' && Number(x.waiting) > 0);
  if (!a.length) return null;
  const n = a.reduce((s, x) => s + Number(x.waiting), 0);
  const l = p('gr-small gs-quiet', ''); l.id = 'gs-uleft';
  l.append(K(el('b', null, num(n)), 'ln'), ' in ' + srcWords(a) + (n === 1 ? ' was' : ' were') + ' not read: your limit' + (lim !== null ? ' of ' + usd2(lim) : '') + ' was used up first. ', el('b', 'gs-exno', 'Can be put in: '), 'choose ' + (n === 1 ? 'it' : 'them') + ' in the list below and press Understand again with a new limit.');
  return l;
}
// ONE COUNT OF WHAT COULD NOT BE READ, opened to where and why (STANDING-CLAUSES: the count, each with its reason).
const WHY_UNREAD = 'Each was sent to the AI three times and no usable answer came back. They stay searchable, and they are kept with that reason.';
function nameOfSrc(S, key) {
  const u = rowsOf(S.usam).find((x) => x.source_key === key) || (S.src?.rows ?? []).find((x) => x.source_key === key);
  return String(u?.name || (String(key).startsWith('gmail:') ? String(key).slice(6) : 'A drive'));
}
function unreadFold(S, rows, short) {
  const a = rows.filter((x) => Number(x.could_not_read) > 0), n = a.reduce((s, x) => s + Number(x.could_not_read), 0);
  if (!n) return null;
  const d = el('details', 'gs-fold gs-unread'); d.id = 'gs-ucnr'; d.open = cnrOpen; d.addEventListener('toggle', () => { cnrOpen = d.open; });
  const sm = el('summary'), sw = el('span'); if (short) sw.append('See Which'); else sw.append(K(el('b', null, num(n)), 'cn'), ' could not be read ' + DOT + ' see where and why'); sm.appendChild(sw);   /* short: inside its row of What Did Not Go In, which carries the count (decision 1172.3) */ d.appendChild(sm);   /* one box inside the summary, so the space after the number is kept (it read 3could) */
  for (const x of a.slice().sort((q, r) => Number(r.could_not_read) - Number(q.could_not_read))) {
    const r = el('div', 'gs-pl'), nm = nameOfSrc(S, x.source_key), v = el('span', 'gs-tval');
    v.appendChild(el('b', 'gs-pv', num(x.could_not_read)));
    r.append(el('span', null, nm), v);
    d.appendChild(r);
    const why = Array.isArray(x.could_not_read_why) ? x.could_not_read_why : null;   // the brain's own reasons in words, where it gives them
    if (why) {
      for (const w of why) d.appendChild(el('small', 'gs-srcnote', num(w.n) + ': ' + dotted(w.words)));
      const out = el('div', 'gs-each'), b = btn('gr-link', 'See each', async () => {
        b.disabled = true; out.replaceChildren(p('working no-late gr-small', 'Reading the list'));
        const { data, error } = await rpc('understand_unread', { p_source: x.source_key, p_identity: null }).then((v2) => v2, (e) => ({ error: e }));
        if (error || !data || data.ok !== true) { out.replaceChildren(p('gr-small', 'The list could not be read just now: ' + dotted(String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given')))); b.disabled = false; return; }
        out.replaceChildren(...(data.items ?? []).map((it) => { const li = el('div', 'gs-pl'); li.append(el('span', null, String(it.name || 'No name')), el('small', 'gs-srcnote', String(it.words || ''))); return li; }));
        if (Number(data.more) > 0) out.appendChild(el('small', 'gs-srcnote', 'and ' + num(data.more) + ' more'));
        b.remove();
      });
      b.setAttribute('aria-label', 'See each one that could not be read in ' + nm);
      d.append(b, out);
    }
  }
  if (!a.some((x) => Array.isArray(x.could_not_read_why))) d.appendChild(p('gr-small', WHY_UNREAD));
  return d;
}
// STEP 4 AFTER HER PRESS IS DONE TELLS THE PRESS'S STORY FIRST (seat step4-after 2026-11-12; Alex 12:12 PT: "should look like
// searchable, where it gives you a precise percentage number at the beginning and all the progress"). One percentage of
// everything she chose, its meter, the one Working line; then the story in one line: done, how many understood, what it cost
// against her limit, how many could not be read, when she was told. What is still being understood afterwards, and what a
// source's part of the limit left unread, are quiet lines under it. Then one button: Continue to Ready.
/* AFTER DONE THE CHOICES ARE FOLDED (seat setup-polish 2026-11-13, decision 1162, audit fix 3; Alex saw the whole chooser, How fast, Your limit 2.39 and a second big button under Done). One closed line, What you chose; opened, it is the same list and the same How fast as before a press (treeU, speedCard: one copy), so more can be understood from there. SUPERSEDED: the list and How fast drawn open under the Done card. */ function nextFold(S) { const c = el('section', 'am-step gs-next'); c.id = 'gs-unext'; const d = el('details', 'gs-fold'); d.id = 'gs-unextfold'; d.open = nextOpen; d.addEventListener('toggle', () => { nextOpen = d.open; }); const sm = el('summary'), t = el('span'); t.append(el('b', null, 'What You Chose'), ' ' + DOT + ' Change It or Understand More'); sm.appendChild(t); d.append(sm, treeU(S)); const sp = speedCard(S); if (sp) d.appendChild(sp); c.appendChild(d); return c; } /* WHAT IS LEFT ON AN EARLIER STEP, in words, from the brain's own reason (brain_road ready). */ function leftSay(S, k) { const n = Number(S.road?.ready?.to_read) || 0; if (k === 'search') return (n > 0 ? num(n) + (n === 1 ? ' email or file from before you connected is' : ' emails and files from before you connected are') + ' not searchable yet. ' : 'Not everything is searchable yet. ') + 'Your brain is ready when that is done.'; if (k === 'connect') return 'Nothing is connected yet.'; return 'Your database did not answer yet.'; } function afterHero(S, rows, sts) {
  const sum = (k) => rows.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  const total = sum('total'), done = sum('done'), cnr = sum('could_not_read');
  const spent = rows.reduce((a, x) => a + (Number(x.so_far_usd ?? x.spent_usd) || 0), 0), lim = limOf(rows);
  const stopped = rows.some((x) => x.state === 'stopped'), tail = rows.filter((x) => x.state === 'reading');
  /* 100% WHEN ONLY EXCEPTIONS REMAIN (audit fix 4: 99% stood beside Done): nothing waiting and nothing being read, so the percentage is of what could be read, and what could not is counted beside it */ const pct = pctOf(done, sum('waiting') === 0 && !tail.length ? total - cnr : total), drive = rows.some((x) => String(x.source_key || '').startsWith('drive:'));
  const c = el('section', 'am-step gs-hero gs-after'); c.id = 'gs-uhero';
  c.appendChild(el('span', 'am-num', 'Step 4 ' + DOT + ' Understand'));
  const top = el('div', 'gs-herotop'), l = el('div');
  const say = el('p', 'gr-small'); say.append(K(el('span', null, num(done)), 'pd'), ' of ', K(el('span', null, num(total)), 'pt'), drive ? ' of the mail and files you chose are understood' : ' of the mail you chose is understood');
  if (pct === 100) say.replaceChildren(drive ? 'Of the mail and files you chose are understood.' : 'Of the mail you chose is understood.');   /* picture part 3: 100% and Done when only exceptions remain; the count is in the finished line below */
  l.append(K(el('div', 'gs-pct', pct === null ? '' : num(pct) + '%'), 'pct'), say);
  const r = el('div', 'gs-ustate');
  const w = K(el('div', 'gs-work'), 'work'); w.id = 'gs-uwork'; w.dataset.mode = 'after'; w.setAttribute('role', 'status'); workInto(w, S);
  r.append(chip(stopped ? '' : 'ok', stopped ? 'Stopped' : 'Done'), w);   /* what could not be read is a row of What Did Not Go In (notIn4) */
  top.append(l, r);
  const bar = el('div', 'gs-bar gs-thick'), i = K(el('i'), 'bar'); i.style.width = (pct || 0) + '%'; bar.appendChild(i);
  c.append(top, bar);
  c.appendChild(finLine(rows, done, spent, lim, stopped));   /* SUPERSEDED 2026-11-13 (decision 1172.3): Done, N understood, $X spent of your limit, email sent, as one dotted line */
  if (tail.length) {
    const tn = tail.reduce((a, x) => a + (Number(x.waiting) || 0), 0), to = tail.reduce((a, x) => a + (Number(x.out_in_batches) || 0), 0);
    const q = p('gr-small gs-quiet', ''); q.id = 'gs-utail';
    q.append('Still being understood: ', K(el('b', null, num(tn)), 'tn'), ' more in ' + srcWords(tail) + ' (new mail and files, or a second try)', K(el('span', null, to > 0 ? ', ' + num(to) + ' out at the AI company' : ''), 'to'), '. Inside the same limit. ');
    const out = el('span', null, ''), sb = btn('gr-link', 'Stop', () => stopAll(R, pressAll(R).filter((x) => x.state === 'reading').map((x) => x.source_key), out, sb)); sb.id = 'gs-tstop';
    q.append(sb, ' ', out);
    c.appendChild(q);
  }
  // WHAT FAILED ON THE TOOL'S SIDE AND IS BEING READ AGAIN (brain_road ready.being_read_again, brain file steps-green-2): an
  // exception in repair, said in one line; it does not hold Ready back.
  const again = Number(S.road?.ready?.being_read_again) || 0;
  if (again > 0) { const q = p('gr-small gs-quiet', ''); q.id = 'gs-uagain'; q.append(K(el('b', null, num(again)), 'ag'), (again === 1 ? ' is' : ' are') + ' being read again: the first reading failed on the Tool' + String.fromCharCode(8217) + 's side and that is fixed. Inside your limit; there is nothing for you to do.'); c.appendChild(q); }
  const exp = sum('expired');
  if (exp > 0) c.appendChild(p('gr-small gs-quiet', num(exp) + ' were not read by the AI company within 24 hours. They were not billed. Press Understand again to send them.'));
  if (S.uprogErr) c.appendChild(p('gr-small gs-over', NOREAD + ' The count above is the last one seen.'));
  const ni = notIn4(S, rows, lim); if (ni) c.appendChild(ni);
  /* THE BUTTON SAYS WHERE IT GOES, AND WAITS FOR STEP 3 WHEN STEP 3 RUNS (seat setup-clean 2026-11-13, decision 1172.3; before it seat setup-polish, audit fix 2). An earlier step with something for her: one line, and the button goes there. Step 3 still working with nothing for her: a line with the mark, and the button waits. Otherwise Continue to Ready. */
  const prev = (sts || []).find((x) => !x.done && ['db', 'connect', 'search'].includes(x.k)), L3 = step3Left(S), r3 = step3Run(S);
  const waits = !!prev && prev.k === 'search' && !(L3 && L3.need.length > 0 && !smallBusy.search) && (!!r3 || smallBusy.search || !!(L3 && L3.busy));
  const g = el('div', 'gr-go'); let go;
  if (waits) {
    const mailK = r3 ? r3.its.filter((x) => x.source_kind === 'gmail').length : 0, what = !r3 || !(r3.left > 0) ? 'your mail and files' : num(r3.left) + ' ' + (mailK === r3.its.length ? (r3.left === 1 ? 'email' : 'emails') : mailK ? 'emails and files' : r3.left === 1 ? 'file' : 'files');
    const rl = runLine(r3 ? (r3.mv[0] || r3.its[0]) : null, 'Step 3 is still making ' + what + ' searchable' + (r3 && r3.mins !== null ? ' ' + DOT + ' ' + leftWords(r3.mins) : '') + '. Ready opens when it is done.', !!r3 && !r3.mv.length); rl.id = 'gs-uwait3'; c.appendChild(rl);
    go = btn('go', 'Continue to Ready ' + DOT + ' After Step 3', () => {}); go.disabled = true; go.id = 'gs-uready';
  } else if (prev) {
    const ol = p('gs-left3', el('b', null, 'One thing left on step ' + prev.n + '.'), ' ' + leftSay(S, prev.k)); ol.id = 'gs-uleft3'; c.appendChild(ol);
    go = btn('go', 'Open Step ' + prev.n + ' ' + DOT + ' ' + prev.name, () => { at = prev.k; autoAt = false; draw(); window.scrollTo({ top: 0 }); }); go.id = 'gs-uback';
  } else { go = btn('go', 'Continue to Ready', () => { at = 'ready'; draw(); window.scrollTo({ top: 0 }); }); go.id = 'gs-uready'; }
  g.appendChild(go); c.appendChild(g);
  const M = monthlyOf(S); c.appendChild(K(el('small', 'gs-srcnote', M === null ? 'New mail is understood as it arrives. Its monthly cost is in Settings once it is measured.' : 'New mail is understood as it arrives, about ' + usd2(M) + ' a month, shown in Settings.'), 'mo'));
  return c;
}
// ---------------------------------------------------------------------------------------------------------------------
// SETUP, CLEANED UP (seat setup-clean 2026-11-13; decisions 1171 and 1172; picture HsJKa9JnsgmDza5dtX3gUH, Alex 18:55 PT: "Yes, that
// looks right. I like this a lot."). The parts this seat added, all SHOW:
// ONE NUMBER, EVERYWHERE (1172.5): mailCount (the emails in her mailboxes, the plan's own count with what it counts, used by step 3
// and step 5) and dbCost (the database's monthly figure, used by step 1 and step 5). MOVING MEANS WORKING (1172.2): stepRun, runMarks
// and runLine put the one mark of fill/working.js beside a step and beside a line, from the one reading (window.toolWork); never a
// second reading, never motion without it. STEP 4, DONE (1172.3): finLine, notIn4 and the button that waits for step 3.
// SMALL COSTS GO THROUGH ON THEIR OWN (1171): smallSearch and smallUnderstand, see there.
const CHECK = String.fromCharCode(10003);
const cap = (t) => { const s = String(t || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
const usdT = (n) => { const x = Number(n); return Number.isFinite(x) && Math.abs(x - Math.round(x)) < 0.005 ? '$' + Math.round(x).toLocaleString('en-US') : usd2(x); };   // a limit as she typed it: $340, not $340.00
const whenWords = (t) => { const d = new Date(t), same = d.toDateString() === new Date().toDateString(); return d.toLocaleString('en-US', same ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };
const winWords = (m) => (m === null || m === undefined ? '' : Number(m) % 12 === 0 ? ' in the last ' + (Number(m) === 12 ? 'year' : num(Number(m) / 12) + ' years') : ' in the last ' + num(m) + ' months');
// THE EMAILS IN HER MAILBOXES: one count from one reading, with what it counts (the plan's own count for the months chosen: what her
// mail provider says is there). SUPERSEDED on step 5: every email the brain keeps, whatever its date (136,778 beside step 3's 65,154).
function mailCount(S) {
  const P = S.splan && S.splan.ok === true ? S.splan : null; if (!P) return null;
  const rows = planRows(P).filter((r) => r.kind === 'mail' && r.state !== 'not_counted'); if (!rows.length) return null;
  return { n: rows.reduce((a, q) => a + (Number(q.emails) || 0), 0), words: winWords(P.months) };
}
// THE DATABASE'S MONTHLY FIGURE: the AI tab's own estimate where it is read, else the published price. One figure on every step.
function dbCost(S) { const db = S.ai?.cost?.database; return db?.known && Number.isFinite(Number(db.estimate_usd)) ? { say: 'about ' + usd(db.estimate_usd), known: true, plan: String(db.plan || '') } : { say: 'about $25', known: false, plan: '' }; }
// WHAT RUNS ON A STEP, from the one indicator's reading: step 3 what is being made searchable, step 4 what is being understood.
const stepRun = (k) => { const W = window.toolWork, kinds = k === 'search' ? STEP_WORK['gs-work'] : k === 'understand' ? STEP_WORK['gs-uwork'] : null; return W && Array.isArray(W.items) && kinds ? W.items.filter((it) => kinds.includes(it.kind)) : []; };
function runMarks() {
  for (const b of document.querySelectorAll('#gr-steps .gr-st')) {
    const its = stepRun(b.dataset.step), old = b.querySelector('.gs-run'); if (old) old.remove();
    if (!its.length) continue;
    const mv = its.filter((x) => x.state !== 'stalled'), r = el('span', 'gs-run'), mk = window.toolWorkParts && window.toolWorkParts.mark ? window.toolWorkParts.mark(mv[0] || its[0]) : null;
    if (mk) r.appendChild(mk);
    r.appendChild(el('span', null, mv.length ? num(mv.length) + ' running' : num(its.length) + ' not moving'));
    (b.querySelector('b') || b).appendChild(r);   // under the step's name
  }
}
function runLine(it, text, still) {
  const d = el('p', 'gs-runline' + (still ? ' gs-still' : '')); d.setAttribute('role', 'status');
  const mk = it && window.toolWorkParts && window.toolWorkParts.mark ? window.toolWorkParts.mark(it) : null;
  if (mk) d.appendChild(mk);
  d.appendChild(el('span', null, text));
  return d;
}
// step 3's running work in one count and one time left: the same items the header's list shows
function step3Run(S) {
  const its = stepRun('search').filter((x) => x.kind === 'searchable'); if (!its.length) return null;
  const mv = its.filter((x) => x.state !== 'stalled'), left = its.reduce((a, x) => a + (Number(x.waiting) || 0), 0);
  const mins = mv.length && mv.every((x) => x.minutes_left !== null && x.minutes_left !== undefined) ? Math.max(...mv.map((x) => Number(x.minutes_left) || 0)) : null;
  return { its, mv, left, mins };
}
// SMALL COSTS GO THROUGH ON THEIR OWN (decision 1171; Alex 18:47 PT on 216 files at $0.16 holding up Ready for a day: "That seems like
// a waste of time for 16 cents to hold up everything"). During setup, what is left on a step, costs under the brain's small amount
// (search_plan 'small': under_usd and, for step 3, ok) and is covered by her credit is started without asking, and the step says
// afterwards what was done and what it cost. THE AMOUNT AND THE VERDICT ARE THE BRAIN'S; the press is the same door as her own
// (lens-ask search_go / understand_go, as the signed-in owner, with their refusals: never past her credit, 1148). What went through
// is kept by the brain (getting_ready_mark small_search / small_understand, which refuses a figure that is not under the amount).
// Only after she has agreed to the terms, only what is left over. SINCE 2026-11-14 (seat ready-alive, decision 1173) THE BRAIN DOES THIS ON
// ITS OWN SCHEDULE, page open or not (small_cost_tick); this page only says what was done, from the marks. SUPERSEDED: the stated
// boundary that it happened only while the owner had this page open.
const SMALL_DAYS = 3;   // how long a step keeps saying what went through on its own
const smallBusy = { search: false, understand: false }, smallTried = { search: false, understand: false }, smallWhy = { search: '', understand: '' };
const smallUnder = (S) => { const u = Number(S.splan?.small?.under_usd); return S.splan && S.splan.ok === true && Number.isFinite(u) && u > 0 ? u : null; };
const smallMark = (S, k) => { const m = mark(S, k), v = m?.value; if (!v || typeof v !== 'object') return null; const t = Date.parse(v.at || m.at); return Number.isFinite(t) && Date.now() - t < SMALL_DAYS * 86400000 ? v : null; };
const smallIds = (S) => { const v = mark(S, 'small_understand')?.value; return new Set(Array.isArray(v?.presses) ? v.presses.map(String) : []); };
// HER OWN PRESS AND WHAT WENT THROUGH ON ITS OWN ARE TOLD APART by the press id the brain sends with each source: the top card's
// figures (understood, spent, her limit) are her press's; the small ones are one line under What Did Not Go In.
const mainAll = (S) => { const ids = smallIds(S); return ids.size ? pressAll(S).filter((x) => !ids.has(String(x.press_id || ''))) : pressAll(S); };
const smallAll = (S) => { const ids = smallIds(S); return ids.size ? pressAll(S).filter((x) => ids.has(String(x.press_id || ''))) : []; };
const workRefresh = () => { try { document.dispatchEvent(new CustomEvent('tool:work-refresh')); } catch (_) { /* the indicator reads again on its own */ } };
// smallSearch and smallUnderstand (this page starting the small leftovers itself, with its own preview and press) were REMOVED by seat
// ready-alive 2026-11-14: the brain starts them on its own schedule (small_cost_tick), so there is one implementation. smallBusy and
// smallWhy stay as the two never-set flags the cards still read; a later seat may take them out with their branches.
// STEP 4, DONE: THE FINISHED LINE (picture part 3): how many understood, what it cost of the limit as she typed it, when it finished
// (the brain's press_done_at: when the last thing her press asked for was read; never the time of the email).
function finLine(rows, done, spent, lim, stopped) {
  const st = el('p', 'gs-fin'); st.id = 'gs-ustory';
  const drive = rows.some((x) => String(x.source_key || '').startsWith('drive:'));
  if (stopped) st.append(el('b', null, 'Stopped.'), ' ');
  st.append(K(el('b', null, num(done)), 'sd'), drive ? ' emails and files understood' : ' emails understood', ' ' + DOT + ' ', K(el('b', null, usd2(spent)), 'ss'));
  if (lim !== null) st.append(' of your ', K(el('b', null, usdT(lim)), 'sl'), ' limit'); else st.append(' spent');
  const left = rows.some((x) => Number(x.press_left) > 0), ts = rows.map((x) => Date.parse(x.press_done_at)).filter(Number.isFinite);
  if (!stopped && !left && ts.length) st.append(' ' + DOT + ' finished ', K(el('span', null, whenWords(Math.max(...ts))), 'sf'));
  st.append('.');
  return st;
}
function exRow(tone, mark0, ...parts) { const r = el('div', 'gs-exrow'), t = el('div'); t.append(...parts); r.append(K(chip(tone, mark0), 'xn'), t); return r; }
// WHAT DID NOT GO IN (picture part 3; decision 1169: each exception in one line with its count and its reason or its way in).
function notIn4(S, rows, lim) {
  const out = [], sum = (k) => rows.reduce((a, x) => a + (Number(x[k]) || 0), 0), cnr = sum('could_not_read');
  if (cnr > 0) { const uf = unreadFold(S, rows, true); out.push(exRow('', num(cnr), el('b', null, 'Could not be read.'), ' ', el('b', 'gs-exno', 'Cannot be put in: '), 'the AI gave no usable answer after three tries. ' + (cnr === 1 ? 'It stays' : 'They stay') + ' searchable. ', ...(uf ? [uf] : []))); }
  const lf = rows.filter((x) => x.state === 'at_ceiling' && Number(x.waiting) > 0), ln = lf.reduce((a, x) => a + Number(x.waiting), 0);
  if (ln > 0) out.push(exRow('', num(ln), el('b', null, 'Not read: your limit' + (lim !== null ? ' of ' + usdT(lim) : '') + ' was used up first.'), ' ', el('b', 'gs-exno', 'Can be put in: '), 'open What You Chose below and start again with a new limit.'));
  const U = S.usam, only = U && U.ok === true ? rowsOf(U).filter((r) => pickOf(r) === 'findable' && leftOf(r) > 0) : [];
  if (only.length) {
    const nm = names(S, only.map((r) => ({ key: r.source_key, label: r.name, kind: r.kind === 'mailbox' ? 'mail' : 'drive' }))), mul = doorMul(S), box = only.every((r) => r.kind === 'mailbox');
    const priced = U.state === 'done' && only.every((r) => r.usd !== null && r.usd !== undefined && Number.isFinite(Number(r.usd))), cost = priced ? only.reduce((a, r) => a + Number(r.usd), 0) * mul : null;
    const open = only.length === 1 && only[0].part !== undefined ? () => partSheet(only[0].source_key) : () => { nextOpen = true; draw(); C.$('#gs-unext')?.scrollIntoView({ block: 'start' }); };
    const who = el('span', null, only.length <= 3 ? only.map((r) => nm[r.source_key]).join(', ') : only.slice(0, 2).map((r) => nm[r.source_key]).join(', ') + ' and ' + num(only.length - 2) + ' more'); who.setAttribute('translate', 'no');
    out.push(exRow('', num(only.length), el('b', null, (only.length === 1 ? (box ? 'Mailbox' : 'Drive') : box ? 'Mailboxes' : 'Mailboxes and drives') + ' kept searchable only: '), who, '. ' + (only.length === 1 ? 'It stays' : 'They stay') + ' searchable. ',
      btn('gr-link', only.length === 1 ? 'Understand It, or Only Part of It' : 'Understand Them, or Only Part', open), cost !== null ? ' ' + DOT + ' about ' + usd2(cost) + (doorOf(S) === 'overnight' ? ' overnight' : '') : ''));
  }
  const sm = smallAll(S), under = smallUnder(S), why = under !== null ? ' (under ' + usdT(under) + ', so no need to ask)' : '';
  if (smallBusy.understand) out.push(exRow('warn', String.fromCharCode(8230), 'What was made searchable after you pressed is being understood on its own' + why + '.'));
  else if (sm.length) {
    const reading = sm.some((x) => x.state === 'reading'), cost = sm.reduce((a, x) => a + (Number(x.so_far_usd ?? x.spent_usd) || 0), 0), n = sm.length;
    out.push(exRow(reading ? 'warn' : 'ok', reading ? String.fromCharCode(8230) : CHECK, el('b', null, num(n) + ' more, made searchable after you pressed, ' + (reading ? (n === 1 ? 'is' : 'are') + ' being understood on ' + (n === 1 ? 'its' : 'their') + ' own' : (n === 1 ? 'was' : 'were') + ' understood on ' + (n === 1 ? 'its' : 'their') + ' own')), ' ' + DOT + ' ' + usd2(cost) + (reading ? ' so far' : '') + why + '.'));
  }
  if (smallWhy.understand) out.push(exRow('', '!', 'What was made searchable after you pressed was not started on its own: ' + dotted(smallWhy.understand) + ' You can start it under What You Chose below.'));
  if (!out.length) return null;
  const w = el('div', 'gs-notin'); w.id = 'gs-unotin';
  const list = el('div', 'gs-exrows'); list.append(...out);
  w.append(el('h3', 'gs-h3', 'What Did Not Go In'), list);
  return w;
}
// STEP 4 WHILE HER PRESS RUNS: THE TOP CARD IS THE PROGRESS (seat step4-pressed 2026-11-12, decision 1162.1). In large type: done
// of total; what is out at the AI company and what waits; the time; what is spent against her limit; Stop. Every number is the
// brain's (understand_progress); the sign that it is alive is the one shared piece (workInto, mode pulse). What could not be
// read is counted beside it (STANDING-CLAUSES). SUPERSEDED: a percentage card with a small amber line, and under it a second
// card (understandLive) carrying the same press.
function pressHero(S, rows) {
  const sum = (k) => rows.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  const total = sum('total'), done = sum('done'), cnr = sum('could_not_read');
  const spent = rows.reduce((a, x) => a + (Number(x.so_far_usd ?? x.spent_usd) || 0), 0);
  const lim = limOf(rows), run = rows.filter((x) => x.state === 'reading');   // rows: everything pressed; run: what is being read now
  const drive = rows.some((x) => String(x.source_key || '').startsWith('drive:')), pct = pctOf(done, total);
  const c = el('section', 'am-step gs-hero gs-press'); c.id = 'gs-uhero';
  c.appendChild(el('span', 'am-num', 'Step 4 ' + DOT + ' Understand'));
  // ONE PERCENTAGE OF EVERYTHING SHE CHOSE, FIRST, AS STEP 3 HAS IT (Alex 2026-11-12 12:12 PT). SUPERSEDED: done of total in
  // large type with no percentage (seat step4-pressed).
  const top = el('div', 'gs-herotop'), l = el('div'), say = el('p', 'gr-small');
  say.append(K(el('span', null, num(done)), 'pd'), ' of ', K(el('span', null, num(total)), 'pt'), drive ? ' of the mail and files you chose are understood' : ' of the mail you chose is understood');
  l.append(K(el('div', 'gs-pct', pct === null ? '' : num(pct) + '%'), 'pct'), say);
  const r = el('div', 'gs-ustate');
  const w = K(el('div', 'gs-work'), 'work'); w.id = 'gs-uwork'; w.dataset.mode = 'pulse'; w.setAttribute('role', 'status'); workInto(w, S);
  r.append(chip('warn', 'Understanding'), w);
  top.append(l, r);
  const bar = el('div', 'gs-bar gs-thick'), i = K(el('i'), 'bar'); i.style.width = (total ? Math.min(100, Math.round((done / total) * 100)) : 0) + '%'; bar.appendChild(i);
  c.append(top, bar);
  // minutes left only when every source read as fast as possible has its pace measured; on track only when every one has a
  // measured total (understand_progress pace_measured, on_track_usd); otherwise said plainly. Overnight results come back a
  // whole part at a time, so no minute count is given for it, and that is said (seat overnight-batch).
  const night = run.filter((x) => x.door === 'overnight'), fastRows = run.filter((x) => x.door !== 'overnight');
  const mins = fastRows.length && fastRows.every((x) => x.pace_measured === true && x.minutes_left !== null && x.minutes_left !== undefined) ? Math.max(...fastRows.map((x) => Number(x.minutes_left) || 0)) : null;
  const outN = night.reduce((a, x) => a + (Number(x.out_in_batches) || 0), 0), waitN = Math.max(0, night.reduce((a, x) => a + (Number(x.waiting) || 0), 0) - outN);
  const trackOf = (x) => (x.on_track_usd !== null && x.on_track_usd !== undefined && Number.isFinite(Number(x.on_track_usd)) ? Number(x.on_track_usd) : x.state === 'reading' ? null : Number(x.so_far_usd ?? x.spent_usd) || 0);   // a source that is done is on track for what it cost
  const track = rows.every((x) => trackOf(x) !== null) ? rows.reduce((a, x) => a + trackOf(x), 0) : null;
  const cell = (k, label, val, sub) => { const d = el('div', 'gs-pf'); d.append(el('small', null, label), K(el('b', null, cap(val)), k), K(el('small', 'gs-pfs', cap(sub || '')), k + 's')); return d; };
  const facts = el('div', 'gs-pfacts');
  if (night.length) facts.appendChild(cell('o', night.length === run.length ? 'Out at the AI Company Now' : 'Overnight, Out at the AI Company Now', num(outN), num(waitN) + ' waiting to be sent'));
  facts.appendChild(cell('t', 'Time Left',
    !fastRows.length ? 'Overnight' : mins === null ? 'measuring the pace' : 'about ' + num(mins) + ' minutes',
    night.length ? (fastRows.length ? 'for what is read as fast as possible; overnight parts come back ' : 'each part comes back ') + 'usually within a few hours of being sent, at the latest in 24 hours' : ''));
  facts.appendChild(cell('s', 'Spent So Far', usd2(spent), lim !== null ? 'of your limit ' + usd2(lim) + ', never passed' : 'your limit could not be read'));
  facts.appendChild(cell('k', 'Expected Total', track !== null ? usd2(track) : 'measuring', track !== null ? '' : 'a total is given once enough is read'));
  c.appendChild(facts);
  const uf = unreadFold(S, rows); if (uf) c.appendChild(uf);
  if (S.uprogErr) c.appendChild(p('gr-small gs-over', NOREAD + ' It keeps going. The count above is the last one seen.'));
  const ll = leftLine(rows, lim); if (ll) c.appendChild(ll);   // SUPERSEDED: "It stopped before your limit" beside "Stopped at your limit" (one source's part, said as hers)
  const exp = (S.uprog ?? []).reduce((a, x) => a + (Number(x.expired) || 0), 0);
  if (exp > 0) c.appendChild(p('gr-small gs-over', num(exp) + ' were not read by the AI company within 24 hours. They were not billed. Press Understand again to send them.'));
  const out = p('gr-small', ''); out.id = 'gs-pout';
  const stop = btn('go ghost', 'Stop', () => stopAll(R, pressRows(R).map((x) => x.source_key), out, stop)); stop.id = 'gs-pstop';
  const g = el('div', 'gr-go'); g.appendChild(stop); c.append(g, out);
  return c;
}
// HOW FAST AND THE BUTTON, WHILE HER PRESS RUNS, ARE ONE LINE (decision 1162.4): what is running, up to what, and that she is told.
function nowLine(all) {
  const rows = all.filter((x) => x.state === 'reading'), night = rows.filter((x) => x.door === 'overnight').length;
  const lim = limOf(all);
  const c = el('section', 'am-step gs-nowline'); c.id = 'gs-unow';
  const line = el('p', 'gs-nowsay');
  line.append(el('b', null, night === rows.length ? 'Understanding Overnight' : night === 0 ? 'Understanding as Fast as Possible' : 'Understanding, Part of It Overnight'));
  if (lim !== null) line.append(' ' + DOT + ' ', el('span', null, 'up to'), ' ', K(el('b', null, usd2(lim)), 'lim'));
  line.append(' ' + DOT + ' ', el('span', null, 'you get an email when it is done'));
  c.append(line, p('gr-small', 'It keeps going while you work or close this page. Stop works any time and you pay only for what was read. How fast and your limit open again when it is done.'));
  return c;
}
// ---------------------------------------------------------------------------------------------------------------------
// STEP 4, WIRED (seat setup-wire over seat understand-step's brain side). All owner only: the brain refuses anyone else.
const GROUP_TITLE = { people: 'Your conversations', money: 'Mail about money', automated: 'Automated mail', rest: 'Everything else' };
const WORK_WITH = [['businesses', 'Businesses'], ['people', 'People'], ['both', 'Both']];
const SAMPLE_CAP = 5;   // the sample's own limit, never passed (understand_sample p_cap_usd, the brain's own default). SUPERSEDED 2026-11-12 (seat setup-findable-table on seat understand-files' report): 3 and the words "about $2"; the sample now reads attached files too and costs more, so the honest words are its limit
let ua = null;          // her answers as she taps them (what each mailbox is for is passed back as kept, no longer asked: seat step4-fresh): { mailboxes: {key: for}, work_with, money_words: [] }
// WHAT IS READ INSIDE A MAILBOX: her conversations and money mail; automated mail and the rest stay searchable (decision 1158: no
// longer a choice of four boxes; the brain's sample, price and press are asked for these two groups).
function chosenGroups() { return ['money', 'people']; }
const dotted = (t) => { const x = String(t || '').trim(); return x.endsWith('.') ? x : x + '.'; };
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
async function readSample(S) { S.usam = await sampleAsk(S, false); try { window.toolParts = rowsOf(S.usam).some((x) => x.part !== undefined); } catch (_) { /* Vera then leaves the words to the box */ } }   // toolParts: this brain keeps parts (fill/vera.js opens the sheet only then)
// While the sample or a press reads, step 4 refreshes every 20 seconds (only while it is shown and nothing is typed or open).
let uT = null;
function uPoll() {
  clearTimeout(uT);
  const S = R;
  if (!S || at !== 'understand') return;
  // a refused answer is asked again too (it used to say "It tries again on its own" and did not: seat step4-fresh)
  const busy = S.usam?.state === 'reading' || (S.uprog ?? []).some((x) => x.state === 'reading' && pressedRow(x)) || (!!S.usam && S.usam.ok !== true && S.usam.reason !== 'owner_only' && S.usam.reason !== 'unbound');
  if (!busy) return;
  uT = setTimeout(async () => {
    if (C.$('#s-ready')?.hidden || at !== 'understand' || C.$('#gr-sheet') || typing()) { uPoll(); return; }
    if (R.usam?.ok !== true) await readDoor(R);
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
// ---------------------------------------------------------------------------------------------------------------------
// STEP 4, THE FRESH LOOK (seat step4-fresh, 2026-11-12, decision 1158; picture RYtvsKoVGVx2ELoeqN5PNx). The same shape as step 3:
// 1. heroU: one percentage (understood of what she chose; the brain's own rows, understand_sample 'rows'), one status word, the
//    one Working indicator's lines (workInto), what Understood means and what Searchable only means.
// 2. treeU, "What to understand": step 3's three folding groups (grp, driveParts, names: one tree, not a second). Each mailbox
//    and drive: its name, what is left to read, ONE choice (Understand / Keep searchable only, kept by understand_choice_set) and
//    its price at the speed she chose; a row kept searchable only costs $0.00 and says small what it would be (1159.2). Your systems: already understood, free. The rows come from the one reading of sources,
//    so the list is there even when the prices could not be read, and then the reason is said in its place.
//    Folded under them, insideFold: what is read inside a mailbox, her words for money paperwork and who she works with
//    (understand_answers_set, unchanged: what each mailbox is for is no longer asked, the kept answers are passed back as kept).
// 3. speedCard, "How fast": two cards, Overnight shown first until she has chosen (understand_door 'chosen'), one price with
//    its range, one limit, her credit with add by card, ONE button. The press keeps the speed shown (doorKeep), previews
//    (understand_go without confirm), then her Yes.
// THE SAMPLE (1158: part of the press). A brain that already holds a sample (HireKraft) goes straight to the press. Where
// there is none yet, the one button starts the sample and says so; carrying her limit across the sample so that she is not
// asked a second time is the brain's to do and is NOT BUILT (named in the seat's report), so the words do not promise it.
// A re-read lands in place (draw, inPlace): every figure that can change is marked (K).
// WHILE HER PRESS RUNS THE STEP HAS ANOTHER SHAPE (seat step4-pressed 2026-11-12, decision 1162): pressHero (the progress as the
// top card), treeU read-only ("What you chose"), nowLine (How fast and the button as one line). heroU, treeU and speedCard as
// described above are the step before a press and after it.
// SUPERSEDED 2026-11-12, Alex's yes on 1158: the per-mailbox purpose buttons (MAILBOX_FOR), the four group check boxes with
// mail_groups' estimate (groupsCard, readGroups, uOff), the Cost and Time card (understandShape), "Three quick questions" as
// a card, the separate How fast rows (doorChoice), "Read a sample of those drives too" (sampleAgain: a second sample button
// that could fail alone; drives not in the sample are priced at the rate of her other files and that is said), and on this
// step the cards How your price works, The AI that does the work and Questions (now in Settings and the guide).
// A CHOICE IS A VERB, NOT A STATE (seat step4-words 2026-11-12, decision 1159.1, Alex: "shouldn't you say understand instead of
// understood? It seems to me that's already done"): the two buttons read Understand and Keep searchable only. "Understood" is
// said only of what is done (the top card's word, a row with nothing left, the live card). SUPERSEDED: Understood / Searchable
// only as the button words (seat step4-fresh).
const CHOICES = [['understood', 'Understand'], ['findable', 'Keep Searchable Only']];
let uPick = {};         // her taps not yet answered by the brain: { source_key: 'understood' | 'findable' }
let nextOpen = false, uLimit = null, uDoor = null, inOpen = false, howOpen = false, choseOpen = false, uGap = null, cnrOpen = false;
const LQ = String.fromCharCode(8220), RQ = String.fromCharCode(8221);
const howLong = (m) => { const x = Number(m); if (m === null || m === undefined || !Number.isFinite(x)) return 'time not measured'; if (x < 1) return 'under a minute'; if (x < 90) return 'about ' + num(Math.round(x)) + ' minutes'; if (x < 48 * 60) return 'about ' + num(Math.round(x / 60)) + ' hours'; return 'about ' + num(Math.round(x / 1440)) + ' days'; };
const rowsOf = (U) => (Array.isArray(U?.rows) ? U.rows : []);
const pickOf = (r) => uPick[r.source_key] || r.choice;
const picking = () => Object.keys(uPick).length > 0;
const leftOf = (r) => (Number(r.conversations_left) || 0) + (Number(r.files_left) || 0);
const allOf = (r) => (Number(r.conversations) || 0) + (Number(r.files) || 0);
const chosenRows = (U) => rowsOf(U).filter((r) => pickOf(r) === 'understood' && leftOf(r) > 0);
function chosenWords(U) {
  const c = chosenRows(U), m = c.filter((r) => r.kind === 'mailbox').length, dv = c.length - m;
  return [m ? num(m) + (m === 1 ? ' mailbox' : ' mailboxes') : '', dv ? num(dv) + (dv === 1 ? ' drive' : ' drives') : ''].filter(Boolean).join(' and ');
}
// Her tap on a row: kept by the brain, then the price is read again. Reads the row from the page's reading at that moment (R).
async function pick(key, v) {
  const r = rowsOf(R?.usam).find((x) => x.source_key === key);
  if (!r || pickOf(r) === v) return;
  uPick[key] = v; uLimit = null; draw();
  const { data, error } = await rpc('understand_choice_set', { p_choice: { [key]: v }, p_identity: null });
  if (error || !data || data.ok !== true) {
    delete uPick[key];
    toast('Not changed: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given'));
    if (at === 'understand' && !C.$('#gr-sheet')) draw();
    return;
  }
  await readSample(R);
  if (R?.usam?.ok === true && Array.isArray(R.usam.rows)) delete uPick[key];   // the brain's rows now carry it
  if (at === 'understand' && !C.$('#gr-sheet')) draw();
}
// FAST OR OVERNIGHT (seat overnight-batch 2026-11-12; decisions 1152 point 3, 1154 point 4): the factor and its source are the
// brain's (understand_door). OVERNIGHT FIRST (1158): until she has chosen (understand_door 'chosen' false) the page shows
// Overnight; her tap is kept at once (understand_door_set), and the press keeps the speed shown before it asks (doorKeep), so
// what is pressed is what she saw. A brain without the second door has one speed and shows no cards.
const DOORS = [['fast', 'As Fast as Possible'], ['overnight', 'Overnight']];
const OVERNIGHT_WHEN = 'usually within a few hours, at the latest in 24';
let doorBusy = false;
async function readDoor(S) {
  const { data, error } = await rpc('understand_door', { p_identity: null }).then((x) => x, (e) => ({ data: null, error: { message: String(e?.message ?? e) } }));
  S.udoor = !error && data && data.ok === true ? data : null;
}
const doorF = (S) => { const f = Number(S?.udoor?.overnight?.price_factor); return Number.isFinite(f) && f > 0 && f < 1 ? f : null; };
const doorOf = (S) => { if (doorF(S) === null) return 'fast'; if (uDoor) return uDoor; if (S.udoor.chosen === false) return 'overnight'; return S.udoor.door === 'overnight' ? 'overnight' : 'fast'; };
const doorMul = (S) => (doorOf(S) === 'overnight' ? doorF(S) : 1);
async function doorSet(S, v) {
  const { data, error } = await rpc('understand_door_set', { p_door: v, p_identity: null }).then((x) => x, (e) => ({ data: null, error: { message: String(e?.message ?? e) } }));
  if (error || !data || data.ok !== true) return { ok: false, note: String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') };
  S.udoor = { ...S.udoor, door: data.door, chosen: true };
  return { ok: true };
}
async function doorPick(v) {
  const S = R;
  if (!S || doorBusy || doorOf(S) === v) return;
  doorBusy = true; uDoor = v; uLimit = null; draw();
  const r = await doorSet(S, v);
  doorBusy = false; uDoor = null;
  if (!r.ok) toast('Not changed: ' + r.note);
  if (at === 'understand' && !C.$('#gr-sheet')) draw();
}
// the press takes the speed the brain holds, so the speed shown is kept first when the brain does not hold it yet
async function doorKeep(S) {
  if (doorF(S) === null) return { ok: true };
  if (S.udoor.chosen !== false && S.udoor.door === doorOf(S)) return { ok: true };
  return doorSet(S, doorOf(S));
}
// THE ONE PRICE OF STEP 4 (seat step4-words 2026-11-12, decision 1159.3): what she would pay for what is chosen, at the speed
// chosen. Your price, the header's "This step" (stepPrice) and the sheet of the press all read this, so they cannot differ
// (the header said about $602, the full-speed price of everything, beside about $300.86 overnight). While a tap is being kept
// it is the sum of the chosen rows (wait); otherwise the brain's own figure for her kept choice. usd is absent when not known.
function uPrice(S) {
  const U = S?.usam;
  if (!U || U.ok !== true || U.state !== 'done') return null;
  const mul = doorMul(S);
  if (picking()) { const cr = chosenRows(U); return cr.every((r) => r.usd !== null && r.usd !== undefined) ? { wait: true, usd: cr.reduce((a, r) => a + Number(r.usd), 0) * mul } : { wait: true }; }
  const rem = Number(U.predicted_remaining_usd);
  return Number.isFinite(rem) ? { usd: rem * mul } : {};
}
// THE ANSWER FIRST: understood of what she chose, as the brain counts it (each chosen row's conversations and files, less what
// is left to read). A percentage is shown only when the rows are read; otherwise its place says why.
function uTotals(U) {
  const c = rowsOf(U).filter((r) => pickOf(r) === 'understood');
  const all = c.reduce((a, r) => a + allOf(r), 0), left = c.reduce((a, r) => a + leftOf(r), 0);
  return { all, done: Math.max(0, all - left) };
}
function heroU(S) {
  const c = el('section', 'am-step gs-hero'); c.id = 'gs-uhero';
  c.appendChild(el('span', 'am-num', 'Step 4 ' + DOT + ' Understand'));
  const U = S.usam, ok = !!U && U.ok === true && rowsOf(U).length > 0, T = ok ? uTotals(U) : null;
  const pct = T && T.all > 0 ? Math.floor((T.done / T.all) * 100) : null;
  const live = false;   // while a press runs the top card is pressHero (decision 1162.1)
  const top = el('div', 'gs-herotop'), l = el('div');
  l.append(K(el('div', 'gs-pct', pct === null ? '' : num(pct) + '%'), 'pct'),
    K(el('p', 'gr-small', pct !== null ? 'Of the mail and files you chose are understood.' : !U ? 'Counting what you chose' : ok ? 'Nothing is chosen to be understood yet.' : 'The count could not be read just now, so the percentage is not shown.'), 'pl'));
  const r = el('div', 'gs-ustate');
  const w = K(el('div', 'gs-work'), 'work'); w.id = 'gs-uwork'; w.setAttribute('role', 'status'); workInto(w, S);
  r.append(K(chip(live ? 'warn' : '', live ? 'Understanding' : pct === 100 ? 'Understood' : pct ? 'Started' : 'Not Started'), 'st'), w);
  top.append(l, r);
  const bar = el('div', 'gs-bar gs-thick'), i = K(el('i'), 'bar'); i.style.width = (pct || 0) + '%'; bar.appendChild(i);
  c.append(top, bar,
    p(null, el('b', null, 'Understood'), ' goes one step beyond searchable. Each email and file is read once and its facts are noted: who, how much, when, what was agreed. Then you get exact answers: ' + LQ + 'how much did we bill each client this year' + RQ + ', ' + LQ + 'which agreements end in March' + RQ + '.'),
    p('gr-small', el('b', null, 'Searchable only'), ' stays searchable: you find it by what it is about, but its facts are not noted and no totals come from it. You can make any of it understood later.'));
  return c;
}
// ---- ONLY PART OF A SOURCE (seat understand-part 2026-11-12, decision 1163 REFINED) ----
// The part is the brain's (understand_choice 'part': years, and for a mailbox whether its attached files stay searchable only),
// kept by understand_choice_set beside the choice; the row's price follows it because the brain prices the part. The sheet lists
// that source's own years with what each holds and its measured price (understand_years), checked to choose. While a press runs,
// a source that is not in it can be pressed from the sheet as its own small press (understand_go with that one source: the
// running press keeps its limit). Nothing here works a price out except adding the checked years.
const ELL = String.fromCharCode(8230);
function partWords(part) {
  if (!part || typeof part !== 'object') return '';
  const ys = Array.isArray(part.years) ? part.years.map(Number).filter(Number.isFinite).sort((a, b) => a - b) : [];
  const y = ys.length ? (ys.length > 2 ? ys.slice(0, -1).join(', ') + ' and ' + ys[ys.length - 1] : ys.join(' and ')) + ' only' : '';
  return [y, part.files === 'findable' ? 'attached files searchable only' : ''].filter(Boolean).join(' ' + DOT + ' ');
}
// Vera's way in: step 4, then the sheet once the rows are read (asked every half second, ten seconds at most).
function partOpen(key, years) {
  at = 'understand';
  if (C.$('#s-ready')?.hidden) C.goto('s-ready'); else if (!C.$('#gr-sheet')) draw();
  let n = 0;
  const go = () => { if (rowsOf(R?.usam).some((x) => x.source_key === key)) { partSheet(key, years); return; } if (++n < 20) setTimeout(go, 500); else toast('That mailbox or drive is not on step 4 yet, so its years could not be opened.'); };
  go();
}
async function partSheet(key, preset) {
  const S = R, r = rowsOf(S?.usam).find((x) => x.source_key === key);
  if (!S || !r) return;
  const box = r.kind === 'mailbox', nm = names(S, [{ key, label: r.name, kind: box ? 'mail' : 'drive' }])[key];
  const body = el('div', 'gs-part'); body.id = 'gs-part';
  const wait = p('working no-late gr-small', 'Counting what each year holds, for free');
  const said = p('gr-small', ''); said.id = 'gs-psaid'; said.setAttribute('role', 'status');
  const no = btn('go ghost', 'Not Now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.appendChild(no);
  body.append(wait, acts, said);
  sheet.open('Only part of ' + nm, body);
  const Y = await rpc('understand_years', { p_source: key, p_groups: chosenGroups(S), p_identity: null }).then(({ data, error }) => (error ? { ok: false, note: error.message } : data), (e) => ({ ok: false, note: String(e?.message ?? e) }));
  if (!body.isConnected) return;
  wait.remove();
  if (!Y || Y.ok !== true || !Array.isArray(Y.years)) { const w = p('gr-small gs-over', 'The years could not be read just now: ' + dotted(noteOf(Y))); w.id = 'gs-pwhy'; body.insertBefore(w, acts); return; }
  const mul = doorMul(S), night = doorOf(S) === 'overnight';
  const dated = Y.years.filter((y) => y.year !== null && y.year !== undefined);
  const sel = new Set((Array.isArray(preset) && preset.length ? dated.filter((y) => preset.map(Number).includes(Number(y.year))) : dated.filter((y) => y.chosen !== false)).map((y) => Number(y.year)));
  let files = Y.files_choice === 'findable' ? 'findable' : 'understood', busy = false;
  const withFiles = () => !box || files === 'understood';
  // one year's price at her speed: its conversations, and its files unless she keeps them searchable only; null when not measured
  const yUsd = (y) => { const a = y.usd, f = withFiles() ? y.files_usd : 0; return a === null || a === undefined || f === null || f === undefined ? null : (Number(a) + Number(f)) * mul; };
  const holds = (y) => { const cv = Number(y.conversations_left) || 0, fl = withFiles() ? Number(y.files_left) || 0 : 0;
    return [cv ? num(cv) + (cv === 1 ? ' conversation' : ' conversations') : '', fl ? num(fl) + (box ? (fl === 1 ? ' attached file' : ' attached files') : (fl === 1 ? ' file' : ' files')) : ''].filter(Boolean).join(' ' + DOT + ' ') || 'nothing left to read'; };
  const list = el('div', 'gs-years'); list.id = 'gs-years'; list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Years');
  const fileLine = el('div', 'gs-pl gs-pfiles'); fileLine.id = 'gs-pfiles';
  const total = priceRow(night ? 'This part, overnight' : 'This part', '', ''); total.id = 'gs-ptotal';
  const keep = btn('go', 'Keep', () => doKeep(true)); keep.id = 'gs-pkeep';
  const now = Y.press_running === true && Y.running !== true ? btn('go', 'Understand this part now', () => doNow()) : null; if (now) { now.id = 'gs-pnow'; keep.className = 'gr-link gs-pkeep'; }   // not a second ghost button: the scrim presses the first one, which must stay Not now
  const all = () => dated.length > 0 && dated.every((y) => sel.has(Number(y.year)));
  const words = () => (all() && withFiles() ? 'everything' : partWords({ years: all() ? [] : [...sel], files: withFiles() ? null : 'findable' }));
  const paintS = () => {
    list.replaceChildren(...Y.years.map((y) => {
      const d = y.year !== null && y.year !== undefined, lab = el('label', 'gs-yr'), cb = el('input'), u = yUsd(y), tx = el('span', 'gs-yrl');
      cb.type = 'checkbox'; cb.checked = d ? sel.has(Number(y.year)) : all(); cb.disabled = !d || busy; if (d) cb.dataset.year = String(y.year);
      cb.addEventListener('change', () => { if (cb.checked) sel.add(Number(y.year)); else sel.delete(Number(y.year)); paintS(); });
      tx.append(el('b', null, d ? String(y.year) : 'No date'), el('small', null, holds(y) + (d ? '' : ' ' + DOT + ' only with every year')));
      lab.append(cb, tx, el('b', 'gs-pv', u === null ? 'not measured' : usd2(u)));
      return lab;
    }));
    if (box) { const l = el('span'); l.append(el('b', null, 'Attached files of these years'), el('small', null, files === 'understood' ? 'read and understood with their email' : 'stay searchable only: you find them, their facts are not noted'));
      fileLine.replaceChildren(l, seg(CHOICES, files, (v) => { if (busy) return; files = v; paintS(); }, 'Attached files of these years')); }
    const pick = Y.years.filter((y) => (y.year === null || y.year === undefined ? all() : sel.has(Number(y.year)))), us = pick.map(yUsd);
    total.querySelector('.gs-pv').textContent = !pick.length ? usd2(0) : us.some((x) => x === null) ? 'not measured' : usd2(us.reduce((a, x) => a + x, 0));
    total.querySelector('small')?.remove(); if (pick.length) total.firstChild.appendChild(el('small', null, words()));
    keep.textContent = now ? 'Keep for my next press' : 'Keep ' + DOT + ' ' + (sel.size ? words() : 'choose a year');
    keep.disabled = busy || sel.size === 0; if (now) now.disabled = busy || sel.size === 0;
  };
  // kept by the brain beside the choice; every year checked with its files is the whole source again (no part)
  const doKeep = async (close) => {
    busy = true; paintS(); said.className = 'working no-late gr-small'; said.textContent = 'Keeping your choice';
    const v = { choice: 'understood', years: all() ? [] : [...sel].sort((a, b) => a - b) }; if (box) v.files = files;
    const { data, error } = await rpc('understand_choice_set', { p_choice: { [key]: v }, p_identity: null });
    if (error || !data || data.ok !== true) { busy = false; paintS(); said.className = 'gr-small'; said.textContent = 'Not kept: ' + dotted(String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given')); return false; }
    uLimit = null; await readSample(R);
    if (close) { sheet.close(); toast('Kept: ' + nm + ', ' + words() + '. Nothing is read until you press.'); if (at === 'understand') draw(); }
    return true;
  };
  // ITS OWN SMALL PRESS beside the press that runs: the brain's own limit for this row (its measured price plus room for its
  // longest item) at her speed, checked against her credit by the Tool's server, asked once more before anything is read.
  const doNow = async () => {
    if (!(await doKeep(false))) return;
    const r2 = rowsOf(R?.usam).find((x) => x.source_key === key), lim = Number(r2?.limit_usd);
    if (!r2 || !Number.isFinite(lim) || !(lim > 0)) { busy = false; paintS(); said.className = 'gr-small'; said.textContent = leftOf(r2 || {}) === 0 ? 'Nothing is left to read in this part.' : 'This part has no measured price yet, so it cannot be pressed on its own. It is kept for your next press.'; return; }
    const L = Math.ceil(Number((lim * mul * 100).toFixed(6))) / 100, q = { groups: chosenGroups(S), months: 24, limit: L, sources: [key] };
    said.textContent = 'Checking your limit against your credit';
    const dk = await doorKeep(S);
    const pv = dk.ok ? await C.askBody({ understand_go: { ...q, confirm: false } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) })) : { ok: false, note: 'your choice of speed could not be kept (' + dk.note + ')' };
    if (!body.isConnected) return;
    if (!pv || pv.ok !== true) { busy = false; paintS(); said.className = 'gr-small'; said.textContent = 'Not started: ' + dotted(noteOf(pv)) + ' Your choice is kept.'; return; }
    said.className = 'gr-small'; said.textContent = '';
    const lr = priceRow('Your limit for this part, never passed', usd2(L), 'its measured price plus room for its longest ' + (box ? 'conversation or file' : 'file')); lr.id = 'gs-plimit';
    const yes = btn('go', 'Yes, understand ' + words() + ' ' + DOT + ' up to ' + usd2(L), async () => {
      yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting';
      const g = await C.askBody({ understand_go: { ...q, confirm: true } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
      if (!g || g.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + dotted(noteOf(g)); yes.disabled = false; no.disabled = false; return; }
      sheet.close(); toast('Started: ' + nm + ', ' + words() + ', is being understood. It stops before ' + usd2(L) + '. You get one short email when it is done.');
      try { document.dispatchEvent(new CustomEvent('tool:work-refresh')); } catch (_) { /* the indicator reads again on its own */ }
      uPick = {}; uLimit = null; mount(C);
    }); yes.id = 'gs-pyes';
    keep.remove(); now.remove();
    body.insertBefore(lr, acts);
    body.insertBefore(p('gr-small', 'It runs beside the press that is running, which keeps its own limit. ' + (night ? 'Overnight: ' + OVERNIGHT_WHEN + '. ' : '') + 'Stop works any time; you pay only for what was read.'), acts);
    acts.insertBefore(yes, no); yes.focus();
  };
  const foot = p('gr-small', (Y.measured && Y.measured.mail === false ? 'No price yet: your sample has not been read. ' : 'Each price is for what is not read yet, at the rate measured on your own sample' + (night ? ', overnight' : '') + '. ')
    + (box ? 'A conversation counts in the year of its newest email; an attached file in the year of its email.' : 'A file counts in the year of its own date.') + (Y.running === true ? ' This one is being understood now, so a change here counts from your next press.' : ''));
  body.insertBefore(list, acts); if (box) body.insertBefore(fileLine, acts); body.insertBefore(total, acts); body.insertBefore(foot, acts);
  acts.insertBefore(keep, no); if (now) acts.insertBefore(now, keep);
  paintS();
  (now || keep).focus();
}
// A ROW'S STANDING: from the brain's count of what was pressed for it (understand_progress) where there is one, else from the
// row's own counts (understand_sample). One status word: Understood, Being understood, Could not read N, Searchable only.
function rowStand(r) {
  const g = pressAll(R).find((x) => x.source_key === r.source_key && Number(x.total) > 0) || null;
  if (g) return { g, all: Number(g.total), done: Number(g.done) || 0, cnr: Number(g.could_not_read) || 0, wait: Number(g.waiting) || 0, reading: g.state === 'reading' };
  const all = allOf(r);
  return { g: null, all, done: Math.max(0, all - leftOf(r)), cnr: 0, wait: 0, reading: false };
}
function standChip(T, on) {
  if (T.reading) return chip('warn', 'Being Understood');
  if (T.all > 0 && T.done >= T.all) return chip('ok', 'Understood');
  if (T.g && T.wait === 0) return chip('ok', 'Understood');   /* SUPERSEDED 2026-11-13: the chip Could not read N, which gave no why; the count is in the row's line and opened with its reasons in the top card */
  if (T.g) return chip('', 'Not Finished');
  return on ? null : chip('', 'Searchable Only');
}
// ONE ROW of What to understand: the name, what is left to read, her one choice, her price for it at the speed she chose.
function uRow(r, nm, q, mul, priced, ro) {
  const on = pickOf(r) === 'understood', left = leftOf(r), box = r.kind === 'mailbox';
  const cv = Number(r.conversations_left) || 0, fl = Number(r.files_left) || 0;
  // EACH ROW SAYS ITS OWN PERCENTAGE UNDERSTOOD AND DONE OF TOTAL, WITH A SMALL METER AND ONE STATUS WORD (seat step4-after
  // 2026-11-12, Alex: "it says one file, two files, but it seems not clear"). What is left is said as left to read.
  // SUPERSEDED: a bare "N attached files", which read as the size of the source.
  /* fin: pressed and finished (nothing waiting, nothing being read). Its percentage is of what could be read; what could not is a count in its line. */ const T = rowStand(r), fin = !!T.g && !T.reading && T.wait === 0, pn = pctOf(T.done, fin ? T.all - T.cnr : T.all);
  const leftW = [cv ? num(cv) + (cv === 1 ? ' conversation' : ' conversations') : '', fl ? num(fl) + (box ? (fl === 1 ? ' attached file' : ' attached files') : (fl === 1 ? ' file' : ' files')) : ''].filter(Boolean).join(' ' + DOT + ' ');
  const notes = [pn === null ? (left === 0 ? 'already understood' : 'left to read: ' + leftW) : num(pn) + '% understood ' + DOT + ' ' + num(T.done) + ' of ' + num(T.all)];
  if (pn !== null && T.g && T.wait > 0 && !T.reading) notes.push(num(T.wait) + ' not read yet'); if (fin && T.cnr > 0) notes.push(num(T.cnr) + ' could not be read'); if (fin && on && left > T.cnr) notes.push(num(left - T.cnr) + ' not read yet: new mail and files are understood as they arrive');   /* the Tool lines up what arrives in a source she pressed on its own (understand_tick, read at source 2026-11-13) */
  if (pn !== null && !T.g && left > 0) notes.push('left to read: ' + leftW);
  if (!ro && q && q.state === 'reading') notes.push('still being made searchable: priced for what is searchable now');
  if (!ro && priced && !box && fl > 0 && !(Number(r.sampled) > 0) && !(fin && (on || left <= T.cnr))) notes.push('priced at the rate of your other files');   // only on a row that shows a price   // read-only rows show no price, so nothing about pricing
  if (box && r.by_default === true && r.choice === 'findable') notes.push('marked old');
  const pw = partWords(r.part); if (pw) notes.unshift(pw);   // the row reads "2024 only" first (decision 1163)
  const row = el('div', 'gs-row gs-urow' + (on || left === 0 ? '' : ' off')), l = el('span', 'gs-rl');
  row.dataset.src = r.source_key;
  l.append(el('b', null, nm), K(el('small', null, cap(notes.join(' ' + DOT + ' '))), 'm'));
  if (pn !== null) { const mt = el('span', 'gs-bar gs-rmeter'), mi = K(el('i'), 'rb'); mi.style.width = pn + '%'; mt.appendChild(mi); l.appendChild(mt); }
  // ONLY PART (seat understand-part 2026-11-12, decision 1163 REFINED): one quiet link per row, nothing else on the row. Shown
  // when the brain keeps parts (its row carries the key part, null for the whole); while a press runs, only on what is not in it.
  /* ONLY PART only where it can help (HQ 2026-11-13: it stood under every row, also rows 100% understood): not on a row that is finished or has nothing left, unless a part was chosen for it */ if (r.part !== undefined && !(on && !r.part && (fin || (!T.g && T.all > 0 && left === 0))) && !(ro && pressRows(R).some((x) => x.source_key === r.source_key))) {
    const a = K(btn('gr-link gs-partlink', (r.part ? 'Change Part' : 'Only Part') + ELL, () => partSheet(r.source_key)), 'pl');
    a.setAttribute('aria-label', (r.part ? 'Change the part of ' : 'Understand only part of ') + nm);
    l.appendChild(a);
  }
  row.appendChild(l);
  const sc = standChip(T, on);
  if (ro) { row.appendChild(sc || chip('warn', 'Being Understood')); return row; }   // while her press runs: what she chose, no buttons, no price to act on
  if (T.g && sc) row.appendChild(sc);   // a pressed row always carries its one status word
  if (fin && (on || left <= T.cnr)) return row;   /* a finished row she chose to understand: never a chooser and a price again for what arrived since (HQ 2026-11-13, Alex's screenshot) */   // pressed and finished: nothing here to choose or to price
  if (left > 0) row.appendChild(seg(CHOICES, pickOf(r), (v) => pick(r.source_key, v), nm)); else if (!T.g) row.appendChild(chip('ok', 'Understood'));
  // HER PRICE FOR THIS ROW (decision 1159.2): chosen, what it costs at her speed; kept searchable only, $0.00, and small beside
  // it what it would be. SUPERSEDED: the full price left standing, only greyed, on a row she had taken out (seat step4-fresh).
  const full = r.usd === null || r.usd === undefined ? null : usd2(Number(r.usd) * mul), shown = left > 0 && priced;
  const pc = el('span', 'gs-pv gs-up');
  pc.append(K(el('b', null, !shown ? '' : !on ? usd2(0) : full === null ? 'not measured' : full), 'p'), K(el('small', 'gs-would', shown && !on && full !== null ? 'Would be ' + full : ''), 'w'));
  row.appendChild(pc);
  return row;
}
// ro (decision 1162.3): while her press runs the same list is "What you chose", folded, read-only, with the way to change it.
// EVERY ROW THE BRAIN PRICED IS DRAWN (decision 1161.3). The list is the one reading of sources (sources_view), the prices
// and the press are the brain's own choice list (understand_choice). A mailbox or drive that is in the second and not in the
// first was priced, counted in the Yes sheet and pressed, and stood on no row (HireKraft 2026-11-11: one drive with 492
// files; the sheet said 15,876 drive files, the rows added to 15,384). Such a row is now drawn with the others, so what is
// counted is always on the page.
function treeU(S, ro) {
  const c = el('section', 'am-step gs-tree gs-utree' + (ro ? ' gs-chose' : '')); c.id = ro ? 'gs-uchose' : 'gs-utree';
  const hd = el('div', 'gs-treehd'); hd.append(el('h2', 'am-h2', ro ? 'What You Chose' : 'What to Understand'), el('small', 'gs-srcnote', ro ? 'As you started it. It can be changed when this is done.' : 'The same list as step 3. Choose for each one.'));
  c.appendChild(hd);
  const U = S.usam, ok = !!U && U.ok === true, rows = ok ? rowsOf(U) : [], priced = ok && U.state === 'done', mul = doorMul(S);
  const listed = S.src?.rows ?? [], P = S.splan && S.splan.ok === true ? planRows(S.splan) : [];
  const src = listed.concat(rows.filter((u) => allOf(u) > 0 && !listed.some((r) => r.source_key === u.source_key)).map((u) => ({ source_key: u.source_key, name: u.name, group: u.kind === 'mailbox' ? 'email' : 'drives', place: 'folder' })));
  // EMPTY IS NOT DENIED: a refused answer says its reason here, and the list below is still her own sources
  if (!U) c.appendChild(p('working no-late gr-small', 'Counting what there is to understand, for free'));
  else if (!ok) { const w = p('gr-small gs-over', 'Your choices and prices could not be read just now: ' + dotted(noteOf(U)) + ' It tries again on its own.'); w.id = 'gs-uwhy'; w.setAttribute('role', 'status'); c.appendChild(w); }
  const ur = (r) => rows.find((x) => x.source_key === r.source_key);
  const nm = names(S, src.map((r) => ({ key: r.source_key, label: ur(r)?.name ?? r.name, kind: r.group === 'email' ? 'mail' : 'drive' })));
  const none = (r) => { const u = ur(r); return !!u && leftOf(u) === 0 && allOf(u) === 0; };
  const line = (r) => {
    const u = ur(r);
    if (u) return uRow(u, nm[r.source_key], P.find((q) => q.key === r.source_key), mul, priced, ro);
    const d = el('div', 'gs-row gs-urow'), l = el('span', 'gs-rl'); l.append(el('b', null, nm[r.source_key]), K(el('small', null, ok ? 'not counted for understanding yet' : ''), 'm')); d.appendChild(l); return d;
  };
  const tree = el('div', 'gs-groups');
  const g4 = (key, ...a) => grp('u' + key, ...a);   // step 3's own folding group; its folds are kept apart from step 3's
  const mail = src.filter((r) => r.group === 'email');
  tree.appendChild(g4('mail', 'mail', 'Gmail', mail.length ? num(mail.length) + (mail.length === 1 ? ' mailbox' : ' mailboxes') + ' ' + DOT + ' their attachments included' : 'None connected yet', '', '', mail.map(line)));
  const dr = src.filter((r) => r.group === 'drives'), full = dr.filter((r) => !none(r)), { shared, meet, rest } = driveParts(full);
  const part = (title, list) => (list.length ? [el('span', 'gs-oncelab', title)].concat(list.map(line)) : []);
  const kids = part('Shared Drives', shared).concat(part('Meetings', meet), part('Folders Shared With the Tool', rest));
  const empty = dr.length - full.length;
  if (empty > 0) kids.push(el('small', 'gs-srcnote', num(empty) + (empty === 1 ? ' more has nothing in it to read.' : ' more have nothing in them to read.')));
  tree.appendChild(g4('drive', 'folder', 'Google Drive', [shared.length ? num(shared.length) + (shared.length === 1 ? ' shared drive' : ' shared drives') : '', meet.length ? 'meetings' : '', rest.length ? num(rest.length) + (rest.length === 1 ? ' folder' : ' folders') : ''].filter(Boolean).join(' ' + DOT + ' ') || (dr.length ? 'Nothing in them to read' : 'None connected yet'), '', '', kids));
  const sys = src.filter((r) => r.group === 'systems'), sn = sys.map((r) => String(r.name || '')).filter(Boolean);
  if (sys.length) tree.appendChild(g4('sys', 'systems', 'Your Systems', sn.length > 3 ? sn.slice(0, 3).join(', ') + ' and ' + num(sn.length - 3) + ' more' : sn.join(', '), 'Records Kept and Searchable ' + DOT + ' Free', 'ok',
    [el('small', 'gs-srcnote', 'Your systems already keep their records in order (invoices, contacts, people), so the Tool keeps them as they are, searchable and ready to ask about, from the moment a system is connected. Files a system holds, such as resumes in an applicant system, are searchable only for now.')]));
  if (!ro) { c.append(tree, insideFold(S)); return c; }
  const f = el('details', 'gs-fold'); f.id = 'gs-chosefold'; f.open = choseOpen; f.addEventListener('toggle', () => { choseOpen = f.open; });
  f.append(el('summary', null, ok && rows.length ? 'See the ' + (chosenWords(U) || 'mailboxes and drives') + ' being understood' : 'See your mailboxes and drives'), tree);
  c.append(f, p('gr-small', 'These cannot be changed while this is running. When it is done, or after Stop, the choices open again here.' + (rows.some((u) => u.part !== undefined) ? ' A mailbox or drive that is not being understood now can be understood in part beside it: Only Part' + ELL + ' on its row.' : '')));
  return c;
}
// INSIDE EACH MAILBOX, WHAT IS READ (1158), folded. The three lines are the brain's own sorting (understand_population reads the
// groups people and money; automated mail and the rest stay searchable). Under them her words for money paperwork and who she
// works with, pre-filled from counts (understand_answers_suggest), kept by understand_answers_set, with what moved.
function insideFold(S) {
  const d = el('details', 'gs-fold'); d.id = 'gs-inside'; d.open = inOpen;
  d.addEventListener('toggle', () => { inOpen = d.open; });
  d.appendChild(el('summary', null, 'Inside Each Mailbox, What Is Read'));
  d.append(priceRow('Conversations with clients and people you work with', 'Read'), priceRow('Mail about money: invoices, receipts, payment notices', 'Always Read'), priceRow('Newsletters, notifications, no-reply mail', 'Searchable Only'));
  const A = S.uans;
  if (!A) { d.appendChild(p('working no-late gr-small', 'Filling in your words from what was counted')); return d; }
  if (A.ok !== true) { d.appendChild(p('gr-small', 'Your words could not be read just now: ' + dotted(noteOf(A)) + ' The standard sorting is used.')); return d; }
  if (!ua) ua = answersFrom(A);
  const q3 = el('div', 'gs-q'); q3.appendChild(el('b', null, 'Your Words for Money Paperwork'));
  const words = el('div', 'gr-seg'); words.setAttribute('role', 'group'); words.setAttribute('aria-label', 'Your words for money paperwork');
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
  const q2 = el('div', 'gs-q'); q2.append(el('b', null, 'Who You Work With'), seg(WORK_WITH, ua.work_with, (v) => { ua.work_with = v; draw(); }, 'Who you work with'));
  q2.appendChild(el('p', 'am-small', 'Anyone you have ever written to always counts as someone you work with.'));
  d.append(q3, q2);
  const kept = A.answers && typeof A.answers === 'object';
  const changed = !same(answersFrom(A), ua);
  const out = p('gr-small', '');
  const keep = btn('go ghost', 'Keep My Changes', async () => {
    keep.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Keeping your words and sorting again';
    const { data, error } = await rpc('understand_answers_set', { p_answers: ua, p_identity: null });
    if (error || !data || data.ok !== true) { out.className = 'gr-small'; out.textContent = 'Not kept: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.'; keep.disabled = false; return; }
    toast(String(data.note || 'Kept. Your mail is sorted again with your words.'));
    R.uans = null; ua = null; R.gLoad = false; R.usam = null;
    draw();
  });
  keep.disabled = !changed;
  const g = el('div', 'gr-go'); g.appendChild(keep); d.append(g, out);
  if (!changed) d.appendChild(p('gr-small', kept ? 'Kept. Change any tap and press Keep My Changes.' : 'Filled in from what was counted. Change any tap and press Keep My Changes.'));
  d.appendChild(movedBlock(S));
  return d;
}
// mail and attached files, each part of the measured price as the brain gives it (understand_sample 'mail' and 'attached_files';
// the brain's 'attached_files' is every file, attached and in drives; 'drive_files' is the drives' part of it), at the chosen speed
const partsWords = (U, mul) => {
  const m = Number(U?.mail?.predicted_remaining_usd) * mul, f = Number(U?.attached_files?.predicted_remaining_usd) * mul, dv = Number(U?.drive_files?.predicted_remaining_usd) * mul;
  if (!(Number.isFinite(m) && Number.isFinite(f) && Number(U?.attached_files?.left) > 0)) return '';
  if (Number(U?.drive_files?.left) > 0 && Number.isFinite(dv)) return ' ' + usd2(m) + ' mail, ' + usd2(Math.max(0, f - dv)) + ' attached files, ' + usd2(dv) + ' drive files.';
  return ' ' + usd2(m) + ' mail, ' + usd2(f) + ' attached files.';
};
const capWords = (U) => { const c = Number(U?.cap_usd); const v = Number.isFinite(c) && c > 0 ? c : SAMPLE_CAP; return Number.isInteger(v) ? '$' + v : usd2(v); };
const goWords = (S) => (doorOf(S) === 'overnight' ? 'Understand Overnight' : 'Understand Now');
const sugOf = (S, U) => { const sug = Number(U.suggested_limit_usd), mul = doorMul(S); return Number.isFinite(sug) && sug > 0 ? Math.ceil(Number((sug * mul * 100).toFixed(6))) / 100 : Math.ceil(Number(U.predicted_remaining_usd) * mul); };
// THE LIMIT, HER CREDIT AND THE ONE BUTTON follow what is typed, read from the page as it stands (so a card kept in place by a
// re-read still answers with the newest reading, R).
function limitSay() {
  const S = R, U = S?.usam, inp = C.$('#gs-limit'), go = C.$('#gs-ugo');
  if (!S || !U || U.ok !== true || U.state !== 'done' || !inp || !go) return;
  const L = Number(inp.value), bal = balanceLeft(S), card0 = cardOf(S);
  uLimit = inp.value !== '' && Number.isFinite(L) && L !== sugOf(S, U) ? L : null;
  const gap = bal === null ? null : Math.round((L - bal) * 100) / 100, short = gap !== null && gap > 0;
  uGap = short ? gap : null;   // what add by card offers first (decision 1160)
  const over = C.$('#gs-uover'), test = C.$('#gs-utest');
  if (over) { over.textContent = short ? 'This is more than your credit: add ' + usd2(gap) + ' first, or lower your limit.' : bal === null ? 'Your credit could not be read just now, so nothing can be started. It tries again on its own.' : ''; over.hidden = !over.textContent; }
  if (test) test.hidden = !short || !!(card0 && card0.mode === 'live');
  go.textContent = goWords(S) + ' ' + DOT + ' Up to ' + (Number.isFinite(L) && inp.value !== '' ? usd2(L) : '$0.00');
  go.disabled = doorBusy || picking() || inp.value === '' || !Number.isFinite(L) || L <= 0 || bal === null || short || !(rowsOf(U).length ? chosenRows(U).length : (U.by_mailbox ?? []).length);
}
// HOW FAST, THE PRICE, THE LIMIT, THE ONE BUTTON.
function speedCard(S) {
  const U = S.usam;
  if (!U || U.ok !== true) return null;   // What to understand says why
  const c = el('section', 'am-step gs-yes gs-speed'); c.id = 'gs-speed';
  const bal = balanceLeft(S), f = doorF(S), cur = doorOf(S), mul = doorMul(S);
  c.appendChild(el('h2', 'am-h2', 'How Fast'));
  const fastTime = U.time && U.time.measured === true ? ' ' + DOT + ' ' + howLong(U.time.minutes) + ' at the pace of your sample' : '';
  if (f !== null) {
    const sp = el('div', 'gs-sp2'); sp.id = 'gs-sp'; sp.setAttribute('role', 'group'); sp.setAttribute('aria-label', 'How fast');
    for (const [v, title, sub] of [['fast', 'As Fast as Possible', 'Starts now ' + DOT + ' full price' + fastTime], ['overnight', 'Overnight ' + DOT + ' About Half Price', cap(OVERNIGHT_WHEN)]]) {
      const b = btn('gs-sp' + (v === cur ? ' on' : ''), '', () => doorPick(v)); b.dataset.door = v;
      b.append(el('b', null, title), el('small', null, sub)); b.setAttribute('aria-pressed', v === cur ? 'true' : 'false'); b.disabled = doorBusy;
      sp.appendChild(b);
    }
    c.appendChild(sp);
    if (doorBusy) c.appendChild(p('working no-late gr-small', 'Keeping your choice'));
  } else c.appendChild(p('gr-small', 'As Fast as Possible' + fastTime + '.'));
  const credit = () => { const r = el('div', 'gs-pl gs-ucredit'), v = el('span', 'gs-tval'); v.append(K(el('b', 'gs-pv', bal === null ? 'not read' : usd2(bal)), 'bal'), btn('gr-link', 'Add by Card', () => topUp(R, uGap))); r.append(el('span', null, 'Your Credit'), v); return r; };
  const expired = (S.uprog ?? []).reduce((a, x) => a + (Number(x.expired) || 0), 0);   // overnight items the AI company did not run in 24 hours (seat overnight-batch)
  if (expired > 0) c.appendChild(p('gr-small gs-over', num(expired) + ' were not read by the AI company within 24 hours. They were not billed. Press Understand again to send them.'));
  if (U.state === 'reading') {
    c.append(K(el('b', 'gs-sread', 'Measuring your price: ' + num(U.read) + ' of ' + num(U.size) + ' read'), 'sr'),
      K(p('gr-small', 'So far ' + usd2(U.spent_usd) + ', never more than ' + usd2(U.cap_usd) + '. Your price appears here when the sample is read.'), 'ss'));
    const out = p('gr-small', ''), stop = btn('go ghost', 'Stop', () => stopAll(R, (R.usam?.by_mailbox ?? []).map((x) => x.source_key), out, stop));
    const g = el('div', 'gr-go'); g.appendChild(stop); c.append(g, out);
    return c;
  }
  if (U.state === 'preview') {
    // no sample yet on this brain: the one button starts with it (see THE SAMPLE above for what is not built)
    const short = bal === null || bal < SAMPLE_CAP, any = (Number(U.conversations) || 0) + (Number(U.files) || 0) > 0;
    c.append(p(null, 'Your price is measured first. A small sample of about 100 of your own emails and files (never more than ' + capWords(U) + ') is read and turns into your real price, here. Nothing beyond the sample is read until you have seen that price and set your limit.'), credit());
    if (short) c.appendChild(p('gr-small gs-over', 'The sample needs ' + usd2(SAMPLE_CAP) + ' in your credit' + (bal === null ? '; it could not be read just now.' : '; you have ' + usd2(bal) + '.')));
    if (picking()) c.appendChild(p('working no-late gr-small', 'Keeping your choice'));
    const go = K(btn('go', goWords(S) + ' ' + DOT + ' the sample first, never more than ' + capWords(U), () => samplePress(R, R.usam)), 'go'); go.id = 'gs-ugo';
    go.disabled = short || picking() || !any;
    const act = el('div', 'gs-act'); act.appendChild(go); c.appendChild(act);
    if (U.note) c.appendChild(el('p', 'am-small', String(U.note)));
    return c;
  }
  // done: the price measured on her own mail and files
  const lo = Number(U.low_usd), hi = Number(U.high_usd), wait = picking(), P = uPrice(S) || {};
  const tl = el('div', 'gs-pl gs-totalrow'); tl.id = 'gs-uprice';
  if (wait) {
    tl.append(el('b', 'gs-total', 'Your Price'), K(el('b', 'gs-pv', P.usd !== undefined ? 'About ' + usd2(P.usd) : 'Measuring'), 'tot'));
    c.append(tl, p('working no-late gr-small', 'Working out the exact price and range for your choice'));
  } else {
    tl.append(el('b', 'gs-total', 'Your Price'), K(el('b', 'gs-pv', P.usd !== undefined ? 'About ' + usd2(P.usd) : 'Not measured'), 'tot'));
    c.append(tl, K(p('gr-small', 'Likely between ' + usd2(lo * mul) + ' and ' + usd2(hi * mul) + '.' + partsWords(U, mul) + ' One time, measured on a sample of your own mail and files.'), 'rng'));
  }
  const how = el('details', 'gs-fold'); how.id = 'gs-how'; how.open = howOpen; how.addEventListener('toggle', () => { howOpen = how.open; });
  how.appendChild(el('summary', null, 'How This Price Was Measured'));
  how.appendChild(K(p('gr-small', 'The sample cost ' + usd2(U.sample_spent_usd) + ' (' + num(U.read) + ' read' + (Number(U.could_not_read) ? ', ' + num(U.could_not_read) + ' could not be read' : '') + '). ' + String(U.basis || '')), 'hb'));
  const dns = Number(U.drive_files?.drives_not_sampled) || 0;
  if (dns > 0) how.appendChild(p('gr-small', num(dns) + (dns === 1 ? ' drive you chose was' : ' drives you chose were') + ' not in the sample, so ' + (dns === 1 ? 'its' : 'their') + ' files are priced at the rate measured on your other files. Your limit holds either way.'));
  if (Array.isArray(U.groups_not_sampled) && U.groups_not_sampled.length) how.appendChild(p('gr-small', 'Not in the sample: ' + U.groups_not_sampled.map((g) => GROUP_TITLE[g] || g).join(', ') + '. They are priced at the rate measured on the rest.'));
  if (U.suggested_reason) how.appendChild(K(p('gr-small', 'Your limit starts at: ' + String(U.suggested_reason) + (mul !== 1 ? ' For overnight: that figure at the overnight price.' : '')), 'hs'));
  if (cur === 'overnight') how.appendChild(p('gr-small', 'Overnight: ' + String(S.udoor.overnight.basis || 'the AI company reads it in bulk') + '. It goes out in batches, each small enough that it cannot pass your limit; a higher limit sends more at once and you still pay only for what was read. Each batch comes back whole. A batch not read within 24 hours is not billed and waits until you press Understand again.'));
  c.appendChild(how);
  // THE LIMIT STARTS AT THE BRAIN'S SUGGESTION (ruling 1142.5), at the price of the speed she chose
  const lab = el('label', 'gr-field gs-limit'); lab.append(el('span', null, 'Your Limit, $'));
  const inp = el('input'); inp.id = 'gs-limit'; inp.type = 'number'; inp.min = '0'; inp.step = '0.01'; inp.inputMode = 'decimal';
  inp.value = uLimit !== null ? String(uLimit) : sugOf(S, U).toFixed(2);
  inp.addEventListener('input', limitSay);
  lab.appendChild(inp);
  const over = p('gr-small gs-over', ''); over.id = 'gs-uover'; over.dataset.k = 'ov'; over.hidden = true;
  const test = p('gr-small gr-test', 'Card payments are in test mode: a test payment is shown but never added to your credit, so it cannot pay for this step.'); test.id = 'gs-utest'; test.dataset.k = 'ts'; test.hidden = true;
  const out = p('gr-small', ''); out.id = 'gs-uout';
  const go = K(btn('go', goWords(S), () => understandPress()), 'go'); go.id = 'gs-ugo';
  const act = el('div', 'gs-act'); act.appendChild(go);
  c.append(lab, el('small', 'gs-srcnote', 'Never passed. Stop works any time. You pay only for what was read.'), credit(), over, test, act, out);
  return c;
}
// NO SAMPLE YET: her yes to the sample, in one sheet (understand_sample with confirm, through lens-ask, which checks her credit).
function samplePress(S, U) {
  const body = el('div');
  body.append(priceRow('Conversations read first', num(U.size), 'chosen across your mailboxes and lengths'));
  if (Number(U.files_size) > 0) body.appendChild(Number(U.drive_files) > 0
    ? priceRow('Files read first', num(U.files_size) + ' or more', 'of your ' + num(U.files) + ' files, attached to mail and in your drives, with at least two from every drive you chose; an agreement among them is read for its terms too')
    : priceRow('Attached files read first', num(U.files_size), 'of your ' + num(U.files) + ' attached files; an agreement among them is read for its terms too'));
  body.append(priceRow('Never more than', usd2(Number(U.cap_usd) || SAMPLE_CAP)),
    p('gr-small', 'Then you see the price measured on your own mail and files, here, and set your limit. Nothing else is read until then.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, start with the sample', async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting the sample';
    const data = await sampleAsk(S, true);
    if (data.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + noteOf(data) + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(data.note || 'The sample is being read.')); R.usam = data; draw();
    try { document.dispatchEvent(new CustomEvent('tool:work-refresh')); } catch (_) { /* the indicator reads again on its own */ }
  });
  const no = btn('go ghost', 'Not Now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no); body.append(acts, said);
  sheet.open('Start with a sample?', body);
}
// THE ONE PRESS. Reads everything at the moment of the press (R, the limit field): keeps the speed shown, asks the brain what
// the press would do (understand_go without confirm, through lens-ask, which checks the limit against her credit), shows it,
// and starts only on her Yes.
async function understandPress() {
  const S = R, U = S?.usam, inp = C.$('#gs-limit'), out = C.$('#gs-uout'), go = C.$('#gs-ugo');
  if (!S || !U || U.ok !== true || U.state !== 'done' || !inp || !out || !go) return;
  const L = Number(inp.value), groups = chosenGroups(S);
  // what is pressed is the brain's own choice (understand_choice: the rows above); a brain that sends no rows gets the mailboxes as before
  const hasRows = rowsOf(U).length > 0, dl = Number(U.drive_files?.left) || 0, al = (Number(U.attached_files?.left) || 0) - dl;
  const q = hasRows ? { groups, months: 24, limit: L } : { groups, months: 24, limit: L, sources: (U.by_mailbox ?? []).filter((x) => Number(x.conversations) > 0).map((x) => x.source_key) };
  go.disabled = true; out.className = 'working no-late gr-small'; out.textContent = 'Checking your limit against your credit';
  const dk = await doorKeep(S);
  if (!dk.ok) { out.className = 'gr-small'; out.textContent = 'Not started: your choice of speed could not be kept (' + dk.note + ').'; limitSay(); return; }
  const pv = await C.askBody({ understand_go: { ...q, confirm: false } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
  out.className = 'gr-small'; out.textContent = ''; limitSay();
  if (!pv || pv.ok !== true) { out.textContent = 'Not started: ' + noteOf(pv) + '.'; return; }
  const body = el('div'), night = doorOf(S) === 'overnight', mul = doorMul(S);
  // EVERY COUNT IS THE SUM OF THE ROWS SHE CHOSE AND OPENS TO THEM (seat step4-pressed 2026-11-12, decision 1161.2 and .3): each
  // count is added from the chosen rows of the page (the brain's rows), and under it the list it counts, by mailbox or drive.
  // SUPERSEDED: the brain's totals printed beside rows that did not all stand on the page (15,876 against 15,384).
  const cr = hasRows ? chosenRows(U) : [], rn = hasRows ? names(S, cr.map((r) => ({ key: r.source_key, label: r.name, kind: r.kind === 'mailbox' ? 'mail' : 'drive' }))) : {};
  const count = (id, title, small, list, k, n0) => {
    const rows = list.filter((r) => Number(r[k]) > 0), n = hasRows ? rows.reduce((a, r) => a + Number(r[k]), 0) : n0;
    if (!(n > 0)) return [];
    const out = [priceRow(title, num(n), small)]; out[0].id = id; out[0].classList.add('gs-cnt');
    if (rows.length) {
      const d = el('details', 'gs-fold gs-cfold'); d.id = id + '-by';
      d.appendChild(el('summary', null, 'See them by ' + (list.every((r) => r.kind === 'mailbox') ? 'mailbox' : 'drive')));
      for (const r of rows) { const l = el('div', 'gs-pl gs-cl'); const nmb = el('span', null, rn[r.source_key]); nmb.setAttribute('translate', 'no'); l.append(nmb, el('b', 'gs-pv', num(r[k]))); d.appendChild(l); }
      out.push(d);
    }
    return out;
  };
  const boxes = cr.filter((r) => r.kind === 'mailbox'), drives = cr.filter((r) => r.kind !== 'mailbox');
  // ONE SUGGESTED LIMIT, FROM ONE PLACE (decision 1161.1): the figure the page's limit starts at (sugOf), at her speed. The
  // brain's own sentence about this press (understand_go 'note') compared her limit with the full-speed figure whatever the
  // speed ("below the suggested $431.10" for an overnight limit of $340 on a page suggesting $217.45), so it is not shown;
  // what it says is said here from the same numbers the page shows. A limit is warned about only when it is under that one
  // suggested figure and under the top of the measured range, and the warning says what then happens.
  const price = (uPrice(S) || {}).usd, hi = Number(U.high_usd) * mul, sug = sugOf(S, U), np = (Number(pv.mailboxes_pressed) || 0), nd = (Number(pv.drives_pressed) || 0);
  body.append(...count('gs-cc', 'Conversations to understand', 'in the mailboxes you chose, last 2 years', boxes, 'conversations_left', (Number(U.conversations) || 0) - (Number(U.already_read) || 0)),
    ...count('gs-ca', 'Attached files to understand', 'every file attached to the mail of the mailboxes you chose', boxes, 'files_left', al),
    ...count('gs-cd', 'Drive files to understand', 'every file in the drives you chose', drives, 'files_left', dl),
    priceRow(night ? 'Measured price, overnight' : 'Measured price', usd2(price), 'likely between ' + usd2(Number(U.low_usd) * mul) + ' and ' + usd2(hi)),
    ...(doorF(S) !== null ? [priceRow('How fast', night ? 'Overnight' : 'As Fast as Possible', night ? OVERNIGHT_WHEN + '; sent in batches that fit your limit' : (U.time && U.time.measured === true ? howLong(U.time.minutes) + ', measured on your sample' : 'time not measured yet'))] : []),
    priceRow('Your limit, never passed', usd2(Number.isFinite(Number(pv.limit_usd)) ? pv.limit_usd : L), Math.abs(L - sug) < 0.005 ? 'the suggested limit' : 'suggested: ' + usd2(sug)));
  if (np + nd > 0) body.appendChild(p('gr-small', 'Your limit is one amount for everything you chose: ' + [np ? num(np) + (np === 1 ? ' mailbox' : ' mailboxes') : '', nd ? num(nd) + (nd === 1 ? ' drive' : ' drives') : ''].filter(Boolean).join(' and ') + ' read from it until it is used up. Nothing is read until you say yes.'));
  if (L < sug - 0.005 && (!Number.isFinite(hi) || L < hi)) { const w = p('gr-small gs-over', Number.isFinite(price) && L < price
    ? 'Your limit is below the measured price of ' + usd2(price) + '. Reading stops when your limit is reached, so part of what you chose will stay searchable only until you press again.'
    : 'Your limit is below the suggested ' + usd2(sug) + '. If your mail and files cost more than your limit, reading stops there and what is left stays searchable only until you press again.'); w.id = 'gs-lwarn'; body.appendChild(w); }
  body.appendChild(p('gr-small', (night ? 'Stop works any time: what has not been read yet is called back and not billed; you pay only for what was read.' : 'Stop works any time; you pay only for what was read.') + ' You get one short email when it is done.'));
  const said = p('gr-small', '');
  const yes = btn('go', 'Yes, ' + goWords(S) + ' ' + DOT + ' Up to ' + usd2(L), async () => {
    yes.disabled = true; no.disabled = true; said.className = 'working no-late gr-small'; said.textContent = 'Starting';
    const r = await C.askBody({ understand_go: { ...q, confirm: true } }).catch((e) => ({ ok: false, error: String(e?.message ?? e) }));
    if (!r || r.ok !== true) { said.className = 'gr-small'; said.textContent = 'Not started: ' + noteOf(r) + '.'; yes.disabled = false; no.disabled = false; return; }
    sheet.close(); toast(String(r.note || 'Started: your mail and files are being understood. It stops before ' + usd2(L) + '. You get one short email when it is done.'));
    try { document.dispatchEvent(new CustomEvent('tool:work-refresh')); } catch (_) { /* the indicator reads again on its own */ }
    uPick = {}; uLimit = null; mount(C);
  });
  const no = btn('go ghost', 'Not Now', () => sheet.close());
  const acts = el('div', 'gr-chips'); acts.append(yes, no); body.append(acts, said);
  sheet.open(goWords(S) + '?', body);
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
// MOVED TO SETTINGS AND THE GUIDE (seat step4-fresh 2026-11-12, decision 1158): how the price of Understand works and step 4's
// questions. One copy of the words, kept here beside the figures they use, drawn by settings.js.
export function priceWorks(S) {
  const M = monthlyOf(S);
  return ['A small sample first, never more than $' + SAMPLE_CAP + '. About 100 of your conversations and some of your files (attached to mail and in the drives you chose) are read, and you see the price measured on your own mail and files.',
    'You set the limit. It starts at that price, it is never passed, and Stop works any time: you pay only for what was read.',
    'Then only new mail, ' + (M === null ? 'its monthly price measured' : 'about ' + usd2(M) + ' a month') + ', shown measured after your first month.'];
}
export function understandQs(S) {
  const M = monthlyOf(S);
  return [
    ['Is understanding one time?', 'Yes. Your past mail and files are read once. After that, only new mail is read as it arrives, ' + (M === null ? 'its monthly price measured' : 'about ' + usd2(M) + ' a month') + ' at your pace, plus about 1 cent for each question you ask.'],
    ['Why a sample first?', 'Every business' + String.fromCharCode(8217) + 's mail is different. The sample measures what your own mail and files cost to understand, so the price you agree to is yours, not an average.'],
    ['Can understanding cost more than I agreed?', 'No. It stops before your limit. If something is left, it tells you how much and what it would cost, and you decide.'],
    ['What happens to what I leave searchable only?', 'It stays searchable. You can make any of it understood later, with its price shown first.'],
    ['Will I know when understanding is done?', 'Yes, one short email from your own mailbox to you.'],
  ];
}

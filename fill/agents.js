// fill/agents.js - THE AGENTS TAB (seat agents-tab, 2026-11-05; decisions 1052, 1092-1102; approved picture T4R7NokV8WeFqUPRwrd6mm,
// copy briefs/mockups/agents-tab.html in studio-walkers). Part of SHOW. The design language is briefs/DESIGN-LANGUAGE.md.
//
// WHAT IT IS: her team of seven (Consultant, CFO, Marketing, Admin, Legal, HR, Security) on the left; on the right either the making of
// an agent or the expert she picked. Making an agent has four steps: say it, see what you would have got on last month's real data,
// adjust by talking (it runs again), Start. Started agents run on their schedule and their work waits here for her yes.
//
// WHERE EACH PART LIVES. This file computes nothing and decides nothing.
//   the agents, their runs and their work      brain: agent_list, agent_run_read, agent_work_list, agent_save, agent_start, agent_stop,
//                                              agent_work_decide (migrations/hirekraft/2026-11-05-agents-tab-1.sql)
//   a run (try or now)                         edge function agent-run, which asks ask-agent (the box's own loop) as her
//   what each expert sees today                the readings the other tabs already use, as her: books_truth (Accounting), audit_panel
//                                              (Security), watch_news (the watches). A line with no reading behind it is not drawn.
//   Legal and HR                               the one-time agreement: help_agreement_read / help_agreement_answer (decision 1094)
//   the working sign                           lens.js followSteps (seat working-sign's, not a second one)
//   an answer's words, tables and sources      lens.js renderAsk (one renderer)
// Who sees what is decided in the brain: an agent reads only what its maker may open, and the owner sees every agent (never the work of
// someone else's, which was read as them). Refused is never drawn as empty.
// No regex literals and no backslashes (STANDING-CLAUSES).

let C = null;      // { sb, el, $, url, key, followSteps, renderAsk, ask, isOwner, goTab }
let mount = null;
let team = null;   // agent_list
let work = null;   // agent_work_list
let agree = null;  // help_agreement_read
let sel = 'make';
let making = null; // { expert, id, ask, adjust: [], run, busy }

const EX = {
  consultant: { t: 'Consultant', av: 'Co', small: 'What it sees in your whole business',
    d: 'Now that it knows your whole business: what works, what to watch, and ideas, from your own numbers and documents. Ask any time.',
    ex: 'Ask: what would an outside consultant tell me about my business?' },
  cfo: { t: 'CFO', av: 'Cf', small: 'Cash, who owes you, your books',
    d: 'Watches cash and who owes you, on your real numbers. The expertise of a CFO on your own books, not a CFO.',
    ex: 'Ask: can I afford to hire one more recruiter?' },
  marketing: { t: 'Marketing', av: 'Mk', small: 'New clients, your network',
    d: 'Finds where your next clients come from, starting from the people who already know you.',
    ex: 'Ask: who in my network moved to a new company this year?' },
  admin: { t: 'Admin', av: 'Ad', small: 'Open work, timesheets, dates',
    d: 'Keeps your open work moving and your dates in front of you.',
    ex: 'Ask: which consultants have not sent a timesheet this month?' },
  legal: { t: 'Legal', av: 'Lg', small: 'Your contracts and what they bind you to',
    d: 'Reads your contracts back to you in plain words and keeps their dates. Help, not legal advice. Your call.',
    ex: 'Ask: what am I on the hook for in my client agreement?' },
  hr: { t: 'HR', av: 'Hr', small: 'Offer letters, contractors, policies',
    d: 'Offer letters, contractor agreements and policies, read back and checked. Help, not legal advice. Your call.',
    ex: 'Ask: which contractors have no signed agreement on file?' },
  security: { t: 'Security', av: 'Se', small: 'Who can open what matters',
    d: 'Watches who can open what you named important, and tells you when that changes. It never changes sharing itself.',
    ex: 'Ask: who outside the company can open our contracts?' },
};
const ORDER = ['consultant', 'cfo', 'marketing', 'admin', 'legal', 'hr', 'security'];
const TAB_WORDS = { money: 'Accounting', marketing: 'Marketing and sales', work: 'Work', security: 'Security', contacts: 'Contacts', brain: 'Brain', agents: 'Agents' };
const EXAMPLE = "At month-end, check each consultant's approved timesheet against what the client was invoiced and what they paid. Draft invoices for anything missing, and tell me which contractors I can pay.";
const STANDING = ['every ', 'each ', 'weekly', 'monthly', 'daily', 'month-end', 'month end', 'whenever', 'each morning', 'on the '];

const node = (tag, cls, text) => { const n = C.el(tag, cls); if (text != null) n.textContent = text; return n; };
const btn = (cls, text, fn) => { const b = node('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; };
const legalKind = (k) => k === 'legal' || k === 'hr';
const money = (n) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
function cost(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  if (v < 1) return 'about ' + Math.max(1, Math.round(v * 100)) + ' cents';
  return 'about ' + v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
function lastMonthWords() {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function when(t) {
  if (!t) return '';
  try { return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (_) { return String(t); }
}

async function rpc(name, args) {
  try { const { data, error } = await C.sb.rpc(name, args || {}); return error ? { ok: false, reason: error.message } : (data ?? { ok: false, reason: 'no answer' }); }
  catch (e) { return { ok: false, reason: String(e?.message ?? e) }; }
}

export async function drawAgents(body, ctx) {
  C = ctx; mount = body;
  body.innerHTML = '';
  const wait = node('p', 'quiet working', 'Reading your team.');
  body.appendChild(wait);
  [team, work, agree] = await Promise.all([rpc('agent_list'), rpc('agent_work_list'), rpc('help_agreement_read')]);
  draw();
}

function mineFor(k) { return (team?.agents ?? []).filter((g) => g.expert === k && g.tab !== 'control'); }
function workFor(k) { return (work?.work ?? []).filter((w) => w.expert === k); }

function draw() {
  mount.innerHTML = '';
  const page = node('div', 'ag');
  const head = node('header', 'ag-head');
  head.append(node('h2', 'ag-h1', 'Agents'),
    node('p', 'ag-lead', 'Your team. Each agent knows your business, because it reads the same mail, files and books as the Tool. Tell one what you need in your own words, the way you would tell a person who works for you. It works on what you ask and does nothing important without your yes.'));
  page.appendChild(head);
  page.appendChild(statusLine());
  const how = node('ol', 'ag-how');
  [['Say what you need', 'In your own words. Long and specific is fine.'],
   ['See what you would have got', "It runs on last month's real data first, so you judge the result, not settings."],
   ['Adjust by talking', '"Not quite, also show..." It changes and runs again.'],
   ['Start', 'It runs when you said. Its work waits for your yes.']].forEach(([b, s], i) => {
    const li = node('li', 'ag-how-step'); li.append(node('span', 'ag-num', String(i + 1)), node('b', null, b), node('span', null, s)); how.appendChild(li);
  });
  page.appendChild(how);
  const grid = node('div', 'ag-grid');
  grid.append(teamPane(), mainPane());
  page.appendChild(grid);
  page.appendChild(node('p', 'ag-note', 'Agents see only what the person who made them can see; the owner sees every agent. Legal and HR are help, not legal advice, and ask for your one-time "I understand" first.'));
  mount.appendChild(page);
}

function statusLine() {
  if (!team?.ok) return node('p', 'notice flagged', 'Your team could not be read just now, so nothing here is a claim either way: ' + (team?.reason ?? 'no answer') + '.');
  const live = (team.agents ?? []).filter((g) => g.tab !== 'control' && g.state === 'running' && g.mine).length;
  const waiting = (work?.work ?? []).length;
  const others = (team.agents ?? []).filter((g) => g.tab !== 'control' && !g.mine && g.state === 'running').length;
  let s = live ? (live === 1 ? 'One agent is working for you.' : live + ' agents are working for you.') : 'No agent is working for you yet. Make your first one below: it takes a minute.';
  if (waiting) s += ' ' + (waiting === 1 ? 'One result is waiting for your yes.' : waiting + ' results are waiting for your yes.');
  if (team.owner && others) s += ' ' + (others === 1 ? 'One more works for someone on your team.' : others + ' more work for people on your team.');
  return node('p', 'ag-status', s);
}

function teamPane() {
  const nav = node('nav', 'ag-team'); nav.setAttribute('aria-label', 'Your team');
  const mk = btn('ag-make' + (sel === 'make' ? ' on' : ''), '+ Make an agent', () => { sel = 'make'; if (!making || making.run) making = null; draw(); });
  nav.appendChild(mk);
  nav.appendChild(node('div', 'ag-team-h', 'Your team'));
  for (const k of ORDER) {
    const e = EX[k];
    const b = btn('ag-ex' + (sel === k ? ' on' : ''), null, () => { sel = k; draw(); });
    b.dataset.k = k;
    const txt = node('span', 'ag-ex-t'); txt.append(node('b', null, e.t), node('small', null, e.small));
    const jobs = mineFor(k).filter((g) => g.state !== 'draft' || g.mine);
    const running = jobs.filter((g) => g.state === 'running').length;
    const w = workFor(k).length;
    const cnt = w ? (w === 1 ? '1 waiting' : w + ' waiting') : k === 'consultant' && !running ? 'Ask any time' : running ? (running === 1 ? '1 job' : running + ' jobs') : 'None yet';
    b.append(node('span', 'ag-av', e.av), txt, node('span', 'ag-cnt', cnt));
    nav.appendChild(b);
  }
  return nav;
}

function mainPane() {
  const main = node('section', 'ag-main'); main.setAttribute('aria-live', 'polite');
  if (sel === 'make') drawMake(main); else drawExpert(main, sel);
  return main;
}

// ---- THE AGREEMENT (Legal and HR, decision 1094) ----
function agreed() { return agree?.ok && agree.answer === 'yes'; }
function drawAgreement(main, then) {
  const t = agree?.text;
  if (!agree?.ok || !t) { main.appendChild(node('p', 'notice flagged', 'The agreement could not be read just now, so Legal and HR stay closed: ' + (agree?.reason ?? 'no answer') + '.')); return; }
  const card = node('div', 'ag-agree');
  card.appendChild(node('h3', 'ag-h2', t.title));
  for (const line of t.body ?? []) card.appendChild(node('p', null, line));
  if (agree.answer === 'no') card.appendChild(node('p', 'quiet', 'You said Not for me, so Legal and HR are closed. The rest of the Tool works as before. You can change your mind here.'));
  const said = node('p', 'quiet');
  const acts = node('div', 'ag-acts');
  const answer = async (a, b) => {
    b.disabled = true; said.textContent = 'Saving your answer.'; said.className = 'quiet working';
    const r = await rpc('help_agreement_answer', { p_version: t.version, p_answer: a });
    if (!r.ok) { b.disabled = false; said.className = 'notice flagged'; said.textContent = 'Not saved: ' + (r.reason ?? 'no answer') + '.'; return; }
    agree = await rpc('help_agreement_read'); team = await rpc('agent_list');
    then ? then() : draw();
  };
  const yes = btn('go ag-go', t.yes, () => answer('yes', yes));
  const no = btn('go ghost', t.no, () => answer('no', no));
  acts.append(yes, no);
  card.append(acts, said);
  main.appendChild(card);
}

// ---- ONE EXPERT ----
async function drawExpert(main, k) {
  const e = EX[k];
  main.appendChild(node('h3', 'ag-h2', 'Your ' + e.t));
  main.appendChild(node('p', 'ag-meta', e.d));
  if (legalKind(k) && !agreed()) { drawAgreement(main); return; }
  const sees = node('div', 'ag-blk');
  sees.appendChild(node('h4', 'ag-lab', 'What it sees in your business today'));
  const lines = node('div', 'ag-watch');
  lines.appendChild(node('p', 'quiet working', 'Reading.'));
  sees.appendChild(lines);
  main.appendChild(sees);
  if (k === 'consultant') {
    const b = btn('go ag-go', 'What do you see?', () => C.ask('Now that you know my whole business, what do you see? Give me a short business review from my own numbers and documents: what works, the risks, and ideas, each with its source.'));
    const row = node('div', 'ag-acts'); row.appendChild(b);
    sees.appendChild(row);
    sees.appendChild(node('p', 'ag-src', 'The review is a conversation: it opens beside this page and you can ask on from there. A review prepared for you every quarter comes later.'));
  }
  // what it does for you
  const jobs = node('div', 'ag-blk');
  jobs.appendChild(node('h4', 'ag-lab', 'What it does for you'));
  const mine = mineFor(k);
  if (!mine.length) jobs.appendChild(node('p', 'ag-meta', 'Nothing yet. Tell it what you need below, or press Make an agent.'));
  for (const g of mine) jobs.appendChild(jobRow(g));
  main.appendChild(jobs);
  // work waiting
  const w = workFor(k);
  if (w.length) {
    const wb = node('div', 'ag-blk');
    wb.appendChild(node('h4', 'ag-lab', 'Waiting for your yes'));
    for (const it of w) wb.appendChild(workCard(it));
    main.appendChild(wb);
  }
  // give it something to do
  const give = node('div', 'ag-blk');
  give.appendChild(node('h4', 'ag-lab', 'Give it something to do'));
  const box = node('div', 'ag-box');
  const ta = node('textarea'); ta.rows = 2; ta.placeholder = e.ex; ta.setAttribute('aria-label', 'Tell your ' + e.t + ' what you need');
  const send = btn('go', 'Send', () => {
    const t = ta.value.trim(); if (!t) { ta.focus(); return; }
    const low = ' ' + t.toLowerCase();
    if (STANDING.some((s) => low.includes(s))) { making = { expert: k, id: null, ask: t, adjust: [], run: null }; sel = 'make'; draw(); startTry(); return; }
    C.ask(t);
  });
  box.append(ta, send);
  give.appendChild(box);
  give.appendChild(node('p', 'ag-src', 'A one-off question opens as a conversation. Something it should do again and again ("every Friday...") becomes a job: you see what it would have found first.'));
  main.appendChild(give);
  await seesLines(lines, k);
}

// Each line comes from a reading another tab already makes, as her. No reading, no line.
async function seesLines(box, k) {
  const out = [];
  const say = (n, words, src) => out.push({ n, words, src });
  const notes = [];
  if (k === 'cfo') {
    const o = await rpc('books_truth');
    if (o?.ok !== false && o?.books != null) say(money(o.books), 'owed to you, as your books say: ' + o.open_invoices + ' open invoices, ' + o.past_due + ' past due', 'From QuickBooks as kept ' + when(o.books_as_of) + '. Accounting shows each one.');
    else notes.push(o?.note ?? ('What you are owed could not be read: ' + (o?.reason ?? 'no answer')));
    notes.push('Margin per hour and how long the money lasts are not shown here yet; Accounting shows the months the money lasts, read live from the bank.');
  }
  if (k === 'security') {
    const o = await rpc('audit_panel', { p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
    const g = o?.ok ? o.gauges : null;
    if (g) {
      say(String(g.critical_places_beyond_company ?? 0), 'places with critical files open beyond the company', 'From the last access check, ' + (o.run?.when ?? '') + '. Security shows each place.');
      say(String(g.outside_parties ?? 0), 'outside people and domains with access', 'From the same check.');
    } else notes.push(o?.note ?? ('The access check could not be read: ' + (o?.reason ?? 'no answer')));
  }
  if (k === 'admin') {
    const o = await rpc('watch_news');
    if (o?.ok) {
      const open = (o.findings ?? []).length;
      say(String(open), open === 1 ? 'thing your watches found is waiting for you' : 'things your watches found are waiting for you', 'From your watches over the mail' + (Number(o.withheld || 0) ? '; ' + o.withheld + ' more rest on email you cannot open' : '') + '.');
    } else notes.push('Your watches could not be read: ' + (o?.reason ?? 'no answer'));
    const w = (work?.work ?? []).length;
    say(String(w), w === 1 ? 'result from your agents is waiting for your yes' : 'results from your agents are waiting for your yes', 'From your agents, on this tab.');
  }
  if (k === 'consultant') notes.push('It reads everything you can see: your mail, files, books and contacts. It gives no score of its own; the review below rests on your records, with sources.');
  if (k === 'marketing') notes.push('What it would watch here (people who moved, companies hiring that you know) is not read onto this page yet. Marketing and sales shows the companies hiring today; ask it here for the rest.');
  if (k === 'legal') notes.push('Your contracts are not gathered in one place yet (the Contracts tab comes later), so it shows no dates here yet. Ask it about one contract and it reads it back to you.');
  if (k === 'hr') notes.push('Your offer letters and contractor agreements are not gathered in one place yet, so it shows no counts here yet. Ask it about one person or agreement.');
  box.innerHTML = '';
  for (const l of out) {
    const row = node('div', 'ag-line');
    const t = node('div', 'ag-line-t'); t.append(node('span', null, l.words), node('span', 'ag-src', l.src));
    row.append(node('span', 'ag-n', l.n), t);
    box.appendChild(row);
  }
  for (const n of notes) box.appendChild(node('p', 'ag-meta', n));
}

function jobRow(g) {
  const row = node('div', 'ag-job');
  const t = node('div', 'ag-job-t');
  t.append(node('b', null, g.name || 'An agent being made'),
    node('span', 'ag-src', (g.when || '') + (g.tab && TAB_WORDS[g.tab] && g.tab !== 'agents' ? ' · shows on ' + TAB_WORDS[g.tab] : '') + (g.last_run_at ? ' · last ran ' + when(g.last_run_at) : '') + (g.mine ? '' : ' · made by ' + (g.maker_name || 'someone on your team'))));
  const pill = node('span', 'ag-pill ' + (g.state === 'running' ? 'ag-run' : 'ag-off'), g.state === 'running' ? 'Running' : g.state === 'stopped' ? 'Stopped' : 'Not started');
  row.append(t, pill);
  const acts = node('div', 'ag-acts');
  if (g.mine) {
    acts.appendChild(btn('go ghost', 'Adjust', () => { making = { expert: g.expert, id: g.id, ask: g.ask, adjust: (g.adjust ?? []).slice(), run: null, agent: g }; sel = 'make'; draw(); }));
    if (g.state === 'running') acts.appendChild(btn('go ghost', 'Run now', (ev) => runNow(g, ev.currentTarget, row)));
  }
  if (g.state === 'running') acts.appendChild(btn('go ghost', 'Stop', async (ev) => { ev.currentTarget.disabled = true; const r = await rpc('agent_stop', { p_id: g.id }); if (!r.ok) { row.appendChild(node('p', 'notice flagged', 'Not stopped: ' + (r.reason ?? 'no answer'))); return; } team = await rpc('agent_list'); draw(); }));
  else if (g.mine && g.state === 'stopped') acts.appendChild(btn('go ghost', 'Start again', async (ev) => { ev.currentTarget.disabled = true; const r = await rpc('agent_start', { p_id: g.id }); if (!r.ok) { row.appendChild(node('p', 'notice flagged', 'Not started: ' + (r.reason ?? 'no answer'))); return; } team = await rpc('agent_list'); draw(); }));
  row.appendChild(acts);
  if (Number(g.dismissed_in_row) >= 3) row.appendChild(node('p', 'notice', 'Its last three results were dismissed. If it is not helping, stop it with one press.'));
  if (g.cap_usd_month != null && Number(g.spent_this_month) > 0) row.appendChild(node('p', 'ag-src', 'Spent this month ' + cost(g.spent_this_month) + ' of a limit of ' + cost(g.cap_usd_month) + '.'));
  return row;
}

async function runNow(g, b, row) {
  b.disabled = true;
  const wait = node('p', 'quiet working', 'Running it now.');
  row.appendChild(wait);
  const r = await callRun({ action: 'now', agent_id: g.id });
  if (!r.ok) { wait.className = 'notice flagged'; wait.textContent = 'Not run: ' + (r.reason ?? r.error ?? 'no answer'); b.disabled = false; return; }
  const stop = C.followSteps(r.request_id, wait, row);
  const run = await follow(r.run_id);
  stop();
  if (run?.state !== 'done') { wait.className = 'notice flagged'; wait.textContent = 'It did not finish: ' + (run?.reason ?? 'no answer'); b.disabled = false; return; }
  work = await rpc('agent_work_list'); team = await rpc('agent_list');
  draw();
}

function workCard(it) {
  const card = node('div', 'ag-workcard');
  card.appendChild(node('b', null, it.title));
  const slot = node('div', 'ag-answer');
  C.renderAsk(slot, { ok: true, state: 'answered', answer: it.body, sources: it.sources ?? [] }, {});
  card.appendChild(slot);
  const said = node('p', 'quiet');
  const acts = node('div', 'ag-acts');
  const decide = async (a, b) => {
    b.disabled = true;
    const r = await rpc('agent_work_decide', { p_id: it.id, p_answer: a });
    if (!r.ok) { b.disabled = false; said.className = 'notice flagged'; said.textContent = 'Not saved: ' + (r.reason ?? 'no answer'); return; }
    work = await rpc('agent_work_list'); team = await rpc('agent_list'); draw();
  };
  const keep = btn('go', 'Keep', () => decide('kept', keep));
  const dis = btn('go ghost', 'Dismiss', () => decide('dismissed', dis));
  acts.append(keep, dis);
  card.append(acts, said, node('p', 'ag-src', 'Keep or Dismiss sends, invoices and pays nothing. Anything to send is a draft you send yourself.'));
  return card;
}

// ---- MAKING AN AGENT ----
function drawMake(main) {
  if (!making) making = { expert: 'cfo', id: null, ask: '', adjust: [], run: null };
  const m = making;
  main.appendChild(node('span', 'ag-badge', 'Making an agent'));
  main.appendChild(node('h3', 'ag-h2', m.run?.agent?.name || m.agent?.name || 'What do you need?'));
  const who = node('div', 'ag-who');
  who.appendChild(node('span', 'ag-lab', 'Belongs to'));
  for (const k of ORDER) {
    const c = btn('ag-chip' + (m.expert === k ? ' on' : ''), EX[k].t, () => { if (m.id) return; m.expert = k; draw(); });
    c.setAttribute('aria-pressed', String(m.expert === k));
    if (m.id && m.expert !== k) c.disabled = true;
    who.appendChild(c);
  }
  main.appendChild(who);
  if (legalKind(m.expert) && !agreed()) { drawAgreement(main); return; }
  const chat = node('div', 'ag-chat');
  if (!m.run && !m.busy) {
    const box = node('div', 'ag-box ag-box-big');
    const ta = node('textarea'); ta.rows = 4; ta.value = m.ask; ta.placeholder = 'For example: ' + EXAMPLE; ta.setAttribute('aria-label', 'Say what you need');
    ta.addEventListener('input', () => { m.ask = ta.value; });
    box.appendChild(ta);
    main.appendChild(box);
    const acts = node('div', 'ag-acts');
    acts.appendChild(btn('go ag-go', 'See what you would have got', () => { if (!m.ask.trim()) { ta.focus(); return; } startTry(); }));
    if (!m.ask) acts.appendChild(btn('go ghost', 'Use the month-end example', () => { m.ask = EXAMPLE; m.expert = 'cfo'; draw(); }));
    main.appendChild(acts);
    main.appendChild(node('p', 'ag-src', "It runs once on " + lastMonthWords() + "'s real records, as you: it sees only what you can see. Nothing is sent, invoiced or paid."));
    if (m.error) main.appendChild(node('p', 'notice flagged', m.error));
    return;
  }
  chat.appendChild(node('div', 'ag-say', m.ask));
  for (const a of m.adjust) chat.appendChild(node('div', 'ag-say', a));
  main.appendChild(chat);
  if (m.busy) {
    const tool = node('div', 'ag-tool');
    const wait = node('p', 'quiet working', 'Reading the question');
    tool.appendChild(wait);
    tool.appendChild(node('p', 'quiet', 'It works on ' + lastMonthWords() + "'s real records. This takes up to two minutes."));
    chat.appendChild(tool);
    m.waitEl = wait; m.waitSlot = tool;
    return;
  }
  const run = m.run;
  if (run.state !== 'done') {
    chat.appendChild(node('p', 'notice flagged', 'It could not show you a result: ' + (run.reason ?? 'no answer') + '. Nothing was kept as a job. Adjust the words and try again.'));
    adjustBox(main);
    return;
  }
  const tool = node('div', 'ag-tool');
  if (run.agent?.plan) {
    tool.appendChild(node('p', null, 'Here is how I would do it:'));
    tool.appendChild(node('p', 'ag-plan', run.agent.plan));
  }
  tool.appendChild(node('p', null, 'Here is what you would have got for ' + lastMonthWords() + ':'));
  chat.appendChild(tool);
  const res = node('div', 'ag-res');
  C.renderAsk(res, { ok: true, state: 'answered', answer: run.answer || '', sources: run.sources ?? [], completeness: run.completeness ?? [] }, {});
  main.appendChild(res);
  main.appendChild(node('p', 'ag-src', 'Worked out ' + when(run.finished_at) + ', in ' + Math.round(Number(run.ms || 0) / 1000) + ' seconds, with ' + (run.tool_calls ?? 0) + ' lookups. This preview cost ' + cost(run.cost_usd) + '.'));
  main.appendChild(card(run));
  adjustBox(main);
  const acts = node('div', 'ag-acts');
  const said = node('p', 'quiet');
  const start = btn('go ag-go', 'Start', async () => {
    start.disabled = true; said.className = 'quiet working'; said.textContent = 'Starting it.';
    const r = await rpc('agent_start', { p_id: run.agent_id });
    if (!r.ok) { start.disabled = false; said.className = 'notice flagged'; said.textContent = 'Not started: ' + (r.reason ?? 'no answer'); return; }
    team = await rpc('agent_list');
    sel = m.expert; making = null; draw();
  });
  acts.append(start, btn('go ghost', 'Not now', () => { making = null; sel = m.expert; draw(); }));
  main.append(acts, said);
}

function card(run) {
  const g = run.agent ?? {};
  const owner = !!C.isOwner();
  const c = node('dl', 'ag-card');
  const row = (k, v) => { c.append(node('dt', null, k), node('dd', null, v)); };
  row('Name', g.name || 'Your agent');
  row('Belongs to', 'Your ' + (EX[g.expert]?.t ?? '') + (g.tab && TAB_WORDS[g.tab] && g.tab !== 'agents' ? ' · shows on ' + TAB_WORDS[g.tab] : ''));
  row('When', g.schedule?.kind === 'on_demand' ? 'Only when you ask. To have it run by itself, say when below, for example: every Friday.' : (g.when || ''));
  row('Does', 'Gathers, compares, calculates and drafts');
  row('Never', 'Sends, invoices or pays without your yes');
  row('Sees', owner ? 'Only what you can see (as the owner, everything connected)' : 'Only what you can see');
  row('Costs', g.est_usd_month != null ? cost(g.est_usd_month) + ' a month, from what this preview cost' : cost(run.cost_usd) + ' each time it runs');
  return c;
}

function adjustBox(main) {
  const m = making;
  const box = node('div', 'ag-box');
  const ta = node('textarea'); ta.rows = 2; ta.placeholder = 'Tell it what to adjust, for example: also tell me who has not sent a timesheet by the 28th'; ta.setAttribute('aria-label', 'Adjust the agent');
  const b = btn('go ghost', 'Adjust', () => { const t = ta.value.trim(); if (!t) { ta.focus(); return; } m.adjust.push(t); startTry(t); });
  box.append(ta, b);
  main.appendChild(box);
}

async function callRun(body) {
  try {
    const { data } = await C.sb.auth.getSession();
    const jwt = data?.session?.access_token;
    if (!jwt) return { ok: false, reason: 'You are not signed in on this browser.' };
    const r = await fetch(C.url + '/functions/v1/agent-run', { method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    return j ?? { ok: false, reason: 'The Tool did not answer (' + r.status + ').' };
  } catch (e) { return { ok: false, reason: String(e?.message ?? e) }; }
}

// Follow one run until it is no longer running (about every 2 seconds, up to 5 minutes).
async function follow(runId) {
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    await new Promise((res) => setTimeout(res, 2000));
    const r = await rpc('agent_run_read', { p_run: runId });
    if (r?.ok && r.state !== 'running') return r;
    if (r?.ok === false && r.status === 'refused') return { state: 'refused', reason: r.reason };
  }
  return { state: 'failed', reason: 'it took longer than five minutes; it may still finish, look again in a moment' };
}

async function startTry(adjust) {
  const m = making;
  m.busy = true; m.error = null; m.run = null;
  draw();
  const r = await callRun({ action: 'try', expert: m.expert, ask: m.ask, ...(m.id ? { agent_id: m.id } : {}), ...(adjust ? { adjust } : {}) });
  if (!r.ok) {
    m.busy = false;
    if (r.reason === 'agreement') { agree = await rpc('help_agreement_read'); }
    m.error = 'It could not run: ' + (r.note ?? r.reason ?? r.error ?? 'no answer') + '.';
    if (adjust) m.adjust.pop();
    draw(); return;
  }
  m.id = r.agent_id;
  const stop = m.waitEl ? C.followSteps(r.request_id, m.waitEl, m.waitSlot) : () => {};
  const run = await follow(r.run_id);
  stop();
  m.busy = false; m.run = run;
  team = await rpc('agent_list');
  if (making === m && sel === 'make') draw();
}

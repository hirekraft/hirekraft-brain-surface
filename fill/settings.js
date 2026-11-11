// fill/settings.js - SETTINGS (seat setup-screens-2, 2026-11-10; decisions 1138, 1139; spec studio-walkers
// briefs/mockups/getting-started-spec-2.md, picture Settings R2rW1ZYXFKFw4TARDUcAnX v1794291119-7643; every word approved copy).
// After Ready, Getting started becomes Settings: the same cards and look, each row what it is, its current value (soft) and
// its action. ONE PATH: every Change is the function that choice already has (Top up with the card and automatic top-up in
// its sheet: ready.js topUp; the monthly limit: ai.js limitBlock through lens-ask ai_choose; connections: the Brain's own
// pages; language and emails: the switch beside her name, words.js; the guide's name: vera.js rename through
// getting_ready_mark). Nothing here writes anything of its own.
// ASK VERA TO CHANGE IT: a tap hands Vera the exact change, its price and the row's own function; she shows it in her column
// with Yes and Not now (vera.js window.veraPropose). Nothing changes until the owner presses Yes, and Yes is that same
// function. She never presses (1115).
// NOT BUILT (said as "coming", never as working, 1075): the plan as a subscription, statements, cancel, team invites.
// SEAT setup-wire (2026-11-10, decision 1141): Add 2 more years goes through lens-ask {search_go} (the balance read from the meter
// by the Tool, never sent by the page); Stop reading the old StratServ mailbox is source_mark_old (her yes first); Your answers
// shows the three answers as kept (understand_answers_suggest) with Change opening step 4; New mail says "Understood as it
// arrives" only for mailboxes with a pressed group (understand_progress_mine), otherwise "Not understood yet" (ruling 1141.4).
// A COLLEAGUE sees only her own language and emails (spec): no prices, no money rows, no presses on the business.
// No regex literals and no backslashes (STANDING-CLAUSES).
import { ic, card } from './setup.js?v=2026-11-10-setup-front-door';
import { topUpFor, balanceLeft, cardOf, monthlyOf, understandModel, openStep, brainDoor } from './ready.js?v=2026-11-11-setup-one-path';
// SEAT ready-never-spins (2026-11-11): every brain call here goes through ready.js brainDoor (a real promise that cannot throw). The
// client's own rpc call object has then and no catch: the two presses below that put .catch on it (Mark it old, the guide's name)
// threw on press.
const rpc = (name, args) => brainDoor(C.sb, name, args);
import { screenLangName } from './words.js?v=2026-10-29-thinkrooms-3';

const DOT = String.fromCharCode(183);
const AP = String.fromCharCode(8217);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd2 = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + x.toFixed(2) : null; };
const usd0 = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + Math.round(x).toLocaleString('en-US') : null; };
let C = null, S = null, host = null;

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function btn(cls, text, fn) { const b = el('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
function p(cls, text) { return el('p', cls, text); }
function fold(q, a) { const d = el('details', 'gr-why'); d.appendChild(el('summary', null, q)); const b = el('div'); b.appendChild(p(null, a)); d.appendChild(b); return d; }
function toast(text) { C.$('#gr-toast')?.remove(); const t = el('div', 'gr-toast', text); t.id = 'gr-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); setTimeout(() => t.remove(), 4200); }
const coming = () => el('span', 'gs-coming', 'coming');
// One row: what it is, its value (soft), its action (a link button, or "coming"). An open row draws its part under it.
function row(what, value, action) {
  const r = el('div', 'st-row');
  r.append(el('b', null, what), el('span', null, value ?? ''));
  if (action) r.appendChild(action);
  return r;
}
function link(text, fn) { return btn('gr-link', text, fn); }
function openUnder(r, part) { const nx = r.nextElementSibling; if (nx && nx.classList.contains('st-open')) { nx.remove(); return; } const d = el('div', 'st-open'); d.appendChild(part); r.after(d); }

// ---------------------------------------------------------------------------------------------------------------------
// THE READINGS: the same ones Getting started and the Brain make, nothing new.
async function read() {
  const R = { owner: C.isOwner() };
  const jobs = [
    C.readSources(C.sb, true).then((v) => { R.src = v; }, (e) => { R.srcErr = e; }),
    rpc('getting_ready_marks').then(({ data }) => { if (data && data.ok === true) R.marks = data; }, () => {}),
    rpc('thoughtgram_emails_state').then(({ data }) => { R.mail = data; }, () => {}),
  ];
  if (R.owner) {
    jobs.push(rpc('brain_road').then(({ data }) => { if (data && data.ok === true) R.road = data; }, () => {}));
    jobs.push(rpc('connector_status').then(({ data }) => { R.conn = data; }, () => {}));
    jobs.push(C.askBody({ ai_tab: true }).then((r) => { if (r && r.ok === true && r.ai && r.ai.ok === true) R.ai = r.ai; else R.aiErr = r?.error ?? 'no reason was given'; }, (e) => { R.aiErr = e?.message ?? String(e); }));
    jobs.push(C.askBody({ read_estimate: { months: 24 } }).then((r) => { if (r && r.ok === true) R.est = r; }, () => {}));
    jobs.push(rpc('understand_progress_mine').then(({ data, error }) => { if (!error && data && data.ok === true) R.uprog = data.sources ?? []; else R.uprogErr = error?.message ?? data?.note ?? 'no reason was given'; }, (e) => { R.uprogErr = e?.message ?? String(e); }));
    jobs.push(rpc('understand_answers_suggest', { p_identity: null }).then(({ data, error }) => { R.uans = error ? { ok: false, note: error.message } : data; }, (e) => { R.uans = { ok: false, note: String(e?.message ?? e) }; }));
  }
  await Promise.all(jobs);
  return R;
}
const guide = () => { const m = S?.marks?.mine?.guide_name; const n = String(m?.value?.name ?? '').trim(); return n || String(document.body.dataset.guide || '').trim() || 'Vera'; };

// ---------------------------------------------------------------------------------------------------------------------
// THE PAGE
export async function mount(c) {
  C = c;
  host = C.$('#st');
  if (!host) return;
  document.body.classList.add('st-on');
  host.replaceChildren(p('working no-late', 'Reading your settings'));
  S = await read();
  draw();
}
export function unmount() { document.body.classList.remove('st-on'); }

function draw() {
  const main = el('div', 'gr-main');
  const top = el('div', 'gs-top');
  const lab = el('span', 'am-lab'); lab.append(ic('key'), document.createTextNode('Verrandi ' + DOT + ' Settings'));
  top.appendChild(lab);
  main.append(top, el('h1', 'gr-h', 'Settings'));
  if (!S.owner) {
    main.append(p('gr-lead', 'Your own language and the emails the Tool sends you. Everything else is set by your business owner.'), teamCard(false));
  } else {
    main.append(p('gr-lead', 'Everything you chose during setup, in one place. Change anything here, or just ask ' + guide() + '.'));
    main.append(askCard(), dbCard(), moneyCard(), connCard(), underCard(), answersCard(), teamCard(true), planCard(), whoCard(), leaveCard(), questions());
  }
  // HER COLUMN: vera.js moves the one conversation panel into any shown element carrying data-vera-column.
  const vera = el('aside', 'gr-vera'); vera.id = 'st-vera'; vera.setAttribute('data-vera-column', ''); vera.setAttribute('aria-label', guide() + ', your guide');
  const vh = el('div', 'gr-vh'); const t = el('span'); t.append(el('b', null, guide()), el('small', null, 'your guide'));
  vh.append(el('span', 'gr-av', guide().slice(0, 1).toUpperCase()), t);
  vera.append(vh, p('gr-vnote', 'Say what you want in your own words. I show you the change and its price, and do it when you say yes.'));
  const grid = el('div', 'gr-grid'); grid.append(main, vera);
  host.replaceChildren(grid);
}

// ASK VERA TO CHANGE IT (blue fill): the example taps, each a proposal with the row's own function.
function askCard() {
  const c = card('chat', 'Ask ' + guide() + ' to change it', null, p(null, 'Say what you want in your own words. ' + guide() + ' shows you the change and its price, and does it when you say yes.'));
  c.classList.add('gs-blue');
  const ex = el('div', 'gs-ex');
  const old = (S.src?.rows ?? []).find((r) => r.group === 'email' && String(r.name || r.source_key).toLowerCase().includes('stratserv'));
  for (const [label, fn] of [['Raise my monthly limit to $100', proposeLimit], ['Add 2 more years of mail', proposeYears], [old ? 'Stop reading the old StratServ mailbox' : 'Stop reading an old mailbox', proposeOld], ['Call yourself Max', proposeName]]) {
    ex.appendChild(btn('gr-amt', label, () => fn(label)));
  }
  c.appendChild(ex);
  return c;
}
function propose(P) {
  if (typeof window.veraPropose === 'function') { window.veraPropose(P); return; }
  toast(guide() + ' could not be opened just now. Use the row' + AP + 's own Change instead.');
}
// The monthly limit: the same door the limit row uses (lens-ask ai_choose, step 'monthly AI limit').
function proposeLimit(asked) {
  const L = S.ai?.limit;
  const now = L?.set === true ? usd0(L.limit_usd) + ' a month' : 'no limit';
  propose({ asked, say: 'Here is the change. It costs nothing by itself.', lines: [['Monthly AI limit', now + ' ' + String.fromCharCode(8594) + ' $100 a month']],
    yes: async () => { const r = await C.askBody({ ai_choose: { step: 'monthly AI limit', model: '100', confirm: true } }); const ch = r?.choice; const ok = !!(r && r.ok === true && ch && ch.ok === true); if (ok) setTimeout(() => mount(C), 2500); return { ok, note: ok ? String(ch.say || 'Changed.') : 'Not changed: ' + String(r?.error ?? ch?.reason ?? 'no reason was given') + '.' }; } });
}
// Two more years: search_go for 4 years, preview first (the same press as Getting started step 3), Yes confirms it.
async function proposeYears(asked) {
  // through lens-ask (ruling 1141.5): the Tool reads the balance from the meter itself; the page sends none
  const ask = async (confirm) => { const r = await C.askBody({ search_go: { months: 48, sources: null, confirm } }); return r && r.ok === true ? { data: r } : { error: { message: String(r?.note ?? r?.reason ?? r?.error ?? 'no reason was given') } }; };
  const { data, error } = await ask(false);
  if (error || !data || data.ok !== true) { propose({ asked, say: 'This cannot be done just now: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '. Nothing was changed.' }); return; }
  if (data.nothing_to_read) { propose({ asked, say: 'Your last 4 years are already searchable. Nothing to change.' }); return; }
  propose({ asked, say: 'Here is the change and its price, one time.', lines: [['Make searchable', '4 years of mail and files'], ['Items', num(data.total_items)], ['Price, one time', usd2(data.total_usd)], ['Time', data.minutes === null || data.minutes === undefined ? 'measuring' : 'about ' + num(data.minutes) + ' minutes']],
    yes: async () => { const r = await ask(true); const ok = !r.error && r.data && r.data.ok === true; return { ok, note: ok ? String(r.data.note || 'Started. You get one short email when it is done.') : 'Not started: ' + String(r.error?.message ?? r.data?.note ?? r.data?.reason ?? 'no reason was given') + '.' }; } });
}
// An old mailbox: Old, searchable only (source_mark_old, the same press as step 3's row). Free; nobody else can then find it.
function proposeOld(asked) {
  const boxes = (S.src?.rows ?? []).filter((r) => r.group === 'email');
  const old = boxes.find((r) => String(r.name || r.source_key).toLowerCase().includes('stratserv'));
  if (!old) { propose({ asked, say: 'Tell me which mailbox, or use Old, searchable only on its row in Getting started, step 3. Nothing was changed.' }); return; }
  const name = String(old.name || old.source_key);
  propose({ asked, say: 'Here is the change. It is free, and it makes what is left to make searchable cheaper.', lines: [['Mailbox', name], ['Old, searchable only', 'you can search it; nobody else can, and it gets no privacy check']],
    yes: async () => { const { data, error } = await rpc('source_mark_old', { p_source_key: old.source_key, p_old: true, p_identity: null }); const ok = !error && data && data.ok === true; if (ok) setTimeout(() => mount(C), 1500); return { ok, note: ok ? String(data.note || 'Marked old, searchable only.') : 'Not changed: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.' }; } });
}
// The guide's name: getting_ready_mark guide_name, the same as "Call me something else". Free.
function proposeName(asked) {
  propose({ asked, say: 'Here is the change. It is free.', lines: [['Your guide' + AP + 's name', guide() + ' ' + String.fromCharCode(8594) + ' Max']],
    yes: async () => { const { data, error } = await rpc('getting_ready_mark', { p_key: 'guide_name', p_value: { name: 'Max' }, p_wording: null }); const ok = !error && data && data.ok === true; if (ok) { document.body.dataset.guide = 'Max'; setTimeout(() => mount(C), 1500); } return { ok, note: ok ? 'From now on I am Max. Change it here any time.' : 'Not changed: ' + String(error?.message ?? data?.note ?? data?.reason ?? 'no reason was given') + '.' }; } });
}

// YOUR DATABASE
function dbCard() {
  const d = S.ai?.cost?.database;
  const val = 'about ' + (d?.known && Number.isFinite(Number(d.estimate_usd)) ? usd0(d.estimate_usd) : '$25') + ' a month' + (d?.known && Number.isFinite(Number(d.size_gb)) ? ' ' + DOT + ' ' + String(d.size_gb) + ' GB used' : '');
  const a = el('a', 'gr-link', 'Open my Supabase'); a.href = 'https://supabase.com/dashboard/projects'; a.target = '_blank'; a.rel = 'noopener';
  return card('database', 'Your database', null, row('Supabase, in your own account', val, a),
    el('p', 'am-small', d?.known ? 'From Supabase' + AP + 's published price and your database' + AP + 's size; the exact figure is on their invoice.' : 'Supabase' + AP + 's price; the exact figure is on their invoice.'));
}
// MONEY: the balance, the card and automatic top-up all open the one Top up sheet; the limit is the AI tab's own block.
function moneyCard() {
  const R = { ai: S.ai, marks: S.marks };
  const bal = balanceLeft(R), cd = cardOf(R), A = cd?.auto || {};
  const c = card('coin', 'Money', null);
  c.appendChild(row('AI balance', bal === null ? 'not read' : usd2(bal), link('Top up', () => topUpFor(C, R))));
  c.appendChild(row('Card', cd?.card ? String(cd.card) : 'No card yet', link(cd?.card ? 'Change' : 'Add a card', () => topUpFor(C, R))));
  c.appendChild(row('Automatic top-up', A.on ? 'On' : 'Off', link('Change', () => topUpFor(C, R))));
  const L = S.ai?.limit;
  const lr = row('Monthly AI limit', L?.set === true ? usd0(L.limit_usd) + ' a month' : 'No limit', null);
  lr.appendChild(link(L?.set === true ? 'Change' : 'Set a limit', () => {
    if (!L) { openUnder(lr, p('gr-small', 'Your monthly AI limit could not be read just now' + (S.aiErr ? ' (' + String(S.aiErr) + ')' : '') + '.')); return; }
    import('./ai.js?v=2026-11-05-brain-tab-room').then((M) => openUnder(lr, M.limitBlock(L, { el: (t, k) => el(t, k), askBody: C.askBody }, () => mount(C)))).catch(() => openUnder(lr, p('gr-small', 'Your monthly AI limit could not be shown just now.')));
  }));
  c.appendChild(lr);
  c.appendChild(row('This month so far', L && Number.isFinite(Number(L.spent_usd)) ? usd2(L.spent_usd) : '', link('Open', () => { C.goto('s-summary', 'panel'); C.roomPage('month'); })));
  if (S.aiErr) c.appendChild(p('gr-small', 'The money figures could not be read just now (' + String(S.aiErr) + ').'));
  return c;
}
// CONNECTIONS: from the one reading of sources; each Change is the Brain's own page for it.
function connCard() {
  const rows = S.src?.rows ?? [];
  const n = (g) => rows.filter((r) => r.group === g).length;
  const from = String(S.road?.mail?.from || '').slice(0, 4);
  const go = (k) => () => { C.goto('s-summary', 'panel'); if (k === 'add') C.goto('s-connect'); else C.roomPage(k); };
  const c = card('link', 'Connections', null);
  c.appendChild(row('Mail', n('email') ? num(n('email')) + (n('email') === 1 ? ' mailbox' : ' mailboxes') + (from ? ' ' + DOT + ' since ' + from : '') : 'Not connected', link(n('email') ? 'Change' : 'Connect', go(n('email') ? 'mail' : 'add'))));
  c.appendChild(row('Drives', n('drives') ? num(n('drives')) + (n('drives') === 1 ? ' drive' : ' drives') : 'Not connected', link(n('drives') ? 'Change' : 'Connect', go(n('drives') ? 'drives' : 'add'))));
  c.appendChild(row('Calendar and contacts', [n('calendar') ? 'Calendar connected' : '', n('contacts') ? 'Contacts connected' : ''].filter(Boolean).join(' ' + DOT + ' ') || 'Not connected', link(n('calendar') || n('contacts') ? 'Change' : 'Connect', go(n('calendar') || n('contacts') ? 'calendar' : 'add'))));
  c.appendChild(row('Systems', n('systems') ? num(n('systems')) + (n('systems') === 1 ? ' system' : ' systems') : 'Not connected', link(n('systems') ? 'Change' : 'Connect', go(n('systems') ? 'systems' : 'add'))));
  const saves = Number(S.conn?.saves) || 0;
  c.appendChild(row('Your AI chats', saves ? num(saves) + ' saved' : 'None added', link(saves ? 'Change' : 'Add', go('chats'))));
  c.appendChild(row('Your Claude', 'Ask your brain from inside Claude', link('Connect', go('assistadd'))));
  c.appendChild(el('p', 'am-small', 'Anything you add shows its price before it is read.'));
  return c;
}
// UNDERSTANDING
function underCard() {
  const U = S.road?.understood || {};
  const parts = [Number(U.mail) ? num(U.mail) + ' emails' : '', Number(U.files) ? num(U.files) + ' files' : '', Number(U.records) ? num(U.records) + ' records' : ''].filter(Boolean);
  const M = monthlyOf({ est: S.est });
  const c = card('brain', 'Understanding', null);
  c.appendChild(row('What is understood', S.road ? (parts.length ? parts.join(', ') : 'Nothing yet') : 'not read', link('Change', () => { C.goto('s-summary', 'panel'); C.roomPage('step', 'u'); })));
  // ruling 1141.4: only mailboxes with a pressed group are understood as mail arrives (understand_progress_mine: groups kept and not stopped)
  const boxes = (S.src?.rows ?? []).filter((r) => r.group === 'email');
  const pressed = new Set((S.uprog ?? []).filter((x) => Array.isArray(x.groups) && x.groups.length && x.state !== 'stopped').map((x) => x.source_key));
  const yes = boxes.filter((r) => pressed.has(r.source_key));
  const nm = (r) => String(r.name || r.source_key).split(':').pop();
  const nv = !S.uprog ? 'not read' : !yes.length ? 'Not understood yet' : yes.length === boxes.length ? 'Understood as it arrives' + (M !== null ? ' ' + DOT + ' about ' + usd2(M) + ' a month, estimated' : '') : 'Understood as it arrives in ' + num(yes.length) + ' of ' + num(boxes.length) + ' mailboxes';
  c.appendChild(row('New mail', nv, null));
  if (S.uprog && yes.length && yes.length < boxes.length) c.appendChild(el('p', 'am-small', 'Not understood yet: ' + boxes.filter((r) => !pressed.has(r.source_key)).map(nm).join(', ') + '.'));
  if (!S.uprog && S.uprogErr) c.appendChild(el('p', 'am-small', 'What is understood as it arrives could not be read just now (' + String(S.uprogErr) + ').'));
  const m = understandModel({ ai: S.ai });
  c.appendChild(row('The AI that does the work', m || 'not read', link('Change', () => C.goTab('ai'))));
  return c;
}
// YOUR ANSWERS: the three answers of step 4 as kept (understand_answers_suggest answers); Change opens step 4 (one path).
const FOR = { everything: 'Everything', sales: 'Sales', accounting: 'Accounting', hiring: 'Hiring', old: 'Old, searchable only' };
const WITH = { businesses: 'Businesses', people: 'People', both: 'Both' };
function answersCard() {
  const c = card('tag', 'Your answers', null);
  const A = S.uans?.ok === true ? S.uans.answers : null;
  const ch = () => link('Change', () => openStep(C, 'understand'));
  if (S.uans && S.uans.ok !== true) c.appendChild(p('gr-small', 'Your answers could not be read just now (' + String(S.uans.note ?? S.uans.reason ?? 'no reason was given') + ').'));
  const mb = A?.mailboxes && typeof A.mailboxes === 'object' ? Object.entries(A.mailboxes).map(([k, v]) => k.split(':').pop() + ' ' + (FOR[v] || v)).join(', ') : '';
  c.appendChild(row('What each mailbox is for', mb || 'Not answered yet', ch()));
  c.appendChild(row('Who you work with', A?.work_with ? (WITH[A.work_with] || A.work_with) : 'Not answered yet', ch()));
  c.appendChild(row('Your money paperwork', Array.isArray(A?.money_words) && A.money_words.length ? A.money_words.join(', ') : 'Not answered yet', ch()));
  c.appendChild(el('p', 'am-small', guide() + ' uses these to sort what is worth reading.'));
  return c;
}
// YOU AND YOUR TEAM: language and emails are the switch beside her name (the one place they change); the guide's name is
// vera.js's rename. An owner also sees Your guide and Your team.
function teamCard(owner) {
  const c = card('person', owner ? 'You and your team' : 'You', null);
  const sw = () => { const b = C.$('#whoami .lang-switch'); if (b) { b.scrollIntoView?.({ block: 'nearest' }); b.click(); } else toast('The language switch is beside your name at the top.'); };
  c.appendChild(row('Language', screenLangName(), link('Change', sw)));
  if (owner) {
    c.appendChild(row('Your guide', guide(), link('Change', () => { if (typeof window.veraRename === 'function') window.veraRename(); else toast(guide() + ' could not be opened just now.'); })));
    c.appendChild(row('Your team', 'Invite', coming()));
  }
  const on = S.mail && typeof S.mail.on === 'boolean' ? (S.mail.on ? 'On' : 'Off') : 'not read';
  c.appendChild(row('Emails from the Tool', on, link('Change', sw)));
  return c;
}
function planCard() { return card('coin', 'Your plan', null, row('The Tool', 'Your plan', coming()), row('Statements', '', coming())); }
function whoCard() { return card('shield', 'Who sees what', null, row('Your Access Map, in Security', 'Everyone sees only what they can already open', link('Open Security', () => { try { location.hash = '#security'; } catch (_) { /* the tab still opens */ } C.goTab('security'); }))); }
function leaveCard() { return card('hand', 'Leaving', null, row('What you keep', 'Your database and everything in it', null), row('Stop using Verrandi', 'Your data stays yours', (() => { const d = el('span', 'gs-coming', 'Cancel: coming'); return d; })())); }
function questions() {
  const d = el('div', 'gs-qs');
  d.append(el('h2', 'am-h2', 'Questions'),
    fold('Does a change cost anything?', 'Only if it reads more. Then you see the price first, and nothing is read until you say yes.'),
    fold('Where do I see how things are running?', 'On the Brain: green, yellow and red, always with words.'),
    fold('Can my team change settings?', 'Only the owner changes money, connections and what is understood. Everyone can change their own language and emails.'));
  return d;
}

// THE MASTHEAD LINK (spec: the way back and routing). Until Ready: Getting started. After Ready: Settings, in its place.
export function mastLink(c, notReady) {
  const head = c.$('.masthead');
  if (!head) return;
  let b = c.$('#st-mast');
  if (!b) { b = el('button', 'gr-link st-mast'); b.type = 'button'; b.id = 'st-mast'; const at = c.$('#brain-engine'); if (at) at.after(b); else head.appendChild(b); }
  b.textContent = notReady ? 'Getting started' : 'Settings';
  b.onclick = () => c.goto(notReady ? 's-ready' : 's-settings');
}

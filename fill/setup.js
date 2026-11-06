// fill/setup.js - THE BRAIN TAB'S FIRST STATE FOR A NEW CUSTOMER (seat brain-tab-setup, 2026-11-05, decision 1084 amended).
// Part of SHOW. Built to the approved Brain Setup mock-up (artifact QsaZceyMaQ3MCdbwSNGPgn, version 1793838762-bef0,
// copy in studio-walkers briefs/mockups/brain-setup.html): one step per screen, a short bubble with Tell me more, one
// button, and How the Tool works as the scrolling story, which also opens on its own from #how.
//
// WHEN IT SHOWS (lens.js decides, not this file): while the signed-in brain has no connected source (the same count
// routeOnState always used, from the one reading), or when she comes back from a provider's sign-in she started on the
// Connect step here (a 30-minute marker in this browser, consumed once), or when #setup is opened. A brain that has
// sources never lands here on its own, so HireKraft's owner sees it only through How the Tool works or #setup.
//
// WHAT IS REAL TODAY, AND WHAT WAITS (decision 1075: a control whose back end does not exist yet is left out):
//   Welcome, How the Tool works, Back and Continue: real.
//   Your database: the brain she is signed into exists, so the step says so and continues. 'Create my database' (one
//     Supabase sign-in that makes the database in her own account) waits on Verrandi's Supabase app: ON.database_signin.
//   Connect: real. Each row opens the Tool's one connect flow (lens.js openConnect, the Brain tab's Add a source) and
//     shows Connected from the one reading (sources_view counts). Only kinds that can be connected today are listed.
//   Your first $20 of AI credit: waits on Verrandi's Stripe account: ON.card. While off, the step is not shown at all.
//   Find and Understand prices: Find and Understand per 10,000 emails are HireKraft's measured averages (studio-core
//     read_cost_rate, measured 2026-10-23: embed_mail 0.0000285 USD; mail_message 0.00386 + 0.53 attachments x 0.00474).
//     Her own prices for 6 months, 2 years and everything come live from lens-ask {read_estimate}; with nothing counted
//     yet the step says when they appear, never an example figure (decision 1076).
//   Understanding the past, the monthly AI limit: not started from here. Understanding spends AI money, which waits on the
//     card (decision 1084 amended: Verrandi never pays for it); there is no AI limit control in the brain yet.
//   Ready: Open my Mail and Connect my Claude (the Chats tab's Connect your Claude part) are real.
// No regex literals and no backslashes (STANDING-CLAUSES: the write tool).

export const ON = { database_signin: false, card: false };

const RETURN_KEY = 'tool.setup.return';
const RETURN_MS = 30 * 60 * 1000;
const money0 = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('en-US');
const num = (n) => Number(n || 0).toLocaleString('en-US');

// Coming back from a sign-in started here: true once, within 30 minutes, in this browser.
export function returning() {
  try {
    const at = Number(localStorage.getItem(RETURN_KEY) || 0);
    localStorage.removeItem(RETURN_KEY);
    return at > 0 && Date.now() - at < RETURN_MS;
  } catch (_) { return false; }
}
function markReturn() { try { localStorage.setItem(RETURN_KEY, String(Date.now())); } catch (_) { /* this visit only */ } }

const LIBRARY = '<svg class="art" viewBox="0 0 420 160" aria-hidden="true"><g font-family="Figtree,system-ui" font-size="12.5" font-weight="700">'
  + '<rect x="10" y="20" width="120" height="110" rx="16" fill="var(--su-read-2)"/><text x="70" y="44" text-anchor="middle" fill="var(--su-read)">FIND</text>'
  + '<g fill="var(--su-card)" stroke="var(--su-read)" stroke-width="1.2"><rect x="30" y="58" width="80" height="14" rx="4"/><rect x="30" y="78" width="80" height="14" rx="4"/><rect x="30" y="98" width="80" height="14" rx="4"/></g>'
  + '<text x="70" y="148" text-anchor="middle" fill="var(--su-soft)" font-weight="500">search by meaning</text>'
  + '<rect x="150" y="20" width="120" height="110" rx="16" fill="var(--su-warn-2)"/><text x="210" y="44" text-anchor="middle" fill="var(--su-warn)">UNDERSTAND</text>'
  + '<rect x="170" y="58" width="80" height="54" rx="6" fill="var(--su-card)" stroke="var(--su-warn)" stroke-width="1.2"/><rect x="180" y="66" width="44" height="12" rx="6" fill="var(--su-warn)"/><rect x="180" y="84" width="58" height="12" rx="6" fill="var(--su-warn)" opacity=".55"/>'
  + '<text x="210" y="148" text-anchor="middle" fill="var(--su-soft)" font-weight="500">the librarian labels</text>'
  + '<rect x="290" y="20" width="120" height="110" rx="16" fill="var(--su-ok-2)"/><text x="350" y="44" text-anchor="middle" fill="var(--su-ok)">REASON</text>'
  + '<path d="M318 62h64a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8h-40l-14 12v-12h-10a8 8 0 0 1-8-8V70a8 8 0 0 1 8-8z" fill="var(--su-card)" stroke="var(--su-ok)" stroke-width="1.2"/>'
  + '<text x="350" y="88" text-anchor="middle" fill="var(--su-ok)">answer</text>'
  + '<text x="350" y="148" text-anchor="middle" fill="var(--su-soft)" font-weight="500">a colleague answers</text></g></svg>';
const DB = '<svg class="art" viewBox="0 0 400 150" aria-hidden="true"><ellipse cx="200" cy="118" rx="80" ry="16" fill="var(--su-db-2)" stroke="var(--su-db)" stroke-width="2"/>'
  + '<rect x="120" y="48" width="160" height="70" fill="var(--su-db-2)"/><line x1="120" y1="48" x2="120" y2="118" stroke="var(--su-db)" stroke-width="2"/><line x1="280" y1="48" x2="280" y2="118" stroke="var(--su-db)" stroke-width="2"/>'
  + '<ellipse cx="200" cy="48" rx="80" ry="16" fill="var(--su-card)" stroke="var(--su-db)" stroke-width="2"/></svg>';
const ART = {
  welcome: '<svg class="art" viewBox="0 0 400 150" aria-hidden="true"><circle cx="200" cy="75" r="50" fill="var(--su-ok)"/>'
    + '<path d="M177 75c0-14 9-23 20-23 4-6 17-7 22 0 11 0 17 9 15 19 7 5 7 17-1 22 0 9-9 15-18 13-5 6-17 6-22 0-11 2-18-6-17-15-7-4-7-13 1-16z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>'
    + '<g fill="var(--su-card)" stroke="var(--su-line)" stroke-width="1.5"><circle cx="70" cy="40" r="18"/><circle cx="330" cy="40" r="18"/><circle cx="70" cy="112" r="18"/><circle cx="330" cy="112" r="18"/></g>'
    + '<g stroke="var(--su-ok)" stroke-width="2" stroke-dasharray="4 5" opacity=".6"><line x1="88" y1="46" x2="152" y2="66"/><line x1="312" y1="46" x2="248" y2="66"/><line x1="88" y1="106" x2="152" y2="86"/><line x1="312" y1="106" x2="248" y2="86"/></g></svg>',
  card: '<svg class="art" viewBox="0 0 400 150" aria-hidden="true"><rect x="120" y="35" width="160" height="95" rx="14" fill="var(--su-card)" stroke="var(--su-line)" stroke-width="2"/><rect x="120" y="55" width="160" height="18" fill="var(--su-line)"/><rect x="138" y="95" width="60" height="12" rx="6" fill="var(--su-ok)"/></svg>',
  understand: '<svg class="art" viewBox="0 0 400 150" aria-hidden="true"><rect x="40" y="40" width="96" height="70" rx="12" fill="var(--su-card)" stroke="var(--su-line)"/>'
    + '<text x="88" y="72" text-anchor="middle" style="font:600 12px Figtree,system-ui;fill:var(--su-soft)">Before: an email</text><text x="88" y="90" text-anchor="middle" style="font:500 11px Figtree,system-ui;fill:var(--su-soft)">PDF attached</text>'
    + '<path d="M146 75h44" stroke="var(--su-warn)" stroke-width="3"/><path d="M190 67l12 8-12 8z" fill="var(--su-warn)"/>'
    + '<g font-family="Figtree,system-ui" font-size="13" font-weight="600"><rect x="215" y="22" width="150" height="28" rx="14" fill="var(--su-warn-2)"/><text x="290" y="41" text-anchor="middle" fill="var(--su-warn)">Invoice</text>'
    + '<rect x="215" y="61" width="150" height="28" rx="14" fill="var(--su-warn-2)"/><text x="290" y="80" text-anchor="middle" fill="var(--su-warn)">from a supplier</text>'
    + '<rect x="215" y="100" width="150" height="28" rx="14" fill="var(--su-warn-2)"/><text x="290" y="119" text-anchor="middle" fill="var(--su-warn)">due, then paid</text></g></svg>',
  bills: '<svg class="art" viewBox="0 0 400 150" aria-hidden="true"><rect x="70" y="30" width="110" height="100" rx="14" fill="var(--su-db-2)" stroke="var(--su-db)" stroke-width="2"/><text x="125" y="86" text-anchor="middle" style="font:700 30px Figtree,system-ui;fill:var(--su-db)">1</text>'
    + '<rect x="220" y="30" width="110" height="100" rx="14" fill="var(--su-ok-2)" stroke="var(--su-ok)" stroke-width="2"/><text x="275" y="86" text-anchor="middle" style="font:700 30px Figtree,system-ui;fill:var(--su-ok)">2</text></svg>',
  ready: '<svg class="art" viewBox="0 0 400 150" aria-hidden="true"><circle cx="200" cy="75" r="52" fill="var(--su-ok)"/><path d="M176 77l17 17 34-36" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// The kinds that can be connected today, each opening the one connect flow. Counts come from the one reading.
const CONNECT = [
  { group: 'email', name: 'Your mail', sub: 'Type your address, then sign in with Google' },
  { group: 'drives', name: 'Your files', sub: 'Google Drive: shared drives and folders' },
  { group: 'calendar', name: 'Your calendar and contacts', sub: 'Through your own Google sign-in' },
  { group: 'systems', name: 'Accounting and other systems', sub: 'QuickBooks, Wise and others' },
];

let C = null, cur = 0, story = null;

function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
function btn(text, cls, on) { const b = h('button', cls); b.type = 'button'; b.textContent = text; if (on) b.addEventListener('click', on); return b; }
function para(text, cls) { const p = h('p', cls); p.textContent = text; return p; }
// Words and bold words in one line, each its own text node, so the screen's language reaches every piece (no markup in strings).
function rich(parts, cls) { const p = h('p', cls); for (const [t, b] of parts) { const n = b ? h('b') : document.createTextNode(t); if (b) n.textContent = t; p.append(n); } return p; }
function strong(lead, rest, cls) { const p = h('p', cls); const b = h('b'); b.textContent = lead; p.append(b, document.createTextNode(rest ? ' ' + rest : '')); return p; }

// The bubble: one question, a short answer, Tell me more for the rest.
function bubble(q, short, long) {
  const bb = h('div', 'su-bub');
  const ask = btn(q, 'su-q');
  ask.setAttribute('aria-expanded', 'false');
  const s = h('p', 'su-short'); s.textContent = short + ' ';
  const more = btn('Tell me more', 'su-tm');
  s.appendChild(more);
  const l = h('div', 'su-long');
  for (const t of long) l.appendChild(para(t));
  ask.addEventListener('click', () => { const o = bb.classList.toggle('open'); if (!o) bb.classList.remove('more'); ask.setAttribute('aria-expanded', o ? 'true' : 'false'); });
  more.addEventListener('click', () => bb.classList.add('more'));
  bb.append(ask, s, l);
  return bb;
}
function box(left, right) {
  const b = h('div', 'su-box');
  const l = h('div'); for (const x of left) l.appendChild(x);
  b.appendChild(l);
  if (right) b.appendChild(right);
  return b;
}
function priceLine(label, price, per) {
  const d = h('div'); const s = para(label, 'su-small su-soft'); const p = h('div', 'su-price'); p.textContent = price;
  if (per) { const x = h('span', 'su-small su-soft'); x.textContent = ' ' + per; p.appendChild(x); }
  d.append(s, p); return [d];
}

function counted() {
  const groups = C.shape()?.groups ?? [];
  const by = {};
  for (const g of groups) by[g.key] = Number(g.count ?? 0);
  return by;
}

// THE STEPS. Each returns its card's children; nav is added by draw().
const STEPS = [
  { key: 'welcome', name: 'Welcome', next: 'Start', draw: () => [
    h('div', '', ART.welcome),
    h('h1', '', "Let's build your company's brain."),
    para('One place that holds everything your business knows: your mail, your files, your calendar, your books. It finds anything in seconds, keeps track of what is owed and promised, and answers your questions with the proof attached.'),
    strong('Setting up takes about 15 minutes.', 'Then the Tool reads in the background: a few hours for a small business, a few days if you have years of mail. You can start right away; it always tells you how far back it has read.'),
    para('At every step you see what happens and what it costs, and nothing is spent without your yes.'),
    bubble('What does this mean?', 'Your mail, files, calendar and books come together in one place that you own. Then you ask it anything, like a colleague who read everything.',
      ["Today your business lives in many places: mailboxes, drives, the accounting system, people's heads. The Tool reads them into one brain, keeps every fact linked to where it came from, and answers in plain words with the sources shown.",
        'You decide what it reads, how far back, which AI it uses and how much it may spend. Who in your company can see what follows your own systems, and the Security tab shows it.']),
  ] },
  { key: 'database', name: 'Your database', next: () => (ON.database_signin ? 'Create my database' : 'Continue'), draw: () => [
    h('div', '', DB.replace('</svg>', '<text x="200" y="92" text-anchor="middle" style="font:700 14px Figtree,system-ui;fill:var(--su-db)">yours</text></svg>')),
    h('h1', '', 'First, a home for your brain that belongs to you.'),
    para('Everything the Tool learns is kept in your own database, in your own account. You pay the database company directly. We never own it.'),
    box(priceLine('Your database, by Supabase', 'about $25', '/ month'), para('paid to Supabase, on your card', 'su-small su-soft')),
    strong('Cancel any time. Your brain stays yours.'),
    ON.database_signin ? null : strong('Your database is already set up.', 'You are signed in to it now.', 'su-ok-line'),
    bubble('Why my own database?', 'So it is always yours. Leave the Tool any time and you keep everything.',
      ['You keep more than your emails and files. You keep what the Tool worked out about each one: what it is, who it is about, which client, and its search fingerprint. That labelled data is valuable, and any AI you choose later can use it.',
        'One sign-in with Supabase is all it takes. The Tool sets the database up inside your own account; you never deal with anything technical.']),
  ] },
  { key: 'connect', name: 'Connect', next: 'Continue', ready: () => Object.values(counted()).some((n) => n > 0), draw: () => {
    const by = counted();
    const list = h('div', 'su-list');
    for (const c of CONNECT) {
      const n = by[c.group] ?? 0;
      const b = h('button', 'su-conn' + (n ? ' done' : ''));
      b.type = 'button';
      const l = h('span'); l.textContent = c.name; const s = h('small'); s.textContent = c.sub; l.appendChild(s);
      const st = h('span', 'su-st'); st.textContent = n ? 'Connected ' + String.fromCharCode(10003) + ' ' + num(n) : 'Connect';
      if (n) st.setAttribute('aria-label', 'Connected, ' + num(n));
      b.append(l, st);
      b.addEventListener('click', () => { markReturn(); C.openConnect(c.group); });
      list.appendChild(b);
    }
    const anyN = Object.values(by).some((n) => n > 0);
    return [
      h('h1', '', 'Connect what you already use.'),
      para('Tap one and sign in on their page, not ours. You come back here, it shows Connected and stays connected.'),
      para('For the Tool to work well, connect at least your mail, your files, your calendar and your accounting.', 'su-rec'),
      list,
      anyN ? null : para('Continue opens once one source is connected.', 'su-small su-soft'),
      bubble('Is this safe?', 'You sign in with the company itself, so the Tool never sees your password.',
        ['Each connection gives the Tool permission to read, the same way you let a phone app read your calendar. You can see and remove every connection in the Brain tab.',
          'Each person in your company sees what your own systems already let them open. Your Access Map, on the Security tab, shows who can see what.']),
    ];
  } },
  { key: 'card', name: 'First AI credit', when: () => ON.card, next: 'Add my card', draw: () => [
    h('div', '', ART.card),
    h('h1', '', 'Your first $20 of AI credit.'),
    para('Add your card once. The first $20 goes into your AI balance and pays for making your business findable, which usually costs a few dollars. Whatever is left stays in your balance for later.'),
    box(priceLine('Into your AI balance', '$20'), para('nothing is spent before you see the price', 'su-small su-soft')),
    bubble('Why now?', 'The Tool never spends money you have not put in. From here on, every step shows its price first.',
      ['Your card is handled by Stripe, the payment company; we never see the number. Your Tool fee starts only when you finish setting up. You can remove the card and cancel at any time.']),
  ] },
  { key: 'find', name: 'Findable', next: 'Continue', draw: () => {
    const rates = h('div', 'su-rates');
    const rate = (k, cls, price, per) => { const d = h('div', 'su-rate'); const a = h('span', 'su-k ' + cls); a.textContent = k; const b = h('b'); b.textContent = price; const c = h('span'); c.textContent = per; d.append(a, b, c); return d; };
    rates.append(rate('Find', 'f', 'about 30' + String.fromCharCode(162), 'per 10,000 emails, once'),
      rate('Understand', 'u', 'about $64', 'per 10,000 emails, once for your history; then only new items'),
      rate('Reason', 'r', 'per question', 'at cost; free with your own Claude'));
    const by = counted();
    const total = Object.values(by).reduce((a, n) => a + n, 0);
    return [
      h('div', '', LIBRARY),
      h('h1', '', 'Now the Tool looks at everything once.'),
      para('It works in three layers. The first is Find: AI goes through everything once so you can search it all by meaning, across every mailbox, drive and system. Nothing is labelled yet, which is why it is cheap.'),
      total ? strong('This has already started.', 'Reading began when you connected ' + (total === 1 ? 'your first source' : 'your ' + num(total) + ' sources') + '. The Brain tab shows how far back it has read.', 'su-ok-line') : null,
      strong('The ingredients, at cost', null),
      para('This is what the AI companies charge to do the work, measured in a real small business. You pay their price, with nothing added by us.', 'su-small su-soft'),
      rates,
      strong('Our part is the Tool:', 'putting it all together and keeping it correct, safe and up to date. One flat monthly fee, the only thing we earn.', 'su-small'),
      bubble('What is the difference?', 'Find searches everything by meaning, Understand labels each item, Reason answers you.',
        ['Find is already AI: ask for "the contract we signed with our biggest client last spring" and it finds it, even if those words appear nowhere, in your mail, your drives or your accounting system. It never writes, never guesses, never invents: it shows you your own documents.',
          'Understand reads each item and labels it: "invoice", the client, "paid". That is how the Tool can count your money and see who is waiting on you.',
          'Reason takes the right labelled items and answers your question in plain words, with the sources.',
          'Already use Claude? Ask through your own Claude, connected to your brain, and the answering runs on your Claude plan instead: the Tool only finds and hands over the right items.',
          'Rates are averages from a real small business. Yours depend on how long your emails are and how many attachments they carry.']),
    ];
  } },
  { key: 'ai', name: 'Your AI', next: 'Continue with Claude', draw: () => [
    h('div', '', LIBRARY),
    h('h1', '', 'The AI that runs your Tool.'),
    rich([['Find', 1], [' is already set up on a model we have tested. For '], ['Understand', 1], [' and '], ['Reason', 1], [' we recommend '], ['Claude, by Anthropic', 1],
      ['. We pick the right Claude model for each job: the most careful one for labelling your data, a fast one for everyday answers, the strongest only for hard questions.']]),
    box([rich([['Claude', 1]]), para('Recommended', 'su-small su-soft')], para('best score on our test', 'su-small su-soft')),
    strong('Prefer another AI, or have your own account?', 'Tell us. We test any AI on the same real business questions first and show you its score before anything switches.', 'su-small'),
    bubble('What does the score mean?', 'We run every setup through the same test: real business questions with known right answers. The score is how many it gets right.',
      ['Understand matters most. It decides every label, every count and who may see what, so it has a minimum: setups below it are not offered.',
        'Reason decides how good the answers and drafts are. Here you can save money if you mostly ask simple questions.']),
  ] },
  { key: 'understand', name: 'Understand', next: 'Continue', draw: () => {
    const per = h('div', 'su-choice');
    const w = para('Working out your own prices', 'su-small su-soft working no-late');
    per.appendChild(w);
    ownPrices(per, w);
    return [
      h('div', '', ART.understand),
      h('h1', '', 'Choose how far back the Tool should really understand.'),
      para('New mail is always read and sorted (what kind it is, who may see it). For the past, you choose, and each choice shows its price.'),
      strong('Your own prices', 'for your mail, counted in your mailboxes:', 'su-small'),
      per,
      para('One time. After that, only new items are read, a much smaller amount each month. You choose this for each mailbox on the Brain tab, under Sources, where every choice shows its price first.', 'su-small su-soft'),
      bubble('Why not everything?', 'Most questions are about the last two years, and older items stay findable.',
        ['When you ask about something older, the Tool reads it on the spot and keeps it findable from then on, so you only pay for what you actually use.',
          'You can understand more at any time from the Brain tab.']),
    ];
  } },
  { key: 'bills', name: 'Two bills', next: 'Finish', draw: () => {
    const two = h('div', 'su-box su-col');
    const t = rich([['2. From us: one card, one monthly statement', 1]]);
    const line = (a, b) => { const d = h('div', 'su-line'); const x = h('span'); x.textContent = a; const y = h('b'); y.textContent = b; d.append(x, y); return d; };
    two.append(t, line('The Tool, you plus 4 colleagues', '$50 founding ' + String.fromCharCode(183) + ' $100'),
      line('Each extra person', '$10 founding ' + String.fromCharCode(183) + ' $15'),
      line("AI used, at the AI makers' exact price", 'at cost'), line("Card fee, at the card company's price", 'at cost'));
    const one = box([rich([['1. From Supabase: your database', 1]]), para('On your own account. We are never in the middle.', 'su-small su-soft')], h('b', '', 'about $25 / mo'));
    return [
      h('div', '', ART.bills),
      h('h1', '', 'You get two bills. Nothing else, nothing hidden.'),
      one, two,
      strong('The AI is prepaid.', 'It tops up from your card when it runs low; we pay the AI makers from it. You never need your own AI account, and nothing is spent before you have paid.', 'su-small'),
      bubble('Why prepaid?', 'So you are never surprised by a bill, and the Tool never spends money you did not put in.',
        ['Every time you add a source or ask for more history, the Tool tells you the price before it starts.']),
      strong('No contract. Cancel any time, and you keep everything.', null, 'su-small'),
    ];
  } },
  { key: 'ready', name: 'Ready', draw: () => {
    const claude = h('div', 'su-box su-col');
    claude.append(h('b', '', 'Already use Claude?'),
      para('Connect it, and ask your brain from inside Claude, with everything you are allowed to see. The answering then runs on your own Claude plan.', 'su-small su-soft'),
      btn('Connect my Claude', 'su-btn o', () => { try { history.replaceState(null, '', '#chats/connect'); } catch (_) { /* opens Chats */ } C.goTab('chats'); }));
    return [
      h('div', '', ART.ready),
      h('h1', '', 'Your brain is ready.'),
      para('It keeps reading in the background. Start with your mail: it looks like the mail you know, with the Tool beside it.'),
      claude,
    ];
  } },
];

const live = () => STEPS.filter((s) => !s.when || s.when());

// Her own prices for 6 months, 2 years and everything, from the one estimate (lens-ask {read_estimate}). Only a figure
// the brain gives is shown; with nothing counted the line says when they appear.
async function ownPrices(host, wait) {
  const ask = (months) => C.readEstimate(months === null ? {} : { months }).catch(() => null);
  const rs = await Promise.all([ask(6), ask(24), ask(null)]);
  wait.remove();
  const rows = [];
  const labels = [['Last 6 months', 6], ['Last 2 years', 24], ['Everything', null]];
  rs.forEach((r, i) => {
    const e = r?.estimate;
    if (!r || r.ok !== true || !e || e.ok !== true) return;
    const mail = (e.sources || []).filter((s) => s.kind === 'mailbox' || s.kind === 'gmail' || s.source_type === 'gmail');
    const use = mail.length ? mail : (e.sources || []);
    const items = use.reduce((a, s) => a + Number(s.to_read || 0), 0);
    const usd = use.reduce((a, s) => a + Number(s.first_read_usd || 0), 0);
    if (!items) return;
    rows.push({ label: labels[i][0], items, usd });
  });
  if (!rows.length) {
    host.appendChild(para('Your own prices appear here once your mail is counted. Counting is free and starts when a mailbox is connected; nothing is read to count it.', 'su-small su-soft'));
    return;
  }
  for (const r of rows) {
    const d = h('div', 'su-ch');
    const l = h('span'); l.textContent = r.label; const s = h('small', 'su-soft'); s.textContent = num(r.items) + ' emails'; l.append(h('br'), s);
    const p = h('b'); p.textContent = money0(r.usd);
    d.append(l, p); host.appendChild(d);
  }
}

function draw() {
  const steps = live();
  if (cur >= steps.length) cur = steps.length - 1;
  const s = steps[cur];
  const root = C.sec;
  root.replaceChildren();
  const wrap = h('div', 'su-wrap');
  const top = h('div', 'su-top');
  const dots = h('div', 'su-dots'); dots.setAttribute('aria-hidden', 'true');
  steps.forEach((x, k) => { const i = h('i', k === cur ? 'on' : k < cur ? 'done' : ''); dots.appendChild(i); });
  const count = h('span', 'su-count'); count.textContent = cur === 0 ? 'Welcome' : cur === steps.length - 1 ? 'Ready' : 'Step ' + cur + ' of ' + (steps.length - 2);
  top.append(dots, count, btn('How the Tool works', 'su-how', openStory));
  const card = h('section', 'su-card su-pop');
  card.setAttribute('aria-label', s.name);
  for (const x of s.draw()) if (x) card.appendChild(x);
  const act = h('div', 'su-actions');
  if (cur > 0) act.appendChild(btn('Back', 'su-btn o', () => go(cur - 1)));
  if (s.key === 'ready') {
    act.append(btn('Open my Mail', 'su-btn', () => C.goTab('email')), btn('How the Tool works', 'su-btn o', openStory));
  } else {
    const label = typeof s.next === 'function' ? s.next() : s.next;
    const n = btn(label, 'su-btn', () => go(cur + 1));
    if (s.ready && !s.ready()) n.disabled = true;
    act.appendChild(n);
  }
  card.appendChild(act);
  wrap.append(top, card);
  root.appendChild(wrap);
}
function go(i) { cur = Math.max(0, i); draw(); window.scrollTo({ top: 0 }); }

// ctx: { sec, shape, openConnect, goTab, readEstimate }. at: a step key to open on (the Connect step after a sign-in).
export function mount(ctx, at) {
  C = ctx;
  const k = live().findIndex((s) => s.key === at);
  cur = k >= 0 ? k : 0;
  draw();
}

// THE STORY: How the Tool works, the workhorse story, from any screen.
const STORY = [
  ['Most people think AI is a chatbot.', 'You ask, it answers, and you cannot tell whether it is true. That fear is fair. The chatbot is only the last step.'],
  ['This is a workhorse, not a chatbot.', 'Three layers of AI working on your own data every day, in the background: your mail, your files, your calendar, your books and your systems. Steady, checkable work.'],
  ['It lives in your own database.', 'In your name, paid by you. Cancel any time: we step out, and the database with everything the Tool labelled stays yours, ready for any AI you choose.', DB],
  ['It works in three layers.', 'Find searches everything by meaning. Understand labels each item. Reason answers you. Each layer has its own price, at cost, and you see it.', LIBRARY],
  ['Find: search that knows what you mean.', 'The email where a client agreed to new terms. The signed contract buried in a shared drive. The invoice in your accounting system nobody can locate. It finds them by meaning, everywhere at once, and shows you your own documents. It never invents anything.'],
  ['Understand: your data becomes AI-quality data.', 'Every email, file and record is read once and labelled: what it is, who it is about, how much, when, paid or not. Then the pieces are connected into one story. From the labels alone you get every unpaid invoice, every contract expiring this quarter, what your books say against what the bank received, without asking an AI again.'],
  ['It helps you clean up.', 'Duplicate files, misfiled documents, a payment booked against the wrong invoice. The Tool shows you, prepares the fix, and you decide.'],
  ['Reason: answers with the proof attached.', 'Plain answers, drafts and advice built on your labelled data, always showing what they were based on. When it does not know, it says so.'],
  ['It never makes things up.', "Numbers and facts come straight from your own mail, files and books, never from the AI's imagination, and every one links to where it came from."],
  ['Nothing happens without you.', 'It suggests and prepares: a reply, a correction in your books, a post. Nothing is sent, paid, changed or deleted until you press yes. It is never an agent acting on its own.'],
  ['Only what an answer needs leaves your database.', 'To answer, the Tool sends the AI just the few items it needs. The AI keeps nothing and learns nothing from your business.'],
  ['Everyone sees only what they already may.', 'The Tool follows the permissions in your own systems. The AI only labels; a simple fixed rule decides who sees what, and a mistake can only hide something, never expose it. And for the first time, the Security tab shows you who can open what.'],
  ['You can use it just for yourself.', 'If you are the owner, or the one person with access to everything, you can use the Tool on your own. Nobody else in the company will ever know or see it.'],
  ['What it costs.', "You see every price before anything is spent. The AI is passed through at the AI makers' exact prices. Think of a builder who buys the materials at cost and charges only for the work: the AI is the materials, the Tool is the work."],
];
export function openStory() {
  if (!story) {
    story = h('div', 'su-story');
    story.id = 'su-story';
    story.setAttribute('role', 'dialog');
    story.setAttribute('aria-modal', 'true');
    story.setAttribute('aria-label', 'How the Tool works');
    const w = h('div', 'su-wrap');
    const close = btn('Close', 'su-close', closeStory);
    w.appendChild(close);
    for (const [t, p, art] of STORY) {
      const s = h('section', 'su-sp');
      if (art) s.appendChild(h('div', '', art));
      s.append(h('h2', '', ''), para(p));
      s.querySelector('h2').textContent = t;
      w.appendChild(s);
    }
    const end = h('section', 'su-sp');
    const e2 = h('h2'); e2.textContent = 'You are in control.';
    end.append(e2, para('Of what is read, how far back, which AI does what, and how much it may spend.'),
      strong('With understanding comes control. With control comes trust.'), h('div', 'su-actions'));
    end.lastChild.appendChild(btn('Back', 'su-btn', closeStory));
    w.appendChild(end);
    story.appendChild(w);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && story && !story.hidden) closeStory(); });
    document.body.appendChild(story);
  }
  story.hidden = false;
  story.scrollTop = 0;
  document.body.classList.add('su-story-open');
  story.querySelector('.su-close').focus();
}
function closeStory() {
  if (!story) return;
  story.hidden = true;
  document.body.classList.remove('su-story-open');
  if (location.hash === '#how') { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* link stays */ } }
}

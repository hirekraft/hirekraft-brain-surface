// fill/setup.js - THE FRONT DOOR: "How Verrandi Works" (seat setup-front-door, 2026-11-10; decisions 1131 to 1135; the
// approved picture 7Y4AckRBp4rkEtca5og57q version 1794022349-70e2, words in studio-walkers
// briefs/mockups/getting-started-spec.md, page 1). Every sentence below is Alex's approved copy; change none without HQ.
//
// WHEN IT SHOWS: it is the first thing a brain that is not Ready shows its owner (fill/ready.js opens it once per browser
// until Get started is pressed), and it opens from "See how it works" on Getting started, from the Brain's "How your brain
// works" and from the link #how, at any time. Get started opens step 1 of Getting started.
// SOMEONE WHO IS NOT THE OWNER sees the same page without the prices (cards 8 and 9) and without Get started: decision 1124,
// a colleague sees no prices and has nothing to set up.
//
// RETIRED HERE (seat setup-front-door, HQ brief 2026-11-10; retirement is an enforcement): the old setup (one step per
// screen, #s-setup, with its "Security tab shows it" lines and the stale Find and Understand rates per 10,000 emails) and the
// old 14-panel story "How the Tool works". The old story printed a claim about what the AI keeps and learns that the
// marketing vault forbids until it is checked against each AI maker's terms, and promised a clean-up and a Security tab
// view that are not built (decision 1119). Getting started (fill/ready.js) is the one setup now; lens.js sends #setup and a
// brain with nothing connected there. setup.css, which styled only the old setup and story, is removed.
// THE VAULT'S FORBIDDEN CLAIMS (training, what the AI keeps or learns, access) are never on this page; the local check
// (studio-walkers scripts/setup-front-door) fails if any of their words is in the surface.
// The look is the Access Map's (skin.css am-*, decision 1101): one design language. Symbols always with a word.
// No regex literals and no backslashes (STANDING-CLAUSES: the write tool).

const NS = 'http://www.w3.org/2000/svg';
const DOT = String.fromCharCode(183);
const PASSED = 'tool.door.passed';

// LINE SYMBOLS, 24 px, one stroke, shared with Getting started (ready.js imports ic). Always shown with a word.
const PATHS = {
  chat: 'M4 5h16v11H9l-5 4z',
  horse: 'M7 21v-6l-3-3 3-7 5 2h3l4 4v3l-2 1-2-2h-1l-1 3v5M11 21v-5',
  brain: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 2 2 0 0 0 3-1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 2 2 0 0 1-3-1',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  folder: 'M3 6h6l2 2h10v11H3z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  systems: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  key: 'M15 3a6 6 0 1 1-5 9.3L3 19v2h3v-2h2v-2h2l1.7-1.7A6 6 0 0 1 15 3zM16 7h.01',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  ai: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  tag: 'M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2',
  hand: 'M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.6-1.5L8 15',
  check: 'M5 12l5 5 9-10',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  photo: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9h.01',
  steps: 'M4 20h4v-4h4v-4h4V8h4',
};
export function ic(name, cls) {
  const s = document.createElement('span'); s.className = 'am-ic' + (cls ? ' ' + cls : ''); s.setAttribute('aria-hidden', 'true');
  const v = document.createElementNS(NS, 'svg'); v.setAttribute('viewBox', '0 0 24 24'); v.setAttribute('fill', 'none'); v.setAttribute('stroke', 'currentColor');
  v.setAttribute('stroke-width', '1.8'); v.setAttribute('stroke-linecap', 'round'); v.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', PATHS[name] || PATHS.check); v.appendChild(p); s.appendChild(v);
  return s;
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
// A sentence with bold parts: [['plain '], ['bold', true], ...]
function rich(tag, cls, parts) { const e = el(tag, cls); for (const [t, b] of parts) e.append(b ? el('b', null, t) : document.createTextNode(t)); return e; }
// A list of points, each one symbol and its words.
export function points(list) {
  const ul = el('ul', 'am-pts');
  for (const [icon, ...parts] of list) { const li = el('li'); li.append(ic(icon), rich('span', null, parts.map((x) => (Array.isArray(x) ? x : [x])))); ul.appendChild(li); }
  return ul;
}
// A numbered card: the head row (symbol + small uppercase number and label), then its title and body.
export function card(icon, label, h2, ...body) {
  const c = el('section', 'am-step');
  const hd = el('div', 'am-head'); hd.append(ic(icon), el('span', 'am-num', label)); c.appendChild(hd);
  if (h2) c.appendChild(el('h2', 'am-h2', h2));
  for (const b of body) if (b) c.appendChild(typeof b === 'string' ? el('p', null, b) : b);
  return c;
}
function tiles(list) {
  const d = el('div', 'am-three fd-tiles');
  for (const [tone, title, price, text, foot] of list) { const t = el('div', 'am-p fd-' + tone); t.appendChild(el('b', 'fd-tt', title)); if (price) t.appendChild(el('span', 'fd-pr', price)); t.appendChild(el('span', 'am-says', text)); if (foot) t.appendChild(el('em', 'fd-ft', foot)); d.appendChild(t); }
  return d;
}

let box = null, opts = {};

// THE PAGE. opts: { owner: true|false, start: function } (start: what Get started opens; Getting started step 1).
function build(owner) {
  const w = el('div', 'am fd-page');
  const top = el('div', 'fd-top');
  const lab = el('span', 'am-lab'); lab.append(ic('brain'), document.createTextNode('Verrandi ' + DOT + ' How it works'));
  const close = el('button', 'go ghost fd-close', 'Close'); close.type = 'button'; close.addEventListener('click', closeStory);
  top.append(lab, close);
  w.append(top, el('h1', 'am-h1', 'A brain for your business.'),
    points([
      ['chat', 'Most people think AI is a chatbot: you ask, it answers, and you cannot tell whether it is true.'],
      ['horse', 'Verrandi is an ', ['AI workhorse', true], ': steady, checkable work on your own business, every day.'],
      ['brain', 'It gives your business its own memory: everything from your email, files and records in one place you own, which you can search, understand and ask anything.'],
    ]));
  const chips = el('div', 'fd-chips');
  for (const [i, t] of [['mail', 'Email'], ['file', 'Files'], ['chat', 'Chats'], ['calendar', 'Calendar'], ['book', 'Books'], ['systems', 'Your systems']]) { const c = el('span', 'fd-chip'); c.append(ic(i), document.createTextNode(t)); chips.appendChild(c); }
  w.append(
    card('link', '1 ' + DOT + ' Everything in one place', 'Your business already lives in many places. Verrandi brings it together.', chips, 'Kept current automatically, in one memory that belongs to you.'),
    card('eye', '2 ' + DOT + ' It reads, your work stays the same', 'Your email still looks like your email. Your files stay where they are.', points([
      ['eye', 'It reads. Your tools and your people work exactly as before.'],
      ['person', 'One person is enough: it works for you alone, if you like.'],
      ['hand', 'An email sent from Verrandi is an ordinary email in your mailbox.'],
    ])),
    card('key', '3 ' + DOT + ' Same keys as today', 'Everyone sees only what they can already open.', points([
      ['key', 'Your owner sees what your owner can see; a new hire sees what a new hire can see.'],
      ['shield', 'Every item gets a quick privacy check when it comes in, so sensitive things like pay or personal matters reach only the people who should see them.'],
      ['lock', 'What is made from locked things stays locked: like a photocopy of a file from a locked drawer, the copy goes back in the same drawer.'],
      ['hand', 'Before you share something built from private information, Verrandi shows you exactly what is in it.'],
    ])),
    card('ai', '4 ' + DOT + ' Three layers of AI', 'You choose how smart you want it to be.', tiles([
      ['read', 'Finds', null, 'Knows where everything is and pulls everything about a client, a person or a payment in a second. It shows your own documents.', 'Nearly free'],
      ['warn', 'Understands', null, 'Reads each item once and notes what it is and the facts in it, so you can ask exact questions.', 'Paid once per item, price first'],
      ['ok', 'Thinks', null, 'New answers and insights from what it found and understood, always showing what it read.', 'Paid per question'],
    ]), el('p', 'am-small', 'Rule of thumb: if the answer is a list of things you already have, it is finding, and nearly free. If the answer is a sentence nobody ever wrote, it is thinking.')),
    card('chat', '5 ' + DOT + ' Two doors, one memory', 'Work in Verrandi, in the AI assistant you already use, or both.', 'Connect your own assistant, like Claude. It becomes an expert on your business, sees only what you may see, and can save its work back into your memory.'),
    card('tag', '6 ' + DOT + ' Every fact traceable', 'Anything it says points back to where it came from.', 'And it says plainly what it did not read.'),
    card('database', '7 ' + DOT + " It's yours", 'Your memory lives in your own database. All of it is yours, always.', 'Even if you stop using Verrandi.'),
  );
  if (owner) {
    const steps = el('ol', 'fd-steps');
    for (const [n, b, t] of [
      ['1', 'Create your database.', 'Your brain' + String.fromCharCode(8217) + 's home, in your own account with Supabase, about $25 a month, paid to them directly.'],
      ['2', 'Add your first $20 of AI credit.', 'It pays for making everything searchable. Whatever is left stays in your balance.'],
      ['3', 'Connect, and watch it become searchable.', 'Each mailbox, drive and system gets its own meter as it is read, and turns green when it is searchable. Your balance shows what was used.'],
      ['4', 'Understand what matters.', 'Now Verrandi has counted everything, so you see your exact price, how long it takes, and which AI does the work. You choose, then it reads.'],
      ['5', 'Your brain is ready.', 'Vera, your guide, gets to know your business, and you start working.'],
    ]) { const li = el('li'); li.append(el('span', 'fd-n', n), rich('span', null, [[b, true], [' ' + t]])); steps.appendChild(li); }
    const go = el('button', 'go fd-go', 'Get started'); go.type = 'button'; go.addEventListener('click', getStarted);
    const gw = el('div', 'fd-gow'); gw.appendChild(go);
    w.append(
      card('coin', '8 ' + DOT + ' What it costs', 'One price per company, plus what the work actually costs.', tiles([
        ['read', 'Search', '$40 / month', 'Finding, for your whole company.', 'Founding price $20'],
        ['warn', 'The Tool', '$100 / month', 'Finds, understands, thinks. You plus 4 colleagues; each extra person $15.', 'Founding price $50, extra person $10'],
        ['ok', 'At cost', 'what it costs', "Your own database (about $25 a month) and the AI, prepaid at the AI makers' price.", 'Price shown before anything is spent.'],
      ])),
      card('steps', '9 ' + DOT + ' How we get started', 'Five steps. You see every price before you pay it.', steps,
        el('p', 'am-small', 'Every choice you make here stays in Settings, where you can change it any time.'), gw),
    );
  } else {
    const back = el('button', 'go ghost', 'Close'); back.type = 'button'; back.addEventListener('click', closeStory);
    const gw = el('div', 'fd-gow'); gw.appendChild(back); w.appendChild(gw);
  }
  return w;
}

export function doorPassed() { try { return !!localStorage.getItem(PASSED); } catch (_) { return false; } }
function getStarted() {
  try { localStorage.setItem(PASSED, String(Date.now())); } catch (_) { /* this visit only */ }
  closeStory();
  window.dispatchEvent(new CustomEvent('fd-start'));   // fill/ready.js opens step 1
  if (typeof opts.start === 'function') opts.start();
}

export function openStory(o) {
  opts = o || {};
  const owner = opts.owner !== false;
  if (box && box.dataset.owner !== String(owner)) { box.remove(); box = null; }
  if (!box) {
    box = el('div', 'fd');
    box.id = 'fd'; box.dataset.owner = String(owner);
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'How Verrandi works');
    box.appendChild(build(owner));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box && !box.hidden) closeStory(); });
    document.body.appendChild(box);
  }
  box.hidden = false;
  box.scrollTop = 0;
  document.body.classList.add('fd-open');
  box.querySelector('.fd-close')?.focus({ preventScroll: true });
}
export function closeStory() {
  if (!box) return;
  box.hidden = true;
  document.body.classList.remove('fd-open');
  if (location.hash === '#how') { try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { /* link stays */ } }
}
export function storyOpen() { return !!box && !box.hidden; }

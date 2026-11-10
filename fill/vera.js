// fill/vera.js - VERA, THE GUIDE (seats vera-on-brain-2 and vera-guide, 2026-11-06/07; decisions 1113 the companion, 1115 Alex
// presses, 1116 Vera, 1121 and 1122 your business as a conversation, 1123 the internal consultant, 1124 Getting ready).
// Part of CONVERSE and SHOW; it adds no mechanism of its own.
//
// ONE BUTTON, bottom right, on every screen ("Vera", with a dot while the Brain is not Ready). It REPLACES the round phone
// Ask button (lens.js .tab-ask, hidden in skin.css's VERA block) and opens THE conversation panel (#panel, lens.js). Vera is
// not a second conversation: what she is asked goes through the panel's own box to lens-ask, kept in Work like any other.
// THE RIGHT COLUMN OF GETTING READY (seat vera-guide). When the screen offers a column for her (an element carrying
// data-vera-column, drawn by the Getting ready screen), the one panel element MOVES into it and stays open there, as lens.js
// moves it into Work; leaving that screen it goes back to the right edge. One renderer, the same element, never a copy.
// The column is fill/ready.js's #gr-vera (seat getting-ready-screen) or any element carrying data-vera-column.
// WHAT SHE IS LOOKING AT GOES WITH THE QUESTION (seat vera-guide). A question asked in her conversation carries the screen as
// drawn now (the tab, the setup step, its numbers and prices, the open panel), read from what the screen drew, never a second
// count; lens-ask hears it in its first look and its about-the-Tool answer only (lens-ask v66 screenOf). It is added on the
// way out by a small wrapper round fetch, ONLY for a question sent from her conversation, because lens.js (which builds the
// question) is being changed by a parallel seat tonight. LIVE OBJECTION, said so the next reader does not re-argue it: the
// clean end is one line in lens.js ask() sending screen: veraScreen(); move it there when lens.js is next owned, and delete
// the wrapper.
// YOUR BUSINESS (step 3) IS A CONVERSATION WITH HER (1121, 1122). One section at a time; after each answer only "Thank you.
// Anything else you want to add?"; she never restates, infers or guesses; at the end a summary made of HER words, section by
// section, and "Is this right, and is there anything else you want to say?". Her yes keeps each section in the one profile
// store (business_profile_owner_say, brain file vera-guide-1), shown under What your Tool believes, editable there.
// Clarifying questions about her own words are allowed by 1122; this round Vera asks none (a model would have to decide when),
// which can only err on the side of adding nothing.
// HER STANDING RULE (1122): what she has not been told or read she never presents as known. Every sentence of hers below is
// either fixed words or the screen's own words and numbers.
// SHE NEVER PRESSES (1115). The buttons she offers are the Tool's own; only the person's Yes starts anything.
// SEAT getting-ready-fix-1 (Alex's walk, 2026-11-06 16:35-16:43 PT): (1) she greets ONCE per conversation on Getting ready
// (she greeted twice: once while the card still said "Reading", once when the step row came; the step now goes only in her
// "looking at" line). (2) WHILE SHE IS IN THE COLUMN NOTHING OF HERS CHANGES TAB: the panel's Open in Work, Your
// conversations and an answer's Open wide are refused in place (Alex pressed one and landed on Work); opening her when she
// is not yet in the column moves her in, never presses the tabs' Ask. (3) Step 3 is answered IN PLACE on the card
// (fill/ready.js draws it); this file keeps the one business conversation (window.veraBusiness) and says each turn in her
// column too; her column is then for questions about the step, not for answering. (4) Her box grows with what she types
// (Shift+Enter for a new line) and is empty after sending and when the step changes. (5) Her name is the one chosen
// ("Call me something else" on the Start step; there is no Settings place for it yet), from body data-guide.
// No regex literals and no backslashes (STANDING-CLAUSES).

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const DOT = String.fromCharCode(183);
const AP = String.fromCharCode(39);
let greeted = '';
let grGreeted = false;    // she greeted on Getting ready in this conversation
let btn = null;
let home = null;          // where the panel lives when it is not in her column
let fromPanel = 0;        // when a question last left her conversation (ms)
let talk = null;          // the business conversation while it runs
let lastKey = null;       // the Getting ready step her box was last on (her box empties when it changes)
const NAME = () => String(document.body.dataset.guide || '').trim() || 'Vera';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const shown = (e) => !!e && !e.hidden && e.getClientRects().length > 0;
// A drawn element's words as she reads them (line breaks between its parts become spaces), with no closing full stop.
const words = (e) => {
  const t = e ? String(e.innerText || e.textContent || '') : '';
  const w = t.split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).join(' ').split('  ').join(' ').trim();
  return w.endsWith('.') ? w.slice(0, -1) : w;
};

// What the Brain says about itself, read from what it drew. null when the masthead has not been drawn.
function brainNow() {
  const eng = $('#brain-engine');
  if (!eng) return null;
  const word = ($('b', eng)?.textContent || '').split(DOT).slice(1).join(DOT).trim();
  const ready = eng.classList.contains('engine-ok');
  const stn = $$('#br-road .br-stn');
  const next = stn.find((b) => !b.classList.contains('br-stn-done'));
  return { word, ready, step: next ? next.getAttribute('aria-label') : '' };
}

// The Getting ready screen, when it is showing: its column for Vera, the current step and its card.
function readyNow() {
  const colEl = $$('[data-vera-column], #gr-vera').find(shown);   // #gr-vera: the column fill/ready.js draws for her
  if (!colEl) return null;
  const root = colEl.closest('section, main, .step') || document.body;
  const cur = $('[aria-current="step"]', root);
  const card = $$('h1, h2', root).find((h) => shown(h) && !colEl.contains(h));
  const lead = card ? card.parentElement?.querySelector('.lead, p') : null;
  const nums = $$('.num', root).filter((n) => shown(n) && !colEl.contains(n)).map(words).slice(0, 4);
  const acts = $$('button', root).filter((b) => shown(b) && !colEl.contains(b) && !b.disabled && words(b).length < 80
    && (b.classList.contains('p') || b.classList.contains('go') || words(b).includes('$'))).map(words).slice(0, 5);
  const step = cur && cur.children.length ? [...cur.children].map(words).filter(Boolean).join(' ') : words(cur);   // the step's number line and its name, apart
  return { col: colEl, step, key: stepKey(step + ' ' + words(card)), card: words(card), lead: words(lead).slice(0, 240), nums, acts };
}

// Which setup step, from the screen's own words (English; the step row's keys when the screen carries them).
function stepKey(t) {
  const s = String(t || '').toLowerCase();
  const tag = $('[aria-current="step"][data-step]')?.dataset.step;
  if (tag) return tag;
  if (s.includes('your business')) return 'business';
  if (s.includes('findable')) return 'find';
  if (s.includes('understand')) return 'understand';
  if (s.includes('database')) return 'db';
  if (s.includes('connect')) return 'connect';
  if (s.includes('ready')) return 'ready';
  if (s.includes('start') || s.includes('welcome')) return 'start';
  return '';
}

// Where she is: the tab, and on the Brain its part and the open side panel.
function looking() {
  const r = readyNow();
  if (r) return ['Getting ready', r.step].filter(Boolean).join(', ');
  const tab = document.body.dataset.tab || '';
  if (tab === 'brain' || tab === 'ai') {
    const part = $('#br-tabs .br-tab.on')?.textContent?.trim();
    const page = $('#br-page');
    const side = page && !page.hidden ? $('.br-ph', page)?.textContent?.trim() : '';
    return ['Brain', part, side ? side + ' panel' : ''].filter(Boolean).join(', ');
  }
  const t = $('#tabs .tab[aria-current="page"]')?.textContent?.trim();
  return t || 'the start of the Tool';
}

// THE SCREEN, AS DRAWN NOW, for lens-ask (window.veraScreen). Only words and numbers the screen shows; cut at 900.
function screenText() {
  const out = ['Looking at: ' + looking() + '.'];
  const r = readyNow();
  if (r) {
    if (r.card) out.push('On the card: ' + r.card + '.');
    if (r.lead) out.push(r.lead + '.');
    if (r.nums.length) out.push('Numbers shown: ' + r.nums.join('; ') + '.');
    if (r.acts.length) out.push('Buttons shown: ' + r.acts.join('; ') + '.');
  }
  const b = brainNow();
  if (b) out.push('The Brain says: ' + (b.ready ? 'Ready' : (b.word || 'not ready')) + (b.step ? '; the next step on its road: ' + b.step : '') + '.');
  if (b && !b.ready) {
    const o = offers().filter((x) => x.press).map((x) => x.label);
    if (o.length) out.push('Buttons on the Brain: ' + o.join('; ') + '.');
  }
  if (talk) out.push('She is answering the questions about her business (step 3).');
  return out.join(' ').slice(0, 900);
}
window.veraScreen = screenText;

function drawLook() {
  const body = $('#panel-body');
  if (!body) return;
  let p = $('#vera-look');
  if (!p) { p = el('p', 'vera-look'); p.id = 'vera-look'; p.setAttribute('aria-live', 'polite'); body.prepend(p); }
  const t = ' ' + DOT + ' looking at: ' + looking();
  if (p.dataset.t === t) return;   // unchanged: drawing it again would wake the watcher below for nothing
  p.dataset.t = t;
  p.replaceChildren(el('b', null, NAME()), document.createTextNode(t));
}

function paintDot() {
  if (!btn) return;
  const b = brainNow();
  btn.classList.toggle('has', !!b && !b.ready);
  btn.setAttribute('aria-label', b && !b.ready ? 'Vera, your guide. You are not done with setup.' : 'Vera, your guide');
}

// The Tool's own buttons, as the Brain drew them. Each offer carries the real button's words and price.
function offers() {
  const out = [];
  const read = $$('#br-files button.go').find((b) => b.textContent.trim() === 'Read them' && !b.disabled);
  if (read) out.push({ label: 'Read them (it shows the price first)', find: () => $$('#br-files button.go').find((b) => b.textContent.trim() === 'Read them'), press: true });
  const tot = $('#br-und-pick .br-total');
  const go = tot && $$('button.go', tot).find((b) => b.textContent.trim() === 'Go');
  if (go && !go.disabled) {
    const price = $('.br-total-t b', tot)?.textContent?.trim();
    out.push({ label: 'Go' + (price ? ' ' + DOT + ' ' + price : ''), find: () => $$('#br-und-pick .br-total button.go').find((b) => b.textContent.trim() === 'Go'), press: true });
  } else if (tot) {
    out.push({ label: 'Choose what to understand', find: () => $('#br-und-pick'), press: false });
  }
  if (!out.length && !$('#br-road .br-stn') && !readyNow()) out.push({ label: 'Open the Brain', find: () => null, press: false });
  return out;
}

// Bring the Tool's own button into view and, for a press, press it for her: its preview and price appear where it stands.
function take(o) {
  if (window.matchMedia('(max-width: 720px)').matches && !inColumn()) $('#panel-away')?.click();
  const tab = document.body.dataset.tab;
  if (tab !== 'brain' && tab !== 'ai') $('#brain-engine')?.click();
  requestAnimationFrame(() => {
    const open = $('#br-page');
    if (open && !open.hidden) $('.br-back', open)?.click();
    $('#br-tabs [data-btab=ai]')?.click();
    requestAnimationFrame(() => {
      const t = o.find();
      if (!t) return;
      t.scrollIntoView({ block: 'center', behavior: 'smooth' });
      t.classList.add('vera-here');
      setTimeout(() => t.classList.remove('vera-here'), 4000);
      if (o.press) t.click(); else t.focus?.({ preventScroll: true });
    });
  });
}

// SUGGESTED QUESTIONS per step (the mock-up's, and the newcomer script's). A price in a question is the screen's own.
function priceOnScreen() {
  const r = readyNow();
  const all = (r ? r.acts : []).concat(offers().map((o) => o.label));
  for (const a of all) { const i = a.indexOf('$'); if (i >= 0) return a.slice(i).split(' ')[0]; }
  return '';
}
function suggestions() {
  const r = readyNow();
  const b = brainNow();
  let key = r ? r.key : '';
  if (!key && b && !b.ready) key = stepKey(b.step);
  const p = priceOnScreen();
  const S = {
    start: ['What does this cost me in total?', 'Who can see my data?', 'How long does this take?'],
    credit: ['Is $20 enough?', 'Is my card safe?'],
    db: ['What does the database cost me?', 'What happens if I cancel?'],
    connect: ['Is everything connected?', 'Why does it need my mailbox?'],
    business: ['Why do you ask this?', 'Can I change it later?'],
    find: ['What does findable mean?', p ? 'Why only ' + p + '?' : 'Why is this so cheap?', 'Can I stop here?', 'Can I use Mail yet?'],
    understand: ['What does understood mean?', 'Can I do 6 months first?', 'What does it cost every month after this?'],
    ready: ['What happens after ready?', 'Can I use Mail yet?'],
  };
  const list = ['Where are we?'].concat(S[key] || (b && !b.ready ? ['What does findable mean?', 'Can I stop here?', 'Can I use Mail yet?'] : []));
  return { key, list };
}
function drawSug() {
  const foot = $('#panel .panel-foot');
  if (!foot) return;
  let box = $('#vera-sug');
  if (!box) { box = el('div', 'vera-sug'); box.id = 'vera-sug'; foot.before(box); }
  const { key, list } = suggestions();
  const sig = talk && !talk.inPlace ? 'talk|' + talk.stage + '|' + talk.i : key + '|' + list.join('|') + '|' + (readyNow() ? 1 : 0);
  if (box.dataset.sig === sig) return;   // unchanged: see drawLook
  box.dataset.sig = sig;
  box.replaceChildren();
  if (talk && !talk.inPlace) { drawTalkActs(box); return; }
  if (key === 'connect' && readyNow()) {   // seat setup-front-door: Welcome is gone; she first appears on step 3
    const n = el('button', 'vera-chip', 'Call me something else'); n.type = 'button'; n.addEventListener('click', rename); box.appendChild(n);
  }
  // On Getting ready step 3 is answered on the card itself (fill/ready.js); her column keeps only questions about the step.
  if ((key === 'business' && !readyNow()) || (readyNow() === null && brainNow() && !brainNow().ready)) {
    const t = el('button', 'vera-chip vera-chip-main', key === 'business' ? 'Start: tell me about your business' : 'Your business: tell me in your words');
    t.type = 'button'; t.addEventListener('click', startTalk); box.appendChild(t);
  }
  for (const q of list) {
    const c = el('button', 'vera-chip', q); c.type = 'button';
    c.addEventListener('click', () => askIt(q));
    box.appendChild(c);
  }
}
function askIt(q) {
  const i = $('#panel-input'), s = $('#panel-send');
  if (!i || !s) return;
  i.value = q; fromPanel = Date.now(); s.click();
}

function greet() {
  const r = readyNow();
  const tab = document.body.dataset.tab;
  if (r && !r.step) return;   // the step row is not drawn yet
  if (!r && tab !== 'brain' && tab !== 'ai') return;
  const b = brainNow();
  if (!r && (!b || b.ready)) return;
  const turns = $('#dock-turns');
  if (!turns) return;
  if (!$('.vera-turn', turns)) { greeted = ''; grGreeted = false; }   // a new conversation: she greets again
  // ONCE on Getting ready (seat getting-ready-fix-1): not again for each step, nor when the step row is first drawn.
  if (r) { if (grGreeted) return; grGreeted = true; }
  else { const at = b.word + '|' + b.step; if (greeted === at) return; greeted = at; }
  const d = turn();
  if (r) {
    d.appendChild(el('p', null, 'I walk you through getting your Tool ready. Interrupt me any time; ask about anything you see. What I am looking at is written just above.'));
  } else {
    d.appendChild(el('p', null, 'You are not done with setup, so answers may be incomplete until the Brain says Ready.'));
    d.appendChild(el('p', null, b.step ? 'Where you are: ' + b.step : 'Where you are: ' + (b.word || 'the Brain is still being read')));
    const list = offers();
    if (list.length) {
      d.appendChild(el('p', 'vera-small', 'The next step is yours. These are the Tool' + AP + 's own buttons; nothing starts until you press Yes.'));
      const acts = el('div', 'vera-acts');
      for (const o of list) { const x = el('button', 'go' + (o.press ? '' : ' ghost'), o.label); x.type = 'button'; x.addEventListener('click', () => take(o)); acts.appendChild(x); }
      d.appendChild(acts);
    }
  }
  d.appendChild(el('p', 'vera-small', 'Ask me anything about the Tool or your business below.'));
}
function turn() {
  const d = el('div', 'vera-turn');
  d.appendChild(el('p', 'vera-who', NAME()));
  $('#dock-turns').appendChild(d);
  d.scrollIntoView?.({ block: 'nearest' });
  return d;
}
function said(text, mine) {
  const d = mine ? el('div', 'vera-mine') : turn();
  if (mine) { d.appendChild(el('p', null, text)); $('#dock-turns').appendChild(d); d.scrollIntoView?.({ block: 'nearest' }); return d; }
  d.appendChild(el('p', null, text));
  speak(text);
  return d;
}
// Read aloud when she switched reading aloud on (box.js, this browser's own voice). Talk as a loop is the next round.
function speak(text) {
  try {
    if (localStorage.getItem('tool.readAloud') !== '1' || !window.speechSynthesis) return;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } catch (e) { /* not spoken: the words are on the screen */ }
}

// ---- YOUR BUSINESS, A CONVERSATION (1121, 1122) ----
const SECTIONS = [
  ['what kind of business it is', 'What kind of business is it? Tell me the way you would tell a friend, in the words of your trade.'],
  ['how you make money', 'How do you make money?'],
  ['your ideal customer', 'What does your ideal customer look like? Whatever comes to mind.'],
  ['how a job goes, from the first request to getting paid', 'Walk me through a job, from the first request to getting paid. Use the words you use every day.'],
  ['who you pay to get the work done', 'Who do you pay to get the work done?'],
  ['how new customers find you', 'How do new customers find you?'],
];
const LABEL = ['Your business', 'How you make money', 'Your ideal customer', 'How a job goes', 'Who you pay', 'How customers find you'];
const THANKS = 'Thank you. Anything else you want to add?';

function brainCall(fn, args) {
  let b = null, tok = '';
  try {
    b = JSON.parse(localStorage.getItem('verrandi.brain') || 'null');
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token') && (!b || k.includes(b.ref))) {
        const v = JSON.parse(localStorage.getItem(k) || 'null');
        tok = v?.access_token || v?.currentSession?.access_token || '';
        if (!b) b = { url: 'https://' + k.slice(3, k.length - 11) + '.supabase.co', key: '' };
      }
    }
  } catch (e) { /* read below as not signed in */ }
  if (!b || !b.url || !tok) return Promise.resolve({ ok: false, note: 'You are not signed in on this browser, so nothing can be kept. Sign in and try again.' });
  return fetch(b.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: b.key || '', Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
    .then((r) => r.json().then((j) => (r.ok ? j : { ok: false, note: j?.message || ('The brain refused (' + r.status + ').') })))
    .catch((e) => ({ ok: false, note: 'The brain could not be reached (' + String(e?.message || e) + '). Nothing was kept.' }));
}

// inPlace: Getting ready's card asks and collects (fill/ready.js, through window.veraBusiness); she says each turn in her
// column too, but what is typed in her column is then a question to her, not an answer.
async function startTalk(inPlace) {
  if (talk) return true;
  openPanel();
  const prof = await brainCall('business_profile_list', {});
  if (!prof || prof.ok !== true) { said(prof?.note || 'This part is for the owner of the business.'); return false; }
  const before = {};
  for (const s of prof.statements || []) {
    const a = String(s.area || '');
    const pre = 'how your business works, in your words: ';
    if (a.startsWith(pre) && s.status !== 'rejected') before[a.slice(pre.length)] = s.statement;
  }
  talk = { i: 0, said: SECTIONS.map(() => []), skipped: SECTIONS.map(() => false), extra: [], before, stage: 'ask', inPlace: !!inPlace };
  said('Say whatever comes to mind, in your own words and the jargon of your trade. There are no wrong answers. Six short questions; skip any.');
  if (Object.keys(before).length) said('You told me some of this before. I keep what you said unless you say it again now.');
  if (!inPlace) ask(); else drawSug();
  return true;
}
function ask() {
  talk.stage = 'ask';
  said(SECTIONS[talk.i][1]);
  drawSug();
  $('#panel-input')?.focus({ preventScroll: true });
}
function heard(text) {
  said(text, true);
  if (talk.stage === 'summary') { talk.extra.push(text); said(THANKS); talk.stage = 'extra'; drawSug(); return; }
  if (talk.stage === 'extra') { talk.extra.push(text); said(THANKS); drawSug(); return; }
  talk.said[talk.i].push(text);
  talk.stage = 'more';
  said(THANKS);
  drawSug();
}
function nextSection() {
  talk.i += 1;
  if (talk.i < SECTIONS.length) { ask(); return; }
  summary();
}
function summary() {
  talk.stage = 'summary';
  const d = turn();
  d.classList.add('vera-sum');
  d.appendChild(el('p', null, 'Here is what you told me, in your words.'));
  let any = false;
  SECTIONS.forEach((s, i) => {
    const now = talk.said[i].join(' ');
    const old = talk.before[s[0]] || '';
    const w = now || old;
    d.appendChild(el('p', 'vera-sum-h', LABEL[i]));
    d.appendChild(el('p', w ? null : 'vera-small', w || 'Nothing said.'));
    if (!now && old) d.appendChild(el('p', 'vera-small', 'What you told me before.'));
    if (now) any = true;
  });
  if (talk.extra.length) { d.appendChild(el('p', 'vera-sum-h', 'Anything else')); d.appendChild(el('p', null, talk.extra.join(' '))); any = true; }
  const q = 'Is this right, and is there anything else you want to say?';
  d.appendChild(el('p', null, q)); speak(q);
  talk.any = any;
  drawSug();
}
async function keep() {
  const rows = [];
  SECTIONS.forEach((s, i) => { const w = talk.said[i].join(' ').trim(); if (w) rows.push([s[0], w]); });
  if (talk.extra.length) rows.push(['anything else you said', talk.extra.join(' ').trim()]);
  if (!rows.length) { said('Nothing new was said, so nothing changed.'); talk = null; drawSug(); return { ok: true, kept: 0, of: 0, note: 'Nothing new was said, so nothing changed.' }; }
  const wait = said('Keeping it.');
  wait.classList.add('working');
  const bad = [];
  for (const [sec, w] of rows) {
    const r = await brainCall('business_profile_owner_say', { p_section: sec, p_words: w.slice(0, 1000) });
    if (!r || r.ok !== true) bad.push((r && r.note) || 'not kept');
  }
  wait.classList.remove('working');
  const res = bad.length ? { ok: false, kept: rows.length - bad.length, of: rows.length, note: 'Not all of it was kept: ' + bad[0] + ' Kept ' + (rows.length - bad.length) + ' of ' + rows.length + '.' }
    : { ok: true, kept: rows.length, of: rows.length, note: 'Kept as How your business works, in your words (' + rows.length + ' of ' + rows.length + '). Change it any time: tell me again here, or open What your Tool believes.' };
  said(res.note);
  talk = null;
  drawSug();
  return res;
}
function redo() {
  talk.i = 0; talk.said = SECTIONS.map(() => []); talk.extra = [];
  said('Of course. From the start; skip any part you are happy with.');
  ask();
}
function drawTalkActs(box) {
  const mk = (label, fn, main) => { const b = el('button', 'vera-chip' + (main ? ' vera-chip-main' : ''), label); b.type = 'button'; b.addEventListener('click', fn); box.appendChild(b); };
  if (talk.stage === 'ask') mk('Skip this one', () => { said('Skipped.', true); nextSection(); });
  if (talk.stage === 'more') mk('No, that is it', () => { said('No, that is it.', true); nextSection(); }, true);
  if (talk.stage === 'summary' || talk.stage === 'extra') {
    mk('That is right, keep it', keep, true);
    mk('Change something', redo);
  }
  if (talk.stage === 'extra') mk('Show me the summary again', summary);
  mk('Stop for now', () => { said('Stopped. Nothing was kept from this conversation; start again any time.'); talk = null; drawSug(); });
}

// THE BUSINESS CONVERSATION, ANSWERED IN PLACE (seat getting-ready-fix-1). fill/ready.js draws each question on the card and
// calls these; one conversation, kept here, so the words, the thank-you and the summary are the same ones her column shows.
window.veraBusiness = {
  keys: SECTIONS.map((s) => s[0]),
  questions: SECTIONS.map((s) => s[1]),
  labels: LABEL,
  thanks: THANKS,
  running: () => !!talk,
  state: () => (talk ? { said: talk.said.map((a) => a.join(' ')), skipped: talk.skipped ? talk.skipped.slice() : SECTIONS.map(() => false), extra: talk.extra.join(' '), before: Object.assign({}, talk.before), stage: talk.stage } : null),
  begin: () => startTalk(true),
  ask: (i) => { if (!talk) return; talk.i = i; talk.stage = 'ask'; said(SECTIONS[i][1]); },
  answer: (i, text) => { if (!talk) return ''; const w = String(text || '').trim(); if (!w) return ''; said(w, true); talk.said[i].push(w); if (talk.skipped) talk.skipped[i] = false; talk.stage = 'more'; said(THANKS); return THANKS; },
  skip: (i) => { if (!talk) return; if (talk.skipped) talk.skipped[i] = true; said('Skipped.', true); },
  more: (text) => { if (!talk) return ''; const w = String(text || '').trim(); if (!w) return ''; said(w, true); talk.extra.push(w); said(THANKS); return THANKS; },
  summary: () => { if (talk) summary(); },
  keep: () => (talk ? keep() : Promise.resolve({ ok: true, kept: 0, of: 0, note: 'Nothing new was said, so nothing changed.' })),
  stop: () => { if (!talk) return; said('Stopped. Nothing was kept from this conversation; start again any time.'); talk = null; drawSug(); },
};

// "CALL ME SOMETHING ELSE" (seat getting-ready-fix-1; decision 1127 puts the guide's name in Settings, which has no place for
// it yet, so it is here). Kept per person by getting_ready_mark (the screen's recorded choices), read back by the screen.
function rename() {
  const d = turn();
  d.appendChild(el('p', null, 'What would you like to call me?'));
  const row = el('div', 'vera-acts');
  const i = el('input', 'vera-name-in'); i.maxLength = 30; i.value = NAME(); i.setAttribute('aria-label', 'Your guide' + AP + 's name'); i.setAttribute('autocomplete', 'off');
  const ok = el('button', 'go', 'Save'); ok.type = 'button';
  row.append(i, ok); d.appendChild(row);
  i.focus({ preventScroll: true });
  ok.addEventListener('click', async () => {
    const n = i.value.trim() || 'Vera';
    ok.disabled = true;
    const r = await brainCall('getting_ready_mark', { p_key: 'guide_name', p_value: { name: n }, p_wording: null });
    row.remove();
    if (!r || r.ok !== true) { said('Not changed: ' + String(r?.note || r?.reason || 'no reason was given') + '.'); return; }
    document.body.dataset.guide = n;
    said('From now on I am ' + n + '. Change it here any time.');
    window.dispatchEvent(new Event('gr-refresh'));
  });
}

// WHILE SHE IS IN THE COLUMN, NOTHING OF HERS CHANGES TAB (seat getting-ready-fix-1, Alex 16:42 PT). These three move to
// Work (lens.js): Open in Work, Your conversations, and an answer's Open wide. In her column they are hidden (skin.css) and,
// if pressed anyway, refused here in the capture phase so lens.js never hears them.
function stay(e) {
  if (!inColumn() || !e.target.closest) return;
  const t = e.target.closest('#panel-work, #panel-list, .wide-open');
  if (!t || !$('#panel').contains(t)) return;
  e.preventDefault(); e.stopImmediatePropagation();
}

// HER BOX (seat getting-ready-fix-1): it grows with what she types, so she sees all of it; Shift+Enter is a new line (box.js
// sends on Enter, so the new line is kept from it here); it is empty after sending.
function grow() {
  const i = $('#panel-input');
  if (!i || i.tagName !== 'TEXTAREA') return;
  i.style.height = 'auto';
  i.style.height = Math.min(i.scrollHeight, 220) + 'px';
}
function emptyAfter() {
  const i = $('#panel-input');
  if (!i) return;
  const sent = i.value;
  setTimeout(() => { if (i.value === sent) i.value = ''; grow(); }, 0);
  setTimeout(() => { if (i.value === sent) i.value = ''; grow(); }, 400);
}

// While the business conversation runs in her column (not in place), what she types or says goes to it, not to lens-ask
// (her words are kept as she said them; nothing is sent to a model). Capture phase, so box.js's own Go never sees it.
function intercept(e) {
  if (e.type === 'keydown' && e.key === 'Enter' && e.shiftKey && e.target && e.target.id === 'panel-input') { e.stopImmediatePropagation(); setTimeout(grow, 0); return; }
  const isGo = e.type === 'click' && e.target.closest && e.target.closest('#panel-send');
  const isEnter = e.type === 'keydown' && e.key === 'Enter' && e.target && e.target.id === 'panel-input';
  if (!isGo && !isEnter) return;
  if (!talk || talk.inPlace) { fromPanel = Date.now(); emptyAfter(); return; }
  const i = $('#panel-input');
  const v = (i?.value || '').trim();
  e.preventDefault(); e.stopImmediatePropagation();
  if (!v) return;
  i.value = ''; grow();
  heard(v);
}

// ---- THE COLUMN ----
function inColumn() { const p = $('#panel'); return !!p && p.classList.contains('in-vera'); }
let panelEl = null;
function placeColumn() {
  if (!panelEl) panelEl = $('#panel');
  const p = panelEl;
  if (!p) return;
  // A column redrawn by its screen takes the panel with it: put it back home first, never lose the conversation.
  if (!p.isConnected && home) { home.after(p); p.classList.remove('in-vera'); p.hidden = true; delete document.body.dataset.veraCol; }
  const r = readyNow();
  if (r && p.parentElement !== r.col) {
    if (p.classList.contains('in-work')) return;
    if (!home) { home = document.createComment('the conversation panel lives here'); p.before(home); }
    r.col.appendChild(p);
    p.classList.add('in-vera'); p.classList.remove('full'); p.style.transform = '';
    p.hidden = false; const tabBtn = $('#panel-tab'); if (tabBtn) tabBtn.hidden = true;
    delete document.body.dataset.panel;
    document.body.dataset.veraCol = 'on';
    drawLook(); drawSug();
    if (r.step) greet();   // not before the step row is drawn (she greeted twice: once on "Reading", once on the step)
  } else if (!r && inColumn() && home) {
    home.after(p);
    p.classList.remove('in-vera');
    p.hidden = true;
    delete document.body.dataset.veraCol;
  }
}
function openPanel() {
  if (!inColumn() && readyNow()) placeColumn();   // on Getting ready she opens IN PLACE, in her column; nothing navigates
  if (!inColumn() && !readyNow()) {
    const ask = $('#tabs .tab-ask');
    if (ask) ask.click(); else { const p = $('#panel'); if (p) { p.hidden = false; document.body.dataset.panel = 'open'; } }
  }
}
function open() {
  openPanel();
  drawLook();
  greet();
  drawSug();
  // SUPERSEDED (seat getting-ready-fix-1): Getting ready's 'Start with Vera' on step 3 no longer starts the conversation in
  // her column; step 3 is answered on the card (fill/ready.js, window.veraBusiness).
  $('#panel-input')?.focus({ preventScroll: true });
}

// What she is looking at, on the way out, for a question from her conversation only (see the header).
function wrapFetch() {
  const real = window.fetch.bind(window);
  window.fetch = (u, o) => {
    try {
      if (typeof u === 'string' && u.endsWith('/functions/v1/lens-ask') && o && typeof o.body === 'string'
          && o.body.startsWith('{"question"') && Date.now() - fromPanel < 4000) {
        const b = JSON.parse(o.body);
        if (b && typeof b.question === 'string' && b.screen === undefined) {
          b.screen = screenText();
          o = Object.assign({}, o, { body: JSON.stringify(b) });
        }
        fromPanel = 0;
      }
    } catch (e) { /* the question goes as it was */ }
    return real(u, o);
  };
}

function start() {
  if ($('#vera-btn')) return;
  btn = el('button', 'vera-btn');
  btn.id = 'vera-btn'; btn.type = 'button';
  btn.append(el('span', 'vera-name', 'Vera'), el('i', 'vera-dot'));
  btn.addEventListener('click', open);
  document.body.appendChild(btn);
  wrapFetch();
  document.addEventListener('click', stay, true);
  document.addEventListener('click', intercept, true);
  document.addEventListener('keydown', intercept, true);
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'panel-input') grow(); }, true);
  let due = 0;
  const later = () => {
    if (due) return;
    due = requestAnimationFrame(() => {
      due = 0; paintDot(); placeColumn();
      // her box is empty when the step changes
      const k = readyNow()?.key ?? null;
      if (k !== lastKey) { if (lastKey !== null && k !== null) { const i = $('#panel-input'); if (i) { i.value = ''; grow(); } } lastKey = k; }
      if ($('#vera-look')) drawLook();
      const p = $('#panel');
      if (p && !p.hidden) { greet(); if (!talk || talk.inPlace) drawSug(); }
    });
  };
  new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ['data-tab', 'data-panel', 'class'] });
  document.addEventListener('click', later, true);
  const mh = $('.masthead');
  if (mh) new MutationObserver(later).observe(mh, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  // The Getting ready screen draws its column after the first reading: watch for it, then for its steps.
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-current', 'data-vera-column'] });
  paintDot();
  placeColumn();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

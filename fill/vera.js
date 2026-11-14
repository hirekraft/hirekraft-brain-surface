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
// SHE IS THE ONE DOOR, ON EVERY TAB (seat vera-one-door, 2026-11-14; decision 1175 and its picture RxLG1Ec8Zs6LCmhiEMk8dj, with
// 1113, 1116, 1123, 1130). The box at the top of the page is gone (skin.css); the one conversation panel IS her column: open
// beside every tab on a wide screen unless the person put her away (remembered in this browser), one tap on her button on a
// phone. After a reload the conversation the person was in today comes back (lens.js toolLens.latest). Answers there are
// short with More (lens.js drawAsk), and Teach / Save as test are not drawn in her column (skin.css; they stay in Work and at
// full screen, where Alex keeps his stored tests).
// WHAT SHE IS LOOKING AT GOES WITH THE QUESTION. fill/point.js (the one shared helper, decision 1130) hands her what the person
// pointed at: she names it in her first line, shows it in her "looking at" line with a way to drop it, and lens.js ask() reads
// it from window.veraContext: an email goes as lens-ask's anchor (so "tell him Monday" comes back as a draft), anything else
// as one line in front of the question. Leaving the tab drops it. A DRAFT IS HER ONE-OFF ACTION (1175.2): fill/act.js draws it
// with Send, Change, Not Now; only the person's press sends.
// SUPERSEDED 2026-11-14, removed with its rationale: the wrapper round fetch that added a field named screen to a question
// (seat vera-guide). The deployed lens-ask reads no such field (read at source 2026-11-14), so what she was looking at never
// reached the answer; window.veraScreen stays only as the words of the "looking at" line's source.
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
// SEAT setup-vera (2026-11-12; decision 1150 point 4, picture Cbdma9KRabK6Pb5YFdwkrd Part 4; Alex's screenshots of 2026-11-10):
// BESIDE EVERY SETUP STEP SHE IS ALREADY LOOKING AT IT: one opener line written for the step, and the step's two real
// questions (what it costs, how long it takes) as taps. SETUP QUESTIONS ARE FREE AND INSTANT: answered here, with no model
// and no call to lens-ask, from the step's own card as drawn (its Cost, Time and source line) and, on Make it searchable, from
// the brain's own progress (search_progress, source_read_progress, read through brainCall as the person). A name close to a
// connected mailbox ("Stratservice" for stratserv) is that mailbox. A typed question is hers to answer only when every word
// of it is a setup word or names a connected mailbox; anything else goes to the box as before, which shows its plan and price
// first. THE ANSWER FILLS HER COLUMN: the last free exchange only, no scroll box inside, at most two follow-ups, and in her
// column no PDF / Spreadsheet / Slides and no Teach / Save as test (skin.css). SUPERSEDED here, Alex's yes on 1150: the generic
// chips on a setup step (Call me something else, Where are we?, Is everything connected?, Why does it need my mailbox?) and
// the one greeting for all steps. Her name is changed from Settings (window.veraRename).
// No regex literals and no backslashes (STANDING-CLAUSES).

import { startPoint } from './point.js?v=2026-11-14-vera-one-door';
import { draftCard } from './act.js?v=2026-11-14-day-one-fixes';
import { plainWords } from './plain.js?v=2026-10-27-mail-views';   // raw error words never reach her (seat day-one-fixes, morning-audit-2 fix 6)

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const DOT = String.fromCharCode(183);
const AP = String.fromCharCode(39);
let greeted = '';
let bypass = false;       // a typed question she could not answer for free is on its way to the box
let btn = null;
let home = null;          // where the panel lives when it is not in her column
let pointed = null;       // what the person pointed at (fill/point.js): { kind, label, text, anchor, about, turns, card, tab }
let dressed = '';         // the name her column was last dressed with
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
  const step = cur && cur.children.length ? [...cur.children].filter((x) => !x.classList.contains('gs-mark')).map(words).filter(Boolean).join(' ') : words(cur);   // the step's number line and its name, apart
  return { col: colEl, step, key: stepKey(step + ' ' + words(card)), card: words(card), lead: words(lead).slice(0, 240), nums, acts };
}

// Which setup step, from the screen's own words (English; the step row's keys when the screen carries them).
function stepKey(t) {
  const s = String(t || '').toLowerCase();
  const tag = $('[aria-current="step"][data-step]')?.dataset.step;
  if (tag) return tag;
  if (s.includes('your business')) return 'business';
  if (s.includes('findable') || s.includes('searchable')) return 'find';
  if (s.includes('understand')) return 'understand';
  if (s.includes('database')) return 'db';
  if (s.includes('connect')) return 'connect';
  if (s.includes('ready')) return 'ready';
  if (s.includes('start') || s.includes('welcome')) return 'start';
  return '';
}

// Where she is: the tab, and on the Brain its part and the open side panel.
function looking() {
  if (pointed) return pointed.label;
  const r = readyNow();
  if (r) return r.step ? 'step ' + r.step : 'Getting started';
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
  const sig = NAME() + t + (pointed ? '|p' : '');
  if (p.dataset.t === sig) return;   // unchanged: drawing it again would wake the watcher below for nothing
  p.dataset.t = sig;
  if (!pointed) { p.replaceChildren(el('b', null, NAME()), document.createTextNode(t)); return; }
  // What she was pointed at is the person's own material: shown as written, with one press to stop looking at it.
  const what = el('span', 'vera-look-what', pointed.label); what.translate = false;
  const x = el('button', 'vera-look-x', String.fromCharCode(215)); x.type = 'button'; x.setAttribute('aria-label', 'Stop looking at this'); x.title = 'Stop looking at this';
  x.addEventListener('click', () => { pointed = null; drawLook(); drawSug(); });
  p.replaceChildren(el('b', null, NAME()), document.createTextNode(' ' + DOT + ' looking at: '), what, x);
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
  const read = $$('#br-files button.go').find((b) => b.textContent.trim() === 'Read Them' && !b.disabled);
  if (read) out.push({ label: 'Read Them (it shows the price first)', find: () => $$('#br-files button.go').find((b) => b.textContent.trim() === 'Read Them'), press: true });
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
    find: ['What does searchable mean?', p ? 'Why only ' + p + '?' : 'Why is this so cheap?', 'Can I stop here?', 'Can I use Mail yet?'],
    understand: ['What does understood mean?', 'Can I do 6 months first?', 'What does it cost every month after this?'],
    ready: ['What happens after ready?', 'Can I use Mail yet?'],
  };
  // On the tabs of a brain that is Ready she offers no stock questions (seat vera-one-door: a chip is a question the person did not ask, and each costs).
  const list = !r && (!b || b.ready) ? [] : ['Where are we?'].concat(S[key] || (b && !b.ready ? ['What does searchable mean?', 'Can I stop here?', 'Can I use Mail yet?'] : []));
  return { key, list };
}
function drawSug() {
  const foot = $('#panel .panel-foot');
  if (!foot) return;
  let box = $('#vera-sug');
  if (!box) { box = el('div', 'vera-sug'); box.id = 'vera-sug'; foot.before(box); }
  const { key, list } = suggestions();
  let taps = !talk || talk.inPlace ? (readyNow() ? stepTaps() || [] : null) : null;   // on Getting started: the step's two questions and nothing else (none where no step card is shown, as for someone who is not the owner)
  if (taps && $('#dock-turns .vera-free')) taps = [];     // under a free answer its own follow-ups are the taps: two at most on the screen
  const sig = talk && !talk.inPlace ? 'talk|' + talk.stage + '|' + talk.i : taps ? 'step|' + key + '|' + taps.map((t) => t[0]).join('|') : key + '|' + list.join('|') + '|' + (readyNow() ? 1 : 0) + (pointed ? '|p:' + pointed.kind + pointed.label : '');
  if (box.dataset.sig === sig) return;   // unchanged: see drawLook
  box.dataset.sig = sig;
  box.replaceChildren();
  if (talk && !talk.inPlace) { drawTalkActs(box); return; }
  if (taps) {
    for (const [q, id] of taps) { const c = el('button', 'vera-chip', q); c.type = 'button'; c.addEventListener('click', () => setupAsk(q, [id], null)); box.appendChild(c); }
    return;
  }
  // On Getting ready step 3 is answered on the card itself (fill/ready.js); her column keeps only questions about the step.
  if ((key === 'business' && !readyNow()) || (readyNow() === null && brainNow() && !brainNow().ready)) {
    const t = el('button', 'vera-chip vera-chip-main', key === 'business' ? 'Start: tell me about your business' : 'Your business: tell me in your words');
    t.type = 'button'; t.addEventListener('click', startTalk); box.appendChild(t);
  }
  // Pointed at an email: the two things people do with one, as taps. They are asked like anything typed.
  const mine = pointed && pointed.anchor ? ['What is this about?', 'Draft a reply'] : [];
  for (const q of mine.concat(list)) {
    const c = el('button', 'vera-chip', q); c.type = 'button';
    c.addEventListener('click', () => askIt(c.textContent || q));   // as the tap reads now: in her language when the screen is
    box.appendChild(c);
  }
}
function askIt(q) {
  const i = $('#panel-input'), s = $('#panel-send');
  if (!i || !s) return;
  i.value = q; s.click();
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
  if (r) { opener(r.key, turns); return; }   // beside a setup step: one line written for that step (seat setup-vera)
  if (!$('.vera-turn', turns)) greeted = '';   // a new conversation: she greets again
  // SUPERSEDED 2026-11-12 (seat setup-vera, 1150.4): the one greeting for every step of Getting ready (seat getting-ready-fix-1).
  { const at = b.word + '|' + b.step; if (greeted === at) return; greeted = at; }
  const d = turn();
  {
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

// SETTINGS (seat setup-screens-2, spec part 2, decision 1138): "Your guide · Change" opens this same rename, and VERA
// PROPOSES A CHANGE: Settings hands her the exact change, its price and the row's own function (P.yes); she says it in her
// column with Yes and Not now. Nothing happens until the person presses Yes, and Yes is that same function (one path). She
// never presses (1115). A proposal with no yes is only said (a change that is not built yet).
window.veraRename = () => { open(); rename(); };
window.veraPropose = (P) => {
  open();
  if (P.asked) said(String(P.asked), true);
  const d = turn();
  d.appendChild(el('p', null, String(P.say || '')));
  if (!P.yes) { speak(String(P.say || '')); return; }
  const box = el('div', 'vera-prop');
  for (const [a, b] of P.lines || []) { const r = el('div', 'gs-pl'); r.append(el('span', null, String(a)), el('b', 'gs-pv', String(b))); box.appendChild(r); }
  const acts = el('div', 'vera-acts');
  const yes = el('button', 'go', 'Yes, do it'); yes.type = 'button';
  const no = el('button', 'go ghost', 'Not now'); no.type = 'button';
  const out = el('p', 'vera-small');
  acts.append(yes, no); box.append(acts, out); d.appendChild(box);
  speak(String(P.say || ''));
  yes.addEventListener('click', async () => {
    yes.disabled = true; no.disabled = true; out.className = 'vera-small working no-late'; out.textContent = 'Doing it';
    let r;
    try { r = await P.yes(); } catch (e) { r = { ok: false, note: 'Not changed: ' + plainWords(String(e?.message ?? e)) + '.' }; }
    out.className = 'vera-small'; out.textContent = String(r?.note || (r?.ok ? 'Done.' : 'Not changed.'));
    if (r?.ok) acts.remove(); else { yes.disabled = false; no.disabled = false; }
  });
  no.addEventListener('click', () => { acts.remove(); out.textContent = 'Nothing was changed.'; });
};

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
  const i = $('#panel-input');
  const v = (i?.value || '').trim();
  // A SETUP QUESTION IS HERS, FREE (seat setup-vera): beside a step, a question that asks what it costs, how long it takes or
  // where we are never reaches the box. If it turns out to hold a word that is not about setup, typed() sends it on.
  if ((!talk || talk.inPlace) && !bypass && v && stepTaps() && (askedOf(v).length || partish(v))) {   // partish: "understand <mailbox>, only <year>" is hers too (seat understand-part)
    e.preventDefault(); e.stopImmediatePropagation();
    i.value = ''; grow();
    typed(v);
    return;
  }
  if (!talk || talk.inPlace) { emptyAfter(); return; }
  e.preventDefault(); e.stopImmediatePropagation();
  if (!v) return;
  i.value = ''; grow();
  heard(v);
}

// ---- BESIDE A SETUP STEP: HER OPENER, THE STEP'S TWO QUESTIONS, AND FREE ANSWERS (seat setup-vera, decision 1150.4) ----
// Every figure she says is the step card's own (head) or the brain's own progress (facts); she works nothing out but a sum
// over the mailboxes a name matched. What could not be read is said with its reason, never as nothing.
const OPEN = {
  db: 'Step 1 is your own database. Everything the Tool learns about your business is kept there, and it stays yours.',
  connect: 'Step 2 is connecting your mailboxes, drives and systems. Connecting and counting are free.',
  search: 'Step 3 makes what you connected searchable. It is the first step that costs money, and you see the price before you press.',
  understand: 'Step 4 reads what you choose and notes the facts in it. You see its price and set your limit before anything is read.',   /* seat ready-alive 2026-11-14 (morning-audit fix 4): true in every state; SUPERSEDED: a line that promised a sample after the press was done */
  ready: 'Step 5 shows whether your brain is ready, and what the Tool costs each month.',
};
const TAPS = {
  db: [['What does the database cost?', 'cost'], ['How long does this step take?', 'time']],
  connect: [['What does connecting cost?', 'cost'], ['How long does connecting take?', 'time']],
  search: [['What does this cost?', 'cost'], ['How long will it take?', 'time']],
  understand: [['What will understanding cost?', 'cost'], ['How long will it take?', 'time']],
  ready: [['What does it cost each month?', 'cost'], ['How long until it is ready?', 'time']],
};
const WHERE = 'Where are we?';
// The step card as drawn (fill/ready.js shape: Cost, Time, and the line saying where they come from). null when the screen
// shows no card: someone who is not the owner sees no prices, and is given none.
function head() {
  const c = $('#gs-shape');
  /* STEPS 3 AND 4 HAVE NO COST AND TIME CARD (seat setup-polish 2026-11-13, audit fix 6): there the step says how it stands itself (fill/ready.js window.toolSetup, from the readings its cards are drawn from). Without this she had no two questions on steps 3 and 4 and a typed setup question got no answer at all. */ if (!c || !shown(c)) { const t = typeof window.toolSetup === 'function' ? window.toolSetup() : null; return t ? { cost: String(t.cost || ''), time: String(t.time || ''), src: String(t.src || ''), open: String(t.open || '') } : null; }
  const ct = $$('.gs-ct > div', c).map((d) => words($('b', d)));
  const t1 = typeof window.toolSetup === 'function' ? window.toolSetup() : null;   /* the step's own line on how it stands, where it has one (seat setup-clean 2026-11-13: her opener matches the step's real state on every step) */
  return { cost: ct[0] || '', time: ct[1] || '', src: words($('.am-small', c)), open: t1 && t1.open ? String(t1.open) : '' };
}
function stepTaps() { const r = readyNow(); return r && r.key && TAPS[r.key] && head() ? TAPS[r.key] : null; }
function opener(key, turns) {
  let o = $('#vera-open');
  const hd = head(), t = (hd && hd.open) || OPEN[key];   /* a step that has moved on says so: after a press her line no longer promises a sample (seat setup-polish) */
  if (!t) { if (o) o.remove(); return; }
  if (o && o.isConnected && o.dataset.k === key + '|' + t) return;
  if (!o || !o.isConnected) { o = el('div', 'vera-turn vera-open'); o.id = 'vera-open'; turns.prepend(o); }
  o.dataset.k = key + '|' + t;
  o.replaceChildren(el('p', 'vera-who', NAME()), el('p', null, t));
  $$('.vera-free', turns).forEach((x) => x.remove());   // an answer about the step she left
}

// THE BRAIN'S OWN PROGRESS, as the person (search_progress: the press, its price, its sources; source_read_progress: every
// mailbox and drive she may see). Kept 15 seconds. A refusal keeps its reason.
let fact = null, factAt = 0, factBusy = null;
function facts(fresh) {
  if (!fresh && fact && Date.now() - factAt < 15000) return Promise.resolve(fact);
  if (factBusy) return factBusy;
  factBusy = Promise.all([brainCall('search_progress', {}), brainCall('source_read_progress', {})]).then(([g, rows]) => {
    factBusy = null;
    const why = (x) => String(x?.note || x?.reason || x?.error || 'no reason was given');
    fact = { press: g && g.ok === true ? g : null, pressWhy: g && g.ok === true ? '' : why(g), rows: Array.isArray(rows) ? rows : null, rowsWhy: Array.isArray(rows) ? '' : why(rows) };
    factAt = Date.now();
    return fact;
  });
  return factBusy;
}

// WHAT A TYPED QUESTION ASKS, FROM ITS WORDS ALONE. English words only: a question in another language goes to the box.
const LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789@.-_$';
const KNOWN = (' a about account accounts add after again all already also am an and any are as at attachment attachments be been before being brain but by can'
  + ' charge charged cheap connect connected connecting cost costing costs could credit database do does doing done drive drives each email emails estimate'
  + ' everything expensive far file files finish finished first for from get getting go going got had has have here hour hours how i if in inbox is it its just'
  + ' left like limit long longer mail mailbox mailboxes make making many me minute minutes more much my need needed next now of on one only or out over pay'
  + ' paying price priced prices progress read reading ready really rest s sample search searchable setup so started status step steps still take takes taking'
  + ' than that the then there this time to tool total understand understanding understood until up vera was what when where which whole why will with would'
  + ' yet you your ').split(' ').filter(Boolean);
function toks(q) {
  const out = []; let cur = '';
  for (const ch of String(q || '').toLowerCase()) { if (LETTERS.includes(ch)) cur += ch; else { if (cur) out.push(cur); cur = ''; } }
  if (cur) out.push(cur);
  const edge = '.-_';
  return out.map((t) => { let a = 0, b = t.length; while (a < b && edge.includes(t[a])) a++; while (b > a && edge.includes(t[b - 1])) b--; return t.slice(a, b); }).filter(Boolean);
}
function askedOf(q) {
  const t = ' ' + toks(q).join(' ') + ' ';
  const has = (w) => t.includes(w);
  const ids = [];
  const time = has(' how long') || has(' longer') || has(' how much time') || has(' time left') || has(' when ') || has(' minutes') || has(' hours') || has(' finish') || has(' done ');
  const much = has(' how much') && !has(' how much longer') && !has(' how much time');
  if (has(' cost') || has(' price') || has(' pay ') || has(' paying') || has(' charge') || has(' expensive') || has(' cheap') || much) ids.push('cost');
  if (time) ids.push('time');
  if (has(' where are we') || has(' progress') || has(' how far') || has(' status')) ids.push('where');
  return ids;
}
// Two names are one when they are equal, or both have five letters or more and one begins with the other, or they differ by
// at most two letters in six or more (stratservice is stratserv; acme is nobody here).
function near(a, b) {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5) return false;
  const sh = a.length <= b.length ? a : b, lg = sh === a ? b : a;
  if (lg.startsWith(sh)) return true;
  if (sh.length < 6 || lg.length - sh.length > 2) return false;
  let prev = []; for (let j = 0; j <= lg.length; j++) prev.push(j);
  for (let i = 1; i <= sh.length; i++) { const row = [i]; for (let j = 1; j <= lg.length; j++) row.push(Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (sh[i - 1] === lg[j - 1] ? 0 : 1))); prev = row; }
  return prev[lg.length] <= 2;
}
const mailOf = (r) => (String(r.source || '').startsWith('gmail:') ? String(r.source).slice(6).toLowerCase() : '');
// Which connected mailboxes a word names: the whole address, what follows the @, or its first part (stratserv of stratserv.co).
// The part before the @ counts only when the question also says mailbox, account, inbox, mail or email (marketing alone is
// her business, not a mailbox).
function named(tok, rows, boxSaid) {
  const first = (x) => x.split('.')[0];
  const w = tok.includes('@') ? tok.split('@')[1] || tok : tok;
  return rows.filter((r) => {
    const m = mailOf(r); if (!m) return false;
    const [local, dom] = m.split('@');
    if (tok === m) return true;
    if (dom && (near(w, dom) || near(first(w), first(dom)))) return true;
    return boxSaid && !tok.includes('@') && tok === local;
  });
}
// null when the question is not hers to answer for free; otherwise what it asks and the mailboxes it names (null: none named).
function route(q, f) {
  const ids = askedOf(q);
  if (!ids.length) return null;
  const all = toks(q);
  const rows = (f && f.rows) || [];
  const boxSaid = all.some((t) => ['mailbox', 'mailboxes', 'account', 'accounts', 'inbox', 'mail', 'email'].includes(t));
  const t = ' ' + all.join(' ') + ' ';
  const we = t.includes(' where are we ');
  let about = null;
  for (const tok of all) {
    if (KNOWN.includes(tok) || (we && tok === 'we')) continue;
    const hit = named(tok, rows, boxSaid);
    if (!hit.length) return null;   // a word that is neither setup nor a connected mailbox: her business, the box's to answer
    about = (about || []).concat(hit.filter((r) => !(about || []).includes(r)));
  }
  return { ids, about };
}

const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => '$' + Number(n || 0).toFixed(2);
// DUPLICATE, named: minutes or hours left is also worded in fill/ready.js (leftWords) and fill/brainpress.js; fold the three into one.
const left = (m) => { const x = Number(m); if (m === null || m === undefined || !Number.isFinite(x)) return ''; return x < 90 ? 'about ' + num(Math.max(1, Math.round(x))) + ' minutes' : 'about ' + num(Math.round(x / 60)) + ' hours'; };
function clock(at) {
  const d = new Date(at);
  if (!at || Number.isNaN(d.getTime())) return '';
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? t : t + ' on ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
// What is in line for these sources, read off source_read_progress's own columns.
function lineOf(rows) {
  const live = rows.filter((r) => Number(r.waiting) > 0);
  const sum = (k, rs) => rs.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const ml = live.length && live.every((r) => r.minutes_left !== null && r.minutes_left !== undefined) ? Math.max(...live.map((r) => Number(r.minutes_left) || 0)) : null;
  return { live: live.length, done: sum('line_done', live), total: sum('line_total', live), pm: Math.round(sum('per_minute', live) * 10) / 10, ml, idle: live.length > 0 && sum('per_hour', live) === 0,
    kept: sum('done', rows), yes: sum('waiting_for_owner', rows) + sum('files_waiting_for_owner', rows) };
}
function paceWords(L) {
  if (L.pm > 0 && L.ml !== null) return 'At ' + num(L.pm) + ' a minute that is ' + left(L.ml) + ' left.';
  if (L.idle) return 'Nothing has been read in the last hour, so I have no pace and no time left to give.';
  return 'The pace is still being measured, so I have no time left to give yet.';
}
function pressWords(g, n) {
  const at = clock(g.started_at);
  return 'about ' + usd(g.usd_planned) + ' in all' + (n > 1 ? ' for the ' + num(n) + ' sources you pressed together' : '') + (at ? ', as you agreed at ' + at : ', as you agreed when you pressed') + '. Nothing more is charged for it.';
}
// THE ANSWER, in sentences. ids: cost, time, where. about: the mailboxes the question named, or null.
function answer(key, ids, about, h, f) {
  const out = [];
  const g = f && f.press;
  const pressed = g && (g.state === 'reading' || g.state === 'stopped') ? (g.sources || []).map((x) => x.source) : [];
  if (about && about.length) {
    const who = about.length === 1 ? mailOf(about[0]) : 'those ' + num(about.length) + ' mailboxes';
    const L = lineOf(about);
    const inPress = about.some((r) => pressed.includes(r.source));
    if (ids.includes('time')) {
      if (L.live) out.push(num(L.done) + ' of ' + num(L.total) + ' items of ' + who + ' are read. ' + paceWords(L));
      else if (L.yes) out.push('Nothing of ' + who + ' is being read now: ' + num(L.yes) + ' items wait for your yes on step 3.');
      else out.push(who.slice(0, 1).toUpperCase() + who.slice(1) + ': nothing is waiting to be read. ' + num(L.kept) + ' items are read.');
    }
    if (ids.includes('cost')) {
      if (inPress) out.push('It costs ' + pressWords(g, pressed.length));
      else if (L.live && !g) out.push('What you agreed for it could not be read just now (' + f.pressWhy + '). Step 3 shows it.');
      else if (L.yes) out.push(num(L.yes) + ' items of ' + who + ' wait for your yes. Their price is on step 3 beside the name, before you press; nothing is charged until then.');
      else out.push('Nothing of ' + who + ' is being read or waiting, so nothing is being charged for it.');
    }
  } else {
    const reading = key === 'search' && g && g.state === 'reading';
    if (ids.includes('time')) {
      if (reading) { const L = lineOf((g.sources || [])); out.push(num(g.items_done) + ' of ' + num(g.items_total) + ' items are read. ' + (g.minutes_left !== null && g.minutes_left !== undefined && L.pm > 0 ? 'At ' + num(L.pm) + ' a minute that is ' + left(g.minutes_left) + ' left.' : paceWords(L)) + ' It keeps reading by itself.'); }
      else out.push('Time for this step: ' + (h.time || 'not shown') + '.');
    }
    if (ids.includes('cost')) {
      if (reading) out.push('What is being read costs ' + pressWords(g, pressed.length) + (h.cost.includes('$') ? ' What is checked now on this step: ' + h.cost + '.' : ''));
      else out.push('Cost of this step: ' + (h.cost || 'not shown') + '.' + (h.src ? ' ' + h.src + '.' : ''));
    }
    if (key === 'search' && f && !g && f.pressWhy && !reading) out.push('The progress could not be read just now (' + f.pressWhy + '), so this is what the step card shows.');
  }
  if (ids.includes('where')) {
    const st = $$('#gr-steps [data-step]');
    const cur = st.find((b) => b.getAttribute('aria-current') === 'step');
    const done = st.filter((b) => $('.gs-done', b)).map((b) => words($('b', b)));
    out.push('You are on step ' + (cur ? String(st.indexOf(cur) + 1) + ' of ' + st.length + ', ' + words($('b', cur)) : 'one of ' + st.length) + '. ' + (done.length ? 'Done: ' + done.join(', ') + '.' : 'No step is done yet.'));
  }
  return out;
}
// Draw her question and the answer. The answer fills her column: the last free exchange only.
async function setupAsk(q, ids, about) {
  const r = readyNow(), h = head(), turns = $('#dock-turns');
  if (!r || !turns) return; if (!h) { /* NEVER A SILENT NO-ANSWER (seat setup-polish): what could not be read is said */ $$('.vera-free', turns).forEach((x) => x.remove()); const m0 = el('div', 'vera-mine vera-free'); m0.appendChild(el('p', null, q)); const d0 = el('div', 'vera-turn vera-free'); d0.append(el('p', 'vera-who', NAME()), el('p', null, 'I could not read the figures of this step just now, so I will not guess. The card beside me shows them as soon as they are read.')); turns.append(m0, d0); return; }
  $$('.vera-free', turns).forEach((x) => x.remove());
  const m = el('div', 'vera-mine vera-free'); m.appendChild(el('p', null, q)); turns.appendChild(m);
  const d = el('div', 'vera-turn vera-free'); d.appendChild(el('p', 'vera-who', NAME()));
  const wait = el('p', 'working no-late', 'Reading your setup'); d.appendChild(wait);
  turns.appendChild(d);
  const f = r.key === 'search' || (about && about.length) ? await facts(true) : null;
  const parts = answer(r.key, ids, about, h, f);
  wait.remove();
  for (const t of parts) d.appendChild(el('p', null, t));
  d.appendChild(el('p', 'vera-small', 'Free: answered from your setup.'));
  const taps = TAPS[r.key] || [];
  const more = taps.filter((t) => !ids.includes(t[1]));
  if (more.length < 2 && !ids.includes('where')) more.push([WHERE, 'where']);
  if (more.length) {
    const row = el('div', 'vera-follow');
    for (const [label, id] of more.slice(0, 2)) { const c = el('button', 'vera-chip', label); c.type = 'button'; c.addEventListener('click', () => setupAsk(label, [id], about)); row.appendChild(c); }
    d.appendChild(row);
  }
  speak(parts.join(' '));
  m.scrollIntoView?.({ block: 'nearest' });
}
// A question typed beside a step that asks about cost, time or where we are: hers when every word is setup's or a mailbox's.
// "UNDERSTAND <MAILBOX>, ONLY <YEAR>" (seat understand-part 2026-11-12, decision 1163): the words understand and only, one or
// more years, and exactly one connected mailbox by a close name (named, above). No model is asked: step 4 opens that
// mailbox's years with those checked (fill/ready.js, event tool:understand-part) and she confirms there. A drive is not
// matched by its name here, and a sentence with any other word goes on to the usual routes.
const PART_WORDS = ['please', 'year', 'years', 'part', 'just', 'and'];
function partish(q) { const all = toks(q); return all.includes('only') && all.some((t) => t.startsWith('underst')) && all.some((t) => t.length === 4 && Number(t) >= 1990 && Number(t) <= new Date().getFullYear()); }
export function partAsk(q, rows) {
  const all = toks(q), now = new Date().getFullYear();
  if (!all.some((t) => t === 'understand' || t === 'understanding' || t === 'understood') || !all.includes('only')) return null;
  const isYear = (t) => t.length === 4 && [...t].every((ch) => '0123456789'.includes(ch)) && Number(t) >= 1990 && Number(t) <= now;
  const years = [...new Set(all.filter(isYear).map(Number))];
  if (!years.length) return null;
  let hit = [];
  for (const tok of all) {
    if (KNOWN.includes(tok) || PART_WORDS.includes(tok) || isYear(tok)) continue;
    const h = named(tok, rows || [], true);
    if (!h.length) return null;
    hit = hit.concat(h.filter((r) => !hit.includes(r)));
  }
  return hit.length === 1 ? { source: hit[0].source, name: mailOf(hit[0]), years } : null;
}
function partSay(q, pa) {
  const turns = $('#dock-turns');
  const t = 'I opened the years of ' + pa.name + ' with ' + pa.years.join(' and ') + ' checked. Each year shows what it holds and its price. Nothing is read until you say yes there.';
  if (turns) {
    $$('.vera-free', turns).forEach((x) => x.remove());
    const m = el('div', 'vera-mine vera-free'); m.appendChild(el('p', null, q)); turns.appendChild(m);
    const d = el('div', 'vera-turn vera-free'); d.append(el('p', 'vera-who', NAME()), el('p', null, t), el('p', 'vera-small', 'Free: no AI was asked.')); turns.appendChild(d);
    speak(t);
  }
  document.dispatchEvent(new CustomEvent('tool:understand-part', { detail: { source: pa.source, years: pa.years } }));
}
async function typed(q) {
  const f = await facts(false);
  const pa = window.toolParts === true ? partAsk(q, f && f.rows) : null;   // only on a brain that keeps parts (fill/ready.js says so once step 4 is read)
  if (pa) { partSay(q, pa); return; }
  const r = route(q, f);
  if (r) { setupAsk(q, r.ids, r.about); return; }
  const i = $('#panel-input'), s = $('#panel-send');
  if (!i || !s) return;
  bypass = true; i.value = q;
  try { s.click(); } finally { bypass = false; }
  emptyAfter();
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
    if (head()) facts(false);   // the mailboxes' names, ready before she is asked about one
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
    if (window.toolLens) window.toolLens.open(); else { const p = $('#panel'); if (p) { p.hidden = false; document.body.dataset.panel = 'open'; } }
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

// ---- THE ONE DOOR ON EVERY TAB (seat vera-one-door, 2026-11-14; decision 1175) ----
// HER COLUMN IS DRESSED AS HERS: her name on the panel, her own words where the panel was empty, and one box to ask or tell.
// Read aloud (box.js) moves from the box at the top, which is gone, into her box: the same button, so its switch still works.
function dress() {
  const n = NAME();
  if (dressed === n) return;
  dressed = n;
  const p = $('#panel'), i = $('#panel-input'), e = $('#panel .panel-empty');
  if (p) p.setAttribute('aria-label', n + ', your guide');
  if (i) { const ph = 'Ask ' + n; i.dataset.ph = ph; i.placeholder = ph; i.setAttribute('aria-label', 'Ask ' + n + ' anything, or tell ' + n + ' what to do'); }   // short: it must fit her box beside the buttons at 390 px
  if (e) {
    e.replaceChildren(el('span', null, 'Ask me anything about your business or about the Tool, or tell me what to do. Point at an email and press Ask ' + n + ' to ask about that one.'),
      document.createTextNode(' '), el('span', null, 'Nothing is sent, moved or changed without your yes.'));
  }
  const speak = $('#ask-speak'), mic = $('#panel-mic');
  if (speak && mic && speak.parentElement !== mic.parentElement) mic.before(speak);
}
// OPEN BESIDE EVERY TAB ON A WIDE SCREEN, unless the person put her away (her choice is kept in this browser and holds on every
// tab until she opens her again). Narrower than 1101 px the panel would cover the tab, so there she waits behind her button.
// Never on Getting started (she is in the step's column) and never on Work (the conversation is the page).
const AWAY = 'tool.vera.away';
const wide = () => window.matchMedia('(min-width: 1101px)').matches;
const isAway = () => { try { return localStorage.getItem(AWAY) === '1'; } catch (_) { return false; } };
const setAway = (on) => { try { if (on) localStorage.setItem(AWAY, '1'); else localStorage.removeItem(AWAY); } catch (_) { /* not remembered */ } };
let cameBack = false;
function dock() {
  const p = $('#panel');
  if (!p || !window.toolLens || inColumn() || p.classList.contains('in-work') || readyNow()) return;
  const tab = document.body.dataset.tab || '';
  if (!tab || tab === 'ready' || tab === 'work' || !$('#tabs .tab')) return;   // not signed in, still reading, or a page of its own
  dress();
  if (pointed && pointed.tab !== tab) { pointed = null; drawLook(); drawSug(); }   // she left the tab the thing was on
  if (p.hidden && wide() && !isAway()) { window.toolLens.open(); drawLook(); drawSug(); }
  if (!cameBack) { cameBack = true; Promise.resolve(window.toolLens.latest()).then(() => { drawLook(); }).catch(() => { /* a new conversation */ }); }
}
function awayOrBack(e) {
  if (inColumn()) return;
  if (e.type === 'keydown') { if (e.key === 'Escape' && window.toolLens && window.toolLens.isOpen() && !e.defaultPrevented && !$('.work-menu')) setAway(true); return; }
  const t = e.target.closest ? e.target.closest('#panel-away, #panel-tab, #vera-btn') : null;
  if (t) setAway(t.id === 'panel-away');
}

// ---- POINT AND ASK (decision 1130; fill/point.js offers it, she takes it) ----
// Her words go into the conversation where it now stands (under the last answer), not above it.
function flow(parts, chips) {
  const mount = $('#answer-in'), sec = $('#s-answer');
  if (!mount || !sec) return;
  sec.hidden = false;
  const t = el('div', 'answer-turn vera-flow'), d = el('div', 'vera-turn');
  d.appendChild(el('p', 'vera-who', NAME()));
  const p = el('p');
  for (const x of parts) { if (typeof x === 'string') p.appendChild(el('span', null, x)); else { const b = el('b', null, x.own); b.translate = false; p.appendChild(b); } }
  d.appendChild(p);
  if (chips && chips.length) {
    const row = el('div', 'vera-follow');
    for (const q of chips) { const c = el('button', 'vera-chip', q); c.type = 'button'; c.addEventListener('click', () => askIt(c.textContent || q)); row.appendChild(c); }
    d.appendChild(row);
  }
  t.appendChild(d); mount.appendChild(t);
  t.scrollIntoView?.({ block: 'nearest' });
  speak(p.textContent);
}
window.veraPoint = (c) => {
  if (!c) return;
  const a = c.anchor || null;
  pointed = { kind: c.kind, label: String(c.label || 'this'), text: String(c.text || ''), anchor: a, turns: [], card: null, tab: document.body.dataset.tab || '', where: String(c.where || ''), selected: !!c.selected,
    about: a ? { source_key: a.source_key, thread_id: a.thread_id, to: a.from_email, to_name: a.from_name, label: String(c.label || '') } : null };
  setAway(false);
  open();
  if (pointed.selected) { const w = pointed.text.length > 140 ? pointed.text.slice(0, 137) + '...' : pointed.text;
    flow((pointed.anchor ? ['I am looking at the words you selected in the email ', { own: pointed.label }, ': '] : ['I am looking at the words you selected: ']).concat([{ own: String.fromCharCode(8220) + w + String.fromCharCode(8221) }, ' What would you like to know about them?'])); }
  else if (pointed.anchor) flow(['I am looking at the email ', { own: pointed.label }, '. Ask me about it, or tell me what to answer and I will write the reply for you to check.']);
  else flow(['I am looking at ', { own: pointed.label }, '. What would you like to know about it?']);
  drawSug();
};
// lens.js ask() reads this for every question asked outside an order. An email: the anchor, the turns about it, and the draft
// on screen when one is open (so "make it shorter" changes that draft). Anything else: one line in front of the question.
window.veraContext = () => {
  if (!pointed) return null;
  const q = String.fromCharCode(34);
  if (pointed.anchor) {
    const cur = pointed.card && !pointed.card.closed() ? { subject: pointed.card.subject(), text: pointed.card.text() } : null;
    return { anchor: pointed.anchor, turns: pointed.turns, draft: cur, about: pointed.about,
      lead: pointed.selected ? 'This is about these words, which I selected in the email: ' + q + pointed.text.split(q).join(AP) + q : '' };
  }
  return { lead: 'This question is about something on my screen in the Tool' + (pointed.where ? ' (the ' + pointed.where + ' tab)' : '') + (pointed.selected ? ', which I selected' : '') + ': '
    + (pointed.label && pointed.label !== 'this' && !pointed.text.startsWith(pointed.label) ? pointed.label + ': ' : '') + q + pointed.text.split(q).join(AP) + q };
};
window.veraHeard = (q, body) => {
  if (pointed && pointed.anchor) pointed.turns.push({ q: String(q), a: String((body && (body.answer || body.state_reason || (body.draft && body.draft.text))) || '').slice(0, 1500) });
};
// A draft that came back (lens.js renderAsk): her card. body.pointed says which email it answers (kept with the answer).
window.veraDraft = (slot, body, live) => {
  const about = live ? ((body && body.pointed) || (pointed && pointed.about) || null) : null;   // a kept draft opened again is shown, never sendable from here
  const card = draftCard(slot, body, about, { post: (path, b) => window.toolLens.post(path, b) });
  if (pointed && pointed.about && about && about.thread_id === pointed.about.thread_id) pointed.card = card;
};

function start() {
  if ($('#vera-btn')) return;
  btn = el('button', 'vera-btn');
  btn.id = 'vera-btn'; btn.type = 'button';
  btn.append(el('span', 'vera-name', 'Vera'), el('i', 'vera-dot'));
  btn.addEventListener('click', open);
  document.body.appendChild(btn);
  startPoint();
  document.addEventListener('click', awayOrBack, true);
  document.addEventListener('keydown', awayOrBack, true);
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('#panel-new')) { pointed = null; drawLook(); drawSug(); } }, true);
  document.addEventListener('click', stay, true);
  document.addEventListener('click', intercept, true);
  document.addEventListener('keydown', intercept, true);
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'panel-input') grow(); }, true);
  let due = 0;
  const later = () => {
    if (due) return;
    due = requestAnimationFrame(() => {
      due = 0; paintDot(); placeColumn(); dock(); dress();
      // her box is empty when the step changes
      const k = readyNow()?.key ?? null;
      if (k !== lastKey) { if (lastKey !== null && k !== null) { const i = $('#panel-input'); if (i) { i.value = ''; grow(); } } lastKey = k; }
      if ($('#vera-look')) drawLook();
      const p = $('#panel');
      if (p && !p.hidden) { greet(); if (!talk || talk.inPlace) drawSug(); }
      // her column follows the page while it fits the window; taller than the window it is part of the page, so its end is reached
      const col = $('#gr-vera'); if (col) col.classList.toggle('vera-tall', col.offsetHeight > window.innerHeight - 32);
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
  dock();
  dress();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

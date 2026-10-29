// fill/words.js - THE SCREEN IN YOUR LANGUAGE (seat language-and-nudge, 2026-10-28, decision 1026 item 2). Part of SHOW.
//
// Every word this screen shows comes from ONE place per language: the brain's screen_words. English is the source: the
// words as written in fill/ (harvested by scripts/screen-words/harvest.py in studio-walkers). Another language is made
// ONCE by the Tool (edge function screen-words, the quick slot, priced in llm_usage) and kept; a person's correction is
// kept and wins. This module does not rewrite the other modules: it reads the page as drawn and puts each of the Tool's
// own words in the chosen language, exactly where it stands, and puts English back when she switches back.
//
// NEVER TRANSLATED: names, amounts, dates as data, and the customer's own mail and files. Only a piece of text that is
// exactly one of the Tool's own words (or starts or ends with one, for sentences the screen joins with a name or a
// number) is changed; anything else stays as written. Mail, answers she asked, her own thoughts and names sit in
// zones this module never touches (NEVER below), and any element can opt out with translate="no".
// A MISSING WORD NEVER BREAKS A SCREEN: it shows in English, and the misses are counted (a number, no text) in the brain.
//
// THE SWITCH sits beside her name at the top: the current language; choosing another changes the screen at once (making
// it first, the first time anyone here chooses it, with the working sign and a count). The first choice comes from what
// she said (person_lang), then her first thought (also person_lang, set by the brain), then the browser.
// SENTENCES THAT ARE NOT PIECES (seat every-word, 2026-10-29, decision 1026 item 2 as a class): what the brain or a model
// writes (why an email is fake, where a matter stands, a warning, a money line) and sentences the screen joins around a name
// are not among the harvested pieces, so they stayed English on a German screen. Each such line the screen shows is now
// translated on the way out: sent to screen-words (action lines), translated once per language and kept in the brain
// (screen_lines, keyed by a hash of its exact English, so the brain only ever returns a line to a screen that already shows
// it), checked for the right language there, and put in place here. Names, amounts and addresses inside stay as written.
// Only a line that reads as the Tool's English is sent (it carries a word of the screen's own vocabulary); a name, a number
// or code never is. The customer's own mail and files stay in the NEVER zones; for those, SEE IT IN puts one press under
// the words (a matter's latest words, a caught email's original), as under an ordinary email.
// What stays English after its line came back is counted (screen_words_miss english), and tool_health turns it amber.
// No regex literals and no backslashes (STANDING-CLAUSES).

let C = null;
let lang = 'en';
let words = new Map();          // English -> words in lang
let corrected = new Set();      // English words a person here corrected (theirs win)
let starts = new Map();         // first word -> English pieces that end with a space (start a joined sentence)
let ends = new Map();           // last word -> English pieces that start with a space (end a joined sentence)
const orig = new WeakMap();     // text node -> its English, so English comes back exactly
const origAttr = new WeakMap(); // element -> { attr: English }
let observer = null;
let misses = new Set();
let missTimer = null;
let correcting = false;
const ATTRS = ['placeholder', 'aria-label', 'title'];
let lines = new Map();          // English line -> the line in lang (screen-words action lines; the brain keeps them)
let vocab = new Set();          // lowercased words of the screen's own English pieces: a line must carry one to be sent
let lineWant = new Set(), lineAsked = new Set(), lineTimer = null, lineBusy = false, lineSent = 0;
let english = new Set();        // lines of the Tool's own still English after their answer came back (counted, never sent as text)
const LINE_CAP = 600;           // lines sent per page load at most
const LINE_ZONES = '.mailx-matter-state, .mailx-matter-state-full, .mailx-matter-line';   // a model's or the books' words, marked translate=no by their module
const NO_LINES = '.answer-slot';                                                            // an answer is written in her language already
// Elements that only ever hold the Tool's or the brain's own words (a why-tag, a reason, a checked line): any line in them is
// sent, even a short one in Title Case ("They asked on Oct 29"), which the general test would take for a name.
const LINE_OK = '.mailx-why, .mailx-att-line, .mailx-att-why, .mailx-att-checked, .mailx-scam-why, .mailx-warning-line, .mailx-small, .state, .working, .stalled';
const SEE_ZONES = '.mailx-matter-passage-full, .mailx-scam-original > .mailx-text';          // the customer's own words: See it in, one press
const origLine = new WeakMap(); // zone element -> its English
// Zones never touched: the customer's own mail, what she asked, her own words, names, and anything marked translate="no".
const NEVER = '[translate="no"], .notranslate, textarea, input, select, script, style, code, pre, .mailx-body, .mailx-text, .mailx-snip, .mailx-subj, .mailx-subject, .mailx-from, .mailx-addr:not(.mailx-viewname), .mailx-domain, .mailx-who, .answer-asked, .thought-text, .thought-said, .thought-original, .wordmark, .lang-menu-native';
// Zones where only an exact word changes (an answer's own text is already in her language; only its buttons are ours).
// The mail lists left this list (seat every-word, 2026-10-29): their data (subject, sender, snippet) sits in NEVER zones, and
// their joined lines ("Pretends to be <name>", "Really from <address>") stayed English on a German screen.
const EXACT_ONLY = '.answer-slot';

export const LANGS = [
  ['en', 'English', 'English'], ['es', 'Spanish', 'Español'], ['hi', 'Hindi', 'हिन्दी'], ['zh', 'Chinese', '中文'],
  ['vi', 'Vietnamese', 'Tiếng Việt'], ['tl', 'Tagalog', 'Tagalog'], ['ko', 'Korean', '한국어'], ['ar', 'Arabic', 'العربية'],
  ['fr', 'French', 'Français'], ['pt', 'Portuguese', 'Português'], ['ru', 'Russian', 'Русский'], ['de', 'German', 'Deutsch'],
  ['it', 'Italian', 'Italiano'], ['ja', 'Japanese', '日本語'], ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'], ['ur', 'Urdu', 'اردو'],
  ['bn', 'Bengali', 'বাংলা'], ['gu', 'Gujarati', 'ગુજરાતી'], ['ta', 'Tamil', 'தமிழ்'], ['te', 'Telugu', 'తెలుగు'],
  ['mr', 'Marathi', 'मराठी'], ['pl', 'Polish', 'Polski'], ['uk', 'Ukrainian', 'Українська'], ['fa', 'Persian', 'فارسی'],
  ['tr', 'Turkish', 'Türkçe'],
];
const RTL = ['ar', 'ur', 'fa'];
const nameOf = (code) => (LANGS.find((x) => x[0] === code) || [code, code, code])[1];

export function screenLang() { return lang; }
export function screenLangName() { return nameOf(lang); }

function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) { /* no storage: fine */ } }
function load(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }

function isLetterish(s) {
  for (const ch of s) { const c = ch.toLowerCase(); if (c !== ch.toUpperCase() || c > '~') return true; }
  return false;
}

function index() {
  starts = new Map(); ends = new Map();
  for (const en of words.keys()) {
    if (en.length < 6) continue;
    const t = en.trim();
    if (!t.includes(' ')) continue;
    if (en.endsWith(' ') || en.endsWith(': ')) { const w = t.split(' ')[0]; if (!starts.has(w)) starts.set(w, []); starts.get(w).push(en); }
    if (en.startsWith(' ') || en.startsWith(', ') || en.startsWith('. ')) { const parts = t.split(' '); const w = parts[parts.length - 1]; if (!ends.has(w)) ends.set(w, []); ends.get(w).push(en); }
  }
  for (const m of [starts, ends]) for (const list of m.values()) list.sort((a, b) => b.length - a.length);
}

// One piece of text in the chosen language, or null when none of it is one of the Tool's own words.
// Whitespace inside a piece as the page has it (index.html's paragraphs carry line breaks and indents) is one space in the
// harvested English (seat every-word: the Brain, Security and Chats introductions stayed English for that alone).
function squash(t) {
  let o = '', sp = false;
  for (const ch of t) { const c = ch.charCodeAt(0); if (c === 32 || c === 10 || c === 9 || c === 13 || c === 160) { sp = true; continue; } if (sp && o) o += ' '; sp = false; o += ch; }
  return o;
}
let partial = false;   // set by render when only a joined fragment was found: the rest may be a line
function render(en, exactOnly) {
  partial = false;
  const lead = en.length - en.trimStart().length;
  const raw = en.trim();
  if (!raw) return null;
  const pad = (s) => en.slice(0, lead) + s + en.slice(lead + raw.length);
  const core = squash(raw);
  if (words.has(core)) return pad(words.get(core));
  if (words.has(en)) return words.get(en);
  if (exactOnly) return null;
  let out = core, changed = false;
  const first = core.split(' ')[0];
  for (const piece of starts.get(first) || []) {
    if (core.startsWith(piece) && core.length > piece.length) { out = words.get(piece) + core.slice(piece.length); changed = true; break; }
  }
  const parts = core.split(' ');
  const last = parts[parts.length - 1];
  for (const piece of ends.get(last) || []) {
    if (out.endsWith(piece) && out.length > piece.length) { out = out.slice(0, out.length - piece.length) + words.get(piece); changed = true; break; }
  }
  partial = changed;
  return changed ? pad(out) : null;
}

// A line that reads as the Tool's English: letters, a word of the screen's own vocabulary, no code.
const CODEISH = ['{', '}', '[', ']', '|', '=', '=>', '()', '.mailx', 'http://', 'https://', '@'];
function lineWorthy(core) {
  if (core.length < 4 || core.length > 600) return false;
  for (const c of CODEISH) if (core.includes(c)) return false;
  // Most of its words are the screen's own, and it is not written in Title Case (a file's or a company's name is; a sentence
  // the Tool writes is not), so a customer's file names, subjects and names are never sent.
  const parts = core.split(' ').filter((w) => w);
  if (parts.length < 2) return false;
  let hit = 0, known = 0, caps = 0;
  for (const w of parts) {
    let x = '';
    for (const ch of w.toLowerCase()) { if ((ch >= 'a' && ch <= 'z') || ch === "'") x += ch; }
    if (x.length < 3) continue;
    known++;
    if (vocab.has(x)) hit++;
    const f = w.charAt(0);
    if (f !== f.toLowerCase()) caps++;
  }
  if (!known || hit / known < 0.6) return false;
  if (known >= 2 && caps / known > 0.6) return false;
  return true;
}
function lineFor(en) {
  const lead = en.length - en.trimStart().length;
  const raw = en.trim();
  const core = squash(raw);
  if (!lines.has(core)) return null;
  return en.slice(0, lead) + lines.get(core) + en.slice(lead + raw.length);
}
function wantLine(core) {
  if (lineAsked.has(core) || lineWant.has(core) || lineSent >= LINE_CAP) { if (lineAsked.has(core) && !lines.has(core)) english.add(core); return; }
  lineWant.add(core);
  if (!lineTimer) lineTimer = setTimeout(flushLines, 350);
}
async function flushLines() {
  lineTimer = null;
  if (lineBusy || lang === 'en' || !C?.sb) { if (lineWant.size && !lineTimer) lineTimer = setTimeout(flushLines, 800); return; }
  const batch = [...lineWant].slice(0, 60);
  batch.forEach((x) => { lineWant.delete(x); lineAsked.add(x); });
  if (!batch.length) return;
  lineSent += batch.length;
  lineBusy = true;
  const asked = lang;
  let r = null;
  try {
    const { data } = await C.sb.auth.getSession();
    const jwt = data?.session?.access_token;
    if (jwt) r = await fetch(C.url + '/functions/v1/screen-words', {
      method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lines', lang: asked, texts: batch }),
    }).then((x) => x.json()).catch(() => null);
  } catch (_) { r = null; }
  lineBusy = false;
  if (asked !== lang) return;
  const got = r && r.ok === true && r.lines && typeof r.lines === 'object' ? r.lines : {};
  for (const en of batch) { if (typeof got[en] === 'string' && got[en]) { lines.set(en, got[en]); english.delete(en); } else english.add(en); }
  if (Object.keys(got).length) { keepLines(); walk(document.body); }
  if (lineWant.size && !lineTimer) lineTimer = setTimeout(flushLines, 200);
}
function keepLines() {
  const all = [...lines.entries()].slice(-500);
  store('tool.lines.' + lang, JSON.stringify(all));
}
function loadLines(code) {
  lines = new Map();
  try { const a = JSON.parse(load('tool.lines.' + code) || '[]'); if (Array.isArray(a)) for (const [k, v] of a) if (typeof k === 'string' && typeof v === 'string') lines.set(k, v); } catch (_) { /* none kept */ }
}
function makeVocab() {
  vocab = new Set();
  for (const en of words.keys()) for (const w of en.toLowerCase().split(' ')) {
    let x = '';
    for (const ch of w) { if ((ch >= 'a' && ch <= 'z') || ch === "'") x += ch; }
    if (x.length >= 3) vocab.add(x);
  }
}

// A model's or the books' line, in a zone its module marked translate=no: the whole line, never its parts.
function doLineZone(e) {
  let en = origLine.get(e);
  const now = e.textContent;
  if (en === undefined || (now !== en && now !== e._shownLine)) { en = now; origLine.set(e, en); }
  if (lang === 'en') { if (now !== en) e.textContent = en; return; }
  const tr = lineFor(en);
  if (tr !== null) { if (now !== tr) { e.textContent = tr; e._shownLine = tr; } return; }
  const core = squash(en.trim());
  if (core.length > 3) wantLine(core);
}

// SEE IT IN <LANGUAGE> under the customer's own words where the screen shows them outside an email (seat every-word, brief
// item 3): one press, translated for her then through screen-words passage (checked for the language there), never kept.
function seeIt(e) {
  const next = e.nextElementSibling;
  const there = next && next.classList.contains('words-seeit') ? next : null;
  if (lang === 'en') { if (there) there.remove(); return; }
  if (there || !e.textContent.trim()) return;
  const native = (LANGS.find((x) => x[0] === lang) || [lang, lang, lang])[2];
  const holder = document.createElement('div');
  holder.className = 'words-seeit';
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'go ghost words-seeit-btn';
  b.textContent = 'See it in ' + native;   // one line, so the whole sentence is put in her language (not "Sehen in" + a name)
  const out = document.createElement('div');
  out.setAttribute('aria-live', 'polite');
  holder.append(b, out);
  b.addEventListener('click', async () => {
    b.disabled = true;
    out.textContent = '';
    const w = document.createElement('p'); w.className = 'working'; w.textContent = 'Putting these words in your language.'; out.appendChild(w);
    let r = null;
    try {
      const { data } = await C.sb.auth.getSession();
      const jwt = data?.session?.access_token;
      if (jwt) r = await fetch(C.url + '/functions/v1/screen-words', {
        method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'passage', lang, text: e.textContent }),
      }).then((x) => x.json()).catch(() => null);
    } catch (_) { r = null; }
    b.disabled = false;
    out.textContent = '';
    if (!r || r.ok !== true) { const p = document.createElement('p'); p.className = 'state stalled'; p.textContent = String(r?.reason || 'The translation could not be made just now. The words above are unchanged.'); out.appendChild(p); return; }
    const m = document.createElement('p'); m.className = 'eyebrow'; m.textContent = 'Translated by the Tool. The words above are the original.';
    const t = document.createElement('div'); t.className = 'mailx-text words-seeit-text'; t.lang = r.lang || lang; t.textContent = r.text;
    out.append(m, t);
  });
  e.insertAdjacentElement('afterend', holder);
  walk(holder);
}

function zones(root) {
  if (!root || root.nodeType !== 1) return;
  if (root.matches(LINE_ZONES)) doLineZone(root);
  root.querySelectorAll(LINE_ZONES).forEach(doLineZone);
  if (root.matches(SEE_ZONES)) seeIt(root);
  root.querySelectorAll(SEE_ZONES).forEach(seeIt);
}

function skipped(node) {
  const e = node.nodeType === 1 ? node : node.parentElement;
  return !e || !!e.closest(NEVER);
}

function doText(n) {
  if (skipped(n)) return;
  const exactOnly = !!n.parentElement.closest(EXACT_ONLY);
  let en = orig.get(n);
  if (en === undefined || (n.nodeValue !== en && n.nodeValue !== n._shown)) { en = n.nodeValue; orig.set(n, en); }
  if (lang === 'en') { if (n.nodeValue !== en) n.nodeValue = en; return; }
  let tr = render(en, exactOnly);
  // A sentence the screen joined from a piece and words of its own (a reason, a name): the whole line wins when it reads as
  // the Tool's English, so no sentence is half German and half English.
  if (tr !== null && partial) { const tl = lineFor(en); if (tl !== null) tr = tl; else { const c = squash(en.trim()); if (c.length <= 600 && !CODEISH.some((x) => c.includes(x)) && !n.parentElement.closest(NO_LINES)) wantLine(c); } }
  if (tr !== null) { if (n.nodeValue !== tr) { n.nodeValue = tr; n._shown = tr; } return; }
  const tl = lineFor(en);
  if (tl !== null) { if (n.nodeValue !== tl) { n.nodeValue = tl; n._shown = tl; } return; }
  if (n.nodeValue !== en) n.nodeValue = en;
  const core = squash(en.trim());
  if (core.length > 1 && isLetterish(core)) {
    misses.add(core);
    if ((lineWorthy(core) || (n.parentElement.closest(LINE_OK) && core.length <= 600 && !CODEISH.some((x) => core.includes(x)))) && !n.parentElement.closest(NO_LINES)) wantLine(core);
  }
}

// A FIELD'S OWN WORDS (seat thinkrooms-a, 2026-10-29): what she types is never touched, but a box's placeholder, aria-label and
// title are the Tool's words and follow her language (the box and the Thinkrooms composer said English in German before).
const FIELD = 'textarea, input, select';
function doAttrs(e) {
  if (!e || e.closest('[translate="no"], .notranslate')) return;
  // The wordmark's own label (Back to the front door) is the Tool's words too; only its name is data (seat every-word).
  if (skipped(e) && !(e.matches(FIELD) && !(e.parentElement && e.parentElement.closest(NEVER))) && !e.matches('.wordmark, .wordmark a')) return;
  let o = origAttr.get(e);
  for (const a of ATTRS) {
    if (!e.hasAttribute(a)) continue;
    if (!o) { o = {}; origAttr.set(e, o); }
    const cur = e.getAttribute(a);
    if (o[a] === undefined || (cur !== o[a] && cur !== o['_' + a])) o[a] = cur;
    let tr = lang === 'en' ? null : (render(o[a], true) ?? lineFor(o[a]));
    if (tr === null && lang !== 'en' && lineWorthy(squash(String(o[a]).trim()))) wantLine(squash(String(o[a]).trim()));
    const want = tr === null ? o[a] : tr;
    if (cur !== want) { e.setAttribute(a, want); o['_' + a] = want; }
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) { doText(root); return; }
  if (root.nodeType !== 1) return;
  if (!root.closest('.words-seeit-text')) zones(root);
  // A field's own placeholder changed by its module (the box says something else on each tab) reaches here alone.
  if (root.closest(NEVER)) { if (root.matches(FIELD) || root.matches('.wordmark')) doAttrs(root); return; }
  doAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => { if (n.nodeType === 1 && n.matches(NEVER)) { if (n.matches(FIELD) || n.matches('.wordmark')) doAttrs(n); return NodeFilter.FILTER_REJECT; } return NodeFilter.FILTER_ACCEPT; },
  });
  let n = tw.nextNode();
  while (n) { if (n.nodeType === 3) doText(n); else doAttrs(n); n = tw.nextNode(); }
}

let pending = new Set(), scheduled = false;
function watch() {
  if (observer) return;
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') pending.add(m.target.parentElement && m.target.parentElement.closest(LINE_ZONES) ? m.target.parentElement.closest(LINE_ZONES) : m.target);
      else if (m.type === 'attributes') pending.add(m.target);
      else m.addedNodes.forEach((x) => pending.add(x));
    }
    if (!scheduled) { scheduled = true; requestAnimationFrame(() => { scheduled = false; const s = pending; pending = new Set(); s.forEach((x) => { if (x.isConnected) walk(x); }); }); }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

function reportMisses() {
  if (lang === 'en' || (!misses.size && !english.size) || !C?.sb) return;
  const n = misses.size, e = english.size;
  misses = new Set(); english = new Set();
  C.sb.rpc('screen_words_miss', { p_lang: lang, p_n: n, p_english: e }).then(() => {}, () => {});
}

async function fetchWords(code) {
  const key = 'tool.words.' + code;
  let have = null, cached = null;
  try { cached = JSON.parse(load(key) || 'null'); have = cached?.version || null; } catch (_) { cached = null; }
  const { data, error } = await C.sb.rpc('screen_words_for', { p_lang: code, p_have: have });
  if (error || !data || data.ok !== true) return cached;
  if (data.unchanged && cached) return cached;
  const got = { version: data.version, words: data.words || {}, corrected: data.corrected || [] };
  store(key, JSON.stringify(got));
  return got;
}

// Make the language the first time anyone here chooses it: the working sign and a count, next to the switch.
async function make(code, say) {
  for (let round = 0; round < 12; round++) {
    const st = await C.sb.rpc('screen_words_state', { p_lang: code });
    const s = st.data;
    if (!s || s.ok !== true) { say('The Tool does not know that language yet.', true); return false; }
    if (!s.missing) return true;
    say('Making the screen in ' + nameOf(code) + ': ' + Number(s.made).toLocaleString() + ' of ' + Number(s.source).toLocaleString() + ' words. This happens once for everyone here.');
    const { data } = await C.sb.auth.getSession();
    const jwt = data?.session?.access_token;
    if (!jwt) { say('Sign in again to change the language.', true); return false; }
    const r = await fetch(C.url + '/functions/v1/screen-words', {
      method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'make', lang: code }),
    }).then((x) => x.json()).catch(() => null);
    if (!r || r.ok !== true) { say('The screen could not be made in ' + nameOf(code) + ' just now. It stays in English; try again in a moment.', true); return false; }
    if (!r.remaining) return true;
  }
  return true;
}

export async function setLang(code, opts) {
  const o = opts || {};
  const say = o.say || (() => {});
  if (code !== 'en') {
    const okMade = await make(code, say);
    const got = okMade ? await fetchWords(code) : null;
    if (!got || !Object.keys(got.words).length) { if (okMade) say('The screen could not be made in ' + nameOf(code) + ' just now. It stays in English.', true); return false; }
    words = new Map(Object.entries(got.words));
    corrected = new Set(got.corrected || []);
    index();
    makeVocab();
    loadLines(code);
  } else { words = new Map(); corrected = new Set(); lines = new Map(); }
  lineWant = new Set(); lineAsked = new Set(); english = new Set();
  lang = code;
  document.documentElement.lang = code;
  document.documentElement.dir = RTL.includes(code) ? 'rtl' : 'ltr';
  walk(document.body);
  if (code === 'en') { if (observer) { observer.disconnect(); observer = null; } }
  else watch();
  if (missTimer) clearInterval(missTimer);
  if (code !== 'en') missTimer = setInterval(reportMisses, 120000);
  say('');
  drawSwitch();
  return true;
}

// ---- the switch beside her name ------------------------------------------------------------------------------------
function drawSwitch() {
  const who = document.querySelector('#whoami');
  if (!who) return;
  who.querySelectorAll('b').forEach((b) => b.setAttribute('translate', 'no'));
  let b = who.querySelector('.lang-switch');
  if (!b) {
    b = document.createElement('button');
    b.type = 'button'; b.className = 'lang-switch';
    b.addEventListener('click', (e) => { e.stopPropagation(); openMenu(b); });
    who.appendChild(document.createElement('br'));
    who.appendChild(b);
  }
  const l = LANGS.find((x) => x[0] === lang) || LANGS[0];
  b.setAttribute('translate', 'no');
  b.textContent = l[2] + ' ▾';
  b.setAttribute('aria-label', 'Screen language: ' + l[1] + '. Change it');
}

function closeMenu() { document.querySelectorAll('.lang-menu').forEach((m) => m.remove()); }

function openMenu(btn) {
  if (document.querySelector('.lang-menu')) { closeMenu(); return; }
  const m = document.createElement('div');
  m.className = 'lang-menu';
  m.setAttribute('role', 'menu');
  const note = document.createElement('p');
  note.className = 'lang-menu-note';
  note.textContent = 'The screen in your language';
  m.appendChild(note);
  const status = document.createElement('p');
  status.className = 'lang-menu-status working';
  status.hidden = true;
  const say = (t, bad) => { status.hidden = !t; status.textContent = t; status.classList.toggle('working', !!t && !bad); status.classList.toggle('stalled', !!bad); };
  const list = document.createElement('div');
  list.className = 'lang-menu-list';
  for (const [code, en, native] of LANGS) {
    const it = document.createElement('button');
    it.type = 'button'; it.className = 'lang-menu-item' + (code === lang ? ' on' : '');
    it.setAttribute('role', 'menuitemradio');
    it.setAttribute('aria-checked', code === lang ? 'true' : 'false');
    const nv = document.createElement('span'); nv.className = 'lang-menu-native'; nv.textContent = native;
    it.appendChild(nv);
    if (native !== en) { const e2 = document.createElement('span'); e2.className = 'lang-menu-en quiet'; e2.setAttribute('translate', 'no'); e2.textContent = en; it.appendChild(e2); }
    it.addEventListener('click', async () => {
      list.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      C.sb.rpc('person_lang_set', { p_lang: code }).then(() => {}, () => {});
      const ok = await setLang(code, { say });
      if (ok) closeMenu(); else list.querySelectorAll('button').forEach((x) => { x.disabled = false; });
    });
    list.appendChild(it);
  }
  m.appendChild(list);
  m.appendChild(status);
  if (lang !== 'en') {
    const fix = document.createElement('button');
    fix.type = 'button'; fix.className = 'go ghost lang-menu-fix';
    fix.textContent = correcting ? 'Stop correcting words' : 'Correct a word on this screen';
    fix.addEventListener('click', () => { closeMenu(); toggleCorrect(); });
    m.appendChild(fix);
  }
  // THE RECIPIENT'S SWITCH for Thinkroom emails sits here too, under her name (decision 1026 item 3).
  const mail = document.createElement('label');
  mail.className = 'lang-menu-mail';
  const box = document.createElement('input');
  box.type = 'checkbox'; box.disabled = true;
  const words2 = document.createElement('span');
  words2.textContent = 'Email me when someone adds a thought for me in a Thinkroom';
  mail.append(box, words2);
  m.appendChild(mail);
  C.sb.rpc('thoughtgram_emails_state').then(({ data }) => { box.checked = !!data?.on; box.disabled = false; }, () => {});
  box.addEventListener('change', async () => {
    box.disabled = true;
    const { data } = await C.sb.rpc('thoughtgram_emails_set', { p_on: box.checked });
    say(data?.ok ? String(data.said) : 'That could not be changed just now.', !data?.ok);
    if (!data?.ok) box.checked = !box.checked;
    box.disabled = false;
  });
  btn.insertAdjacentElement('afterend', m);
  walk(m);
  setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target)) { closeMenu(); document.removeEventListener('click', off); } }), 0);
}

// ---- a person's correction wins ------------------------------------------------------------------------------------
function toggleCorrect() {
  correcting = !correcting;
  document.body.classList.toggle('words-correcting', correcting);
  let bar = document.querySelector('.words-bar');
  if (correcting && !bar) {
    bar = document.createElement('div');
    bar.className = 'words-bar';
    const t = document.createElement('span');
    t.textContent = 'Press any of the Tool’s words to correct it. Your words are kept for everyone reading this language here.';
    const done = document.createElement('button');
    done.type = 'button'; done.className = 'go';
    done.textContent = 'Done';
    done.addEventListener('click', () => toggleCorrect());
    bar.append(t, done);
    document.body.appendChild(bar);
    walk(bar);
  } else if (!correcting && bar) bar.remove();
  if (correcting) document.addEventListener('click', onCorrectClick, true);
  else document.removeEventListener('click', onCorrectClick, true);
}

function onCorrectClick(e) {
  if (e.target.closest('.words-bar, .words-fix, .lang-menu, #whoami')) return;
  const el = e.target;
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n = tw.nextNode(), hit = null;
  while (n) { const en = orig.get(n); if (en && words.has(en.trim())) { hit = { n, en: en.trim() }; break; } n = tw.nextNode(); }
  if (!hit) return;
  e.preventDefault(); e.stopPropagation();
  const card = document.createElement('div');
  card.className = 'words-fix';
  const p1 = document.createElement('p'); p1.className = 'quiet'; p1.setAttribute('translate', 'no'); p1.textContent = hit.en;
  const ta = document.createElement('textarea'); ta.value = words.get(hit.en); ta.rows = 2; ta.setAttribute('aria-label', 'Your words');
  const acts = document.createElement('div'); acts.className = 'actions';
  const keep = document.createElement('button'); keep.type = 'button'; keep.className = 'go'; keep.textContent = 'Keep my words';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'go ghost'; cancel.textContent = 'Cancel';
  const out = document.createElement('p'); out.className = 'quiet';
  acts.append(keep, cancel);
  card.append(p1, ta, acts, out);
  document.body.appendChild(card);
  walk(card);
  ta.focus();
  cancel.addEventListener('click', () => card.remove());
  keep.addEventListener('click', async () => {
    keep.disabled = true;
    const { data } = await C.sb.rpc('screen_words_correct', { p_lang: lang, p_en: hit.en, p_text: ta.value });
    if (data?.ok) {
      words.set(hit.en, ta.value.trim()); corrected.add(hit.en); index();
      store('tool.words.' + lang, null);
      walk(document.body);
      card.remove();
    } else { out.textContent = String(data?.why || 'That could not be kept just now.'); keep.disabled = false; }
  });
}

// ---- start ---------------------------------------------------------------------------------------------------------
// ctx: { sb, url, key }. Reads her language (what she said, or her first thought), else the browser's; English
// draws nothing new beyond the switch.
export async function initWords(ctx) {
  C = ctx;
  drawSwitch();
  let code = 'en';
  try {
    const { data } = await C.sb.rpc('person_lang');
    if (data && data.lang && data.set_by && data.set_by !== 'default') code = String(data.lang);
    else {
      // The browser's language is used only when the screen already exists in it: nothing is made (or paid for) unasked.
      const br = String(navigator.language || 'en').slice(0, 2).toLowerCase();
      if (br !== 'en' && LANGS.some((x) => x[0] === br)) {
        const st = await C.sb.rpc('screen_words_state', { p_lang: br });
        if (st.data && st.data.ok === true && st.data.made > 0 && !st.data.missing) code = br;
      }
    }
  } catch (_) { /* her language could not be read: English */ }
  if (!LANGS.some((x) => x[0] === code)) code = 'en';
  if (code !== 'en') await setLang(code, {});
  window.addEventListener('pagehide', reportMisses);
}

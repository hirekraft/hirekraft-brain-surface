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
// Zones never touched: the customer's own mail, what she asked, her own words, names, and anything marked translate="no".
const NEVER = '[translate="no"], .notranslate, textarea, input, select, script, style, code, pre, .mailx-body, .mailx-text, .mailx-snip, .mailx-subj, .mailx-subject, .mailx-from, .mailx-addr:not(.mailx-viewname), .mailx-domain, .mailx-who, .answer-asked, .thought-text, .thought-said, .thought-original, .wordmark, .lang-menu-native';
// Zones where only an exact word changes (an answer's own text is already in her language; only its buttons are ours).
const EXACT_ONLY = '.answer-slot, .mailx-list, .mailx-msgs';

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
function render(en, exactOnly) {
  const lead = en.length - en.trimStart().length;
  const core = en.trim();
  if (!core) return null;
  const pad = (s) => en.slice(0, lead) + s + en.slice(lead + core.length);
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
  return changed ? pad(out) : null;
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
  const tr = render(en, exactOnly);
  if (tr !== null) { if (n.nodeValue !== tr) { n.nodeValue = tr; n._shown = tr; } return; }
  if (n.nodeValue !== en) n.nodeValue = en;
  const core = en.trim();
  if (core.length > 1 && isLetterish(core)) misses.add(core);
}

// A FIELD'S OWN WORDS (seat thinkrooms-a, 2026-10-29): what she types is never touched, but a box's placeholder, aria-label and
// title are the Tool's words and follow her language (the box and the Thinkrooms composer said English in German before).
const FIELD = 'textarea, input, select';
function doAttrs(e) {
  if (!e || e.closest('[translate="no"], .notranslate')) return;
  if (skipped(e) && !(e.matches(FIELD) && !(e.parentElement && e.parentElement.closest(NEVER)))) return;
  let o = origAttr.get(e);
  for (const a of ATTRS) {
    if (!e.hasAttribute(a)) continue;
    if (!o) { o = {}; origAttr.set(e, o); }
    const cur = e.getAttribute(a);
    if (o[a] === undefined || (cur !== o[a] && cur !== o['_' + a])) o[a] = cur;
    const tr = lang === 'en' ? null : render(o[a], true);
    const want = tr === null ? o[a] : tr;
    if (cur !== want) { e.setAttribute(a, want); o['_' + a] = want; }
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) { doText(root); return; }
  if (root.nodeType !== 1 || root.closest(NEVER)) return;
  doAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => { if (n.nodeType === 1 && n.matches(NEVER)) { if (n.matches(FIELD)) doAttrs(n); return NodeFilter.FILTER_REJECT; } return NodeFilter.FILTER_ACCEPT; },
  });
  let n = tw.nextNode();
  while (n) { if (n.nodeType === 3) doText(n); else doAttrs(n); n = tw.nextNode(); }
}

let pending = new Set(), scheduled = false;
function watch() {
  if (observer) return;
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') pending.add(m.target);
      else if (m.type === 'attributes') pending.add(m.target);
      else m.addedNodes.forEach((x) => pending.add(x));
    }
    if (!scheduled) { scheduled = true; requestAnimationFrame(() => { scheduled = false; const s = pending; pending = new Set(); s.forEach((x) => { if (x.isConnected) walk(x); }); }); }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

function reportMisses() {
  if (lang === 'en' || !misses.size || !C?.sb) return;
  const n = misses.size;
  misses = new Set();
  C.sb.rpc('screen_words_miss', { p_lang: lang, p_n: n }).then(() => {}, () => {});
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
  } else { words = new Map(); corrected = new Set(); }
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

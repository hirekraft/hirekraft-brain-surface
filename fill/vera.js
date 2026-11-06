// fill/vera.js - VERA, THE GUIDE (seat vera-on-brain-2, 2026-11-06; decisions 1113 the companion, 1115 Alex presses,
// 1116 Vera). Slice 1, typing first. Part of CONVERSE; it adds no mechanism of its own.
//
// ONE BUTTON, bottom right, on every screen ("Vera", with a dot while the Brain is not Ready). It REPLACES the round
// phone Ask button (lens.js .tab-ask, hidden in skin.css's VERA block; the walk's miss 6: one Ask, not two) and opens
// THE conversation panel (#panel, lens.js). Vera is not a second conversation: what she is asked goes through the
// panel's own box to lens-ask, so it is the same one continuing conversation, kept in Work like any other.
// THE TOP LINE says what she is looking at: the tab, and on the Brain its part and the open side panel.
// SHE READS THE BRAIN AS THE BRAIN DRAWS IT (the masthead's state, the road's four steps, the Tool's own buttons), never
// a second count: if the Brain says it, she says it; if the Brain has not been drawn yet, she says so.
// SHE NEVER PRESSES (1115). The buttons she offers are the Tool's own (Read them; Go with its price). Pressing one in the
// conversation brings the Tool's button into view and presses it for the person who pressed, which only shows its
// preview and price; nothing starts until that person presses Yes on the Brain. Vera never presses Yes.
// STATED BOUNDARY: lens-ask does not yet receive what she is looking at; the top line is for the person. Voice, a name per
// person and kept preferences are the next round. No regex literals and no backslashes (STANDING-CLAUSES).

const $ = (s, r) => (r || document).querySelector(s);
const DOT = String.fromCharCode(183);
let greeted = '';
let btn = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// What the Brain says about itself, read from what it drew. null when the masthead has not been drawn.
function brainNow() {
  const eng = $('#brain-engine');
  if (!eng) return null;
  const word = ($('b', eng)?.textContent || '').split(DOT).slice(1).join(DOT).trim();
  const ready = eng.classList.contains('engine-ok');
  const stn = [...document.querySelectorAll('#br-road .br-stn')];
  const next = stn.find((b) => !b.classList.contains('br-stn-done'));
  return { word, ready, step: next ? next.getAttribute('aria-label') : '' };
}

// Where she is: the tab, and on the Brain its part (Your brain / AI and costs) and the open side panel.
function looking() {
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

function drawLook() {
  const body = $('#panel-body');
  if (!body) return;
  let p = $('#vera-look');
  if (!p) { p = el('p', 'vera-look'); p.id = 'vera-look'; p.setAttribute('aria-live', 'polite'); body.prepend(p); }
  p.replaceChildren(el('b', null, 'Vera'), document.createTextNode(' ' + DOT + ' looking at: ' + looking()));
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
  const read = [...document.querySelectorAll('#br-files button.go')].find((b) => b.textContent.trim() === 'Read them' && !b.disabled);
  if (read) out.push({ label: 'Read them (it shows the price first)', find: () => [...document.querySelectorAll('#br-files button.go')].find((b) => b.textContent.trim() === 'Read them'), press: true });
  const tot = $('#br-und-pick .br-total');
  const go = tot && [...tot.querySelectorAll('button.go')].find((b) => b.textContent.trim() === 'Go');
  if (go && !go.disabled) {
    const price = $('.br-total-t b', tot)?.textContent?.trim();
    out.push({ label: 'Go' + (price ? ' ' + DOT + ' ' + price : ''), find: () => [...document.querySelectorAll('#br-und-pick .br-total button.go')].find((b) => b.textContent.trim() === 'Go'), press: true });
  } else if (tot) {
    out.push({ label: 'Choose what to understand', find: () => $('#br-und-pick'), press: false });
  }
  if (!out.length && !$('#br-road .br-stn')) out.push({ label: 'Open the Brain', find: () => null, press: false });
  return out;
}

// Bring the Tool's own button into view and, for a press, press it for her: its preview and price appear where it stands.
function take(o) {
  if (window.matchMedia('(max-width: 720px)').matches) $('#panel-away')?.click();
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

function greet() {
  const tab = document.body.dataset.tab;
  if (tab !== 'brain' && tab !== 'ai') return;
  const b = brainNow();
  if (!b || b.ready) return;
  const turns = $('#dock-turns');
  if (!turns) return;
  if (!$('.vera-turn', turns)) greeted = '';   // a new conversation: she greets again
  if (greeted === b.word + '|' + b.step) return;
  greeted = b.word + '|' + b.step;
  const d = el('div', 'vera-turn');
  d.appendChild(el('p', 'vera-who', 'Vera'));
  d.appendChild(el('p', null, 'You are not done with setup, so answers may be incomplete until the Brain says Ready.'));
  d.appendChild(el('p', null, b.step ? 'Where you are: ' + b.step : 'Where you are: ' + (b.word || 'the Brain is still being read')));
  const list = offers();
  if (list.length) {
    d.appendChild(el('p', 'vera-small', 'The next step is yours. These are the Tool' + String.fromCharCode(39) + 's own buttons; nothing starts until you press Yes.'));
    const acts = el('div', 'vera-acts');
    for (const o of list) { const x = el('button', 'go' + (o.press ? '' : ' ghost'), o.label); x.type = 'button'; x.addEventListener('click', () => take(o)); acts.appendChild(x); }
    d.appendChild(acts);
  }
  d.appendChild(el('p', 'vera-small', 'Ask me anything about the Tool or your business below.'));
  turns.appendChild(d);
}

function open() {
  const ask = $('#tabs .tab-ask');
  if (ask) ask.click(); else { const p = $('#panel'); if (p) { p.hidden = false; document.body.dataset.panel = 'open'; } }
  drawLook();
  greet();
  $('#panel-input')?.focus({ preventScroll: true });
}

function start() {
  if ($('#vera-btn')) return;
  btn = el('button', 'vera-btn');
  btn.id = 'vera-btn'; btn.type = 'button';
  btn.append(el('span', 'vera-name', 'Vera'), el('i', 'vera-dot'));
  btn.addEventListener('click', open);
  document.body.appendChild(btn);
  let due = 0;
  const later = () => { if (due) return; due = requestAnimationFrame(() => { due = 0; paintDot(); if ($('#vera-look')) drawLook(); }); };
  new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ['data-tab', 'data-panel', 'class'] });
  document.addEventListener('click', later, true);
  const mh = $('.masthead');
  if (mh) new MutationObserver(later).observe(mh, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  paintDot();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

// fill/looks.js - THE LOOK (seat looks, 2026-10-29, decision 1036). Part of SHOW; her choice is a LEARN record.
//
// Four looks, each ONE set of tokens in skin.css (THE LOOKS): Warm (everyone starts here), Bright, Evening, Clear.
// The switch sits beside the language switch under her name. Choosing applies at once, without a reload, and is
// remembered twice: in the brain beside her language (identities.look, person_look_set), so it follows her to any
// computer or phone, and in this browser (tool.look), so the very first paint is already in her look (index.html reads
// it before the stylesheet). When the two differ, the brain wins once it answers.
// No regex literals and no backslashes (STANDING-CLAUSES).

let C = null;
export const LOOKS = [
  ['warm', 'Warm', 'Cream, terracotta, serif headings'],
  ['bright', 'Bright', 'White, indigo, rounded letters'],
  ['evening', 'Evening', 'Soft and dark, low glare'],
  ['clear', 'Clear', 'Larger text, stronger contrast'],
];
const KEY = 'tool.look';
const known = (x) => LOOKS.some((l) => l[0] === x);
let look = known(document.documentElement.getAttribute('data-look')) ? document.documentElement.getAttribute('data-look') : 'warm';

function store(v) { try { localStorage.setItem(KEY, v); } catch (_) { /* no storage: the brain still remembers */ } }

export function currentLook() { return look; }

// Applies a look to the whole screen at once: one attribute on <html>; the browser bar takes the look's ground.
export function applyLook(code) {
  if (!known(code)) code = 'warm';
  look = code;
  document.documentElement.setAttribute('data-look', code);
  store(code);
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && ground) meta.setAttribute('content', ground);
  drawSwitch();
}

function swatch(code) {
  const s = document.createElement('span');
  s.className = 'look-swatch';
  s.setAttribute('data-look', code);
  s.setAttribute('aria-hidden', 'true');
  s.append(document.createElement('i'));
  for (const k of ['a', 'm', 'p']) { const b = document.createElement('b'); b.className = k; s.append(b); }
  return s;
}

function drawSwitch() {
  const who = document.querySelector('#whoami');
  if (!who) return;
  let b = who.querySelector('.look-switch');
  if (!b) {
    b = document.createElement('button');
    b.type = 'button'; b.className = 'look-switch';
    b.addEventListener('click', (e) => { e.stopPropagation(); openMenu(b); });
    const dot = document.createElement('span'); dot.className = 'look-dot'; dot.setAttribute('aria-hidden', 'true');
    const w = document.createElement('span'); w.className = 'look-word'; w.textContent = 'Look';
    b.append(dot, w);
  }
  // Beside the language switch when it is there; otherwise on its own line under her name.
  const lang = who.querySelector('.lang-switch');
  if (lang && lang.nextSibling !== b) lang.insertAdjacentElement('afterend', b);
  else if (!lang && !b.parentNode) { who.appendChild(document.createElement('br')); who.appendChild(b); }
  const name = (LOOKS.find((l) => l[0] === look) || LOOKS[0])[1];
  b.setAttribute('aria-label', 'How the Tool looks: ' + name + '. Change it');
  b.title = 'How the Tool looks: ' + name;
}

function closeMenu() { document.querySelectorAll('.look-menu').forEach((m) => m.remove()); }

function openMenu(btn) {
  if (document.querySelector('.look-menu')) { closeMenu(); return; }
  document.querySelectorAll('.lang-menu').forEach((m) => m.remove());
  const m = document.createElement('div');
  m.className = 'look-menu';
  m.setAttribute('role', 'menu');
  const note = document.createElement('p');
  note.className = 'look-menu-note';
  note.textContent = 'How the Tool looks';
  m.appendChild(note);
  const list = document.createElement('div');
  list.className = 'look-menu-list';
  for (const [code, name, sub] of LOOKS) {
    const it = document.createElement('button');
    it.type = 'button'; it.className = 'look-item' + (code === look ? ' on' : '');
    it.setAttribute('role', 'menuitemradio');
    it.setAttribute('aria-checked', code === look ? 'true' : 'false');
    it.setAttribute('data-look-choice', code);
    const n = document.createElement('span'); n.className = 'look-item-name'; n.textContent = name;
    const d = document.createElement('span'); d.className = 'look-item-sub'; d.textContent = sub;
    it.append(swatch(code), n, d);
    it.addEventListener('click', () => {
      applyLook(code);
      list.querySelectorAll('.look-item').forEach((x) => {
        const on = x.getAttribute('data-look-choice') === code;
        x.classList.toggle('on', on); x.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      if (C && C.sb) C.sb.rpc('person_look_set', { p_look: code }).then(() => {}, () => {});
    });
    list.appendChild(it);
  }
  m.appendChild(list);
  const foot = document.createElement('p');
  foot.className = 'quiet look-menu-foot';
  foot.textContent = 'Only you see your choice. It follows you to your phone.';
  m.appendChild(foot);
  btn.insertAdjacentElement('afterend', m);
  setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target)) { closeMenu(); document.removeEventListener('click', off); } }), 0);
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { closeMenu(); btn.focus(); document.removeEventListener('keydown', esc); } });
}

// ctx: { sb }. Draws the switch at once in the look this browser remembered, then asks the brain for hers.
export async function initLooks(ctx) {
  C = ctx;
  applyLook(look);
  try {
    const { data } = await C.sb.rpc('person_look');
    if (data && known(data.look) && data.set_by && data.set_by !== 'default' && data.look !== look) applyLook(data.look);
  } catch (_) { /* her look could not be read: this browser's choice, or Warm, stays */ }
  // The language switch is drawn again when the language changes; keep Look beside it.
  const who = document.querySelector('#whoami');
  if (who && 'MutationObserver' in window) new MutationObserver(() => { if (!who.querySelector('.look-switch') || who.querySelector('.lang-switch')?.nextSibling !== who.querySelector('.look-switch')) drawSwitch(); }).observe(who, { childList: true });
}

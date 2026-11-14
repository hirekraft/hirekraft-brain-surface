// fill/point.js - POINT AND ASK, THE ONE SHARED HELPER (seat vera-one-door, 2026-11-14; decision 1130, with 1175 point 1).
// Part of SHOW and CONVERSE; it adds no mechanism. Capability: guide_vera ("I point at something and ask Vera about it").
//
// ANY BOX ON ANY SCREEN that carries data-ask offers "Ask Vera" when the pointer is over it (or it has the keyboard), and
// ANY SELECTED TEXT on the page offers "Ask Vera about this". Pressing either opens her with exactly that thing as what she
// is looking at (window.veraPoint, fill/vera.js); she names it in her first line and the next question goes with it.
// A SCREEN ONLY MARKS ITS BOXES. It writes no asking code of its own:
//   data-ask="email" | "thing"      what kind of box it is
//   data-ask-label="..."            what she would call it (shown as "Looking at: ...")
//   data-ask-text="..."             the words that go with her question (else the box's own words as drawn, cut at 600)
//   data-ask-pin="1"                the offer is always shown on this box (a phone has no hover): used on the open email
//   data-ask-quiet="1"              no offer on hover; the box only says what selected words inside it belong to (the open
//                                   email's reading pane, and the email's own frame: a frame on this page's own address is
//                                   listened to for selected words, which no other file needs to know)
//   for an email also: data-ask-source (the mailbox key), data-ask-thread, data-ask-msg, data-ask-from, data-ask-name,
//   data-ask-subject, data-ask-date. With these her question is asked about that email itself, through the same door and
//   reasoning as a question on the open email (lens-ask's anchor); the mailbox is checked there, never here.
// WHAT IT DOES NOT DO, said so nobody hunts: it reads nothing and decides nothing about access; a box with no data-ask gets
// no hover offer (selected text still does); on a phone the hover offer exists only where a box is pinned.
// No regex literals and no backslashes (STANDING-CLAUSES).

const SP = String.fromCharCode(32);
let pill = null;        // the one offer on the page
let at = null;          // the box it is offered for (null for a selection)
let picked = '';        // the selected words it is offered for
let hideT = 0;
let selT = 0;

const clean = (s, max) => String(s || '').split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).join(SP).slice(0, max);

function contextOf(box, selected) {
  const d = box ? box.dataset : {};
  const kind = d.ask || 'thing';
  const label = clean(d.askLabel || (box ? box.getAttribute('aria-label') : '') || (box ? box.innerText : ''), 90) || 'this';
  const text = selected ? clean(selected, 1200) : clean(d.askText || (box ? box.innerText : ''), 600);
  const tab = document.querySelector('#tabs .tab[aria-current="page"]');
  const anchor = kind === 'email' && d.askSource && (d.askThread || d.askMsg) ? {
    source_key: d.askSource, thread_id: d.askThread || d.askMsg, from_email: d.askFrom || '', from_name: d.askName || '',
    subject: d.askSubject || '', date: d.askDate || '', text: clean(d.askText || box.innerText, 6000),
  } : null;
  return { kind, label, text, anchor, selected: !!selected, where: tab ? clean(tab.textContent, 40) : '' };
}

function make() {
  if (pill) return pill;
  pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'ask-vera'; pill.id = 'ask-vera'; pill.hidden = true;
  pill.addEventListener('mousedown', (e) => e.preventDefault());   // the selection and the focus stay where they are
  pill.addEventListener('mouseenter', () => clearTimeout(hideT));
  pill.addEventListener('mouseleave', later);
  pill.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const c = contextOf(at, picked);
    hide();
    try { window.getSelection()?.removeAllRanges(); } catch (_) { /* nothing was selected */ }
    if (typeof window.veraPoint === 'function') window.veraPoint(c);
  });
  document.body.appendChild(pill);
  return pill;
}
function name() { return String(document.body.dataset.guide || '').trim() || 'Vera'; }
function show(box, rect, selected) {
  const p = make();
  clearTimeout(hideT);
  at = box; picked = selected || '';
  p.textContent = selected ? 'Ask ' + name() + ' about this' : 'Ask ' + name();
  p.hidden = false;
  const w = p.offsetWidth, h = p.offsetHeight, vw = document.documentElement.clientWidth;
  const left = Math.max(8, Math.min(vw - w - 8, selected ? rect.left + rect.width / 2 - w / 2 : rect.right - w - 8));
  let top = selected ? rect.top - h - 8 : rect.top + 6;
  if (top < 8) top = selected ? rect.bottom + 8 : 8;
  p.style.left = Math.round(left + window.scrollX) + 'px';
  p.style.top = Math.round(top + window.scrollY) + 'px';
}
function hide() { if (pill) pill.hidden = true; at = null; picked = ''; }
function later() { clearTimeout(hideT); hideT = setTimeout(() => { if (!picked) hide(); }, 350); }

const boxOf = (t) => (t && t.closest ? t.closest('[data-ask]') : null);
const inHers = (n) => { const e = n && (n.nodeType === 1 ? n : n.parentElement); return !!e && !!e.closest('#panel, #ask-vera, input, textarea, [contenteditable="true"]'); };

function over(e) {
  if (picked) return;
  const box = boxOf(e.target);
  if (!box || box.dataset.askPin || box.dataset.askQuiet) { if (at && !picked && box !== at) later(); return; }
  if (box === at && pill && !pill.hidden) { clearTimeout(hideT); return; }
  show(box, box.getBoundingClientRect(), '');
}
function selection() {
  let s = null;
  try { s = window.getSelection(); } catch (_) { return; }
  const words = s && !s.isCollapsed ? clean(s.toString(), 1200) : '';
  if (words.length < 3 || inHers(s.anchorNode) || inHers(s.focusNode)) { if (picked) hide(); return; }
  const r = s.getRangeAt(0).getBoundingClientRect();
  if (!r || (!r.width && !r.height)) return;
  const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
  show(boxOf(n), r, words);
}

// A pinned box carries its own offer, drawn inside it once (the open email on a phone has no hover).
function pins(root) {
  for (const box of (root || document).querySelectorAll('[data-ask-pin]:not([data-ask-pinned])')) {
    box.dataset.askPinned = '1';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ask-vera ask-vera-pin'; b.textContent = 'Ask ' + name();
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (typeof window.veraPoint === 'function') window.veraPoint(contextOf(box, '')); });
    box.appendChild(b);
  }
}

// Words selected inside a marked frame (an email shown as it was sent): the same offer, placed over the frame.
function frameSelection(f) {
  let s = null;
  try { s = f.contentDocument.getSelection(); } catch (_) { return; }
  const words = s && !s.isCollapsed ? clean(s.toString(), 1200) : '';
  if (words.length < 3) { if (picked && at === f) hide(); return; }
  const r = s.getRangeAt(0).getBoundingClientRect(), o = f.getBoundingClientRect();
  if (!r.width && !r.height) return;
  show(f, { left: r.left + o.left, right: r.right + o.left, top: r.top + o.top, bottom: r.bottom + o.top, width: r.width, height: r.height }, words);
}
function frames(root) {
  for (const f of root.querySelectorAll('iframe[data-ask]:not([data-ask-wired])')) {
    f.dataset.askWired = '1';
    const wire = () => { try { const d = f.contentDocument; if (d) d.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(() => frameSelection(f), 250); }); } catch (_) { /* a frame this page may not read: no offer inside it */ } };
    f.addEventListener('load', wire);
    wire();
  }
}

export function startPoint() {
  if (document.body.dataset.pointAsk) return;
  document.body.dataset.pointAsk = 'on';
  document.addEventListener('mouseover', over, true);
  document.addEventListener('focusin', (e) => { const box = boxOf(e.target); if (box && !box.dataset.askPin && !box.dataset.askQuiet && !picked) show(box, box.getBoundingClientRect(), ''); }, true);
  document.addEventListener('focusout', (e) => { if (boxOf(e.target) === at && !picked) later(); }, true);
  document.addEventListener('selectionchange', () => { clearTimeout(selT); selT = setTimeout(selection, 250); });
  document.addEventListener('scroll', () => { if (pill && !pill.hidden && !picked) hide(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); }, true);
  let due = 0;
  new MutationObserver(() => { if (!due) due = requestAnimationFrame(() => { due = 0; pins(document); frames(document); if (at && !at.isConnected) hide(); }); })
    .observe(document.body, { childList: true, subtree: true });
  pins(document); frames(document);
}

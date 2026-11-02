// fill/marketing-foundation.js - THE MARKETING AND SALES TAB, part FOUNDATION (seat marketing-vault, 2026-11-02, decision 1060). Part of SHOW.
//
// WHAT IT DOES FOR HER. One question: what do we stand for, and is it approved? One picture: the ten parts of the foundation (where we
// are, where we want to go, positioning, ideal customers, offers, proof, themes, voice, never say, brand assets) as one strip, each
// with how many lines it holds and whether it is approved, changed since approval, or not approved yet. One action: Approve (a part,
// or the whole). Inside each part every line says where it came from (a chat, a document, the website, Alex's own words) and can be
// changed in place; every change asks why and is kept as a version (who, when, why). Lines that newer thinking replaced are kept under
// Earlier, with why and, where an older source disagrees with the latest, what it said. Changes asked of the box arrive as proposals
// with Accept and Decline. Brand assets show the colors as swatches, the fonts as a sample, and the logo.
// Everything comes from ONE brain function as the signed-in person (mk_foundation); the brain's marketing door decides who sees it,
// and a refusal is shown with its reason, never as an empty page. The content writer reads the same lines (mk_foundation_text).
// No colour, size or font here except the brand's own swatch and type sample, which are data (marketing-foundation.css carries the
// look). No regex literals, no backslashes.

let C = null, D = null, EL = null;
const OPEN = new Set();
const SAID = {};
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; n.setAttribute('translate', 'no'); return n; };
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const day = (iso) => { if (!iso) return ''; const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

export const PARTS = [
  { key: 'where_now', label: 'Where we are', q: 'Where do we stand today?' },
  { key: 'where_next', label: 'Where we want to go', q: 'Where are we taking the business?' },
  { key: 'positioning', label: 'Positioning', q: 'What do we say we are?' },
  { key: 'icp', label: 'Ideal customers', q: 'Who buys from us, and what do they pay for?' },
  { key: 'offers', label: 'Offers', q: 'What do we sell, and on what terms?' },
  { key: 'proof', label: 'Proof', q: 'What can we show?' },
  { key: 'themes', label: 'Themes', q: 'What do we talk about?' },
  { key: 'voice', label: 'Voice', q: 'How do we sound?' },
  { key: 'never_say', label: 'Never say', q: 'What do we never say?' },
  { key: 'brand', label: 'Brand assets', q: 'What does it look like?' },
];
const STATE = { approved: 'Approved', changed: 'Changed since approval', not: 'Not approved yet' };

const STYLE = 'marketing-foundation.css?v=2026-11-02-marketing-vault';
const ensureStyle = () => { try { if (!document.querySelector('link[data-mk-foundation]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(STYLE, import.meta.url).href; l.setAttribute('data-mk-foundation', '1'); document.head.appendChild(l); } } catch (e) { /* no document: tests */ } };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}
const why_ = (r) => { const w = String((r && (r.note || r.reason || r.said)) || 'no reason was given'); return w.endsWith('.') ? w : w + '.'; };

export async function mount(el, ctx) {
  ensureStyle();
  C = Object.assign({ el: (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; } }, ctx || {});
  EL = el;
  await load('Reading the foundation');
}

async function load(what) {
  EL.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Foundation'), mk('p', 'mk-lede', 'What do we stand for, and is it approved?'));
  EL.appendChild(head);
  const w = mk('p', 'working no-late', what);
  EL.appendChild(w);
  D = await rpc('mk_foundation', {});
  w.remove();
  if (!D || D.ok !== true) { EL.appendChild(mk('p', 'notice flagged', 'The foundation could not be shown: ' + why_(D))); return; }
  draw();
}

function part(k) { return ((D && D.parts) || []).find((p) => p.key === k) || { key: k, lines: [], earlier: [], proposed: [], approval: { state: 'not' } }; }

function stateLine(a) {
  const s = (a && a.state) || 'not';
  if (s === 'approved') return 'Approved by ' + String(a.by || '').split(' ')[0] + ', ' + day(a.at);
  if (s === 'changed') return 'Changed since ' + String(a.by || '').split(' ')[0] + ' approved it on ' + day(a.at);
  return STATE.not;
}

function draw() {
  // THE PICTURE: the ten parts in one strip, each with its count and its approval
  const strip = mk('div', 'mkf-strip');
  strip.setAttribute('role', 'list');
  for (const p of PARTS) {
    const P = part(p.key);
    const st = (P.approval && P.approval.state) || 'not';
    const b = mk('button', 'mkf-chip mkf-' + st); b.type = 'button'; b.setAttribute('role', 'listitem');
    b.append(mk('span', 'mkf-chip-label', p.label), mk('span', 'mkf-chip-n', P.lines.length + ' ' + plural(P.lines.length, 'line', 'lines')), mk('span', 'mkf-chip-state', STATE[st]));
    b.addEventListener('click', () => { OPEN.add(p.key); const d = EL.querySelector('details[data-part="' + p.key + '"]'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    strip.appendChild(b);
  }
  EL.appendChild(strip);
  const n = D.counts || {};
  EL.appendChild(mk('p', 'state', n.latest + ' current lines from ' + n.sources + ' sources · ' + n.earlier + ' earlier lines kept as history · '
    + n.disagree + ' ' + plural(n.disagree, 'place where an older source disagrees', 'places where an older source disagrees') + (Number(n.proposed) ? ' · ' + n.proposed + ' ' + plural(n.proposed, 'proposal', 'proposals') + ' waiting' : '') + '.'));
  // THE ONE ACTION for the whole
  const whole = mk('div', 'mkf-whole');
  const ws = (D.whole && D.whole.state) || 'not';
  whole.appendChild(mk('p', 'mkf-whole-state mkf-' + ws, 'The whole foundation: ' + stateLine(D.whole) + '.'));
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  if (ws !== 'approved') {
    const ab = mk('button', 'go', 'Approve the whole foundation'); ab.type = 'button';
    ab.addEventListener('click', () => approve(null, ab, said));
    whole.appendChild(ab);
  }
  whole.appendChild(said);
  if (SAID.whole) { said.textContent = SAID.whole; delete SAID.whole; }
  EL.appendChild(whole);
  // THE PARTS
  for (const p of PARTS) EL.appendChild(drawPart(p, part(p.key)));
  EL.appendChild(mk('p', 'mk-item-meta', String(D.boundary || '')));
}

function drawPart(p, P) {
  const det = mk('details', 'mkf-part');
  det.dataset.part = p.key;
  if (OPEN.has(p.key)) det.open = true;
  det.addEventListener('toggle', () => { if (det.open) OPEN.add(p.key); else OPEN.delete(p.key); });
  const sum = mk('summary', 'mkf-sum');
  const st = (P.approval && P.approval.state) || 'not';
  sum.append(mk('span', 'mkf-sum-label', p.label), mk('span', 'mkf-badge mkf-' + st, STATE[st]));
  det.appendChild(sum);
  det.appendChild(mk('p', 'mkf-q', p.q));
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  if (SAID[p.key]) { said.textContent = SAID[p.key]; delete SAID[p.key]; }
  // proposals first: the box (or a person) asked for a change; nothing changed until someone accepts
  for (const x of (P.proposed || [])) det.appendChild(drawProposal(x, P, said));
  if (p.key === 'brand') det.appendChild(drawBrand(P.lines));
  const ul = mk('ul', 'mkf-lines');
  let grp = null;
  for (const l of P.lines) {
    if (l.grp && l.grp !== grp) { const g = mk('li', 'mkf-grp'); g.appendChild(data_('h4', 'mk-sub', l.grp)); ul.appendChild(g); }
    grp = l.grp || grp;
    ul.appendChild(drawLine(l, said));
  }
  if (!P.lines.length) ul.appendChild(mk('li', 'quiet', 'Nothing here yet.'));
  det.appendChild(ul);
  // add a line
  const add = mk('button', 'go ghost', 'Add a line'); add.type = 'button';
  const addBox = mk('div', 'mkf-edit');
  add.addEventListener('click', () => { addBox.innerHTML = ''; editor(addBox, '', p.key === 'icp' ? '' : null, async (body, why, grp2) => rpc('mk_foundation_edit', { p_line: null, p_part: p.key, p_grp: grp2, p_body: body, p_why: why }), p.key); });
  const acts = mk('div', 'mk-acts');
  acts.appendChild(add);
  // the part's one action
  const ar = mk('div', 'mkf-approve');
  ar.appendChild(mk('p', 'mkf-approve-state', stateLine(P.approval) + '.'));
  if (st !== 'approved') {
    const ab = mk('button', 'go', 'Approve ' + p.label); ab.type = 'button';
    ab.addEventListener('click', () => approve(p.key, ab, said));
    ar.appendChild(ab);
  }
  det.append(acts, addBox, ar, said);
  // earlier lines: history, with why and where an older source disagrees
  if ((P.earlier || []).length) {
    const ed = mk('details', 'mkf-earlier');
    ed.appendChild(mk('summary', 'mk-hand-label', 'Earlier (' + P.earlier.length + ')'));
    const eu = mk('ul', 'mkf-lines');
    for (const l of P.earlier) {
      const li = mk('li', 'mkf-line mkf-old');
      li.appendChild(data_('p', 'mkf-body', l.body));
      li.appendChild(srcLine(l));
      if (l.why_earlier) li.appendChild(mk('p', 'state', 'Why it is earlier: ' + l.why_earlier));
      if (l.disagrees) { const dq = mk('p', 'mkf-disagrees'); dq.append(mk('span', 'mkf-flag', 'Disagrees with the latest'), document.createTextNode(' '), data_('span', null, l.disagrees)); li.appendChild(dq); }
      eu.appendChild(li);
    }
    ed.appendChild(eu);
    det.appendChild(ed);
  }
  return det;
}

function srcLine(l) {
  const s = l.source || {};
  const p = mk('p', 'mkf-src');
  p.appendChild(mk('span', null, 'From'));
  p.appendChild(document.createTextNode(' '));
  if (s.kind === 'page' && s.ref) { const a = data_('a', null, s.title); a.href = s.ref; a.target = '_blank'; a.rel = 'noopener'; p.appendChild(a); }
  else p.appendChild(data_('span', null, s.title || ''));
  const md = s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  if (s.date && !String(s.title || '').includes(md)) p.appendChild(document.createTextNode(', ' + day(s.date)));
  return p;
}

function drawLine(l, said) {
  const li = mk('li', 'mkf-line');
  // the line itself is the press that shows what can be done with it (Change, See the source, History, Retire), so a part of 17
  // lines reads as 17 lines, not 68 buttons
  const body = data_('p', 'mkf-body mkf-tap', l.body);
  body.tabIndex = 0; body.setAttribute('role', 'button'); body.setAttribute('aria-expanded', 'false');
  li.appendChild(body);
  li.appendChild(srcLine(l));
  if (Number(l.version_no) > 1 && l.changed_by) li.appendChild(mk('p', 'mk-item-meta', 'Changed by ' + l.changed_by + ' on ' + day(l.changed_at) + (l.changed_why ? ': ' + l.changed_why : '')));
  const acts = mk('div', 'mk-acts');
  const box = mk('div', 'mkf-edit');
  const e = mk('button', 'go ghost', 'Change'); e.type = 'button';
  e.addEventListener('click', () => { box.innerHTML = ''; editor(box, l.body, null, async (body, why) => rpc('mk_foundation_edit', { p_line: l.id, p_part: null, p_grp: null, p_body: body, p_why: why }), l.part); });
  acts.appendChild(e);
  const s = l.source || {};
  if ((s.kind === 'chat' || s.kind === 'document') && s.ref) {
    const b = mk('button', 'go ghost', 'See the source'); b.type = 'button';
    b.addEventListener('click', () => { box.innerHTML = ''; showSource(box, s.ref); });
    acts.appendChild(b);
  }
  if ((l.versions || []).length > 1) {
    const h = mk('button', 'go ghost', 'History (' + l.versions.length + ')'); h.type = 'button';
    h.addEventListener('click', () => { box.innerHTML = ''; showHistory(box, l.versions); });
    acts.appendChild(h);
  }
  const r = mk('button', 'go ghost', 'Retire'); r.type = 'button';
  r.addEventListener('click', () => { box.innerHTML = ''; retireBox(box, l); });
  acts.appendChild(r);
  acts.hidden = true;
  const toggle = () => { acts.hidden = !acts.hidden; body.setAttribute('aria-expanded', String(!acts.hidden)); if (acts.hidden) box.innerHTML = ''; };
  body.addEventListener('click', toggle);
  body.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); } });
  li.append(acts, box);
  return li;
}

function drawProposal(x, P, said) {
  const card = mk('div', 'mkf-proposal');
  card.appendChild(mk('p', 'eyebrow', 'Proposed change'));
  const old = x.proposes ? P.lines.find((l) => l.id === x.proposes) : null;
  if (old) { card.appendChild(mk('p', 'mk-item-meta', 'Now:')); card.appendChild(data_('p', 'mkf-body mkf-strike', old.body)); card.appendChild(mk('p', 'mk-item-meta', 'Would become:')); }
  else card.appendChild(mk('p', 'mk-item-meta', 'A new line:'));
  card.appendChild(data_('p', 'mkf-body', x.body));
  card.appendChild(mk('p', 'state', (x.source && x.source.title ? x.source.title + '. ' : '') + 'Why: ' + (x.changed_why || '')));
  const acts = mk('div', 'mk-acts');
  const ok = mk('button', 'go', 'Accept'); ok.type = 'button';
  const no = mk('button', 'go ghost', 'Decline'); no.type = 'button';
  const go = async (accept, btn) => {
    ok.disabled = true; no.disabled = true;
    const w = mk('span', 'working no-late', accept ? 'Accepting' : 'Declining'); btn.after(w);
    const r = await rpc('mk_foundation_decide', { p_line: x.id, p_accept: accept, p_why: null });
    w.remove();
    if (!r || r.ok !== true) { ok.disabled = false; no.disabled = false; said.textContent = 'Not done: ' + why_(r); return; }
    SAID[x.part] = r.said; OPEN.add(x.part); await load('Reading the foundation again');
  };
  ok.addEventListener('click', () => go(true, ok));
  no.addEventListener('click', () => go(false, no));
  acts.append(ok, no);
  card.appendChild(acts);
  return card;
}

// BRAND ASSETS: the colors as swatches, the fonts as a sample line, the logo as an image; each is a line of the part like any other
function drawBrand(lines) {
  const wrap = mk('div', 'mkf-brand');
  const sw = mk('div', 'mkf-swatches');
  const fonts = mk('div', 'mkf-fonts');
  for (const l of lines) {
    const a = l.asset || {};
    if (a.kind === 'color' && a.hex) {
      const s = mk('div', 'mkf-swatch');
      const chip = mk('span', 'mkf-swatch-chip'); chip.style.background = a.hex; chip.setAttribute('aria-hidden', 'true');
      s.append(chip, data_('span', 'mkf-swatch-hex', a.hex), mk('span', 'mkf-swatch-role', a.role === 'accent' ? 'accent' : a.role === 'text' ? 'text' : a.role === 'background' ? 'background' : String(a.role || '')));
      sw.appendChild(s);
    } else if (a.kind === 'font' && a.family) {
      const f = mk('div', 'mkf-font');
      const sample = data_('p', 'mkf-font-sample', 'AI changed what an agency has to be.'); sample.style.fontFamily = '"' + a.family + '", system-ui, sans-serif';
      f.append(data_('p', 'mkf-font-name', a.family), mk('p', 'mk-item-meta', 'for ' + (a.use || '')), sample);
      fonts.appendChild(f);
    } else if (a.kind === 'logo' && a.url) {
      const lg = mk('div', 'mkf-logo');
      const img = C.el('img'); img.src = a.url; img.alt = 'HireKraft logo'; img.loading = 'lazy';
      img.addEventListener('error', () => { img.remove(); lg.appendChild(mk('p', 'state', 'The logo could not be loaded from the website just now.')); });
      lg.appendChild(img);
      wrap.appendChild(lg);
    }
  }
  if (sw.children.length) wrap.prepend(sw);
  if (fonts.children.length) wrap.appendChild(fonts);
  wrap.appendChild(mk('p', 'mk-item-meta', 'The type sample shows the font when this device has it.'));
  return wrap;
}

function editor(box, start, grpStart, save, partKey) {
  const ta = C.el('textarea'); ta.className = 'mkf-ta'; ta.value = start || ''; ta.rows = 3; ta.setAttribute('aria-label', 'The line');
  box.appendChild(ta);
  let grpIn = null;
  if (grpStart !== null && grpStart !== undefined) {
    grpIn = C.el('input'); grpIn.className = 'mkf-in'; grpIn.value = grpStart; grpIn.setAttribute('aria-label', 'Which customer group'); grpIn.placeholder = 'Which customer group (for example Procurement)';
    box.appendChild(grpIn);
  }
  const why = C.el('input'); why.className = 'mkf-in'; why.setAttribute('aria-label', 'Why'); why.placeholder = 'Why (kept with the change)';
  box.appendChild(why);
  const acts = mk('div', 'mk-acts');
  const ok = mk('button', 'go', 'Save'); ok.type = 'button';
  const no = mk('button', 'go ghost', 'Cancel'); no.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  no.addEventListener('click', () => { box.innerHTML = ''; });
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    const w = mk('span', 'working no-late', 'Saving'); ok.after(w);
    const r = await save(ta.value, why.value, grpIn ? grpIn.value : null);
    w.remove();
    if (!r || r.ok !== true) { ok.disabled = false; said.textContent = 'Not saved: ' + why_(r); return; }
    SAID[partKey] = r.said; OPEN.add(partKey); await load('Reading the foundation again');
  });
  acts.append(ok, no);
  box.append(acts, said);
  ta.focus();
}

function retireBox(box, l) {
  box.appendChild(mk('p', 'state', 'Retire moves this line to Earlier. It stays in the history with your reason.'));
  const why = C.el('input'); why.className = 'mkf-in'; why.setAttribute('aria-label', 'Why'); why.placeholder = 'Why (kept with the change)';
  const acts = mk('div', 'mk-acts');
  const ok = mk('button', 'go', 'Retire this line'); ok.type = 'button';
  const no = mk('button', 'go ghost', 'Cancel'); no.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  no.addEventListener('click', () => { box.innerHTML = ''; });
  ok.addEventListener('click', async () => {
    ok.disabled = true;
    const r = await rpc('mk_foundation_retire', { p_line: l.id, p_why: why.value });
    if (!r || r.ok !== true) { ok.disabled = false; said.textContent = 'Not done: ' + why_(r); return; }
    SAID[l.part] = r.said; OPEN.add(l.part); await load('Reading the foundation again');
  });
  acts.append(ok, no);
  box.append(why, acts, said);
}

async function approve(key, btn, said) {
  btn.disabled = true;
  const w = mk('span', 'working no-late', 'Approving'); btn.after(w);
  const r = await rpc('mk_foundation_approve', { p_part: key, p_note: null });
  w.remove();
  if (!r || r.ok !== true) { btn.disabled = false; said.textContent = 'Not approved: ' + why_(r); return; }
  if (key) { SAID[key] = r.said; OPEN.add(key); } else SAID.whole = r.said;
  await load('Reading the foundation again');
}

// THE SOURCE: read through chat_open (the brain refuses what she may not open); the first part of it, never a copy kept here
async function showSource(box, ref) {
  const w = mk('p', 'working no-late', 'Opening the source');
  box.appendChild(w);
  const r = await rpc('chat_open', { p_chat: ref });
  w.remove();
  if (!r || r.ok !== true) { box.appendChild(mk('p', 'notice flagged', 'The source could not be opened: ' + why_(r))); return; }
  box.appendChild(data_('p', 'mk-item-meta', String(r.title || '')));
  const m = (r.messages || []).find((x) => x && x.role === 'assistant') || (r.messages || [])[0];
  const t = String((m && m.text) || '');
  box.appendChild(data_('div', 'mk2-words', t.slice(0, 2400) + (t.length > 2400 ? ' ...' : '')));
  box.appendChild(mk('p', 'state', 'The whole of it is on the Chats tab.'));
}

function showHistory(box, versions) {
  const ul = mk('ul', 'mkf-lines');
  for (const v of versions) {
    const li = mk('li', 'mkf-line mkf-old');
    li.appendChild(mk('p', 'mk-item-meta', 'Version ' + v.n + ' · ' + String(v.by || '') + ' · ' + day(v.at) + (v.state && v.state !== 'latest' ? ' · ' + (v.state === 'earlier' ? 'moved to earlier' : v.state) : '')));
    li.appendChild(data_('p', 'mkf-body', v.body));
    if (v.why) li.appendChild(mk('p', 'state', 'Why: ' + v.why));
    ul.appendChild(li);
  }
  box.appendChild(ul);
}

// BENCH: WHO WE HAVE FOR A REQUIREMENT (seat bench-shortlist, 2026-11-02, decision 1056 slice 3).
// Staffing only: the work order card (mail.js drawOrder) is the same for every business; this file adds one press to it where the
// business has Bench (bench_here). The press asks the brain (bench_shortlist): the count first, then the people we have, each with
// which requirement lines their resume meets (quoted), where they came from, the last contact and availability where known, and
// their state on this requirement. Who may see which resume is decided in the brain (the CATS door); held back is counted there and
// said here, never shown as an empty list. No colour, size or spacing here; those are in skin.css under BENCH.

let here = null;   // one question per page: does this business have Bench, and is someone signed in
const STATES = [['submitted', 'Submitted'], ['interviewing', 'Interviewing'], ['placed', 'Placed'], ['not_a_fit', 'Not a fit']];

// ON TOP, NOT BEHIND A PRESS (seat mail-clean, 2026-11-02; Alex 13:11 PT: "where's all the job requirements coming in and then the
// match with what we have"). On an open requirement the card opens with Who we have already asked: the count, then the first three
// people each with why (the first requirement line their resume meets, quoted); Show all N is one press for the full list with
// states. The answer is kept per order for the page (one ask per order, not one per redraw). SUPERSEDES the Who we have press.
const asked = new Map();   // order id -> Promise of the first answer
export function drawBench(card, row, it, h) {
  if (!it || !it.wo_id) return;
  if (!here) here = h.sb.rpc('bench_here').then((x) => !x.error && x.data === true).catch(() => false);
  here.then((yes) => {
    if (!yes) return;
    const out = h.mk('div', 'bench-out bench-top-out');
    const wrap = h.mk('section', 'bench-press bench-first');
    wrap.setAttribute('aria-label', 'Who we have');
    wrap.appendChild(out);
    card.appendChild(wrap);
    first(it, out, h);
  });
}

function ask(it, all, h) {
  return h.sb.rpc('bench_shortlist', { p_wo: it.wo_id, p_all: all })
    .then((x) => (x.error ? { ok: false, reason: x.error.message } : x.data), (e) => ({ ok: false, reason: String((e && e.message) || e) }));
}
function first(it, out, h) {
  out.className = 'bench-out bench-top-out mailx-att-out working';
  out.textContent = 'Looking for who we have for this ' + (it.word || 'requirement') + '.';
  if (!asked.has(it.wo_id)) {
    const p = ask(it, false, h);
    asked.set(it.wo_id, p);
    p.then((r) => { if (!r || r.ok !== true) asked.delete(it.wo_id); });   // a failed ask is asked again next time
  }
  asked.get(it.wo_id).then((r) => {
    if (!r || r.present === false) { out.className = 'bench-out'; out.textContent = ''; return; }
    if (r.ok !== true) { out.className = 'bench-out mailx-att-out state stalled'; out.textContent = 'Not searched. ' + h.plainWords(String(r.reason || '')); return; }
    drawTop(it, r, out, h);
  });
}
function drawTop(it, r, out, h) {
  out.innerHTML = ''; out.className = 'bench-out bench-top-out';
  const hd = h.mk('h3', 'mailx-matter-h', 'Who we have');
  out.append(hd, h.mk('p', 'bench-count', String(r.line || '')));
  const rows = Array.isArray(r.rows) ? r.rows.slice(0, 3) : [];
  const ul = h.mk('ul', 'bench-list bench-three');
  for (const p of rows) {
    const li = h.mk('li', 'bench-person');
    const top = h.mk('div', 'bench-top');
    const nm = h.mk('span', 'bench-name', String(p.name || 'Name not kept')); nm.translate = false; top.appendChild(nm);
    top.appendChild(h.mk('span', 'bench-tag' + (p.met === p.of ? ' all' : ''), p.met === p.of ? 'All ' + p.of : p.met + ' of ' + p.of));
    if (p.state && p.state !== 'proposed') top.appendChild(h.mk('span', 'bench-state', String(p.state_words || p.state)));
    li.appendChild(top);
    const w = (Array.isArray(p.why) ? p.why : [])[0];
    if (w) {
      const q = h.mk('p', 'bench-why');
      const l = h.mk('strong', null, String(w.line || '')); l.translate = false; q.appendChild(l);
      if (w.quote) { const t = h.mk('span', null, ': "' + String(w.quote).slice(0, 140) + (String(w.quote).length > 140 ? '…' : '') + '"'); t.translate = false; q.appendChild(t); }
      li.appendChild(q);
    }
    ul.appendChild(li);
  }
  if (ul.childNodes.length) out.appendChild(ul);
  if ((r.count || 0) > rows.length) {
    const more = h.mk('button', 'go ghost', 'Show all ' + r.count); more.type = 'button';
    more.addEventListener('click', () => load(it, more, out, h, (r.count || 0) > (r.shown || 0)));
    out.appendChild(more);
  }
}

async function load(it, btn, out, h, all) {
  btn.disabled = true;
  out.className = 'bench-out mailx-att-out working';
  out.textContent = 'Searching every resume, your consultants and your contacts for this ' + (it.word || 'requirement') + '.';
  const slow = setTimeout(() => { out.textContent += ' This takes a few seconds more.'; }, 10000);
  let r = null;
  try { const x = await h.sb.rpc('bench_shortlist', { p_wo: it.wo_id, p_all: all }); r = x.error ? { ok: false, reason: x.error.message } : x.data; }
  catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  clearTimeout(slow);
  btn.disabled = false;
  if (!r || r.present === false) { out.className = 'bench-out'; out.textContent = ''; return; }
  if (r.ok !== true) { out.className = 'bench-out mailx-att-out state stalled'; out.textContent = 'Not searched. ' + h.plainWords(String(r.reason || '')); return; }
  draw(it, r, btn, out, h);
}

function draw(it, r, btn, out, h) {
  out.innerHTML = ''; out.className = 'bench-out';
  out.appendChild(h.mk('h3', 'mailx-matter-h', 'Who we have'));
  out.appendChild(h.mk('p', 'bench-count', String(r.line || '')));
  const lines = Array.isArray(r.lines) ? r.lines : [];
  if (lines.length) {
    const p = h.mk('p', 'bench-lines quiet', 'Searched for: ');
    lines.forEach((l, i) => { const s = h.mk('span', 'bench-line', String(l)); s.translate = false; p.appendChild(s); if (i < lines.length - 1) p.appendChild(document.createTextNode(' · ')); });
    out.appendChild(p);
  }
  const ul = h.mk('ul', 'bench-list');
  for (const p of (Array.isArray(r.rows) ? r.rows : [])) ul.appendChild(person(it, p, out, h));
  if (ul.childNodes.length) out.appendChild(ul);
  if ((r.count || 0) > (r.shown || 0)) {
    const more = h.mk('button', 'go ghost', 'Show all ' + r.count); more.type = 'button';
    more.addEventListener('click', () => load(it, more, out, h, true));
    out.appendChild(more);
  }
  out.appendChild(h.mk('p', 'bench-said quiet', String(r.said || '')));
}

function person(it, p, out, h) {
  const li = h.mk('li', 'bench-person');
  const top = h.mk('div', 'bench-top');
  const nm = h.mk('span', 'bench-name', String(p.name || 'Name not kept')); nm.translate = false; top.appendChild(nm);
  top.appendChild(h.mk('span', 'bench-tag' + (p.met === p.of ? ' all' : ''), p.met === p.of ? 'All ' + p.of : p.met + ' of ' + p.of));
  if (p.consultant) top.appendChild(h.mk('span', 'bench-tag us', String(p.consultant)));
  const st = h.mk('span', 'bench-state', String(p.state_words || 'Proposed')); top.appendChild(st);
  li.appendChild(top);
  for (const w of (Array.isArray(p.why) ? p.why : [])) {
    const q = h.mk('p', 'bench-why');
    const l = h.mk('strong', null, String(w.line || '')); l.translate = false; q.appendChild(l);
    if (w.quote) { const t = h.mk('span', null, ': "' + String(w.quote) + '"'); t.translate = false; q.appendChild(t); }
    li.appendChild(q);
  }
  if (Array.isArray(p.lines_missing) && p.lines_missing.length) {
    const m = h.mk('p', 'bench-why quiet', 'Not found in it: '); const t = h.mk('span', null, p.lines_missing.join(', ')); t.translate = false; m.appendChild(t); li.appendChild(m);
  }
  const facts = h.mk('p', 'bench-facts quiet', String(p.from || ''));
  if (p.url) { facts.appendChild(document.createTextNode(' · ')); const a = h.mk('a', null, 'Open in CATS'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; facts.appendChild(a); }
  facts.appendChild(document.createTextNode(' · ' + (p.last_contact ? 'Last contact ' + p.last_contact : 'No contact kept')));
  facts.appendChild(document.createTextNode(' · ' + (p.availability ? 'Availability: ' + p.availability : 'Availability not known')));
  li.appendChild(facts);
  if (p.state === 'not_a_fit' && p.state_reason) { const r = h.mk('p', 'bench-why quiet', 'Not a fit: '); const t = h.mk('span', null, String(p.state_reason)); t.translate = false; r.appendChild(t); li.appendChild(r); }
  const acts = h.mk('div', 'bench-acts');
  const said = h.mk('p', 'bench-said quiet', '');
  for (const [s, label] of STATES) {
    if (s === p.state) continue;
    const b = h.mk('button', 'go ghost', label); b.type = 'button';
    b.addEventListener('click', () => {
      if (s !== 'not_a_fit') return setState(it, p, s, null, b, st, said, h);
      if (li.querySelector('.bench-reason')) return;
      const f = h.mk('div', 'bench-reason');
      const inp = h.mk('input', null); inp.type = 'text'; inp.placeholder = 'Why not a fit?'; inp.setAttribute('aria-label', 'Why not a fit?');
      const ok = h.mk('button', 'go', 'Keep'); ok.type = 'button';
      ok.addEventListener('click', () => setState(it, p, s, inp.value, ok, st, said, h));
      f.append(inp, ok); li.appendChild(f); inp.focus();
    });
    acts.appendChild(b);
  }
  li.append(acts, said);
  return li;
}

async function setState(it, p, s, reason, btn, st, said, h) {
  btn.disabled = true; said.className = 'bench-said mailx-att-out working'; said.textContent = 'Keeping it.';
  let r = null;
  try { const x = await h.sb.rpc('bench_set', { p_wo: it.wo_id, p_key: p.key, p_state: s, p_reason: reason }); r = x.error ? { ok: false, reason: x.error.message } : x.data; }
  catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  btn.disabled = false;
  if (!r || r.ok !== true) { said.className = 'bench-said mailx-att-out state stalled'; said.textContent = 'Not kept. ' + h.plainWords(String((r && r.reason) || '')); return; }
  p.state = s; st.textContent = { submitted: 'Submitted', interviewing: 'Interviewing', placed: 'Placed', not_a_fit: 'Not a fit' }[s] || s;
  said.className = 'bench-said find-lesson'; said.textContent = String(r.line || 'Kept.');
}

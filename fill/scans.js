// SCANS AND PHOTOS (seat scans-photos, 2026-11-05; decision 1086, mock-up 8Bj7WB5GCDdBhUwPkBiXsB v1793842374-3f07).
// The square in the Brain room's What is connected, and the page behind it. fill/brainroom.js imports this file and calls
// scansSquare(ctx) on every paint; ctx is the room's own context plus square(line, state, word), which builds the square
// exactly as every other one. The square's own press opens the room's page (back button, Escape); this file then draws the
// page body into it.
//
// NOTHING HERE COUNTS OR PRICES. Every number is the brain's:
//   pictures per drive, waiting, price   source_pictures_state(null): price only for the owner (measured 2026-11-05)
//   Read them, read new scans            source_read_approve(key, 'pictures' | 'pictures_new_on' | 'pictures_new_off'),
//                                        the same owner-only press as understanding older mail: preview, then yes
//   done of total, pace, time left       work_running(), read ONCE for the whole Tool by fill/working.js and handed on as
//                                        window.toolWork and the document event 'tool:work' (seat work-indicator)
// Ordinary photos keep when and where they were taken, at no cost, always (walker-drive v63+); nothing to press.
// LEFT OUT, OWED (decision 1075, no dead buttons): Short descriptions of photos (no back end yet).
// The Tool identifies nobody by their face; the page says so in the brain's own words.
//
// SEAT work-indicator, 2026-11-12 (decision 1152 point 1; Alex 04:33 UTC: the sheet said only "Reading" per drive, and
// pressing several Yes in a row was "a little bit buggy"):
// (1) WHILE A DRIVE'S PICTURES ARE READ ITS ROW SHOWS done of total, the measured pace and the time left, moving by itself,
//     and says plainly when nothing has moved. A drive whose pictures were chosen but are not in line any more (they came
//     back unread) no longer says "Reading": it says they were not read and offers the press again.
// (2) THE SHEET IS NEVER DRAWN AGAIN UNDER HER FINGER. Before: 1.6 s after every Yes the whole sheet was blanked to "Reading"
//     and rebuilt, so a second drive's price line and its Yes / Not now, opened in that time, were wiped, and each drive's
//     "Started" line vanished. Now each drive is its own row, replaced in place only when nothing is open on it; a row with
//     an open question is left alone until she answers. SUPERSEDED, removed: the redraw of the whole sheet after a press.
// (3) An older answer of the brain can no longer overwrite a newer one (two readings in flight after two quick presses).
// No regex literals and no backslashes (STANDING-CLAUSES).

let S = null;          // the latest source_pictures_state answer
let err = null;        // why it could not be read
let loading = null;    // the reading in flight
let rseq = 0;          // which reading is the newest
let last = null;       // the latest ctx, so a reading that lands can repaint the square in place
let page = null;       // { body, ctx } while the sheet is open
let wired = false;
let hadWork = new Set();            // drives that had pictures being read at the last 'tool:work'
const started = new Map();          // source_key -> when her Yes started it (ms), so the row says Reading until the count arrives

const DOT = String.fromCharCode(183);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null; };
const pics = (n) => num(n) + (Number(n) === 1 ? ' picture' : ' pictures');

function read(ctx, fresh) {
  if (loading && !fresh) return loading;
  const mine = ++rseq;
  loading = ctx.sb.rpc('source_pictures_state', { p_source_key: null }).then(({ data, error }) => {
    if (mine !== rseq) return;
    if (error) { err = error.message || String(error); S = null; }
    else if (!data || data.ok !== true) { err = data?.note || 'no reason was given'; S = null; }
    else { S = data; err = null; }
  }, (e) => { if (mine !== rseq) return; err = e?.message ?? String(e); S = null; });
  return loading;
}

// The one reading of running work (fill/working.js). null: not known here (an older screen, or a brain without it).
function work() { const w = window.toolWork; return w && w.ok === true && Array.isArray(w.items) ? w : null; }
function picItem(key) { const w = work(); return w ? (w.items.find((x) => x.kind === 'pictures' && x.source_key === key) || null) : null; }
function justStarted(key) { const t = started.get(key); return !!t && Date.now() - t < 60000; }
function askWork() { try { document.dispatchEvent(new CustomEvent('tool:work-refresh')); } catch (_) { /* the indicator is not on this screen */ } }

function sqLine() {
  if (err) return ['Could not be read just now', 'unknown', null];
  if (!S) return ['Reading', null, null];
  const wait = Number(S.waiting) || 0;
  const w = work();
  const its = w ? w.items.filter((x) => x.kind === 'pictures') : [];
  if (its.length) {
    const d = its.reduce((a, x) => a + Number(x.done || 0), 0), t = its.reduce((a, x) => a + Number(x.total || 0), 0);
    return [num(d) + ' of ' + num(t) + ' read', 'reading', its.every((x) => x.state === 'stalled') ? 'Not Moving' : 'Reading'];
  }
  const chosen = (S.sources ?? []).some((s) => s.reading_chosen && Number(s.waiting) > 0 && (!w || justStarted(s.source_key)));
  if (wait > 0) return [num(wait) + ' not read yet', chosen ? 'reading' : 'none', chosen ? 'Reading' : (S.is_owner === true ? 'Your Choice' : 'Waiting')];
  if (Number(S.documents_read) > 0 || Number(S.photos_kept) > 0) return [[Number(S.documents_read) ? num(S.documents_read) + ' documents read' : '', Number(S.photos_kept) ? num(S.photos_kept) + ' photos kept' : ''].filter(Boolean).join(' ' + DOT + ' '), 'up_to_date', null];
  return ['No pictures in your drives', 'empty', null];
}

function makeSquare(ctx) {
  const [line, st, word] = sqLine();
  const b = ctx.square(line, st, word);
  // the room's press opens its page first (it has none of its own for scans); this one draws the body into it
  b.addEventListener('click', () => { const body = ctx.$('#br-page-body'); if (body) drawPage(body, ctx); });
  b.setAttribute('aria-label', 'Scans and photos: ' + line + (word ? ', ' + word : '') + '. Opens its page.');
  return b;
}

export function scansSquare(ctx) {
  last = ctx;
  wire();
  if (!S && !err && !loading) read(ctx).then(() => repaint());
  return makeSquare(ctx);
}

function repaint() {
  const ctx = last;
  const old = ctx?.$('[data-square="scans"]');
  if (old) old.replaceWith(makeSquare(ctx));
}

// The running work changed: the rows move by themselves. When a drive's pictures have just finished, its counts (documents
// read, photos kept, nothing waiting) are read again from the brain; otherwise nothing is asked of the brain here.
function wire() {
  if (wired) return;
  wired = true;
  document.addEventListener('tool:work', () => {
    const w = work();
    const now = new Set(w ? w.items.filter((x) => x.kind === 'pictures').map((x) => x.source_key) : []);
    const ended = [...hadWork].some((k) => !now.has(k));
    hadWork = now;
    for (const k of now) started.delete(k);
    const open = page && page.body.isConnected ? page : null;
    if (ended && last) { read(last, true).then(() => { repaint(); if (open) refresh(open.body, open.ctx); }); return; }
    repaint();
    if (open) refresh(open.body, open.ctx);
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PAGE

function txt(ctx, tag, cls, text) { const e = ctx.el(tag, cls); e.textContent = text; return e; }
function chip(ctx, tone, word) { const c = ctx.el('span', 'br-chip br-' + tone); c.appendChild(ctx.el('i')); c.appendChild(document.createTextNode(word)); return c; }
function line(ctx, parent, head, sub, right) {
  const d = ctx.el('div', 'br-line');
  const l = ctx.el('span', 'br-line-l');
  l.appendChild(txt(ctx, 'b', null, head));
  if (sub) { l.appendChild(ctx.el('br')); l.appendChild(typeof sub === 'string' ? txt(ctx, 'span', 'br-small', sub) : sub); }
  d.appendChild(l);
  if (right) d.appendChild(typeof right === 'string' ? txt(ctx, 'span', 'br-line-r', right) : right);
  parent.appendChild(d);
  return d;
}
function btn(ctx, word, ghost) { const b = ctx.el('button', ghost ? 'go ghost' : 'go'); b.type = 'button'; b.textContent = word; return b; }

// One owner press through the brain: preview (its own sentence and price), then Yes, then the brain's answer. keys: one
// drive, or several for a choice that applies to every drive (the brain is asked once per drive on Yes). wrap is the part
// of the sheet this press belongs to: while a question is open on it (data-busy) nothing replaces it.
function press(ctx, wrap, host, keys, mode, word, say) {
  const box = ctx.el('span', 'br-ready');
  const b = btn(ctx, word, mode !== 'pictures');
  const out = txt(ctx, 'p', 'br-small sc-out', '');
  out.hidden = true; out.setAttribute('aria-live', 'polite');
  box.appendChild(b);
  host.appendChild(box);
  wrap.appendChild(out);
  const call = (key, confirm) => ctx.sb.rpc('source_read_approve', { p_source_key: key, p_mode: mode, p_months: null, p_confirm: confirm });
  const free = () => { delete wrap.dataset.busy; };
  b.addEventListener('click', async () => {
    b.disabled = true; wrap.dataset.busy = '1'; out.hidden = false; out.className = 'br-small sc-out working no-late'; out.textContent = 'Asking the brain';
    try {
      const { data, error } = await call(keys[0], false);
      out.className = 'br-small sc-out';
      if (error) throw error;
      out.textContent = (data?.ok && data.preview && say) ? say : (data?.note ?? 'No answer was given.');
      if (!data?.ok || data.nothing_new || !data.preview) { b.disabled = false; free(); return; }
      const yes = btn(ctx, 'Yes, Go Ahead'), no = btn(ctx, 'Not Now', true);
      const row = ctx.el('span', 'br-ready sc-yes'); row.append(yes, no);
      out.after(row);
      no.addEventListener('click', () => { row.remove(); out.hidden = true; b.disabled = false; free(); if (page) refresh(page.body, page.ctx); });
      yes.addEventListener('click', async () => {
        yes.disabled = true; no.disabled = true;
        const said = out.textContent;
        out.className = 'br-small sc-out working no-late'; out.textContent = 'Starting';
        const notes = []; let ok = true;
        for (const k of keys) {
          try { const r = await call(k, true); if (r.error) throw r.error; notes.push(r.data?.note ?? 'No answer was given.'); if (!r.data?.ok) ok = false; else if (mode === 'pictures') started.set(k, Date.now()); }
          catch (e) { notes.push('It did not start: ' + (e?.message ?? e)); ok = false; }
        }
        row.remove();
        out.className = 'br-small sc-out';
        out.textContent = keys.length > 1 && ok ? notes[0].split(':')[0] + ': done for ' + keys.length + ' drives.' : notes.join(' ');
        if (!ok) { b.disabled = false; free(); if (!out.textContent) out.textContent = said; return; }
        // Started. This part keeps its answer on the screen until the brain's new counts are in; then only this part, and
        // any other part with nothing open on it, is replaced. Nothing she has open elsewhere on the sheet is touched.
        askWork();
        await read(ctx, true);
        free();
        repaint();
        if (page && page.body.isConnected) refresh(page.body, page.ctx);
      });
    } catch (e) { out.className = 'br-small sc-out'; out.textContent = 'It did not start: ' + (e?.message ?? e); b.disabled = false; free(); }
  });
}

// What a drive's row says under its name. While its pictures are read: the running work's own numbers.
function driveSub(ctx, s, owner, it) {
  const wait = Number(s.waiting) || 0;
  if (it) {
    const parts = window.toolWorkParts;
    const box = ctx.el('span', 'br-small sc-prog' + (it.state === 'stalled' ? ' wk-item-still' : ''));
    if (parts && parts.facts && parts.bar) { box.append(parts.bar(it), parts.facts(it)); return box; }
    box.textContent = num(it.done) + ' of ' + num(it.total);
    return box;
  }
  return [wait ? pics(wait) + ' waiting' : 'Nothing waiting',
    owner && wait && s.estimate_usd !== null && s.estimate_usd !== undefined ? 'about ' + usd(s.estimate_usd) : '',
    Number(s.documents_read) ? num(s.documents_read) + ' read' : ''].filter(Boolean).join(' ' + DOT + ' ');
}

function driveRow(ctx, s, owner) {
  const wrap = ctx.el('div', 'sc-drive');
  wrap.dataset.drive = s.source_key;
  const wait = Number(s.waiting) || 0;
  const it = picItem(s.source_key);
  const right = ctx.el('span', 'br-line-r');
  const d = line(ctx, wrap, s.label || 'A drive', driveSub(ctx, s, owner, it), right);
  d.querySelector('b')?.setAttribute('translate', 'no');
  if (it) right.appendChild(it.state === 'stalled' ? chip(ctx, 'off', 'Not Moving') : chip(ctx, 'read', 'Reading'));
  else if (!wait) right.appendChild(chip(ctx, 'ok', 'Up to Date'));
  else if (s.reading_chosen && (!work() || justStarted(s.source_key))) right.appendChild(chip(ctx, 'read', 'Reading'));   // chosen; the count is on its way, or this brain gives none
  else if (owner) {
    if (s.reading_chosen) wrap.appendChild(txt(ctx, 'p', 'br-small sc-note', 'These were chosen to be read and are not in line any more, so they were not read. You can start them again.'));
    press(ctx, wrap, right, [s.source_key], 'pictures', 'Read Them');
  } else right.appendChild(chip(ctx, 'off', 'Waiting'));
  return wrap;
}

function priceNote(ctx, owner, list) {
  const w = ctx.el('div', 'sc-price');
  if (owner && Number(S.waiting) > 0 && S.per_picture_usd !== null && S.per_picture_usd !== undefined) {
    w.appendChild(txt(ctx, 'p', 'br-small', 'About ' + usd(S.estimate_usd) + ' for all ' + pics(S.waiting) + ', at about ' + String(Math.round(Number(S.per_picture_usd) * 1000) / 10) + String.fromCharCode(162) + ' a picture, ' + (S.measured || 'measured on your own pictures') + '. A photo among them costs the same to look at, then keeps only when and where it was taken.'));
  }
  if (!owner && list.some((s) => s.price_note)) w.appendChild(txt(ctx, 'p', 'br-small', list.find((s) => s.price_note).price_note + ' Choosing to read them is the owner' + String.fromCharCode(8217) + 's to do.'));
  return w;
}

// ORDINARY PHOTOS, READ NEW SCANS, NOT READABLE
function restPanel(ctx, owner, list) {
  const q = ctx.el('div', 'br-panel sc-rest');
  const kept = [Number(S.with_time) ? num(S.with_time) + ' with when' : '', Number(S.with_place) ? num(S.with_place) + ' with where' : ''].filter(Boolean).join(' ' + DOT + ' ');
  line(ctx, q, 'Ordinary photos', 'When and where they were taken is kept, at no cost' + (kept ? ' ' + DOT + ' ' + kept : ''), chip(ctx, 'ok', 'On'));
  const drives = list.filter((s) => Number(s.waiting) > 0 || Number(s.documents_read) > 0 || Number(s.photos_kept) > 0);
  if (drives.length) {
    const on = drives.filter((s) => s.new_scans);
    const nr = ctx.el('span', 'br-line-r');
    const w = ctx.el('div', 'sc-new'); q.appendChild(w);
    line(ctx, w, 'Read new scans as they arrive', on.length ? (on.length === drives.length ? 'On for every drive with pictures' : 'On for ' + on.map((s) => s.label).join(', ')) : 'Off: new pictures wait for your choice', nr);
    if (owner) {
      const allOn = on.length === drives.length;
      const keys = (allOn ? drives : drives.filter((s) => !s.new_scans)).map((s) => s.source_key);
      const names = (allOn ? drives : drives.filter((s) => !s.new_scans)).map((s) => s.label || 'a drive').join(', ');
      const each = S.per_picture_usd !== null && S.per_picture_usd !== undefined ? ', at about ' + String(Math.round(Number(S.per_picture_usd) * 1000) / 10) + String.fromCharCode(162) + ' each' : '';
      press(ctx, q, nr, keys, allOn ? 'pictures_new_off' : 'pictures_new_on', allOn ? 'Turn off' : 'Turn On',
        allOn ? 'New pictures in ' + names + ' will wait for your choice again.' : 'New pictures added to ' + names + ' will be read as they arrive' + each + '.');
    } else nr.appendChild(chip(ctx, on.length ? 'ok' : 'off', on.length ? 'On' : 'Off'));
  }
  if (Number(S.not_readable) > 0) line(ctx, q, 'Not Read', pics(S.not_readable) + ' of a kind the Tool does not read (drawings, very large files, or a folder set aside in bulk). Kept with their name and date', null);
  return q;
}

function shown(list) { return list.filter((s) => Number(s.waiting) > 0 || Number(s.documents_read) > 0 || picItem(s.source_key)); }

// Each part of the sheet replaced in place from the latest answers; a part with a question open on it (data-busy) is left
// exactly as it is.
function refresh(body, ctx) {
  if (!body.isConnected || err || !S) return;
  const p = body.querySelector('.sc-drives');
  if (!p) return;
  const owner = S.is_owner === true;
  const list = S.sources ?? [];
  const want = shown(list);
  const have = new Map([...p.querySelectorAll('.sc-drive')].map((e) => [e.dataset.drive, e]));
  let after = null;
  p.querySelector('.sc-none')?.remove();
  for (const s of want) {
    const old = have.get(s.source_key);
    have.delete(s.source_key);
    if (old && old.dataset.busy === '1') { after = old; continue; }
    const fresh = driveRow(ctx, s, owner);
    if (old) old.replaceWith(fresh);
    else if (after) after.after(fresh);
    else p.prepend(fresh);
    after = fresh;
  }
  for (const [, e] of have) if (e.dataset.busy !== '1') e.remove();
  if (!p.querySelector('.sc-drive')) p.prepend(txt(ctx, 'p', 'quiet sc-none', 'No pictures are waiting in your drives.'));
  p.querySelector('.sc-price')?.remove();
  p.appendChild(priceNote(ctx, owner, list));
  const q = body.querySelector('.sc-rest');
  if (q && q.dataset.busy !== '1') q.replaceWith(restPanel(ctx, owner, list));
}

export async function drawPage(body, ctx) {
  page = { body, ctx };
  wire();
  body.replaceChildren(txt(ctx, 'h2', 'br-ph', 'Scans and Photos'), txt(ctx, 'p', 'br-lede working no-late', 'Reading'));
  askWork();
  await read(ctx, true);
  repaint();
  if (!body.isConnected) return;
  body.replaceChildren(txt(ctx, 'h2', 'br-ph', 'Scans and Photos'));
  if (err || !S) { body.appendChild(txt(ctx, 'p', 'br-lede', 'Your pictures could not be read just now: ' + (err || 'no reason was given') + '. This is the reading failing, not your drives being empty.')); return; }
  const owner = S.is_owner === true;
  const list = S.sources ?? [];
  body.appendChild(txt(ctx, 'p', 'br-lede', 'Pictures in your drives: scanned contracts, photographed receipts and invoices, and ordinary photos. Documents in pictures are read only when you choose.'));

  // DOCUMENTS IN PICTURES, per drive: waiting, the price, Read them; while they are read, done of total, pace and time left
  body.appendChild(txt(ctx, 'h3', 'br-h3', 'Documents in Pictures'));
  const p = ctx.el('div', 'br-panel sc-drives'); body.appendChild(p);
  body.appendChild(restPanel(ctx, owner, list));
  body.appendChild(txt(ctx, 'p', 'br-small br-note', S.faces || 'The Tool identifies nobody by their face.'));
  refresh(body, ctx);
}

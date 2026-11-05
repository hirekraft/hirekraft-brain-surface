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
// Ordinary photos keep when and where they were taken, at no cost, always (walker-drive v63+); nothing to press.
// LEFT OUT, OWED (decision 1075, no dead buttons): Short descriptions of photos (no back end yet).
// The Tool identifies nobody by their face; the page says so in the brain's own words.
// No regex literals and no backslashes (STANDING-CLAUSES).

let S = null;          // the latest source_pictures_state answer
let err = null;        // why it could not be read
let loading = null;    // the reading in flight
let last = null;       // the latest ctx, so a reading that lands can repaint the square in place

const DOT = String.fromCharCode(183);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => { const x = Number(n); return Number.isFinite(x) ? '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null; };
const pics = (n) => num(n) + (Number(n) === 1 ? ' picture' : ' pictures');

function read(ctx, fresh) {
  if (loading && !fresh) return loading;
  loading = ctx.sb.rpc('source_pictures_state', { p_source_key: null }).then(({ data, error }) => {
    if (error) { err = error.message || String(error); S = null; }
    else if (!data || data.ok !== true) { err = data?.note || 'no reason was given'; S = null; }
    else { S = data; err = null; }
  }, (e) => { err = e?.message ?? String(e); S = null; });
  return loading;
}

function sqLine() {
  if (err) return ['Could not be read just now', 'unknown', null];
  if (!S) return ['Reading', null, null];
  const wait = Number(S.waiting) || 0;
  const chosen = (S.sources ?? []).some((s) => s.reading_chosen && Number(s.waiting) > 0);
  if (wait > 0) return [num(wait) + ' not read yet', chosen ? 'reading' : 'none', chosen ? 'Reading' : (S.is_owner === true ? 'Your choice' : 'Waiting')];
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
  if (!S && !err && !loading) read(ctx).then(() => repaint());
  return makeSquare(ctx);
}

function repaint() {
  const ctx = last;
  const old = ctx?.$('[data-square="scans"]');
  if (old) old.replaceWith(makeSquare(ctx));
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PAGE

function txt(ctx, tag, cls, text) { const e = ctx.el(tag, cls); e.textContent = text; return e; }
function chip(ctx, tone, word) { const c = ctx.el('span', 'br-chip br-' + tone); c.appendChild(ctx.el('i')); c.appendChild(document.createTextNode(word)); return c; }
function line(ctx, parent, head, sub, right) {
  const d = ctx.el('div', 'br-line');
  const l = ctx.el('span', 'br-line-l');
  l.appendChild(txt(ctx, 'b', null, head));
  if (sub) { l.appendChild(ctx.el('br')); l.appendChild(txt(ctx, 'span', 'br-small', sub)); }
  d.appendChild(l);
  if (right) d.appendChild(typeof right === 'string' ? txt(ctx, 'span', 'br-line-r', right) : right);
  parent.appendChild(d);
  return d;
}
function btn(ctx, word, ghost) { const b = ctx.el('button', ghost ? 'go ghost' : 'go'); b.type = 'button'; b.textContent = word; return b; }

// One owner press through the brain: preview (its own sentence and price), then Yes, then the brain's answer. keys: one
// drive, or several for a choice that applies to every drive (the brain is asked once per drive on Yes).
function press(ctx, host, keys, mode, word, after, say) {
  const box = ctx.el('span', 'br-ready');
  const b = btn(ctx, word, mode !== 'pictures');
  const out = txt(ctx, 'p', 'br-small', '');
  out.hidden = true;
  box.appendChild(b);
  host.appendChild(box);
  (host.closest('.br-line') ?? host).after(out);
  const call = (key, confirm) => ctx.sb.rpc('source_read_approve', { p_source_key: key, p_mode: mode, p_months: null, p_confirm: confirm });
  b.addEventListener('click', async () => {
    b.disabled = true; out.hidden = false; out.textContent = 'Asking the brain';
    try {
      const { data, error } = await call(keys[0], false);
      if (error) throw error;
      out.textContent = (data?.ok && data.preview && say) ? say : (data?.note ?? 'No answer was given.');
      if (!data?.ok || data.nothing_new || !data.preview) { b.disabled = false; return; }
      const yes = btn(ctx, 'Yes, go ahead'), no = btn(ctx, 'Not now', true);
      const row = ctx.el('span', 'br-ready'); row.append(yes, no);
      out.after(row);
      no.addEventListener('click', () => { row.remove(); out.hidden = true; b.disabled = false; });
      yes.addEventListener('click', async () => {
        yes.disabled = true; no.disabled = true;
        const notes = []; let ok = true;
        for (const k of keys) {
          try { const r = await call(k, true); if (r.error) throw r.error; notes.push(r.data?.note ?? 'No answer was given.'); if (!r.data?.ok) ok = false; }
          catch (e) { notes.push('It did not start: ' + (e?.message ?? e)); ok = false; }
        }
        row.remove();
        out.textContent = keys.length > 1 && ok ? notes[0].split(':')[0] + ': done for ' + keys.length + ' drives.' : notes.join(' ');
        if (ok) { await read(ctx, true); repaint(); setTimeout(after, 1600); } else b.disabled = false;
      });
    } catch (e) { out.textContent = 'It did not start: ' + (e?.message ?? e); b.disabled = false; }
  });
}

export async function drawPage(body, ctx) {
  body.replaceChildren(txt(ctx, 'h2', 'br-ph', 'Scans and photos'), txt(ctx, 'p', 'br-lede', 'Reading'));
  await read(ctx, true);
  repaint();
  if (!body.isConnected) return;
  const again = () => drawPage(body, ctx);
  body.replaceChildren(txt(ctx, 'h2', 'br-ph', 'Scans and photos'));
  if (err || !S) { body.appendChild(txt(ctx, 'p', 'br-lede', 'Your pictures could not be read just now: ' + (err || 'no reason was given') + '. This is the reading failing, not your drives being empty.')); return; }
  const owner = S.is_owner === true;
  const list = S.sources ?? [];
  body.appendChild(txt(ctx, 'p', 'br-lede', 'Pictures in your drives: scanned contracts, photographed receipts and invoices, and ordinary photos. Documents in pictures are read only when you choose.'));

  // DOCUMENTS IN PICTURES, per drive: waiting, the price, Read them
  body.appendChild(txt(ctx, 'h3', 'br-h3', 'Documents in pictures'));
  const p = ctx.el('div', 'br-panel'); body.appendChild(p);
  const withPics = list.filter((s) => Number(s.waiting) > 0 || Number(s.documents_read) > 0);
  if (!withPics.length) p.appendChild(txt(ctx, 'p', 'quiet', 'No pictures are waiting in your drives.'));
  for (const s of withPics) {
    const wait = Number(s.waiting) || 0;
    const sub = [wait ? pics(wait) + ' waiting' : 'Nothing waiting',
      owner && wait && s.estimate_usd !== null && s.estimate_usd !== undefined ? 'about ' + usd(s.estimate_usd) : '',
      Number(s.documents_read) ? num(s.documents_read) + ' read' : ''].filter(Boolean).join(' ' + DOT + ' ');
    const right = ctx.el('span', 'br-line-r');
    const d = line(ctx, p, s.label || 'A drive', sub, right);
    d.querySelector('b')?.setAttribute('translate', 'no');
    if (s.reading_chosen && wait) right.appendChild(chip(ctx, 'read', 'Reading'));
    else if (!wait) right.appendChild(chip(ctx, 'ok', 'Up to date'));
    else if (owner) press(ctx, right, [s.source_key], 'pictures', 'Read them', again);
    else right.appendChild(chip(ctx, 'off', 'Waiting'));
  }
  if (owner && Number(S.waiting) > 0 && S.per_picture_usd !== null && S.per_picture_usd !== undefined) {
    p.appendChild(txt(ctx, 'p', 'br-small', 'About ' + usd(S.estimate_usd) + ' for all ' + pics(S.waiting) + ', at about ' + String(Math.round(Number(S.per_picture_usd) * 1000) / 10) + String.fromCharCode(162) + ' a picture, ' + (S.measured || 'measured on your own pictures') + '. A photo among them costs the same to look at, then keeps only when and where it was taken.'));
  }
  if (!owner && list.some((s) => s.price_note)) p.appendChild(txt(ctx, 'p', 'br-small', list.find((s) => s.price_note).price_note + ' Choosing to read them is the owner' + String.fromCharCode(8217) + 's to do.'));

  // ORDINARY PHOTOS, READ NEW SCANS, NOT READABLE
  const q = ctx.el('div', 'br-panel'); body.appendChild(q);
  const kept = [Number(S.with_time) ? num(S.with_time) + ' with when' : '', Number(S.with_place) ? num(S.with_place) + ' with where' : ''].filter(Boolean).join(' ' + DOT + ' ');
  line(ctx, q, 'Ordinary photos', 'When and where they were taken is kept, at no cost' + (kept ? ' ' + DOT + ' ' + kept : ''), chip(ctx, 'ok', 'On'));
  const drives = list.filter((s) => Number(s.waiting) > 0 || Number(s.documents_read) > 0 || Number(s.photos_kept) > 0);
  if (drives.length) {
    const on = drives.filter((s) => s.new_scans);
    const nr = ctx.el('span', 'br-line-r');
    line(ctx, q, 'Read new scans as they arrive', on.length ? (on.length === drives.length ? 'On for every drive with pictures' : 'On for ' + on.map((s) => s.label).join(', ')) : 'Off: new pictures wait for your choice', nr);
    if (owner) {
      const allOn = on.length === drives.length;
      const keys = (allOn ? drives : drives.filter((s) => !s.new_scans)).map((s) => s.source_key);
      const names = (allOn ? drives : drives.filter((s) => !s.new_scans)).map((s) => s.label || 'a drive').join(', ');
      const each = S.per_picture_usd !== null && S.per_picture_usd !== undefined ? ', at about ' + String(Math.round(Number(S.per_picture_usd) * 1000) / 10) + String.fromCharCode(162) + ' each' : '';
      press(ctx, nr, keys, allOn ? 'pictures_new_off' : 'pictures_new_on', allOn ? 'Turn off' : 'Turn on', again,
        allOn ? 'New pictures in ' + names + ' will wait for your choice again.' : 'New pictures added to ' + names + ' will be read as they arrive' + each + '.');
    } else nr.appendChild(chip(ctx, on.length ? 'ok' : 'off', on.length ? 'On' : 'Off'));
  }
  if (Number(S.not_readable) > 0) line(ctx, q, 'Not read', pics(S.not_readable) + ' of a kind the Tool does not read (drawings, very large files, or a folder set aside in bulk). Kept with their name and date', null);

  body.appendChild(txt(ctx, 'p', 'br-small br-note', S.faces || 'The Tool identifies nobody by their face.'));
}

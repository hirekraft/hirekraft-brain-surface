// THE TWO PRESSES OF THE BRAIN (seat brain-status-2, 2026-11-06; decisions 1106, 1108, 1112, 1114, 1115; picture
// VFFCoxg6cAHGmBVyMo4EPs). Drawn by fill/brainroom.js into Getting started, the Mail side panel and the road.
//   Read them   the files attached to older mail that is already findable: the brain's findable_files_queue, through the
//               owner's press source_read_approve(key, 'findable', null, confirm). Read with no AI; priced first at the
//               fingerprinting rate (read_estimate per_file_findable_usd).
//   Go          understanding, per source and how far back: source_read_approve(key, 'understand', months, confirm), which
//               is the one reader (understand_approve). Priced first from read_estimate's understand line (measured by
//               seat understand-reader); a choice above the AI balance cannot be pressed.
// Both: owner only (the brain refuses anyone else; the buttons are not drawn for anyone else), a preview first, then
// "Yes, go ahead". Nothing is pressed on her behalf (decision 1115). Progress comes from brain_road (understanding and
// files being read) and source_read_progress (per mailbox), never from the press's own answer.
// No regex literals and no backslashes (STANDING-CLAUSES).

const DOT = String.fromCharCode(183);
const DASH = String.fromCharCode(8211);
const num = (n) => Number(n || 0).toLocaleString('en-US');
const usd = (n) => { const x = Number(n); if (!Number.isFinite(x)) return null; return x < 10 ? '$' + x.toFixed(2) : '$' + Math.round(x).toLocaleString('en-US'); };
const hrs = (h) => { const x = Number(h); if (!Number.isFinite(x)) return null; return x < 1 ? 'under an hour' : 'about ' + Math.round(x) + (Math.round(x) === 1 ? ' hour' : ' hours'); };
const mins = (m) => { const x = Number(m); if (!Number.isFinite(x)) return 'time left: counting'; if (x <= 0) return 'done'; return x < 90 ? 'about ' + x + ' minutes left' : 'about ' + Math.round(x / 60) + ' hours left'; };

function txt(C, tag, cls, text) { const e = C.el(tag, cls); e.textContent = text; return e; }
function btn(C, cls, text) { const b = C.el('button', cls); b.type = 'button'; b.textContent = text; return b; }
function working(C, p, text) { p.className = 'working no-late br-small'; p.textContent = text; }
function said(C, p, text) { p.className = 'br-small br-said'; p.textContent = text; }
// WHERE THE PREVIEW SHOWS (seat getting-ready-screen, 2026-11-07, decision 1124). On the Brain it opens under the button, as
// before. The Getting ready screen (fill/ready.js) hands in C.sheet and C.toast: the same preview and the same Yes then open
// as a sheet over the page, and the result is said as a toast. One press, two places to show it; never a second press.
function place(C, res, box, title) { res.replaceChildren(); if (C.sheet) { C.sheet.open(title, box); return; } res.className = 'br-small'; res.appendChild(box); }
function shut(C) { if (C.sheet) C.sheet.close(); }
function landed(C, p) { if (!C.toast) return; C.toast(p.textContent); setTimeout(() => shut(C), 2500); }

// ---------------------------------------------------------------------------------------------------------------------
// THE ESTIMATES: three readings of read_estimate (6 months, 2 years, all), kept for 5 minutes, owner only.
let est = null, estAt = 0, estP = null;
export function estimates(C, fresh) {
  if (!fresh && est && Date.now() - estAt < 300000) return Promise.resolve(est);
  if (estP && !fresh) return estP;
  const one = (q) => C.askBody({ read_estimate: q }).catch((e) => ({ ok: false, error: e?.message ?? String(e) }));
  estP = Promise.all([one({ months: 6 }), one({ months: 24 }), one({})]).then(([a, b, c]) => {
    est = { m6: a, m24: b, all: c }; estAt = Date.now(); estP = null; return est;
  });
  return estP;
}
const srcs = (r) => (r && r.ok === true && r.estimate && r.estimate.ok === true ? r.estimate.sources ?? [] : []);
const balanceOf = (r) => { const b = Number(r?.balance?.balance_left_usd ?? r?.estimate?.balance?.balance_left_usd); return Number.isFinite(b) ? b : null; };
const why = (r) => (r?.ok !== true ? String(r?.error ?? 'no reason was given') : r?.estimate?.ok !== true ? String(r?.estimate?.reason ?? 'no figure') : null);

// The understand line summed over the sources of one kind: {n, usd, low, high, hours, daily, keys, state, reason}
function sum(list, kind) {
  const mine = list.filter((s) => s.kind === kind);
  const out = { n: 0, usd: 0, low: 0, high: 0, hours: 0, daily: 0, keys: [], reason: null, sources: mine.length };
  for (const s of mine) {
    const u = s.understand;
    if (!u || u.state === 'no_measurement') { out.reason = u?.reason ?? 'what understanding costs has not been measured yet'; continue; }
    out.daily += Number(u.daily_usd) || 0;
    if (u.state !== 'estimated' || !(Number(u.to_read) > 0)) continue;
    out.n += Number(u.to_read); out.usd += Number(u.usd) || 0; out.low += Number(u.low_usd) || 0; out.high += Number(u.high_usd) || 0;
    out.hours += Number(u.hours) || 0; out.keys.push(s.source_key);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// MAKE IT UNDERSTOOD: choose per source and how far back, see the price and time, Go.
const MAIL_CH = [['m6', 6, '6 months'], ['m24', 24, '2 years'], ['all', null, 'Everything'], ['no', undefined, 'Not now']];
const DRIVE_CH = [['all', null, 'All files'], ['no', undefined, 'Not now']];
let pick = { mail: 'm24', drive: 'no' };

export function understandBlock(C, host, R, after) {
  host.replaceChildren(txt(C, 'p', 'working no-late br-small', 'Working out what understanding would cost, from your own count'));
  estimates(C).then((E) => drawUnderstand(C, host, E, R, after));
}

function drawUnderstand(C, host, E, R, after) {
  if (!host.isConnected) return;
  const w = why(E.all);
  if (w) { host.replaceChildren(txt(C, 'p', 'br-small', 'The price could not be worked out just now: ' + w + '. Nothing can be started without its price, so there is no Go button until it can.')); return; }
  const bal = balanceOf(E.all);
  const S = { m6: sum(srcs(E.m6), 'mail'), m24: sum(srcs(E.m24), 'mail'), all: sum(srcs(E.all), 'mail') };
  const D = { all: sum(srcs(E.all), 'drive') };
  const out = [];
  const row = (title, list, sums, kind) => {
    const d = C.el('div', 'br-srcch');
    d.appendChild(txt(C, 'b', 'br-srcch-n', title));
    const seg = C.el('div', 'br-seg'); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', title + ': how far back');
    for (const [k, , word] of list) {
      const s = sums[k];
      const b = C.el('button', 'br-segb' + (pick[kind] === k ? ' on' : '')); b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', pick[kind] === k ? 'true' : 'false');
      b.appendChild(txt(C, 'span', null, word));
      let small = '';
      if (k !== 'no') small = !s ? '' : s.reason && !s.n ? 'no price yet' : !s.n ? 'nothing left to read' : num(s.n) + ' ' + DOT + ' ' + usd(s.low) + DASH + usd(s.high);
      if (small) b.appendChild(txt(C, 'small', null, small));
      if (k !== 'no' && (!s || !s.n)) b.disabled = true;
      b.addEventListener('click', () => { pick[kind] = k; drawUnderstand(C, host, E, R, after); });
      seg.appendChild(b);
    }
    d.appendChild(seg);
    out.push(d);
  };
  if (S.all.sources) row('Mail', MAIL_CH, S, 'mail');
  if (D.all.sources) row('Drives', DRIVE_CH, D, 'drive');
  const months = { m6: 6, m24: 24, all: null };
  const chosen = [];
  if (pick.mail !== 'no' && S[pick.mail]?.n) chosen.push({ kind: 'mail', months: months[pick.mail], s: S[pick.mail] });
  if (pick.drive !== 'no' && D[pick.drive]?.n) chosen.push({ kind: 'drive', months: null, s: D[pick.drive] });
  const tot = chosen.reduce((a, c) => ({ n: a.n + c.s.n, usd: a.usd + c.s.usd, low: a.low + c.s.low, high: a.high + c.s.high, hours: a.hours + c.s.hours, keys: a.keys.concat(c.s.keys.map((k) => ({ key: k, months: c.months }))) }), { n: 0, usd: 0, low: 0, high: 0, hours: 0, keys: [] });
  const daily = S.all.daily + D.all.daily;
  const total = C.el('div', 'br-total');
  const say = C.el('span', 'br-total-t');
  const res = txt(C, 'p', 'br-small', '');
  if (!tot.n) say.appendChild(document.createTextNode('Choose what to understand. Nothing starts until you press Go.'));
  else {
    say.append(document.createTextNode('Your choice: '), txt(C, 'b', null, 'about ' + usd(tot.usd)),
      document.createTextNode(' (' + usd(tot.low) + ' to ' + usd(tot.high) + ') for ' + num(tot.n) + (chosen.length === 1 && chosen[0].kind === 'drive' ? ' files' : chosen.some((c) => c.kind === 'drive') ? ' emails and files' : ' emails')
        + ' ' + DOT + ' ' + hrs(tot.hours) + ' of reading ' + DOT + ' then about ' + usd(daily) + ' a day for new ones'));
  }
  const go = btn(C, 'go', 'Go');
  const over = bal !== null && tot.usd > bal;
  go.disabled = !tot.n || over;
  total.append(say, go);
  out.push(total);
  const notes = [];
  notes.push('Prices are measured on test mail and scaled to the length of your own; the first hour of reading shows the true figure on your AI and costs. Overnight reading at half price is not switched on yet.');
  if (bal !== null) notes.push(over ? 'This is more than your AI balance of ' + usd(bal) + ', so Go waits until the balance is topped up.' : 'Your AI balance is ' + usd(bal) + '.');
  out.push(txt(C, 'p', 'br-small br-note', notes.join(' ')), res);
  go.addEventListener('click', () => confirmStep(C, total, res, tot, 'understand', after));
  host.replaceChildren(...out);
}

// The preview, then Yes. One press runs every chosen source in turn, each through the brain's own press.
async function confirmStep(C, total, res, tot, mode, after) {
  const first = tot.keys[0];
  if (!first) return;
  total.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  working(C, res, 'Asking the brain what this would start');
  let pv;
  try { const { data, error } = await C.sb.rpc('source_read_approve', { p_source_key: first.key, p_mode: mode, p_months: first.months ?? null, p_confirm: false }); if (error) throw error; pv = data; }
  catch (e) { said(C, res, 'It could not be asked: ' + (e?.message ?? e) + '. Nothing was started.'); total.querySelectorAll('button').forEach((b) => { b.disabled = false; }); return; }
  if (!pv?.ok) { said(C, res, (pv?.note ?? 'It was refused, and no reason was given.') + ' Nothing was started.'); return; }
  const box = C.el('div', 'br-confirm');
  const n = tot.keys.length;
  box.appendChild(txt(C, 'p', 'br-small', String(pv.note ?? '') + (n > 1 ? ' The same for ' + (n - 1) + ' more ' + (n - 1 === 1 ? 'source' : 'sources') + '.' : '')));
  const yes = btn(C, 'go', mode === 'understand' ? 'Yes, go ahead ' + DOT + ' about ' + usd(tot.usd) : 'Yes, go ahead');
  const no = btn(C, 'go ghost', 'Not now');
  const acts = C.el('div', 'br-chips'); acts.append(yes, no); box.appendChild(acts);
  place(C, res, box, mode === 'understand' ? 'Understand what you chose?' : 'Make it findable?');
  no.addEventListener('click', () => { shut(C); res.replaceChildren(); total.querySelectorAll('button').forEach((b) => { b.disabled = false; }); });
  yes.addEventListener('click', async () => {
    yes.disabled = true; no.disabled = true;
    const p = C.el('p'); box.appendChild(p);
    let ok = 0; const bad = [];
    for (const [i, k] of tot.keys.entries()) {
      working(C, p, 'Starting ' + (i + 1) + ' of ' + n);
      try {
        const { data, error } = await C.sb.rpc('source_read_approve', { p_source_key: k.key, p_mode: mode, p_months: k.months ?? null, p_confirm: true });
        if (error) throw error;
        if (data?.ok) ok += 1; else bad.push(data?.note ?? 'refused');
      } catch (e) { bad.push(e?.message ?? String(e)); }
    }
    said(C, p, (ok ? 'Started: ' + ok + (ok === 1 ? ' source is' : ' sources are') + ' being ' + (mode === 'understand' ? 'understood' : 'made findable') + '. You can leave this page; it goes on by itself and the road shows how far it is.' : 'Nothing started.')
      + (bad.length ? ' Not started: ' + bad.length + ' (' + bad[0] + ').' : ''));
    landed(C, p);
    if (after) after();
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// READ THEM: the files attached to mail that is already findable. Per mailbox from source_read_progress; the exact number
// and the price come from the press's own preview, so the button never offers more than the press reads.
export function filesBlock(C, host, R, after) {
  const rows = (R.prog ?? []).filter((r) => r.kind === 'gmail' && Number(r.files_waiting_for_owner) > 0);
  const d = R.road;
  const out = [];
  const reading = Number(d?.findable?.reading) || 0;
  if (reading > 0) {
    const pc = Number(d.mail.attach_read) + reading > 0 ? Number(d.mail.attach_read) * 100 / (Number(d.mail.attach_read) + reading) : 0;
    const l = C.el('div', 'br-prog');
    l.append(txt(C, 'b', null, 'Reading files attached to your mail'), txt(C, 'span', 'br-small', num(reading) + ' in line ' + DOT + ' ' + mins(d.findable.minutes_left)));
    const pb = C.el('span', 'br-pb'); const f = C.el('i', 'br-kf'); f.style.width = Math.max(2, Math.min(100, pc)).toFixed(1) + '%'; pb.appendChild(f); l.appendChild(pb);
    out.push(l);
  }
  if (!rows.length) { host.replaceChildren(...out); return; }
  const line = C.el('div', 'br-prog');
  line.append(txt(C, 'b', null, 'Files attached to older mail'),
    txt(C, 'span', 'br-small', rows.map((r) => String(r.source).split(':').slice(1).join(':') + ' ' + num(r.files_waiting_for_owner)).join(' ' + DOT + ' ')),
    txt(C, 'span', 'br-small', 'Waiting for your yes. Word, Excel, PowerPoint, PDF and text files are read with no AI; pictures are not read and recordings wait for understanding, so the press reads fewer than this.'));
  out.push(line);
  if (R.owner) {
    const total = C.el('div', 'br-total');
    const say = txt(C, 'span', 'br-total-t', 'Make them findable, so you can find and quote them.');
    const go = btn(C, 'go', 'Read them');
    total.append(say, go);
    const res = txt(C, 'p', 'br-small', '');
    out.push(total, res);
    go.addEventListener('click', () => filesConfirm(C, total, res, rows, after));
  }
  host.replaceChildren(...out);
}

async function filesConfirm(C, total, res, rows, after) {
  const host = total.parentElement;
  if (host) host.dataset.hold = '1';   // a reading that lands meanwhile does not redraw this block (brainroom paintStart)
  const free = () => { if (host) delete host.dataset.hold; };
  total.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  working(C, res, 'Counting the files each mailbox would read');
  const E = await estimates(C);
  const rate = Number(E?.all?.estimate?.per_file_findable_usd);
  const pv = [];
  for (const r of rows) {
    try {
      const { data, error } = await C.sb.rpc('source_read_approve', { p_source_key: r.source, p_mode: 'findable', p_months: null, p_confirm: false });
      if (error) throw error;
      if (data?.ok && Number(data.files_waiting) > 0) pv.push({ key: r.source, n: Number(data.files_waiting), note: data.note });
    } catch (_) { /* that mailbox is said below as not counted */ }
  }
  const n = pv.reduce((a, x) => a + x.n, 0);
  if (!n) { free(); said(C, res, 'No file is waiting that this press reads. Nothing was started.'); return; }
  if (!Number.isFinite(rate) || rate <= 0) { free(); said(C, res, num(n) + ' files would be read, but what fingerprinting them costs has not been measured, so no figure is given and nothing was started.'); return; }
  const box = C.el('div', 'br-confirm');
  box.appendChild(txt(C, 'p', 'br-small', num(n) + ' files from ' + pv.length + (pv.length === 1 ? ' mailbox' : ' mailboxes') + ' will be read with no AI and made findable, about ' + usd(n * rate) + ' in all. ' + (rows.length > pv.length ? num(rows.length - pv.length) + (rows.length - pv.length === 1 ? ' mailbox has' : ' mailboxes have') + ' only pictures or recordings waiting, which this press does not read. ' : '') + 'New mail keeps being read as usual.'));
  const yes = btn(C, 'go', 'Yes, go ahead ' + DOT + ' about ' + usd(n * rate));
  const no = btn(C, 'go ghost', 'Not now');
  const acts = C.el('div', 'br-chips'); acts.append(yes, no); box.appendChild(acts);
  place(C, res, box, 'Read ' + num(n) + ' files?');
  no.addEventListener('click', () => { free(); shut(C); res.replaceChildren(); total.querySelectorAll('button').forEach((b) => { b.disabled = false; }); });
  yes.addEventListener('click', async () => {
    yes.disabled = true; no.disabled = true;
    const p = C.el('p'); box.appendChild(p);
    let q = 0; const bad = [];
    for (const [i, x] of pv.entries()) {
      working(C, p, 'Starting ' + (i + 1) + ' of ' + pv.length);
      try {
        const { data, error } = await C.sb.rpc('source_read_approve', { p_source_key: x.key, p_mode: 'findable', p_months: null, p_confirm: true });
        if (error) throw error;
        if (data?.ok) q += Number(data.files_queued) || 0; else bad.push(data?.note ?? 'refused');
      } catch (e) { bad.push(e?.message ?? String(e)); }
    }
    setTimeout(free, 30000);
    said(C, p, (q ? 'Started: ' + num(q) + ' files are being made findable. You can leave this page; the road shows how far it is.' : 'Nothing started.') + (bad.length ? ' Not started: ' + bad.length + ' (' + bad[0] + ').' : ''));
    landed(C, p);
    if (after) after();
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// UNDERSTANDING IN PROGRESS: from brain_road.understanding (item_reading), for Getting started and the road.
export function understandProgress(C, R) {
  const u = R.road?.understanding;
  if (!u || !(Number(u.pressed) > 0)) return null;
  const l = C.el('div', 'br-prog');
  const done = Number(u.done), all = Number(u.pressed);
  l.append(txt(C, 'b', null, Number(u.waiting) > 0 ? 'Understanding' : 'Understood what you chose'),
    txt(C, 'span', 'br-small', num(done) + ' of ' + num(all) + ' read ' + DOT + ' ' + (Number(u.waiting) > 0 ? mins(u.minutes_left) : 'new ones are read as they arrive') + (Number(u.could_not_read) ? ' ' + DOT + ' ' + num(u.could_not_read) + ' could not be read, each kept with its reason' : '')));
  const pb = C.el('span', 'br-pb'); const f = C.el('i', 'br-ku'); f.style.width = Math.max(2, Math.min(100, all ? done * 100 / all : 0)).toFixed(1) + '%'; pb.appendChild(f); l.appendChild(pb);
  return l;
}
export function busy(R) {
  return (Number(R?.road?.findable?.reading) || 0) > 0 || (Number(R?.road?.understanding?.waiting) || 0) > 0;
}

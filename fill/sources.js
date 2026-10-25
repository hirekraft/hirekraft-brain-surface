// SOURCES: REMOVE ONE, AND WHAT THE TOOL HAS READ (seat sources-basics, 2026-10-23).
// Alex 2026-10-23: "to be able to delete the mailbox and add a new one" and "we still need to make sure the tool
// has ingested everything". Two parts, both drawn by lens.js on the Brain tab, both reading the brain only:
//   removeControl: owner only (the brain's source_remove refuses anyone else; hiding the press is courtesy).
//     Two plain choices. Forgetting says the count first and asks once, then shows the count going down while she
//     watches; if she leaves, the brain finishes it in the background (cron source-forget-drain).
//   drawReadView: one line per source from the brain's sources_read(), which is built from the same readings as the
//     rows on the tab (mailbox_state, drive_state, source_state), so the summary and the rows cannot disagree.
//   readChooser (seat read-approval, 2026-10-24, decision 1012): under that line, for a mailbox whose older mail waits,
//     the owner's choices with their prices: make all of it findable, or have it understand the last 6 months, 18
//     months, 3 years or all. One press each, through the brain's source_read_approve (owner only; it refuses anyone
//     else). Prices come from lens-ask {read_estimate}, which only the owner gets; anyone else sees the line, no choices.
// Dates go through lens.js's fmtWindow, which is fill/dates.js. No regex literals (STANDING-CLAUSES: the write tool).

export function removeControl(sourceKey, name, { sb, el, refreshBrain }) {
  const wrap = el('div', 'remove-src');
  const open = el('button', 'a-fix');
  open.type = 'button';
  open.textContent = 'Remove';
  const box = el('div', 'placeholder');
  box.hidden = true;
  const keep = el('button', 'go ghost');
  keep.type = 'button';
  keep.textContent = 'Stop reading it and keep what was already read';
  const forget = el('button', 'go ghost');
  forget.type = 'button';
  forget.textContent = 'Stop and forget everything read from it';
  const note = el('p', 'quiet');
  box.append(keep, forget, note);
  open.addEventListener('click', (ev) => { ev.stopPropagation(); box.hidden = !box.hidden; });
  const call = (forgetIt, confirm) => sb.rpc('source_remove', { p_source_key: sourceKey, p_forget: forgetIt, p_confirm: confirm });
  const both = (off) => { keep.disabled = off; forget.disabled = off; };

  keep.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    both(true);
    note.className = 'working no-late';
    note.textContent = `Stopping ${name}`;
    try {
      const { data, error } = await call(false, true);
      if (error) throw error;
      note.className = 'quiet';
      note.textContent = data?.note ?? 'It did not happen, and no reason was given.';
      if (data?.ok) await refreshBrain(); else both(false);
    } catch (e) {
      note.className = 'quiet';
      note.textContent = `Could not remove it: ${e?.message ?? e}`;
      both(false);
    }
  });

  let armed = false;
  forget.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    both(true);
    try {
      if (!armed) {
        const { data, error } = await call(true, false);
        if (error) throw error;
        note.className = 'quiet';
        note.textContent = data?.note ?? '';
        both(false);
        if (!data?.ok) return;
        armed = true;
        const n = Number(data.pieces ?? 0);
        forget.textContent = `Yes, forget ${n.toLocaleString('en-US')} ${n === 1 ? 'piece' : 'pieces'}`;
        return;
      }
      note.className = 'working';
      note.textContent = `Forgetting what was read from ${name}`;
      let { data, error } = await call(true, true);
      if (error) throw error;
      if (!data?.ok) { note.className = 'quiet'; note.textContent = data?.note ?? 'It did not happen.'; return; }
      while (data?.ok && !data.done) {
        note.textContent = `Forgetting what was read from ${name}: ${Number(data.left ?? 0).toLocaleString('en-US')} pieces left`;
        ({ data, error } = await sb.rpc('source_forget_step', { p_source_key: sourceKey }));
        if (error) throw error;
      }
      note.className = 'quiet';
      note.textContent = data?.ok
        ? `${name} is removed and what was read from it is forgotten. The originals are untouched.`
        : (data?.note ?? 'It stopped before the end; the rest is removed in the background.');
      await refreshBrain();
    } catch (e) {
      note.className = 'quiet';
      note.textContent = `Could not finish here: ${e?.message ?? e}. What is left is removed in the background.`;
    }
  });
  wrap.append(open, box);
  return wrap;
}

const READ_WORD = {
  up_to_date: ['Up to date', 'green'], still_reading: ['Still reading', 'blue'], cannot_read: ['Cannot read', 'orange'],
};
const KIND_WORD = { mailbox: 'Mailbox', drive: 'Drive', calendar: 'Calendar', contacts: 'Contacts', system: 'System' };

export async function drawReadView(box, { sb, el, escape, badgeLine, fmtWindow, readEstimate, refreshBrain }) {
  if (!box) return;
  let rows;
  try {
    const { data, error } = await sb.rpc('sources_read');
    if (error) throw error;
    rows = data ?? [];
  } catch (e) {
    box.innerHTML = '';
    const p = el('p', 'quiet');
    p.textContent = `What the Tool has read could not be checked just now (${e?.message ?? e}). `
      + 'This is the check failing, not the sources being empty.';
    box.appendChild(p);
    return;
  }
  box.innerHTML = '';
  if (!rows.length) return;
  const n = (st) => rows.filter((r) => r.state === st).length;
  const left = rows.filter((r) => r.state === 'still_reading').reduce((t, r) => t + Number(r.left_n || 0), 0);
  const parts = [`${n('up_to_date')} read up to date`];
  if (n('still_reading')) parts.push(`${n('still_reading')} still reading${left ? ` (${left.toLocaleString('en-US')} items left)` : ''}`);
  if (n('cannot_read')) parts.push(`${n('cannot_read')} cannot be read`);
  const head = el('p', 'reconnect-head');
  head.textContent = `What the Tool has read: ${parts.join(', ')}. `;
  const show = el('button', 'work-add');
  show.type = 'button';
  show.textContent = 'See each source';
  const ul = el('ul', 'members');
  ul.hidden = true;
  const order = { cannot_read: 0, still_reading: 1, up_to_date: 2 };
  const sorted = [...rows].sort((a, b) => ((order[a.state] ?? 3) - (order[b.state] ?? 3))
    || String(a.name).localeCompare(String(b.name)));
  for (const r of sorted) {
    const li = el('li');
    li.appendChild(el('span', 'm-name')).textContent = `${KIND_WORD[r.kind] ?? 'Source'}: ${r.name}`;
    const st = el('div', 'state');
    const when = r.last_read_at ? ` Last read ${fmtWindow(r.last_read_at)}.` : '';
    st.innerHTML = `<span class="dot"></span><span class="s-head">${escape(r.line ?? '')}${escape(when)}</span>`
      + (r.fix ? ` &middot; What fixes it: ${escape(r.fix)}, on its row above.` : '');
    li.appendChild(badgeLine(st, READ_WORD[r.state]));
    ul.appendChild(li);
  }
  show.addEventListener('click', () => { ul.hidden = !ul.hidden; });
  head.appendChild(show);
  box.append(head);
  if (readEstimate) {
    for (const r of rows) {
      // A drive connected from 2026-10-25 waits the same way (seat pace-and-boundary): its older files, by last change.
      if ((r.kind === 'mailbox' || r.kind === 'drive') && r.state === 'still_reading') box.appendChild(readChooser(r.source_key, r.name, { sb, el, readEstimate, refreshBrain }, r.kind));
    }
  }
  box.appendChild(ul);
}

// CHOOSE HOW THE OLDER MAIL IS READ (seat read-approval, 2026-10-24). Nothing older than the connection is read until
// the owner presses one of these. Findable: each message is fingerprinted so it can be found by meaning, no AI reads it.
// Understand: the sorting model reads it as it reads new mail. The balance is checked before the press is offered; the
// AI meter itself still refuses any call once the balance runs out.
const usd = (n) => '$' + (Number(n) < 10 ? Number(n || 0).toFixed(2) : Math.round(Number(n)).toLocaleString('en-US'));
const WINDOWS = [[6, 'the last 6 months'], [18, 'the last 18 months'], [36, 'the last 3 years'], [null, 'all of it']];
// A drive is priced as a whole (its files are counted, not windowed by month), so it offers findable or understand, all of it.
function readChooser(sourceKey, name, { sb, el, readEstimate, refreshBrain }, kind = 'mailbox') {
  const drive = kind === 'drive';
  const older = drive ? 'older files' : 'older mail';
  const windows = drive ? [[null, 'all of it']] : WINDOWS;
  const box = el('div', 'read-choose');
  const note = el('p', 'quiet working no-late');
  note.textContent = `Working out what reading the ${older} of ${name} would cost`;
  box.appendChild(note);
  (async () => {
    const first = await readEstimate({ source_key: sourceKey }).catch(() => null);
    const e0 = first?.ok === true && first.estimate?.ok === true ? first.estimate.sources?.[0] : null;
    const plan = e0?.read_plan;
    // Not the owner, no figure, or nothing waits: no choices here (the line above already says what is read).
    if (!e0 || !plan || e0.state === 'no_count') { box.remove(); return; }
    const runs = await Promise.all(windows.map(([m]) => m === null ? first
      : readEstimate({ source_key: sourceKey, months: m }).catch(() => null)));
    const balance = Number(first.balance?.balance_left_usd ?? first.estimate?.balance?.balance_left_usd);
    const known = Number.isFinite(balance);
    const from = (k) => (plan[k] ? new Date(plan[k] === '-infinity' ? -8.64e15 : plan[k]).getTime() : null);
    const understoodFrom = from('understand_from');
    const findableFrom = from('findable_from');
    const monthsAgo = (m) => (m === null ? -8.64e15 : Date.now() - m * 30.44 * 86400000);
    const choices = [];
    if ((findableFrom === null || findableFrom > -8.64e15) && understoodFrom !== -8.64e15) {
      const p = e0.findable_usd;
      if (p !== null && p !== undefined) choices.push({ mode: 'findable', months: null, price: Number(p),
        label: `Make all of it findable (about ${usd(p)})` });
    }
    windows.forEach(([m, words], i) => {
      if (understoodFrom !== null && understoodFrom <= monthsAgo(m)) return;
      const s = runs[i]?.ok === true && runs[i].estimate?.ok === true ? runs[i].estimate.sources?.[0] : null;
      if (!s || s.first_read_usd === undefined) return;
      choices.push({ mode: 'understand', months: m, price: Number(s.first_read_usd),
        label: `Have it understand ${words} (about ${usd(s.first_read_usd)}, between ${usd(s.first_read_low_usd)} and ${usd(s.first_read_high_usd)})`,
        alt: s.first_read_alt_usd });
    });
    if (!choices.length) { box.remove(); return; }
    note.className = 'quiet';
    note.textContent = `${drive ? 'Older files' : 'Older mail'} of ${name}: choose how the Tool reads ${drive ? 'them' : 'it'}. Findable means you can find any of it by meaning; `
      + (drive ? 'no AI reads it, so it is not sorted or summarized, and a scanned file waits for understanding. Understanding reads the files the way new files are read.'
        : 'no AI reads it, so it is not sorted or summarized and its files are not read. Understanding reads it the way new mail is read.')
      + (known ? ` Your AI balance is ${usd(balance)}.` : '');
    const acts = el('div', 'actions');
    const out = el('p', 'quiet');
    const buttons = [];
    for (const c of choices) {
      const b = el('button', c.mode === 'findable' ? 'go' : 'go ghost');
      b.type = 'button';
      b.style.marginTop = '0';
      b.textContent = c.label;
      const over = known && c.price > balance;
      b.disabled = over;
      if (over) b.title = `More than your AI balance of ${usd(balance)}`;
      b.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        buttons.forEach((x) => { x.disabled = true; });
        out.className = 'working';
        out.textContent = `Starting: ${c.label.split(' (')[0].toLowerCase()}`;
        try {
          const { data, error } = await sb.rpc('source_read_approve', { p_source_key: sourceKey, p_mode: c.mode, p_months: c.months, p_confirm: true });
          if (error) throw error;
          out.className = 'quiet';
          out.textContent = data?.note ?? 'It did not start, and no reason was given.';
          if (data?.ok) await refreshBrain();
          else buttons.forEach((x, i) => { x.disabled = known && choices[i].price > balance; });
        } catch (e) {
          out.className = 'quiet';
          out.textContent = `It did not start: ${e?.message ?? e}`;
          buttons.forEach((x, i) => { x.disabled = known && choices[i].price > balance; });
        }
      });
      buttons.push(b);
      acts.appendChild(b);
    }
    box.append(acts, out);
    const alt = choices.find((c) => c.mode === 'understand' && c.months === null)?.alt;
    const tail = el('p', 'quiet');
    tail.textContent = (alt !== undefined && alt !== null
      ? `A cheaper model would understand all of it for about ${usd(alt)}, but it has not passed the sorting test yet, so it is not offered. ` : '')
      + (choices.some((c) => known && c.price > balance) ? 'A choice that costs more than your balance cannot be pressed until the balance is topped up. ' : '')
      + (drive ? 'New and changed files keep being read as usual whatever you choose.' : 'New mail keeps being read as usual whatever you choose.');
    box.appendChild(tail);
  })();
  return box;
}

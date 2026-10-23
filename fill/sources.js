// SOURCES: REMOVE ONE, AND WHAT THE TOOL HAS READ (seat sources-basics, 2026-10-23).
// Alex 2026-10-23: "to be able to delete the mailbox and add a new one" and "we still need to make sure the tool
// has ingested everything". Two parts, both drawn by lens.js on the Brain tab, both reading the brain only:
//   removeControl: owner only (the brain's source_remove refuses anyone else; hiding the press is courtesy).
//     Two plain choices. Forgetting says the count first and asks once, then shows the count going down while she
//     watches; if she leaves, the brain finishes it in the background (cron source-forget-drain).
//   drawReadView: one line per source from the brain's sources_read(), which is built from the same readings as the
//     rows on the tab (mailbox_state, drive_state, source_state), so the summary and the rows cannot disagree.
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

export async function drawReadView(box, { sb, el, escape, badgeLine, fmtWindow }) {
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
  box.append(head, ul);
}

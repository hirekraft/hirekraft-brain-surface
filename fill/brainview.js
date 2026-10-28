// THE BRAIN AND DRIVES TABS, MADE LEGIBLE (seat brain-and-drives, 2026-10-28, decision 1030). Part of SHOW.
//
// ONE READING, ONE COUNT. Everything here is drawn from the brain's sources_view(), which is built on sources_read() (the
// same rows the first answer and the box count), so the Brain tab, the Drives tab and the first answer cannot give three
// different numbers for the same drives again (Alex's screen on 2026-10-27 showed 12, 10 and 13). Nothing here counts.
//   drawCounts:  What it knows, the three counts under the first answer: Up to date, Reading, Needs you.
//   drawSources: Sources, grouped Email, Drives and folders, Calendar, Contacts, Systems, Loose files. One clean row each:
//                name, what it is and whose, how far back, one of three states; a row menu with Details and Remove;
//                a source that needs the owner shows its one action on the row. Left out by choice is folded away.
//   drawDrives:  Drives, grouped Shared drives and Folders in someone's drive, each with who can open it.
//   drawOrganize: Organize (owner only; the brain refuses anyone else with a reason), from organize_view(). Read only:
//                counts and examples, what fixing would take, and that changing files needs a permission not given.
// The brain's own sentences (a source's line, a finding's line) are shown as the brain wrote them.
// No regex literals and no backslashes (STANDING-CLAUSES).

const WORD = { up_to_date: ['Up to date', 'green'], reading: ['Reading', 'blue'], needs_you: ['Needs you', 'orange'] };
const GROUPS = [['email', 'Email'], ['drives', 'Drives and folders'], ['calendar', 'Calendar'], ['contacts', 'Contacts'],
  ['systems', 'Systems'], ['loose', 'Loose files']];
const MORE = String.fromCharCode(8943);
const num = (n) => Number(n || 0).toLocaleString('en-US');

let pending = null;
// The one reading. Asked once per brain refresh; the three draws share it.
export function readSources(sb, fresh) {
  if (fresh || !pending) {
    pending = sb.rpc('sources_view').then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
    pending.catch(() => { pending = null; });
  }
  return pending;
}

function failed(box, el, what, e) {
  const p = el('p', 'quiet');
  p.textContent = what + ' could not be read just now (' + String(e?.message ?? e) + '). This is the reading failing, not the sources being empty.';
  box.replaceChildren(p);
}

function badge(el, state) {
  const [word, kind] = WORD[state] ?? ['Unknown', 'grey'];
  const b = el('span', 'badge b-' + kind);
  b.textContent = word;
  return b;
}

// WHAT IT KNOWS: the three counts, each a press to the Sources list.
export async function drawCounts(box, { sb, el, reveal }) {
  if (!box) return;
  let v;
  try { v = await readSources(sb); } catch (e) { failed(box, el, 'The counts', e); return; }
  if (!v?.ok) { const p = el('p', 'quiet'); p.textContent = v?.note ?? 'The counts could not be read.'; box.replaceChildren(p); return; }
  const wrap = el('div', 'brain-counts');
  for (const [key, word] of [['up_to_date', 'Up to date'], ['reading', 'Reading'], ['needs_you', 'Needs you']]) {
    const n = Number(v.counts?.[key] ?? 0);
    const b = el('button', 'brain-count' + (key === 'needs_you' && n > 0 ? ' needs' : ''));
    b.type = 'button';
    const big = el('span', 'brain-count-n'); big.textContent = num(n);
    const w = el('span', 'brain-count-w'); w.textContent = word;
    b.append(big, w);
    b.setAttribute('aria-label', num(n) + ' ' + word + ': see each source');
    b.addEventListener('click', () => reveal && reveal('#src-list'));
    wrap.appendChild(b);
  }
  const line = el('p', 'quiet brain-counts-of');
  line.textContent = num(v.counts?.total) + ' sources in all. Each one is on Sources, with what it is and whose.';
  box.replaceChildren(wrap, line);
}

// One row: name; what it is and whose, how far back, who can open it; the state; a menu.
function row(r, d) {
  const { el } = d;
  const li = el('li', 'src-row');
  li.dataset.key = r.source_key;
  li.dataset.state = r.state;
  const main = el('div', 'src-main');
  const name = el('p', 'src-name');
  name.setAttribute('translate', 'no');
  name.textContent = r.name;
  const what = el('p', 'src-what');
  const bits = [r.what];
  if (r.back_to) bits.push('back to ' + r.back_to);
  if (r.can_open?.known) bits.push(num(r.can_open.n) + (r.can_open.n === 1 ? ' person can open it' : ' people can open it'));
  what.textContent = bits.join(' · ');
  main.append(name, what);
  const menuBtn = el('button', 'src-more');
  menuBtn.type = 'button';
  menuBtn.textContent = MORE;
  menuBtn.setAttribute('aria-haspopup', 'menu');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'More about this source');
  const menu = el('div', 'src-menu');
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  const detail = el('div', 'src-detail');
  detail.hidden = true;
  let built = false;
  const openDetail = (withRemove) => {
    if (!built) { built = true; buildDetail(detail, r, d); }
    detail.hidden = false;
    const rm = detail.querySelector('.remove-src');
    if (rm && withRemove) { rm.hidden = false; rm.querySelector('.placeholder')?.removeAttribute('hidden'); rm.scrollIntoView?.({ block: 'nearest' }); }
  };
  const item = (label, fn) => {
    const b = el('button', 'src-item');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.textContent = label;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); fn(); });
    menu.appendChild(b);
  };
  item('Details', () => { if (detail.hidden) openDetail(false); else detail.hidden = true; });
  if (r.group === 'email' && d.openMailbox) item('Open in Mail', () => d.openMailbox(r.source_key));
  if (d.isOwner() && ['email', 'drives', 'calendar', 'contacts'].includes(r.group)) item('Remove', () => openDetail(true));
  menuBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    menu.hidden = !menu.hidden;
    menuBtn.setAttribute('aria-expanded', String(!menu.hidden));
  });
  const head = el('div', 'src-head');
  head.append(main, badge(el, r.state), menuBtn);
  li.append(head, menu);
  // NEEDS YOU carries its one action on the row itself, not behind the menu.
  if (r.state === 'needs_you' && r.action) {
    const act = el('button', 'go src-act');
    act.type = 'button';
    act.textContent = r.action;
    act.addEventListener('click', () => (d.act ? d.act(r, () => openDetail(false)) : openDetail(false)));
    li.appendChild(act);
  }
  li.appendChild(detail);
  return li;
}

function buildDetail(box, r, d) {
  const { el } = d;
  const p = el('p', 'src-line');
  p.textContent = r.line || 'The brain gave no sentence for this source.';
  box.appendChild(p);
  if (r.can_open?.known) {
    const names = (r.can_open.names ?? []).map(String);
    const who = el('p', 'quiet');
    if (names.length) {
      who.appendChild(document.createTextNode('Who can open it: '));
      const sp = el('span');
      sp.setAttribute('translate', 'no');
      sp.textContent = names.join(', ');
      who.append(sp, document.createTextNode('. From the security check of your drives.'));
    } else {
      who.textContent = num(r.can_open.n) + ' people can open it. Their names are shown to the owner.';
    }
    box.appendChild(who);
  } else if (r.place === 'folder') {
    const who = el('p', 'quiet');
    who.textContent = 'Who else can open it: its owner and whoever they shared it with. They are not listed here yet.';
    box.appendChild(who);
  }
  if (d.isOwner() && r.state !== 'up_to_date' && (r.group === 'email' || r.group === 'drives') && d.readChooser) {
    box.appendChild(d.readChooser(r.source_key, r.name, r.group === 'drives' ? 'drive' : 'mailbox'));
  }
  if (d.isOwner() && ['email', 'drives', 'calendar', 'contacts'].includes(r.group) && d.removeControl) {
    const rm = d.removeControl(r.source_key, r.name);
    rm.hidden = true;
    box.appendChild(rm);
  }
}

function leftOut(v, el) {
  const lo = v.left_out ?? [];
  if (!lo.length) return null;
  const det = el('details', 'src-left');
  const sum = el('summary');
  sum.textContent = lo.length === 1 ? '1 left out by choice' : lo.length + ' left out by choice';
  const ul = el('ul', 'src-list');
  for (const x of lo) {
    const li = el('li', 'src-row is-left');
    const n = el('p', 'src-name'); n.setAttribute('translate', 'no'); n.textContent = x.name;
    const w = el('p', 'src-what'); w.textContent = x.what + ' · ' + x.why;
    li.append(n, w);
    ul.appendChild(li);
  }
  det.append(sum, ul);
  return det;
}

// SOURCES: grouped, one clean row each.
export async function drawSources(box, d) {
  const { sb, el } = d;
  if (!box) return;
  let v;
  try { v = await readSources(sb); } catch (e) { failed(box, el, 'Your sources', e); return; }
  if (!v?.ok) { const p = el('p', 'quiet'); p.textContent = v?.note ?? 'Your sources could not be read.'; box.replaceChildren(p); return; }
  const rows = v.rows ?? [];
  const out = [];
  const none = [];
  for (const [key, label] of GROUPS) {
    const mine = rows.filter((r) => r.group === key);
    if (!mine.length) { none.push(label); continue; }
    const h = el('h3', 'src-group');
    const t = el('span'); t.textContent = label;
    const c = el('span', 'src-group-n'); c.textContent = num(mine.length);
    h.append(t, c);
    const ul = el('ul', 'src-list');
    for (const r of mine) ul.appendChild(row(r, d));
    out.push(h, ul);
  }
  if (none.length) {
    const p = el('p', 'quiet src-none');
    p.textContent = 'Nothing connected yet: ' + none.join(', ') + '. Add a source to bring it in.';
    out.push(p);
  }
  const lo = leftOut(v, el);
  if (lo) out.push(lo);
  box.replaceChildren(...out);
  closeMenusOnClick();
}

// A press anywhere else closes an open row menu. Registered once.
let closer = false;
function closeMenusOnClick() {
  if (closer) return;
  closer = true;
  document.addEventListener('click', () => document.querySelectorAll('.src-menu').forEach((m) => {
    if (!m.hidden) { m.hidden = true; m.parentElement?.querySelector('.src-more')?.setAttribute('aria-expanded', 'false'); }
  }));
}

// DRIVES: shared drives, then folders in someone's drive; each with what it is, whose, who can open it, and its state.
export async function drawDrives(box, d) {
  const { sb, el } = d;
  if (!box) return;
  let v;
  try { v = await readSources(sb); } catch (e) { failed(box, el, 'Your drives', e); return; }
  if (!v?.ok) { const p = el('p', 'quiet'); p.textContent = v?.note ?? 'Your drives could not be read.'; box.replaceChildren(p); return; }
  const rows = (v.rows ?? []).filter((r) => r.group === 'drives');
  const out = [];
  const top = el('div', 'drives-top');
  const count = el('p', 'tab-count');
  const up = rows.filter((r) => r.state === 'up_to_date').length;
  const rd = rows.filter((r) => r.state === 'reading').length;
  const nd = rows.filter((r) => r.state === 'needs_you').length;
  count.textContent = [num(rows.length) + (rows.length === 1 ? ' drive or folder' : ' drives and folders'),
    up ? num(up) + ' up to date' : '', rd ? num(rd) + ' reading' : '', nd ? num(nd) + ' need you' : ''].filter(Boolean).join(' · ');
  top.appendChild(count);
  if (d.choose) {
    const ch = el('button', 'go ghost');
    ch.type = 'button';
    ch.textContent = 'Choose what comes in';
    ch.addEventListener('click', () => d.choose());
    top.appendChild(ch);
  }
  out.push(top);
  for (const [place, label, lede] of [['shared', 'Shared drives', 'Owned by the company. People stay members when someone leaves.'],
    ['folder', "Folders in someone's drive", "A folder in one person's own My Drive. It belongs to that person's account."]]) {
    const mine = rows.filter((r) => r.place === place);
    if (!mine.length) continue;
    const h = el('h3', 'src-group');
    const t = el('span'); t.textContent = label;
    const c = el('span', 'src-group-n'); c.textContent = num(mine.length);
    h.append(t, c);
    const p = el('p', 'quiet src-lede'); p.textContent = lede;
    const ul = el('ul', 'src-list');
    for (const r of mine) ul.appendChild(row(r, d));
    out.push(h, p, ul);
  }
  if (!rows.length) { const p = el('p', 'quiet'); p.textContent = 'No drive is chosen yet. Choose what comes in to start.'; out.push(p); }
  const lo = leftOut(v, el);
  if (lo) out.push(lo);
  box.replaceChildren(...out);
  closeMenusOnClick();
}

// ORGANIZE: what the Tool already knows, read only. Owner only; anyone else gets the brain's own reason.
export async function drawOrganize(box, { sb, el }) {
  if (!box) return;
  box.setAttribute('aria-busy', 'true');
  const wait = el('p', 'working no-late');
  wait.textContent = 'Looking at what the Tool already knows about your drives';
  box.replaceChildren(wait);
  let o;
  try {
    const { data, error } = await sb.rpc('organize_view');
    if (error) throw error;
    o = data;
  } catch (e) { box.removeAttribute('aria-busy'); failed(box, el, 'Organize', e); return; }
  box.removeAttribute('aria-busy');
  if (!o?.ok) { const p = el('p', 'quiet'); p.textContent = o?.note ?? 'Organize could not be shown.'; box.replaceChildren(p); return; }
  const out = [];
  const lede = el('p', 'org-lede');
  lede.textContent = 'What the Tool already knows about how your drives are kept. It shows; it changes nothing.';
  const perm = el('p', 'quiet org-perm');
  perm.textContent = o.permission ?? '';
  out.push(lede, perm);
  const ul = el('ul', 'org-list');
  for (const f of o.findings ?? []) {
    const li = el('li', 'org-item' + (f.state === 'counted' ? '' : ' is-open'));
    li.dataset.key = f.key;
    const head = el('div', 'org-head');
    const t = el('p', 'org-title'); t.textContent = f.title;
    head.appendChild(t);
    if (f.state === 'counted') { const n = el('span', 'org-n'); n.textContent = num(f.n); head.appendChild(n); }
    else { const b = el('span', 'badge b-grey'); b.textContent = 'Not counted yet'; head.appendChild(b); }
    const line = el('p', 'org-line'); line.textContent = f.line ?? '';
    li.append(head, line);
    const ex = f.examples ?? [];
    if (ex.length) {
      const p = el('p', 'quiet org-ex-h'); p.textContent = 'For example:';
      const exl = el('ul', 'org-ex');
      exl.setAttribute('translate', 'no');
      for (const x of ex) {
        const e = el('li');
        e.textContent = typeof x === 'string' ? x : (x.current + (x.versions ? ' (' + x.versions + ' versions, this one current)' : ''));
        exl.appendChild(e);
      }
      li.append(p, exl);
    }
    if (f.fix) { const p = el('p', 'org-fix'); p.append(el('b')); p.firstChild.textContent = 'What fixing it would take: '; p.append(f.fix); li.appendChild(p); }
    if (f.needs) { const p = el('p', 'org-fix'); p.append(el('b')); p.firstChild.textContent = 'What counting it needs: '; p.append(f.needs); li.appendChild(p); }
    if (f.finding_cost) { const p = el('p', 'quiet org-cost'); p.textContent = f.finding_cost; li.appendChild(p); }
    ul.appendChild(li);
  }
  out.push(ul);
  box.replaceChildren(...out);
}

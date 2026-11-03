// fill/contacts.js - PEOPLE (seat tool-build-people, 2026-11-03; decisions 1061, 1065, 1067; design whole-tool-design-3,
// snapshot 2e2adc7e, build step 5). Part of SHOW. A framed place: drawn only with fill/frame.js blocks.
//
// Who she works with, on one page: the people she meets this week (her own calendar), and for an owner the clients she bills
// and the contractors working for her, then her team, then one box to look anyone up. All of it is one brain reading,
// people_place (read as her: the calendar is only hers, clients and contractors only for an owner, contractors by name and
// whether they are working, never a rate). Each row looks that person or company up on the contact card (fill/contact-card.js,
// the card the Contacts tab drew: one card, one finder). A part that could not be read says why, never empty or zero.
//
// SUPERSEDED 2026-11-03: the Contacts tab (seat contacts, 2026-10-13), a lookup with nothing on it until she typed. Its card
// moved to fill/contact-card.js unchanged; the key stays 'contacts' so links and remembered tabs open People.
// No regex literals and no backslashes (STANDING-CLAUSES).
import { h, card, list, row, link, button, say, working, words, behind } from './frame.js?v=2026-11-03-tool-build-1b';

const READY_OWNER = ['Who do we know at a company?', 'Prep me for my next call', 'Which clients have not written lately?'];
const READY = ['Who do we know at a company?', 'Prep me for my next call'];

let out = null;

export function mount(el, ctx) {
  el.textContent = '';
  const root = h('div', 'vf vf-place');
  root.dataset.place = 'contacts';
  el.appendChild(root);
  const owner = !!ctx.who?.all_access;
  const loc = ctx.lang === 'de' ? 'de-DE' : 'en-US';
  const tz = ctx.tz || 'UTC';

  const ask = h('div', 'vf-ask');
  for (const q of owner ? READY_OWNER : READY) { const b = h('button', 'vf-chip', q); b.type = 'button'; b.addEventListener('click', () => ctx.ask(q)); ask.appendChild(b); }
  root.appendChild(ask);

  const grid = h('div', 'vf-grid');
  root.appendChild(grid);
  const week = card('Meeting this week'); week.el.appendChild(working('Reading your calendar.')); grid.appendChild(week.el);
  let clients = null, ctr = null;
  if (owner) { clients = card('Clients'); clients.el.appendChild(working('Reading your books.')); grid.appendChild(clients.el); }
  const grid2 = h('div', 'vf-grid');
  root.appendChild(grid2);
  if (owner) { ctr = card('Contractors'); ctr.el.appendChild(working('Reading who works for you.')); grid2.appendChild(ctr.el); }
  const team = card('Your team'); team.el.appendChild(working('Reading your team.')); grid2.appendChild(team.el);

  // Look anyone up: the one finder, drawing the contact card below the framed blocks.
  const find = card('Look up anyone');
  const form = h('form', 'vf-find');
  const input = h('input', 'vf-input'); input.type = 'search'; input.autocomplete = 'off';
  input.placeholder = 'A name, an email address or a company'; input.setAttribute('aria-label', 'Look up a person or company');
  form.append(input, button('Find'));
  form.querySelector('button').type = 'submit';
  find.el.append(form);
  root.appendChild(find.el);
  out = h('div', 'vf-lookup'); out.setAttribute('aria-live', 'polite');
  el.appendChild(out);
  const look = (q) => {
    const text = String(q ?? '').trim(); if (!text) return;
    input.value = text;
    if (!ctx.card) { out.textContent = ''; out.appendChild(say('Looking someone up is not available on this screen.', true)); return; }
    import('./contact-card.js?v=2026-11-03-tool-build-people').then((C) => { C.lookUp(out, ctx.card, text); out.scrollIntoView({ block: 'start', behavior: 'smooth' }); })
      .catch((e) => { out.textContent = ''; out.appendChild(say('The card could not be opened. ' + String(e?.message ?? e), true)); });
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); look(input.value); });
  if (ctx.card) import('./contact-card.js?v=2026-11-03-tool-build-people').then((C) => { const last = C.lastLookUp(); if (last) { input.value = last; C.lookUp(out, ctx.card, last); } }).catch(() => { /* the finder still works on a press */ });

  const rpc = async (fn, args) => { try { const { data, error } = await ctx.sb.rpc(fn, args ?? {}); return error ? { ok: false, note: error.message } : data; } catch (e) { return { ok: false, note: String(e?.message ?? e) }; } };
  rpc('people_place', { p_tz: tz }).then((d) => {
    const fail = !d || d.ok === false;
    for (const c of [week, clients, ctr, team]) if (c) clear(c);
    if (fail) { for (const c of [week, clients, ctr, team]) if (c) c.el.appendChild(say(reason(d, 'This could not be read'), true)); return; }
    drawWeek(week, d, loc, tz, look);
    if (clients) drawClients(clients, d, loc, look);
    if (ctr) drawContractors(ctr, d, look);
    drawTeam(team, d);
  });
  return root;
}

function clear(c) { while (c.el.childNodes.length > 1) c.el.removeChild(c.el.lastChild); }
const reason = (d, what) => { const r = String(d?.note ?? d?.reason ?? 'No answer came back.'); return what + '. ' + r + (r.endsWith('.') ? '' : '.'); };
const lookLink = (name, look) => link('Look up', () => look(name));

function drawWeek(c, d, loc, tz, look) {
  if (d.week_read === false) { c.el.appendChild(say(reason({ note: d.week_note }, 'Your calendar could not be read'), true)); return; }
  const rows = d.week ?? [];
  if (!rows.length) { c.el.appendChild(say('No one from outside your team is on your calendar this week.')); return; }
  c.side.hidden = false; c.side.textContent = rows.length === 1 ? '1 person' : rows.length + ' people';
  const l = list();
  for (const r of rows.slice(0, 5)) {
    let when = '';
    try { when = new Intl.DateTimeFormat(loc, { weekday: 'short', month: 'short', day: 'numeric', timeZone: r.all_day ? 'UTC' : tz }).format(new Date(r.start)); } catch (_) { when = String(r.start ?? '').slice(0, 10); }
    const rw = row({ title: words(r.who, 8), line: when + ' · ' + words(r.title || 'Meeting', 8), right: lookLink(r.who, look), nameTitle: true });
    const s2 = rw.querySelector('.vf-row-s'); if (s2) { s2.setAttribute('translate', 'no'); s2.dataset.name = ''; }
    l.appendChild(rw);
  }
  c.el.appendChild(l);
  if (rows.length > 5) c.el.appendChild(say((rows.length - 5) + ' more on your calendar.'));
}

function drawClients(c, d, loc, look) {
  if (!d.books) { c.el.appendChild(say('Your books are not connected, so your clients are not shown.', true)); return; }
  const rows = d.clients ?? [];
  if (!rows.length) { c.el.appendChild(say('No invoices in your books in the last year.')); return; }
  c.side.hidden = false; c.side.textContent = rows.length === 1 ? '1 client' : rows.length + ' clients';
  const money = (n) => { const x = Math.round(Number(n ?? 0)); return loc === 'de-DE' ? x.toLocaleString('de-DE') + ' $' : '$' + x.toLocaleString('en-US'); };
  const l = list();
  for (const r of rows.slice(0, 5)) {
    const open = Number(r.open ?? 0);
    const line = open ? open + (open === 1 ? ' open invoice, ' : ' open invoices, ') + money(r.owed) + ' in your books' : 'Nothing open';
    l.appendChild(row({ title: words(r.name, 8), line, right: lookLink(r.name, look), nameTitle: true }));
  }
  c.el.appendChild(l);
  if (rows.length > 5) c.el.appendChild(say((rows.length - 5) + ' more in your books.'));
}

function drawContractors(c, d, look) {
  const rows = d.contractors ?? [];
  if (!rows.length) { c.el.appendChild(say('No one is working for you on contract.')); return; }
  const now = rows.filter((r) => r.state === 'working').length;
  c.side.hidden = false; c.side.textContent = now + ' working';
  const l = list();
  for (const r of rows.slice(0, 5)) l.appendChild(row({ title: words(r.name, 8), line: r.state === 'starting' ? 'Starting soon' : 'Working now', right: lookLink(r.name, look), nameTitle: true }));
  c.el.appendChild(l);
  if (rows.length > 5) {
    const b = behind('Show all ' + rows.length);
    const l2 = list();
    for (const r of rows.slice(5)) l2.appendChild(row({ title: words(r.name, 8), line: r.state === 'starting' ? 'Starting soon' : 'Working now', right: lookLink(r.name, look), nameTitle: true }));
    b.appendChild(l2); c.el.appendChild(b);
  }
}

function drawTeam(c, d) {
  const rows = d.team ?? [];
  if (!rows.length) { c.el.appendChild(say('No one is set up in your team yet.')); return; }
  const signed = rows.filter((r) => r.signed_in).length;
  c.side.hidden = false; c.side.textContent = signed + ' signed in';
  const one = (r) => row({ title: words(r.name, 8), line: r.me ? 'You' : r.signed_in ? words(r.role || 'In your team', 8) : 'Has not signed in yet', nameTitle: true });
  const l = list();
  for (const r of rows.slice(0, 5)) l.appendChild(one(r));
  c.el.appendChild(l);
  if (rows.length > 5) {
    const b = behind('Show all ' + rows.length);
    const l2 = list();
    for (const r of rows.slice(5)) l2.appendChild(one(r));
    b.appendChild(l2); c.el.appendChild(b);
  }
}

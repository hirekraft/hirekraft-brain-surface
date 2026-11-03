// fill/orders.js - ORDERS (seat tool-build-orders, 2026-11-03; decisions 1056, 1061, 1065, 1067, 1069; design
// whole-tool-design-3, snapshot 2e2adc7e, build order step 5; bench-match-2, snapshot 2f070744). Part of SHOW.
//
// One list of the work coming in: the client's own orders first (work_orders: every order opened from an email that she
// may open, in the business's own word, HireKraft: requirement), then, where the business has Bench, the openings other
// companies are hiring for (orders_openings: job alerts and the web search, the same door as Signals). Each carries its
// match: who of ours has every skill, the first three behind one press, each with the line their resume meets. The match
// is the brain's (bench_shortlist for an order, bench_fit_show for an opening); nothing is matched here. A print shop
// sees its orders and no openings: the openings and the match are Bench's (bench_here), the list is the Tool's.
// The orders come back at once and are drawn first; the openings take about 6 seconds and fill in under their own working
// line. A reading that did not come back says so with the reason, never an empty list or a zero (rule 7). A record marked
// test is greyed, carries the Test pill and is never counted (rule 8).
// Drawn only with fill/frame.js blocks. No regex literals and no backslashes (STANDING-CLAUSES).
import { h, nameSpan, card, list, row, pill, link, say, working, pair, behind, words } from './frame.js?v=2026-11-03-tool-build-1b';

const SHOW = 5;

export function mount(el, ctx) {
  el.textContent = '';
  const root = h('div', 'vf vf-place');
  root.dataset.place = 'orders';
  el.appendChild(root);
  const loc = ctx.lang === 'de' ? 'de-DE' : 'en-US';
  const rpc = async (fn, args) => { try { const { data, error } = await ctx.sb.rpc(fn, args ?? {}); return error ? { ok: false, note: error.message } : data; } catch (e) { return { ok: false, note: String(e?.message ?? e) }; } };

  const ask = h('div', 'vf-ask');
  root.appendChild(ask);
  const c = card('Orders', '');
  c.side.hidden = true;
  const nums = h('div'); const lst = list(); const more = h('div'); const notes = h('div');
  const wait = working('Reading your orders.');
  c.el.append(wait, nums, lst, more, notes);
  root.appendChild(c.el);

  const S = { word: 'order', orders: null, openings: null, bench: false, expanded: false, ordersFailed: null, openingsFailed: null };
  const draw = () => drawList(c, nums, lst, more, notes, S, ctx, loc);

  const benchQ = rpc('bench_here');
  rpc('work_orders', { p_company: null, p_all: false }).then((d) => {
    wait.remove();
    if (!d || d.ok === false) { S.ordersFailed = reason(d, 'Your orders could not be read'); }
    else { S.word = plainWord(d.word); S.orders = d; }
    drawAsk(ask, S, ctx);
    draw();
    benchQ.then((b) => {
      // Bench's answer: true, false (a business without Bench: orders only), or no answer (said, never taken as no)
      if (b !== true && b !== false) { S.openingsFailed = reason(b, 'The openings could not be read'); draw(); return; }
      S.bench = b;
      if (!b) { draw(); return; }
      draw();
      for (const it of S.orders?.orders ?? []) {
        if (it.test || !it.wo_id) continue;
        it.match = { working: true };
        rpc('bench_shortlist', { p_wo: it.wo_id, p_all: false }).then((r) => { it.match = r ?? { ok: false }; draw(); });
      }
      S.openings = { working: true };
      draw();
      rpc('orders_openings', { p_days: 30, p_limit: 40 }).then((r) => {
        if (!r || r.ok === false) { S.openings = null; S.openingsFailed = reason(r, 'The openings could not be read'); }
        else if (r.present === false) { S.openings = null; S.bench = false; }
        else S.openings = r;
        drawAsk(ask, S, ctx);
        draw();
      });
    });
  });
  return root;
}

const reason = (d, what) => { const r = String(d?.note ?? d?.reason ?? 'No answer came back.'); return what + '. ' + r + (r.endsWith('.') ? '' : '.'); };
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const many = (w) => (String(w).endsWith('s') ? String(w) : w + 's');
// The business's own word (HireKraft: requirement). The product's general name is never shown: a plain Order instead.
const plainWord = (w) => { const x = String(w || '').trim().toLowerCase(); return !x || x === 'work order' ? 'order' : x; };
const num = (n, loc) => Number(n ?? 0).toLocaleString(loc);

function drawAsk(ask, S, ctx) {
  ask.textContent = '';
  const qs = ['Who do we have for the newest ' + S.word + '?', 'Which ' + many(S.word) + ' are still open?'];
  if (S.bench) qs.push('Which companies are hiring this week?');
  for (const q of qs) { const b = h('button', 'vf-chip', q); b.type = 'button'; b.addEventListener('click', () => ctx.ask(q)); ask.appendChild(b); }
}

// one row per order or opening, the match behind one press under it
function drawList(c, nums, lst, more, notes, S, ctx, loc) {
  nums.textContent = ''; lst.textContent = ''; more.textContent = ''; notes.textContent = '';
  c.head.textContent = S.bench ? cap(many(S.word)) + ' and openings' : cap(many(S.word));
  const orders = S.orders?.orders ?? [];
  const realOrders = orders.filter((it) => !it.test);
  const openings = S.openings?.openings ?? [];
  const realOpen = openings.filter((it) => !it.test);
  if (S.orders) { c.side.hidden = false; c.side.textContent = realOrders.length + ' open'; } else c.side.hidden = true;

  if (S.orders && S.bench && S.openings && !S.openings.working) {
    nums.appendChild(pair(
      { label: 'Open ' + many(S.word), num: num(realOrders.length, loc), line: 'Opened from your mail' },
      { label: 'Openings we could fill', num: num(S.openings.with_fit, loc), line: 'Of ' + num(S.openings.total, loc) + ' in the last ' + (S.openings.days ?? 30) + ' days' }));
  }

  const rows = [];
  for (const it of orders) rows.push(['order', it]);
  for (const it of openings) rows.push(['opening', it]);
  let firstOpen = true;
  rows.forEach(([kind, it], i) => {
    if (i >= SHOW && !S.expanded) return;
    const at = kind === 'order' ? it.opened_at : it.at;
    let when = '';
    try { when = new Intl.DateTimeFormat(loc, { month: 'short', day: 'numeric' }).format(new Date(at)); } catch (_) { when = ''; }
    if (kind === 'order') {
      const what = String(it.what ?? '').split(': ').slice(1).join(': ') || it.subject || '';
      const m = it.match;
      const fit = !S.bench || it.test ? '' : !m || m.working ? 'Looking for who we have' : m.ok === false ? 'Who we have could not be read' : m.present === false ? '' : every(m.all_lines ?? m.count, loc);
      const line = [words(it.org, 4), when ? 'since ' + when : '', it.state && it.state !== 'open' ? it.state_words : '', fit].filter(Boolean).join(' · ');
      const right = pill('act', cap(S.word));
      let open = null;
      if (S.bench && !it.test && m && m.ok !== false && !m.working && m.present !== false) {
        const d = behind('Who we have');
        drawPeople(d, m.rows ?? [], m.held_back);
        d.appendChild(link('Open in Mail', () => ctx.go('email')));
        open = d;
        // the newest order's match is open on top, not behind a press (Alex 13:11 PT Nov 2: "the job requirements coming in and then the match")
        if (firstOpen) { d.open = true; firstOpen = false; }
      }
      lst.appendChild(row({ title: words(what || it.org || '', 8), line, right, test: !!it.test, nameTitle: true }));
      if (open) lst.appendChild(open);
    } else {
      const f = it.fit;
      const fit = !f ? '' : f.state === 'ready' ? every(f.every ?? f.count, loc) : f.state === 'held' ? 'resumes not open to you' : f.state === 'failed' ? 'who fits could not be worked out' : 'who fits is being worked out';
      const line = [words(it.company, 4), when, fit].filter(Boolean).join(' · ');
      const r = row({ title: words(it.title, 8), line, right: pill('plain', 'Opening'), test: !!it.test, nameTitle: true });
      lst.appendChild(r);
      if (!it.test && f && (f.best ?? []).length) {
        const d = behind('Who of ours fits');
        drawPeople(d, f.best, 0);
        if (f.skills) { const s = say('Skills looked for: '); s.appendChild(nameSpan(f.skills + '.')); d.appendChild(s); }
        if (it.link) d.appendChild(link('See the opening', () => window.open(it.link, '_blank', 'noopener')));
        lst.appendChild(d);
      }
    }
  });
  if (rows.length > SHOW && !S.expanded) more.appendChild(link('Show all ' + rows.filter(([, it]) => !it.test).length, () => { S.expanded = true; drawList(c, nums, lst, more, notes, S, ctx, loc); }));

  if (S.ordersFailed) notes.appendChild(say(S.ordersFailed, true));
  else if (S.orders && !realOrders.length) notes.appendChild(say('No ' + S.word + ' is open right now.'));
  if (S.orders && Number(S.orders.held_back ?? 0) > 0) { const n = Number(S.orders.held_back); notes.appendChild(say(n + (n === 1 ? ' more rests' : ' more rest') + ' on mail you may not open.')); }
  if (S.bench && S.openings && S.openings.working) notes.appendChild(working('Reading the openings other companies are hiring for.'));
  if (S.openingsFailed) notes.appendChild(say(S.openingsFailed, true));
  else if (S.bench && S.openings && !S.openings.working && !realOpen.length) notes.appendChild(say('No openings came in over the last ' + (S.openings.days ?? 30) + ' days.'));
  if (S.orders || S.openings) {
    const d = behind('What is listed here');
    d.appendChild(say('Listed: every ' + S.word + ' still open that was opened from an email. New enquiries wait in Mail, under For you, until they are opened.'));
    if (S.openings?.said) d.appendChild(say(S.openings.said));
    d.appendChild(link('Open For you in Mail', () => ctx.go('email')));
    notes.appendChild(d);
  }
}

// short enough for a row line (12 words with the company and the date): who of ours has every skill
function every(n, loc) { const x = Number(n ?? 0); return x === 0 ? 'none with every skill' : num(x, loc) + ' with every skill'; }

function drawPeople(d, people, held) {
  const l = list();
  for (const p of people.slice(0, 3)) {
    const w = (Array.isArray(p.why) ? p.why[0] : p.why) || null;
    const said = w ? (w.line || '') + (w.quote ? ': ' + words(w.quote, 10) : '') : '';
    const met = p.met && p.of ? (p.met === p.of ? 'Every skill' : p.met + ' of ' + p.of) : '';
    const r = row({ title: words(p.name || 'Name not kept', 8), line: '', right: met ? pill(p.met === p.of ? 'good' : 'plain', met) : null, nameTitle: true });
    if (said) { const s = nameSpan(words(said, 12), 'vf-row-s'); r.firstChild.appendChild(s); }
    l.appendChild(r);
  }
  if (people.length) d.appendChild(l);
  else d.appendChild(say('No one of ours has these skills yet.'));
  const n = Number(held ?? 0);
  if (n > 0) d.appendChild(say(n + (n === 1 ? ' more is' : ' more are') + ' in resumes you may not open.'));
}

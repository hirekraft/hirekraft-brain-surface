// fill/work.js - THE WORK TAB'S OWN PAGES (seat work-tab, 2026-11-05; decisions 950, 995, 1056, 1096, 1098, 1099, 1103).
// Part of SHOW. The approved picture (briefs/mockups/work-tab.html, artifact 1X16psoZYzM1MfVWX5ifwr): a quiet sidebar
// (+ New conversation, Search, Projects, Open work with its count, then Pinned and Recents), the conversation in the middle
// with its box at the bottom. This file draws the pieces that are Work's own: the Open work page, an order's folded
// Order details line on top of its conversation, the greeting with three questions, and a draft written inside an order.
// THE CONVERSATION ITSELF IS NOT DRAWN HERE: lens.js keeps the one renderer (renderAsk), the one ask() and the one panel.
//
// OPEN WORK is anything that needs closing (1099). TODAY IT HOLDS ORDERS, read from the brain's one list (work_orders, the
// same door as Mail: work_order_may over the email's pieces), in the business's own word (settings work_order_word;
// HireKraft: requirement). Items added by hand and items an agent prepares for her yes are NOT shown: neither has a back
// end yet (decision 1075: nothing on screen without one). The states are the brain's words (work_order_state_words,
// decision 1098: New, In progress, Being delivered, Done, Closed); a state is changed only by work_order_set, which keeps
// who and when. Done and Closed are listed apart under Show closed, because closed without a fill is not the same as done.
//
// OUTPUTS and SCHEDULED, in the picture, are left out of the sidebar on purpose (seat work-tab, 2026-11-05): outputs are
// made in her browser and not kept anywhere (fill/outputs.js), so there is nothing true to list yet; agents have no engine
// in the brain yet (seat agents-tab is building it). Each comes back when its back end exists.
// No regex literals and no backslashes in this file (STANDING-CLAUSES).
import { drawBench } from './bench.js?v=2026-11-02-mail-clean';   // Bench (staffing): Who we have, on top of an order, only where the business has it

let C = null;            // { sb, el, $, fmtDate, openEmail, openOrder, ask }
let shownClosed = false; // Show closed pressed
let lastList = null;     // the last work_orders reply, open or all

const OPEN_STATES = ['open', 'in_progress', 'delivered'];
const NL = String.fromCharCode(10);

function mk(tag, cls, text) { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; }
function cap(w) { const x = String(w || ''); return x.charAt(0).toUpperCase() + x.slice(1); }
function plain(w) { return String(w || '').split('_').join(' '); }

export function initWorkTab(ctx) { C = ctx; }

// The brain's word for an order here (HireKraft: requirement), from the last list read; 'order' until one is read.
export function orderWord() { return (lastList && lastList.word) || 'order'; }

async function readOrders(all) {
  try {
    const { data, error } = await C.sb.rpc('work_orders', { p_company: null, p_all: !!all });
    if (error) return { ok: false, reason: error.message };
    return data || { ok: false, reason: 'no answer was given' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

// The count beside Open work: orders still open (New, In progress, Being delivered). Never a guess: when the list could
// not be read, the count is a dash and the page says why.
export async function countOpenWork() {
  const r = await readOrders(false);
  const c = C.$('#work-open-count');
  if (r && r.ok) { lastList = shownClosed ? lastList : r; if (c) c.textContent = String(r.count || 0); }
  else if (c) c.textContent = '-';
  return r;
}

// THE OPEN WORK PAGE. One row per order: what it is (the brain's line, in her word), its kind and where it came from,
// and its state. A press opens it as its conversation. Show closed reads every order, and lists Done and Closed apart.
export async function drawOpenWork(host) {
  host.innerHTML = '';
  host.appendChild(mk('h1', 'work-h1', 'Open work'));
  host.appendChild(mk('p', 'work-sub', 'Everything that still needs closing.'));
  const said = mk('p', 'quiet working', 'Reading your open work.');
  host.appendChild(said);
  const r = await readOrders(shownClosed);
  said.remove();
  if (!r || r.ok !== true) {
    host.appendChild(mk('p', 'state stalled', 'Your open work could not be read: ' + plain((r && (r.reason || r.note)) || 'no reason was given') + '. Nothing was changed.'));
    return;
  }
  lastList = r;
  const word = r.word || 'order';
  const orders = Array.isArray(r.orders) ? r.orders : [];
  const open = orders.filter((o) => OPEN_STATES.includes(o.state));
  const c = C.$('#work-open-count'); if (c) c.textContent = String(open.length);
  const list = mk('div', 'work-rows');
  for (const o of open) list.appendChild(orderRow(o, word));
  if (!open.length) list.appendChild(mk('p', 'quiet work-none', 'Nothing open. When a client sends work, open it from the email in Mail and it comes here.'));
  host.appendChild(list);
  if (shownClosed) {
    const done = orders.filter((o) => o.state === 'done'), closed = orders.filter((o) => o.state === 'closed');
    if (done.length) { host.appendChild(mk('h2', 'work-h2', 'Done')); const l = mk('div', 'work-rows'); for (const o of done) l.appendChild(orderRow(o, word)); host.appendChild(l); }
    if (closed.length) { host.appendChild(mk('h2', 'work-h2', 'Closed without being done')); const l = mk('div', 'work-rows'); for (const o of closed) l.appendChild(orderRow(o, word)); host.appendChild(l); }
    if (!done.length && !closed.length) host.appendChild(mk('p', 'quiet work-none', 'Nothing done or closed yet.'));
  }
  if (r.held_back > 0) host.appendChild(mk('p', 'quiet', r.held_back + ' more rest on mail you may not open.'));
  const acts = mk('div', 'work-acts');
  const sc = mk('button', 'go ghost', shownClosed ? 'Hide closed' : 'Show closed'); sc.type = 'button';
  sc.addEventListener('click', () => { shownClosed = !shownClosed; drawOpenWork(host); });
  acts.appendChild(sc);
  host.appendChild(acts);
  host.appendChild(mk('p', 'quiet work-said', 'Listed: every ' + word + ' opened from an email that you may open. An email becomes one when you press Open as ' + cap(word) + ' on it in Mail.'));
}

function orderRow(o, word) {
  const b = mk('button', 'work-row'); b.type = 'button';
  const left = mk('span', 'work-row-main');
  const t = mk('b', null, o.what || cap(word)); t.translate = false;
  const from = o.last_out ? 'from email, ' + C.fmtDate(o.last_out, 'short') : 'from email';
  left.append(t, mk('small', null, cap(word) + ' · ' + from));
  b.append(left, mk('span', 'work-row-state', o.state_words || ''));
  b.addEventListener('click', () => C.openOrder(o));
  return b;
}

// An order by its id, from the last list or read again (a kept conversation reopened from Recents names only the id).
export async function findOrder(id) {
  const has = lastList && Array.isArray(lastList.orders) && lastList.orders.find((o) => o.wo_id === id);
  if (has) return has;
  const r = await readOrders(true);
  if (r && r.ok) { const o = (r.orders || []).find((x) => x.wo_id === id); if (o) return o; }
  return null;
}

// THE FOLDED ORDER DETAILS LINE on top of an order's conversation (the picture's o2): the summary says the state and for
// whom; open, what they asked, the contract terms where read, the email with Open in Mail, and the status with its change.
// Under it, for a business with Bench, Who we have (bench.js, the same part Mail's order card used; seat work-tab moved it
// here with the orders, so the shortlist is where the order is).
export function orderTop(o, onChanged) {
  const wrap = mk('div', 'work-order-wrap');
  wrap.appendChild(orderDetails(o, onChanged));
  const bench = mk('div', 'work-order-bench');
  wrap.appendChild(bench);
  drawBench(bench, mk('div', null), o, { sb: C.sb, mk, plainWords: C.plainWords || plain });
  return wrap;
}
function orderDetails(o, onChanged) {
  const word = (lastList && lastList.word) || o.word || 'order';
  const d = mk('details', 'work-order');
  const s = mk('summary', null, '');
  s.appendChild(mk('span', null, cap(word) + ' details'));
  const sub = mk('span', 'work-order-s', [o.state_words, o.for_whom].filter(Boolean).join(' · ')); sub.translate = false;
  s.appendChild(sub);
  d.appendChild(s);
  const dl = mk('dl', 'work-order-facts');
  const fact = (k, v, keep) => { if (!v) return null; dl.appendChild(mk('dt', null, k)); const dd = mk('dd', null, String(v)); if (!keep) dd.translate = false; dl.appendChild(dd); return dd; };
  fact('What they asked', o.what);
  fact('For', o.for_whom); fact('Their client', o.end_client);
  fact('Contact', [o.contact_name, o.contact_email].filter(Boolean).join(', '));
  fact('Wanted by', o.by_when); fact('Contract', o.terms);
  if (o.open_source && o.open_id) {
    dl.appendChild(mk('dt', null, 'Email'));
    const dd = mk('dd', null, '');
    dd.appendChild(mk('span', null, o.last_out ? C.fmtDate(o.last_out, 'short') + ' ' : ''));
    const om = mk('button', 'work-link', 'Open in Mail'); om.type = 'button';
    om.addEventListener('click', () => C.openEmail(o.open_source, o.open_id));
    dd.appendChild(om); dl.appendChild(dd);
  }
  dl.appendChild(mk('dt', null, 'Status'));
  const st = mk('dd', 'work-order-status', '');
  st.appendChild(mk('span', null, o.state_words || ''));
  const out = mk('p', 'quiet work-order-out', ''); out.setAttribute('aria-live', 'polite');
  const next = { open: [['in_progress', 'In progress'], ['delivered', 'Being delivered'], ['done', 'Done']],
    in_progress: [['delivered', 'Being delivered'], ['done', 'Done'], ['open', 'Back to new']],
    delivered: [['done', 'Done'], ['in_progress', 'Back to in progress']],
    done: [['in_progress', 'Open again']], closed: [['open', 'Open again']] }[o.state] || [];
  const ch = mk('button', 'work-link', 'Change'); ch.type = 'button';
  ch.addEventListener('click', () => {
    if (st.querySelector('.work-order-states')) return;
    const row = mk('div', 'work-order-states');
    for (const [code, label] of next) {
      const b = mk('button', 'go ghost', label); b.type = 'button';
      b.addEventListener('click', () => setState(o, code, null, b, out, onChanged));
      row.appendChild(b);
    }
    if (OPEN_STATES.includes(o.state)) {
      const cl = mk('button', 'go ghost', 'Close'); cl.type = 'button';
      cl.addEventListener('click', () => {
        if (row.querySelector('input')) return;
        const inp = mk('input', null); inp.type = 'text'; inp.placeholder = 'Why is it closed?'; inp.setAttribute('aria-label', 'Why is it closed?');
        const ok = mk('button', 'go', 'Close it'); ok.type = 'button';
        ok.addEventListener('click', () => setState(o, 'closed', inp.value, ok, out, onChanged));
        row.append(inp, ok); inp.focus();
      });
      row.appendChild(cl);
    }
    st.appendChild(row);
  });
  st.appendChild(ch);
  dl.appendChild(st);
  d.append(dl, out);
  return d;
}

async function setState(o, code, reason, btn, out, onChanged) {
  btn.disabled = true; out.className = 'quiet working work-order-out'; out.textContent = 'Keeping it.';
  let r = null;
  try { const x = await C.sb.rpc('work_order_set', { p_id: o.wo_id, p_state: code, p_reason: reason }); r = x.error ? { ok: false, reason: x.error.message } : x.data; }
  catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  btn.disabled = false;
  if (!r || r.ok !== true) { out.className = 'state stalled work-order-out'; out.textContent = 'Not changed. ' + plain((r && r.reason) || 'no reason was given'); return; }
  out.className = 'quiet work-order-out'; out.textContent = String(r.line || 'Kept.');
  if (onChanged && r.item) onChanged(r.item);
  countOpenWork();
}

// What a question asked inside an order is anchored to: the order's email, as the brain read it into the order. lens-ask
// checks that she may open that mailbox before it answers (its anchor check) and weights this text in the answer.
export function orderAnchor(o) {
  const facts = [['Order', o.what], ['For', o.for_whom], ['Their client', o.end_client], ['Wanted by', o.by_when], ['Terms', o.terms], ['State', o.state_words]]
    .filter((x) => x[1]).map((x) => x[0] + ': ' + x[1]).join(NL);
  return { source_key: o.open_source || '', thread_id: '', from_email: o.contact_email || '', from_name: o.contact_name || '',
    subject: o.subject || '', date: o.last_out || '', text: (facts + NL + NL + String(o.words || '')).slice(0, 6000) };
}

// THE GREETING on a new conversation (the picture's "new"): good morning, afternoon or evening in her own time zone, her
// first name when the brain has it, and three questions she can press. Each is asked by the one ask().
export function hello(name, hour) {
  const w = mk('div', 'work-hello');
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = String(name || '').trim().split(' ')[0];
  const h = mk('h2', null, part + (first ? ', ' : ''));
  if (first) { const n = mk('span', null, first); n.translate = false; h.appendChild(n); }
  w.appendChild(h);
  w.appendChild(mk('p', 'quiet', 'Ask anything about your business. Your mail, files and books are already here.'));
  const chips = mk('div', 'work-chips');
  for (const q of ['How did we do last month?', 'What should I follow up on today?', 'Who owes us money?']) {
    const b = mk('button', 'chip', q); b.type = 'button';
    b.addEventListener('click', () => C.ask(q));
    chips.appendChild(b);
  }
  w.appendChild(chips);
  return w;
}

// A DRAFT WRITTEN INSIDE AN ORDER (lens-ask state 'draft', from the order's email). Shown, never sent: Open in Mail opens
// that email, where she writes or sends; Copy puts the words on her clipboard.
export function draftCard(slot, body, o) {
  const dr = body.draft || {};
  if (body.answer) slot.appendChild(mk('p', null, body.answer));
  const box = mk('div', 'work-draft');
  if (dr.subject) { const s = mk('p', 'quiet', dr.subject); s.translate = false; box.appendChild(s); }
  const t = mk('p', 'work-draft-text', dr.text || ''); t.translate = false;
  box.appendChild(t);
  slot.appendChild(box);
  const acts = mk('div', 'work-chips');
  if (o && o.open_source && o.open_id) {
    const om = mk('button', 'chip chip-p', 'Open in Mail to send'); om.type = 'button';
    om.addEventListener('click', () => C.openEmail(o.open_source, o.open_id));
    acts.appendChild(om);
  }
  const cp = mk('button', 'chip', 'Copy the draft'); cp.type = 'button';
  cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(String(dr.text || '')); cp.textContent = 'Copied'; } catch (_) { cp.textContent = 'Could not copy'; } });
  acts.appendChild(cp);
  slot.appendChild(acts);
  slot.appendChild(mk('p', 'quiet', String(body.state_reason || 'Nothing is sent until you press Send.')));
}

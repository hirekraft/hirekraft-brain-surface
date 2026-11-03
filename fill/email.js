// fill/email.js - MAIL, THE FRAMED FACE (seat tool-build-mail, 2026-11-03; decisions 1056, 1061, 1065, 1067, 1069; design
// whole-tool-design-3, snapshot 2e2adc7e, build order step 5). Part of SHOW. Drawn only with fill/frame.js blocks.
//
// What Mail opens on: ready questions for the Ask box; For you (what needs an answer first, each row with what it is in one
// word, the first with Open); the notices folded behind one press, each with Not for this list; Selling to you as one count at
// the bottom; and the mailboxes she may open, each with whether it is being read. A press on a row opens that item in the mail
// workspace (fill/mail.js), where the email is shown as an email (seat mail-clean) and an open requirement starts with Who we
// have. NO SECOND READER AND NO SECOND RENDERER: on the live page mail.js hands this file the readings it already holds
// (attention, mailbox_state) through draw(); mount() reads the same two itself only where nothing else holds them (the
// automatic frame check). The order's word is the business's own (decision 1056: HireKraft says Requirement); "work order"
// is never shown. A test record is greyed, carries the Test pill and is never counted (rule 8). A reading that did not come
// back says so with the reason, never an empty card or a zero (rule 7).
// No regex literals and no backslashes (STANDING-CLAUSES).
import { h, nameSpan, card, list, row, pill, button, link, say, working, behind, words } from './frame.js?v=2026-11-03-tool-build-1b';

const READY = ['What do I still owe an answer?', 'Anything new from a client today?', 'Who wrote to me today?'];

// The kinds the brain gives an item, read the way mail.js reads them (isSeller, isNotice): one condition each.
export const isSeller = (it) => !!it && it.kind === 'new_business' && it.nb_intent === 'selling';
export const isNotice = (it) => !!it && it.kind === 'new_business' && it.nb_intent === 'notice';
const cap = (w) => { const x = String(w ?? ''); return x.charAt(0).toUpperCase() + x.slice(1); };
// One word for what the item is. The order's word comes from the item (the business's word); without one it says Order.
function kindWord(it) {
  if (it.kind === 'work_order' || it.nb_intent === 'work_order') return ['act', cap(it.word || it.tag || 'Order')];
  if (it.kind === 'money' || it.is_money) return ['act', 'Money'];
  if (it.kind === 'impostor' || it.kind === 'scam_alert') return ['bad', 'Scam'];
  if (it.kind === 'thought') return ['plain', 'Left for you'];
  if (it.nb_intent === 'lead') return ['act', 'New client'];
  if (it.nb_intent === 'partner') return ['act', 'Partner'];
  if (it.about === 'invite') return ['plain', 'Invitation'];
  return ['plain', 'Answer'];
}
const titleOf = (it) => it.who ? it.who + (it.org && it.org !== it.who ? ' · ' + it.org : '') : String(it.what ?? '').split(': ')[0];
const lineOf = (it) => String(it.subject || it.title || it.why || it.what || '');
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const reason = (r, what) => { const x = String(r ?? 'No answer came back.'); return what + '. ' + x + (x.endsWith('.') ? '' : '.'); };

let said = null;   // { key, line, undo }: the last Not for this list pressed here, kept across redraws

// A row the whole of which opens the item (role button, Enter and Space too).
function pressRow(r, fn) {
  r.classList.add('vf-press'); r.tabIndex = 0; r.setAttribute('role', 'button');
  r.addEventListener('click', (e) => { if (e.target.closest('button')) return; fn(); });
  r.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  return r;
}

// s: { attention: { loading } | { data, gone? } | { error }, boxes: { loading } | { rows } | { error } }
// acts: { open(it), clear(it) -> Promise<{ ok, line, undo? }>, sellers(), all(), box(key), ask(q) }
export function draw(el, s, acts) {
  el.textContent = '';
  const root = h('div', 'vf vf-place');
  root.dataset.place = 'email';
  el.appendChild(root);

  const ask = h('div', 'vf-ask');
  for (const q of READY) { const b = h('button', 'vf-chip', q); b.type = 'button'; b.addEventListener('click', () => acts.ask(q)); ask.appendChild(b); }
  root.appendChild(ask);

  const grid = h('div', 'vf-grid');
  root.appendChild(grid);
  grid.appendChild(forYou(s.attention, acts, () => draw(el, s, acts)));
  grid.appendChild(mailboxes(s.boxes, acts));
  return root;
}

function forYou(a, acts, redraw) {
  const c = card('For you', '');
  if (!a || a.loading) { c.side.hidden = true; c.el.appendChild(working('Reading what needs an answer.')); return c.el; }
  if (a.error || !a.data || a.data.ok === false) { c.side.hidden = true; c.el.appendChild(say(reason(a.error ?? a.data?.reason, 'What needs an answer could not be read'), true)); return c.el; }
  const gone = a.gone ?? new Set();
  const all = (a.data.items ?? []).concat(a.data.more ?? []).filter((it) => !gone.has(it.key));
  const sellers = all.filter(isSeller), notices = all.filter(isNotice);
  const rest = all.filter((it) => !isSeller(it) && !isNotice(it));
  const real = rest.filter((it) => !it.test);
  c.side.hidden = !real.length;
  c.side.textContent = plural(real.length, 'to answer', 'to answer');
  if (said) {
    const p = say(said.line); p.setAttribute('aria-live', 'polite');
    c.el.appendChild(p);
    if (said.undo) c.el.appendChild(link('Undo', async () => { const u = said.undo; said = { line: 'Putting it back.' }; redraw(); const r = await u(); said = { line: r && r.ok ? (r.line || 'Put back.') : 'Not put back. Try again.' }; redraw(); }));
  }
  if (!rest.length) c.el.appendChild(say('Nothing waits for an answer from you.'));
  const l = list();
  let shown = 0, first = true;
  for (const it of rest) {
    if (shown >= 5) break;
    let right = null;
    if (!it.test) {
      if (first) { right = button('Open', () => acts.open(it)); first = false; }
      else { const [k, w] = kindWord(it); right = pill(k, w); }
    }
    // The first row carries Open, so what it is goes in front of its line (Requirement: IT strategy consultant).
    const kw = kindWord(it)[1];
    const line = right && right.classList.contains('vf-button') && kw !== 'Answer' ? kw + ': ' + lineOf(it) : lineOf(it);
    const r = row({ title: words(titleOf(it), 6), line: words(line, 8), right, test: !!it.test, nameTitle: true });
    l.appendChild(pressRow(r, () => acts.open(it)));
    shown += 1;
  }
  if (shown) c.el.appendChild(l);
  if (rest.length > shown) c.el.appendChild(link('Show all ' + real.length, () => acts.all()));

  if (notices.length) {
    const b = behind('Notices: ' + notices.length);
    const nl = list();
    for (const it of notices.slice(0, 8)) {
      const x = link('Not for this list', async () => {
        x.disabled = true;
        const r = await acts.clear(it);
        said = r && r.ok ? { line: r.line || 'Taken off your list.', undo: r.undo || null } : { line: 'Not kept. ' + String(r?.reason ?? 'Try again.') };
        redraw();
      });
      nl.appendChild(pressRow(row({ title: words(titleOf(it), 6), line: words(lineOf(it), 8), right: x, nameTitle: true }), () => acts.open(it)));
    }
    b.appendChild(nl);
    if (notices.length > 8) b.appendChild(link('Show all ' + notices.length, () => acts.all()));
    c.el.appendChild(b);
  }
  if (sellers.length) {
    const sl = list();
    sl.appendChild(row({ title: 'Selling to you', line: plural(sellers.length, 'offer, at the bottom', 'offers, at the bottom'), right: link('Show', () => acts.sellers()) }));
    c.el.appendChild(sl);
  }
  const held = Number(a.data.held ?? 0);
  if (held > 0) c.el.appendChild(say(plural(held, 'more is', 'more are') + ' not shown, because ' + (held === 1 ? 'it sits' : 'they sit') + ' in mail you may not open.'));
  return c.el;
}

function mailboxes(b, acts) {
  const c = card('Mailboxes', '');
  if (!b || b.loading) { c.side.hidden = true; c.el.appendChild(working('Reading your mailboxes.')); return c.el; }
  if (b.error) { c.side.hidden = true; c.el.appendChild(say(reason(b.error, 'Your mailboxes could not be read just now'), true)); return c.el; }
  const rows = b.rows ?? [];
  c.side.textContent = String(rows.length);
  if (!rows.length) { c.side.hidden = true; c.el.appendChild(say('No mailbox is connected for you yet.', true)); return c.el; }
  const l = list();
  for (const m of rows.slice(0, 8)) {
    const reading = m.state === 'reading';
    const p = reading ? pill('good', 'Read') : m.action_label ? pill('heed', 'Needs you') : m.state === 'stopped' ? pill('bad', 'Stopped') : pill('plain', 'Not read');
    const r = row({ title: String(m.address ?? ''), line: reading ? '' : words(m.headline ?? '', 8), right: p, nameTitle: true });
    l.appendChild(pressRow(r, () => acts.box(m.source_key)));
  }
  c.el.appendChild(l);
  if (rows.length > 8) c.el.appendChild(link('Show all ' + rows.length, () => acts.all()));
  return c.el;
}

// The frame's contract, mount(el, ctx) with ctx = { sb, who, lang, t, go, ask }: reads the two readings itself and draws. The live
// page uses draw() with what mail.js already holds, so the screen and the check draw with the same code.
export function mount(el, ctx) {
  const s = { attention: { loading: true }, boxes: { loading: true } };
  const rpc = async (fn, args) => { try { const { data, error } = await ctx.sb.rpc(fn, args ?? {}); return error ? { failed: error.message } : { data }; } catch (e) { return { failed: String(e?.message ?? e) }; } };
  const acts = {
    open: () => ctx.go('email'), all: () => ctx.go('email'), sellers: () => ctx.go('email'), box: () => ctx.go('email'),
    ask: (q) => ctx.ask(q),
    clear: async (it) => { const r = await rpc('matter_choose', { p_key: it.key, p_choice: 'not_for_this_list', p_title: String(it.subject || it.what || '').slice(0, 150), p_from_key: it.from_key || null, p_at: it.last_out || null }); if (r.failed || !r.data || r.data.ok !== true) return { ok: false, reason: r.failed ?? r.data?.reason }; s.attention.gone = s.attention.gone ?? new Set(); s.attention.gone.add(it.key); return { ok: true, line: r.data.line }; },
  };
  const redraw = () => draw(el, s, acts);
  redraw();
  rpc('attention', { p_days: 14 }).then((r) => { s.attention = r.failed ? { error: r.failed } : r.data && r.data.ok === false ? { error: r.data.reason ?? r.data.note } : { data: r.data }; redraw(); });
  rpc('mailbox_state').then((r) => { s.boxes = r.failed ? { error: r.failed } : { rows: Array.isArray(r.data) ? r.data : [] }; redraw(); });
  return el;
}

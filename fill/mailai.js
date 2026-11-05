// THE AI VIEW'S SIX QUESTIONS, CLEAN-UP, AND TEACH THE TOOL (seat mail-tab-build round 2, 2026-11-05; the approved mock-up "Mail
// Tab", artifact XbSFaPfzwJCwufiz7vHuFk, decisions 1074-1088). mail.js hands over what it already has (the attention reading, the
// caught scams, its row drawing and its email card); this file only groups and draws. Nothing here decides who may see what: every
// list comes from the brain as the signed-in person, and a refusal is shown with its reason, never as an empty list.
//
// THE SIX QUESTIONS are a grouping of what attention already lists, by one rule in the brain (ai_question_of, on each item's own
// kind and the new-business read): Can I make money with this? Is anything threatening my business? Could anything hurt or embarrass
// me? Is anything late or due? Is someone trying to scam me? What can I get rid of? There is no second classifier. Each question
// says in one line what it covers today, so an empty question is never read as "nothing there". Not this takes an item off that
// question for her and is kept as an example (ai_view_mark).
// CLEAN-UP groups newsletters and sellers across every mailbox she may open (mail_cleanup). Whether a sender offers an unsubscribe
// is read from the sender's own email header, live (mail-send unsub_check); Unsubscribe runs only on her press, one sender at a
// time, by the sender's own one-click address, or opens the sender's own page. Keep takes a sender off her list.
// TEACH THE TOOL lists, per question, examples to mark (ai_view_candidates): what the question holds now, emails the question does
// not hold whose subject carries its words, and ordinary emails. Belongs here / Doesn't belong is kept per person; the marked
// examples are the question's test set, and the line at the top says how many it misses now (ai_view_measure). Until examples are
// marked, no miss rate is said.

export const QUESTIONS = [
  { k: 'money', q: 'Can I make money with this?', covers: 'Requirements, leads, partners and work orders read from your mail.', tone: 'money' },
  { k: 'threat', q: 'Is anything threatening my business?', covers: 'Read so far: where your books and your mail disagree. Disputes and legal letters are not read for yet.', tone: 'warn' },
  { k: 'harm', q: 'Could anything hurt or embarrass me?', covers: 'The Tool does not read for this yet. Mark examples under Teach the Tool so it can learn.', tone: 'room' },
  { k: 'due', q: 'Is anything late or due?', covers: 'Money owed from your books, people waiting on your reply, and invitations.', tone: 'warn' },
  { k: 'scam', q: 'Is someone trying to scam me?', covers: 'Every email is checked as it arrives for someone pretending to be you, a look-alike address, or a push to pay someone new.', tone: 'scam' },
  { k: 'clean', q: 'What can I get rid of?', covers: 'Newsletters and sellers nobody here ever wrote to.', tone: 'people' },
];

let A = null;           // what mail.js hands over (initAi)
let cleanup = null;     // { loading } | { data } | { error }
let cleanShown = 50;
const plans = new Map(); // 'source|id' -> { how, url } | 'asking'
const cleanSaid = new Map(); // from_email -> { line, busy }
let teachQ = 'threat';
let cand = null;        // { q, loading } | { q, data } | { q, error }
let measure = null;
const markSaid = new Map();

export function initAi(api) { A = api; }
const mk = (t, c, x) => A.mk(t, c, x);
function btn(label, cls, fn) { const b = mk('button', cls, label); b.type = 'button'; b.addEventListener('click', () => fn(b)); return b; }

// ── the six questions, in the middle column ──
export function questionCounts() {
  const out = new Map(QUESTIONS.map((x) => [x.k, 0]));
  for (const it of A.attnAll()) if (out.has(it.q)) out.set(it.q, out.get(it.q) + 1);
  out.set('scam', A.scamItems().length);
  out.set('clean', cleanup && cleanup.data ? Number(cleanup.data.senders || 0) : out.get('clean'));
  return out;
}
export function drawQuestions(list) {
  const head = mk('div', 'mailx-head');
  head.appendChild(A.navButton('All views', 'side'));
  head.appendChild(mk('h3', null, 'Six questions'));
  head.appendChild(mk('p', 'mailx-list-sub', 'Across every mailbox you can open, the last 14 days. Your mail is not changed.'));
  list.appendChild(head);
  const at = A.attn();
  if (!at || at.loading) { list.appendChild(mk('p', 'quiet working', 'Looking through your mail and books. Nothing in your mailboxes is changed.')); return; }
  if (at.error) { list.appendChild(mk('p', 'state stalled', 'The questions could not be read just now. ' + at.error + ' This is not a claim that nothing needs you.')); return; }
  if (!cleanup) loadCleanup();
  const items = A.attnAll();
  for (const Q of QUESTIONS) {
    const sec = mk('section', 'mailx-q mailx-q-' + Q.tone);
    const h = mk('h4', 'mailx-q-head');
    const rows = Q.k === 'scam' ? A.scamItems() : Q.k === 'clean' ? [] : items.filter((x) => x.q === Q.k);
    const n = Q.k === 'clean' ? (cleanup && cleanup.data ? Number(cleanup.data.senders || 0) : null) : rows.length;
    h.append(mk('span', 'mailx-q-dot'), mk('span', 'mailx-q-text', Q.q), mk('span', 'mailx-q-n', n === null ? '' : String(n)));
    sec.appendChild(h);
    sec.appendChild(mk('p', 'mailx-q-covers', Q.covers));
    const ul = mk('ul', 'mailx-msgs mailx-att-rows');
    if (Q.k === 'clean') {
      if (!cleanup || cleanup.loading) sec.appendChild(mk('p', 'quiet working', 'Grouping newsletters and sellers across your mailboxes.'));
      else if (cleanup.error) sec.appendChild(mk('p', 'state stalled', 'Clean-up could not be read just now. ' + cleanup.error));
      else {
        const d = cleanup.data;
        const li = mk('li');
        const b = mk('button', 'mailx-msg mailx-att-row');
        b.type = 'button';
        b.appendChild(mk('span', 'mailx-subj mailx-att-what', d.senders.toLocaleString('en-US') + ' newsletters and sellers'));
        b.appendChild(mk('span', 'mailx-snip mailx-att-line', d.emails.toLocaleString('en-US') + ' emails in ' + d.days + ' days, across ' + d.boxes + ' mailbox' + (d.boxes === 1 ? '' : 'es') + '. Unsubscribe or keep, one sender at a time.'));
        b.addEventListener('click', () => A.chooseView({ kind: 'cleanup' }));
        li.appendChild(b); ul.appendChild(li);
      }
    } else if (Q.k === 'scam') {
      for (const it of rows.slice(0, 5)) {
        const li = mk('li');
        const b = mk('button', 'mailx-msg mailx-att-row warned');
        b.type = 'button';
        b.appendChild(mk('span', 'mailx-subj mailx-att-what', String(it.subject || '(no subject)')));
        b.appendChild(mk('span', 'mailx-snip mailx-att-line', A.scamWho(it) + '. Really from ' + String(it.from_email || '') + '.'));
        b.addEventListener('click', () => A.openScam(it));
        li.appendChild(b); ul.appendChild(li);
      }
      if (rows.length > 5) ul.appendChild(liButton('See all ' + rows.length + ' in Caught', () => A.chooseView({ kind: 'suspicious' })));
    } else {
      for (const it of rows) {
        const li = A.matterRow(it);
        li.classList.add('mailx-sell-li');
        li.appendChild(notThis(it, Q.k));
        ul.appendChild(li);
      }
    }
    if (Q.k === 'harm') sec.appendChild(btn('Teach the Tool', 'go ghost', () => { teachQ = 'harm'; A.chooseView({ kind: 'teach' }); }));
    else if (!rows.length && Q.k !== 'clean') sec.appendChild(mk('p', 'quiet', 'Nothing in the last 14 days.'));
    if (ul.childNodes.length) sec.appendChild(ul);
    const said = markSaid.get('q|' + Q.k);
    if (said) { const p = mk('p', 'mailx-att-out find-lesson'); p.setAttribute('aria-live', 'polite'); p.textContent = said; sec.appendChild(p); }
    list.appendChild(sec);
  }
  const rest = items.filter((x) => !x.q && !x.following);
  if (rest.length) {
    const sec = mk('section', 'mailx-q');
    sec.appendChild(mk('h4', 'mailx-q-head', 'Also for you'));
    const ul = mk('ul', 'mailx-msgs mailx-att-rows');
    for (const it of rest) ul.appendChild(A.matterRow(it));
    sec.appendChild(ul);
    list.appendChild(sec);
  }
}
function liButton(label, fn) { const li = mk('li'); li.appendChild(btn(label, 'go ghost', fn)); return li; }
function notThis(it, q) {
  return btn('Not this', 'go ghost mailx-sell-clear', async (b) => {
    b.disabled = true;
    const r = await rpc('ai_view_mark', { p_question: q, p_item_key: String(it.key || ''), p_source: it.open_source || null, p_message_id: it.open_id || null,
      p_title: String(it.subject || it.what || '').slice(0, 150), p_proposed: 'not_this', p_mark: 'not_show' });
    if (!r || r.ok !== true) { b.disabled = false; markSaid.set('q|' + q, 'Not kept. ' + A.plainWords(String((r && r.reason) || ''))); A.redraw(); return; }
    markSaid.set('q|' + q, 'Taken off this question for you, and kept as an example of what does not belong. Teach the Tool shows it.');
    A.reloadAttention();
  });
}
async function rpc(name, args) {
  try { const { data, error } = await A.sb().rpc(name, args); return error ? { ok: false, reason: error.message } : data; }
  catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

// ── Clean-up ──
export async function loadCleanup() {
  cleanup = { loading: true };
  const d = await rpc('mail_cleanup', { p_days: 90 });
  cleanup = d && d.ok ? { data: d } : { error: A.plainWords(String((d && d.reason) || 'no answer came back')) };
  A.redraw();
}
export function cleanupCount() { return cleanup && cleanup.data ? Number(cleanup.data.senders || 0) : null; }
export function drawCleanup(list) {
  const head = mk('div', 'mailx-head');
  head.appendChild(A.navButton('All views', 'side'));
  head.appendChild(mk('h3', null, 'Clean-up'));
  list.appendChild(head);
  if (!cleanup) loadCleanup();
  if (!cleanup || cleanup.loading) { list.appendChild(mk('p', 'quiet working', 'Grouping newsletters and sellers across your mailboxes. Nothing is changed.')); return; }
  if (cleanup.error) { list.appendChild(mk('p', 'state stalled', 'Clean-up could not be read just now. ' + cleanup.error + ' This is not a claim that there is nothing to clean up.')); return; }
  const d = cleanup.data;
  list.appendChild(mk('p', 'mailx-list-sub', d.senders.toLocaleString('en-US') + ' senders, ' + d.emails.toLocaleString('en-US') + ' emails in the last ' + d.days + ' days, across '
    + d.boxes + ' mailbox' + (d.boxes === 1 ? '' : 'es') + '. Nobody here ever wrote to them. Unsubscribe uses the sender' + "'" + 's own unsubscribe and runs only when you press it.'));
  const rows = (d.rows || []).slice(0, cleanShown);
  askPlans(rows);
  const ul = mk('ul', 'mailx-msgs mailx-clean-rows');
  for (const r of rows) ul.appendChild(cleanRow(r));
  list.appendChild(ul);
  if ((d.rows || []).length > cleanShown) list.appendChild(btn('Show 50 more', 'go ghost', () => { cleanShown += 50; A.redraw(); }));
  else if (d.senders > (d.rows || []).length) list.appendChild(mk('p', 'quiet', 'The ' + (d.rows || []).length + ' with the most emails are listed; ' + (d.senders - d.rows.length).toLocaleString('en-US') + ' more send fewer.'));
}
function cleanRow(r) {
  const li = mk('li', 'mailx-clean-row');
  const who = mk('div', 'mailx-clean-who');
  const nm = mk('span', 'mailx-from', String(r.from_name || r.from_email)); nm.translate = false;
  const ad = mk('span', 'mailx-snip', String(r.from_email)); ad.translate = false;
  const kind = r.kind === 'seller' ? 'Selling to you' : r.kind === 'notice' ? 'A notice' : 'Sends you mail';
  const meta = mk('span', 'mailx-snip', kind + ' · ' + r.n + ' email' + (r.n === 1 ? '' : 's') + ' · ' + (r.boxes || []).length + ' mailbox' + ((r.boxes || []).length === 1 ? '' : 'es') + ' · last ' + A.when(r.last_at));
  who.append(nm, ad, meta);
  li.appendChild(who);
  const acts = mk('div', 'mailx-att-acts');
  const said = cleanSaid.get(r.from_email);
  const p = plans.get(r.latest.source + '|' + r.latest.id);
  if (said && said.done) { /* the line below says what happened */ }
  else if (!p || p === 'asking') acts.appendChild(mk('span', 'quiet working', 'Checking how this sender takes unsubscribes.'));
  else if (p.how === 'one_click') acts.appendChild(btn('Unsubscribe', 'go', (b) => unsubscribe(r, b)));
  else if (p.how === 'link' && p.url) {
    const a = mk('a', 'go', 'Unsubscribe on their page'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.addEventListener('click', () => unsubscribe(r, null));
    acts.appendChild(a);
  } else acts.appendChild(mk('span', 'quiet', p.how === 'mailto' ? 'Takes unsubscribes only by email; the Tool does not send that yet.' : p.how === 'unread' ? 'Its newest email could not be read just now.' : 'Offers no unsubscribe.'));
  if (!(said && said.done)) acts.appendChild(btn('Keep', 'go ghost', (b) => keep(r, b, true)));
  li.appendChild(acts);
  if (said) {
    const o = mk('p', 'mailx-att-out find-lesson'); o.setAttribute('aria-live', 'polite');
    o.appendChild(mk('span', null, said.line));
    if (said.kept) o.appendChild(btn('Undo', 'go ghost', (b) => keep(r, b, false)));
    li.appendChild(o);
  }
  return li;
}
async function askPlans(rows) {
  const by = new Map();
  for (const r of rows) {
    const k = r.latest.source + '|' + r.latest.id;
    if (plans.has(k)) continue;
    plans.set(k, 'asking');
    if (!by.has(r.latest.source)) by.set(r.latest.source, []);
    by.get(r.latest.source).push(r.latest.id);
  }
  for (const [src, ids] of by) {
    for (let i = 0; i < ids.length; i += 25) {
      const part = ids.slice(i, i + 25);
      let j = null;
      try { j = await A.mailSend({ action: 'unsub_check', source_key: src, message_ids: part }); } catch (_) { j = null; }
      for (const id of part) plans.set(src + '|' + id, j && j.plans && j.plans[id] ? j.plans[id] : { how: 'unread' });
      A.redraw();
    }
  }
}
async function unsubscribe(r, b) {
  if (b) b.disabled = true;
  cleanSaid.set(r.from_email, { line: 'Asking the sender to take you off their list.' });
  if (b) A.redraw();
  let j = null;
  try { j = await A.mailSend({ action: 'unsubscribe', source_key: r.latest.source, message_id: r.latest.id }); } catch (e) { j = { ok: false, reason: String((e && e.message) || e) }; }
  const line = j && j.ok ? String(j.line || 'Done.') + (j.how === 'one_click' ? ' New emails from them may take a few days to stop.' : '') : 'Not unsubscribed. ' + A.plainWords(String((j && j.reason) || ''));
  cleanSaid.set(r.from_email, { line, done: !!(j && j.ok && j.how === 'one_click') });
  A.redraw();
}
async function keep(r, b, yes) {
  b.disabled = true;
  const d = await rpc('mail_cleanup_keep_set', { p_from: r.from_email, p_keep: yes });
  if (!d || d.ok !== true) { b.disabled = false; cleanSaid.set(r.from_email, { line: 'Not kept. ' + A.plainWords(String((d && d.reason) || '')) }); A.redraw(); return; }
  cleanSaid.set(r.from_email, yes ? { line: 'Kept. This sender leaves your clean-up list.', kept: true, done: true } : { line: 'Back on your clean-up list.' });
  A.redraw();
}

// ── Teach the Tool ──
export function drawTeach(list) {
  const head = mk('div', 'mailx-head');
  head.appendChild(A.navButton('All views', 'side'));
  head.appendChild(mk('h3', null, 'Teach the Tool'));
  head.appendChild(mk('p', 'mailx-list-sub', 'For each question, mark what belongs and what does not. Your marks become the test the questions are checked against.'));
  list.appendChild(head);
  const chips = mk('div', 'mailx-q-chips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Question');
  for (const Q of QUESTIONS) {
    const c = btn(Q.q, 'mailx-mode-btn', () => { teachQ = Q.k; cand = null; A.redraw(); });
    c.setAttribute('aria-pressed', teachQ === Q.k ? 'true' : 'false');
    chips.appendChild(c);
  }
  list.appendChild(chips);
  if (!measure) loadMeasure();
  const m = measure && measure.data && (measure.data.questions || []).find((x) => x.question === teachQ);
  if (m) list.appendChild(mk('p', 'mailx-q-covers', measureLine(m)));
  if (!cand || cand.q !== teachQ) loadCand(teachQ);
  if (!cand || cand.loading) { list.appendChild(mk('p', 'quiet working', 'Finding examples from the last 14 days.')); return; }
  if (cand.error) { list.appendChild(mk('p', 'state stalled', 'Examples could not be read just now. ' + cand.error)); return; }
  const d = cand.data;
  group(list, 'In this question now', 'Does each one belong here?', d.in_view);
  group(list, 'Might belong', 'The question does not hold these, but their subject has its words. Should it show them?', d.word_hit);
  group(list, 'Ordinary emails', 'These should probably not show here. Say if one should.', d.ordinary);
}
function measureLine(m) {
  if (!m.must_show && !m.must_not_show) return 'Nothing marked yet for this question, so how often it misses is not known.';
  return 'Marked: ' + m.must_show + ' that should show, ' + m.must_not_show + ' that should not. Missed now: ' + m.missed + ' of ' + m.must_show
    + '. Shown when it should not be: ' + m.wrongly_shown + ' of ' + m.must_not_show + '.' + (m.too_old ? ' ' + m.too_old + ' marked emails are older than 14 days and are not counted.' : '');
}
function group(list, title, sub, rows) {
  list.appendChild(mk('h4', 'mailx-domain', title + ' (' + (rows || []).length + ')'));
  list.appendChild(mk('p', 'quiet', sub));
  const ul = mk('ul', 'mailx-msgs mailx-clean-rows');
  for (const r of rows || []) ul.appendChild(teachRow(r));
  if (!(rows || []).length) list.appendChild(mk('p', 'quiet', 'None in the last 14 days.'));
  else list.appendChild(ul);
}
function teachRow(r) {
  const li = mk('li', 'mailx-clean-row');
  const who = mk('div', 'mailx-clean-who');
  const t = mk('span', 'mailx-from', String(r.title || '(no subject)')); t.translate = false;
  const w = mk('span', 'mailx-snip', String(r.who || '') + (r.at ? ' · ' + A.when(r.at) : '')); w.translate = false;
  who.append(t, w);
  if (r.source && r.message_id) who.appendChild(btn('Open the email', 'mailx-textlink', () => A.openEmail(r.source, r.message_id)));
  li.appendChild(who);
  const acts = mk('div', 'mailx-att-acts');
  const yes = btn('Belongs here', r.mark === 'show' ? 'go' : 'go ghost', (b) => mark(r, r.mark === 'show' ? null : 'show', b));
  const no = btn('Does not belong', r.mark === 'not_show' ? 'go' : 'go ghost', (b) => mark(r, r.mark === 'not_show' ? null : 'not_show', b));
  yes.setAttribute('aria-pressed', r.mark === 'show' ? 'true' : 'false');
  no.setAttribute('aria-pressed', r.mark === 'not_show' ? 'true' : 'false');
  acts.append(yes, no);
  li.appendChild(acts);
  return li;
}
async function mark(r, m, b) {
  b.disabled = true;
  const d = await rpc('ai_view_mark', { p_question: teachQ, p_item_key: r.item_key || null, p_source: r.source || null, p_message_id: r.message_id || null,
    p_title: String(r.title || '').slice(0, 150), p_proposed: r.proposed || null, p_mark: m });
  if (d && d.ok) r.mark = d.mark; else b.disabled = false;
  measure = null;
  A.redraw();
}
async function loadCand(q) {
  cand = { q, loading: true };
  const d = await rpc('ai_view_candidates', { p_question: q });
  if (!cand || cand.q !== q) return;
  cand = d && d.ok ? { q, data: d } : { q, error: A.plainWords(String((d && d.reason) || 'no answer came back')) };
  A.redraw();
}
async function loadMeasure() {
  measure = { loading: true };
  const d = await rpc('ai_view_measure', {});
  measure = d && d.ok ? { data: d } : { error: true };
  A.redraw();
}

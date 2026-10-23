// TO TEST, IN THE TOOL (seat test-list, 2026-10-23). Owner only, desktop and phone.
// Alex: "keep a list of everything we're doing and I can test it in the Tool surface".
// ONE SOURCE: this reads whats_new() on studio-core through studio-july, the same list the Studio Surface shows
// under What's new, and answers through the same screen_check_settle, so a check answered here leaves both
// lists. Nothing here is kept in the brain. studio-july accepts this page's own sign-in (the HireKraft brain's),
// checks the email against the studio's allowlist, and lets it reach the list and the answer only.
// Shown to the owner as a courtesy; studio-july refuses anyone not on its allowlist whatever this page shows.

const STUDIO_FN = 'https://yzsudnjwqplaaiwxbusi.supabase.co/functions/v1/studio-july';
const PLACE = { phone: 'On the phone', mail: 'Mail', work: 'Work', money: 'Money', drives: 'Drives', calendar: 'Calendar',
  contacts: 'Contacts', brain: 'Brain', chats: 'Chats', security: 'Security', systems: 'Systems', loose: 'Loose files',
  studio: 'The Studio Surface', none: 'No screen' };
let ctx = null, list = null;
const NOTE = {}, DONE = {}, SAY = {};

export function initToTest(c) { ctx = c; }

// The studio list, read once and shared: the Tool's consultant (news.js) puts a check beside the guide entry it proves.
export async function readList() {
  const r = await studio({ action: 'whatsnew' });
  return r.status === 200 && r.body?.ok ? r.body : null;
}

async function studio(body) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
  try {
    const { data } = await ctx.sb.auth.getSession();
    const tok = data?.session?.access_token;
    if (!tok) return { status: 401, body: { error: 'You are not signed in.' } };
    const r = await fetch(STUDIO_FN, { method: 'POST', signal: c.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch (_) { j = {}; }
    return { status: r.status, body: j };
  } catch (e) {
    return { status: 0, body: { error: e?.name === 'AbortError' ? 'No answer within 20 seconds.' : 'The studio could not be reached.' } };
  } finally { clearTimeout(t); }
}

const when = (t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

export async function loadToTest() {
  const box = ctx.$('#totest'); if (!box) return;
  if (!list) { box.replaceChildren(); const w = ctx.el('p', 'quiet working'); w.textContent = 'Reading what is waiting for you to test.'; box.appendChild(w); }
  const r = await studio({ action: 'whatsnew' });
  if (r.status === 200 && r.body?.ok) list = r.body;
  else { list = null; box.replaceChildren(); const p = ctx.el('p', 'quiet'); p.textContent = 'The list could not be read: ' + (r.body?.error || ('the studio answered ' + r.status)) + '. This is not the same as nothing to test.'; box.appendChild(p); return; }
  draw();
}

// One check, with Works / Doesn't / Not now. Exported so the consultant's what's new draws the same card.
export function card(c, question, redraw = draw) {
  const el = ctx.el;
  const d = el('div', 'tt-card'); d.dataset.id = c.id;
  if (DONE[c.id]) { d.classList.add('tt-done'); const b = el('b'); b.textContent = DONE[c.id]; const a = el('span', 'tt-ask'); a.textContent = c.ask; d.append(b, a); return d; }
  const k = (t) => { const x = el('div', 'tt-k'); x.textContent = t; return x; };
  const v = (t, cls) => { const x = el('div', cls || 'tt-ask'); x.textContent = t; return x; };
  d.append(k('Where'), v((PLACE[c.tab] || c.tab || '') + (c.guide ? ' · ' + c.guide : '')));
  d.append(k(question ? 'The question' : 'What to do'), v(c.ask));
  if (c.expected) d.append(k(question ? 'Why it is asked' : 'You should see'), v(c.expected, 'tt-exp'));
  if (c.note) d.append(k('Your earlier note'), v(c.note, 'tt-exp'));
  const ta = el('textarea', 'tt-note'); ta.rows = 2; ta.value = NOTE[c.id] || '';
  ta.placeholder = question ? 'Your answer.' : 'What you saw, if it does not work.';
  ta.addEventListener('input', () => { NOTE[c.id] = ta.value; });
  d.appendChild(ta);
  if (SAY[c.id]) d.appendChild(v(SAY[c.id], 'tt-prompt'));
  const acts = el('div', 'tt-acts');
  const btn = (label, what, cls) => { const b = el('button', 'go ' + cls); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => settle(c, what, b, acts, redraw)); return b; };
  if (question) acts.append(btn('Send answer', 'answered', ''), btn('Not now', 'later', 'ghost'));
  else acts.append(btn('Works', 'passed', ''), btn("Doesn't", 'failed', 'ghost'), btn('Not now', 'later', 'ghost'));
  d.appendChild(acts);
  const s = el('div', 'tt-seat'); s.textContent = (c.seat || '') + (c.filed_at ? ' · filed ' + when(c.filed_at) : ''); d.appendChild(s);
  return d;
}

async function settle(c, what, b, acts, redraw = draw) {
  const note = (NOTE[c.id] || '').trim();
  if ((what === 'failed' || what === 'answered') && !note) {
    SAY[c.id] = what === 'failed' ? "What did you see? One line, then tap Doesn't again." : 'Type your answer, then tap Send answer.';
    redraw(); return;
  }
  acts.querySelectorAll('button').forEach((x) => { x.disabled = true; });
  b.textContent = 'Saving'; b.classList.add('working');
  const r = await studio({ action: 'check', id: c.id, result: what, note: note || null });
  if (r.status === 200 && r.body?.ok) {
    delete SAY[c.id]; delete NOTE[c.id];
    if (what === 'later') { c.note = note || c.note; SAY[c.id] = 'Kept for later.'; }
    else DONE[c.id] = ({ passed: 'Works', failed: "Doesn't", answered: 'Answered' })[what] + ', saved.';
  } else {
    SAY[c.id] = 'Not saved: ' + (r.body?.why || r.body?.error || ('the studio answered ' + r.status)) + ' Your note is still here.';
  }
  redraw();
}

function draw() {
  const box = ctx.$('#totest'); if (!box || !list) return;
  const el = ctx.el;
  const open = new Set([...box.querySelectorAll('details[open]')].map((d) => d.dataset.k));
  box.replaceChildren();
  const groups = list.ready || [], qs = list.questions || [];
  const left = groups.reduce((n, g) => n + (g.checks || []).filter((c) => !DONE[c.id]).length, 0);
  const head = el('p', 'quiet');
  head.textContent = left + (left === 1 ? ' check is' : ' checks are') + ' waiting for you, newest first. Refreshed ' + when(list.as_of) + '.';
  box.appendChild(head);
  const fold = (key, title, items, question) => {
    const d = el('details', 'tt-group'); d.dataset.k = key; if (open.has(key)) d.open = true;
    const s = el('summary'); const t = el('span'); t.textContent = title;
    const n = el('span', 'tt-n'); n.textContent = String(items.filter((c) => !DONE[c.id]).length);
    s.append(t, n); d.appendChild(s);
    items.forEach((c) => d.appendChild(card(c, question)));
    box.appendChild(d);
  };
  groups.forEach((g, i) => fold('c:' + (g.capability || i), g.wording, g.checks || [], false));
  if (qs.length) fold('questions', 'Questions waiting for your answer', qs, true);
  if (!groups.length && !qs.length) { const p = el('p', 'quiet'); p.textContent = 'Nothing is waiting for you to test.'; box.appendChild(p); }
}

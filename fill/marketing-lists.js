// fill/marketing-lists.js - THE MARKETING AND SALES TAB, part LISTS (seat marketing-build-b, 2026-11-02, decisions 1059, 1049, 1050, 1058).
//
// WHAT IT DOES FOR HER. One question: who could we write to, and who first? One picture: everyone on the email engine's lists,
// by relationship (prospects from the CRM, candidates from applicant tracking, other contacts, not known) and by when they last
// opened (30, 90, 180 days, earlier, never), with everyone who may not be emailed left off and the reason shown: unsubscribed or
// marked as spam, bounced, at a current client (decision 1049), a colleague; Gmail addresses that failed before (most in the
// August 2026 block) kept apart. One action: make the first warm-up list (the most engaged first), with its size and how many
// days it is at the current warm-up step. She can make other lists from the same picture, and press Push to Elastic on a list:
// the press is recorded with who, when and how many (the do-not-send check runs again at the press); sending the list to the
// engine is the next step being built, and the screen says so. Nothing is sent from here, ever.
// Drawn from ONE reader, mk_lists_view (brain; owner or a marketing colleague). Writes: mk_audience_make, mk_list_push.
// The WordPress newsletter's subscribers are not read yet: shown as a gap with the plugin's own count, never as empty.
// Mount contract with seat marketing-build-a: mount(el, ctx); also registered as window.MK_PARTS.lists.
// No colour, size or font here; no regex literals, no backslashes.

let C = null;
let STAGE = null;
const REL = [['prospect', 'Prospects, from your CRM'], ['candidate', 'Candidates, from your applicant tracking'], ['contact', 'Other people you know'], ['unknown', 'Not known to the Tool']];
const ENG = [['d30', 'opened in the last 30 days'], ['d90', 'in 31 to 90 days'], ['d180', 'in 91 to 180 days'], ['older', 'earlier'], ['never', 'never opened']];
const OUT = { unsubscribed: 'unsubscribed or marked as spam', bounced: 'bounced', client: 'at a current client', colleague: 'a colleague', gmail_failed: 'a Gmail address that failed before' };
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const day = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

const STYLE = 'marketing-r2.css?v=2026-11-02-marketing-build-b';   // this part's look (seat marketing-build-b), loaded once by whichever part mounts first
const ensureStyle = () => { try { if (!document.querySelector('link[data-mk-r2]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(STYLE, import.meta.url).href; l.setAttribute('data-mk-r2', '1'); document.head.appendChild(l); } } catch (e) { /* no document: tests */ } };
export async function mount(stage, ctx) {
  ensureStyle();
  C = Object.assign({ el: (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; } }, ctx || {});
  STAGE = stage;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Lists'), mk('p', 'mk-lede', 'Who could we write to, and who first?'));
  stage.appendChild(head);
  const w = mk('p', 'working no-late', 'Reading everyone on your email lists');
  stage.appendChild(w);
  const slow = setTimeout(() => { w.textContent = 'Reading everyone on your email lists: over 30,000 people, this takes a few seconds'; }, 10000);
  const v = await rpc('mk_lists_view', {});
  clearTimeout(slow);
  w.remove();
  if (!v || v.ok !== true) { stage.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((v && (v.reason || v.error)) || 'no reason was given') + '. Nothing here is a claim either way.')); return; }
  stage.appendChild(first(v));
  stage.appendChild(picture(v));
  stage.appendChild(leftOff(v));
  stage.appendChild(kept(v));
  stage.appendChild(maker());
  stage.appendChild(rules());
}
export const drawLists = mount;
try { window.MK_PARTS = Object.assign(window.MK_PARTS || {}, { lists: { mount } }); } catch (e) { /* no window: tests */ }

const FIRST_NAME = 'Warm-up: opened in the last 30 days';
function first(v) {
  const f = v.first || {};
  const sec = mk('section', 'mk-hand');
  sec.appendChild(mk('h3', 'mk-sub', 'Your first warm-up list'));
  const days = Number(f.per_day) ? Math.ceil(Number(f.size) / Number(f.per_day)) : 0;
  sec.appendChild(mk('p', 'mk-story', n0(f.size) + ' people who opened an email in the last 30 days and may be emailed: the most engaged first. At ' + n0(f.per_day)
    + ' a day that is ' + n0(days) + ' ' + (days === 1 ? 'day' : 'days') + '. The next ' + n0(f.next) + ' opened in the last 90 days.'));
  const have = (v.lists || []).find((l) => l.question === FIRST_NAME);
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  if (have) sec.appendChild(mk('p', 'state', 'Made on ' + day(have.made_at) + ': ' + n0(have.in) + ' on it. It is below under Your lists.'));
  else {
    const b = mk('button', 'go', 'Make this list'); b.type = 'button';
    b.addEventListener('click', () => make(b, said, FIRST_NAME, { engaged: ['d30'], gmail: 'apart' }));
    sec.appendChild(b);
  }
  sec.appendChild(said);
  return sec;
}

async function make(btn, said, name, spec) {
  btn.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Making the list and checking everyone on it';
  const r = await rpc('mk_audience_make', { p_name: name, p_spec: spec });
  if (r && r.ok) { mount(STAGE, C); return; }
  btn.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not made: ' + String((r && r.reason) || 'no reason was given') + '.';
}

function picture(v) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Who may be emailed, and when they last opened'));
  const g = v.grid || {};
  for (const [k, label] of REL) {
    const row = g[k] || {};
    const total = ENG.reduce((a, [e]) => a + Number(row[e] || 0), 0);
    if (!total) continue;
    const box = mk('div', 'mk-aud');
    box.appendChild(mk('p', 'mk-aud-head', label + ': ' + n0(total)));
    const strip = mk('div', 'mk-aud-strip');
    for (const [e, el] of ENG) {
      const n = Number(row[e] || 0);
      const cell = mk('span', 'mk-aud-cell mk-aud-' + e, n0(n) + ' ' + el);
      strip.appendChild(cell);
    }
    box.appendChild(strip);
    sec.appendChild(box);
  }
  sec.appendChild(mk('p', 'quiet', 'From ' + n0(v.people) + ' people your email engine holds' + (v.engine_read_at ? ', read ' + day(v.engine_read_at) : '') + '. Someone in both your CRM and your applicant tracking counts as a prospect.'));
  return sec;
}

function leftOff(v) {
  const o = v.left_off || {};
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Left off every list, and why'));
  sec.appendChild(mk('p', 'state', n0(o.unsubscribed) + ' unsubscribed or marked an email as spam.'));
  sec.appendChild(mk('p', 'state', n0(o.bounced) + ' bounced.'));
  const cl = mk('p', 'state');
  cl.appendChild(mk('span', null, n0(o.client) + ' at a current client (invoiced in the last 90 days, or an active client)' + ((v.clients || []).length ? ': ' : '.')));
  (v.clients || []).forEach((c, i) => { if (i) cl.appendChild(mk('span', null, ', ')); cl.appendChild(data_('span', null, c)); });
  sec.appendChild(cl);
  sec.appendChild(mk('p', 'state', n0(o.colleague) + ' of your own colleagues.'));
  sec.appendChild(mk('p', 'state', n0(v.gmail_failed) + ' Gmail addresses that failed before, most in the August block, are kept apart: a list leaves them off unless you say otherwise.'));
  const nl = v.newsletter;
  if (nl) sec.appendChild(mk('p', 'notice', 'Not read yet: about ' + n0(nl.subscribers_said) + ' subscribers of your WordPress newsletter (by ' + String(nl.said_by || 'its own count') + '). ' + String(nl.why || '')));
  return sec;
}

function kept(v) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Your lists'));
  const ls = v.lists || [];
  if (!ls.length) { sec.appendChild(mk('p', 'quiet', 'No list yet.')); return sec; }
  const ul = mk('ul', 'mk-person-list');
  for (const l of ls) {
    const li = mk('li', 'mk-person');
    li.appendChild(data_('p', 'mk-person-name', l.question));
    li.appendChild(mk('p', 'mk-person-from', n0(l.in) + ' on it, ' + n0(l.out) + ' left off with the reason. Made ' + day(l.made_at) + (l.refreshed_at ? ', checked again ' + day(l.refreshed_at) : '') + '.'));
    const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
    const p = l.push;
    if (p) said.textContent = 'Push to Elastic asked on ' + day(p.asked_at) + ' for ' + n0(p.size) + ' people. ' + String(p.said || '');
    if (l.kind === 'audience') {
      const acts = mk('div', 'mk-acts');
      const b = mk('button', 'go ghost', 'Push to Elastic'); b.type = 'button';
      b.addEventListener('click', async () => {
        b.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Checking everyone on the list again';
        const r = await rpc('mk_list_push', { p_list: l.id });
        if (r && r.ok) { mount(STAGE, C); return; }
        b.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not asked: ' + String((r && r.reason) || 'no reason was given') + '.';
      });
      acts.appendChild(b);
      li.appendChild(acts);
    }
    li.appendChild(said);
    ul.appendChild(li);
  }
  sec.appendChild(ul);
  return sec;
}

function maker() {
  const det = mk('details', 'mk-hand');
  det.appendChild(mk('summary', 'mk-hand-label', 'Make another list'));
  const nl = mk('label', 'mk-hand-label', 'Name');
  const name = mk('input', 'mk-subject'); name.type = 'text'; nl.appendChild(name);
  det.appendChild(nl);
  const pick = (title, rows, on) => {
    const fs = mk('fieldset', 'mk-pick');
    fs.appendChild(mk('legend', 'mk-hand-label', title));
    const boxes = {};
    for (const [k, label] of rows) {
      const lab = mk('label', 'mk-check');
      const c = mk('input'); c.type = 'checkbox'; c.checked = on.includes(k);
      boxes[k] = c; lab.append(c, mk('span', null, label));
      fs.appendChild(lab);
    }
    det.appendChild(fs);
    return boxes;
  };
  const eng = pick('Last opened', ENG, ['d30', 'd90']);
  const rel = pick('Who', REL, REL.map((r) => r[0]));
  const gl = mk('label', 'mk-check');
  const gc = mk('input'); gc.type = 'checkbox';
  gl.append(gc, mk('span', null, 'Include Gmail addresses that failed before'));
  det.appendChild(gl);
  const go = mk('button', 'go', 'Make the list'); go.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  go.addEventListener('click', () => {
    const on = (o) => Object.keys(o).filter((k) => o[k].checked);
    make(go, said, name.value.trim(), { engaged: on(eng), rel: on(rel), gmail: gc.checked ? 'with' : 'apart' });
  });
  det.append(go, said);
  return det;
}

function rules() {
  const det = mk('details', 'mk-rules');
  det.appendChild(mk('summary', 'mk-hand-label', 'Rules'));
  for (const line of [
    'Everyone comes from your email engine, with what the Tool knows about them from your CRM, applicant tracking and mail.',
    'Never on a list: anyone who unsubscribed or marked an email as spam, whose address bounced, who works at a current client (invoiced in the last 90 days in QuickBooks, or an active client), or who is a colleague. Each is shown with the reason.',
    'Gmail addresses that failed before, most during the August 2026 block, are left off unless you include them; a retest of 25 of them in October got 1 open.',
    'The first warm-up list is everyone who opened in the last 30 days: the people most likely to open again, so the warm-up earns its next step.',
    'Push to Elastic checks everyone again at the press. Sending the list to Elastic is the next step being built; until then the press is recorded and nothing goes to Elastic.',
  ]) det.appendChild(mk('p', 'state', line));
  return det;
}

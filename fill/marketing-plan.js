// fill/marketing-plan.js - THE MARKETING AND SALES TAB, part PLAN (seat marketing-parts, 2026-10-30, decisions 1039 and 1044).
// Alex, 2026-10-30 13:42 PT, on the mockup: "yes".
//
// WHAT IT DOES FOR HER. She says what the next weeks should be about ("plan November around AI cuts both ways") and the Tool
// makes a 2 to 4 week calendar: posts, email batches to a list, website pages and follow-ups, each on a day, with the words
// for posts and emails. She changes it the same way ("move the batch to Tuesday", "add a post about rates"). Every item is
// checked against her wording rules (never "we saw your posting", no referrals, no testimonials, never a client's name); one
// that breaks a rule says which. Lists are questions she asked ("SAP program leads at companies hiring, not contacted in 6
// months"); the brain works out who is on each one, keeps it current daily, and says for every person why they are on it and
// where they come from, and for every person left out, why.
// Everything here is drawn from what the brain returns (mk_plan_view, mk_list_view) and made by edge function job-alerts
// (actions plan and list). Nothing here decides who may see what: the brain refuses anyone but the owner, and that refusal is
// shown with its reason. Nothing is sent or posted from this part.
// No colour, size or font here (the looks' tokens in skin.css); no regex literals, no backslashes.

let C = null;
let view = null;
const MAKE = '/functions/v1/job-alerts';
const KIND = { post: 'Post', email_batch: 'Email batch', page: 'Website page', follow_up: 'Follow-up' };
const FROM = { hubspot: 'your CRM', linkedin: 'your LinkedIn connections', cats: 'your applicant tracking' };

const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const day = (iso) => { if (!iso) return ''; const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const wday = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
const fromWords = (list) => { const w = (list || []).map((s) => FROM[s] || 'your records'); return w.length > 1 ? w.slice(0, -1).join(', ') + ' and ' + w[w.length - 1] : (w[0] || 'your records'); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

async function post(body) {
  try {
    const { data: s } = await C.sb.auth.getSession();
    const jwt = s && s.session && s.session.access_token;
    if (!jwt) return { ok: false, reason: 'You are not signed in on this browser.' };
    const r = await fetch(C.url + MAKE, { method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    return j || { ok: false, reason: 'The answer came back with ' + r.status + '.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

// The working sign, next to the button she pressed, with a plain line; over 10 seconds it says so.
function working(after, line, longLine) {
  const w = mk('p', 'working', line);
  after.after(w);
  const t = setTimeout(() => { w.textContent = longLine; }, 10000);
  return () => { clearTimeout(t); w.remove(); };
}

export async function drawPlan(stage, ctx) {
  C = ctx;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Plan'), mk('p', 'mk-lede', 'What you will post, send and publish over the next weeks, made from what you ask. Change it the same way.'));
  stage.appendChild(head);
  const body = mk('div');
  stage.appendChild(body);
  body.appendChild(mk('p', 'working no-late', 'Reading your plan and your lists'));
  view = await rpc('mk_plan_view', {});
  body.innerHTML = '';
  if (!view || view.ok !== true) {
    body.appendChild(mk('p', 'notice flagged', 'Your plan could not be shown: ' + String((view && (view.reason || view.error)) || 'no reason was given') + '.'));
    return;
  }
  body.appendChild(askBox(stage));
  body.appendChild(calendar(view.plan));
  body.appendChild(listsPart(stage));
}

function askBox(stage) {
  const box = mk('section', 'mk-hand');
  const has = !!(view && view.plan);
  const label = mk('label', 'mk-hand-label', has ? 'Change the plan' : 'What should the next weeks be about?');
  const text = mk('textarea', 'mk-text'); text.rows = 2;
  text.placeholder = has ? 'For example: move the email batch to Tuesday, and add a post about rates' : 'For example: plan November around AI cuts both ways';
  text.setAttribute('aria-label', has ? 'Change the plan' : 'What should the next weeks be about?');
  label.appendChild(text);
  const go = mk('button', 'go', has ? 'Change the plan' : 'Make the plan'); go.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  go.addEventListener('click', async () => {
    const ask = text.value.trim();
    if (ask.length < 3) { said.className = 'mk-said stalled'; said.textContent = 'Say what the plan should be about.'; return; }
    go.disabled = true; said.textContent = '';
    const done = working(go, has ? 'Changing your plan' : 'Making your plan from your business, your lists and who is hiring',
      'Still working: a plan for several weeks takes up to two minutes.');
    const r = await post({ action: 'plan', ask });
    done(); go.disabled = false;
    if (!r || r.ok !== true) { said.className = 'mk-said stalled'; said.textContent = 'No plan was kept: ' + String((r && r.reason) || 'no reason was given') + '.'; return; }
    await drawPlan(stage, C);
    const top = stage.querySelector('.mk-plan-said');
    if (top) {
      top.textContent = 'Kept: ' + r.items + ' ' + plural(r.items, 'item', 'items') + '.' + (r.dropped ? ' ' + r.dropped + ' ' + plural(r.dropped, 'item fell', 'items fell') + ' outside the weeks of the plan or had no kind, so they were left out.' : '');
      for (const x of (r.lists_refused || [])) top.appendChild(mk('span', null, ' A list could not be made: ' + String(x.reason || '')));
    }
  });
  box.append(label, go, said);
  return box;
}

function calendar(p) {
  const sec = mk('section', 'mk-roles');
  const said = mk('p', 'mk-plan-said state'); said.setAttribute('aria-live', 'polite');
  sec.appendChild(said);
  if (!p) { sec.appendChild(mk('p', 'quiet', 'There is no plan yet. Say above what the next weeks should be about.')); return sec; }
  sec.appendChild(mk('h3', 'mk-sub', 'From ' + day(p.from) + ' to ' + day(p.to)));
  if (p.summary) sec.appendChild(data_('p', 'mk-lede', p.summary));
  sec.appendChild(mk('p', 'quiet', 'Made from what you asked on ' + day(p.made_at) + (Number(p.versions) > 1 ? '. Every earlier version is kept.' : '.')));
  let week = '';
  let ul = null;
  for (const it of (p.items || [])) {
    const d = new Date(String(it.day) + 'T12:00:00');
    const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const wk = monday.toISOString().slice(0, 10);
    if (wk !== week) { week = wk; sec.appendChild(mk('h3', 'mk-sub', 'Week of ' + day(wk))); ul = mk('ul', 'mk-list'); sec.appendChild(ul); }
    ul.appendChild(itemRow(it));
  }
  return sec;
}

function itemRow(it) {
  const li = mk('li', 'mk-item');
  const top = mk('p', 'mk-item-meta', wday(it.day) + ' · ' + (KIND[it.kind] || it.kind));
  if (it.channel) top.append(document.createTextNode(' · '), data_('span', null, it.channel));
  li.appendChild(top);
  li.appendChild(data_('p', 'mk-item-line', it.title));
  if (it.what) li.appendChild(data_('p', 'mk-item-known', it.what));
  if (it.wording_fail) li.appendChild(mk('p', 'stalled', 'This breaks one of your wording rules (' + it.wording_fail + '). Change it before you use it.'));
  if (it.draft) {
    const det = C.el('details');
    const sum = mk('summary', null, it.kind === 'post' ? 'See the post' : (it.kind === 'page' ? 'See the opening' : 'See the email'));
    sum.style.minHeight = '44px'; sum.style.display = 'flex'; sum.style.alignItems = 'center'; sum.style.cursor = 'pointer';
    const words = data_('div', 'mk-item-known', it.draft); words.style.whiteSpace = 'pre-wrap';
    det.append(sum, words);
    li.appendChild(det);
  }
  if (it.list_id) {
    const q = (view.lists || []).find((l) => l.id === it.list_id);
    const b = mk('button', 'go ghost', 'Who it goes to'); b.type = 'button';
    const out = mk('div');
    b.addEventListener('click', () => { out.innerHTML = ''; showList(out, it.list_id, true, 0); });
    const line = mk('p', 'quiet', 'To the list: ');
    line.appendChild(data_('span', null, q ? q.question : ''));
    if (q && q.counts) line.appendChild(mk('span', null, ' (' + n0(q.counts.in) + ' ' + plural(q.counts.in, 'person', 'people') + ')'));
    li.append(line, b, out);
  } else if (it.list_question) {
    const line = mk('p', 'quiet', 'Its list could not be made: ');
    line.appendChild(data_('span', null, it.list_question));
    li.appendChild(line);
  }
  return li;
}

function listsPart(stage) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Lists'));
  sec.appendChild(mk('p', 'quiet', 'A list is a question about who to reach. The Tool keeps it current every day and says why each person is on it, and why anyone close is left out.'));
  const label = mk('label', 'mk-hand-label', 'Ask for a list');
  const q = mk('input', 'mk-why'); q.type = 'text'; q.placeholder = 'For example: SAP program leads at companies hiring, not contacted in 6 months';
  q.setAttribute('aria-label', 'Ask for a list');
  label.appendChild(q);
  const go = mk('button', 'go ghost', 'Make the list'); go.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  go.addEventListener('click', async () => {
    const question = q.value.trim();
    if (question.length < 4) { said.className = 'mk-said stalled'; said.textContent = 'Say who should be on the list.'; return; }
    go.disabled = true; said.textContent = '';
    const done = working(go, 'Finding the people for this list', 'Still working: going through everyone in your records.');
    const r = await post({ action: 'list', question });
    done(); go.disabled = false;
    if (!r || r.ok !== true) { said.className = 'mk-said stalled'; said.textContent = 'No list was made: ' + String((r && r.reason) || 'no reason was given') + '.'; return; }
    await drawPlan(stage, C);
  });
  sec.append(label, go, said);
  const lists = view.lists || [];
  if (!lists.length) sec.appendChild(mk('p', 'quiet', 'No lists yet.'));
  const ul = mk('ul', 'mk-list');
  for (const l of lists) ul.appendChild(listRow(l));
  sec.appendChild(ul);
  sec.appendChild(mk('p', 'state', 'People are matched by job title, company and place in your CRM, your applicant tracking and your LinkedIn connections. Emails are counted from the mailboxes the Tool reads, back to ' + day(view.contact_since) + ' so far.'));
  return sec;
}

function listRow(l) {
  const li = mk('li', 'mk-item');
  const c = l.counts || {};
  li.appendChild(data_('p', 'mk-item-line', l.question));
  li.appendChild(mk('p', 'mk-item-known', n0(c.in) + ' ' + plural(c.in, 'person is', 'people are') + ' on it. ' + n0(c.out) + ' close ' + plural(c.out, 'match is', 'matches are') + ' left out, each with why.'));
  // LEFT OUT, AND WHY (seat rulings-1049, decision 1049 (3)): one line counting who is left out by reason, so nobody known to
  // the business is dropped without her seeing it; Who is left out and why lists each person with the one reason.
  const outBits = OUT_ORDER.filter((k) => Number(c[k])).map((k) => n0(c[k]) + ' ' + OUT_COUNT[k][Number(c[k]) === 1 ? 0 : 1]);
  if (outBits.length) li.appendChild(mk('p', 'mk-item-known', 'Left out: ' + outBits.join(', ') + '.'));
  const bits = ['Kept current daily, last on ' + day(l.refreshed_at)];
  if (Number(l.new)) bits.push(l.new + ' new since the day before');
  if (Number(c.in) > Number(c.shown_cap || 500)) bits.push('the first ' + n0(c.shown_cap || 500) + ' are kept to show');
  li.appendChild(mk('p', 'mk-item-meta', bits.join(' · ') + '.'));
  const acts = mk('div', 'mk-acts');
  const out = mk('div');
  const a = mk('button', 'go ghost', 'Who is on it'); a.type = 'button';
  a.addEventListener('click', () => { out.innerHTML = ''; showList(out, l.id, true, 0); });
  const b = mk('button', 'go ghost', 'Who is left out and why'); b.type = 'button';
  b.addEventListener('click', () => { out.innerHTML = ''; showList(out, l.id, false, 0); });
  const s = mk('button', 'go ghost', 'Stop keeping this list'); s.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  s.addEventListener('click', async () => {
    s.disabled = true;
    const r = await rpc('mk_list_retire', { p_list: l.id });
    if (r.ok) { li.remove(); return; }
    s.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not stopped: ' + (r.reason || 'no reason was given') + '.';
  });
  acts.append(a, b, s);
  li.append(acts, said, out);
  return li;
}

const OUT_ORDER = ['client', 'colleague', 'unsubscribed', 'known', 'contacted', 'not_hiring', 'hiring', 'no_email'];
const OUT_COUNT = {
  client: ['current client', 'current clients'], colleague: ['colleague', 'colleagues'], unsubscribed: ['unsubscribed', 'unsubscribed'],
  known: ['known to you', 'known to you'], contacted: ['contacted recently', 'contacted recently'], not_hiring: ['not hiring', 'not hiring'],
  hiring: ['hiring', 'hiring'], no_email: ['without an email address', 'without an email address'],
};
const OUT_WHY = {
  colleague: 'Left out: a colleague at your business.',
  unsubscribed: 'Left out: they unsubscribed, so they never get your marketing.',
  not_hiring: 'Left out: their company is not hiring in the job alerts of the last 30 days.',
  hiring: 'Left out: their company is hiring, and you asked for companies that are not.',
  no_email: 'Left out: there is no email address on file for them.',
};

function reasonLines(p) {
  const r = p.reasons || {};
  const lines = [];
  if (p.why_out === 'contacted') lines.push(mk('p', 'stalled', 'Left out: you last emailed with them on ' + day(r.last_contact) + ', inside the time you asked.'));
  else if (p.why_out === 'client') lines.push(mk('p', 'stalled', 'Left out: a current client' + (r.last_invoice ? ' (last invoiced in QuickBooks on ' + day(r.last_invoice) + ', within 90 days)' : ' (an active client in your records)') + '.'));
  else if (p.why_out === 'known') lines.push(mk('p', 'stalled', 'Left out: known to you, you have been writing with them in the last 30 days (last on ' + day(r.last_out) + ').'));
  else if (p.why_out === 'unsubscribed' && r.unsubscribed_at) lines.push(mk('p', 'stalled', 'Left out: they unsubscribed on ' + day(r.unsubscribed_at) + ', so they never get your marketing.'));
  else if (p.why_out) lines.push(mk('p', 'stalled', OUT_WHY[p.why_out] || 'Left out.'));
  if (r.title || r.company) {
    const t = mk('p', 'mk-person-from');
    if (r.title) t.appendChild(data_('span', null, r.title));
    if (r.title && r.company) t.appendChild(mk('span', null, ' at '));
    if (r.company) t.appendChild(data_('span', null, r.company));
    lines.push(t);
  }
  if (r.hiring_roles) lines.push(mk('p', 'state', 'Their company is hiring ' + r.hiring_roles + ' ' + plural(r.hiring_roles, 'role', 'roles') + ' (last job alert ' + day(r.hiring_at) + ').'));
  if (p.why_out !== 'contacted') lines.push(mk('p', 'state', r.last_contact ? 'Last email with them: ' + day(r.last_contact) + '.' : 'No email with them since ' + day(r.since) + ', as far back as the Tool has read your mail.'));
  lines.push(mk('p', 'state', 'Known from ' + fromWords(r.from) + '.' + (r.has_email ? '' : ' No email address on file.')));
  return lines;
}

async function showList(host, id, inside, offset) {
  const w = mk('p', 'working no-late', inside ? 'Reading who is on this list' : 'Reading who is left out and why');
  host.appendChild(w);
  const r = await rpc('mk_list_view', { p_list: id, p_inside: inside, p_limit: 50, p_offset: offset });
  w.remove();
  if (!r || r.ok !== true) { host.appendChild(mk('p', 'notice flagged', 'This list could not be read: ' + String((r && r.reason) || 'no reason was given') + '.')); return; }
  const people = r.people || [];
  if (!people.length && !offset) { host.appendChild(mk('p', 'quiet', inside ? 'Nobody is on this list now.' : 'Nobody close is left out.')); return; }
  const ul = mk('ul', 'mk-person-list');
  for (const p of people) {
    const li = mk('li', 'mk-person');
    const top = mk('div', 'mk-person-top');
    top.appendChild(data_('span', 'mk-person-name', p.name));
    if (p.new) top.appendChild(mk('span', 'mk-person-title', 'New'));
    li.appendChild(top);
    for (const x of reasonLines(p)) li.appendChild(x);
    if (p.profile) { const a = mk('a', 'go ghost', 'Open profile'); a.href = p.profile; a.target = '_blank'; a.rel = 'noopener'; li.appendChild(a); }
    ul.appendChild(li);
  }
  host.appendChild(ul);
  const total = Number(((r.counts || {})[inside ? 'in' : 'out']) || 0);
  const kept = Math.min(total, Number((r.counts || {}).shown_cap || 500));
  if (offset + people.length < kept) {
    const more = mk('button', 'go ghost', 'Show more'); more.type = 'button';
    more.addEventListener('click', () => { more.remove(); showList(host, id, inside, offset + 50); });
    host.appendChild(more);
  }
}

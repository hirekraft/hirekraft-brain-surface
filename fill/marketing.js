// fill/marketing.js - THE MARKETING AND SALES TAB, first part: SIGNALS AND OUTREACH (seat job-alerts, 2026-10-30, decision 1039).
// Alex, 2026-10-29: "start the job alert loop ... it should go into the marketing tab ... a business process around it".
//
// WHAT IT DOES FOR HER. The job alerts that already arrive in the business's mail are read once by the Tool (edge function
// job-alerts): which employers are hiring for which roles, each kept only when the company and title appear word for word in
// the email. Each hiring company where the business knows someone becomes ONE item: "<Company> is hiring 3 roles. You know 5
// people there." Opening it shows the roles and the people (current company only, from the CRM, applicant tracking and the
// LinkedIn connections download), and for each person a short note in the owner's voice: an email for people with an address,
// a LinkedIn message to copy for the rest, with the profile one press away. Nothing is sent or posted by the Tool: an email goes
// through mail-send (the one send path, held while its test lock is on, said plainly), and a LinkedIn note is pasted by a person.
// THE WORK PROCESS. The owner can Hand to a colleague (her explicit choice, per item); the colleague sees only what was handed.
// Open profile, Copy note, Sent and Skip (with why) are logged with who and when; the item reads done when every person is handled.
//
// Everything here is drawn from what the brain returns (job_alert_items, as the signed-in person); nothing here decides who may
// see or do what. Built so the coming parts of the tab (lists, campaigns, what came back) sit beside it as more sub-parts.
// No colour, size or font here: the looks' tokens in skin.css under SIGNALS AND OUTREACH. No regex literals, no backslashes.

import { draftHash } from './answer.js?v=2026-10-29-mail-invites';

let C = null;
let data = null;
let openKey = null;
const DRAFT = '/functions/v1/job-alerts';
const SEND = '/functions/v1/mail-send';
const KNOWN_FROM = { hubspot: 'your CRM', linkedin: 'your LinkedIn connections', cats: 'your applicant tracking', catsone: 'your applicant tracking' };
const DONE_STEPS = ['sent', 'skipped', 'email_held', 'email_sent'];

const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };   // a name, a company, a title: never translated
const day = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

async function post(path, body) {
  try {
    const { data: s } = await C.sb.auth.getSession();
    const jwt = s && s.session && s.session.access_token;
    if (!jwt) return { ok: false, reason: 'You are not signed in on this browser.' };
    const r = await fetch(C.url + path, { method: 'POST', headers: { Authorization: 'Bearer ' + jwt, apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    return j || { ok: false, reason: 'The answer came back with ' + r.status + '.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

export function drawMarketing(body, ctx) {
  C = ctx;
  body.innerHTML = '';
  const wrap = mk('div', 'mk');
  const parts = mk('div', 'mk-parts');
  parts.setAttribute('role', 'tablist');
  const p1 = mk('button', 'mk-part', 'Signals and outreach'); p1.type = 'button'; p1.setAttribute('aria-selected', 'true'); p1.setAttribute('role', 'tab');
  parts.appendChild(p1);
  const stage = mk('div', 'mk-stage');
  wrap.append(parts, stage);
  body.appendChild(wrap);
  load(stage);
}

async function load(stage) {
  stage.innerHTML = '';
  const w = mk('p', 'working no-late', 'Reading the job alerts in your mail and who you know at each company');
  stage.appendChild(w);
  const r = await rpc('job_alert_items', { p_days: 30 });
  stage.innerHTML = '';
  if (!r || r.ok !== true) {
    stage.append(mk('p', 'notice flagged', 'This could not be read just now: ' + String((r && (r.reason || r.error)) || 'no reason was given') + '. Nothing here is a claim either way.'));
    const again = mk('button', 'go ghost', 'Try again'); again.type = 'button'; again.addEventListener('click', () => load(stage));
    stage.appendChild(again);
    return;
  }
  data = r;
  if (openKey && (data.items || []).some((x) => x.key === openKey)) drawItem(stage, openKey); else drawList(stage);
}

function boundary(b) {
  const a = (b && b.alerts) || {};
  const read = Number(a.read || 0), waiting = Number(a.waiting || 0) + Number(a.reading || 0), failed = Number(a.failed || 0), other = Number(a.not_postings || 0);
  const out = mk('div', 'mk-boundary');
  out.append(mk('p', 'state', 'From ' + read + ' job alerts in your mail in the last ' + b.days + ' days: ' + b.companies_hiring + ' companies hiring, ' + b.companies_with_people + ' where you know someone.'));
  if (waiting) out.append(mk('p', 'state', waiting + ' more alerts are still being read. This list grows as they are.'));
  if (failed) out.append(mk('p', 'state', failed + ' alerts could not be read and are left out.'));
  if (other) out.append(mk('p', 'state', other + ' emails that looked like alerts were newsletters or requests from other recruiters, so they are left out.'));
  if (b.closed_to_you) out.append(mk('p', 'state', b.closed_to_you + ' alerts are in mailboxes you cannot open, so they are left out.'));
  out.append(mk('p', 'state', 'People are matched by their current company in your CRM, your applicant tracking and your LinkedIn connections download' + (b.linkedin_as_of ? ' of ' + day(b.linkedin_as_of) : '') + '.'));
  return out;
}

function drawList(stage) {
  openKey = null;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Companies hiring where you know someone'));
  head.append(mk('p', 'mk-lede', data.owner
    ? 'From the job alerts in your mail. Open one to see the roles, the people you know there and a short note to each.'
    : 'What the owner handed to you. Open one to see the people and the note for each.'));
  stage.appendChild(head);
  const items = data.items || [];
  if (!items.length) {
    stage.appendChild(mk('p', 'quiet', data.owner ? 'No company in the alerts so far is one where you know someone.' : 'Nothing has been handed to you yet.'));
  }
  const ul = mk('ul', 'mk-list');
  for (const it of items) {
    const li = mk('li', 'mk-item' + (it.done ? ' mk-done' : ''));
    const b = mk('button', 'mk-item-btn'); b.type = 'button';
    const line = mk('p', 'mk-item-line');
    line.append(data_('span', 'mk-co', it.company), document.createTextNode(' '), mk('span', null, 'is hiring ' + it.roles_n + (it.roles_n === 1 ? ' role.' : ' roles.')));
    const known = mk('p', 'mk-item-known', 'You know ' + it.known + (it.known === 1 ? ' person there.' : ' people there.'));
    const meta = mk('p', 'mk-item-meta');
    const bits = ['Last seen ' + day(it.last_at)];
    if (it.handed && it.handed.length) bits.push('Handed to ' + it.handed.map((h) => h.to).join(', '));
    if (it.done) bits.push('Done'); else if (it.handled) bits.push(it.handled + ' of ' + it.people.length + ' handled');
    meta.textContent = bits.join(' · ');
    b.append(line, known, meta);
    b.addEventListener('click', () => drawItem(stage, it.key));
    li.appendChild(b);
    ul.appendChild(li);
  }
  stage.appendChild(ul);
  stage.appendChild(boundary(data.boundary || {}));
}

function drawItem(stage, key) {
  const it = (data.items || []).find((x) => x.key === key);
  if (!it) { drawList(stage); return; }
  openKey = key;
  stage.innerHTML = '';
  const back = mk('button', 'go ghost mk-back', 'Back to the list'); back.type = 'button';
  back.addEventListener('click', () => drawList(stage));
  const title = mk('h2', 'mk-title');
  title.append(data_('span', 'mk-co', it.company), document.createTextNode(' '), mk('span', null, 'is hiring ' + it.roles_n + (it.roles_n === 1 ? ' role.' : ' roles.')));
  const known = mk('p', 'mk-lede', 'You know ' + it.known + (it.known === 1 ? ' person there.' : ' people there.') + (it.people.length < it.known ? ' The ' + it.people.length + ' closest are here.' : ''));
  stage.append(back, title, known);

  // The roles, each with its own job page where the alert gave one.
  const roles = mk('section', 'mk-roles');
  roles.append(mk('h3', 'mk-sub', 'What they are hiring for'));
  const rl = mk('ul', 'mk-role-list');
  for (const r of (it.roles || []).slice(0, 12)) {
    const li = mk('li', 'mk-role');
    li.append(data_('span', 'mk-role-title', r.title));
    if (r.location) li.append(document.createTextNode(' · '), data_('span', 'mk-role-where', r.location));
    if (r.link) { const a = mk('a', 'mk-role-link', 'Open the job'); a.href = r.link; a.target = '_blank'; a.rel = 'noopener'; li.append(document.createTextNode(' '), a); }
    rl.appendChild(li);
  }
  roles.appendChild(rl);
  stage.appendChild(roles);

  // HAND TO (owner only): her explicit choice, per item.
  if (data.owner && (data.handable || []).length) {
    const hand = mk('section', 'mk-hand');
    const label = mk('label', 'mk-hand-label', 'Hand this to');
    const sel = mk('select', 'mk-hand-pick');
    for (const p of data.handable) { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; o.translate = false; sel.appendChild(o); }
    label.appendChild(sel);
    const go = mk('button', 'go ghost', 'Hand to'); go.type = 'button';
    const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
    const now = mk('p', 'state', (it.handed || []).length ? 'Handed to ' + it.handed.map((h) => h.to + ' on ' + day(h.at)).join(', ') + '.' : 'Only you see this until you hand it to someone.');
    go.addEventListener('click', async () => {
      go.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Handing it over';
      const r = await rpc('job_alert_hand', { p_key: key, p_to: sel.value, p_take_back: false });
      go.disabled = false;
      if (r.ok) { said.className = 'mk-said state'; said.textContent = 'Handed over with ' + r.people + ' people. It is in their list now.'; reload(stage); }
      else { said.className = 'mk-said stalled'; said.textContent = 'Not handed: ' + (r.reason || 'no reason was given') + '.'; }
    });
    hand.append(now, label, go, said);
    stage.appendChild(hand);
  }

  const ppl = mk('section', 'mk-people');
  ppl.append(mk('h3', 'mk-sub', 'People you know there'));
  const ul = mk('ul', 'mk-person-list');
  for (const p of it.people) ul.appendChild(personRow(it, p, stage));
  ppl.appendChild(ul);
  stage.appendChild(ppl);
}

async function reload(stage) {
  const r = await rpc('job_alert_items', { p_days: 30 });
  if (r && r.ok === true) { data = r; if (openKey) drawItem(stage, openKey); }
}

function stepWords(s) {
  if (!s) return '';
  const who = s.by ? ' by ' + s.by : '';
  const when = s.at ? ' on ' + day(s.at) : '';
  if (s.step === 'sent') return 'Sent on LinkedIn' + who + when + '.';
  if (s.step === 'skipped') return 'Skipped' + who + when + (s.why ? ': ' + s.why : '') + '.';
  if (s.step === 'email_held') return 'Email held, not sent' + who + when + '. The Tool only sends to your own mailbox while its sending is being tested.';
  if (s.step === 'email_sent') return 'Email sent' + who + when + '.';
  if (s.step === 'copied') return 'Note copied' + who + when + '.';
  if (s.step === 'profile') return 'Profile opened' + who + when + '.';
  return '';
}

function personRow(it, p, stage) {
  const li = mk('li', 'mk-person' + (p.step && DONE_STEPS.includes(p.step.step) ? ' mk-done' : ''));
  const top = mk('div', 'mk-person-top');
  top.append(data_('span', 'mk-person-name', p.name));
  if (p.title) top.append(data_('span', 'mk-person-title', p.title));
  const from = mk('p', 'mk-person-from', 'Known from ' + (KNOWN_FROM[p.system] || 'your records') + (p.seen_at ? ', as of ' + day(p.seen_at) : '') + '.');
  const status = mk('p', 'mk-person-step state', stepWords(p.step));
  status.hidden = !status.textContent;
  const acts = mk('div', 'mk-acts');
  const note = mk('div', 'mk-note'); note.hidden = true;
  const write = mk('button', 'go', p.draft ? 'See the note' : 'Write a note'); write.type = 'button';
  write.addEventListener('click', () => { note.hidden = false; write.hidden = true; fillNote(note, it, p, false, status); });
  acts.appendChild(write);
  if (p.profile) {
    const prof = mk('a', 'go ghost', 'Open profile'); prof.href = p.profile; prof.target = '_blank'; prof.rel = 'noopener';
    prof.addEventListener('click', () => { rpc('job_alert_step', { p_key: it.key, p_person: p.id, p_step: 'profile', p_why: null }); });
    acts.appendChild(prof);
  }
  // SKIP, with why: for anyone she decides not to write to (email or LinkedIn).
  const skip = mk('button', 'go ghost', 'Skip'); skip.type = 'button';
  const skipSaid = mk('p', 'mk-said'); skipSaid.setAttribute('aria-live', 'polite');
  skip.addEventListener('click', () => {
    if (acts.querySelector('.mk-why')) return;
    const why = mk('input', 'mk-why'); why.type = 'text'; why.placeholder = 'Why skip this person?'; why.setAttribute('aria-label', 'Why skip this person?');
    const ok = mk('button', 'go ghost', 'Skip with this reason'); ok.type = 'button';
    ok.addEventListener('click', async () => {
      const s = await rpc('job_alert_step', { p_key: it.key, p_person: p.id, p_step: 'skipped', p_why: why.value });
      if (s.ok) { status.textContent = stepWords({ step: 'skipped', why: why.value, at: new Date().toISOString(), by: 'you' }); status.hidden = false; why.remove(); ok.remove(); skipSaid.textContent = ''; li.classList.add('mk-done'); }
      else { skipSaid.className = 'mk-said stalled'; skipSaid.textContent = 'Not recorded: ' + (s.reason || 'no reason was given') + '.'; }
    });
    acts.append(why, ok); why.focus();
  });
  acts.appendChild(skip);
  li.append(top, from, status, acts, skipSaid, note);
  return li;
}

async function fillNote(box, it, p, again, status) {
  box.innerHTML = '';
  const w = mk('p', 'working', again ? 'Writing it again' : 'Writing a short note in your voice');
  box.appendChild(w);
  const r = await post(DRAFT, { action: 'draft', key: it.key, person_id: p.id, again: !!again });
  box.innerHTML = '';
  if (!r || r.ok !== true || !r.draft) {
    box.append(mk('p', 'stalled', 'No note: ' + String((r && r.reason) || 'no reason was given') + '.'));
    const t = mk('button', 'go ghost', 'Try again'); t.type = 'button'; t.addEventListener('click', () => fillNote(box, it, p, true, status));
    box.appendChild(t);
    return;
  }
  const d = r.draft;
  if (d.ok === false) box.append(mk('p', 'stalled', 'This note broke one of your wording rules (' + String(d.fail || '') + '), so it is not ready. Write it again, or change it before you use it.'));
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  const mark = async (step, why) => {
    const s = await rpc('job_alert_step', { p_key: it.key, p_person: p.id, p_step: step, p_why: why || null });
    if (s.ok) { status.textContent = stepWords({ step, why, at: new Date().toISOString(), by: 'you' }); status.hidden = false; }
    else { said.className = 'mk-said stalled'; said.textContent = 'Not recorded: ' + (s.reason || 'no reason was given') + '.'; }
    return s.ok;
  };

  if (d.email !== null && d.email !== undefined && p.email) {
    const em = mk('div', 'mk-email');
    em.append(mk('p', 'mk-note-kind', 'Email'));
    const to = mk('p', 'mk-note-to'); to.append(mk('span', null, 'To '), data_('span', null, p.email));
    const subj = mk('input', 'mk-subject'); subj.type = 'text'; subj.value = d.subject || ''; subj.setAttribute('aria-label', 'Subject');
    const text = mk('textarea', 'mk-text'); text.rows = 7; text.value = d.email || ''; text.setAttribute('aria-label', 'Your email');
    const send = mk('button', 'go', 'Send from my mailbox'); send.type = 'button';
    send.addEventListener('click', async () => {
      const mailbox = String((C.viewer && C.viewer().email) || '').toLowerCase();
      if (!mailbox) { said.className = 'mk-said stalled'; said.textContent = 'Your mailbox is not known on this page, so nothing was sent.'; return; }
      const dd = { source_key: 'gmail:' + mailbox, thread_id: '', to: [p.email], cc: [], subject: subj.value, text: text.value };
      send.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Sending from ' + mailbox;
      const hash = await draftHash(dd);
      const j = await post(SEND, Object.assign({ action: 'send', hash }, dd));
      send.disabled = false;
      if (j && j.ok === true && j.sent) { said.className = 'mk-said state'; said.textContent = 'Sent. It is in your Sent folder in Gmail too.'; await mark('email_sent'); return; }
      const why = String((j && (j.reason || j.error)) || '');
      if (why.startsWith('test lock')) { said.className = 'mk-said mailx-compose-held'; said.textContent = 'Held, not sent. While the Tool’s own sending is being tested, it only sends to your own mailbox. Your words stay here.'; await mark('email_held'); return; }
      said.className = 'mk-said stalled'; said.textContent = 'Not sent: ' + (why || 'no reason was given') + '.';
    });
    em.append(to, subj, text, send);
    box.appendChild(em);
  }
  if (d.note !== null && d.note !== undefined && p.profile) {
    const li = mk('div', 'mk-linkedin');
    li.append(mk('p', 'mk-note-kind', 'LinkedIn message'));
    const text = mk('textarea', 'mk-text'); text.rows = 4; text.value = d.note || ''; text.setAttribute('aria-label', 'Your LinkedIn message');
    const row = mk('div', 'mk-acts');
    const copy = mk('button', 'go', 'Copy note'); copy.type = 'button';
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text.value); said.className = 'mk-said state'; said.textContent = 'Copied. Paste it in LinkedIn, then press Sent.'; }
      catch (_) { text.select(); said.className = 'mk-said state'; said.textContent = 'Selected. Copy it, paste it in LinkedIn, then press Sent.'; }
      mark('copied');
    });
    const prof = mk('a', 'go ghost', 'Open profile'); prof.href = p.profile; prof.target = '_blank'; prof.rel = 'noopener';
    prof.addEventListener('click', () => { mark('profile'); });
    const sent = mk('button', 'go ghost', 'Sent'); sent.type = 'button';
    sent.addEventListener('click', () => mark('sent'));
    row.append(copy, prof, sent);
    li.append(text, row);
    box.appendChild(li);
  }
  if (!p.email && !p.profile) box.append(mk('p', 'state', 'There is no email address or LinkedIn profile on file for this person.'));
  const redo = mk('button', 'go ghost', 'Write it again'); redo.type = 'button';
  redo.addEventListener('click', () => fillNote(box, it, p, true, status));
  box.append(said, redo);
}

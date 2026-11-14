// fill/marketing-send.js - THE MARKETING AND SALES TAB, part SENDING (seat marketing-parts, 2026-10-30, decisions 1039, 1044).
//
// WHAT IT DOES FOR HER. A campaign email goes to one of her lists in small daily batches, within her sending limits (seat
// rulings-1049, 2026-10-31; each step earned by opens since 2026-11-02, seat marketing-build-b): 50 a day to start, then 100, 250, then
// at most 500, everyone at most once in 30 days, and a pause by itself over 3 percent bounces or 0.1 percent complaints. She changes the
// limits here (Sending limits); the brain keeps them (mk_send_limits) and every batch obeys them. Every day's batch waits for
// her Approve. Before anyone goes in a batch the Tool checks: not emailed in the last 30 days, not unsubscribed, not at an
// active client, address never bounced; everyone left out says why. One-to-one notes go from her own mailbox (Signals and
// outreach); campaigns never do.
// THE ONE SEND PATH (seat campaign-engine, 2026-10-31, decision 1050): Approve hands the batch to mail-send, which sends it
// through the business's email engine (Elastic Email first) within 15 minutes, or holds it and says why: a rule below not met,
// or mail-send's test lock (while sending is being proven only the sending address itself gets mail). BEFORE THE FIRST SEND
// shows the rules every campaign email meets, each checked, and what to add when one is not met: the postal address (in every
// footer), a sending address on a subdomain of her domain, the engine connected, the domain verified there with SPF, DKIM and
// DMARC passing. The checks are the brain's (mk_send_rules), read live from the engine by mail-send; this screen only shows them.
// Drawn from what the brain returns (mk_send_view); the brain refuses anyone but the owner or a marketing colleague (since 2026-11-02, decision 1058), with the reason.
// No colour, size or font here; no regex literals, no backslashes.

let C = null;
let STAGE = null;   // the part's own section; every change redraws it whole
// ROUND 2 (seat marketing-build-b, 2026-11-02, decision 1059, approved design Ha5qD1aq92RUxXAiwzY9h3 v7): SENDING IS A COCKPIT.
// One question ("Can we send today, and how much?"), one picture (sent today of allowed, the warm-up ladder with the step lit and
// what earns the next one, two health meters against their pause marks, the August block as context, the complete do-not-send
// count), the batches waiting, and ONE next step. Drawn from ONE reader, mk_cockpit (brain). Approve is pressed by Erin or Alex
// (decision 1058 (4)); starting a campaign and changing the limits stay with the owner. WARM-UP BY OPENS (this seat's brain file
// 1): the next step is earned when at least 20 percent of what went out at a step is opened, not when a week has passed
// (rulings-1049's calendar weeks are superseded, seat marketing-build-b, 2026-11-02).
// Nothing sends while mail-send's test lock is on; the cockpit says so. The campaigns, the rules every email meets and the
// limits are kept one press below. Mount contract with seat marketing-build-a: mount(el, ctx); drawSend stays for today's shell.
const OUT = { emailed: 'emailed by you recently', campaign_recent: 'had a campaign email recently', note_recent: 'had a note about a job recently',
  unsubscribed: 'unsubscribed', client: 'at a current client', bounced: 'their address bounced before' };
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const day = (iso) => { if (!iso) return ''; const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

// THE CAMPAIGNS AND SETTINGS (earlier rounds), one press below the cockpit since round 2.
async function drawDetail(stage) {
  const w = mk('p', 'working no-late', 'Reading your campaigns');
  stage.appendChild(w);
  const v = await rpc('mk_send_view', {});
  w.remove();
  if (!v || v.ok !== true) { stage.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((v && (v.reason || v.error)) || 'no reason was given') + '.')); return; }
  for (const c of (v.campaigns || [])) stage.appendChild(campaignCard(stage, c));
  stage.appendChild(startBox(stage, v.lists || []));
  stage.appendChild(readyPart(stage, v.sending || {}, v.ready || null, v.engine || null));
  stage.appendChild(limitsPart(stage, v.limits || {}, v.today || {}));
}

// BEFORE THE FIRST SEND (seat campaign-engine): what every campaign email needs, each rule checked, and what to add.
const RULE = { postal_address: 'Postal address', sending_subdomain: 'Sending address', engine: 'Email engine', domain_verified: 'Sending domain', spf: 'SPF', dkim: 'DKIM', dmarc: 'DMARC' };
function readyPart(stage, S, R, E) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Before the First Send'));
  sec.appendChild(mk('p', 'state', 'Every campaign email carries your postal address and a one-click unsubscribe, and goes from a sending address on a subdomain of your domain, so your own mail keeps its good name.'));
  const checks = (R && Array.isArray(R.checks)) ? R.checks : [];
  if (!checks.length) sec.appendChild(mk('p', 'quiet', 'The checks run with the next send run, within 15 minutes of a change.'));
  for (const c of checks) {
    sec.appendChild(mk('p', c.ok ? 'state' : 'stalled', (c.ok ? 'Done. ' : 'Not yet. ') + (RULE[c.check] || c.check) + ': ' + String(c.said || '')));
    if (!c.ok && c.fix) sec.appendChild(mk('p', 'quiet', 'What to do: ' + String(c.fix)));
  }
  if (R && R.checked_at) sec.appendChild(mk('p', 'quiet', (R.ok ? 'Ready to send. ' : '') + 'Checked ' + day(R.checked_at) + (E && E.name ? ', with ' + E.name : '') + '.'));
  const det = C.el('details');
  if (!S.postal_address || !S.sending_from) det.open = true;
  det.appendChild(mk('summary', 'mk-hand-label', 'Your Address and Sending Address'));
  const fields = [['postal_address', 'Postal Address (Street, Town, Postal Code)'], ['sending_from', 'Sending address, for example news@mail.yourdomain.com'], ['sending_name', 'Sender Name']];
  const inputs = {};
  for (const [k, label] of fields) {
    const lab = mk('label', 'mk-hand-label', label);
    const i = C.el('input'); i.type = k === 'sending_from' ? 'email' : 'text'; i.className = 'mk-why'; i.value = S[k] ? String(S[k]) : '';
    inputs[k] = i; lab.appendChild(i); det.appendChild(lab);
  }
  const save = mk('button', 'go ghost', 'Save'); save.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  save.addEventListener('click', async () => {
    const body = {};
    for (const k of Object.keys(inputs)) if (inputs[k].value.trim() !== '' && inputs[k].value.trim() !== String(S[k] || '')) body[k] = inputs[k].value.trim();
    if (!Object.keys(body).length) { said.className = 'mk-said'; said.textContent = 'Nothing changed.'; return; }
    save.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Saving';
    const r = await rpc('mk_sending_set', { p_set: body });
    save.disabled = false;
    if (r && r.ok === true) { mount(STAGE, C); return; }
    said.className = 'mk-said stalled'; said.textContent = 'Not saved: ' + String((r && r.reason) || 'no reason was given');
  });
  det.append(save, said);
  sec.appendChild(det);
  return sec;
}

// SENDING LIMITS (seat rulings-1049, 2026-10-31): the numbers every batch obeys, in words, and changeable here by the owner.
const LIMITS = [
  ['week1', 'People a Day, First Step'], ['week2', 'People a Day, Second Step'], ['week3', 'People a Day, Third Step'], ['day_max', 'At Most, a Day, After That'],
  ['campaign_gap_days', 'Days Between Two Campaign Emails to the Same Person'], ['note_gap_days', 'Days Between Two Job Notes to the Same Person'],
  ['bounce_pause_pct', "Pause When a Day's Bounces Pass (Percent)"], ['complaint_pause_pct', "Pause When a Day's Spam Complaints Pass (Percent)"],
];
function limitsPart(stage, L, T) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Sending Limits'));
  for (const line of [
    'Warm-up: ' + n0(L.week1) + ' people a day to start, then ' + n0(L.week2) + ', then ' + n0(L.week3) + ', then at most ' + n0(L.day_max) + ' a day, all campaigns together. Each next step is earned by opens, not by time: after ' + n0(L.earn_days || 2) + ' full days at a step, when at least ' + (L.earn_open_pct || 20) + ' percent of those emails were opened and bounces stayed under the pause limit.',
    'The same person gets a campaign email at most once every ' + n0(L.campaign_gap_days) + ' days, and a note about a job at most once every ' + n0(L.note_gap_days) + ' days. Nobody who unsubscribed ever gets one.',
    "Sending pauses by itself, and says why, when a day's bounces pass " + L.bounce_pause_pct + ' percent or its spam complaints pass ' + L.complaint_pause_pct + ' percent.',
    'Before anyone goes in a batch: not at a current client, address never bounced. Everyone left out says why.',
    'One-to-one notes go from your own mailbox, in Signals and outreach. Campaigns never do.',
  ]) sec.appendChild(mk('p', 'state', line));
  if (T && T.size !== undefined) sec.appendChild(mk('p', 'quiet', T.pause ? String(T.why || 'Sending is paused.') : 'Today: step ' + n0(T.step || T.week) + ', up to ' + n0(T.size) + ' people can go out.'));
  sec.appendChild(mk('p', 'quiet', String(L.said || '') + (L.set_at ? ' (' + day(L.set_at) + ')' : '')));
  const det = C.el('details');
  det.appendChild(mk('summary', 'mk-hand-label', 'Change the Limits'));
  const inputs = {};
  for (const [k, label] of LIMITS) {
    const lab = mk('label', 'mk-hand-label', label);
    const i = C.el('input'); i.type = 'number'; i.className = 'mk-why'; i.value = L[k] === undefined || L[k] === null ? '' : String(L[k]);
    i.step = k.endsWith('_pct') ? '0.1' : '1'; i.min = k.endsWith('_pct') ? '0.1' : '1';
    inputs[k] = i; lab.appendChild(i); det.appendChild(lab);
  }
  const save = mk('button', 'go ghost', 'Save the Limits'); save.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  save.addEventListener('click', async () => {
    const body = {};
    for (const k of Object.keys(inputs)) if (inputs[k].value !== '') body[k] = Number(inputs[k].value);
    save.disabled = true; said.textContent = '';
    const r = await rpc('mk_limits_set', { p_limits: body });
    save.disabled = false;
    if (r && r.ok === true) { mount(STAGE, C); return; }
    said.className = 'mk-said stalled'; said.textContent = 'Not saved: ' + String((r && r.reason) || 'no reason was given');
  });
  det.append(save, said);
  sec.appendChild(det);
  return sec;
}

function startBox(stage, lists) {
  const box = mk('section', 'mk-hand');
  box.appendChild(mk('h3', 'mk-sub', 'Start a Campaign'));
  if (!lists.length) { box.appendChild(mk('p', 'quiet', 'Make a list first, in Lists. A campaign goes to one list.')); return box; }
  const lab = mk('label', 'mk-hand-label', 'To the List');
  const sel = mk('select', 'mk-hand-pick');
  for (const l of lists) { const o = document.createElement('option'); o.value = l.id; o.textContent = l.question + ' (' + n0(l.in) + ')'; o.translate = false; sel.appendChild(o); }
  lab.appendChild(sel);
  const sl = mk('label', 'mk-hand-label', 'Subject');
  const subj = mk('input', 'mk-subject'); subj.type = 'text'; subj.setAttribute('aria-label', 'Subject'); sl.appendChild(subj);
  const bl = mk('label', 'mk-hand-label', 'The Email');
  const body = mk('textarea', 'mk-text'); body.rows = 7; body.setAttribute('aria-label', 'The Email'); bl.appendChild(body);
  const go = mk('button', 'go', 'Start the Campaign'); go.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  go.addEventListener('click', async () => {
    go.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Checking the words and making the first batch';
    const r = await rpc('mk_campaign_make', { p_list: sel.value, p_subject: subj.value, p_body: body.value, p_plan_item: null });
    go.disabled = false;
    if (!r.ok) { said.className = 'mk-said stalled'; said.textContent = 'Not started: ' + (r.reason || 'no reason was given'); return; }
    mount(STAGE, C);
  });
  box.append(lab, sl, bl, go, said);
  return box;
}

function campaignCard(stage, c) {
  const li = mk('section', 'mk-item');
  li.appendChild(data_('p', 'mk-item-line', c.subject));
  const to = mk('p', 'mk-item-known'); to.append(mk('span', null, 'To the list: '), data_('span', null, c.list || ''));
  li.appendChild(to);
  const pw = String(c.paused_why || '');
  const st = c.state === 'paused' ? (pw.startsWith('Paused:') ? pw + ' It stays paused until you press Resume.' : 'Paused by itself: ' + pw.replace('bounces', 'too many bounces').replace('complaints', 'too many complaints') + ' in the last batch.')
    : (c.state === 'done' ? 'Done: everyone on the list who may be emailed has had it.' : 'Running since ' + day(c.made_at) + '.');
  li.appendChild(mk('p', c.state === 'paused' ? 'stalled' : 'state', st));
  for (const b of (c.batches || []).slice(0, 5)) li.appendChild(batchRow(stage, b));
  const acts = mk('div', 'mk-acts');
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  const set = async (state) => { const r = await rpc('mk_campaign_set', { p_campaign: c.id, p_state: state }); if (r.ok) mount(STAGE, C); else { said.className = 'mk-said stalled'; said.textContent = 'Not changed: ' + (r.reason || 'no reason was given') + '.'; } };
  if (c.state === 'paused') { const r = mk('button', 'go ghost', 'Resume'); r.type = 'button'; r.addEventListener('click', () => set('running')); acts.appendChild(r); }
  if (c.state === 'running' || c.state === 'paused') { const s = mk('button', 'go ghost', 'Stop This Campaign'); s.type = 'button'; s.addEventListener('click', () => set('stopped')); acts.appendChild(s); }
  li.append(acts, said);
  return li;
}

function batchRow(stage, b) {
  const box = mk('div', 'mk-person');
  let line = day(b.day) + ': ' + n0(b.in) + ' ' + (Number(b.in) === 1 ? 'person' : 'people') + '. ';
  const hw = String(b.held_why || '');
  if (b.state === 'waiting') line += 'Waiting for your Approve.';
  else if (b.state === 'approved') line += 'You approved it on ' + day(b.approved_at) + '. It goes out with the next send run, within 15 minutes.';
  else if (b.state === 'sending') line += 'Going out now.';
  else if (b.state === 'held') line += 'You approved it on ' + day(b.approved_at) + '. ' + (hw === 'held_test_lock' || hw.startsWith('test lock') ? 'Held, not sent, while sending is being tested: for now only your own sending address gets mail.' : (hw.startsWith('Not sent: ') ? 'Held. ' + hw : 'Held, not sent' + (hw ? ': ' + hw : '.')));
  else line += 'Sent ' + n0(b.sent) + ', ' + n0(b.bounces) + ' bounced, ' + n0(b.complaints) + ' ' + (Number(b.complaints) === 1 ? 'complaint' : 'complaints') + '.';
  box.appendChild(mk('p', 'state', line));
  const lo = b.left_out || {};
  const parts = Object.keys(lo).map((k) => n0(lo[k]) + ' ' + (OUT[k] || k));
  if (parts.length) box.appendChild(mk('p', 'quiet', 'Left out: ' + parts.join(', ') + '.'));
  const acts = mk('div', 'mk-acts');
  const out = mk('div');
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  if (b.state === 'waiting') {
    const a = mk('button', 'go', 'Approve'); a.type = 'button';
    a.addEventListener('click', async () => { a.disabled = true; const r = await rpc('mk_batch_approve', { p_batch: b.id }); if (r.ok) mount(STAGE, C); else { a.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not approved: ' + (r.reason || 'no reason was given') + '.'; } });
    acts.appendChild(a);
  }
  const who = mk('button', 'go ghost', 'Who Is in It'); who.type = 'button';
  who.addEventListener('click', () => people(out, b.id, true));
  acts.appendChild(who);
  if (parts.length) { const w2 = mk('button', 'go ghost', 'Who Is Left Out and Why'); w2.type = 'button'; w2.addEventListener('click', () => people(out, b.id, false)); acts.appendChild(w2); }
  box.append(acts, said, out);
  return box;
}

async function people(host, batch, inside) {
  host.innerHTML = '';
  const w = mk('p', 'working no-late', 'Reading the people in this batch'); host.appendChild(w);
  const r = await rpc('mk_batch_people', { p_batch: batch, p_in: inside });
  w.remove();
  if (!r.ok) { host.appendChild(mk('p', 'notice flagged', 'This could not be read: ' + (r.reason || 'no reason was given') + '.')); return; }
  const ul = mk('ul', 'mk-person-list');
  for (const p of (r.people || [])) {
    const li = mk('li', 'mk-person');
    li.appendChild(data_('span', 'mk-person-name', p.name || p.address));
    if (p.why_out) li.appendChild(mk('p', 'stalled', 'Left out: ' + (OUT[p.why_out] || p.why_out) + (p.why_out === 'emailed' && p.detail && p.detail.last_out ? ' (last on ' + day(p.detail.last_out) + ')' : '') + ((p.why_out === 'campaign_recent' || p.why_out === 'note_recent') && p.detail && p.detail.last ? ' (last on ' + day(p.detail.last) + ', the limit is one every ' + n0(p.detail.gap) + ' days)' : '') + '.'));
    ul.appendChild(li);
  }
  host.appendChild(ul);
}

// ── ROUND 2: THE COCKPIT (seat marketing-build-b) ───────────────────────────────────────────────────────────────────────────
const mon = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); };

const STYLE = 'marketing-r2.css?v=2026-11-02-marketing-build-b';   // this part's look (seat marketing-build-b), loaded once by whichever part mounts first
const ensureStyle = () => { try { if (!document.querySelector('link[data-mk-r2]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(STYLE, import.meta.url).href; l.setAttribute('data-mk-r2', '1'); document.head.appendChild(l); } } catch (e) { /* no document: tests */ } };
export async function mount(stage, ctx) {
  ensureStyle();
  C = Object.assign({ el: (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; } }, ctx || {});
  STAGE = stage;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Sending'), mk('p', 'mk-lede', 'Can we send today, and how much?'));
  stage.appendChild(head);
  const w = mk('p', 'working no-late', "Reading today's sending");
  stage.appendChild(w);
  const v = await rpc('mk_cockpit', {});
  w.remove();
  if (!v || v.ok !== true) { stage.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((v && (v.reason || v.error)) || 'no reason was given') + '.')); return; }
  stage.appendChild(gauge(v));
  stage.appendChild(health(v));
  stage.appendChild(waiting(v));
  stage.appendChild(mk('p', 'notice', "Nothing goes to anyone yet: the Tool's own sending is locked while it is tested. A batch you approve is held, and says why."));
  const det = mk('details', 'mk-hand');
  det.appendChild(mk('summary', 'mk-hand-label', 'Campaigns, the Rules Every Email Meets, and the Limits'));
  const host = mk('div');
  det.appendChild(host);
  let drawn = false;
  det.addEventListener('toggle', () => { if (det.open && !drawn) { drawn = true; drawDetail(host); } });
  stage.appendChild(det);
}
export const drawSend = (stage, ctx) => mount(stage, ctx);
try { window.MK_PARTS = Object.assign(window.MK_PARTS || {}, { send: { mount } }); } catch (e) { /* no window: tests */ }

function gauge(v) {
  const sec = mk('section', 'mk-gauge');
  const t = v.today || {}, wu = v.warmup || {}, e = wu.earn || {};
  const big = mk('p', 'mk-big');
  big.append(mk('span', 'mk-big-n', n0(t.sent)), mk('span', 'mk-big-of', 'sent today of ' + n0(t.allowed) + ' allowed'));
  sec.appendChild(big);
  if (t.paused) { sec.appendChild(mk('p', 'stalled', String(wu.why || 'Sending is paused.'))); return sec; }
  const lad = mk('ol', 'mk-ladder');
  (wu.ladder || []).forEach((n, i) => {
    const li = mk('li', 'mk-step' + (i + 1 === Number(wu.step) ? ' mk-step-on' : (i + 1 < Number(wu.step) ? ' mk-step-done' : '')), n0(n) + ' a day');
    if (i + 1 === Number(wu.step)) li.setAttribute('aria-current', 'step');
    lad.appendChild(li);
  });
  sec.appendChild(lad);
  if (e.next) {
    sec.appendChild(mk('p', 'state', 'The next step, ' + n0(e.next) + ' a day, is earned by opens, not by time: once ' + n0(e.need_sent) + ' emails have gone out at this step and at least '
      + e.open_pct + ' percent of them were opened. So far at this step: ' + n0(e.sent) + ' sent, ' + n0(e.opened) + ' opened.'));
  } else sec.appendChild(mk('p', 'state', 'At the top step: at most ' + n0(t.allowed) + ' a day.'));
  return sec;
}

function meter(label, value, mark, unit) {
  const box = mk('div', 'mk-meter');
  const bar = mk('div', 'mk-meter-bar');
  const fill = mk('span', 'mk-meter-fill' + (Number(value) > Number(mark) ? ' mk-meter-over' : ''));
  const full = Math.max(Number(mark) * 2, Number(value), 0.0001);
  fill.style.width = Math.min(100, (Number(value) / full) * 100) + '%';
  const tick = mk('span', 'mk-meter-mark'); tick.style.left = Math.min(100, (Number(mark) / full) * 100) + '%';
  bar.append(fill, tick);
  bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', label + ' ' + value + unit + ', pause at ' + mark + unit);
  box.append(mk('p', 'mk-meter-label', label + ': ' + value + unit + ' (sending pauses above ' + mark + unit + ')'), bar);
  return box;
}

function health(v) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Health'));
  const h = v.health, L = v.limits || {};
  if (h) {
    sec.appendChild(mk('p', 'quiet', 'Your last sending month, ' + mon(h.month) + ': ' + n0(h.sent) + ' sent, ' + n0(h.delivered) + ' delivered, ' + h.open_pct + ' percent opened.'));
    sec.appendChild(meter('Bounces', Number(h.bounce_pct || 0), Number(L.bounce_pause_pct || 3), ' percent'));
    sec.appendChild(meter('Marked as spam', Number(h.complaint_pct || 0), Number(L.complaint_pause_pct || 0.1), ' percent'));
  } else sec.appendChild(mk('p', 'quiet', 'No sending month has been read from your email engine yet.'));
  const b = v.block;
  if (b) sec.appendChild(mk('p', 'state', 'Why the start is small: in ' + mon(b.month) + ' Google blocked the newsletter (' + n0(b.bounced) + ' of ' + n0(b.sent)
    + ' emails bounced, ' + b.bounce_pct + ' percent). The cause was fixed on August 21 (SPF), and a new sending address is warming up.'));
  const d = v.dns || {};
  sec.appendChild(mk('p', 'state', 'Never emailed: ' + n0(d.total) + ' addresses (' + n0(d.unsubscribed) + ' unsubscribed or marked an email as spam, ' + n0(d.bounced)
    + ' bounced), every one your email engine holds' + (d.engine_read_at ? ', read ' + day(d.engine_read_at) : '') + '.'));
  return sec;
}

function waiting(v) {
  const sec = mk('section', 'mk-hand');
  sec.appendChild(mk('h3', 'mk-sub', 'Next Step'));
  const ws = v.waiting || [];
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  if (ws.length) {
    const x = ws[0];
    const a = mk('button', 'go', 'Approve ' + x.subject + ' · ' + n0(x.in) + ' people'); a.type = 'button';
    a.addEventListener('click', async () => {
      a.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Approving';
      const r = await rpc('mk_batch_approve', { p_batch: x.batch });
      if (r.ok) { mount(STAGE, C); return; }
      a.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not approved: ' + (r.reason || 'no reason was given') + '.';
    });
    sec.appendChild(a);
    if (ws.length > 1) sec.appendChild(mk('p', 'quiet', 'And ' + n0(ws.length - 1) + ' more waiting, below under Campaigns.'));
  } else if (!Number(v.lists)) {
    sec.appendChild(mk('p', 'state', 'Nothing is waiting for approval. First make the warm-up list: Lists, Make this list.'));
  } else if (!Number(v.campaigns)) {
    sec.appendChild(mk('p', 'state', 'Nothing is waiting for approval. Start the first campaign to your warm-up list: below, Campaigns, Start a campaign.'));
  } else sec.appendChild(mk('p', 'state', 'Nothing is waiting for approval.' + (Number(v.held) ? ' ' + n0(v.held) + ' approved ' + (Number(v.held) === 1 ? 'batch is' : 'batches are') + ' held while sending is locked.' : '')));
  sec.appendChild(said);
  return sec;
}

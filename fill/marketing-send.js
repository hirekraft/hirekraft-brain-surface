// fill/marketing-send.js - THE MARKETING AND SALES TAB, part SENDING (seat marketing-parts, 2026-10-30, decisions 1039, 1044).
//
// WHAT IT DOES FOR HER. A campaign email goes to one of her lists in small daily batches. The first is 50; each next one grows
// only while bounces and complaints stay low, and the campaign pauses by itself if either rises. Every day's batch waits for
// her Approve. Before anyone goes in a batch the Tool checks: not emailed in the last 30 days, not unsubscribed, not at an
// active client, address never bounced; everyone left out says why. One-to-one notes go from her own mailbox (Signals and
// outreach); campaigns never do.
// NOTHING IS SENT FROM HERE YET: the one send path (mail-send) stays behind its test lock and the email marketing system is
// not connected, so an approved batch is held and says so. The rules are real and proven with planted data in the brain.
// Drawn from what the brain returns (mk_send_view); the brain refuses anyone but the owner, with the reason.
// No colour, size or font here; no regex literals, no backslashes.

let C = null;
const OUT = { emailed: 'emailed in the last 30 days', unsubscribed: 'unsubscribed', client: 'at an active client', bounced: 'their address bounced before' };
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

export async function drawSend(stage, ctx) {
  C = ctx;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Sending'), mk('p', 'mk-lede', 'Campaign emails go out in small daily batches you approve, growing only while they land well.'));
  stage.appendChild(head);
  const w = mk('p', 'working no-late', 'Reading your campaigns');
  stage.appendChild(w);
  const v = await rpc('mk_send_view', {});
  w.remove();
  if (!v || v.ok !== true) { stage.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((v && (v.reason || v.error)) || 'no reason was given') + '.')); return; }
  stage.appendChild(mk('p', 'notice', "Nothing is sent yet. The Tool's own sending is being tested and your email marketing system is not connected, so a batch you approve is held, and says so."));
  for (const c of (v.campaigns || [])) stage.appendChild(campaignCard(stage, c));
  stage.appendChild(startBox(stage, v.lists || []));
  const rules = mk('section', 'mk-people');
  rules.appendChild(mk('h3', 'mk-sub', 'How it sends'));
  for (const line of [
    'The first batch is 50 people. The next is half again as big, up to 500 a day, only while fewer than 2 in 100 bounce and nobody complains.',
    'At 5 in 100 bounces, or 3 complaints in 1,000, the campaign pauses by itself and tells you.',
    'Before anyone goes in a batch: not emailed in the last 30 days, not unsubscribed, not at an active client, and their address never bounced. Everyone left out says why.',
    "Erin has not shared a chat about sending, so these are the Tool's rules for now.",
    'One-to-one notes go from your own mailbox, in Signals and outreach. Campaigns never do.',
  ]) rules.appendChild(mk('p', 'state', line));
  stage.appendChild(rules);
}

function startBox(stage, lists) {
  const box = mk('section', 'mk-hand');
  box.appendChild(mk('h3', 'mk-sub', 'Start a campaign'));
  if (!lists.length) { box.appendChild(mk('p', 'quiet', 'Make a list first, in Plan. A campaign goes to one list.')); return box; }
  const lab = mk('label', 'mk-hand-label', 'To the list');
  const sel = mk('select', 'mk-hand-pick');
  for (const l of lists) { const o = document.createElement('option'); o.value = l.id; o.textContent = l.question + ' (' + n0(l.in) + ')'; o.translate = false; sel.appendChild(o); }
  lab.appendChild(sel);
  const sl = mk('label', 'mk-hand-label', 'Subject');
  const subj = mk('input', 'mk-subject'); subj.type = 'text'; subj.setAttribute('aria-label', 'Subject'); sl.appendChild(subj);
  const bl = mk('label', 'mk-hand-label', 'The email');
  const body = mk('textarea', 'mk-text'); body.rows = 7; body.setAttribute('aria-label', 'The email'); bl.appendChild(body);
  const go = mk('button', 'go', 'Start the campaign'); go.type = 'button';
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  go.addEventListener('click', async () => {
    go.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Checking the words and making the first batch';
    const r = await rpc('mk_campaign_make', { p_list: sel.value, p_subject: subj.value, p_body: body.value, p_plan_item: null });
    go.disabled = false;
    if (!r.ok) { said.className = 'mk-said stalled'; said.textContent = 'Not started: ' + (r.reason || 'no reason was given'); return; }
    drawSend(stage, C);
  });
  box.append(lab, sl, bl, go, said);
  return box;
}

function campaignCard(stage, c) {
  const li = mk('section', 'mk-item');
  li.appendChild(data_('p', 'mk-item-line', c.subject));
  const to = mk('p', 'mk-item-known'); to.append(mk('span', null, 'To the list: '), data_('span', null, c.list || ''));
  li.appendChild(to);
  const st = c.state === 'paused' ? 'Paused by itself: ' + String(c.paused_why || '').replace('bounces', 'too many bounces').replace('complaints', 'too many complaints') + ' in the last batch.'
    : (c.state === 'done' ? 'Done: everyone on the list who may be emailed has had it.' : 'Running since ' + day(c.made_at) + '.');
  li.appendChild(mk('p', c.state === 'paused' ? 'stalled' : 'state', st));
  for (const b of (c.batches || []).slice(0, 5)) li.appendChild(batchRow(stage, b));
  const acts = mk('div', 'mk-acts');
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  const set = async (state) => { const r = await rpc('mk_campaign_set', { p_campaign: c.id, p_state: state }); if (r.ok) drawSend(stage, C); else { said.className = 'mk-said stalled'; said.textContent = 'Not changed: ' + (r.reason || 'no reason was given') + '.'; } };
  if (c.state === 'paused') { const r = mk('button', 'go ghost', 'Resume'); r.type = 'button'; r.addEventListener('click', () => set('running')); acts.appendChild(r); }
  if (c.state === 'running' || c.state === 'paused') { const s = mk('button', 'go ghost', 'Stop this campaign'); s.type = 'button'; s.addEventListener('click', () => set('stopped')); acts.appendChild(s); }
  li.append(acts, said);
  return li;
}

function batchRow(stage, b) {
  const box = mk('div', 'mk-person');
  let line = day(b.day) + ': ' + n0(b.in) + ' ' + (Number(b.in) === 1 ? 'person' : 'people') + '. ';
  if (b.state === 'waiting') line += 'Waiting for your Approve.';
  else if (b.state === 'held') line += 'You approved it on ' + day(b.approved_at) + '. Held, not sent, while sending is being tested.';
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
    a.addEventListener('click', async () => { a.disabled = true; const r = await rpc('mk_batch_approve', { p_batch: b.id }); if (r.ok) drawSend(stage, C); else { a.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not approved: ' + (r.reason || 'no reason was given') + '.'; } });
    acts.appendChild(a);
  }
  const who = mk('button', 'go ghost', 'Who is in it'); who.type = 'button';
  who.addEventListener('click', () => people(out, b.id, true));
  acts.appendChild(who);
  if (parts.length) { const w2 = mk('button', 'go ghost', 'Who is left out and why'); w2.type = 'button'; w2.addEventListener('click', () => people(out, b.id, false)); acts.appendChild(w2); }
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
    if (p.why_out) li.appendChild(mk('p', 'stalled', 'Left out: ' + (OUT[p.why_out] || p.why_out) + (p.why_out === 'emailed' && p.detail && p.detail.last_out ? ' (last on ' + day(p.detail.last_out) + ')' : '') + '.'));
    ul.appendChild(li);
  }
  host.appendChild(ul);
}

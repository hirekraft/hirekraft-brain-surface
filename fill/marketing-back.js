// fill/marketing-back.js - THE MARKETING AND SALES TAB, part WHAT CAME BACK (seat marketing-parts, 2026-10-30, decisions 1039, 1044).
//
// WHAT IT DOES FOR HER. Everything that came back from what she sent through the Tool, without her looking for it: replies,
// calls booked (a meeting invitation from that person), openings received (a reply the mail sorter reads as a requirement),
// each linked to the piece that brought it (the note about a hiring company, or the campaign email to a list), and which list
// and which kind of note brought replies. Measured in conversations, not opens (decision 1039); opens show as a signal only.
// Filled by itself every 15 minutes from the mail the Tool reads (mk_back_scan); Elastic Email and the website add their
// events when they are connected (seat systems-connect), and until then the screen says so. Each campaign's results from the
// email engine (delivered, opened, clicked, bounced, marked as spam, unsubscribed) are read back every 15 minutes by mail-send's
// campaign run (seat campaign-engine, 2026-10-31, decision 1050) and shown per campaign below; each person's in Latest.
// Drawn from what the brain returns (mk_back_view); the brain refuses anyone but the owner, with the reason.
// YOUR EMAIL HISTORY (seat elastic-history, 2026-11-01, decision 1054 item 1): everything the business sent through its email
// engine before and outside the Tool, kept by system-read's walk and returned by the one reader (mk_engine_history_for, in
// mk_back_view as history): every month's statistics, each person's lifetime opens and clicks, campaigns by name with replies
// from the mailbox, who opened the last three, the sending domains by name, and what the engine would not let the Tool read.
// No colour, size or font here; no regex literals, no backslashes.

let C = null;
const KIND = { reply: 'Reply', call_booked: 'Call booked', opening: 'Opening received', open: 'Opened', click: 'Clicked', unsubscribe: 'Unsubscribed', bounce: 'Bounced', complaint: 'Marked as spam', delivered: 'Delivered' };
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const day = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const time = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

export async function drawBack(stage, ctx) {
  C = ctx;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'What came back'), mk('p', 'mk-lede', 'Replies, calls booked and openings that came from what you sent, each linked to what brought it. It fills by itself.'));
  stage.appendChild(head);
  const w = mk('p', 'working no-late', 'Reading what came back');
  stage.appendChild(w);
  let r;
  try { const { data: d, error } = await C.sb.rpc('mk_back_view', {}); r = error ? { ok: false, reason: error.message } : d; }
  catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  w.remove();
  if (!r || r.ok !== true) { stage.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((r && (r.reason || r.error)) || 'no reason was given') + '. Nothing here is a claim either way.')); return; }
  // the business's whole sending history first: it is most of what there is to see until the Tool itself sends
  const h = r.history;
  if (h && h.status === 'kept') drawHistory(stage, h);
  else if (h && h.said) stage.appendChild(mk('p', 'quiet', h.said));
  const s = r.sent || {};
  const c = r.counts || {};
  const sent = Number(s.notes || 0) + Number(s.batch_emails || 0);
  const sec = mk('section', 'mk-roles');
  if (!sent) {
    sec.appendChild(mk('p', 'state', 'Nothing has gone out through the Tool in the last 90 days, so nothing has come back yet.'));
    if (Number(s.held)) sec.appendChild(mk('p', 'quiet', n0(s.held) + ' ' + (Number(s.held) === 1 ? 'note was' : 'notes were') + " held, not sent, while the Tool's own sending is being tested."));
  } else {
    sec.appendChild(mk('p', 'state', 'Sent through the Tool in the last 90 days: ' + n0(s.notes) + ' personal ' + (Number(s.notes) === 1 ? 'note' : 'notes') + ' and ' + n0(s.batch_emails) + ' campaign ' + (Number(s.batch_emails) === 1 ? 'email' : 'emails') + '.'));
    const tally = ['reply', 'call_booked', 'opening'].map((k) => KIND[k] + ': ' + n0(c[k])).join(' · ');
    sec.appendChild(mk('p', 'mk-item-line', tally));
    if (Number(c.open) || Number(c.click)) sec.appendChild(mk('p', 'quiet', 'Opened ' + n0(c.open) + ', clicked ' + n0(c.click) + '. Opens are a signal only: many mail programs open emails by themselves.'));
  }
  stage.appendChild(sec);

  const ev = r.events || [];
  if (ev.length) {
    const box = mk('section', 'mk-people');
    box.appendChild(mk('h3', 'mk-sub', 'Latest'));
    const ul = mk('ul', 'mk-person-list');
    for (const e of ev) {
      const li = mk('li', 'mk-person');
      const top = mk('div', 'mk-person-top');
      top.append(mk('span', 'mk-person-title', KIND[e.kind] || e.kind), document.createTextNode(' '), data_('span', 'mk-person-name', e.name || ''));
      li.appendChild(top);
      const from = mk('p', 'mk-person-from');
      if (e.piece === 'note') { from.appendChild(mk('span', null, 'From your note about ')); from.appendChild(data_('span', null, e.company || '')); }
      else { from.appendChild(mk('span', null, 'From the campaign email to ')); from.appendChild(data_('span', null, e.list || '')); }
      from.appendChild(mk('span', null, ', sent ' + day(e.sent_at) + '. Came back ' + time(e.at) + '.'));
      li.appendChild(from);
      ul.appendChild(li);
    }
    box.appendChild(ul);
    stage.appendChild(box);
  }

  const what = mk('section', 'mk-people');
  if ((r.by_list || []).length || (r.by_kind || []).length) {
    what.appendChild(mk('h3', 'mk-sub', 'What brought replies'));
    for (const k of (r.by_kind || [])) what.appendChild(mk('p', 'state', (k.piece === 'note' ? 'Personal notes' : 'Campaign emails') + ': ' + n0(k.replies) + ' of ' + n0(k.sent) + ' brought a reply, a call or an opening.'));
    for (const l of (r.by_list || [])) {
      const p = mk('p', 'state');
      p.append(data_('span', null, l.list), mk('span', null, ': ' + n0(l.replies) + ' of ' + n0(l.sent) + ' people answered.'));
      what.appendChild(p);
    }
  }
  if ((r.by_campaign || []).length) {
    what.appendChild(mk('h3', 'mk-sub', 'Each campaign, from your email engine'));
    for (const k of r.by_campaign) {
      const p = mk('p', 'state');
      p.append(data_('span', null, k.subject), mk('span', null, ': sent ' + n0(k.sent) + ', delivered ' + n0(k.delivered) + ', opened ' + n0(k.opened) + ', clicked ' + n0(k.clicked) + ', bounced ' + n0(k.bounced) + ', marked as spam ' + n0(k.complaints) + ', unsubscribed ' + n0(k.unsubscribed) + '.'));
      what.appendChild(p);
    }
  }
  what.appendChild(mk('p', 'state', 'Read from the mailboxes the Tool reads, every 15 minutes' + (r.scanned_at ? ' (last ' + time(r.scanned_at) + ')' : '') + '.'));
  if (!r.elastic) what.appendChild(mk('p', 'quiet', 'Opens, clicks, bounces and unsubscribes from your email marketing system show here once it is connected under Add a source.'));
  else what.appendChild(mk('p', 'quiet', 'Delivered, opened, clicked, bounced, marked as spam and unsubscribed are read from ' + String((r.engine && r.engine.name) || 'your email engine') + ' every 15 minutes. Anyone who unsubscribes or marks an email as spam there is never emailed again, and the same goes the other way.'));
  if (!r.site) what.appendChild(mk('p', 'quiet', 'Forms filled on your website show here once the site is connected under Add a source.'));
  what.appendChild(mk('p', 'quiet', 'An opening received shows here; it does not reach For you yet.'));
  stage.appendChild(what);
}

const month = (ym) => { const d = new Date(String(ym) + '-01T12:00:00Z'); return isNaN(d) ? String(ym) : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); };
function counts(x) {
  return 'sent ' + n0(x.sent) + ', delivered ' + n0(x.delivered) + ', opened ' + n0(x.opened) + ', clicked ' + n0(x.clicked) + ', bounced ' + n0(x.bounced)
    + (x.unsubscribed !== undefined ? ', unsubscribed ' + n0(x.unsubscribed) : '') + (x.complaints !== undefined ? ', marked as spam ' + n0(x.complaints) : '');
}

function drawHistory(stage, h) {
  const name = h.name || 'your email engine';
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Everything you sent through ' + name));
  const t = h.totals || {};
  if (t.since) sec.appendChild(mk('p', 'mk-item-line', 'Since ' + month(String(t.since).slice(0, 7)) + ': ' + counts(t) + '.'));
  const pp = h.people || {};
  const st = pp.by_status || {};
  if (Number(pp.total)) {
    sec.appendChild(mk('p', 'state', n0(pp.total) + ' people on your lists. ' + n0(pp.ever_opened) + ' opened at least one email, ' + n0(pp.ever_clicked) + ' clicked, '
      + n0(pp.replied) + ' wrote back within 60 days of the last email to them. ' + n0(st.Unsubscribed) + ' unsubscribed, ' + n0(st.Bounced) + ' bounced, '
      + n0(st.Abuse) + ' marked an email as spam. ' + n0(pp.known) + ' of them are people the Tool already knows from your mail and records.'));
  }
  const ms = h.months || [];
  if (ms.length) {
    const line = (m) => mk('p', 'state', month(m.month) + ': ' + counts(m) + '.');
    sec.appendChild(mk('h3', 'mk-sub', 'Month by month'));
    for (const m of ms.slice(0, 12)) sec.appendChild(line(m));
    if (ms.length > 12) {
      const det = mk('details', 'mk-hand');
      det.appendChild(mk('summary', 'mk-hand-label', 'The ' + n0(ms.length - 12) + ' months before'));
      for (const m of ms.slice(12)) det.appendChild(line(m));
      sec.appendChild(det);
    }
  }
  const cs = h.campaigns || [];
  if (cs.length) {
    sec.appendChild(mk('h3', 'mk-sub', 'Each campaign'));
    for (const c of cs) {
      const p = mk('p', 'state');
      p.append(data_('span', null, c.subject || c.name), mk('span', null, (c.last_at ? ', ' + day(c.first_at) + (day(c.first_at) !== day(c.last_at) ? ' to ' + day(c.last_at) : '') : '') + ': '
        + counts(c) + ', ' + n0(c.replies) + ' wrote back.'));
      sec.appendChild(p);
    }
  }
  const op = h.openers || [];
  if (op.length) {
    sec.appendChild(mk('h3', 'mk-sub', 'Who opened your last ' + ((h.openers_of || []).length === 1 ? 'campaign' : n0((h.openers_of || []).length) + ' campaigns')));
    const ul = mk('ul', 'mk-person-list');
    for (const o of op.slice(0, 10)) {
      const li = mk('li', 'mk-person');
      li.append(data_('span', 'mk-person-name', o.name || o.address), mk('span', 'quiet', ' opened ' + n0(o.campaigns) + ' of them, last ' + day(o.last) + '.'));
      ul.appendChild(li);
    }
    sec.appendChild(ul);
    if (op.length > 10) sec.appendChild(mk('p', 'quiet', 'And ' + n0(op.length - 10) + ' more. Ask the box for the whole list.'));
  }
  const ds = Array.isArray(h.domains) ? h.domains : [];
  if (ds.length) {
    sec.appendChild(mk('h3', 'mk-sub', 'Sending domains'));
    for (const d of ds) {
      const p = mk('p', 'state');
      const checks = ['SPF', 'DKIM', 'DMARC'].map((k) => k + (d[k.toLowerCase()] ? ' passes' : ' does not pass')).join(', ');
      p.append(data_('span', null, d.domain || ''), mk('span', null, ': ' + (d.verified ? 'verified' : 'not verified in ' + name) + '; ' + checks + '.'));
      sec.appendChild(p);
    }
  }
  for (const w of (h.not_read || [])) if (w) sec.appendChild(mk('p', 'notice flagged', w));
  sec.appendChild(mk('p', 'quiet', 'Read from ' + name + (h.read_at ? ' (last ' + time(h.read_at) + ')' : '') + ': new results every 15 minutes, each month every 6 hours, each person once a day. '
    + name + ' keeps the email-by-email log for recent weeks only' + (h.log_from ? ' (here from ' + day(h.log_from) + ')' : '') + ', so older emails count in the months and in the totals for each person, not one by one.'));
  stage.appendChild(sec);
}

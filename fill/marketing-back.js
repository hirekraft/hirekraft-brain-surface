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
// Drawn from what the brain returns (mk_back_view); the brain refuses anyone but the owner or a marketing colleague (since 2026-11-02, decision 1058), with the reason.
// YOUR EMAIL HISTORY (seat elastic-history, 2026-11-01, decision 1054 item 1): everything the business sent through its email
// engine before and outside the Tool, kept by system-read's walk and returned by the one reader (mk_engine_history_for, in
// mk_back_view as history): every month's statistics, each person's lifetime opens and clicks, campaigns by name with replies
// from the mailbox, who opened the last three, the sending domains by name, and what the engine would not let the Tool read.
// No colour, size or font here; no regex literals, no backslashes.

let C = null;
// ROUND 2 (seat marketing-build-b, 2026-11-02, decision 1059, approved design Ha5qD1aq92RUxXAiwzY9h3 v7, row "Round 2, Nov 2: instrument").
// One question ("Who is listening, and who came forward first?"), one picture (twelve months of opened and bounced, the August
// block outlined), and one action per person who came forward (Write a note to a reply, Add to a list for an opener). Drawn
// from ONE reader, mk_back_story (brain, owner or a marketing colleague, decisions 1050 and 1058). Replies from the business's
// own domain are left out and counted. The full record of earlier rounds (Latest, by list, the whole Elastic history) is kept
// one press below. Mount contract with seat marketing-build-a: mount(el, ctx); drawBack stays for the shell of today.
const BAR_MAX = 100;   // both bars are percents of the month: opened of delivered, bounced of sent
const KIND = { reply: 'Reply', call_booked: 'Call booked', opening: 'Opening received', open: 'Opened', click: 'Clicked', unsubscribe: 'Unsubscribed', bounce: 'Bounced', complaint: 'Marked as spam', delivered: 'Delivered' };
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const day = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const time = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

// THE FULL RECORD (seat marketing-parts and seat elastic-history): kept whole, now one press below the story (round 2).
async function drawDetail(stage) {
  const w = mk('p', 'working no-late', 'Reading the full record');
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
    what.appendChild(mk('h3', 'mk-sub', 'What Brought Replies'));
    for (const k of (r.by_kind || [])) what.appendChild(mk('p', 'state', (k.piece === 'note' ? 'Personal notes' : 'Campaign emails') + ': ' + n0(k.replies) + ' of ' + n0(k.sent) + ' brought a reply, a call or an opening.'));
    for (const l of (r.by_list || [])) {
      const p = mk('p', 'state');
      p.append(data_('span', null, l.list), mk('span', null, ': ' + n0(l.replies) + ' of ' + n0(l.sent) + ' people answered.'));
      what.appendChild(p);
    }
  }
  if ((r.by_campaign || []).length) {
    what.appendChild(mk('h3', 'mk-sub', 'Each Campaign, from Your Email Engine'));
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
  sec.appendChild(mk('h3', 'mk-sub', 'Everything You Sent Through ' + name));
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
    sec.appendChild(mk('h3', 'mk-sub', 'Month by Month'));
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
    sec.appendChild(mk('h3', 'mk-sub', 'Each Campaign'));
    for (const c of cs) {
      const p = mk('p', 'state');
      p.append(data_('span', null, c.subject || c.name), mk('span', null, (c.last_at ? ', ' + day(c.first_at) + (day(c.first_at) !== day(c.last_at) ? ' to ' + day(c.last_at) : '') : '') + ': '
        + counts(c) + ', ' + n0(c.replies) + ' wrote back.'));
      sec.appendChild(p);
    }
  }
  const op = h.openers || [];
  if (op.length) {
    sec.appendChild(mk('h3', 'mk-sub', 'Who Opened Your Last ' + ((h.openers_of || []).length === 1 ? 'campaign' : n0((h.openers_of || []).length) + ' campaigns')));
    const ul = mk('ul', 'mk-person-list');
    for (const o of op.slice(0, 10)) {
      const li = mk('li', 'mk-person');
      li.append(data_('span', 'mk-person-name', o.name || o.address), mk('span', 'quiet', ' opened ' + n0(o.campaigns) + ' of them, last ' + day(o.last) + '.'));
      ul.appendChild(li);
    }
    sec.appendChild(ul);
    if (op.length > 10) sec.appendChild(mk('p', 'quiet', 'And ' + n0(op.length - 10) + ' more. Ask Vera for the whole list.'));
  }
  const ds = Array.isArray(h.domains) ? h.domains : [];
  if (ds.length) {
    sec.appendChild(mk('h3', 'mk-sub', 'Sending Domains'));
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

// ── ROUND 2: THE STORY (seat marketing-build-b) ─────────────────────────────────────────────────────────────────────────────
const monthShort = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }); };
const pct = (a, b) => (Number(b) > 0 ? Math.round((Number(a) * 1000) / Number(b)) / 10 : 0);

const STYLE = 'marketing-r2.css?v=2026-11-02-marketing-build-b';   // this part's look (seat marketing-build-b), loaded once by whichever part mounts first
const ensureStyle = () => { try { if (!document.querySelector('link[data-mk-r2]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL(STYLE, import.meta.url).href; l.setAttribute('data-mk-r2', '1'); document.head.appendChild(l); } } catch (e) { /* no document: tests */ } };
export async function mount(stage, ctx) {
  ensureStyle();
  C = Object.assign({ el: (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; } }, ctx || {});
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'What Came Back'), mk('p', 'mk-lede', 'Who is listening, and who came forward first?'));
  stage.appendChild(head);
  const w = mk('p', 'working no-late', 'Reading twelve months of what you sent');
  stage.appendChild(w);
  let r;
  try { const { data: d, error } = await C.sb.rpc('mk_back_story', {}); r = error ? { ok: false, reason: error.message } : d; }
  catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
  w.remove();
  if (!r || r.ok !== true) { stage.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((r && (r.reason || r.error)) || 'no reason was given') + '. Nothing here is a claim either way.')); return; }
  stage.appendChild(story(r));
  stage.appendChild(chart(r.months || []));
  stage.appendChild(forward(stage, r));
  const det = mk('details', 'mk-hand');
  det.appendChild(mk('summary', 'mk-hand-label', 'The Full Record: Every Month, Every Campaign, Every Reply'));
  const host = mk('div');
  det.appendChild(host);
  let drawn = false;
  det.addEventListener('toggle', () => { if (det.open && !drawn) { drawn = true; drawDetail(host); } });
  stage.appendChild(det);
  stage.appendChild(rules());
}
export const drawBack = mount;
try { window.MK_PARTS = Object.assign(window.MK_PARTS || {}, { back: { mount } }); } catch (e) { /* no window: tests */ }

function story(r) {
  const b = r.before || {}, s = r.since || {};
  const p = mk('p', 'mk-story');
  const ob = pct(b.opened, b.delivered), os = pct(s.opened, s.delivered);
  if (Number(s.delivered)) {
    p.textContent = 'Since September you send fewer emails, and more of them are read: ' + os + ' percent opened (' + n0(s.opened) + ' of ' + n0(s.delivered)
      + ' delivered), against ' + ob + ' percent from May to July, before Google blocked the newsletter in August.';
  } else p.textContent = 'Nothing has been delivered since September yet.';
  return p;
}

function chart(ms) {
  const sec = mk('section', 'mk-chart');
  const fig = mk('div', 'mk-bars');
  fig.setAttribute('role', 'img');
  const said = [];
  for (const m of ms) {
    const col = mk('div', 'mk-bar-col' + (m.block ? ' mk-block' : ''));
    const pair = mk('div', 'mk-bar-pair');
    const o = mk('span', 'mk-bar mk-bar-open'); o.style.height = Math.max(1, Math.min(BAR_MAX, Number(m.open_pct) || 0)) + '%';
    const b = mk('span', 'mk-bar mk-bar-bounce'); b.style.height = Math.max(1, Math.min(BAR_MAX, Number(m.bounce_pct) || 0)) + '%';
    o.title = monthShort(m.month) + ': ' + (m.open_pct || 0) + ' percent opened'; b.title = monthShort(m.month) + ': ' + (m.bounce_pct || 0) + ' percent bounced';
    pair.append(o, b);
    col.append(pair, mk('span', 'mk-bar-label', monthShort(m.month)));
    fig.appendChild(col);
    said.push(monthShort(m.month) + ' ' + (m.open_pct || 0) + ' percent opened, ' + (m.bounce_pct || 0) + ' percent bounced');
  }
  fig.setAttribute('aria-label', said.join('; '));
  const key = mk('p', 'mk-bar-key');
  key.append(mk('span', 'mk-key-open', 'Opened, of what was delivered'), mk('span', 'mk-key-bounce', 'Bounced, of what was sent'));
  sec.append(fig, key);
  const blk = ms.find((m) => m.block);
  if (blk) sec.appendChild(mk('p', 'quiet', monthShort(blk.month) + ' (outlined): Google blocked the newsletter; ' + n0(blk.bounced) + ' of ' + n0(blk.sent) + ' emails bounced.'));
  return sec;
}

function forward(stage, r) {
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'Who Came Forward First'));
  const ps = r.forward || [];
  if (!ps.length) sec.appendChild(mk('p', 'state', 'Nobody replied in the last 90 days or opened in the last 30.'));
  const ul = mk('ul', 'mk-person-list');
  const lists = r.lists || [];
  for (const x of ps) {
    const li = mk('li', 'mk-person');
    const top = mk('div', 'mk-person-top');
    top.appendChild(data_('span', 'mk-person-name', x.name || x.address));
    if (x.company) { top.appendChild(document.createTextNode(' ')); top.appendChild(data_('span', 'mk-person-title', x.company)); }
    li.appendChild(top);
    li.appendChild(mk('p', 'mk-person-from', x.rank === '1' ? 'Wrote back on ' + day(x.replied_at) + '.' : 'Opened on ' + day(x.opened_at) + (Number(x.opens) > 1 ? ', ' + n0(x.opens) + ' opens over the years.' : '.')));
    const acts = mk('div', 'mk-acts');
    const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
    if (x.action === 'none') li.appendChild(mk('p', 'stalled', x.dns === 'bounced' ? 'Do not email: the address bounced.' : 'Do not email: they unsubscribed or marked an email as spam.'));
    else if (x.action === 'note') {
      const a = mk('a', 'go', 'Write a Note');
      a.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(x.address); a.target = '_blank'; a.rel = 'noopener';
      acts.appendChild(a);
    } else if (lists.length) {
      const b = mk('button', 'go ghost', 'Add to ' + lists[0].question); b.type = 'button'; b.translate = false;
      b.addEventListener('click', async () => {
        b.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Adding';
        let v; try { const { data: d, error } = await C.sb.rpc('mk_list_add', { p_list: lists[0].id, p_address: x.address }); v = error ? { ok: false, reason: error.message } : d; } catch (e) { v = { ok: false, reason: String(e) }; }
        if (v && v.ok) { said.className = 'mk-said'; said.textContent = v.inside ? 'Added.' : 'Kept off the list: ' + String(v.why_out) + '.'; }
        else { b.disabled = false; said.className = 'mk-said stalled'; said.textContent = 'Not added: ' + String((v && v.reason) || 'no reason was given') + '.'; }
      });
      acts.appendChild(b);
    } else li.appendChild(mk('p', 'quiet', 'Make a list in Lists, then add them here.'));
    li.append(acts, said);
    ul.appendChild(li);
  }
  sec.appendChild(ul);
  if (Number(r.replied_own_left_out)) sec.appendChild(mk('p', 'quiet', n0(r.replied_own_left_out) + ' ' + (Number(r.replied_own_left_out) === 1 ? 'reply' : 'replies') + ' from your own colleagues left out.'));
  sec.appendChild(mk('p', 'quiet', n0(r.opened_30) + ' people opened an email in the last 30 days.'));
  return sec;
}

function rules() {
  const det = mk('details', 'mk-rules');
  det.appendChild(mk('summary', 'mk-hand-label', 'Rules'));
  for (const line of [
    'Opened is a share of what was delivered; bounced is a share of what was sent. Both come from your email engine, month by month.',
    'A month where more than a fifth of the emails bounced is outlined: in August 2026 Google blocked the newsletter.',
    'Who came forward first: people who wrote back in the last 90 days, then people who opened in the last 30, newest first. Replies from your own colleagues are left out.',
    'Write a note opens a new email to that person in your own mailbox; nothing is sent until you send it. Add to a list puts them on your newest list, unless they may not be emailed.',
    'Opens are a signal only: some mail programs open emails by themselves.',
  ]) det.appendChild(mk('p', 'state', line));
  return det;
}

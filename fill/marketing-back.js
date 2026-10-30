// fill/marketing-back.js - THE MARKETING AND SALES TAB, part WHAT CAME BACK (seat marketing-parts, 2026-10-30, decisions 1039, 1044).
//
// WHAT IT DOES FOR HER. Everything that came back from what she sent through the Tool, without her looking for it: replies,
// calls booked (a meeting invitation from that person), openings received (a reply the mail sorter reads as a requirement),
// each linked to the piece that brought it (the note about a hiring company, or the campaign email to a list), and which list
// and which kind of note brought replies. Measured in conversations, not opens (decision 1039); opens show as a signal only.
// Filled by itself every 15 minutes from the mail the Tool reads (mk_back_scan); Elastic Email and the website add their
// events when they are connected (seat systems-connect), and until then the screen says so.
// Drawn from what the brain returns (mk_back_view); the brain refuses anyone but the owner, with the reason.
// No colour, size or font here; no regex literals, no backslashes.

let C = null;
const KIND = { reply: 'Reply', call_booked: 'Call booked', opening: 'Opening received', open: 'Opened', click: 'Clicked', unsubscribe: 'Unsubscribed', bounce: 'Bounced', complaint: 'Complaint' };
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
  what.appendChild(mk('p', 'state', 'Read from the mailboxes the Tool reads, every 15 minutes' + (r.scanned_at ? ' (last ' + time(r.scanned_at) + ')' : '') + '.'));
  if (!r.elastic) what.appendChild(mk('p', 'quiet', 'Opens, clicks, bounces and unsubscribes from your email marketing system show here once it is connected under Add a source.'));
  if (!r.site) what.appendChild(mk('p', 'quiet', 'Forms filled on your website show here once the site is connected under Add a source.'));
  what.appendChild(mk('p', 'quiet', 'An opening received shows here; it does not reach For you yet.'));
  stage.appendChild(what);
}

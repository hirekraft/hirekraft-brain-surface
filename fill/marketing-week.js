// fill/marketing-week.js - THE MARKETING AND SALES TAB, part WEEK: this week's FINISHED pieces (seat marketing-week, 2026-11-02,
// decision 1060; 1059, 1058, 1050). Part of SHOW. Mounted by the shell above the Plan board (one line in marketing-shell.js).
//
// WHAT IT DOES FOR HER. One question: what is ready to go out this week, exactly as it will look? Each day's finished pieces (a
// LinkedIn post with its first comment and image text, an email with its subject, preview and body) come from the brain word for
// word, with the chat or document they were kept from. Press one: it shows as it will look on LinkedIn (name, where, the text with
// the "see more" cut, the image) or in an inbox (from, subject, preview, then the email). Then ONE button by its state:
//   draft     -> Approve (the owner or the marketing colleague; refused with the rule if it breaks a wording rule)
//   approved  -> a post: Copy and open LinkedIn (the Tool never posts), then "Done, I posted it"; an email: choose its list and
//                Schedule in Sending (a campaign; the test lock and the warm-up limits still decide what leaves)
//   scheduled -> In Sending; out -> posted, by whom and when.
// Everything shown comes from mk_week (as the signed-in person); presses go to mk_week_act, which refuses what she may not do and
// says why. Pieces she may not open are counted, with the reason, never hidden. No colour, size or font here (marketing-week.css).
// No regex literals, no backslashes.

let C = null, host = null, D = null, picked = null, lists = null;
const CSS = './marketing-week.css?v=2026-11-02-marketing-week-2';
const OPEN_AT = { linkedin: 'https://www.linkedin.com/feed/?shareActive=true', company_page: 'https://www.linkedin.com/feed/', group: 'https://www.linkedin.com/groups/' };
const CH = { linkedin: 'LinkedIn', company_page: 'Company page', group: 'LinkedIn group', email: 'Email', profile: 'LinkedIn message' };
const CUT = 210;   // LinkedIn shows about three lines (some 210 characters) before "see more"

const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const day = (iso) => { const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
const when = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}
function copyText(text) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => copyOld(text)); } catch (_) { /* below */ }
  return Promise.resolve(copyOld(text));
}
function copyOld(text) {
  try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (_) { return false; }
}
function cutAt(text) { const s = text.slice(0, CUT); const k = s.lastIndexOf(' '); return k > CUT / 2 ? s.slice(0, k) : s; }
function say(said, cls, text) { said.className = 'mk-said ' + cls; said.textContent = text; }
function css() {
  if (document.querySelector('link[data-mkw]')) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CSS; l.dataset.mkw = '1'; document.head.appendChild(l);
}

export async function mount(el, ctx) {
  C = ctx; host = el; css();
  host.innerHTML = '';
  host.appendChild(mk('p', 'working no-late', 'Reading this week’s finished posts and emails'));
  D = await rpc('mk_week', { p_week: (ctx.week && ctx.week.week_of) || null });
  draw();
}

async function reload(keepId) {
  D = await rpc('mk_week', { p_week: (D && D.week_of) || null });
  picked = keepId || null;
  draw();
}

function stateLine(p) {
  if (p.state === 'out') return 'Posted' + (p.out ? ' by ' + p.out.by + ', ' + when(p.out.at) : '');
  if (p.state === 'scheduled') return 'In Sending' + (p.scheduled ? ' since ' + when(p.scheduled.at) + ', by ' + p.scheduled.by : '');
  if (p.state === 'approved') return 'Approved' + (p.approved ? ' by ' + p.approved.by + ', ' + when(p.approved.at) : '') + (p.opened ? ' · copied and opened ' + when(p.opened.at) : '');
  return 'Draft, not approved yet';
}

function draw() {
  host.innerHTML = '';
  const box = mk('section', 'mkw');
  host.appendChild(box);
  const head = mk('div', 'mkw-head');
  head.appendChild(mk('h2', 'mk-title', 'Ready to go this week'));
  box.appendChild(head);
  if (!D || D.ok !== true) {
    box.appendChild(mk('p', 'notice flagged', 'This week’s finished pieces could not be read just now: ' + String((D && D.reason) || 'no reason was given') + '. Nothing here is a claim either way.'));
    return;
  }
  const ps = D.pieces || [];
  const posts = ps.filter((p) => p.kind === 'post').length, mails = ps.filter((p) => p.kind === 'email').length;
  const appr = ps.filter((p) => p.state !== 'draft').length, out = ps.filter((p) => p.state === 'out' || p.state === 'scheduled').length;
  if (ps.length) {
    box.appendChild(mk('p', 'mkw-count', ps.length + ' finished: ' + posts + ' ' + plural(posts, 'post', 'posts') + ', ' + mails + ' ' + plural(mails, 'email', 'emails')
      + ' · ' + appr + ' approved · ' + out + ' out or in Sending.'
      // seat plan-speed-drafts (decision 1060 (2)): drafts the Tool wrote for plan items with no approved words are counted apart
      + (ps.some((p) => (p.source || {}).origin === 'drafted') ? ' ' + ps.filter((p) => (p.source || {}).origin === 'drafted').length + ' written by the Tool.' : '')));
  }
  // decision 1068 (2), seat rulings-1068: a draft the Tool's own check objects to is written again, not shown; it is counted here
  if (Number(D.still_writing)) box.appendChild(mk('p', 'state', D.still_writing + ' ' + plural(D.still_writing, 'draft', 'drafts') + ' still being written.'));
  if (Number(D.held_back)) box.appendChild(mk('p', 'state', D.held_back + ' finished ' + plural(D.held_back, 'piece', 'pieces') + ' this week ' + plural(D.held_back, 'is', 'are') + ' not shown to you. ' + (D.held_back_why || '')));
  const saved = mk('div', 'mkw-saved-box'); box.appendChild(saved); savedBox(saved); const outbox = mk('div', 'mkw-out'); box.appendChild(outbox); import('./marketing-outreach.js?v=2026-11-02-marketing-week-3').then((M) => M.mount(outbox, C, (D && D.week_of) || null)).catch((e) => outbox.appendChild(mk('p', 'notice flagged', 'The LinkedIn messages could not be shown: ' + String((e && e.message) || e) + '.')));   // seat marketing-week-3: the week's LinkedIn messages
  if (!ps.length && !Number(D.held_back)) { box.appendChild(mk('p', 'quiet', 'No finished posts or emails are kept for this week yet. The plan below says what is planned.')); return; }
  if (!ps.length) return;
  const strip = mk('div', 'mkw-strip');
  const days = [...new Set(ps.map((p) => p.day))];
  for (const dd of days) {
    const col = mk('div', 'mkw-day');
    col.appendChild(mk('h3', 'mkw-day-head', day(dd)));
    for (const p of ps.filter((x) => x.day === dd)) col.appendChild(card(p));
    strip.appendChild(col);
  }
  box.appendChild(strip);
  const panel = mk('section', 'mkw-panel'); panel.setAttribute('aria-live', 'polite');
  box.appendChild(panel);
  const pick = ps.find((p) => p.id === picked) || ps.find((p) => p.state === 'draft' || p.state === 'approved') || ps[0];
  drawPanel(panel, pick); box.appendChild(outbox);   // the week's LinkedIn messages after the pieces
}

function card(p) {
  const b = mk('button', 'mkw-card mkw-' + p.state + (picked === p.id ? ' mkw-picked' : '')); b.type = 'button';
  b.appendChild(mk('span', 'mkw-card-ch', CH[p.channel] || p.channel));
  b.appendChild(data_('span', 'mkw-card-title', p.kind === 'email' ? p.subject : (p.headline || String(p.post_text || '').slice(0, 80))));
  b.appendChild(data_('span', 'mkw-card-meta', [p.by, p.at].filter(Boolean).join(' · ')));
  b.appendChild(mk('span', 'mkw-card-state', p.state === 'draft' ? 'Draft' : p.state === 'approved' ? 'Approved' : p.state === 'scheduled' ? 'In Sending' : 'Posted'));
  b.addEventListener('click', () => { picked = p.id; draw(); const x = host.querySelector('.mkw-panel'); if (x && x.scrollIntoView) x.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
  return b;
}

// HOW IT WILL LOOK ON LINKEDIN: who posts, where, the text with the "see more" cut, the image, then the first comment.
function linkedinLook(p) {
  const card_ = mk('div', 'mkw-li');
  const top = mk('div', 'mkw-li-top');
  const av = data_('span', 'mkw-li-av', String(p.by || 'H').slice(0, 1)); av.setAttribute('aria-hidden', 'true');
  const who = mk('div', 'mkw-li-who');
  who.appendChild(data_('span', 'mkw-li-name', p.channel === 'company_page' ? 'HireKraft' : p.by));
  who.appendChild(data_('span', 'mkw-li-where', p.where || ''));
  top.append(av, who);
  card_.appendChild(top);
  const text = String(p.post_text || '');
  const t = data_('div', 'mkw-li-text', text.length > CUT ? cutAt(text) : text);
  card_.appendChild(t);
  if (text.length > CUT) {
    const more = mk('button', 'mkw-li-more', '...see more'); more.type = 'button';
    more.addEventListener('click', () => { t.textContent = text; more.remove(); });
    card_.appendChild(more);
  }
  const img = mk('div', 'mkw-li-img');
  if (p.slides && p.slides.length) {
    img.appendChild(mk('p', 'eyebrow', 'Carousel, ' + p.slides.length + ' slides'));
    const ol = mk('ol', 'mkw-slides');
    for (const s of p.slides) ol.appendChild(data_('li', null, s));
    img.appendChild(ol);
  } else if (p.image_text) {
    img.appendChild(data_('div', 'mkw-li-img-text', p.image_text));
  }
  img.appendChild(data_('p', 'mkw-li-img-file', p.image_file ? 'Image: ' + p.image_file : 'No image named'));
  card_.appendChild(img);
  if (p.first_comment) {
    const c = mk('div', 'mkw-li-cmt');
    c.appendChild(mk('span', 'eyebrow', 'First comment'));
    c.appendChild(data_('span', null, p.first_comment));
    card_.appendChild(c);
  }
  return card_;
}

// HOW IT WILL LOOK IN AN INBOX: the row (from, subject, preview), then the opened email.
function inboxLook(p) {
  const w = mk('div', 'mkw-mail');
  const row = mk('div', 'mkw-mail-row');
  row.appendChild(data_('span', 'mkw-mail-from', p.by));
  const sp = mk('span', 'mkw-mail-sp');
  sp.append(data_('b', null, p.subject || ''), document.createTextNode(' '), data_('span', 'mkw-mail-prev', p.preview ? '- ' + p.preview : ''));
  row.appendChild(sp);
  row.appendChild(data_('span', 'mkw-mail-at', p.at || ''));
  w.appendChild(row);
  const open = mk('div', 'mkw-mail-open');
  open.appendChild(data_('h4', 'mkw-mail-subj', p.subject || ''));
  open.appendChild(data_('p', 'mkw-mail-meta', (p.by || '') + (p.to ? '  ·  To: ' + p.to : '')));
  open.appendChild(data_('div', 'mkw-mail-body', p.body || ''));
  w.appendChild(open);
  return w;
}

function drawPanel(panel, p) {
  panel.innerHTML = '';
  if (!p) return;
  panel.appendChild(mk('p', 'eyebrow', (CH[p.channel] || p.channel) + ' · ' + day(p.day) + (p.at ? ', ' + p.at : '')));
  panel.appendChild(p.kind === 'email' ? inboxLook(p) : linkedinLook(p));
  const src = p.source || {};
  if (src.origin === 'drafted') {
    // seat plan-speed-drafts: a draft the Tool wrote from the marketing foundation and this plan line; nobody has approved its words
    panel.appendChild(mk('p', 'mk-item-meta', 'Written by the Tool from your marketing foundation and the plan line “' + (src.part || '') + '”. Read it before you approve it.'));
  } else {
    panel.appendChild(mk('p', 'mk-item-meta', (src.origin === 'approved_document' ? 'Kept word for word from the approved document ' : 'Kept word for word from ')
      + '“' + (src.title || 'a saved chat') + '”, part “' + (src.part || '') + '”.'));
  }
  if (p.item) { const m = mk('p', 'mk-item-meta'); m.append(mk('span', null, 'In the plan below as: '), data_('span', null, p.item.title)); panel.appendChild(m); }
  if (p.flag) panel.appendChild(mk('p', 'stalled', p.flag));
  if (p.wording_fail) panel.appendChild(mk('p', 'stalled', 'Breaks one of your wording rules: ' + p.wording_fail + '. Change it before it is approved.'));
  panel.appendChild(mk('p', 'state mkw-state', stateLine(p)));
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  const acts = mk('div', 'mk-acts');
  panel.append(acts, said);
  if (!p.may_press) { say(said, 'state', D.press_why || 'You may see this but not approve or send it.'); return; }
  if (p.state === 'draft') {
    const a = mk('button', 'go', 'Approve'); a.type = 'button';
    a.addEventListener('click', () => press(p, 'approved', null, a, said, 'Approving it'));
    acts.appendChild(a);
    return;
  }
  if (p.state === 'approved' && p.kind !== 'email') {
    const go = mk('button', 'go', p.channel === 'group' ? 'Copy and open the group' : p.channel === 'company_page' ? 'Copy and open the company page' : 'Copy and open LinkedIn'); go.type = 'button';
    go.addEventListener('click', async () => {
      const copying = copyText(String(p.post_text || ''));
      const win = window.open(OPEN_AT[p.channel] || OPEN_AT.linkedin, '_blank', 'noopener');
      const copied = await copying;
      const r = await rpc('mk_week_act', { p_piece: p.id, p_act: 'opened', p_list: null });
      say(said, copied ? 'state' : 'stalled', (copied ? 'Copied. ' : 'It could not be copied here; press “...see more”, select the words and copy them. ')
        + (win === null ? 'Your browser kept LinkedIn from opening; open it yourself. ' : 'LinkedIn is open in a new tab. ')
        + 'Paste it, add the image, post it, then put the first comment under it and press “Done, I posted it”.' + (r.ok ? '' : ' (Not recorded: ' + (r.reason || 'no reason was given') + '.)'));
    });
    acts.appendChild(go);
    if (p.first_comment) {
      const c = mk('button', 'go ghost', 'Copy the first comment'); c.type = 'button';
      c.addEventListener('click', async () => { const ok = await copyText(p.first_comment); say(said, ok ? 'state' : 'stalled', ok ? 'The first comment is copied.' : 'It could not be copied here; select it above.'); });
      acts.appendChild(c);
    }
    const done = mk('button', 'go ghost', 'Done, I posted it'); done.type = 'button';
    done.addEventListener('click', () => press(p, 'out', null, done, said, 'Marking it posted'));
    acts.appendChild(done);
    acts.appendChild(undo(p, said));
    return;
  }
  if (p.state === 'approved' && p.kind === 'email') {
    panel.insertBefore(mk('p', 'state', 'Nothing leaves while the test lock is on, and the warm-up limits decide how many go each day. Scheduling makes it a campaign in Sending, where it can be paused.'), acts);
    const sel = C.el('select'); sel.className = 'mk-hand-pick'; sel.setAttribute('aria-label', 'The list it goes to');
    const o0 = C.el('option'); o0.value = ''; o0.textContent = 'Choose the list'; sel.appendChild(o0);
    acts.appendChild(sel);
    const s = mk('button', 'go', 'Schedule in Sending'); s.type = 'button';
    s.addEventListener('click', () => { if (!sel.value) { say(said, 'stalled', 'Choose the list it goes to first.'); sel.focus(); return; } press(p, 'scheduled', sel.value, s, said, 'Making it a campaign in Sending'); });
    acts.appendChild(s);
    acts.appendChild(undo(p, said));
    fillLists(sel, said, p);
    return;
  }
  if (p.state === 'scheduled' && C.go) {
    const g = mk('button', 'go ghost', 'Open Sending'); g.type = 'button';
    g.addEventListener('click', () => C.go('send'));
    acts.appendChild(g);
  }
}

function undo(p, said) {
  const u = mk('button', 'go ghost', 'Take back the approval'); u.type = 'button';
  u.addEventListener('click', () => press(p, 'unapproved', null, u, said, 'Taking back the approval'));
  return u;
}

// SAVED BY THE TEAM (seat marketing-week-2, 2026-11-02, decision 1062: marketing saves are company). A colleague's saved chat or
// document that is marketing work opens to everyone with marketing access; the Tool decides from what it is about. Where it is unsure
// the save stays private and the owner sees it here by title, with one press, This is marketing. Each person sees her own saves that
// are now open to the team, with one press to keep any private. Someone else's personal save is never listed, not even by title.
async function savedBox(el) {
  const S = await rpc('mk_saved_list', {});
  if (!S || S.ok !== true) return;
  const un = S.unsure || [], mine = S.mine_marketing || [];
  if (un.length) el.appendChild(savedList(un.length + ' saved ' + plural(un.length, 'item', 'items') + ' may be marketing work. '
    + plural(un.length, 'It stays', 'They stay') + ' private until you say.', un, 'marketing', 'This is marketing'));
  if (mine.length) el.appendChild(savedList(mine.length + ' of your saved chats ' + plural(mine.length, 'is', 'are') + ' open to the marketing team.', mine, 'personal', 'Keep private'));
}

const noDot = (t) => (t.endsWith('.') ? t.slice(0, -1) : t);
function savedList(line, rows, kind, label) {
  const det = mk('details', 'mkw-saved');
  det.appendChild(mk('summary', 'mk-hand-label', line));
  for (const x of rows) {
    const row = mk('div', 'mkw-saved-row');
    row.appendChild(data_('span', 'mkw-card-title', x.title));
    const meta = [x.by && !x.mine ? 'Saved by ' + x.by : '', day(x.saved_at)].filter(Boolean).join(' · ');
    if (meta) row.appendChild(mk('span', 'mkw-card-meta', meta));
    const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
    const b = mk('button', 'go ghost', label); b.type = 'button';
    b.addEventListener('click', async () => {
      b.disabled = true; say(said, 'working no-late', 'Saving');
      const r = await rpc('mk_saved_mark', { p_chat: x.id, p_kind: kind });
      if (!r || r.ok !== true) { b.disabled = false; say(said, 'stalled', 'Not done: ' + noDot(String((r && r.reason) || 'no reason was given')) + '.'); return; }
      row.innerHTML = '';
      row.appendChild(mk('p', 'state', kind === 'marketing' ? 'Marked as marketing. It now opens to the marketing team.' : 'Kept private. Only you see it.'));
    });
    row.append(b, said);
    det.appendChild(row);
  }
  return det;
}

async function fillLists(sel, said, p) {
  if (!lists) lists = await rpc('mk_lists_view', {});
  const ls = (lists && lists.ok === true && lists.lists) || [];
  for (const l of ls) { const o = C.el('option'); o.value = l.id; o.textContent = String(l.question || l.name || 'A list'); o.translate = false; sel.appendChild(o); }
  if (!lists || lists.ok !== true) say(said, 'stalled', 'The lists could not be read: ' + String((lists && lists.reason) || 'no reason was given') + '.');
  else if (!ls.length) say(said, 'state', 'No email list is made yet. Make one in Lists (it said: ' + (p.to || 'no list named') + '), then come back to schedule it.');
}

async function press(p, act, list, b, said, doing) {
  b.disabled = true; say(said, 'working no-late', doing);
  const r = await rpc('mk_week_act', { p_piece: p.id, p_act: act, p_list: list });
  b.disabled = false;
  if (!r || r.ok !== true) { say(said, 'stalled', 'Not done: ' + String((r && r.reason) || 'no reason was given') + '.'); return; }
  await reload(p.id);
  const after = host.querySelector('.mkw-panel .mk-said');
  if (after) say(after, 'state', act === 'approved' ? 'Approved.' : act === 'unapproved' ? 'The approval is taken back; it is a draft again.' : act === 'out' ? 'Marked as posted.' : act === 'scheduled' ? 'It is a campaign in Sending now.' : 'Done.');
}

// fill/marketing-plan.js - THE MARKETING AND SALES TAB, part PLAN: the weekly board (seat marketing-build-a, 2026-11-02, decision 1059;
// design round 2 approved; decisions 1055, 1058). Part of SHOW. Replaces the round-1 Plan (seat marketing-parts, 2026-10-30, and
// plan-from-chats, 2026-11-01): its "Planned in your chats" list became this board, and its lists moved to the Lists part (seat
// marketing-build-b). Superseded 2026-11-02 by Alex's approval of the round 2 design (decision 1059).
//
// WHAT IT DOES FOR HER. One question: what goes out this week, where, and to whom? One picture: the week as columns, today first,
// each item a card on its day (dated items from the plan worked out in the saved AI chats; weekly items on the days their rhythm
// names). One action per item, by its channel: a LinkedIn post, company page or group post is COPIED and LinkedIn OPENED for her to
// post (the Tool never posts on LinkedIn); a website article becomes a WordPress DRAFT that a person publishes (the Tool never
// publishes); an email is HANDED TO SENDING, where it is approved as a campaign. Then Done, Skip (with why) or Move (to a day).
// Every item says which chat it came from and opens that message; "See how it changed" shows the earlier words.
// Everything shown comes from the brain as the signed-in person (mk_plan_week); presses go to mk_plan_act, which refuses an item she
// may not open. Nothing here decides who may see what. No colour, size or font here (skin.css); no regex literals, no backslashes.

let C = null, host = null, picked = null, D = null;
const SYS = '/functions/v1/system-read';
const STATUS = { agreed: 'Agreed', draft: 'Draft', done: 'Done' };
const KIND = { post: 'Post', email: 'Email', page: 'Website page', follow_up: 'Follow-up', campaign: 'Campaign', other: 'Task' };
const FIRE = { linkedin: 'Copy and open LinkedIn', company_page: 'Copy and open the company page', group: 'Copy and open the group',
  website: 'Make a WordPress draft', email: 'Hand to Sending', mark: 'Mark done' };
const OPEN_AT = { linkedin: 'https://www.linkedin.com/feed/?shareActive=true', company_page: 'https://www.linkedin.com/feed/', group: 'https://www.linkedin.com/groups/' };
const CH = { linkedin: 'li', company_page: 'li', group: 'li', website: 'web', email: 'mail', mark: 'other' };

const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const day = (iso) => { if (!iso) return ''; const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const short = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const wd = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' }); };
const addDays = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const whose = (it, who) => { if (!who) return true; const o = String(it.owned_by || '').trim().toLowerCase(); return o !== '' && o.split(' ')[0] === who.toLowerCase(); };
const words = (it) => String((typeof it.draft === 'string' && it.draft) || it.what || it.title || '');

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
function copyText(text) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => copyOld(text)); } catch (_) { /* below */ }
  return Promise.resolve(copyOld(text));
}
function copyOld(text) {
  try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch (_) { return false; }
}
function say(said, cls, text) { said.className = 'mk-said ' + cls; said.textContent = text; }
// After a press the week is read again; if the line under the button was redrawn away (the next-step card), the shell keeps it.
function keep(said, ctx) { if (!said.isConnected && ctx.note && said.textContent) ctx.note(said.textContent, said.classList.contains('stalled')); }

// THE ONE BUTTON of an item, by its channel. Used on the board and by the shell's next-step card.
export function fireButton(it, said, ctx) {
  C = C || ctx;
  const kind = it.fire || 'mark';
  if (kind === 'website' && it.wp_draft && it.wp_draft.wp_id) {
    const a = mk('a', 'go', it.wp_draft.now === 'publish' ? 'Open the published article' : 'Open the draft in WordPress');
    a.href = it.wp_draft.link || '#'; a.target = '_blank'; a.rel = 'noopener';
    return a;
  }
  const b = mk('button', 'go', FIRE[kind]); b.type = 'button';
  b.addEventListener('click', () => fire(it, b, said, ctx));
  return b;
}

async function fire(it, b, said, ctx) {
  const kind = it.fire || 'mark';
  if (OPEN_AT[kind]) {
    const copying = copyText(words(it));
    const win = window.open(OPEN_AT[kind], '_blank', 'noopener');
    const copied = await copying;
    b.disabled = true;
    const r = await rpc('mk_plan_act', { p_item: it.id, p_week: ctx.week && ctx.week.week_of, p_act: 'fired', p_why: null, p_to_day: null, p_fired: 'copied_opened' });
    b.disabled = false;
    const where = kind === 'group' ? 'the group' : kind === 'company_page' ? 'the company page' : 'your LinkedIn';
    say(said, copied ? 'state' : 'stalled', (copied ? 'Copied. ' : 'It could not be copied here; select the words below and copy them. ')
      + (win === null ? 'Your browser kept LinkedIn from opening; open it yourself. ' : 'LinkedIn is open in a new tab. ')
      + 'Paste it on ' + where + ' and post it there, then press Done.' + (r.ok ? '' : ' (Not recorded: ' + (r.reason || 'no reason was given') + '.)'));
    if (ctx.refresh) await redraw(ctx);
    keep(said, ctx);
    return;
  }
  if (kind === 'website') {
    b.disabled = true; say(said, 'working no-late', 'Making the draft in WordPress');
    const t = setTimeout(() => { say(said, 'working', 'Still making the draft in WordPress (it reads the site before and after)'); }, 10000);
    const r = await post(SYS, { action: 'wp_draft', item_id: it.id, week_of: ctx.week && ctx.week.week_of });
    clearTimeout(t); b.disabled = false;
    if (r && r.ok === true) {
      say(said, 'state', (r.already ? 'This draft was made before, on ' + day(r.made_at) + '. ' : 'Made as a draft in WordPress. Nothing was published: ' + (r.published_before ?? '') + ' published articles before and after. ') + 'A person publishes it in WordPress.');
      if (r.link) { const a = mk('a', 'go ghost', 'Open the draft in WordPress'); a.href = r.link; a.target = '_blank'; a.rel = 'noopener'; said.after(a); }
      if (ctx.refresh) await redraw(ctx);
      keep(said, ctx);
    } else say(said, 'stalled', 'No draft was made: ' + String((r && (r.reason || r.error)) || 'no reason was given') + '.');
    return;
  }
  if (kind === 'email') {
    const r = await rpc('mk_plan_act', { p_item: it.id, p_week: ctx.week && ctx.week.week_of, p_act: 'fired', p_why: null, p_to_day: null, p_fired: 'to_sending' });
    if (!r.ok) { say(said, 'stalled', 'Not handed over: ' + (r.reason || 'no reason was given') + '.'); return; }
    if (ctx.go) ctx.go('send', { plan_item: it.id, week_of: ctx.week && ctx.week.week_of, title: it.title, what: it.what, draft: it.draft, audience: it.audience });
    return;
  }
  await act(it, 'done', null, null, said, ctx);
}

async function act(it, what, why, toDay, said, ctx) {
  say(said, 'working no-late', what === 'done' ? 'Marking it done' : what === 'skipped' ? 'Skipping it' : what === 'moved' ? 'Moving it' : 'Putting it back');
  const r = await rpc('mk_plan_act', { p_item: it.id, p_week: ctx.week && ctx.week.week_of, p_act: what, p_why: why, p_to_day: toDay, p_fired: null });
  if (!r.ok) { say(said, 'stalled', 'Not changed: ' + (r.reason || 'no reason was given') + '.'); return; }
  say(said, 'state', what === 'done' ? 'Done.' : what === 'skipped' ? 'Skipped.' : what === 'moved' ? 'Moved to ' + short(toDay) + '.' : 'Open again.');
  if (ctx.refresh) await redraw(ctx);
  keep(said, ctx);
}

async function redraw(ctx) {
  const d = await ctx.refresh();
  if (d) D = d;
  if (host && host.isConnected && host.querySelector('.mk2-board') && d) drawBoard(ctx);   // only when the board is the part shown
}

export async function mount(el, ctx) {
  C = ctx; host = el; D = ctx.week;
  if (!D || D.ok !== true || (ctx.handoff && ctx.handoff.week)) D = await ctx.refresh(ctx.handoff && ctx.handoff.week);
  drawBoard(ctx);
}

function drawBoard(ctx) {
  host.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'What goes out this week, where, and to whom?'));
  host.appendChild(head);
  if (!D || D.ok !== true) {
    host.appendChild(mk('p', 'notice flagged', 'The plan could not be read just now: ' + String((D && D.reason) || 'no reason was given') + '. Nothing here is a claim either way.'));
    return;
  }
  const who = ctx.who || null;
  // the week tabs: last week, this week, the next two, each with its count
  const tabs = mk('div', 'mk2-weeks'); tabs.setAttribute('role', 'tablist');
  const thisWeek = addDays(D.today, -(((new Date(D.today + 'T12:00:00').getDay() + 6) % 7)));
  for (const w of (D.weeks || [])) {
    const b = mk('button', 'mk2-week'); b.type = 'button'; b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', w.week_of === D.week_of ? 'true' : 'false');
    b.append(mk('span', null, w.week_of === thisWeek ? 'This week' : short(w.week_of)), document.createTextNode(' '), data_('span', 'mk2-week-n', String(w.items)));
    b.addEventListener('click', async () => { picked = null; const d = await ctx.refresh(w.week_of); D = d; drawBoard({ ...ctx, week: d }); });
    tabs.appendChild(b);
  }
  host.appendChild(tabs);
  // the days: today first in the current week, then the rest; Saturday and Sunday only when something is on them
  const days = [];
  for (let k = 0; k < 7; k++) days.push(addDays(D.week_of, k));
  const dow = (iso) => ((new Date(iso + 'T12:00:00').getDay() + 6) % 7) + 1;
  const dated = (dd) => (D.items || []).filter((x) => x.day === dd);
  const weekly = (dd) => (D.every || []).filter((x) => (x.days || []).includes(dow(dd)));
  let cols = days.filter((dd) => dow(dd) <= 5 || dated(dd).length || weekly(dd).length);
  const inWeek = D.today >= D.week_of && D.today <= addDays(D.week_of, 6);
  if (inWeek) cols = [...cols.filter((dd) => dd >= D.today), ...cols.filter((dd) => dd < D.today)];
  const board = mk('div', 'mk2-board');
  const all = [];
  for (const dd of cols) {
    const col = mk('section', 'mk2-day' + (dd === D.today ? ' mk2-today' : '') + (inWeek && dd < D.today ? ' mk2-past' : ''));
    col.appendChild(mk('h3', 'mk2-day-head', (dd === D.today ? 'Today, ' : '') + wd(dd) + ' ' + short(dd)));
    const list = mk('div', 'mk2-cards');
    for (const it of dated(dd)) { list.appendChild(card(it, who, ctx)); all.push(it); }
    col.appendChild(list);
    col.appendChild(weeklyFold(weekly(dd), who, ctx, all));
    board.appendChild(col);
  }
  const anyCol = mk('section', 'mk2-day mk2-any');
  anyCol.appendChild(mk('h3', 'mk2-day-head', 'Any day this week'));
  const undated = (D.items || []).filter((x) => !x.day);
  const anyList = mk('div', 'mk2-cards');
  for (const it of undated) { anyList.appendChild(card(it, who, ctx)); all.push(it); }
  anyCol.appendChild(anyList);
  anyCol.appendChild(weeklyFold((D.every || []).filter((x) => !(x.days || []).length), who, ctx, all));
  board.appendChild(anyCol);
  host.appendChild(board);
  if (!(D.items || []).length) host.appendChild(mk('p', 'state', 'Nothing in the plan is dated for this week' + (Number(D.held_back) ? ' that you may see' : '') + '; the weekly rhythm is under each day.'));
  if (Number(D.held_back)) host.appendChild(mk('p', 'state', D.held_back + ' ' + plural(D.held_back, 'item this week comes', 'items this week come') + ' from chats private to the person who saved them, or not shared with you. They appear here when the chat is shared.'));
  // the picked item, under the board
  const KR = { post: 0, email: 1, page: 2, campaign: 3, follow_up: 4, other: 5 };   // the same order as the next-step card
  const first = (f) => all.filter(f).sort((a, b) => (KR[a.kind] ?? 9) - (KR[b.kind] ?? 9))[0];
  const pick = all.find((x) => picked && x.id === picked.id) || first((x) => x.state === 'open' && x.day === D.today && whose(x, who)) || first((x) => x.state === 'open' && whose(x, who) && x.day) || null;
  const panel = mk('section', 'mk2-panel'); panel.setAttribute('aria-live', 'polite');
  host.appendChild(panel);
  if (pick) drawPanel(panel, pick, ctx); else panel.appendChild(mk('p', 'quiet', 'Press an item to see it and its one button.'));
  const r = D.reach || {};
  host.appendChild(mk('p', 'mk-item-meta', 'Read from ' + (r.chats_read || 0) + ' saved ' + plural(r.chats_read, 'chat', 'chats') + ', ' + (r.chats_with_plan || 0) + ' of them with plan items' + (r.read_at ? ', last read ' + day(r.read_at) : '') + '.' + (Number(r.chats_owed) ? ' ' + r.chats_owed + ' still being read.' : '')));
}

function card(it, who, ctx) {
  const b = mk('button', 'mk2-card mk2-ch-' + (CH[it.fire] || 'other') + (whose(it, who) ? '' : ' mk2-faded') + (it.state === 'done' || it.state === 'skipped' ? ' mk2-closed' : it.state === 'fired' ? ' mk2-fired' : '') + (picked && picked.id === it.id ? ' mk2-picked' : ''));
  b.type = 'button';
  b.appendChild(data_('span', 'mk2-card-ch', it.channel || 'Other'));
  b.appendChild(data_('span', 'mk2-card-title', it.title));
  const meta = [];   // her own words (rhythm, owner) are never translated; the state is the Tool's words
  if (it.cadence) meta.push(it.cadence);
  if (it.owned_by) meta.push(it.owned_by);
  if (meta.length) b.appendChild(data_('span', 'mk2-card-meta', meta.join(' · ')));
  const st = it.state === 'done' ? (it.act && it.act.by ? 'Done by ' + it.act.by : 'Done') : it.state === 'skipped' ? 'Skipped'
    : it.state === 'fired' ? (it.act && it.act.fired === 'draft_made' ? 'Draft made' : it.act && it.act.fired === 'to_sending' ? 'In Sending' : 'Copied and opened') : '';
  if (st || it.moved) b.appendChild(mk('span', 'mk2-card-meta', [st, it.moved ? 'Moved from ' + short(it.planned_day) : ''].filter(Boolean).join(' · ')));
  b.addEventListener('click', () => { picked = it; drawBoard(ctx); const p = host.querySelector('.mk2-panel'); if (p && p.scrollIntoView) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
  return b;
}

// The weekly rhythm under a day: hers shown, the others folded with their count.
function weeklyFold(items, who, ctx, all) {
  const box = mk('div', 'mk2-weekly');
  if (!items.length) return box;
  const mine = items.filter((x) => whose(x, who)), rest = items.filter((x) => !whose(x, who));
  for (const it of mine) { box.appendChild(card(it, who, ctx)); all.push(it); }
  if (rest.length) {
    const det = mk('details', 'mk2-more');
    det.appendChild(mk('summary', 'mk-hand-label', (who ? rest.length + ' weekly for others' : rest.length + ' weekly')));
    for (const it of rest) { det.appendChild(card(it, who, ctx)); all.push(it); }
    if (picked && rest.some((x) => x.id === picked.id)) det.open = true;
    box.appendChild(det);
  }
  return box;
}

function drawPanel(panel, it, ctx) {
  panel.innerHTML = '';
  panel.appendChild(data_('h3', 'mk2-panel-title', it.title));
  const meta = [it.channel || 'Other'];   // her own words, never translated
  if (it.audience) meta.push(it.audience);
  if (it.owned_by) meta.push(it.owned_by);
  if (it.cadence) meta.push(it.cadence);
  panel.appendChild(data_('p', 'mk-item-meta', meta.join(' · ')));
  panel.appendChild(mk('p', 'mk-item-meta', [KIND[it.kind] || it.kind, it.day && !it.cadence ? wd(it.day) + ' ' + short(it.day) : '', STATUS[it.status] || it.status || ''].filter(Boolean).join(' · ')));
  if (it.act) panel.appendChild(mk('p', 'state', (it.act.act === 'done' ? 'Done' : it.act.act === 'skipped' ? 'Skipped' : it.act.fired === 'draft_made' ? 'Draft made' : it.act.fired === 'to_sending' ? 'Handed to Sending' : 'Copied and opened')
    + ' by ' + (it.act.by || 'someone') + ' on ' + day(it.act.at) + (it.act.why ? ': ' + it.act.why : '') + '.'));
  else if (it.said_done) panel.appendChild(mk('p', 'state', 'Said to be done in the chat.'));
  if (words(it)) { const t = data_('div', 'mk2-words', words(it).slice(0, 3000)); panel.appendChild(t); }
  if (it.wording_fail) panel.appendChild(mk('p', 'stalled', 'Breaks one of your wording rules: ' + it.wording_fail + '. Change it before it goes out.'));
  const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
  const acts = mk('div', 'mk-acts');
  if (it.state === 'open' || it.state === 'fired') {
    acts.appendChild(fireButton(it, said, ctx));
    if (it.fire !== 'mark') { const d = mk('button', 'go ghost', 'Done'); d.type = 'button'; d.addEventListener('click', () => act(it, 'done', null, null, said, ctx)); acts.appendChild(d); }
  } else {
    const u = mk('button', 'go ghost', 'Open it again'); u.type = 'button'; u.addEventListener('click', () => act(it, 'undone', null, null, said, ctx)); acts.appendChild(u);
  }
  panel.appendChild(acts);
  if (it.state === 'open' || it.state === 'fired') {
    const more = mk('div', 'mk-acts mk2-more-acts');
    const why = mk('input', 'mk-why'); why.type = 'text'; why.maxLength = 300; why.placeholder = 'Why skip it (a few words)'; why.setAttribute('aria-label', 'Why skip it');
    const skip = mk('button', 'go ghost', 'Skip'); skip.type = 'button';
    skip.addEventListener('click', () => { if (String(why.value).trim().length < 3) { say(said, 'stalled', 'Say in a few words why it is skipped.'); why.focus(); return; } act(it, 'skipped', why.value, null, said, ctx); });
    more.append(why, skip);
    if (!it.cadence) {
      const sel = C.el('select'); sel.className = 'mk-hand-pick'; sel.setAttribute('aria-label', 'Move to');
      const o0 = C.el('option'); o0.value = ''; o0.textContent = 'Move to'; sel.appendChild(o0);
      for (let k = 0; k < 12; k++) {
        const dd = addDays(D.week_of, k);
        const dw = ((new Date(dd + 'T12:00:00').getDay() + 6) % 7) + 1;
        if (dw > 5 || dd === it.day || dd < D.today) continue;
        const o = C.el('option'); o.value = dd; o.textContent = wd(dd) + ' ' + short(dd); sel.appendChild(o);
      }
      sel.addEventListener('change', () => { if (sel.value) act(it, 'moved', null, sel.value, said, ctx); });
      more.appendChild(sel);
    }
    panel.appendChild(more);
  }
  panel.appendChild(said);
  const src = it.source || {};
  const out = mk('div', 'mk2-src');
  const links = mk('div', 'mk-acts');
  if (src.chat_id) {
    const s = mk('button', 'go ghost', 'From the chat of ' + day(src.said_at)); s.type = 'button';
    s.addEventListener('click', () => { out.innerHTML = ''; showSource(out, src); });
    links.appendChild(s);
  }
  if (Number(it.changes)) {
    const h = mk('button', 'go ghost', 'See how it changed (' + it.changes + ')'); h.type = 'button';
    h.addEventListener('click', () => { out.innerHTML = ''; showHistory(out, it.id); });
    links.appendChild(h);
  }
  panel.append(links, out);
}

// THE SOURCE: the chat's title and date, and the message the item came from, read through chat_open (which refuses what she may not open).
async function showSource(box, src) {
  const w = mk('p', 'working no-late', 'Opening the chat');
  box.appendChild(w);
  const r = await rpc('chat_open', { p_chat: src.chat_id });
  w.remove();
  if (!r || r.ok !== true) { box.appendChild(mk('p', 'notice flagged', 'The chat could not be opened: ' + String((r && (r.note || r.reason)) || 'no reason was given') + '.')); return; }
  const head = mk('p', 'mk-item-meta');
  head.append(data_('span', null, r.title), document.createTextNode(' · '), data_('span', null, day(src.said_at || r.started_at)));
  box.appendChild(head);
  const m = (r.messages || [])[Number(src.msg_no)];
  if (m) {
    box.appendChild(mk('p', 'eyebrow', m.role === 'assistant' ? 'What the assistant wrote' : 'What was asked'));
    box.appendChild(data_('div', 'mk2-words', String(m.text || '').slice(0, 2400) + (String(m.text || '').length > 2400 ? ' ...' : '')));
  } else box.appendChild(mk('p', 'stalled', 'That message is no longer in the chat.'));
  box.appendChild(mk('p', 'state', 'The whole chat is on the Chats tab.'));
}

async function showHistory(box, id) {
  const w = mk('p', 'working no-late', 'Reading how this changed');
  box.appendChild(w);
  const r = await rpc('mk_plan_item_history', { p_item: id });
  w.remove();
  if (!r || r.ok !== true) { box.appendChild(mk('p', 'notice flagged', 'Its history could not be read: ' + String((r && r.reason) || 'no reason was given') + '.')); return; }
  const ul = mk('ul', 'mk-list');
  for (const e of (r.earlier || [])) {
    const li = mk('li', 'mk-item');
    li.appendChild(mk('p', 'mk-item-meta', 'Said on ' + day(e.said_at) + ' · ' + (STATUS[e.status] || e.status)));
    li.appendChild(data_('p', 'mk-item-line', e.title));
    if (e.what) li.appendChild(data_('p', 'mk-item-known', e.what));
    if (e.why) li.appendChild(mk('p', 'state', e.why));
    ul.appendChild(li);
  }
  for (const v of (r.versions || [])) {
    const li = mk('li', 'mk-item');
    li.appendChild(mk('p', 'mk-item-meta', 'Earlier reading, replaced on ' + day(v.replaced_at)));
    li.appendChild(data_('p', 'mk-item-line', v.title));
    if (v.what) li.appendChild(data_('p', 'mk-item-known', v.what));
    ul.appendChild(li);
  }
  if (!ul.children.length) ul.appendChild(mk('li', 'quiet', 'No earlier version you may see.'));
  box.appendChild(ul);
  if (Number(r.earlier_held_back)) box.appendChild(mk('p', 'state', r.earlier_held_back + ' earlier ' + plural(r.earlier_held_back, 'version comes', 'versions come') + ' from chats you may not open.'));
}

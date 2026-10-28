// fill/thoughts.js - THOUGHTGRAMS AND THE THOUGHTS TAB (seat thoughtgram, 2026-10-25; decisions 1015, 1016, 1017).
// Alex, 2026-10-25: "I can speak to the tool about something I'm working on and give an update. This is then in the brain
// and can be retrieved like an email... the tool can say Alex thinks this and this about this issue... if I'm alone,
// another medium to enter my business thoughts to the brain." And the tab: "like a thoughtgram client that acts like an
// email client... by topic instead of inbox and outbox." An EARLY CONCEPT, expected to change: kept simple to revise.
//
// LEAVING ONE. Leave a thought (the + in either box, the Thoughts tab, Add a thought on an open email) puts the box in
// thought mode (box.js); she talks or types; Go reads her words back here in a card she can correct; Keep it sends them
// to lens-ask (body.thought, shared/thought.ts), which fingerprints them, files them under a topic and keeps them in the
// brain as her record, private to her. The card then says which topic it went to, with one tap to change it. Said as
// "note for the brain: ..." in the box, the same card opens with the words after it.
// THE TAB. Moving (default): topics where something changed since she last opened them (a thought she added, or email
// naming the topic's person or company). Topics: every topic, formed on its own. Mine: her thoughts across topics,
// newest first, earlier views folded. Inside a topic: her latest view on top with what it replaced and what is still
// open, the email, files and records about it (the one find, lens-ask body.find, no AI), the thread below with Edit and
// Take back on each, and who can see it (only you, in this slice).
// THE CONSULTANT TEACHES IT where it applies, once each (kept in this browser): the first thought kept says a thought
// is a business record; Add a thought on an email is said once; an old thought of hers on a topic that moved asks once;
// a "why did we ...?" with no thought of hers under it says once that she can leave the why next time; a call that just
// ended asks once. Coming, named as coming: asking someone a question, decisions, as of a date, before a meeting,
// sharing with her team.
// Everything goes to the brain as her own sign-in; the brain answers only with her own thoughts (thoughts_view and
// friends ask who is signed in). No regex literals (STANDING-CLAUSES).

import { fmtDate } from "./dates.js?v=2026-10-22-dates";

let C = null;   // { sb, el, $, openPanel, askBody, goThoughts, startThought, foundCard, findCtx }
let view = 'moving';
// FOR YOU and LEAVE IT FOR SOMEONE (seat every-voice, 2026-10-27, decision 1025): a thought can be left for named people of the
// business; only she and they see it, the owner included. The brain matches the names, keeps her words as the source and makes
// each reader's version in their language, marked as a translation, the original one press away.
let topicOpen = null;

const PREFIXES = ['note for the brain', 'notes for the brain', 'a note for the brain', 'thought for the brain', 'a thought for the brain',
  'note to the brain', 'leave a thoughtgram', 'leave a thought', 'thoughtgram', 'keep this thought'];
const ONCE = { record: 'tool.thought.said-record', email: 'tool.thought.said-email', why: 'tool.thought.said-why', call: 'tool.thought.said-call', stale: 'tool.thought.said-stale', what: 'tool.thought.said-what' };
const COMING = ['asking someone a question and waiting for their thoughtgram', 'marking a thoughtgram as a decision, with its reasons',
  'looking at a topic as it stood on a date', 'a topic brought forward before a meeting', 'sharing a thoughtgram with your team'];

export function initThoughts(ctx) { C = ctx; }

function once(key) {
  try { if (localStorage.getItem(key)) return false; localStorage.setItem(key, String(Date.now())); return true; } catch (_) { return false; }
}
function day(iso) { return fmtDate(iso, 'day'); }
function el(tag, cls, text) { const e = C.el(tag, cls || ''); if (text !== undefined) e.textContent = text; return e; }
function button(label, cls, fn) { const b = el('button', cls || 'go ghost', label); b.type = 'button'; b.addEventListener('click', fn); return b; }
async function rpc(name, args) {
  try {
    const { data, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, why: error.message };
    return data || { ok: false, why: 'No answer came back.' };
  } catch (e) { return { ok: false, why: String(e?.message || e) }; }
}
function turn() {
  const log = C.$('#dock-turns');
  if (!log) return null;
  const t = el('div', 'turn said thought-turn');
  log.appendChild(t);
  C.openPanel();
  return t;
}

// -- LEAVING ONE ------------------------------------------------------------------------------------------------
// The box hands every line here first; true means it was "note for the brain: ..." and is handled.
export function thoughtFromBox(text) {
  if (!C) return false;
  const raw = String(text || '').trim();
  const low = raw.toLowerCase();
  const em = emailWords(low);
  if (em !== null) { emailsSay(em); return true; }
  const p = PREFIXES.find((x) => low.startsWith(x));
  const tw = p ? null : topicWords(raw);
  if (tw) { topicAsk(raw, tw); return true; }
  if (!p) return false;
  const next = low.slice(p.length, p.length + 1);
  if (next && ' :,.-'.indexOf(next) < 0) return false;   // "thoughtgrams are ..." is a question, not a thought
  let rest = raw.slice(p.length).trim();
  while (rest && ':,.-'.includes(rest[0])) rest = rest.slice(1).trim();
  if (!rest) { C.startThought({}); return true; }
  keepThought(rest, {});
  return true;
}

// Her words read back, to correct, then kept. opts: { heard, email, topic, topicTitle }.
export function keepThought(text, opts) {
  const o = opts || {};
  const t = turn();
  if (!t) return;
  const forWho = Array.isArray(o.for) && o.for.filter(Boolean).length ? o.for.filter(Boolean).join(', ') : '';
  t.appendChild(el('p', 'ans-lead', o.email ? 'A thoughtgram on this email, to keep' : o.topicTitle ? 'A thoughtgram on ' + o.topicTitle + ', to keep' : forWho ? 'A thoughtgram for ' + forWho + ', to keep' : 'A thoughtgram to keep'));
  // THE NAME, EXPLAINED ONCE (decision 1026 item 1, seat language-and-nudge).
  if (once(ONCE.what)) t.appendChild(el('p', 'quiet thought-teach', 'A thoughtgram is a thought in your own words, kept with its topic.'));
  if (o.email && o.email.subject) t.appendChild(el('p', 'quiet', 'On: ' + o.email.subject));
  const ta = el('textarea', 'thought-text');
  ta.value = String(text || '');
  ta.rows = Math.min(8, Math.max(3, Math.ceil(ta.value.length / 70)));
  ta.setAttribute('aria-label', 'Your thoughtgram, as it will be kept');
  t.appendChild(ta);
  const forRow = el('label', 'thought-for');
  forRow.appendChild(el('span', 'quiet', 'For (optional): '));
  const forIn = el('input', 'thought-for-in');
  forIn.type = 'text'; forIn.value = Array.isArray(o.for) ? o.for.join(', ') : String(o.for || '');
  forIn.placeholder = 'names of people here, or leave empty for yourself';
  forIn.setAttribute('aria-label', 'Who this thoughtgram is for');
  forRow.appendChild(forIn);
  t.appendChild(forRow);
  // THE NUDGE, AUTHOR'S SWITCH (decision 1026 item 3): the people it is for get one short email from her own mailbox saying
  // a thoughtgram is waiting, never its words. On by default; she can untick it for this one.
  const mailRow = el('label', 'thought-mail');
  const mailOn = el('input', 'thought-mail-in');
  mailOn.type = 'checkbox'; mailOn.checked = true;
  mailRow.append(mailOn, el('span', '', 'Email them that it is waiting (from your mailbox, never your words)'));
  t.appendChild(mailRow);
  const whoSees = el('p', 'quiet');
  const sayWho = () => {
    const names = forIn.value.split(',').map((x) => x.trim()).filter(Boolean);
    whoSees.textContent = (o.heard ? 'This is what was heard. ' : '') + 'Correct anything, then keep it. '
      + (names.length ? 'Only you and ' + names.join(', ') + ' will see it; each reads it in their own language, with your words kept as the original.' : 'Only you can see it.');
    mailRow.hidden = !names.length;
  };
  forIn.addEventListener('input', sayWho); sayWho();
  t.appendChild(whoSees);
  const acts = el('div', 'actions');
  const keep = button('Keep it', 'go', () => go());
  const cancel = button('Cancel', 'go ghost', () => { t.remove(); });
  acts.append(keep, cancel);
  t.appendChild(acts);
  const out = el('div', 'thought-out');
  out.setAttribute('aria-live', 'polite');
  t.appendChild(out);
  ta.focus();
  t.scrollIntoView({ block: 'nearest' });
  async function go() {
    const words = ta.value.trim();
    if (!words) { out.textContent = 'There is nothing to keep yet.'; return; }
    keep.disabled = true; cancel.disabled = true;
    out.innerHTML = '';
    const w = el('p', 'working', 'Keeping your thoughtgram and finding its topic');
    out.appendChild(w);
    const slow = setTimeout(() => { w.textContent = 'Still keeping it: finding its topic is taking longer than usual'; }, 10000);
    const forNames = forIn.value.split(',').map((x) => x.trim()).filter(Boolean);
    if (forNames.length) w.textContent = 'Keeping your thoughtgram for ' + forNames.join(', ') + ' and making their version';
    const r = await C.askBody({ thought: { text: words, heard: o.heard === true, email: o.email || null, topic: o.topic || null, for: forNames } });
    clearTimeout(slow);
    out.innerHTML = '';
    if (!r || r.ok !== true || r.state !== 'thought_kept') {
      out.appendChild(el('p', 'state stalled', String(r?.why || r?.error || 'The thoughtgram could not be kept just now.') + ' Your words are still here.'));
      keep.disabled = false; cancel.disabled = false;
      return;
    }
    ta.readOnly = true; acts.remove(); forIn.readOnly = true; mailOn.disabled = true;
    keptLine(out, r.kept, r);
    if (forNames.length && r.kept?.thought?.id) nudgeLine(out, r.kept.thought.id, mailOn.checked);
    if (document.body.dataset.tab === 'thoughts') loadThoughts();
  }
}

// What happens about the email, said truthfully: turned off for this one, or written and kept while sending from the Tool
// is being proven (mail-send's test lock), or on its way within the hour.
async function nudgeLine(out, id, wanted) {
  const p = el('p', 'quiet thought-mail-said');
  out.appendChild(p);
  if (!wanted) {
    const x = await rpc('thought_nudge_off', { p_thought: id });
    p.textContent = x.ok ? String(x.said || 'No email will go about this thoughtgram.') : 'The email could not be turned off just now: ' + String(x.why || '') + ' It says only that a thoughtgram is waiting, never your words.';
    return;
  }
  const st = await rpc('nudge_send_state', {});
  p.textContent = st && st.state === 'held'
    ? 'HireKraft has written each of them a short email from your mailbox saying a thoughtgram is waiting (never your words). While sending from HireKraft is being proven, that email is kept, not sent.'
    : 'Each of them gets one short email from your mailbox within the hour saying a thoughtgram is waiting, never your words.';
}

function keptLine(out, k, r) {
  const topic = k?.topic;
  out.appendChild(el('p', '', topic ? 'Kept under "' + topic.title + '".' : 'Kept. It is not under any topic yet.'));
  if (r && r.receipt) out.appendChild(el('p', 'thought-said', r.receipt));
  out.appendChild(el('p', 'quiet', 'Who can see it: ' + String(k?.who_can_see || 'only you') + '.'
    + (Array.isArray(k?.for) && k.for.length ? ' ' + k.for.map((p) => p.name).join(' and ') + ' will see it first in Worth your attention.' : '')
    + (r && Array.isArray(r.translated_to) && r.translated_to.length ? ' Their version was made in their language, marked as a translation; your words stay the original.' : '')));
  if (k?.replaced) out.appendChild(el('p', 'quiet', 'It is now your latest view on this topic. Your thoughtgram of ' + day(k.replaced.at) + ' stays in the topic, folded under it.'));
  if (topic && topic.stands) out.appendChild(el('p', 'quiet', 'Where it stands: ' + topic.stands));
  const acts = el('div', 'actions');
  if (topic) acts.appendChild(button('Open the topic', 'go ghost', () => C.goThoughts(topic.id)));
  acts.appendChild(button('Change topic', 'go ghost', () => change()));
  out.appendChild(acts);
  if (once(ONCE.record)) out.appendChild(el('p', 'quiet thought-teach', "A thoughtgram is kept as a business record. Taking one back removes it from answers; it stays in its topic's history."));
  const pick = el('div', 'thought-pick');
  out.appendChild(pick);
  function change() {
    pick.innerHTML = '';
    const others = (Array.isArray(k?.choices) ? k.choices : []).filter((c) => !topic || c.id !== topic.id).slice(0, 4);
    pick.appendChild(el('p', 'quiet', 'Put it under:'));
    const row = el('div', 'actions');
    for (const c of others) row.appendChild(button(c.title, 'go ghost', () => move(c.id, null, c.title)));
    row.appendChild(button('No topic', 'go ghost', () => move(null, null, null)));
    pick.appendChild(row);
    const nt = el('input', 'thought-newtopic'); nt.type = 'text'; nt.placeholder = 'Or a new topic, in a few words';
    nt.setAttribute('aria-label', 'A new topic');
    const save = button('Make it a new topic', 'go ghost', () => { if (nt.value.trim()) move(null, nt.value.trim(), nt.value.trim()); });
    pick.append(nt, save);
  }
  async function move(id, title, label) {
    pick.innerHTML = '';
    pick.appendChild(el('p', 'working', 'Moving it'));
    const r = await rpc('thought_move', { p_thought: k.thought.id, p_topic: id, p_new_title: title });
    pick.innerHTML = '';
    if (!r.ok) { pick.appendChild(el('p', 'state stalled', String(r.why || 'It could not be moved.'))); return; }
    pick.appendChild(el('p', '', label ? 'Moved to "' + label + '".' : 'It is no longer under any topic.'));
    if (r.topic) k.topic = r.topic;
  }
}

// From an open email (mail.js): the box takes the thought, linked to this email.
export function thoughtOnEmail(email) {
  C.startThought({ email });
  if (once(ONCE.email)) {
    const t = turn();
    if (t) t.appendChild(el('p', 'quiet', "Say or type what you think about this email in the box, then Go. It is kept with the email's topic, for you only."));
  }
}

// -- THE CONSULTANT, AT THE MOMENT IT APPLIES -----------------------------------------------------------------------
// After an answer: a "why did we / why did I" question, and no thought of hers among what it read.
export function afterAnswer(question, body, slot) {
  if (!C || !slot) return;
  const q = String(question || '').toLowerCase().trim();
  if (!(q.startsWith('why did we') || q.startsWith('why did i') || q.startsWith('why do we') || q.startsWith('why are we'))) return;
  const cited = Array.isArray(body?.citations) ? body.citations : [];
  if (cited.some((c) => String(c?.source || c?.where || '').toLowerCase().startsWith('thought'))) return;
  if (!once(ONCE.why)) return;
  const p = el('p', 'quiet thought-teach', 'None of your own thoughtgrams are kept on this. Next time you decide something, say why in a thoughtgram (Leave a thoughtgram, under the +), and the Tool will have your reasons when this is asked again.');
  slot.appendChild(p);
}

// On opening the Tool: a call that just ended, once per call.
export async function afterCall() {
  if (!C) return;
  const r = await rpc('thought_offer_after_call', {});
  if (!r || r.ok !== true || !r.meeting) return;
  const key = ONCE.call + ':' + r.meeting.id;
  if (!once(key)) return;
  const t = turn();
  if (!t) return;
  t.appendChild(el('p', '', 'Your meeting "' + r.meeting.title + '" ended at ' + fmtDate(r.meeting.end, 'time') + '. Want to leave a thoughtgram on it while it is fresh?'));
  const acts = el('div', 'actions');
  acts.appendChild(button('Leave a thoughtgram', 'go', () => { C.startThought({ topicTitle: r.meeting.title }); }));
  acts.appendChild(button('Not now', 'go ghost', () => t.remove()));
  t.appendChild(acts);
}

// -- THE TAB --------------------------------------------------------------------------------------------------------
export async function loadThoughts(openId) {
  if (!C) return;
  const host = C.$('#thoughts');
  if (!host) return;
  if (openId) topicOpen = openId;
  host.innerHTML = '';
  const top = el('div', 'thought-top');
  const views = el('div', 'thought-views');
  views.setAttribute('role', 'group'); views.setAttribute('aria-label', 'How to see your thoughtgrams');
  for (const [k, label] of [['for_you', 'For you'], ['moving', 'Moving'], ['topics', 'Topics'], ['mine', 'Mine']]) {
    const b = button(label, 'go ghost thought-view', () => { view = k; topicOpen = null; loadThoughts(); });
    b.setAttribute('aria-pressed', String(!topicOpen && view === k));
    views.appendChild(b);
  }
  top.append(views, button('Leave a thoughtgram', 'go', () => C.startThought(topicOpen ? { topic: topicOpen, topicTitle: host.dataset.title || '' } : {})));
  host.appendChild(top);
  const body = el('div', 'thought-body');
  host.appendChild(body);
  body.appendChild(el('p', 'working', 'Reading your thoughtgrams'));
  const r = await rpc('thoughts_view', { p_view: topicOpen ? 'topic' : view, p_topic: topicOpen || null });
  body.innerHTML = '';
  if (!r || r.ok !== true) { body.appendChild(el('p', 'state stalled', String(r?.why || 'Your thoughtgrams could not be read just now.'))); return; }
  if (r.view === 'topic') { drawTopic(body, r); return; }
  host.dataset.title = '';
  if (r.view === 'mine') { drawMine(body, r.thoughts || []); return; }
  if (r.view === 'for_you') { drawForYou(body, r); return; }
  drawList(body, r);
}

function intro(body) {
  const box = el('div', 'thought-intro');
  box.appendChild(el('p', 'ans-lead', 'A thoughtgram is something you say once, and the Tool keeps with its topic.'));
  box.appendChild(el('p', '', 'Talk or type an update, a view or a plan about something you are working on. The Tool files it under its topic on its own, and brings it up, dated and in your words, whenever that topic is asked about ("You noted on Oct 25 that ..."). It is never treated as a fact, and a newer thoughtgram on the same topic replaces the older one in answers, while the older one stays in the topic history.'));
  box.appendChild(el('p', '', 'To leave one: press Leave a thoughtgram (here, or under the + in the box), on an open email press Add a thoughtgram, or start what you say with "note for the brain".'));
  box.appendChild(el('p', 'quiet', 'A thoughtgram you keep for yourself is yours alone; one you leave for people here is seen by you and them, and they get one short email saying it is waiting. Coming later: ' + COMING.join('; ') + '.'));
  body.appendChild(box);
}

function topicCard(tp, moving) {
  const li = el('li', 'thought-card');
  const b = button(tp.title, 'thought-title', () => { topicOpen = tp.id; loadThoughts(); });
  li.appendChild(b);
  if (tp.stands) li.appendChild(el('p', '', tp.stands));
  const moved = [];
  if (tp.new_thoughts > 0) moved.push(tp.new_thoughts + ' new thoughtgram' + (tp.new_thoughts === 1 ? '' : 's'));
  if (tp.new_mail > 0) moved.push(tp.new_mail + ' new email' + (tp.new_mail === 1 ? '' : 's') + ' naming ' + tp.party);
  const meta = [moving && moved.length ? 'What moved: ' + moved.join(', ') : '', 'Last thoughtgram ' + day(tp.last_at), tp.thoughts + ' thoughtgram' + (tp.thoughts === 1 ? '' : 's')].filter(Boolean);
  li.appendChild(el('p', 'quiet', meta.join(' · ')));
  // STILL TRUE, the first slice of it: her own thought is older than email that moved the topic. Asked once per topic.
  if (moving && tp.new_mail > 0 && tp.new_thoughts === 0 && once(ONCE.stale + ':' + tp.id + ':' + String(tp.last_at))) {
    const ask = el('p', 'thought-teach', 'Your last thoughtgram here is from ' + day(tp.last_at) + ', and email has come in since. Want to add one?');
    li.appendChild(ask);
    li.appendChild(button('Add a thoughtgram', 'go ghost', () => C.startThought({ topic: tp.id, topicTitle: tp.title })));
  }
  return li;
}

function drawList(body, r) {
  const topics = Array.isArray(r.topics) ? r.topics : [];
  if (!r.all_topics && !r.unfiled) { intro(body); return; }
  if (view === 'moving') {
    body.appendChild(el('p', 'quiet', topics.length ? 'Topics where something changed since you last opened them.' : 'Nothing has moved since you last looked. Your topics are under Topics.'));
  } else {
    body.appendChild(el('p', 'quiet', r.all_topics + ' topic' + (r.all_topics === 1 ? '' : 's') + ', newest first. To merge two, open one and choose Merge; to split one, move a thoughtgram from it to a new topic.'));
  }
  const ul = el('ul', 'thought-list');
  for (const tp of topics) ul.appendChild(topicCard(tp, view === 'moving'));
  body.appendChild(ul);
  if (r.unfiled) body.appendChild(el('p', 'quiet', r.unfiled + ' thoughtgram' + (r.unfiled === 1 ? ' is' : 's are') + ' not under any topic; they are under Mine.'));
}

// Thoughts others left for her, newest first, in her language. Opening this view marks them read (the author can see that).
function drawForYou(body, r) {
  const items = Array.isArray(r.items) ? r.items : [];
  const ln = r.your_language && r.your_language.name ? r.your_language.name : 'English';
  if (!items.length) {
    body.appendChild(el('p', 'quiet', 'Nobody has left you a thoughtgram yet. When someone here does, it shows first here and in Worth your attention, in ' + ln + '.'));
    return;
  }
  body.appendChild(el('p', 'quiet', 'Thoughtgrams people here left for you, newest first, in ' + ln + '. Only the person who left one and the people it is for can see it.'));
  const ul = el('ul', 'thought-thread');
  for (const it of items) ul.appendChild(forYouItem(it));
  body.appendChild(ul);
}
function forYouItem(it) {
  const li = el('li', 'thought-item thought-current');
  li.appendChild(el('p', 'quiet', [String(it.from || 'Someone') + ' left you a thoughtgram', day(it.at), it.heard ? 'spoken' : '', it.read ? '' : 'new'].filter(Boolean).join(' · ')));
  const said = el('p', 'thought-said', String(it.text || ''));
  li.appendChild(said);
  if (it.translated) li.appendChild(el('p', 'quiet', 'Translated from ' + it.lang_name + ' by the Tool. The original is what ' + String(it.from || 'they') + ' said.'));
  else if (it.lang && it.reader_lang && it.lang !== it.reader_lang) li.appendChild(el('p', 'quiet', 'In ' + it.lang_name + ', not translated yet.'));
  li.appendChild(el('p', 'quiet', 'Who can see this: ' + String(it.who_can_see || '') + '.'));
  const acts = el('div', 'actions');
  if (it.translated) {
    let orig = null;
    const b = button('See the original', 'go ghost', () => {
      if (orig) { orig.remove(); orig = null; b.textContent = 'See the original'; return; }
      orig = el('p', 'thought-said thought-original', String(it.original || '')); orig.lang = it.lang || '';
      said.after(orig); b.textContent = 'Hide the original';
    });
    acts.appendChild(b);
  }
  acts.appendChild(button('Reply with a thoughtgram', 'go ghost', () => C.startThought({ for: [String(it.from || '')] })));
  li.appendChild(acts);
  return li;
}

function thoughtItem(th, opts) {
  const li = el('li', 'thought-item thought-' + th.state);
  const readBy = Array.isArray(th.read_by) && th.read_by.length ? 'read by ' + th.read_by.map((x) => x.name).join(', ') : '';
  const head = el('p', 'quiet', [day(th.at), th.heard ? 'spoken' : '', th.edited_at ? 'changed ' + day(th.edited_at) : '', opts?.topic && th.topic ? 'on ' + th.topic.title : '', 'who can see this: ' + String(th.who_can_see || 'only you'), readBy].filter(Boolean).join(' · '));
  li.appendChild(head);
  const text = el('p', 'thought-said', th.text);
  li.appendChild(text);
  if (th.email && th.email.subject) li.appendChild(el('p', 'quiet', 'Left on the email: ' + th.email.subject));
  if (th.state === 'retracted') li.appendChild(el('p', 'quiet', 'Taken back on ' + day(th.retracted_at) + ': out of answers, kept here.'));
  const acts = el('div', 'actions');
  if (th.state !== 'retracted') {
    acts.appendChild(button('Edit', 'go ghost', () => edit()));
    acts.appendChild(button('Take back', 'go ghost', async () => { const x = await rpc('thought_retract', { p_thought: th.id }); if (x.ok) loadThoughts(); else acts.appendChild(el('p', 'state stalled', String(x.why))); }));
  } else {
    acts.appendChild(button('Put it back', 'go ghost', async () => { const x = await rpc('thought_retract', { p_thought: th.id, p_undo: true }); if (x.ok) loadThoughts(); }));
  }
  if (opts?.move) acts.appendChild(button('Move', 'go ghost', () => opts.move(th, li)));
  li.appendChild(acts);
  function edit() {
    const ta = el('textarea', 'thought-text'); ta.value = th.text; ta.rows = 4; ta.setAttribute('aria-label', 'Your thoughtgram');
    text.replaceWith(ta); acts.hidden = true;
    const row = el('div', 'actions');
    const said = el('p', 'quiet'); said.setAttribute('aria-live', 'polite');
    row.appendChild(button('Keep the change', 'go', async () => {
      said.textContent = ''; said.className = 'working'; said.textContent = 'Keeping the change';
      const r = await C.askBody({ thought: { text: ta.value, edit: th.id } });
      if (r && r.state === 'thought_kept') loadThoughts(); else { said.className = 'state stalled'; said.textContent = String(r?.why || r?.error || 'The change could not be kept.'); }
    }));
    row.appendChild(button('Cancel', 'go ghost', () => loadThoughts()));
    li.append(row, said);
  }
  return li;
}

function folded(list, word, opts) {
  if (!list.length) return null;
  const d = el('details', 'thought-fold');
  d.appendChild(el('summary', '', list.length + ' ' + word + (list.length === 1 ? '' : 's')));
  const ul = el('ul', 'thought-thread');
  for (const th of list) ul.appendChild(thoughtItem(th, opts));
  d.appendChild(ul);
  return d;
}

function drawMine(body, thoughts) {
  if (!thoughts.length) { intro(body); return; }
  body.appendChild(el('p', 'quiet', 'Your thoughtgrams, newest first. Earlier views and thoughtgrams you took back are folded; open them to see how your thinking changed.'));
  const ul = el('ul', 'thought-thread');
  const earlier = [];
  for (const th of thoughts) { if (th.state === 'current') ul.appendChild(thoughtItem(th, { topic: true })); else earlier.push(th); }
  body.appendChild(ul);
  const f = folded(earlier, 'earlier view or taken-back thoughtgram', { topic: true });
  if (f) body.appendChild(f);
}

function drawTopic(body, r) {
  const tp = r.topic;
  const thoughts = Array.isArray(r.thoughts) ? r.thoughts : [];
  C.$('#thoughts').dataset.title = tp.title;
  body.appendChild(button('All topics', 'go ghost thought-back', () => { topicOpen = null; loadThoughts(); }));
  const h = el('h3', 'thought-h', tp.title);
  body.appendChild(h);
  // The current picture, in this slice: her latest view, what it replaced, what is still open.
  const cur = thoughts.find((x) => x.state === 'current');
  const pic = el('div', 'thought-picture');
  if (cur) {
    pic.appendChild(el('p', 'quiet', 'Your latest view, ' + day(cur.at)));
    pic.appendChild(el('p', 'thought-said', cur.text));
    const prev = thoughts.find((x) => x.state === 'superseded');
    if (prev) pic.appendChild(el('p', 'quiet', 'It replaced your view of ' + day(prev.at) + ': ' + String(prev.text).slice(0, 200) + (String(prev.text).length > 200 ? '...' : '')));
  } else {
    pic.appendChild(el('p', 'quiet', 'Every thoughtgram on this topic was taken back. They are kept below.'));
  }
  if (tp.stands) pic.appendChild(el('p', '', 'Where it stands: ' + tp.stands));
  const open = Array.isArray(tp.open) ? tp.open : [];
  if (open.length) {
    pic.appendChild(el('p', '', 'Still open:'));
    const ul = el('ul', 'thought-open');
    for (const o of open) ul.appendChild(el('li', '', String(o)));
    pic.appendChild(ul);
  }
  body.appendChild(pic);
  const acts = el('div', 'actions');
  acts.appendChild(button('Add a thoughtgram here', 'go', () => C.startThought({ topic: tp.id, topicTitle: tp.title })));
  acts.appendChild(button('Rename', 'go ghost', () => rename()));
  const others = Array.isArray(r.others) ? r.others : [];
  if (others.length) acts.appendChild(button('Merge into another topic', 'go ghost', () => merge()));
  body.appendChild(acts);
  const tools = el('div', 'thought-pick');
  body.appendChild(tools);
  // What the records say about it: the one find (no AI), the topic's words and its person or company.
  const about = el('div', 'thought-about');
  about.appendChild(el('h4', '', 'About it in your mail, files and records'));
  const slot = el('div', 'thought-found');
  about.appendChild(slot);
  body.appendChild(about);
  findAbout(slot, tp);
  // The thread: the current view and earlier ones (folded), and any taken back.
  body.appendChild(el('h4', '', 'Your thoughtgrams on it'));
  const ul = el('ul', 'thought-thread');
  const mover = (th, li) => {
    const pick = el('div', 'actions');
    for (const o of others.slice(0, 6)) pick.appendChild(button(o.title, 'go ghost', async () => { const x = await rpc('thought_move', { p_thought: th.id, p_topic: o.id }); if (x.ok) loadThoughts(); }));
    const nt = el('input', 'thought-newtopic'); nt.type = 'text'; nt.placeholder = 'Or a new topic, in a few words'; nt.setAttribute('aria-label', 'A new topic');
    pick.appendChild(nt);
    pick.appendChild(button('Split it into a new topic', 'go ghost', async () => { if (!nt.value.trim()) return; const x = await rpc('thought_move', { p_thought: th.id, p_new_title: nt.value.trim() }); if (x.ok) loadThoughts(); }));
    li.appendChild(pick);
  };
  const rest = [];
  for (const th of thoughts) { if (th.state === 'current') ul.appendChild(thoughtItem(th, { move: mover })); else rest.push(th); }
  body.appendChild(ul);
  const f = folded(rest, 'earlier view or taken-back thoughtgram', { move: mover });
  if (f) body.appendChild(f);
  function rename() {
    tools.innerHTML = '';
    const i = el('input', 'thought-newtopic'); i.type = 'text'; i.value = tp.title; i.setAttribute('aria-label', 'The topic, in a few words');
    tools.append(i, button('Save the name', 'go ghost', async () => { const x = await rpc('thought_topic_change', { p_topic: tp.id, p_title: i.value }); if (x.ok) loadThoughts(); else tools.appendChild(el('p', 'state stalled', String(x.why))); }));
  }
  function merge() {
    tools.innerHTML = '';
    tools.appendChild(el('p', 'quiet', 'Merge "' + tp.title + '" into:'));
    const row = el('div', 'actions');
    for (const o of others.slice(0, 8)) row.appendChild(button(o.title, 'go ghost', async () => { const x = await rpc('thought_topic_change', { p_topic: tp.id, p_merge_into: o.id }); if (x.ok) { topicOpen = x.topic?.id || null; loadThoughts(); } }));
    tools.appendChild(row);
  }
}

async function findAbout(slot, tp) {
  const w = el('p', 'working', 'Bringing together the email, files and records about it');
  slot.appendChild(w);
  const q = tp.party ? tp.title + ' ' + tp.party : tp.title;
  const r = await C.askBody({ question: q, find: { about: tp.title, party: tp.party || null } });
  slot.innerHTML = '';
  if (r && r.state === 'found' && r.found) { C.foundCard(slot, r, C.findCtx({ q })); return; }
  slot.appendChild(el('p', 'quiet', String(r?.answer || r?.error || 'Nothing about it was found in your mail, files or records.')));
}

// THE RECIPIENT'S SWITCH, SAID IN THE BOX (decision 1026 item 3): "stop emailing me about thoughtgrams" turns the emails
// off; "email me about thoughtgrams" turns them back on. The same switch sits under her name at the top (words.js).
function emailWords(low) {
  if (low.indexOf('thoughtgram') < 0 || !(low.indexOf('email') >= 0 || low.indexOf('mail') >= 0)) return null;
  if (low.startsWith('stop') || low.startsWith('no more') || low.startsWith("don't") || low.startsWith('do not') || low.startsWith('turn off')) return false;
  if (low.startsWith('email me') || low.startsWith('start') || low.startsWith('turn on') || low.startsWith('send me')) return true;
  return null;
}
async function emailsSay(on) {
  const t = turn();
  if (!t) return;
  const x = await rpc('thoughtgram_emails_set', { p_on: on });
  t.appendChild(el('p', x.ok ? '' : 'state stalled', x.ok ? String(x.said) : String(x.why || 'That could not be changed just now.')));
}

// MERGE OR SPLIT, SAID IN THE BOX: "merge the topics A and B", "merge topic A into B", "split the topic A". Both topics
// must be hers (the brain checks again). A merge is read back with one button; a split opens the topic, where any
// thought moves to a new topic in one tap.
function topicWords(raw) {
  const low = raw.toLowerCase();
  if (!(low.startsWith('merge ') || low.startsWith('split ')) || low.indexOf('topic') < 0) return null;
  return low.startsWith('merge') ? 'merge' : 'split';
}
async function topicAsk(raw, kind) {
  const t = turn();
  if (!t) return;
  const r = await rpc('thoughts_view', { p_view: 'topics' });
  const topics = (r && r.ok && Array.isArray(r.topics)) ? r.topics : [];
  const low = raw.toLowerCase();
  const named = topics.filter((x) => low.includes(String(x.title).toLowerCase())).sort((a, b) => low.indexOf(String(a.title).toLowerCase()) - low.indexOf(String(b.title).toLowerCase()));
  if (kind === 'split') {
    if (!named.length) { t.appendChild(el('p', '', 'I could not tell which of your topics to split. Open it under Thoughtgrams, then move a thoughtgram to a new topic.')); return; }
    t.appendChild(el('p', '', 'To split "' + named[0].title + '", move the thoughtgrams that belong apart to a new topic, one tap each.'));
    t.appendChild(button('Open the topic', 'go', () => C.goThoughts(named[0].id)));
    return;
  }
  if (named.length < 2) { t.appendChild(el('p', '', 'I could not find two of your topics by those names. Your topics are under Thoughtgrams, Topics; each one has Merge into another topic.')); return; }
  const [a, b] = named;
  t.appendChild(el('p', '', 'Merge "' + a.title + '" into "' + b.title + '"? Every thoughtgram on it moves over; nothing is lost.'));
  const acts = el('div', 'actions');
  acts.appendChild(button('Merge them', 'go', async () => {
    acts.remove();
    const x = await rpc('thought_topic_change', { p_topic: a.id, p_merge_into: b.id });
    t.appendChild(el('p', x.ok ? '' : 'state stalled', x.ok ? 'Merged into "' + b.title + '".' : String(x.why)));
  }));
  acts.appendChild(button('Cancel', 'go ghost', () => t.remove()));
  t.appendChild(acts);
}

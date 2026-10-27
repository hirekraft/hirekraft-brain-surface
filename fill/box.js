// THE ONE BOX (seat one-box, 2026-10-08), NOW SPOKEN TO (seat talk-to-the-tool, 2026-10-12).
// Alex, 2026-10-11: "Whenever I ask the tool anything, it goes back to the email screen to answer it... which
// is odd. And I also want to be able to answer with my voice. And that's not there. So just talk to the tool."
// Capability, in her words: "I just talk to the Tool."
//
// ONE CONVERSATION DECIDES. What she says goes to the conversation, and the conversation (lens-ask) decides
// what to do with it: answer it, show the emails it rests on (drawn inside the answer, each opening its email
// on Mail: lens.js emailList), or, about an open email, answer it or draft the reply (lens-ask's own draft
// step). The screen moves to Mail only when she opens an email from an answer.
// SUPERSEDES the word rules this file carried (seat one-box, 2026-10-08, and HQ's reversed default of
// 2026-10-11): find / ask / do decided by the first word, and anything short or without a question mark sent
// to an email search on the Mail tab. Removed, not left beside the new path.
// THE COST, MEASURED (edge logs, 24 h to 2026-10-12): the old instant email search answered in 3.0 s at the
// median (8.8 s at the 90th percentile); the conversation answers in 7.3 s (13.2 s). A find now waits about
// four seconds longer and comes back as an answer with the emails in it. Chosen deliberately: one place
// decides, and nothing guesses from the first word. If a find must be instant again, the place is lens-ask
// (decide first, then search live), not word rules here.
// WHERE IT LANDS: on Mail, about the open email (the "about this email" chip), with that email; everything else,
// on every tab, the one conversation in the panel on the right (lens.js ask). Mail's own conversation about no
// one email is retired (seat conversation-panel, 2026-10-12): it was a second place a conversation was shown.
// TWO BOXES, ONE PATH (seat conversation-panel): the box at the top and the follow-up box at the foot of the
// panel go through the same submit and share one microphone; only the top one shows examples and chips.
// THE ONE EXCEPTION is a mailbox she names as a mailbox ("open accounting@"): that opens it, so a mailbox kept
// from her goes to the door and is refused there, recorded, and said (seat refusal-wire). A pointer, not a guess.
// No pattern here carries a backslash (the repository write tool mangles them; STANDING-CLAUSES).
//
// THE MICROPHONE. Press it, speak, see the words appear as she talks, press again to stop; the words stay in the
// box so she can fix them, then Go. The browser's own speech recognition does it where the browser has it
// (Chrome, Edge, Safari, on the phone too). Where it does not, the browser records and lens-ask writes the
// recording down with the voicemail reader's transcription (whisper-1), and the words land in the box the same
// way. Where the browser can do neither, the button says so when pressed: never a dead button.
// READ ALOUD. A switch beside it reads each new answer's opening aloud in the browser's own voice. Off by
// default; remembered in this browser only.
//
// SCOPE IS A CHIP, NOT A SETTING. With a mailbox open on Mail the box shows "in <mailbox>"; with an
// email open, "about this email". Removing a chip widens the request.
// EXAMPLES are built from what she can see on this screen right now. None is written here as a fixed
// question, because an offered question the Tool cannot answer teaches that the box is decoration.

let C = null;
const off = { mailbox: null, email: null };   // which chip she removed, by what it named
// LEAVING A THOUGHT (seat thoughtgram, 2026-10-25, decisions 1015-1017). Leave a thought (the + menu in both boxes, the
// Thoughts tab, an open email) puts the box in thought mode, shown as a chip: what she then says or types is not asked,
// it goes to the thought card (fill/thoughts.js) to be read back, corrected and kept. Removing the chip asks again.
let thinking = null;      // { email?, topic? } while she is leaving a thought
let thinkHeard = false;   // she spoke it (the words are kept, never the audio)
const THINK_PH = 'Say or type your thought. It is kept for you, not answered';
export function startThought(opts, which) {
  thinking = opts && typeof opts === 'object' ? opts : {};
  thinkHeard = false;
  drawBox();
  const i = $(which === 'panel' ? '#panel-input' : '#ask-input');
  if (i) i.focus();
}

const DEFAULT_PH = 'Ask or tell the Tool anything';
// Used only to read a mailbox she names ("open accounting@"), never to decide what she means.
const FIND_FIRST = ['find', 'search', 'locate', 'show', 'pull', 'open', 'get'];

const $ = (s) => document.querySelector(s);

// What the box asks about right now, after any chip she removed.
function scope() {
  const s = C.mailScope();
  const onMail = C.onMail();
  const mailbox = onMail && s && s.key && off.mailbox !== s.key ? { key: s.key, address: s.address || s.key } : null;
  const email = onMail && s && s.emailOpen && off.email !== s.threadKey;
  return { mailbox, email: !!email, raw: s, onMail };
}

function chip(label, onRemove) {
  const c = C.el('span', 'onebox-chip');
  c.appendChild(document.createTextNode(label));
  const x = C.el('button');
  x.type = 'button';
  x.textContent = 'x';
  x.title = 'Remove: ask more widely';
  x.setAttribute('aria-label', 'Remove ' + label);
  x.addEventListener('click', () => { onRemove(); drawBox(); $('#ask-input')?.focus(); });
  c.appendChild(x);
  return c;
}

export function drawBox() {
  if (!C) return;
  const host = $('#onebox-chips'), input = $('#ask-input');
  if (!host || !input) return;
  const sc = scope();
  host.innerHTML = '';
  if (sc.mailbox) host.appendChild(chip('in ' + sc.mailbox.address, () => { off.mailbox = sc.mailbox.key; }));
  if (sc.email && !thinking) host.appendChild(chip('about this email', () => { off.email = sc.raw.threadKey; }));
  if (thinking) host.appendChild(chip(thinking.email ? 'a thought on this email' : thinking.topicTitle ? 'a thought on ' + thinking.topicTitle : Array.isArray(thinking.for) && thinking.for.length ? 'a thought for ' + thinking.for.join(', ') : 'leaving a thought', () => { thinking = null; }));
  const pin = $('#panel-input');
  if (pin) pin.placeholder = thinking ? THINK_PH : (pin.dataset.ph || (pin.dataset.ph = pin.placeholder));
  input.placeholder = thinking ? THINK_PH : sc.email ? 'Ask about this email, have it answered, or find another'
    : C.continuing && C.continuing() ? 'Continue the conversation on the right, or press New there' : DEFAULT_PH;
}

function firstName(n) {
  const s = String(n || '').trim();
  if (!s || s.includes('@')) return '';
  return s.split(' ')[0].replace(/[^A-Za-z'-]/g, '');
}

function domainLabel(email) {
  const d = String(email || '').split('@')[1] || '';
  const parts = d.split('.');
  const root = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return root ? root.charAt(0).toUpperCase() + root.slice(1) : '';
}

const MACHINE = ['noreply', 'no-reply', 'donotreply', 'notification', 'notifications', 'mailer', 'info', 'news'];

// At most four, each something the Tool can do with what is on this screen.
function examples() {
  const h = C.mailHints() || {};
  const sc = scope();
  const out = [];
  if (sc.email && h.open) {
    out.push("Reply to this saying we'll confirm by Friday");
    const fn = firstName(h.open.from_name);
    if (fn) out.push('What else do we know about ' + fn + '?');
  }
  const own = new Set((C.mailboxAddresses() || []).map((a) => String(a).split('@')[1]));
  const people = (h.recent || []).filter((r) => {
    const local = String(r.from_email || '').split('@')[0];
    return firstName(r.from_name) && !MACHINE.some((m) => local.includes(m));
  });
  if (people[0]) out.push('Find the latest email from ' + firstName(people[0].from_name));
  const outside = people.find((r) => {
    const d = String(r.from_email || '').split('@')[1];
    return d && !own.has(d) && !['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'].includes(d);
  });
  if (outside && domainLabel(outside.from_email)) out.push('What does the company know about ' + domainLabel(outside.from_email) + '?');
  if ((C.mailboxAddresses() || []).length) out.push(sc.mailbox ? 'Find the latest invoice in ' + sc.mailbox.address : 'Find the latest invoice in any mailbox');
  return [...new Set(out)].slice(0, 4);
}

function showTips(on) {
  const tips = $('#onebox-tips'), input = $('#ask-input');
  if (!tips || !input) return;
  if (!on || input.value.trim()) { tips.hidden = true; return; }
  const list = examples();
  tips.innerHTML = '';
  const lead = C.el('p', 'quiet');
  lead.textContent = 'Say what you need, in your own words. It finds emails, answers from everything the company knows, or drafts the reply.';
  tips.appendChild(lead);
  for (const e of list) {
    const b = C.el('button', 'onebox-tip');
    b.type = 'button';
    b.textContent = e;
    // mousedown, so it lands before the input's blur hides the list
    b.addEventListener('mousedown', (ev) => { ev.preventDefault(); input.value = ''; tips.hidden = true; submit(e); });
    tips.appendChild(b);
  }
  tips.hidden = false;
}

function submit(text, fromPanel) {
  let t = String(text || '').trim();
  if (!t && !pending.length) return;
  // FILES GO WITH THE QUESTION (seat add-files): to the panel's conversation, which lens-ask answers with them. The
  // mailbox-name find and the open email's own conversation do not carry files, so a question with files skips both.
  if (pending.length || adding) {
    const box = $(fromPanel ? '#panel-input' : '#ask-input');
    if (adding || (C.busy && C.busy())) {
      if (box && t) box.value = t;
      drawTrays(adding ? 'Still adding. Press Go again in a moment.' : 'Wait for the answer above, then press Go again: your files are still here.');
      return;
    }
    if (!t) t = pending.length === 1 ? 'What does the file I added say, and what matters in it?' : 'What do the files I added say, and what matters in them?';
    const files = pending.map((f) => ({ name: f.name, mime: f.mime, b64: f.b64 }));
    pending = [];
    drawTrays();
    stopSpeaking();
    C.ask(t, files);
    return;
  }
  stopSpeaking();
  // A THOUGHT SHE LEAVES (seat thoughtgram): in thought mode, or said as "note for the brain: ...", it is kept, not asked.
  if (thinking) { const o = thinking; thinking = null; const heard = thinkHeard; thinkHeard = false; drawBox(); if (C.keepThought) C.keepThought(t, Object.assign({}, o, { heard })); return; }
  if (C.thought && C.thought(t)) return;
  // A WATCH SHE ASKS FOR (seat watches, 2026-10-23): "tell me when anyone mentions a late payment" is kept as a watch
  // in the brain, not answered; "what are you watching" lists them. Everything else goes on as before.
  if (C.watch && C.watch(t)) return;
  const sc = scope();
  const named = sc.mailbox ? null : namedMailbox(t);
  if (named) { find(t, named); return; }
  // A follow-up typed in the panel always continues the panel's conversation.
  if (!fromPanel && sc.email && C.askFromMailBar(t)) return;
  C.ask(t);
}

// A MAILBOX SHE NAMES GOES TO THE DOOR (seat refusal-wire, 2026-10-08). Until now "open accounting@" was a
// find across the mailboxes she can already open, so a mailbox kept from her was never asked about: nothing
// refused, nothing recorded, an empty search. Now an address she names AS A MAILBOX (after open, in, inbox,
// mailbox, check or read; as a possessive, alex@'s; or alone as a shorthand, accounting@) at one of her own company's domains is matched
// to her mailboxes: hers, and the find is scoped to it; not hers, and the find is sent to it anyway, so the
// door (worklens-live) refuses it, records it and says so. This file decides nothing about access. An address
// used any other way (emails from kevin@client.com) stays an ordinary find and is never sent to the door.
const REACH_BEFORE = ['open', 'in', 'into', 'inbox', 'mailbox', 'check', 'read'];
function namedMailbox(text) {
  const raw = String(text || '').toLowerCase().split(' ').filter(Boolean);
  const mine = (C.mailboxAddresses() || []).map((a) => String(a).toLowerCase());
  const domains = [...new Set(mine.map((a) => a.split('@')[1]).filter(Boolean))];
  for (let i = 0; i < raw.length; i++) {
    const poss = raw[i].endsWith("'s");
    const tok = (poss ? raw[i].slice(0, -2) : raw[i]).replace(/[^a-z0-9@._+-]/g, '');
    const at = tok.indexOf('@');
    if (at <= 0) continue;
    const local = tok.slice(0, at), domain = tok.slice(at + 1);
    if (!(poss || REACH_BEFORE.includes(raw[i - 1] || '') || (raw.length <= 2 && !domain))) continue;
    const hit = mine.find((a) => domain ? a === tok : a.split('@')[0] === local);
    const rest = raw.filter((w, k) => k !== i && !FIND_FIRST.includes(w) && !REACH_BEFORE.includes(w) && w !== 'me').join(' ');
    if (hit) return { key: 'gmail:' + hit, rest };
    if (domain && !domains.includes(domain)) return null;
    const dom = domain || domains[0];
    return dom ? { key: 'gmail:' + local + '@' + dom, rest } : null;
  }
  return null;
}

// A mailbox she named: open it on Mail, the find scoped to it, so the door decides (worklens-live).
function find(text, named) {
  C.showMail();
  C.findMail(named.rest || 'in:inbox', [named.key], { askInstead: () => { C.clearFind(); C.ask(text); } });
}

export function initBox(ctx) {
  C = ctx;
  const input = $('#ask-input'), send = $('#ask-send');
  if (!input || !send) return;
  const go = () => { const v = input.value; input.value = ''; showTips(false); submit(v); };
  const pin = $('#panel-input'), psend = $('#panel-send');
  if (pin && psend) {
    const pgo = () => { const v = pin.value; pin.value = ''; submit(v, true); };
    psend.addEventListener('click', pgo);
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pgo(); } stopSpeaking(); });
  }
  send.addEventListener('click', go);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); go(); }
    if (e.key === 'Escape') showTips(false);
  });
  input.addEventListener('focus', () => showTips(true));
  input.addEventListener('input', () => showTips(true));
  input.addEventListener('blur', () => setTimeout(() => showTips(false), 120));
  input.addEventListener('keydown', () => stopSpeaking());
  wireMic();
  wireSpeak();
  wireAdd();
  drawBox();
  ownerLines();
}

// -- ADD A FILE OR A PICTURE (seat add-files, 2026-10-13; Alex 2026-10-12, decision 997) --
// "Could we also have a place like in Claude to add a file, like the plus sign... a screenshot or anything... maybe even
// a connector." The + in both boxes offers: Add a file; Add a picture or screenshot (also paste one, or drop files on the
// box, the conversation or Work); Connect something, which opens the one connect flow (openConnect in lens.js), never a
// second connect screen. What is added waits under the box and goes with the next question; lens-ask reads it in that
// same turn and the answer says what it read. The limits are lens-ask's (5 files, 15 MB together, 5 MB a picture), so a
// file that cannot go is said here at once instead of being sent to fail. Keeping files in the brain is a later step:
// until it exists the tray says they are not kept, and nothing here stores anything.
const ADD_MAX_FILES = 5, ADD_MAX_BYTES = 15000000, ADD_MAX_PICTURE = 5000000;
const PICTURES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const TRAYS = ['#onebox-files', '#panel-files'];
let pending = [];   // { id, name, mime, size, b64 }
let adding = 0;
let addFrom = 'top';

function sizeWord(n) { return n >= 1000000 ? (n / 1000000).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1000)) + ' KB'; }
function stamp() {
  const d = new Date(); const p = (x) => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' at ' + p(d.getHours()) + '.' + p(d.getMinutes()) + '.' + p(d.getSeconds());
}

function drawTrays(note) {
  for (const sel of TRAYS) {
    const t = $(sel);
    if (!t) continue;
    t.innerHTML = '';
    if (!pending.length && !adding && !note) { t.hidden = true; continue; }
    for (const f of pending) {
      const c = C.el('span', 'onebox-file');
      const n = C.el('span', 'onebox-file-name'); n.textContent = f.name; n.title = f.name;
      const s = C.el('span', 'onebox-file-size'); s.textContent = sizeWord(f.size);
      const x = C.el('button'); x.type = 'button'; x.textContent = 'x'; x.title = 'Remove';
      x.setAttribute('aria-label', 'Remove ' + f.name);
      x.addEventListener('click', () => { pending = pending.filter((p) => p.id !== f.id); drawTrays(); });
      c.append(n, s, x);
      t.appendChild(c);
    }
    const p = C.el('p', 'onebox-files-note' + (adding ? ' working' : ''));
    p.textContent = adding ? 'Adding ' + adding + (adding === 1 ? ' file.' : ' files.')
      : note || 'Read with your next question. Not kept in the brain yet.';
    t.appendChild(p);
    t.hidden = false;
  }
}

async function addFiles(list, from) {
  const files = [...(list || [])];
  if (!files.length) return;
  const refused = [];
  for (const file of files) {
    const isPic = PICTURES.includes(file.type);
    let name = file.name || '';
    if (isPic && (!name || name === 'image.png' || name === 'image.jpeg')) name = 'Screenshot ' + stamp() + '.' + (file.type.split('/')[1] || 'png');
    if (!name) name = 'File ' + stamp();
    const total = pending.reduce((sum, p) => sum + p.size, 0) + file.size;
    if (pending.length >= ADD_MAX_FILES) { refused.push(name + ': up to ' + ADD_MAX_FILES + ' files go with one question'); continue; }
    if (isPic && file.size > ADD_MAX_PICTURE) { refused.push(name + ': a picture can be up to 5 MB'); continue; }
    if (total > ADD_MAX_BYTES) { refused.push(name + ': the files added to one question can be up to 15 MB together'); continue; }
    adding++;
    drawTrays();
    try {
      const b64 = await new Promise((ok, no) => {
        const r = new FileReader();
        r.onload = () => ok(String(r.result).split(',')[1] || '');
        r.onerror = () => no(r.error);
        r.readAsDataURL(file);
      });
      pending.push({ id: Math.random().toString(36).slice(2), name, mime: file.type || '', size: file.size, b64 });
    } catch (e) {
      refused.push(name + ': this browser could not open it (' + String((e && e.message) || e) + ')');
    } finally {
      adding--;
    }
  }
  drawTrays(refused.length ? 'Not added: ' + refused.join('; ') + '.' : '');
  const input = $(from === 'panel' ? '#panel-input' : '#ask-input');
  if (input) input.focus();
}

function menuOf(which) {
  return { m: $(which === 'panel' ? '#panel-addmenu' : '#ask-addmenu'), b: $(which === 'panel' ? '#panel-add' : '#ask-add') };
}
function closeMenus() {
  for (const w of ['top', 'panel']) {
    const { m, b } = menuOf(w);
    if (m) m.hidden = true;
    if (b) b.setAttribute('aria-expanded', 'false');
  }
}
function openMenu(which) {
  const { m, b } = menuOf(which);
  if (!m || !b) return;
  if (!m.hidden) { closeMenus(); return; }
  closeMenus();
  m.innerHTML = '';
  const item = (label, sub, act) => {
    const i = C.el('button', 'onebox-additem');
    i.type = 'button';
    i.setAttribute('role', 'menuitem');
    const l = C.el('span', 'a-label'); l.textContent = label;
    const s = C.el('span', 'a-sub'); s.textContent = sub;
    i.append(l, s);
    i.addEventListener('click', () => { closeMenus(); act(); });
    m.appendChild(i);
  };
  item('Leave a thought', 'Say or type what you think about something you are working on, in any language; kept with its topic, for you or for people you name', () => startThought({}, which));
  item('Add a file', 'A spreadsheet, document, PDF or slides', () => { addFrom = which; $('#add-file')?.click(); });
  item('Add a picture or screenshot', 'You can also paste a screenshot, or drop files on the conversation', () => { addFrom = which; $('#add-picture')?.click(); });
  item('Connect something', 'Mail, drives, calendar, or a system you use', () => { if (C.connect) C.connect(); });
  m.hidden = false;
  b.setAttribute('aria-expanded', 'true');
  m.querySelector('button')?.focus();
}

function wireAdd() {
  for (const w of ['top', 'panel']) {
    const { b } = menuOf(w);
    if (b) b.addEventListener('click', (e) => { e.stopPropagation(); openMenu(w); });
  }
  for (const id of ['#add-file', '#add-picture']) {
    const inp = $(id);
    if (!inp) continue;
    inp.addEventListener('change', () => { const fl = [...inp.files]; inp.value = ''; addFiles(fl, addFrom); });
  }
  document.addEventListener('click', (e) => { if (!e.target.closest || !e.target.closest('.onebox-addmenu')) closeMenus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
  // PASTE: a screenshot or a copied file, into either box or anywhere on the page. A paste into another field on the
  // page (a reply being written on Mail) is left to that field.
  document.addEventListener('paste', (e) => {
    const files = e.clipboardData && e.clipboardData.files;
    if (!files || !files.length) return;
    const at = e.target && e.target.closest ? e.target : null;
    const inPanel = !!(at && at.closest('#panel'));
    const inBox = !!(at && at.closest('#onebox'));
    if (at && at.closest('input, textarea, [contenteditable]') && !inPanel && !inBox) return;
    e.preventDefault();
    addFiles(files, inPanel ? 'panel' : 'top');
  });
  // DROP: files dropped on the box, the conversation panel or Work.
  for (const sel of ['#onebox', '#panel', '#s-work']) {
    const z = $(sel);
    if (!z) continue;
    const hasFiles = (e) => !!(e.dataTransfer && [...e.dataTransfer.types].includes('Files'));
    z.addEventListener('dragover', (e) => { if (hasFiles(e)) { e.preventDefault(); z.classList.add('drop-here'); } });
    z.addEventListener('dragleave', (e) => { if (!z.contains(e.relatedTarget)) z.classList.remove('drop-here'); });
    z.addEventListener('drop', (e) => {
      z.classList.remove('drop-here');
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      e.preventDefault();
      addFiles(e.dataTransfer.files, sel === '#onebox' ? 'top' : 'panel');
    });
  }
}

// -- THE MICROPHONE (seat talk-to-the-tool, 2026-10-12) --
// One button, three ways to listen, chosen by what this browser can do, never by a setting:
//   'live'   the browser's own speech recognition: the words appear in the box while she talks;
//   'record' no recognition but a recorder: record, then lens-ask writes it down (voicemail transcription);
//   'none'   neither: pressing says so and how to get it, the button stays.
// Press to start, press again to stop. The words stay in the box for her to fix; nothing is sent on its own.
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const CAN_RECORD = typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && typeof MediaRecorder !== 'undefined';
const WAY = SR ? 'live' : CAN_RECORD ? 'record' : 'none';
const MAX_RECORD_MS = 120000;
let mic = { on: false, rec: null, media: null, chunks: [], stream: null, timer: null, base: '' };
// Which box the microphone is writing into: the top box or the panel's follow-up box.
const MICS = [{ btn: '#ask-mic', input: '#ask-input', said: '#onebox-mic-said' }, { btn: '#panel-mic', input: '#panel-input', said: '#panel-mic-said' }];
let at = MICS[0];

function micSaid(text, tone) {
  const p = $(at.said);
  if (!p) return;
  p.textContent = text || '';
  p.className = 'onebox-mic-said' + (tone ? ' ' + tone : '');
  p.hidden = !text;
}

function micLook(state) {
  const b = $(at.btn);
  if (!b) return;
  b.dataset.state = state;
  b.setAttribute('aria-pressed', state === 'listening' || state === 'recording' ? 'true' : 'false');
  const label = state === 'listening' ? 'Stop listening' : state === 'recording' ? 'Stop recording'
    : state === 'writing' ? 'Writing down what you said' : 'Speak instead of typing';
  b.setAttribute('aria-label', label);
  b.title = label;
  b.disabled = state === 'writing';
}

function wireMic() {
  for (const m of MICS) {
    const b = $(m.btn);
    if (!b) continue;
    const was = at; at = m; micLook('idle'); at = was;
    b.addEventListener('click', () => pressMic(m));
  }
}

function pressMic(m) {
  stopSpeaking();
  if (mic.on) { if (m === at) stopMic(); return; }
  micSaid('', ''); at = m;
  if (thinking) thinkHeard = true;
  if (WAY === 'live' && !liveFailed) startLive();
  else if (CAN_RECORD) startRecord();
  else micSaid('This browser cannot listen. Type your question, or open the Tool in Chrome, Edge or Safari, on a computer or your phone, to speak it.', 'stalled');
}

function stopMic() {
  mic.userStopped = true;
  if (mic.timer) { clearTimeout(mic.timer); mic.timer = null; }
  if (mic.rec) { try { mic.rec.stop(); } catch (e) { /* already stopped */ } }
  if (mic.media && mic.media.state !== 'inactive') { try { mic.media.stop(); } catch (e) { /* already stopped */ } }
}

function startLive() {
  const input = $(at.input);
  let rec;
  try { rec = new SR(); } catch (e) { micSaid('The microphone could not start: ' + String((e && e.message) || e), 'stalled'); return; }
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = true;
  rec.continuous = true;
  const base = input.value.trim();
  mic = { on: true, rec, media: null, chunks: [], stream: null, timer: null, base, backup: null, userStopped: false };
  let heard = false;
  // BACKUP RECORDING (HQ 7, 2026-10-12; Alex: "it says listening, but nothing happens"). Some browsers say they
  // listen and never return a word, with no error (their speech service unreachable or hearing nothing). So a
  // recording runs beside the browser's listening; if no words came back when she stops, the Tool writes the
  // recording down (lens-ask listen). If the browser stops listening on its own, the recording carries on.
  if (CAN_RECORD) navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    if (!mic.on) { stream.getTracks().forEach((t) => t.stop()); return; }
    let m;
    try { m = new MediaRecorder(stream); } catch (e) { stream.getTracks().forEach((t) => t.stop()); return; }
    mic.backup = m; mic.stream = stream;
    m.ondataavailable = (ev) => { if (ev.data && ev.data.size) mic.chunks.push(ev.data); };
    m.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      mic.on = false;
      if (heard) micLook('idle'); else writeDown(mic.chunks, m.mimeType || 'audio/webm', base);
    };
    m.start();
  }).catch(() => { /* no recording; the browser's listening alone */ });
  rec.onresult = (ev) => {
    let said = '';
    for (let i = 0; i < ev.results.length; i++) said += ev.results[i][0].transcript;
    heard = heard || !!said.trim();
    input.value = (mic.base ? mic.base + ' ' : '') + said.trim();
  };
  rec.onerror = (ev) => {
    const why = ev && ev.error;
    if (why === 'not-allowed' || why === 'service-not-allowed') micSaid('The microphone is blocked for this page. Allow it from the icon in the address bar, then press the microphone again.', 'stalled');
    else if (why === 'no-speech') micSaid('Nothing was heard. Press the microphone and speak again.', '');
    else if (why === 'audio-capture') micSaid('No microphone was found on this device.', 'stalled');
    else if (why === 'network' && CAN_RECORD) micSaid('The browser could not reach its listening service. Press the microphone again and the Tool will write it down instead.', 'stalled');
    else if (why && why !== 'aborted') micSaid('Listening stopped: ' + why + '.', 'stalled');
    if (why === 'network') liveFailed = true;
  };
  rec.onend = () => {
    mic.rec = null;
    const b = mic.backup;
    if (heard) {
      if (b && b.state !== 'inactive') b.stop();
      mic.on = false;
      micLook('idle');
      micSaid('Check the words, change anything, then press Go.', ''); input.focus(); const n = input.value.length; try { input.setSelectionRange(n, n); } catch (e) { /* some inputs refuse */ }
      return;
    }
    if (b && b.state !== 'inactive') {
      if (mic.userStopped) { b.stop(); return; }
      mic.media = b;
      micLook('recording');
      micSaid('Still recording. Speak, then press the microphone again; the Tool writes it down for you to check.', 'live');
      return;
    }
    mic.on = false;
    micLook('idle');
  };
  try { rec.start(); } catch (e) { mic.on = false; micSaid('The microphone could not start: ' + String((e && e.message) || e), 'stalled'); return; }
  micLook('listening');
  micSaid('Listening. Speak, then press the microphone again to stop.', 'live');
  mic.timer = setTimeout(stopMic, MAX_RECORD_MS);
}

// If the browser's own listening service cannot be reached, the next press records instead.
let liveFailed = false;

async function startRecord() {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) {
    const n = e && e.name;
    micSaid(n === 'NotAllowedError' ? 'The microphone is blocked for this page. Allow it from the icon in the address bar, then press the microphone again.'
      : n === 'NotFoundError' ? 'No microphone was found on this device.'
      : 'The microphone could not start: ' + String((e && e.message) || e), 'stalled');
    return;
  }
  let media;
  try { media = new MediaRecorder(stream); } catch (e) { stream.getTracks().forEach((t) => t.stop()); micSaid('This browser cannot record: ' + String((e && e.message) || e), 'stalled'); return; }
  mic = { on: true, rec: null, media, chunks: [], stream, timer: null, base: $(at.input).value.trim() };
  media.ondataavailable = (ev) => { if (ev.data && ev.data.size) mic.chunks.push(ev.data); };
  media.onstop = () => { stream.getTracks().forEach((t) => t.stop()); mic.on = false; writeDown(mic.chunks, media.mimeType || 'audio/webm', mic.base); };
  media.start();
  micLook('recording');
  micSaid('Recording. Speak, then press the microphone again; the Tool writes it down for you to check.', 'live');
  mic.timer = setTimeout(stopMic, MAX_RECORD_MS);
}

async function writeDown(chunks, mime, base) {
  const input = $(at.input);
  if (!chunks.length) { micLook('idle'); micSaid('Nothing was recorded. Press the microphone and speak again.', ''); return; }
  micLook('writing');
  micSaid('Writing down what you said.', 'live');
  try {
    const blob = new Blob(chunks, { type: mime });
    const b64 = await new Promise((ok, no) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result).split(',')[1] || '');
      r.onerror = () => no(r.error);
      r.readAsDataURL(blob);
    });
    const j = await C.hear(b64, mime);
    if (j && j.state === 'heard' && j.text) {
      input.value = (base ? base + ' ' : '') + j.text;
      micSaid('Check the words, change anything, then press Go.', '');
      input.focus();
    } else {
      micSaid((j && (j.answer || j.error)) || 'What you said could not be written down, and no reason was given.', 'stalled');
    }
  } catch (e) {
    micSaid('What you said could not be written down: ' + String((e && e.message) || e), 'stalled');
  } finally {
    micLook('idle');
  }
}

// -- READ ALOUD (seat talk-to-the-tool, 2026-10-12) --
// Off by default. When on, each new answer in the conversation is read aloud from its opening, in the
// browser's own voice; speaking or typing stops it. Remembered in this browser only; nothing is stored anywhere.
const CAN_SPEAK = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const SPEAK_KEY = 'tool.readAloud';
let speakOn = false;
try { speakOn = localStorage.getItem(SPEAK_KEY) === '1'; } catch (e) { speakOn = false; }

function speakLook() {
  const b = $('#ask-speak');
  if (!b) return;
  b.setAttribute('aria-pressed', speakOn ? 'true' : 'false');
  const label = speakOn ? 'Reading answers aloud: on' : 'Read answers aloud: off';
  b.setAttribute('aria-label', label);
  b.title = label;
}

function wireSpeak() {
  const b = $('#ask-speak');
  if (!b) return;
  speakLook();
  b.addEventListener('click', () => {
    if (!CAN_SPEAK) { micSaid('This browser cannot read aloud.', 'stalled'); return; }
    speakOn = !speakOn;
    try { localStorage.setItem(SPEAK_KEY, speakOn ? '1' : '0'); } catch (e) { /* remembered for this page only */ }
    speakLook();
    if (!speakOn) stopSpeaking();
    micSaid(speakOn ? 'New answers will be read aloud.' : 'Answers will not be read aloud.', '');
  });
}

export function stopSpeaking() {
  if (CAN_SPEAK) { try { window.speechSynthesis.cancel(); } catch (e) { /* nothing was speaking */ } }
}

// Called by lens.js when a new answer has been drawn in the conversation (never for a reopened, kept answer).
// Reads the opening paragraph, which the answer is written to carry on its own.
export function speakAnswer(slot) {
  if (!speakOn || !CAN_SPEAK || !slot) return;
  const lead = slot.querySelector('.ans-lead-prose, .ans-lead');
  const text = String((lead && lead.textContent) || '').replace(/[*#|]/g, ' ').trim().slice(0, 1500);
  if (!text) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  try { window.speechSynthesis.speak(u); } catch (e) { /* the browser declined to speak */ }
}

// THE OWNER IS TOLD (seat refusal-wire, 2026-10-08). When the owner opens the Tool and someone was told today
// that an attempt was recorded and the owner can see it (or crossed an alert), one line per person sits at the
// top of the box, once per page load, until she closes it. The lines are the brain's own (refusal_watch, owner
// only); nothing here counts or decides. If the read itself fails, that is said in the same place, never
// shown as nothing. Anyone else sees nothing here, and the brain refuses them the read anyway.
async function ownerLines(tries = 0) {
  const v = C.viewer ? C.viewer() : null;
  if (!v) { if (tries < 40) setTimeout(() => ownerLines(tries + 1), 500); return; }
  if (!v.all_access || !C.refusalWatch) return;
  let data = null, err = '';
  try { data = await C.refusalWatch(); } catch (e) { err = String((e && e.message) || e); }
  if (!err && (!data || data.ok !== true)) err = (data && data.note) || 'no reason was given';
  const lines = !err && Array.isArray(data.lines) ? data.lines : [];
  if (!lines.length && !err) return;
  const host = $('#onebox');
  if (!host || $('#onebox-watch')) return;
  const box = C.el('div', 'notice onebox-watch');
  box.id = 'onebox-watch';
  box.setAttribute('role', 'status');
  for (const l of lines) { const p = C.el('p'); p.textContent = l; box.appendChild(p); }
  if (err) { const p = C.el('p', 'quiet'); p.textContent = 'Refused attempts could not be read: ' + err; box.appendChild(p); }
  const x = C.el('button');
  x.type = 'button';
  x.textContent = 'x';
  x.setAttribute('aria-label', 'Close');
  x.addEventListener('click', () => box.remove());
  box.appendChild(x);
  host.insertBefore(box, host.firstChild);
}

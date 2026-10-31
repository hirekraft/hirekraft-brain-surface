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
import { openZip } from './chats.js?v=2026-10-30-linkedin-whole';   // the one zip opener on the screen (same token as lens.js)

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
  const p2 = mk('button', 'mk-part', 'What this reads'); p2.type = 'button'; p2.setAttribute('aria-selected', 'false'); p2.setAttribute('role', 'tab');
  // Plan, Sending and What came back (seat marketing-parts, 2026-10-30, decisions 1039, 1044): each part lives in its own file.
  const part = (label) => { const b = mk('button', 'mk-part', label); b.type = 'button'; b.setAttribute('aria-selected', 'false'); b.setAttribute('role', 'tab'); return b; };
  const p3 = part('Plan'), p4 = part('Sending'), p5 = part('What came back');
  parts.append(p1, p3, p4, p5, p2);
  const pick = (b, go) => { for (const x of [p1, p2, p3, p4, p5]) x.setAttribute('aria-selected', x === b ? 'true' : 'false'); go(parts.nextElementSibling); };
  p1.addEventListener('click', () => pick(p1, load));
  p2.addEventListener('click', () => pick(p2, drawReads));
  p3.addEventListener('click', () => pick(p3, (s) => import('./marketing-plan.js?v=2026-10-31-rulings-1049').then((M) => M.drawPlan(s, C))));
  p4.addEventListener('click', () => pick(p4, (s) => import('./marketing-send.js?v=2026-10-30-marketing-parts').then((M) => M.drawSend(s, C))));
  p5.addEventListener('click', () => pick(p5, (s) => import('./marketing-back.js?v=2026-10-30-marketing-parts').then((M) => M.drawBack(s, C))));
  const stage = mk('div', 'mk-stage');
  wrap.append(parts, stage);
  body.appendChild(wrap);
  load(stage);
}

// ── WHAT THIS READS: YOUR LINKEDIN DOWNLOAD (seat linkedin-whole, 2026-10-30, decision 1043) ─────────────────────────────────
// Alex, 2026-10-30: the whole LinkedIn data download goes into the brain whole, dated, compared download to download; any person
// drops their own and it is theirs. THE FILE IS OPENED HERE, IN HER BROWSER, with the Chats tab's zip opener (openZip); every
// file inside is listed with its row count before anything leaves her computer. On Bring in, every file and every row goes to
// the brain (linkedin_drop_open / _rows / _text / _close, each answering about the signed-in person alone) and is kept private
// to her. The brain says which file is which part (its own list), compares her connections with the last download, and refuses
// to close a download whose rows did not all arrive. A file the Tool does not know is kept whole and said, never dropped.
// Rows are read with the papaparse library (a library, as JSZip is); nothing here decides who may see what.
const PAPA = 'https://esm.sh/papaparse@5.4.1';
const TEXT_ENDS = ['.txt', '.html', '.htm', '.json', '.md', '.xml', '.vcf'];
const BATCH_BYTES = 600000;
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const monthYear = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); };
const dayOnly = (d) => { if (!d) return ''; const t = new Date(String(d).slice(0, 10) + 'T12:00:00'); return isNaN(t) ? '' : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
let li = null;   // the dropped download, in memory only: { name, on, by, files: [{ path, kind, header, preamble, rows, bytes, objs, text, enc }] }

async function drawReads(stage) {
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'What this reads'));
  head.append(mk('p', 'mk-lede', 'What the Tool reads for marketing and sales, and what you can bring in yourself.'));
  stage.appendChild(head);
  const box = mk('section', 'mk-reads');
  box.append(mk('h3', 'mk-co', 'LinkedIn'));
  const last = mk('div'); last.setAttribute('aria-live', 'polite');
  box.appendChild(last);
  box.append(mk('p', 'quiet', 'To get your download: on LinkedIn, open Me, then Settings and Privacy, then Data privacy, then Get a copy of your data. Choose the larger download with everything. When LinkedIn emails you that it is ready, download the zip and drop it here.'));
  const drop = mk('label', 'notice');
  drop.style.display = 'block'; drop.style.cursor = 'pointer'; drop.style.textAlign = 'center'; drop.style.padding = '24px';
  drop.textContent = 'Drop your LinkedIn download here, or click to choose it';
  const input = C.el('input'); input.type = 'file'; input.accept = '.zip'; input.hidden = true;
  drop.appendChild(input);
  box.append(drop, mk('p', 'quiet', 'The file is opened on your computer first. You see every file in it with its rows, and nothing is sent until you press Bring in. What you bring in is private to you.'));
  const said = mk('div'); said.setAttribute('aria-live', 'polite');
  const pick = mk('div');
  box.append(said, pick);
  stage.appendChild(box);
  const onFile = (f) => { if (f) openDownload(f, said, pick, last); };
  input.addEventListener('change', () => onFile(input.files && input.files[0]));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); });
  drop.addEventListener('drop', (e) => { e.preventDefault(); onFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
  await drawLast(last);
}

async function drawLast(host, given) {
  host.innerHTML = '';
  if (!given) host.appendChild(mk('p', 'working no-late', 'Reading what you brought in before'));
  const r = given || await rpc('linkedin_mine', {});
  host.innerHTML = '';
  if (!r || r.ok !== true) {
    host.appendChild(mk('p', 'notice flagged', 'What you brought in before could not be read just now: ' + String((r && (r.reason || r.error)) || 'no reason was given') + '. Nothing here is a claim either way.'));
    return;
  }
  const L = r.last;
  if (!L) {
    host.appendChild(mk('p', 'state', 'You have not brought in a LinkedIn download yet.')); host.appendChild(mk('p', 'quiet', 'Only you can see what you bring in.'));
    // what colleagues shared still shows for someone with no download of her own (seat linkedin-share)
    const ex0 = mk('section', 'mk-explain'); host.appendChild(ex0); drawExplain(ex0);
    return;
  }
  host.appendChild(mk('p', 'state', 'Your last LinkedIn download: ' + dayOnly(L.downloaded_on) + ', brought in ' + day(L.brought_at) + '. ' + n0(L.files) + ' ' + plural(L.files, 'file', 'files') + ', ' + n0(L.rows) + ' ' + plural(L.rows, 'row', 'rows') + ', kept whole.'));
  const c = L.compare;
  if (c) {
    if (c.first) host.appendChild(mk('p', 'state', 'Connections: ' + n0(c.connections) + '. This is the first download to compare with; changes show from the next one.'));
    else host.appendChild(mk('p', 'state', 'Connections: ' + n0(c.connections) + ' now. Since ' + (c.against === 'your download' ? 'your download of ' : 'the connections export of ') + dayOnly(c.since) + ': '
      + n0(c.new) + ' new, ' + n0(c.changed) + ' changed company or position, ' + n0(c.gone) + ' no longer listed, ' + n0(c.unchanged) + ' unchanged.'));
    if (c.nameless) host.appendChild(mk('p', 'quiet', n0(c.nameless) + ' ' + plural(c.nameless, 'connection is', 'connections are') + ' listed by LinkedIn without a name, so counted and not compared.'));
  }
  if (L.not_understood) host.appendChild(mk('p', 'quiet', n0(L.not_understood) + ' ' + plural(L.not_understood, 'file is', 'files are') + ' kept whole but not yet understood by the Tool.'));
  host.appendChild(mk('p', 'quiet', 'Only you can see what you bring in, except the parts you choose to use for marketing. Your messages and your own account details stay private to you always.'));
  // YOUR LINKEDIN, EXPLAINED (seat linkedin-whole-2, slices 4 and 5): replaces the plain file list that stood here ("What is in
  // it", seat linkedin-whole) with the walk-through, part by part, each with her choice. Retired 2026-10-30, brief linkedin-whole-2.
  const ex = mk('section', 'mk-explain');
  host.appendChild(ex);
  drawExplain(ex);
}

// Each part in plain words, from pieces (counts and dates from the brain; names and titles are her data, never translated).
function partWords(x, prevOn) {
  const f = x.facts || {};
  const n = Number(x.rows || 0);
  let line = '';
  let use = '';
  if (x.part === 'connections') {
    line = n0(f.connections || n) + ' people.' + (f.first ? '' : ' Since ' + dayOnly(f.since) + ': ' + n0(f.new) + ' new, ' + n0(f.changed) + ' changed company or position, ' + n0(f.gone) + ' no longer listed.');
    use = 'Used for who you know at companies that are hiring.';
  } else if (x.part === 'companyfollows') {
    line = n0(f.companies || n) + ' companies' + (f.hiring_now ? '; ' + n0(f.hiring_now) + ' of them are hiring now.' : '.');
    use = 'Used to mark hiring companies you follow.';
  } else if (x.part === 'messages') {
    line = n0(n) + ' messages in ' + n0(f.conversations) + ' conversations' + (f.people ? ', one to one with ' + n0(f.people) + ' people' : '') + (f.first ? ', from ' + dayOnly(f.first) + ' to ' + dayOnly(f.last) : '') + '.';
    use = 'The Tool uses only how many and when, never what was said.';
  } else if (x.part === 'endorsementgiveninfo' || x.part === 'endorsementreceivedinfo') {
    line = n0(n) + ' endorsements' + (f.people ? ', with ' + n0(f.people) + ' people' : '') + (f.last ? ', the last on ' + dayOnly(f.last) : '') + '.';
    use = 'Shown next to the people you know at hiring companies.';
  } else if (x.part === 'invitations') {
    line = n0(n) + ' invitations: ' + n0(f.incoming) + ' to you, ' + n0(f.outgoing) + ' from you.';
  } else if (x.part === 'articles') {
    const a = (f.list || [])[0];
    line = n0(f.articles || 0) + ' articles you published' + (a && a.title ? ', the newest "' + a.title + '"' + (a.published ? ' (' + dayOnly(a.published) + ')' : '') : '') + '.';
    use = 'Good for your website and your posts.';
  } else {
    line = x.kind === 'table' ? n0(n) + ' ' + plural(n, 'row', 'rows') + '.' : 'Kept whole.';
  }
  if (x.prev_rows !== null && x.prev_rows !== undefined && prevOn && Number(x.prev_rows) !== n) {
    const dlt = n - Number(x.prev_rows);
    line += ' ' + n0(Math.abs(dlt)) + (dlt > 0 ? ' more' : ' fewer') + ' than in your download of ' + dayOnly(prevOn) + '.';
  }
  return { line, use };
}

const CHOICES = [['marketing', 'Use for marketing'], ['me', 'Only for me'], ['out', 'Leave out']];
const CHOSEN = { marketing: 'Used for marketing: the people who work on marketing see it.', me: 'Only for you.', out: 'Left out: not kept in the Tool, now or in later downloads.' };

async function drawExplain(ex) {
  ex.innerHTML = '';
  ex.appendChild(mk('h3', 'mk-sub', 'Your LinkedIn, explained'));
  const w = mk('p', 'working no-late', 'Going through your download part by part');
  ex.appendChild(w);
  const r = await rpc('linkedin_explain', {});
  w.remove();
  if (!r || r.ok !== true) {
    ex.appendChild(mk('p', 'notice flagged', 'This could not be read just now: ' + String((r && (r.reason || r.error)) || 'no reason was given') + '. Nothing here is a claim either way.'));
    return;
  }
  if (!r.last) { ex.innerHTML = ''; await drawShared(ex, r); return; }
  ex.appendChild(mk('p', 'state', 'For each part, choose: use it for marketing (the people who work on marketing see it), keep it only for you, or leave it out. Your choice is kept and used for every download you bring in later. Until you choose, a part is only for you.'));
  const ul = mk('ul', 'mk-person-list');
  for (const x of (r.parts || [])) {
    if (!Number(x.rows || 0) && x.part !== 'articles') continue;
    const li = mk('li', 'mk-person');
    const top = mk('div', 'mk-person-top');
    top.append(mk('span', 'mk-person-name', x.name));
    const pw = partWords(x, r.last.previous_on);
    const said = mk('p', 'mk-person-from', pw.line + (pw.use ? ' ' + pw.use : '') + (x.private_always ? ' Always private to you.' : ''));
    li.append(top, said);
    if (x.part === 'articles' && ((x.facts || {}).list || []).length > 1) {
      const det = C.el('details');
      const sm = mk('summary', null, 'All your articles'); sm.style.minHeight = '44px'; sm.style.display = 'flex'; sm.style.alignItems = 'center'; sm.style.cursor = 'pointer';
      det.appendChild(sm);
      const al = mk('ul', 'mk-role-list');
      for (const a of x.facts.list) { const ai = mk('li', 'mk-role'); ai.append(data_('span', 'mk-role-title', a.title || '')); if (a.published) ai.append(document.createTextNode(' · ' + dayOnly(a.published))); al.appendChild(ai); }
      det.appendChild(al);
      li.appendChild(det);
    }
    const now = mk('p', 'mk-person-step state', (x.choice ? CHOSEN[x.choice] : 'Only for you until you choose.') + (x.said ? ' ' + x.said + '.' : ''));   // said: how the choice was made (seat linkedin-share)
    const acts = mk('div', 'mk-acts');
    const out = mk('p', 'mk-said'); out.setAttribute('aria-live', 'polite');
    let armed = false;
    for (const [c, label] of CHOICES) {
      if (c === 'marketing' && x.private_always) continue;
      const b = mk('button', c === (x.choice || 'me') ? 'go' : 'go ghost', label); b.type = 'button';
      b.setAttribute('aria-pressed', c === (x.choice || 'me') ? 'true' : 'false');
      b.addEventListener('click', async () => {
        if (c === 'out' && !armed) { armed = true; out.className = 'mk-said state'; out.textContent = 'Leave out removes this part (' + n0(x.rows) + ' ' + plural(Number(x.rows), 'row', 'rows') + ') from the Tool, and from every download you bring in later. Press Leave out again to confirm.'; return; }
        armed = false;
        for (const o of acts.querySelectorAll('button')) o.disabled = true;
        out.className = 'mk-said working no-late'; out.textContent = 'Keeping your choice';
        const k = await rpc('linkedin_choose', { p_part: x.part, p_choice: c });
        for (const o of acts.querySelectorAll('button')) o.disabled = false;
        if (k && k.ok) {
          x.choice = c;
          for (const o of acts.querySelectorAll('button')) { const on = o === b; o.className = on ? 'go' : 'go ghost'; o.setAttribute('aria-pressed', on ? 'true' : 'false'); }
          now.textContent = CHOSEN[c];
          out.className = 'mk-said state';
          out.textContent = k.not_yet ? k.not_yet : (c === 'out' && k.removed ? n0(k.removed) + ' ' + plural(k.removed, 'row', 'rows') + ' removed.' : 'Kept.');
        } else {
          out.className = 'mk-said stalled'; out.textContent = 'Not changed: ' + String((k && (k.reason || k.error)) || 'no reason was given') + '.';
        }
      });
      acts.appendChild(b);
    }
    li.append(now, acts, out);
    ul.appendChild(li);
  }
  ex.appendChild(ul);
  // WHO OPENED WHAT SHE SHARES (seat linkedin-share, 2026-10-30, decision 1045 (3)): every opening by someone else, as the brain
  // logged it (linkedin_opened, written where the opening happens: Signals and the shared list). Nothing here decides who may see.
  if ((r.parts || []).some((p) => p.choice === 'marketing')) {
    ex.appendChild(mk('h3', 'mk-sub', 'Who opened what you share'));
    const names = {}; for (const p of (r.parts || [])) names[p.part] = p.name;
    if (!(r.opened || []).length) ex.appendChild(mk('p', 'quiet', 'Nobody else has opened what you share yet. Each time someone does, it is listed here: who, which part, how much and when.'));
    else {
      const ol = mk('ul', 'mk-role-list');
      for (const o of r.opened.slice(0, 10)) {
        const unit = o.part === 'connections' ? ['person', 'people'] : ['row', 'rows'];
        const at = new Date(o.at);
        const oi = mk('li', 'mk-role');
        oi.append(data_('span', null, o.who || 'Someone no longer here'), document.createTextNode(' opened ' + (names[o.part] || o.part) + ' (' + n0(o.n) + ' ' + plural(Number(o.n), unit[0], unit[1]) + ') · ' + day(o.at) + (isNaN(at) ? '' : ' ' + at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))));
        ol.appendChild(oi);
      }
      ex.appendChild(ol);
      if (Number(r.opened_total || 0) > 10) ex.appendChild(mk('p', 'quiet', n0(r.opened_total) + ' openings in all; the newest 10 are shown.'));
    }
  }
  if ((r.absent || []).length) {
    const ws = r.absent.map((x) => (x === 'shares' ? 'posts' : x));
    const said = ws.length > 1 ? ws.slice(0, -1).join(', ') + ' and ' + ws[ws.length - 1] : ws[0];
    ex.appendChild(mk('p', 'quiet', 'Your ' + said + ' are not in this download, so the Tool cannot use them.'));
  }
  if ((r.not_understood || []).length) ex.appendChild(mk('p', 'quiet', n0(r.not_understood.length) + ' ' + plural(r.not_understood.length, 'file is', 'files are') + ' kept whole but not understood yet.'));
  await drawShared(ex, r);
}

// SHARED WITH YOU BY COLLEAGUES: what others chose to use for marketing, for someone who works on marketing (the brain decides).
async function drawShared(ex, r) {
  if (r.may_share) {
    const sh = await rpc('linkedin_shared', {});
    if (sh && sh.ok && (sh.shared || []).length) {
      ex.appendChild(mk('h3', 'mk-sub', 'Shared with you by colleagues'));
      const sl = mk('ul', 'mk-role-list');
      for (const s1 of sh.shared) {
        const si = mk('li', 'mk-role');
        si.append(data_('span', null, s1.from), document.createTextNode(': ' + s1.name + ', ' + n0(s1.rows) + ' ' + plural(Number(s1.rows), 'row', 'rows') + (s1.not_yet ? '. ' + s1.not_yet : s1.where ? '. You see them in ' + s1.where + ', on the companies handed to you.' : '.')));
        if ((s1.list || []).length) si.append(document.createTextNode(' '), data_('span', 'quiet', s1.list.slice(0, 30).map((q) => q.name || q.title).join(', ') + (s1.list.length > 30 ? ' and ' + (s1.list.length - 30) + ' more' : '')));
        sl.appendChild(si);
      }
      ex.appendChild(sl);
    } else if (sh && sh.ok) {
      ex.appendChild(mk('p', 'quiet', 'Nobody has shared anything from their LinkedIn with you yet.'));
    } else if (sh) {
      ex.appendChild(mk('p', 'quiet', String(sh.reason || 'What colleagues shared could not be read just now.')));
    }
  }
}

// The download's date: from its file name (LinkedIn names it ..._MM-DD-YYYY.zip), else the newest file inside, else today.
function datedFrom(name, zip) {
  for (const tok of String(name || '').split('_').join('.').split('.')) {
    const p = tok.split('-');
    if (p.length === 3 && p[0].length === 2 && p[1].length === 2 && p[2].length === 4 && p.every((x) => x !== '' && !isNaN(Number(x)))) {
      const m = Number(p[0]), d = Number(p[1]), y = Number(p[2]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2003) return { on: y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'), by: 'file name' };
    }
  }
  let newest = null;
  zip.forEach((path, e) => { if (!e.dir && e.date && (!newest || e.date > newest)) newest = e.date; });
  if (newest && newest.getFullYear() >= 2003) return { on: newest.toISOString().slice(0, 10), by: 'files inside' };
  return { on: new Date().toISOString().slice(0, 10), by: 'the day it was brought in' };
}

// One table file read as rows. LinkedIn puts a Notes paragraph above some headers: the header is the first line with at least
// two filled cells (else the first filled line); the lines above it are kept as its notes. Every filled line under it is a row.
function tableOf(Papa, text) {
  const BOM = String.fromCharCode(65279);
  if (text.startsWith(BOM)) text = text.slice(1);
  const recs = Papa.parse(text, { skipEmptyLines: false }).data || [];
  const filled = (r) => (r || []).filter((x) => String(x || '').trim() !== '').length;
  let h = recs.slice(0, 40).findIndex((r) => filled(r) >= 2);
  if (h < 0) h = recs.findIndex((r) => filled(r) >= 1);
  if (h < 0) return { header: [], preamble: '', objs: [] };
  const seen = new Map();
  const header = recs[h].map((x, i) => {
    let k = String(x || '').trim() || ('Column ' + (i + 1));
    const n = (seen.get(k) || 0) + 1; seen.set(k, n);
    return n > 1 ? k + ' (' + n + ')' : k;
  });
  const preamble = recs.slice(0, h).map((r) => (r || []).join(' ').trim()).filter((x) => x).join(String.fromCharCode(10));
  const objs = [];
  for (const r of recs.slice(h + 1)) {
    if (!filled(r)) continue;
    const o = {};
    r.forEach((v, i) => { o[i < header.length ? header[i] : 'Column ' + (i + 1)] = String(v == null ? '' : v); });
    objs.push(o);
  }
  return { header, preamble, objs };
}

async function openDownload(file, said, pick, last) {
  pick.innerHTML = ''; li = null;
  said.innerHTML = ''; said.appendChild(mk('p', 'working', 'Opening the file on your computer'));
  try {
    if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('This is not a zip file. LinkedIn sends your download as a zip.');
    const zip = await openZip(file);
    const { default: Papa } = await import(PAPA);
    const dated = datedFrom(file.name, zip);
    const entries = [];
    zip.forEach((path, e) => { if (!e.dir) entries.push(e); });
    if (!entries.length) throw new Error('There are no files inside this zip.');
    const files = [];
    for (let k = 0; k < entries.length; k++) {
      const e = entries[k];
      said.innerHTML = ''; said.appendChild(mk('p', 'working', 'Reading ' + (k + 1) + ' of ' + entries.length + ' files on your computer'));
      const low = e.name.toLowerCase();
      if (low.endsWith('.csv')) {
        const text = await e.async('string');
        const t = tableOf(Papa, text);
        files.push({ path: e.name, kind: 'table', header: t.header, preamble: t.preamble, rows: t.objs.length, bytes: text.length, objs: t.objs });
      } else if (TEXT_ENDS.some((x) => low.endsWith(x))) {
        const text = await e.async('string');
        files.push({ path: e.name, kind: 'text', rows: 0, bytes: text.length, text, enc: 'text' });
      } else {
        const b64 = await e.async('base64');
        files.push({ path: e.name, kind: 'binary', rows: 0, bytes: Math.round(b64.length * 3 / 4), text: b64, enc: 'base64' });
      }
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    li = { name: file.name, on: dated.on, by: dated.by, files };
  } catch (err) {
    said.innerHTML = ''; said.appendChild(mk('p', 'notice flagged', (err && err.message) || 'The file could not be read.'));
    return;
  }
  const rows = li.files.reduce((a, f) => a + f.rows, 0);
  said.innerHTML = '';
  said.appendChild(mk('p', 'state', li.files.length + ' files inside, ' + n0(rows) + ' rows, dated ' + dayOnly(li.on) + ' (' + ({ 'file name': 'from the file name', 'files inside': 'from the newest file inside', 'the day it was brought in': 'today, since the file carries no date' })[li.by] + '). Nothing has left your computer yet.'));
  const ul = mk('ul', 'attn');
  for (const f of li.files) {
    const row = mk('li');
    row.append(data_('div', 'a-title', f.path), mk('div', 'a-detail', f.kind === 'table' ? n0(f.rows) + ' ' + plural(f.rows, 'row', 'rows') : (f.kind === 'text' ? 'a text file, kept whole' : 'a file, kept whole')));
    ul.appendChild(row);
  }
  const go = mk('button', 'go', 'Bring in'); go.type = 'button';
  const out = mk('div'); out.setAttribute('aria-live', 'polite');
  pick.append(ul, go, out);
  go.addEventListener('click', () => bringIn(go, out, said, last));
}

async function bringIn(go, out, said, last) {
  if (!li) return;
  go.disabled = true;
  out.innerHTML = '';
  const w = mk('p', 'working'); const wt = mk('span'); const bar = mk('span', 'working-bar'); const fill = mk('span');
  bar.appendChild(fill); w.append(wt, bar); go.after(w);
  const step = (k, n, line) => { wt.textContent = line; fill.style.width = Math.round((k / Math.max(n, 1)) * 100) + '%'; };
  step(0, 1, 'Opening your download in the Tool');
  const meta = li.files.map((f) => ({ path: f.path, kind: f.kind, header: f.header || null, preamble: f.preamble || '', rows: f.rows, bytes: f.bytes }));
  const o = await rpc('linkedin_drop_open', { p_file_name: li.name, p_downloaded_on: li.on, p_dated_by: li.by, p_files: meta });
  const stop = (line) => { w.remove(); go.disabled = false; out.appendChild(mk('p', 'notice flagged', line)); };
  if (!o || o.ok !== true) return stop('It was not brought in: ' + String((o && (o.reason || o.error)) || 'no reason was given') + '.');
  if (o.already) { w.remove(); out.appendChild(mk('p', 'state', 'This download was already brought in. Nothing was redone.')); return drawLast(last); }
  const id = o.download_id;
  const total = li.files.length; let fails = 0;
  for (let k = 0; k < total; k++) {
    const f = li.files[k];
    step(k, total, 'Keeping ' + (k + 1) + ' of ' + total + ' files');
    if (f.kind === 'table') {
      let from = 1, batch = [], size = 0;
      const send = async () => {
        if (!batch.length) return true;
        const r = await rpc('linkedin_drop_rows', { p_download: id, p_path: f.path, p_from: from, p_rows: batch });
        from += batch.length; batch = []; size = 0;
        return r && r.ok === true;
      };
      for (const obj of f.objs) {
        batch.push(obj); size += JSON.stringify(obj).length;
        if (size >= BATCH_BYTES && !(await send())) { fails++; break; }
      }
      if (!(await send())) fails++;
    } else {
      const r = await rpc('linkedin_drop_text', { p_download: id, p_path: f.path, p_text: f.text, p_encoding: f.enc });
      if (!r || r.ok !== true) fails++;
    }
  }
  step(total, total, 'Checking every row arrived');
  const c = await rpc('linkedin_drop_close', { p_download: id });
  w.remove();
  if (!c || c.ok !== true) {
    go.disabled = false;
    const short = (c && c.files) || [];
    out.appendChild(mk('p', 'notice flagged', String((c && (c.reason || c.error)) || 'It could not be finished.') + (short.length ? ' ' + short.length + ' ' + plural(short.length, 'file', 'files') + ' did not arrive whole.' : '') + ' Press Bring in again.'));
    return;
  }
  li = null;
  said.innerHTML = '';
  const listed = go.parentNode && go.parentNode.querySelector('ul.attn'); if (listed) listed.remove();
  out.appendChild(mk('p', 'state', 'Brought in and kept whole, private to you.'));
  go.remove();
  drawLast(last, c);
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
  if (b.follows) {
    out.append(mk('p', 'state', 'You follow ' + n0(b.follows) + ' companies on LinkedIn; ' + n0(b.followed_hiring || 0) + ' of them are hiring now'
      + (b.followed_hiring_nobody_known ? ', ' + n0(b.followed_hiring_nobody_known) + ' where you know nobody yet' : '') + '.'));
  }
  if (b.linkedin_download_on) {
    out.append(mk('p', 'state', 'People are matched by their current company in your own LinkedIn download of ' + dayOnly(b.linkedin_download_on)
      + ', then your CRM, your applicant tracking' + (b.linkedin_as_of ? ' and the earlier connections export of ' + day(b.linkedin_as_of) + ' for people not in it' : '') + '.'));
  } else {
    out.append(mk('p', 'state', 'People are matched by their current company in your CRM, your applicant tracking and your LinkedIn connections download' + (b.linkedin_as_of ? ' of ' + day(b.linkedin_as_of) : '') + '.'));
  }
  return out;
}

function drawList(stage) {
  openKey = null;
  stage.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Companies hiring where you know someone'));
  head.append(mk('p', 'mk-lede', data.owner
    ? 'From the job alerts in your mail. Open one to see the roles, the people you know there and a short note to each.'
    : data.marketing   // seat campaign-engine (decision 1050 (5)): under the Marketing folder rule, every hiring company, no hand-off
      ? 'Every company in the job alerts that is hiring where the business knows someone. You see them because you can open the Marketing folder. Open one to see the roles, the people and a short note to each.'
      : 'What the owner handed to you. Open one to see the people and the note for each.'));
  stage.appendChild(head);
  const items = data.items || [];
  if (!items.length) {
    stage.appendChild(mk('p', 'quiet', data.owner || data.marketing ? 'No company in the alerts so far is one where the business knows someone.' : 'Nothing has been handed to you yet.'));
  }
  const ul = mk('ul', 'mk-list');
  for (const it of items) {
    const li = mk('li', 'mk-item' + (it.done ? ' mk-done' : ''));
    const b = mk('button', 'mk-item-btn'); b.type = 'button';
    const line = mk('p', 'mk-item-line');
    line.append(data_('span', 'mk-co', it.company), document.createTextNode(' '), mk('span', null, 'is hiring ' + it.roles_n + (it.roles_n === 1 ? ' role.' : ' roles.')));
    const known = mk('p', 'mk-item-known', 'You know ' + it.known + (it.known === 1 ? ' person there.' : ' people there.') + (it.you_follow ? ' You follow them on LinkedIn.' : ''));
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
  const known = mk('p', 'mk-lede', 'You know ' + it.known + (it.known === 1 ? ' person there.' : ' people there.') + (it.people.length < it.known ? ' The ' + it.people.length + ' closest are here.' : '')
    + (it.you_follow ? ' You follow them on LinkedIn' + (it.you_follow.since ? ' since ' + dayOnly(it.you_follow.since) : '') + '.' : ''));
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

// WHAT SHE HAS WITH THIS PERSON ON LINKEDIN (seat linkedin-whole-2, slice 3): counts and dates from her own download, private
// to her; never the messages themselves. Said only when there is something to say.
function tieWords(t) {
  if (!t) return '';
  const bits = [];
  const m = Number(t.messages || 0), g = Number(t.endorsed_them || 0), r = Number(t.endorsed_you || 0);
  if (m) bits.push(m + (m === 1 ? ' message' : ' messages') + ' between you on LinkedIn' + (t.last_message ? ', the last on ' + dayOnly(t.last_message) : ''));
  if (g && r) bits.push('you endorsed each other');
  else if (g) bits.push('you endorsed them');
  else if (r) bits.push('they endorsed you');
  if (t.invited === 'you') bits.push('you invited them');
  else if (t.invited === 'them') bits.push('they invited you');
  if (!bits.length) return '';
  const line = bits.join('; ');
  return line.charAt(0).toUpperCase() + line.slice(1) + '.';
}

function personRow(it, p, stage) {
  const li = mk('li', 'mk-person' + (p.step && DONE_STEPS.includes(p.step.step) ? ' mk-done' : ''));
  const top = mk('div', 'mk-person-top');
  top.append(data_('span', 'mk-person-name', p.name));
  if (p.title) top.append(data_('span', 'mk-person-title', p.title));
  // HER OWN DOWNLOAD (seat linkedin-whole-2): a person found in her own newest LinkedIn download says so, with the date, and the
  // 2025 company when it changed. Everyone else keeps the line they had.
  const from = mk('p', 'mk-person-from', p.as_of ? 'As of your LinkedIn download, ' + dayOnly(p.as_of) + '.'
    : 'Known from ' + (KNOWN_FROM[p.system] || 'your records') + (p.seen_at ? ', as of ' + day(p.seen_at) : '') + '.');
  if (p.change === 'moved' && p.was) {
    from.append(document.createTextNode(' Was '), data_('span', 'mk-was', p.was), document.createTextNode(p.was_at ? ' in ' + monthYear(p.was_at) + '.' : ' before.'));
  } else if (p.change === 'new') {
    from.append(document.createTextNode(' New connection' + (p.was_at ? ' since ' + monthYear(p.was_at) : '') + '.'));
  }
  const tie = tieWords(p.tie);
  if (tie) from.append(document.createTextNode(' ' + tie));
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

// fill/marketing-signals.js - SIGNALS, ITS ONE PICTURE (seat marketing-build-a, 2026-11-02, decisions 1059 and 1055). Part of SHOW.
// Used by fill/marketing.js (the Signals list stays drawn there). One question: who is hiring for what we do, and who do we know
// there? One picture: where the openings came from, in three counts (companies where we know someone; from job alerts in the mail,
// by board; from the daily web search, with its cost against its daily limit), and on each company a badge per source. One action
// per company for the owner: Hand to the marketing colleague (the same brain call as Give to inside the company, job_alert_hand).
// Counts come from the list the brain returned (job_alert_items, as the signed-in person); nothing here decides who may see what.
// No colour, size or font here (skin.css, MARKETING SHELL); no regex literals, no backslashes.

const MAIL_SOURCES = ['LinkedIn', 'linkedin.com'];
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const day = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
function mk(C, tag, cls, text) { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; }
function data_(C, tag, cls, text) { const n = mk(C, tag, cls, text); n.translate = false; return n; }

// a badge per source: a job alert in the mail, or the site the daily web search saw it on
export function sourcesOf(it) {
  const seen = new Map();
  for (const r of (it.roles || [])) for (const s of (r.sources || [])) {
    const mail = MAIL_SOURCES.includes(s) && !(r.found && r.found.length);
    const label = mail ? 'Job Alert in Your Mail' : 'Seen on ' + s;
    if (!seen.has(label)) seen.set(label, { label, mail });
  }
  return [...seen.values()].slice(0, 3);
}

export function badges(C, it) {
  const src = sourcesOf(it);
  const p = mk(C, 'p', 'mk2-badges');
  for (const x of src) p.appendChild(data_(C, 'span', 'mk2-badge' + (x.mail ? ' mk2-badge-mail' : ''), x.label));
  return p;
}

export function sourcePicture(C, items, b) {
  b = b || {};
  const mail = items.filter((it) => sourcesOf(it).some((x) => x.mail)).length;
  const web = items.filter((it) => sourcesOf(it).some((x) => !x.mail)).length;
  const boards = b.boards || {};
  const s = b.web_search || {};
  const row = mk(C, 'div', 'mk2-tiles');
  const t = (n, label, note) => { const d = mk(C, 'div', 'mk2-tile'); d.append(data_(C, 'p', 'mk2-tile-n', n0(n)), mk(C, 'p', 'mk2-tile-label', label)); if (note) d.appendChild(mk(C, 'p', 'mk-item-meta', note)); return d; };
  row.append(t(items.length, 'Companies hiring where you know someone', n0(b.companies_hiring || 0) + ' hiring in all'),
    t(mail, 'From job alerts in your mail', Object.keys(boards).map((k) => (k === 'Other' ? 'other boards' : k) + ' ' + boards[k]).join(', ')),
    t(web, 'From the daily web search', s.at ? n0(s.kept || 0) + ' openings on ' + day(s.at) + ', USD ' + Number(s.cost_usd || 0).toFixed(2) + ' of ' + Number(s.cap_usd || 1).toFixed(2) + ' a day' : 'not run yet'));
  return row;
}

export function quickHand(C, data, it) {
  const box = mk(C, 'div', 'mk-acts mk2-quick');
  const to = ((data && data.handable) || []).filter((x) => x.marketing)[0];
  if (!data || !data.owner || !to || (it.handed || []).some((h) => h.to_id === to.id)) return box;
  const b = mk(C, 'button', 'go ghost'); b.type = 'button';
  b.append(mk(C, 'span', null, 'Hand To'), document.createTextNode(' '), data_(C, 'span', null, String(to.name || '').split(' ')[0]));
  const said = mk(C, 'span', 'mk-said'); said.setAttribute('aria-live', 'polite');
  b.addEventListener('click', async () => {
    b.disabled = true; said.className = 'mk-said working no-late'; said.textContent = 'Giving it';
    let r;
    try { const { data: d, error } = await C.sb.rpc('job_alert_hand', { p_key: it.key, p_to: to.id, p_take_back: false, p_note: null }); r = error ? { ok: false, reason: error.message } : (d || { ok: false }); }
    catch (e) { r = { ok: false, reason: String((e && e.message) || e) }; }
    b.disabled = false;
    if (r.ok) { said.className = 'mk-said state'; said.textContent = 'Given. It is in their list now.'; b.remove(); }
    else { said.className = 'mk-said stalled'; said.textContent = 'Not given: ' + (r.reason || 'no reason was given') + '.'; }
  });
  box.append(b, said);
  return box;
}

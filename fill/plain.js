// NO RAW ERROR TEXT ON ANY SCREEN (seat mail-views, 2026-10-27; brief item 6, after Alex's screenshot of Mail printed
// "gmail thread <id>: 404 { "error": ... }" under What you didn't know).
// THE ONE PLACE: every call this page makes to the brain or its functions goes through the wrapper below, installed once
// by lens.js before anything is read. When a reply carries an upstream error (a status code, a JSON body, a service's
// own words), the words are replaced, IN THE REPLY ITSELF, by a plain sentence that says what it means for her and that
// nothing of hers was changed or lost. Every tab then prints what it always printed, and it is plain. The original
// detail goes to the browser console (and the function's own log already holds it on the server side).
// A reason the brain wrote for people ("No Gmail label by that name is in the mailboxes you can open.") has none of
// the marks below and passes through untouched: refusals keep their reason; only machine words are replaced.
// Sign-in refusals on the database are left to lens.js doorFetch, which turns them into the signed-out line.
// Proven by scripts/screen-harness/mail-views in studio-walkers (planted upstream errors, with a control).

const RAW = new RegExp([
  '[{}]', '"error"', 'gmail (thread|meta|list|labels|history)[ :]', 'drive list', 'supabase [a-z/]', 'proxy [a-z/]', 'PGRST', 'SQLSTATE',
  'violates', 'syntax error', 'statement timeout', 'canceling statement', 'Failed to fetch', 'NetworkError', 'Load failed',
  'TypeError', 'ReferenceError', 'is not a function', 'of undefined', 'of null', 'duplicate key', 'relation "', 'column "',
  'function [a-z_.]+[(]', 'ECONN', 'ETIMEDOUT',
  'invalid_grant', 'unauthorized_client', 'BOOT_ERROR', 'WORKER_', 'non-2xx', 'Edge Function', 'Internal Server Error',
  'came back with [0-9]', 'answered [0-9]', 'HTTP [0-9]', '[(][0-9][0-9][0-9][)]', ': [45][0-9][0-9]( |$)', 'status [45][0-9][0-9]',
  'required: ', 'unknown action', 'source not found', 'source inactive', 'needs a gmail source', 'no stored tokens',
  '<html', 'Bad Gateway', 'Gateway Time', 'refresh_token', 'identity_for_jwt', 'mailbox_state: ', 'rate limit exceeded', 'permission denied for', 'too many requests',
].join('|'), 'i');

const has = (s, words) => new RegExp(words, 'i').test(s);

// What a raw error means for her, in one sentence.
export function plainWords(raw, status) {
  const s = String(raw ?? '');
  if (s && !RAW.test(s)) return s;
  return meaning(s);
}
// What it means, for words already known to be a machine's (a failed reply that is not even JSON, for one).
function meaning(s) {
  if (!s) return "Something on the Tool's side did not work just now. Nothing of yours was changed or lost; try again in a moment.";
  if (has(s, 'gmail thread|gmail meta|messages/') && has(s, '404|notFound|not found'))
    return 'That email is no longer in Gmail (deleted or moved). Nothing of yours was changed.';
  if (has(s, 'invalid_grant|refresh_token|no stored tokens|token expired|unauthorized_client|invalid credentials') || (has(s, 'gmail|google|drive') && has(s, '401')))
    return "The Tool's permission to read this mailbox has lapsed and needs reconnecting on the Brain tab. Nothing was changed or lost.";
  if (has(s, 'source inactive|source not found|needs a gmail source'))
    return 'This mailbox is not connected to the Tool right now. Nothing was changed or lost.';
  if (has(s, '429|rate.?limit|quota|too many requests|toomanyrequests'))
    return 'Too much was asked at once, so the service asked the Tool to wait. Try again in a minute; nothing was lost.';
  if (has(s, 'statement timeout|canceling statement|timed? ?out|ETIMEDOUT|504|503|502|BOOT_ERROR|WORKER_|Failed to fetch|NetworkError|Load failed|ECONN'))
    return 'The Tool did not answer in time. Nothing of yours was changed or lost; try again in a moment.';
  if (has(s, 'permission denied|42501|403|forbidden'))
    return 'You do not have access to this. Nothing was changed.';
  return "Something on the Tool's side did not work just now. Nothing of yours was changed or lost; try again in a moment.";
}
export const isRaw = (s) => typeof s === 'string' && RAW.test(s);

// Kept for whoever looks in the browser's console: where, and the original words (cut short).
const kept = [];
function note(where, raw) {
  const line = String(raw ?? '').slice(0, 600);
  kept.push({ at: new Date().toISOString(), where: String(where).split('?')[0], raw: line });
  if (kept.length > 50) kept.shift();
  try { console.warn('[plain] ' + String(where).split('?')[0] + ': ' + line); } catch (_) { /* nothing to log to */ }
}
export function plainLog() { return kept.slice(); }

// Replace raw words in the fields a screen prints. A failed reply: its error, message, reason, note, hint and details. Any
// reply, at any depth: fields NAMED as errors (error, details_error), so an answer's own words are never touched.
const FAILED = new Set(['error', 'message', 'reason', 'note', 'details_error', 'hint', 'details']);
const ANY = new Set(['error', 'details_error']);
function clean(v, where, status, depth, failed) {
  if (!v || typeof v !== 'object' || depth > 6) return false;
  let changed = false;
  const fields = failed && depth === 0 ? FAILED : ANY;
  for (const k of Object.keys(v)) {
    const x = v[k];
    if (typeof x === 'string' && fields.has(k) && isRaw(x)) {
      note(where, x);
      v[k] = (k === 'hint' || k === 'details') ? null : plainWords(x, status);
      changed = true;
    } else if (x && typeof x === 'object') {
      if (clean(x, where, status, depth + 1, failed)) changed = true;
    }
  }
  return changed;
}

const SIGNIN = new RegExp('permission denied|jwt|not authenticated|42501|PGRST30', 'i');
let installed = false;
export function installPlain(base) {
  if (installed) return; installed = true;
  const real = base || globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, init) => {
    const url = String((input && input.url) || input || '');
    const ours = url.includes('/functions/v1/') || url.includes('/rest/v1/');
    if (!ours) return real(input, init);
    let r;
    try { r = await real(input, init); } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      note(url, (e && e.message) || e);
      throw new Error(plainWords((e && e.message) || String(e)));
    }
    const type = r.headers.get('content-type') || '';
    if (r.ok && !type.includes('json')) return r;
    let text = '';
    try { text = await r.clone().text(); } catch (_) { return r; }
    let j = null;
    try { j = JSON.parse(text); } catch (_) { j = null; }
    if (!j || typeof j !== 'object') {
      if (r.ok) return r;
      note(url, r.status + ' ' + text);
      return new Response(JSON.stringify({ ok: false, error: meaning(r.status + ' ' + text) }),
        { status: r.status, statusText: r.statusText, headers: { 'content-type': 'application/json' } });
    }
    // The database's sign-in refusals are lens.js doorFetch's to turn into the signed-out line.
    if (url.includes('/rest/v1/') && (r.status === 401 || r.status === 403) && SIGNIN.test((j.code || '') + ' ' + (j.message || ''))) return r;
    if (!clean(j, url, r.status, 0, !r.ok || j.ok === false)) return r;
    return new Response(JSON.stringify(j), { status: r.status, statusText: r.statusText, headers: { 'content-type': 'application/json' } });
  };
}

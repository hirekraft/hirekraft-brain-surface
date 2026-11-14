// WHAT'S NEW, FROM THE CONSULTANT (seat test-list round 2, 2026-10-23).
// Alex: "I want this when I start: where are we? But also in the Tool, combined with the consultant that says to me:
// there's new functionality, here's how it works, test it. Ultimately that's how the customer would also learn about
// functionality." And: "No morning brief ... I don't want these accumulating."
// When she opens the Tool and the guide has something she has not been shown, the conversation says it ONCE: one
// line per new thing in her words (its title and one short sentence, the rest under More), newest first, at most
// three, the rest one tap away. Then they are marked seen (guide_news_seen), so they never pile up. Nothing is
// pushed by email or phone; nothing is said when nothing is new.
// The studio's checks are NOT drawn here (see showNews): they live in the To test view only.
// Reads guide_news() in the brain (migrations/hirekraft/2026-10-23-test-list-guide-news.sql in studio-walkers).
// Until that is applied the call fails and nothing is said, by design: an unasked message has nothing to refuse.


const SHOW = 3;
let done = false;

// A REPLY TO A SUSPECTED SCAM, OR THE BOOKS NAMING ONE, said to the owner first and once (seat mail-inbox, decision 1033 item 3:
// "a reply to a scam or a payment to its sender interrupts the owner at once; otherwise a monthly line of what was caught").
// scam_alerts answers only the owner; the Tool has no push, so this and Worth your attention are where it reaches her.
async function scamAlerts({ sb, el, log, openPanel }) {
  let a;
  try { const { data } = await sb.rpc('scam_alerts'); a = data; } catch (_) { return; }
  if (!a || a.ok !== true) return;
  const items = a.items || [];
  if (!items.length && !a.monthly) return;
  const turn = el('div', 'turn said news news-alert');
  for (const it of items) { const p = el('p'); const b = el('b'); b.textContent = 'Suspected scam: '; p.appendChild(b); p.appendChild(document.createTextNode(String(it.line || ''))); turn.appendChild(p); }
  if (a.monthly) { const p = el('p'); p.textContent = String(a.monthly); turn.appendChild(p); }
  log.appendChild(turn);
  openPanel();
  try { await sb.rpc('scam_alerts_seen', { p_ids: items.map((x) => x.id), p_month: a.monthly ? a.month : null }); } catch (_) { /* said again next time, the safe side */ }
}

// NOTHING OF THE STUDIO'S IN HER COLUMN, AND NO GUIDE DUMPS (seat ready-alive 2026-11-14, HQ brief after Alex's screenshot of Nov 13,
// 18:04 PT: Vera's setup column held the getting-started guide in full and two test cards with Works / Doesn't / Not now). Rules:
// - the studio's test cards are drawn ONLY in the To test view (fill/totest.js, #totest), never here, for anyone. SUPERSEDED: the
//   card under each new entry for HireKraft's owner (seat test-list round 2, 2026-10-23).
// - during setup nothing is said unasked: she is on a step, and her guide speaks about that step. The news waits, unseen, until
//   the Tool is open (lens.js passes setupSaid: resolves true while Getting Started is the page; unknown counts as setup).
// - each new thing is its title and ONE short sentence in plain words; the rest of the guide's text opens under More.
const SHORT = 140;
function firstSentence(t) {
  const x = String(t || '').split(String.fromCharCode(10)).join(' ').trim(); if (!x) return { head: '', more: false };
  let cut = -1; for (const stop of ['. ', '? ', '! ']) { const i = x.indexOf(stop); if (i > 0 && (cut < 0 || i < cut)) cut = i; }
  let head = cut > 0 ? x.slice(0, cut + 1) : x;
  if (head.length > SHORT) { const sp = head.lastIndexOf(' ', SHORT); head = head.slice(0, sp > 40 ? sp : SHORT) + String.fromCharCode(8230); }
  return { head, more: head.length < x.length };
}
export async function showNews({ sb, el, $, openPanel, owner, setupSaid }) {
  if (done) return; done = true;
  let inSetup = true;
  try { inSetup = await Promise.race([Promise.resolve(setupSaid).then((v) => v !== false), new Promise((r) => setTimeout(() => r(true), 20000))]); } catch (_) { inSetup = true; }
  const log = $('#dock-turns'); if (!log) return;
  if (owner) await scamAlerts({ sb, el, log, openPanel });   // a suspected scam is hers to know at once, setup or not
  if (inSetup) { console.info('what is new: not said during setup'); return; }
  let news;
  try {
    const { data, error } = await sb.rpc('guide_news');
    if (error || !data?.ok) { console.info('what is new: not read', error?.message || data?.refused || ''); return; }
    news = data;
  } catch (e) { console.info('what is new: not read', String(e?.message ?? e)); return; }
  const items = news.news || [];
  if (!items.length) return;

  const turn = el('div', 'turn said news');
  const head = el('p');
  head.textContent = news.first_visit
    ? 'Here is what your Tool can do, newest first. Ask me about any of it.'
    : (items.length === 1 ? 'One thing is new since you last looked.' : items.length + ' things are new since you last looked.');
  turn.appendChild(head);

  const item = (g) => {
    const box = el('div', 'news-item');
    const t = el('b'); t.textContent = g.title; box.appendChild(t);
    const f = firstSentence(g.what_it_is);
    if (f.head) {
      const p = el('p'); p.textContent = f.head; box.appendChild(p);
      if (f.more) {
        const more = el('button', 'gr-link news-more'); more.type = 'button'; more.textContent = 'More';
        more.addEventListener('click', () => { p.textContent = String(g.what_it_is || ''); if (g.how_to_ask) { const q = el('p', 'news-try'); q.textContent = 'Try it: ' + g.how_to_ask; box.appendChild(q); } more.remove(); });
        box.appendChild(more);
      }
    }
    return box;
  };
  items.slice(0, SHOW).forEach((g) => turn.appendChild(item(g)));
  if (items.length > SHOW) {
    const more = el('button', 'go ghost'); more.type = 'button';
    more.textContent = 'Show the other ' + (items.length - SHOW);
    more.addEventListener('click', () => { items.slice(SHOW).forEach((g) => turn.insertBefore(item(g), more)); more.remove(); });
    turn.appendChild(more);
  }
  log.appendChild(turn);
  openPanel();
  turn.scrollIntoView({ block: 'nearest' });
  try { await sb.rpc('guide_news_seen', { p_slugs: items.map((g) => g.slug) }); } catch (_) { /* shown again next time, which is the safe side */ }
}

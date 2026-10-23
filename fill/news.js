// WHAT'S NEW, FROM THE CONSULTANT (seat test-list round 2, 2026-10-23).
// Alex: "I want this when I start: where are we? But also in the Tool, combined with the consultant that says to me:
// there's new functionality, here's how it works, test it. Ultimately that's how the customer would also learn about
// functionality." And: "No morning brief ... I don't want these accumulating."
// When she opens the Tool and the guide has something she has not been shown, the conversation says it ONCE: one
// line per new thing in her words, how it works (the guide's what_it_is) and how to try it, newest first, at most
// five, the rest one tap away. Then they are marked seen (guide_news_seen), so they never pile up. Nothing is
// pushed by email or phone; nothing is said when nothing is new.
// For HireKraft's owner the studio's check for that entry (whats_new on studio-core, by guide_slug) is drawn under
// it with Works / Doesn't, the same card and the same answer as the To test view. Anyone else sees no buttons:
// studio-july refuses whoever is not on the studio allowlist, and this page does not ask for anyone without all access.
// Reads guide_news() in the brain (migrations/hirekraft/2026-10-23-test-list-guide-news.sql in studio-walkers).
// Until that is applied the call fails and nothing is said, by design: an unasked message has nothing to refuse.

import { initToTest, readList, card } from './totest.js?v=2026-10-23-test-list-2';

const SHOW = 5;
let done = false;

export async function showNews({ sb, el, $, openPanel, owner }) {
  if (done) return; done = true;
  const log = $('#dock-turns'); if (!log) return;
  let news;
  try {
    const { data, error } = await sb.rpc('guide_news');
    if (error || !data?.ok) { console.info('what is new: not read', error?.message || data?.refused || ''); return; }
    news = data;
  } catch (e) { console.info('what is new: not read', String(e?.message ?? e)); return; }
  const items = news.news || [];
  if (!items.length) return;

  let checks = {};
  if (owner) {
    initToTest({ sb, el, $ });
    const list = await readList();
    (list?.ready || []).forEach((g) => (g.checks || []).forEach((c) => { if (c.guide_slug && !checks[c.guide_slug]) checks[c.guide_slug] = c; }));
  }

  const turn = el('div', 'turn said news');
  const head = el('p');
  head.textContent = news.first_visit
    ? 'Here is what your Tool can do, newest first. Ask me about any of it.'
    : (items.length === 1 ? 'One thing is new since you last looked.' : items.length + ' things are new since you last looked.');
  turn.appendChild(head);

  const item = (g) => {
    const box = el('div', 'news-item');
    const t = el('b'); t.textContent = g.title; box.appendChild(t);
    if (g.what_it_is) { const p = el('p'); p.textContent = g.what_it_is; box.appendChild(p); }
    const c = checks[g.slug];
    if (c) {
      const wrap = el('div', 'news-check');
      const redraw = () => wrap.replaceChildren(card(c, false, redraw));
      redraw();
      box.appendChild(wrap);
    } else if (g.how_to_ask) {
      const p = el('p', 'news-try'); p.textContent = 'Try it: ' + g.how_to_ask; box.appendChild(p);
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

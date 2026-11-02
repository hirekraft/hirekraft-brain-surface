// fill/marketing-website.js - THE MARKETING AND SALES TAB, part WEBSITE (seat marketing-build-a, 2026-11-02, decision 1059: "the
// website is a part of the same tab, not a new tab"; decision 1058 (3): the Tool writes drafts only, a person publishes). Part of SHOW.
//
// WHAT IT DOES FOR HER. One question: is the website keeping up with what we do? One picture: how many articles went out in the last
// 30 and 90 days and when the last one did, the pages and how many have not changed in over a year (listed), what is waiting in
// WordPress, and visits when Site Kit shares them. One action: this week's website items from the plan, each "Make a WordPress
// draft" (the draft is made in WordPress and read back as a draft; nothing is published). The drafts the Tool made are listed with
// their state now (still a draft, or published by a person). A last line says what could follow the tab later (open roles from work
// orders and Signals, articles from the plan); nothing on the site changes by itself.
// Everything comes from the brain as the signed-in person (wp_site_health): the site is connected with the owner's password, so the
// brain refuses anyone else, with its reason, shown here. No colour, size or font here (skin.css); no regex literals, no backslashes.

import { fireButton } from './marketing-plan.js?v=2026-11-02-marketing-build-a';

let C = null;
const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const n0 = (x) => Number(x || 0).toLocaleString('en-US');
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const day = (iso) => { if (!iso) return ''; const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

function tile(label, value, note) {
  const t = mk('div', 'mk2-tile');
  t.append(data_('p', 'mk2-tile-n', value), mk('p', 'mk2-tile-label', label));
  if (note) t.appendChild(mk('p', 'mk-item-meta', note));
  return t;
}

export async function mount(el, ctx) {
  C = ctx;
  el.innerHTML = '';
  const head = mk('div', 'mk-head');
  head.append(mk('h2', 'mk-title', 'Is the website keeping up with what we do?'));
  el.appendChild(head);
  const w = mk('p', 'working no-late', 'Reading the website as the Tool last read it');
  el.appendChild(w);
  const r = await rpc('wp_site_health', {});
  w.remove();
  // this week's website items from the plan (the plan's own door decides which she may see)
  const week = ctx.week && ctx.week.ok === true ? ctx.week : null;
  const items = week ? [...(week.items || []), ...(week.every || [])].filter((x) => x.fire === 'website') : [];
  if (!r || r.ok !== true) {
    const why = String((r && (r.reason || r.said)) || 'no reason was given');
    el.appendChild(mk('p', 'notice flagged', 'The website could not be shown: ' + (why.endsWith('.') ? why : why + '.')));
  } else {
    const tiles = mk('div', 'mk2-tiles');
    tiles.append(
      tile('articles in the last 30 days', n0(r.posts_30), n0(r.posts_90) + ' in 90 days'),
      tile('last article', r.last_post ? day(r.last_post.at) : 'none', null),
      tile('pages', n0(r.pages), n0(r.old_pages) + ' not changed in over a year'),
      tile('waiting in WordPress', n0(r.waiting), 'drafts and posts waiting for review'));
    el.appendChild(tiles);
    if (r.last_post) {
      const p = mk('p', 'state');
      p.append(mk('span', null, 'Last article:'), document.createTextNode(' '));
      const a = data_('a', null, r.last_post.title); a.href = r.last_post.url || '#'; a.target = '_blank'; a.rel = 'noopener';
      p.appendChild(a);
      el.appendChild(p);
    }
    if (Number(r.old_pages)) {
      const det = mk('details', 'mk2-more');
      det.appendChild(mk('summary', 'mk-hand-label', n0(r.old_pages) + ' ' + plural(r.old_pages, 'page has', 'pages have') + ' not changed in over a year'));
      const ul = mk('ul', 'mk-list');
      for (const o of (r.old_list || [])) {
        const li = mk('li', 'mk-role');
        const a = data_('a', 'mk-role-title', o.title || o.url); a.href = o.url || '#'; a.target = '_blank'; a.rel = 'noopener';
        li.append(a, document.createTextNode(' '), mk('span', 'mk-role-where', 'last changed ' + day(o.changed)));
        ul.appendChild(li);
      }
      det.appendChild(ul);
      el.appendChild(det);
    }
    el.appendChild(mk('p', 'state', r.visitors_readable ? 'Visits are read from Site Kit.' : 'Visits: Site Kit does not share its numbers with the user the Tool signs in as, so visits are not shown. Sharing Site Kit with that user in WordPress would show them here.'));
  }
  // the one action: this week's website items, each made into a WordPress draft
  const sec = mk('section', 'mk-roles');
  sec.appendChild(mk('h3', 'mk-sub', 'This week’s website items from the plan'));
  if (!items.length) sec.appendChild(mk('p', 'quiet', week ? 'No website item in the plan this week.' : 'The plan could not be read, so this week’s website items are not shown.'));
  for (const it of items) {
    const row = mk('div', 'mk2-site-item');
    row.appendChild(data_('p', 'mk-item-line', it.title));
    row.appendChild(data_('p', 'mk-item-meta', [it.cadence || (it.day ? day(it.day) : 'any day'), it.owned_by].filter(Boolean).join(' · ')));
    const said = mk('p', 'mk-said'); said.setAttribute('aria-live', 'polite');
    const acts = mk('div', 'mk-acts');
    acts.appendChild(fireButton(it, said, ctx));
    row.append(acts, said);
    sec.appendChild(row);
  }
  sec.appendChild(mk('p', 'mk-item-meta', 'A draft is made in WordPress and read back as a draft. The Tool never publishes; a person publishes it in WordPress.'));
  el.appendChild(sec);
  if (r && r.ok === true) {
    const ds = mk('section', 'mk-roles');
    ds.appendChild(mk('h3', 'mk-sub', 'Drafts the Tool made'));
    if (!(r.drafts || []).length) ds.appendChild(mk('p', 'quiet', 'None yet.'));
    for (const d of (r.drafts || [])) {
      const p = mk('p', 'mk-role');
      const a = data_('a', 'mk-role-title', d.title); a.href = d.link || '#'; a.target = '_blank'; a.rel = 'noopener';
      p.append(a, document.createTextNode(' '), mk('span', 'mk-role-where', d.now === 'publish' ? 'published by a person on ' + day(d.published_at) : d.now === 'draft' ? 'still a draft, made ' + day(d.made_at) : 'made ' + day(d.made_at) + '; the next read of the site shows its state'));
      ds.appendChild(p);
    }
    el.appendChild(ds);
    el.appendChild(mk('p', 'mk-item-meta', String(r.boundary || '')));
  }
  el.appendChild(mk('p', 'state', 'Later the website can follow this tab: open roles from your work orders and Signals, and articles from the plan. Nothing on the site changes by itself.'));
}

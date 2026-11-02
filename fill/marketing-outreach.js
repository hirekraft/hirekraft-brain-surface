// fill/marketing-outreach.js - THE MARKETING AND SALES TAB, part WEEK, its LINKEDIN MESSAGES (seat marketing-week-3, 2026-11-02, HQ
// ruling on decision 1060 (2)). Part of SHOW. Mounted by fill/marketing-week.js under this week's finished pieces.
//
// WHAT IT DOES FOR HER. The plan says "5 LinkedIn messages a day, Tuesday through Friday". This shows, for each of those days, the
// people to write to: from Signals, companies hiring now where the business knows someone, and the person it knows there; people
// whose title fits the plan's audience come first, and why these people is one press away. Each person is Signals' own row
// (fill/marketing.js outreachRow): Write a note (the Signals drafter in her voice), Copy and open LinkedIn, Done, Skip. Nothing is
// sent or posted by the Tool. Everything comes from mk_outreach (as the signed-in person): refused with the reason, never empty.
// No colour, size or font here (skin.css, SIGNALS AND OUTREACH classes). No regex literals, no backslashes.

const SIGNALS_ROW = './marketing.js?v=2026-11-02-marketing-week-3';   // the same token lens.js loads, so it is the same module
let C = null, O = null, oDay = null;

const mk = (tag, cls, text) => { const n = C.el(tag, cls); if (text !== undefined && text !== null) n.textContent = String(text); return n; };
const data_ = (tag, cls, text) => { const n = mk(tag, cls, text); n.translate = false; return n; };
const plural = (k, one, many) => (Number(k) === 1 ? one : many);
const day = (iso) => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };

async function rpc(name, args) {
  try {
    const { data: d, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return d || { ok: false, reason: 'No answer came back.' };
  } catch (e) { return { ok: false, reason: String((e && e.message) || e) }; }
}

export async function mount(el, ctx, weekOf) {
  C = ctx;
  O = await rpc('mk_outreach', { p_week: weekOf || null });
  draw(el);
}

function draw(el) {
  el.innerHTML = '';
  if (!O || O.ok !== true) { el.appendChild(mk('p', 'state', 'LinkedIn messages: ' + String((O && O.reason) || 'no answer came back') + '.')); return; }
  const days = (O.days || []).filter((d) => (d.people || []).length);
  if (!O.line || !days.length) return;
  if (!oDay || !days.some((d) => d.day === oDay)) oDay = days[0].day;
  const sec = mk('section', 'mk-people');
  sec.appendChild(mk('h3', 'mk-sub', 'LinkedIn messages this week'));
  sec.appendChild(mk('p', 'mkw-count', O.per_day + ' ' + plural(O.per_day, 'person', 'people') + ' a day, at companies hiring now where you know someone.'));
  const row = mk('div', 'mk-acts'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Day');
  for (const d of days) {
    const b = mk('button', 'go ghost', day(d.day)); b.type = 'button'; b.setAttribute('aria-pressed', d.day === oDay ? 'true' : 'false');
    b.addEventListener('click', () => { oDay = d.day; draw(el); });
    row.appendChild(b);
  }
  const list = mk('ul', 'mk-person-list');
  const why = mk('button', 'go ghost', 'Why these people'); why.type = 'button';
  const whyText = mk('p', 'state', String(O.note || '')); whyText.hidden = true;
  why.addEventListener('click', () => { whyText.hidden = !whyText.hidden; });
  sec.append(row, list, why, whyText);
  el.appendChild(sec);
  const chosen = days.find((d) => d.day === oDay);
  import(SIGNALS_ROW).then((M) => {
    for (const p of chosen.people) {
      const li = M.outreachRow(C, { key: p.key }, p);
      const top = li.querySelector('.mk-person-top');
      if (top && p.company_now) top.appendChild(data_('span', 'mk-person-title', p.company_now));
      list.appendChild(li);
    }
  }).catch((e) => { list.appendChild(mk('p', 'notice flagged', 'The people could not be shown: ' + String((e && e.message) || e) + '.')); });
}

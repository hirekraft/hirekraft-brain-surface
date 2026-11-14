// THE AI TAB (seat ai-tab, 2026-10-23; master_spec 4.40 §5.y, decisions 1005-1007). Owner only.
// REDRAWN AS AN INSTRUMENT (seat ai-tab-clear, 2026-11-01; decision 1055; Alex: "too cramped, too misleading"): the top is
// AT A GLANCE (glanceBlock below): how much, where it went, how long the balance lasts, one picture, one action; month by
// month, day by day and the rest are folded one tap away. The numbered order below is the fallback when no glance comes.
// REDRAWN IN THE OWNER'S ORDER (seat ai-tab-plain, 2026-10-26; decisions 1005, 1007, 1021, 1022). Alex that morning:
// "I'm having issues understanding the cost and what's going where... is this now on top of something or beside
// something?" and "user-friendly, to the point, and honest". The tab now answers, top to bottom:
//   1. how much, and is that normal (one big number and one sentence the brain writes);
//   2. am I in control (the prepaid balance as one bar, how long it lasts, what happens when it runs low, the
//      no-markup sentence) - second, so a phone's first screen shows the sentence and the balance;
//   3. what it bought (Finds, Understands, Thinks, adding up visibly to the big number; one-time shown inside each);
//   4. was anything unusual (one daily chart, one-time reads named in words on it, the numbers one press away);
//   5. next month, labeled an estimate, without one-time reads;
//   6. one press down: which AI does each step, its exam score and other choices (the cards below, unchanged).
// SUPERSEDES (seat ai-tab-plain, 2026-10-26, HQ's brief from Alex's words): the four money tiles, among them
// "This month, projected", which stretched the one-time read of Oct 10 to 13 across the month (about $546), and the
// gray basis note shown twice. The projection is now made once, in the brain's meter (ai_spend_plain), and the
// header badge and the box read the same figure.
// Nothing is computed here but the chart's geometry: every number and sentence comes from ai_tab().plain, so the
// tab and the box say the same thing. If the three lines do not add up to the month's total, the tab says so and
// shows no lines (the meter checks it against llm_cost_by_step, a second reading of the same rows).
// Changing a model: one press shows the effect (lens-ask {ai_choose:{step, model}}), a second press makes it
// ({confirm:true}). The write lands in the one place models are chosen (studio-core model_choice) and its guard still
// decides, so a choice the tab offers and the database refuses comes back as a reason, never as a silent nothing.
// A choice that cannot be made says why in words; there is no greyed-out button.

const money = (n) => {
  if (n === null || n === undefined || n === '') return null;
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function drawAI(body, { el, askBody, ask, isOwner }) {
  body.innerHTML = '';
  if (!isOwner()) {
    const p = el('p', 'quiet');
    p.textContent = 'Which AI runs the Tool, and what it costs, is shown to the owner only.';
    body.appendChild(p);
    return;
  }
  const wrap = el('div', 'ai-tab');
  body.appendChild(wrap);
  load(wrap, { el, askBody, ask });
}

async function load(wrap, ctx) {
  const { el, askBody } = ctx;
  wrap.innerHTML = '';
  const w = el('p', 'working no-late');
  w.textContent = 'Reading which AI does what, and what it costs';
  wrap.appendChild(w);
  const r = await askBody({ ai_tab: true });
  wrap.innerHTML = '';
  if (!r || r.ok !== true || !r.ai || r.ai.ok !== true) {
    const p = el('p', 'notice flagged');
    p.textContent = 'This could not be read just now: ' + String(r?.error ?? r?.ai?.error ?? 'no reason was given') + '. Nothing here is a claim either way.';
    const again = el('button', 'go ghost');
    again.type = 'button'; again.textContent = 'Try Again';
    again.addEventListener('click', () => load(wrap, ctx));
    wrap.append(p, again);
    return;
  }
  draw(wrap, r.ai, ctx);
}

const dollars = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return '$' + Math.round(x).toLocaleString('en-US');
};
const shortDay = (iso) => {
  const d = new Date(String(iso) + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function draw(wrap, ai, ctx) {
  const { el, ask } = ctx;
  const p = ai.plain;
  if (!p || p.ok !== true) {
    const n = el('p', 'notice flagged');
    n.textContent = 'This month’s spending could not be read just now: ' + String(p?.error ?? 'no reason was given') + '. Nothing here is a claim either way.';
    wrap.appendChild(n);
    wrap.appendChild(monthsBlock(ai.months, null, el));
    if (ai.limit) wrap.appendChild(limitBlock(ai.limit, ctx, () => load(wrap, ctx)));
  } else if (ai.glance && ai.glance.ok === true) {
    // AT A GLANCE first (seat ai-tab-clear): three questions in plain sentences, one picture, one action; the rest one tap away
    const lim = ai.limit ? limitBlock(ai.limit, ctx, () => load(wrap, ctx)) : null;
    wrap.appendChild(glanceBlock(ai.glance, ai.limit, lim, el));
    if (lim) wrap.appendChild(lim);
    wrap.appendChild(fold('Month by Month', [monthsBlock(ai.months, p, el)], el));
    wrap.appendChild(fold('Day by Day', [byDay(p, el, ai.glance)], el));
    wrap.appendChild(fold('Next Month, Estimated, and Everything Else It Costs', [nextMonth(p, el), costBlock(ai.cost, el)], el));
  } else {
    // the brain gave no glance (an older brain, or it could not be made): the earlier order, said so
    if (ai.glance && ai.glance.ok !== true) { const n = el('p', 'notice flagged'); n.textContent = 'The summary could not be made just now: ' + String(ai.glance.error || 'no reason was given') + '. The figures below are read directly.'; wrap.appendChild(n); }
    wrap.appendChild(howMuch(p, el, ai.cost));
    wrap.appendChild(balance(p.balance || {}, p, el));
    wrap.appendChild(monthsBlock(ai.months, p, el));
    if (ai.limit) wrap.appendChild(limitBlock(ai.limit, ctx, () => load(wrap, ctx)));
    wrap.appendChild(byDay(p, el));
    wrap.appendChild(nextMonth(p, el));
  }

  // 6. Detail, one press down: the AI behind each step (the cards of seat ai-tab, unchanged in substance).
  const more = el('details', 'ai2-more');
  const sum = el('summary', 'ai2-more-sum');
  sum.textContent = 'Which AI Does Each Step, Its Test Score, and Other Choices';
  more.appendChild(sum);
  const inner = el('div', 'ai2-more-body');
  const basis = el('p', 'ai2-small');
  basis.textContent = String(ai.basis || '');
  inner.appendChild(basis);
  for (const s of (Array.isArray(ai.steps) ? ai.steps : [])) inner.appendChild(stepCard(s, ctx, () => load(wrap, ctx)));
  if (ai.quick_deep) { const q = el('p', 'ai2-small'); q.textContent = String(ai.quick_deep); inner.appendChild(q); }
  const comingHead = el('h3', 'ai-h'); comingHead.textContent = 'Other Ways to Run It';
  inner.appendChild(comingHead);
  for (const c of (Array.isArray(ai.coming) ? ai.coming : [])) {
    const row = el('div', 'ai-coming');
    const b = el('span', 'badge b-grey'); b.textContent = 'Coming';
    const n = el('b'); n.textContent = c.name;
    const say = el('span', 'ai2-small'); say.textContent = String(c.say || '').split(' Coming.').join('');
    row.append(b, n, say);
    inner.appendChild(row);
  }
  if (ai.reach) { const r = el('p', 'ai2-small'); r.textContent = ai.reach; inner.appendChild(r); }
  more.appendChild(inner);
  wrap.appendChild(more);

  // Ask it: the box answers anything on this tab, with the same sentence as the top.
  const asks = el('div', 'ai-asks ai2-asks');
  for (const q of ['What does all this cost me?', 'Where did my AI money go?', 'Which AI answers my questions?']) {
    const b = el('button', 'go ghost ai-ask');
    b.type = 'button'; b.textContent = q;
    b.addEventListener('click', () => ask(q));
    asks.appendChild(b);
  }
  wrap.appendChild(asks);
}

// 1. How much, and is that normal. Then EVERYTHING IT COSTS IN ONE PLACE (seat cost-dial, 2026-10-27, decision 1024
// item 3): AI, the database the business hosts itself (plan, size, the hosting company's list price, marked an
// estimate) and Verrandi's fee (not set yet). Never added up: one part is an estimate and one is not decided. The
// words come from the brain (ai_cost_whole), so the box says the same three lines.
function howMuch(p, el, cost) {
  const sec = el('section', 'ai2-block ai2-how');
  const lab = el('p', 'ai2-label'); lab.textContent = 'AI this month, ' + String(p.month || '');
  const big = el('p', 'ai2-big'); big.textContent = dollars(p.this_month_usd) ?? '$0';
  const say = el('p', 'ai2-sentence'); say.textContent = String(p.sentence || '');
  sec.append(lab, big, say);
  if (cost && cost.ok === true) {
    const h = el('p', 'ai2-label ai2-all-h'); h.textContent = 'Everything It Costs You Each Month';
    const list = el('div', 'ai2-all');
    const row = (title, value, said) => {
      const r = el('div', 'ai2-row');
      const t = el('span', 'ai2-row-title'); t.textContent = title;
      const v = el('span', 'ai2-row-usd'); v.textContent = value;
      const s = el('p', 'ai2-row-said'); s.textContent = said;
      r.append(t, v, s);
      return r;
    };
    const a = cost.ai || {};
    list.appendChild(row('AI', (dollars(a.this_month_usd) ?? '$0') + ' so far',
      a.next_month_estimate_usd !== null && a.next_month_estimate_usd !== undefined
        ? 'Next month about ' + dollars(a.next_month_estimate_usd) + ', estimated. Exactly what the AI companies charge.' : 'Exactly what the AI companies charge.'));
    const d = cost.database || {};
    list.appendChild(row('Your Database', d.known ? 'About ' + (dollars(d.estimate_usd) ?? '?') + ', estimated' : 'On their invoice',
      d.known ? String(d.provider) + ' ' + String(d.plan) + ' plan, ' + String(d.size_gb) + ' GB. Estimated from ' + String(d.provider)
        + '’s published list price (from ' + (dollars(d.list_from_usd) ?? '?') + ' a month), more if it runs on a larger server. '
        + String(d.provider) + ' bills you directly; the exact figure is on their invoice.' : String(d.say || '')));
    list.appendChild(row('Verrandi’s Fee', 'Not set yet', 'Not decided yet. Nothing is charged for it today.'));
    const no = el('p', 'ai2-small'); no.textContent = 'No total is shown: the database figure is an estimate and the fee is not set.';
    sec.append(h, list, no);
  }
  return sec;
}

// AT A GLANCE (seat ai-tab-clear, 2026-11-01; Alex 15:06 PT on this tab: "it's too cramped, too misleading. It's not
// user-friendly at all"). On Nov 1 the top led with "This month $9" while October's $499 sat lower, called one answer "about
// $1.30 each", drew a one-bar day chart, and buried the balance. The top now answers three questions, each in one plain
// sentence the brain writes (studio-core ai_glance, from the same two readings as the rest of the tab, so the box says the
// same): how much (this month so far and last month in all), where it went (the one or two largest kinds of work), how
// long the balance lasts; one picture (last month and this month on one scale); one action (the monthly limit). Everything
// else is one tap away, folded. A pace for the month, a day-by-day chart and a cost per answer appear only when there are
// enough days (7) or answers (20); an estimate is drawn as an outline, labeled, and never added to a real charge.
// SUPERSEDES (same seat, Alex's words above): the big "AI this month" number with the "Everything it costs" list at the top,
// and the balance block beside it; both remain only as the fallback when the brain gives no glance.
function glanceBlock(G, L, lim, el) {
  const sec = el('section', 'ai2-block ai2-glance');
  const q = (title, text) => {
    const d = el('div', 'ai2-q');
    const h = el('h3', 'ai2-qh'); h.textContent = title;
    const s = el('p', 'ai2-sentence'); s.textContent = String(text || '');
    d.append(h, s);
    sec.appendChild(d);
    return d;
  };
  q('How Much', G.how_much);
  sec.appendChild(glancePicture(G.picture || {}, el));
  q('Where It Went', G.where);
  const b = q('How Long Your Balance Lasts', G.balance);
  const bf = G.balance_figures || {};
  if (bf.set_up && Number(bf.put_in_usd) > 0) {
    const left = Math.max(0, Number(bf.left_usd) || 0), put = Number(bf.put_in_usd);
    const low = bf.state === 'low' || bf.state === 'answers_within_margin' || bf.state === 'stopped_at_zero';
    const bar = el('div', 'ai2-bar' + (low ? ' ai2-bar-low' : ''));
    bar.setAttribute('role', 'meter');
    bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(put)); bar.setAttribute('aria-valuenow', String(left));
    bar.setAttribute('aria-label', String(G.balance || ''));
    const fill = el('span', 'ai2-bar-fill'); fill.style.width = Math.min(100, (left / put) * 100).toFixed(1) + '%';
    bar.appendChild(fill);
    b.appendChild(bar);
  }
  // the one action: the monthly limit (adding to the balance by card is not built yet; the studio adds to it by hand)
  if (lim) {
    const open = L && (L.set === true || L.state === 'near' || L.state === 'reached' || L.state === 'stopped');
    if (!open) {
      lim.hidden = true;
      const go = el('button', 'go ai2-act'); go.type = 'button';
      go.textContent = 'Set a Monthly Limit';
      go.setAttribute('aria-expanded', 'false');
      go.addEventListener('click', () => {
        lim.hidden = !lim.hidden;
        go.setAttribute('aria-expanded', String(!lim.hidden));
        if (!lim.hidden) { lim.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); lim.querySelector('input')?.focus(); }
      });
      b.appendChild(go);
    }
  }
  return sec;
}

// The one picture: last month in all and this month so far, on one scale. From day 7 the month's expected total is added as
// an outline, labeled an estimate (it is never part of the solid bar).
function glancePicture(P, el) {
  const fig = el('div', 'ai2-pic');
  fig.setAttribute('role', 'img');
  const rows = [];
  if (P.last) rows.push({ iso: P.last.month, usd: Number(P.last.usd) || 0, kind: 'last' });
  if (P.this) rows.push({ iso: P.this.month, usd: Number(P.this.usd) || 0, kind: 'now', day: P.this.day, exp: P.this.expected_usd === null || P.this.expected_usd === undefined ? null : Number(P.this.expected_usd) });
  const top = Math.max(1, ...rows.map((r) => Math.max(r.usd, r.exp || 0)));
  const said = [];
  for (const r of rows) {
    const row = el('div', 'ai2-pic-row ai2-pic-' + r.kind);
    const name = el('span', 'ai2-pic-name');
    const m = el('span', 'ai2-mtitle'); m.setAttribute('translate', 'no'); m.dataset.iso = String(r.iso || '');
    m.textContent = r.iso ? monthName(r.iso, 'long') : '';
    const sub = el('span', 'ai2-small'); sub.textContent = r.kind === 'last' ? 'In all' : 'So far, day ' + r.day;
    name.append(m, sub);
    const track = el('span', 'ai2-pic-track');
    if (r.exp !== null && r.exp !== undefined && r.exp > r.usd) {
      const e = el('span', 'ai2-pic-exp'); e.style.width = Math.min(100, (r.exp / top) * 100).toFixed(1) + '%';
      track.appendChild(e);
    }
    const f = el('span', 'ai2-pic-fill'); f.style.width = Math.max(r.usd > 0 ? 1 : 0, (r.usd / top) * 100).toFixed(1) + '%';
    track.appendChild(f);
    const v = el('span', 'ai2-pic-usd'); v.textContent = money(r.usd) ?? '$0.00';
    row.append(name, track, v);
    if (r.exp !== null && r.exp !== undefined) { const x = el('p', 'ai2-small ai2-pic-est'); x.textContent = 'Outline: about ' + dollars(r.exp) + ' for the whole month at the usual pace, an estimate.'; row.appendChild(x); }
    fig.appendChild(row);
    said.push((r.iso ? monthName(r.iso, 'long') : '') + ': ' + (money(r.usd) ?? '$0.00'));
  }
  fig.setAttribute('aria-label', said.join('; '));
  // the switch beside her name changes the language: month names follow it
  try {
    new MutationObserver(() => {
      if (!fig.isConnected) return;
      fig.querySelectorAll('.ai2-mtitle').forEach((n) => { n.textContent = monthName(n.dataset.iso, 'long'); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (_) { /* the names stay as drawn */ }
  return fig;
}

// Detail, one tap away: a folded part with its title. Nothing in it is lost, only folded.
function fold(title, parts, el) {
  const d = el('details', 'ai2-fold');
  const s = el('summary', 'ai2-more-sum'); s.textContent = title;
  d.appendChild(s);
  for (const x of parts) if (x) d.appendChild(x);
  return d;
}

// What else it costs (seat cost-dial's three lines, moved into the fold by ai-tab-clear): AI, the database (an estimate, said
// so) and Verrandi's fee. Never added up.
function costBlock(cost, el) {
  if (!cost || cost.ok !== true) return null;
  const sec = el('section', 'ai2-block');
  const h = el('p', 'ai2-label'); h.textContent = 'Everything It Costs You Each Month';
  const list = el('div', 'ai2-all');
  const row = (title, value, said) => {
    const r = el('div', 'ai2-row');
    const t = el('span', 'ai2-row-title'); t.textContent = title;
    const v = el('span', 'ai2-row-usd'); v.textContent = value;
    const s = el('p', 'ai2-row-said'); s.textContent = said;
    r.append(t, v, s);
    return r;
  };
  const a = cost.ai || {};
  list.appendChild(row('AI', (money(a.this_month_usd) ?? '$0.00') + ' so far', 'Exactly what the AI companies charge.'));
  const d = cost.database || {};
  list.appendChild(row('Your Database', d.known ? 'Estimated: about ' + (dollars(d.estimate_usd) ?? '?') : 'On their invoice',
    d.known ? String(d.provider) + ' ' + String(d.plan) + ' plan, ' + String(d.size_gb) + ' GB. An estimate from ' + String(d.provider)
      + '’s published list price (from ' + (dollars(d.list_from_usd) ?? '?') + ' a month); ' + String(d.provider) + ' bills you directly, and the exact figure is on their invoice.' : String(d.say || '')));
  list.appendChild(row('Verrandi’s Fee', 'Not set yet', 'Not decided yet. Nothing is charged for it today.'));
  const no = el('p', 'ai2-small'); no.textContent = 'No total is shown: the database figure is an estimate and the fee is not set.';
  sec.append(h, list, no);
  return sec;
}

// THE COST DIAL (seat cost-dial, 2026-10-27, decision 1024 item 3). The owner sets a monthly AI limit in dollars. The
// brain warns at 80 percent and at the limit (here, at the top of the screen, in the attention list and once in the
// conversation); at the limit the Tool's gate (studio-core ai_gate, the one place every AI call asks) stops reading new
// mail and files until the limit is raised or the month turns, while finding, the privacy check and a few dollars of
// questions continue. Nothing here enforces anything: this block only shows the state and sets the number. Setting it
// goes through the one existing door for AI settings (lens-ask ai_choose, owner only), as step 'monthly AI limit'.
export function limitBlock(L, ctx, reload) {   // exported for the Brain engine room's This month page (seat brain-tab-room)
  const { el, askBody } = ctx;
  const sec = el('section', 'ai2-block ai2-limit');
  const lab = el('p', 'ai2-label'); lab.textContent = 'Your Monthly AI Limit';
  sec.appendChild(lab);
  const warn = L.state === 'near' || L.state === 'reached' || L.state === 'stopped';
  if (L.set === true) {
    const big = el('p', 'ai2-big ai2-mid' + (warn ? ' ai2-warn' : ''));
    big.textContent = (money(L.spent_usd) ?? '$0') + ' of ' + (dollars(L.limit_usd) ?? '$0');
    const pct = Math.max(0, Math.min(100, Number(L.percent) || 0));
    const bar = el('div', 'ai2-bar' + (warn ? ' ai2-bar-low' : ''));
    bar.setAttribute('role', 'meter');
    bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(L.limit_usd));
    bar.setAttribute('aria-valuenow', String(L.spent_usd));
    bar.setAttribute('aria-label', 'AI this month: ' + (money(L.spent_usd) ?? '$0') + ' of a ' + (dollars(L.limit_usd) ?? '$0') + ' limit');
    const fill = el('span', 'ai2-bar-fill'); fill.style.width = pct.toFixed(1) + '%';
    bar.appendChild(fill);
    sec.append(big, bar);
  }
  const line = el('p', warn ? 'ai2-warn-line' : 'ai2-line');
  line.textContent = L.set !== true
    ? 'No limit is set. Set one and the Tool warns you at 80 percent; at the limit it stops reading new mail and files until you raise it or the month turns. Finding, the privacy check and a few dollars of questions keep working.'
    : (L.state === 'near' ? 'Close to the limit. ' : (L.state === 'reached' || L.state === 'stopped') ? 'Limit reached. ' : '') + String(L.say || '');
  sec.appendChild(line);
  const said = el('div', 'ai-said');
  const acts = el('div', 'ai2-limit-acts');
  const send = async (btn, value, doing) => {
    said.innerHTML = '';
    acts.querySelectorAll('button, input').forEach((b) => { b.disabled = true; });
    const w = el('p', 'working'); w.textContent = doing;
    btn.after(w);
    const r = await askBody({ ai_choose: { step: 'monthly AI limit', model: value, confirm: true } });
    w.remove();
    acts.querySelectorAll('button, input').forEach((b) => { b.disabled = false; });
    const c = r?.choice;
    if (!r || r.ok !== true || !c) { say(said, el, 'Not changed: ' + String(r?.error ?? 'no reason was given') + '.'); return; }
    if (c.ok !== true) { say(said, el, 'Not changed: ' + String(c.reason ?? 'no reason was given')); return; }
    say(said, el, String(c.say || 'Changed.'));
    setTimeout(reload, 2500);
  };
  if (warn && L.raise_to_usd) {
    const up = el('button', 'go'); up.type = 'button';
    up.textContent = 'Raise It to ' + dollars(L.raise_to_usd);
    up.addEventListener('click', () => send(up, String(L.raise_to_usd), 'Raising the limit'));
    acts.appendChild(up);
  }
  const form = el('form', 'ai2-limit-form');
  const field = el('label', 'ai2-limit-field');
  const cap = el('span', 'ai2-small'); cap.textContent = L.set === true ? 'A Different Limit, in Dollars a Month' : 'Set a Limit, in Dollars a Month';
  const inp = el('input', 'ai2-limit-in');
  inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off';
  inp.placeholder = L.set === true ? String(L.limit_usd) : '150';
  field.append(cap, inp);
  const set = el('button', L.set === true ? 'go ghost' : 'go'); set.type = 'submit';
  set.textContent = L.set === true ? 'Change It' : 'Set the Limit';
  form.append(field, set);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = inp.value.trim();
    if (!v) { say(said, el, 'Type the limit as a number of dollars, like 150.'); return; }
    send(set, v, 'Setting the limit');
  });
  acts.appendChild(form);
  if (L.set === true) {
    const off = el('button', 'go ghost'); off.type = 'button'; off.textContent = 'Remove the Limit';
    off.addEventListener('click', () => send(off, '', 'Removing the limit'));
    acts.appendChild(off);
  }
  sec.append(acts, said);
  return sec;
}

// 2. Am I in control: one bar, left of what was put in.
export function balance(b, p, el) {   // exported for the Brain engine room's AI balance page (seat brain-tab-room)
  const sec = el('section', 'ai2-block ai2-bal');
  const lab = el('p', 'ai2-label'); lab.textContent = 'Your Prepaid Balance';
  sec.appendChild(lab);
  if (!b.set_up) {
    const n = el('p', 'ai2-sentence'); n.textContent = 'No prepaid balance is set up for this business.';
    sec.appendChild(n);
    return sec;
  }
  const left = Number(b.left_usd), put = Number(b.put_in_usd);
  const low = b.state === 'low' || b.state === 'answers_within_margin' || b.state === 'stopped_at_zero';
  const big = el('p', 'ai2-big' + (low ? ' ai2-warn' : ''));
  big.textContent = (money(Math.max(left, 0)) ?? '$0') + ' left';
  const of = el('p', 'ai2-of');
  of.textContent = 'of ' + (dollars(put) ?? '$0') + ' put in on ' + shortDay(String(b.since || '').slice(0, 10));
  const pct = put > 0 ? Math.max(0, Math.min(100, (left / put) * 100)) : 0;
  const bar = el('div', 'ai2-bar' + (low ? ' ai2-bar-low' : ''));
  bar.setAttribute('role', 'meter');
  bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', String(put));
  bar.setAttribute('aria-valuenow', String(Math.max(left, 0)));
  bar.setAttribute('aria-label', 'Balance left: ' + (money(Math.max(left, 0)) ?? '$0') + ' of ' + (dollars(put) ?? '$0'));
  const fill = el('span', 'ai2-bar-fill'); fill.style.width = pct.toFixed(1) + '%';
  bar.appendChild(fill);
  sec.append(big, of, bar);
  if (low) {
    const w = el('p', 'ai2-warn-line');
    w.textContent = b.state === 'stopped_at_zero' ? 'Used up. ' + String(b.reason || '') : 'Running low. ' + String(b.reason || '');
    sec.appendChild(w);
  }
  const lasts = el('p', 'ai2-line');
  lasts.textContent = b.lasts_days !== null && b.lasts_days !== undefined
    ? 'At the normal pace (about ' + money(p.running_per_day_usd) + ' a day) it lasts about ' + b.lasts_days + ' more days.'
    : 'How long it lasts is not known yet: there is no running pace to go by.';
  const when = el('p', 'ai2-small'); when.textContent = String(b.when_low || '');
  const pass = el('p', 'ai2-line ai2-pass'); pass.textContent = String(p.pass_through || '');
  sec.append(lasts, when, pass);
  return sec;
}

// MONTH BY MONTH (seat ai-tab-months, 2026-11-01; Alex 13:42 PT: "AI this month for November ... a way to also go to the
// other month ... last month and compares it over time"). The last 12 months as small bars, each a press; the chosen
// month shows what it bought, which AI maker and model, and the cost per answer; one sentence compares it with the month
// before and names the largest change by kind of work. Every figure and the sentence come from the brain's meter
// (studio-core ai_months, read once with the tab), so the box says the same. On the first seven days of a month the
// default is this month so far WITH last month beside it, never a near-empty month alone.
// SUPERSEDES (same seat and date): the separate "What it bought" block for this month only; it is now the chosen month's
// first part (this month still with its one-time reading, from ai_spend_plain, as before).
// Month names are dates as data: written in the screen's own language by the browser (translate="no"), redrawn when
// the language switch changes it.
const monthName = (iso, kind) => {
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
  const lang = document.documentElement.lang || 'en';
  try { return d.toLocaleDateString(lang, kind === 'short' ? { month: 'short', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  catch (_) { return d.toLocaleDateString('en-US', { month: kind === 'short' ? 'short' : 'long', timeZone: 'UTC' }); }
};

function monthsBlock(M, p, el) {
  const sec = el('section', 'ai2-block ai2-months');
  const h = el('h3', 'ai2-h'); h.textContent = 'Month by Month';
  sec.appendChild(h);
  if (!M || M.ok !== true || !Array.isArray(M.months) || !M.months.length) {
    const n = el('p', 'notice flagged');
    n.textContent = 'The months could not be read just now: ' + String(M?.error ?? 'no reason was given') + '. Nothing here is a claim either way.';
    sec.appendChild(n);
    return sec;
  }
  const months = M.months;
  const byKey = new Map(months.map((m) => [String(m.month), m]));
  const top = Math.max(1, ...months.map((m) => Number(m.usd) || 0));
  const row = el('div', 'ai2-mrow');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Choose a month');
  const panel = el('div', 'ai2-mpanel');
  panel.setAttribute('aria-live', 'polite');
  const btns = [];
  const choose = (key, beside) => {
    for (const b of btns) b.setAttribute('aria-pressed', String(b.dataset.month === key));
    panel.innerHTML = '';
    const m = byKey.get(key);
    if (!m) return;
    const say = el('p', 'ai2-sentence ai2-msay'); say.textContent = String(m.sentence || '');
    panel.appendChild(say);
    const cards = el('div', beside ? 'ai2-mcards ai2-mcards-two' : 'ai2-mcards');
    cards.appendChild(monthCard(m, M, p, el));
    const b = beside ? byKey.get(beside) : null;
    if (b) cards.appendChild(monthCard(b, M, p, el));
    panel.appendChild(cards);
  };
  for (const m of months) {
    const b = el('button', 'ai2-mbar' + (m.so_far ? ' ai2-mnow' : '') + (m.metered && !m.priced ? ' ai2-munpriced' : '') + (!m.metered ? ' ai2-mnone' : ''));
    b.type = 'button';
    b.dataset.month = String(m.month);
    const usd = Number(m.usd) || 0;
    const v = el('span', 'ai2-mval');
    v.textContent = !m.metered ? '–' : !m.priced ? 'Not Priced' : dollars(usd) ?? '$0';
    const col = el('span', 'ai2-mcol');
    const fill = el('span', 'ai2-mfill');
    fill.style.height = (m.metered && m.priced ? Math.max(usd > 0 ? 3 : 0, (usd / top) * 100) : 0).toFixed(1) + '%';
    col.appendChild(fill);
    const name = el('span', 'ai2-mname'); name.setAttribute('translate', 'no');
    name.dataset.iso = String(m.month);
    name.textContent = monthName(m.month, 'short');
    b.append(v, col, name);
    if (m.so_far) { const s = el('span', 'ai2-mdays'); s.textContent = 'So far, day ' + m.day; b.appendChild(s); }
    b.setAttribute('aria-label', String(m.sentence || ''));
    b.addEventListener('click', () => choose(String(m.month), m.so_far && M.beside ? String(M.beside) : null));
    btns.push(b);
    row.appendChild(b);
  }
  sec.append(row, panel);
  if (M.checked && M.checked.ok !== true) {
    const n = el('p', 'notice flagged');
    n.textContent = 'Earlier months could not be checked against the meter just now, so their figures are not shown. This month is read directly.';
    sec.appendChild(n);
  }
  choose(String(M.selected), M.beside ? String(M.beside) : null);
  // the switch beside her name changes the language: month names follow it
  try {
    new MutationObserver(() => {
      if (!sec.isConnected) return;
      sec.querySelectorAll('.ai2-mname').forEach((n) => { n.textContent = monthName(n.dataset.iso, 'short'); });
      sec.querySelectorAll('.ai2-mtitle').forEach((n) => { n.textContent = monthName(n.dataset.iso, 'long'); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (_) { /* the names stay as drawn */ }
  return sec;
}

// One month: what it bought (three lines adding up to its total), which AI maker and model, the cost per answer.
function monthCard(m, M, p, el) {
  const card = el('div', 'ai2-mcard');
  const t = el('p', 'ai2-label ai2-mtitle'); t.setAttribute('translate', 'no');
  t.dataset.iso = String(m.month);
  t.textContent = monthName(m.month, 'long');
  card.appendChild(t);
  if (m.so_far) { const s = el('p', 'ai2-small'); s.textContent = 'So far, day ' + m.day; card.appendChild(s); }
  const refused = M.checked && M.checked.ok !== true && !m.so_far;
  if (!m.metered || !m.priced || refused) {
    const n = el('p', 'ai2-line');
    n.textContent = refused ? 'Not shown: this month could not be checked against the meter just now.'
      : !m.metered ? 'No AI cost is recorded for this month.' : 'Not priced: the AI calls of this month were recorded before prices were kept.';
    card.appendChild(n);
    return card;
  }
  // this month's figure is the one at the top of the tab (ai_spend_plain); both read the same meter rows
  const big = el('p', 'ai2-big ai2-mid'); big.textContent = money(m.so_far && p && p.this_month_usd !== undefined ? p.this_month_usd : m.usd) ?? '$0.00';
  card.appendChild(big);
  // this month keeps the one-time reading inside each line (ai_spend_plain, checked against the meter); other months read
  // their lines from the months
  if (m.so_far && p && p.adds_up !== true) {
    const n = el('p', 'notice flagged');
    n.textContent = 'The three parts do not add up to this month’s total (' + (money(p.check_usd) ?? 'unknown') + ' on the meter), so they are not shown. This is being looked at.';
    card.appendChild(n);
  } else {
    const now = m.so_far && p && Array.isArray(p.lines);
    card.appendChild(boughtLines(now ? p.lines : m.lines, now ? p.this_month_usd : m.usd, el, now));
  }
  const models = Array.isArray(m.by_model) ? m.by_model : [];
  if (models.length) {
    const h = el('p', 'ai2-label'); h.textContent = 'By AI Company and Model';
    const list = el('div', 'ai2-lines');
    const shown = models.slice(0, 4), rest = models.slice(4);
    for (const x of shown) {
      const r = el('div', 'ai2-row');
      const n = el('span', 'ai2-row-title'); n.setAttribute('translate', 'no'); n.textContent = String(x.name || x.model || '');
      const v = el('span', 'ai2-row-usd'); v.textContent = money(x.usd) ?? '$0.00';
      const s = el('p', 'ai2-row-said'); s.setAttribute('translate', 'no'); s.textContent = String(x.maker || '');
      r.append(n, v, s);
      list.appendChild(r);
    }
    if (rest.length) {
      const r = el('div', 'ai2-row');
      const n = el('span', 'ai2-row-title'); n.textContent = 'Other Models';
      const v = el('span', 'ai2-row-usd'); v.textContent = money(rest.reduce((a, x) => a + (Number(x.usd) || 0), 0)) ?? '$0.00';
      r.append(n, v);
      list.appendChild(r);
    }
    card.append(h, list);
  }
  // each line is one of the screen's own words plus a figure, so it reads in her language
  const per = el('p', 'ai2-line');
  // seat ai-tab-clear: a cost per answer only from 20 answers (the brain leaves it out below that, few_answers true)
  const asked = Number(m.answers) > 0 && m.per_answer_usd !== null && m.per_answer_usd !== undefined;
  const few = !asked && Number(m.answers) > 0;
  per.textContent = asked ? 'Cost per answer: about ' + money(m.per_answer_usd) : few ? 'Cost per answer: too few questions yet to tell.' : 'Cost per answer: no questions were answered this month.';
  card.appendChild(per);
  if (asked) { const q = el('p', 'ai2-small'); q.textContent = 'Questions answered, checks included: ' + Number(m.answers).toLocaleString('en-US'); card.appendChild(q); }
  if (Number(m.unpriced_calls) > 0) {
    const u = el('p', 'ai2-small');
    u.textContent = 'Not in these figures: ' + Number(m.unpriced_calls).toLocaleString('en-US') + ' AI calls with no price recorded.';
    card.appendChild(u);
  }
  return card;
}

// What it bought: three lines that add up, visibly, to the month's total.
// The three names are the screen's own words (written here so they are in the English source and every language gets
// them); the brain's title is used only for a line this screen does not know.
const LINE_TITLE = { finds: 'Find', understands: 'Understand', thinks: 'Reason' };   // decision 1080's three layers, the same words as the Brain tab (seat brain-tab-room; were Finds, Understands, Thinks)
export function boughtLines(lines, total, el, withOneTime) {   // exported for the Brain engine room (seat brain-tab-room)
  const list = el('div', 'ai2-lines');
  for (const l of (Array.isArray(lines) ? lines : [])) {
    const row = el('div', 'ai2-row');
    const t = el('span', 'ai2-row-title'); t.textContent = LINE_TITLE[l.key] ?? l.title;
    const v = el('span', 'ai2-row-usd'); v.textContent = money(l.usd) ?? '$0.00';
    row.append(t, v);
    if (l.said || (withOneTime && Number(l.one_time_usd) >= 0.5)) {
      const said = el('p', 'ai2-row-said');
      said.textContent = String(l.said || '') + (withOneTime && Number(l.one_time_usd) >= 0.5 ? ' Includes ' + money(l.one_time_usd) + ' of one-time reading.' : '');
      row.appendChild(said);
    }
    list.appendChild(row);
  }
  const tot = el('div', 'ai2-row ai2-total');
  const tt = el('span', 'ai2-row-title'); tt.textContent = 'Together';
  const tv = el('span', 'ai2-row-usd'); tv.textContent = money(total) ?? '$0.00';
  tot.append(tt, tv);
  list.appendChild(tot);
  return list;
}

// 4. Was anything unusual: one chart. Running cost in the action color; one-time reading in gray stripes, which
// run off the top when they are far larger than a normal day (said on the chart in words, not hidden).
function byDay(p, el, G) {
  const sec = el('section', 'ai2-block');
  const h = el('h3', 'ai2-h'); h.textContent = 'Day by Day';
  sec.appendChild(h);
  const days = Array.isArray(p.daily) ? p.daily : [];
  // seat ai-tab-clear: a one-bar chart on the 1st said nothing true; under 7 days it is said in words instead
  if (G && G.per_day_ok === false) { const n = el('p', 'ai2-line'); n.textContent = 'Too early in the month to tell day by day.'; sec.appendChild(n); return sec; }
  if (!days.length) { const n = el('p', 'ai2-small'); n.textContent = 'Nothing spent yet this month.'; sec.appendChild(n); return sec; }
  const runs = Array.isArray(p.one_time_runs) ? p.one_time_runs : [];
  const running = days.map((d) => Math.max(0, Number(d.usd) - Number(d.one_time_usd)));
  const top = Math.max(1, ...running) * 1.25;               // the scale is the running cost, so normal days are readable
  // drawn at the screen's own width (not scaled down), so the words on it stay readable on a phone
  const W = Math.round(Math.max(300, Math.min(720, (window.innerWidth || 720) - 40))), H = 220, padL = 34, padB = 22, padT = 56;
  const cw = (W - padL) / days.length, bw = Math.max(3, cw - 2);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('class', 'ai2-chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'AI cost each day this month. ' + String(p.sentence || ''));
  const mk = (tag, attrs, parent = svg) => { const n = document.createElementNS(ns, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };
  const defs = mk('defs', {});
  const pat = mk('pattern', { id: 'ai2-stripe', width: '6', height: '6', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  mk('rect', { width: '6', height: '6', class: 'ai2-stripe-bg' }, pat);
  mk('line', { x1: '0', y1: '0', x2: '0', y2: '6', class: 'ai2-stripe-line' }, pat);
  const y = (v) => H - padB - (Math.min(v, top) / top) * (H - padB - padT);
  // recessive grid: zero and one level, labeled
  const step = top > 8 ? Math.ceil(top / 2 / 5) * 5 : Math.ceil(top / 2);
  for (const v of [0, step]) {
    mk('line', { x1: String(padL), x2: String(W), y1: String(y(v)), y2: String(y(v)), class: v === 0 ? 'ai2-axis' : 'ai2-grid' });
    const t = mk('text', { x: String(padL - 6), y: String(y(v) + 4), class: 'ai2-tick', 'text-anchor': 'end' }); t.textContent = '$' + v;
  }
  const readout = el('p', 'ai2-line ai2-readout'); readout.setAttribute('aria-live', 'polite');
  readout.textContent = 'Tap or point at a day to see its numbers.';
  days.forEach((d, i) => {
    const x = padL + i * cw + (cw - bw) / 2;
    const run = running[i], one = Number(d.one_time_usd);
    const g = mk('g', { class: 'ai2-day', tabindex: '0' });
    const tip = mk('title', {}, g);
    tip.textContent = shortDay(d.day) + ': ' + money(d.usd) + (one >= 0.5 ? ' (' + money(one) + ' one-time reading, ' + money(run) + ' running)' : '') + (d.note ? ', ' + d.note : '');
    const show = () => { readout.textContent = tip.textContent; };
    g.addEventListener('click', show); g.addEventListener('focus', show); g.addEventListener('mouseenter', show);
    mk('rect', { x: String(padL + i * cw), y: String(padT - 30), width: String(cw), height: String(H - padB - padT + 30), class: 'ai2-hit' }, g);
    if (run > 0) mk('rect', { x: String(x), y: String(y(run)), width: String(bw), height: String(Math.max(1, H - padB - y(run))), rx: '2', class: 'ai2-run' }, g);
    if (one >= 0.5) {
      const base = run > 0 ? y(run) - 2 : H - padB;
      const yt = y(run + one);
      mk('rect', { x: String(x), y: String(yt), width: String(bw), height: String(Math.max(2, base - yt)), rx: '2', fill: 'url(#ai2-stripe)', class: 'ai2-one' }, g);
    }
    if (i === 0 || i === days.length - 1 || (new Date(d.day + 'T12:00:00').getDate() % 7 === 1 && i < days.length - 4)) {
      const end = i === days.length - 1;
      const t = mk('text', { x: String(end ? W - 1 : padL + i * cw + cw / 2), y: String(H - 6), class: 'ai2-tick', 'text-anchor': end ? 'end' : (i === 0 ? 'start' : 'middle') });
      t.textContent = shortDay(d.day);
    }
  });
  // what was unusual, named in words above its days: one-time reading, and running days well above the pace
  const notes = runs.map((r) => ({ from: r.from, to: r.to, say: 'One-time ' + dollars(r.usd) }));
  days.forEach((d, i) => {
    if (!d.note) return;
    const say = d.note === 'many questions' ? 'Many questions' : 'More arriving';
    const prev = notes[notes.length - 1];
    if (prev && prev.say === say && i > 0 && days[i - 1].day === prev.to) prev.to = d.day;   // one label for a run of days
    else notes.push({ from: d.day, to: d.day, say });
  });
  notes.sort((a, b) => (a.from < b.from ? -1 : 1));
  let lastEnd = -1e9, row = 0;
  notes.forEach((nt) => {
    const i0 = days.findIndex((d) => d.day === nt.from); const i1 = Math.max(i0, days.findIndex((d) => d.day === nt.to));
    if (i0 < 0) return;
    const cx = padL + ((i0 + i1 + 1) / 2) * cw;
    const half = nt.say.length * 3.3;
    const x = Math.min(W - half - 2, Math.max(padL + half, cx));
    row = x - half < lastEnd + 6 ? row + 1 : 0;     // the next line down when two labels would touch
    lastEnd = x + half;
    const t = mk('text', { x: String(x), y: String(14 + Math.min(row, 2) * 15), class: 'ai2-note', 'text-anchor': 'middle' });
    t.textContent = nt.say;
  });
  const frame = el('div', 'ai2-chart-frame');
  frame.appendChild(svg);
  sec.append(frame, readout);
  const key = el('p', 'ai2-key');
  const k1 = el('span', 'ai2-key-run'); k1.textContent = 'Running Cost';
  const k2 = el('span', 'ai2-key-one'); k2.textContent = 'One-Time Reading of What Was Already There';
  key.append(k1, k2);
  sec.appendChild(key);
  if (runs.length) {
    const n = el('p', 'ai2-small');
    n.textContent = 'Drawn to the scale of a normal day, so the one-time reads run off the top. What each one was is in the sentence at the top.';
    sec.appendChild(n);
  }
  // the numbers, one press away
  const det = el('details', 'ai2-table');
  const s = el('summary', 'ai2-more-sum'); s.textContent = 'See the Numbers for Each Day';
  const tbl = el('table', 'ai2-days');
  const hd = el('tr', '');
  for (const c of ['Day', 'Running', 'One-time', 'Total']) { const th = el('th', ''); th.textContent = c; hd.appendChild(th); }
  tbl.appendChild(hd);
  days.forEach((d, i) => {
    const tr = el('tr', '');
    for (const v of [shortDay(d.day), money(running[i]), Number(d.one_time_usd) >= 0.005 ? money(d.one_time_usd) : '', money(d.usd)]) { const td = el('td', ''); td.textContent = v ?? ''; tr.appendChild(td); }
    tbl.appendChild(tr);
  });
  det.append(s, tbl);
  sec.appendChild(det);
  return sec;
}

// 5. Next month: an estimate without one-time reads, labeled so.
function nextMonth(p, el) {
  const sec = el('section', 'ai2-block');
  const lab = el('p', 'ai2-label'); lab.textContent = String(p.next_month || 'Next month') + ', estimated';
  const big = el('p', 'ai2-big ai2-mid'); big.textContent = 'About ' + (dollars(p.next_month_estimate_usd) ?? '$0');
  const basis = el('p', 'ai2-small'); basis.textContent = String(p.estimate_basis || '');
  const tm = el('p', 'ai2-small');
  if (p.this_month_expected_usd !== null && p.this_month_expected_usd !== undefined) tm.textContent = 'This whole month, expected: about ' + dollars(p.this_month_expected_usd) + ' (what is spent so far, plus the rest of the month at the running pace).';
  sec.append(lab, big, basis, tm);
  return sec;
}

function stepCard(s, ctx, reload) {
  const { el } = ctx;
  const card = el('section', 'ai-step');
  const head = el('div', 'ai-step-head');
  const title = el('h3', 'ai-step-title'); title.textContent = s.title;
  const cost = el('span', 'ai-step-cost');
  cost.textContent = money(s.this_month_usd) ? money(s.this_month_usd) + ' this month' : 'Nothing this month';
  head.append(title, cost);
  const does = el('p', 'ai-does'); does.textContent = s.does;

  const runs = el('p', 'ai-runs');
  const lead = el('span', 'quiet'); lead.textContent = 'Runs on ';
  const name = el('b'); name.textContent = s.model_name;
  const by = el('span', 'quiet');
  by.textContent = (s.maker ? ' from ' + s.maker : '') + (s.chosen_by === 'you' ? ', your choice' : ", the studio's choice");
  runs.append(lead, name, by);
  if (s.chosen_by === 'you') { const b = el('span', 'badge b-blue'); b.textContent = 'Chosen by You'; runs.append(' ', b); }

  const score = el('p', 'ai-score');
  const sl = el('span', 'ai-label'); sl.textContent = 'On our test: ';
  score.append(sl, document.createTextNode(String(s.score || '')));
  card.append(head, does, runs, score);
  if (s.speed) { const p = el('p', 'quiet'); p.textContent = s.speed; card.appendChild(p); }
  if (s.floor) { const p = el('p', 'notice ai-floor'); p.textContent = s.floor; card.appendChild(p); }
  if (s.change_note) { const p = el('p', 'quiet'); p.textContent = s.change_note; card.appendChild(p); }

  const said = el('div', 'ai-said'); said.setAttribute('aria-live', 'polite');
  const alts = Array.isArray(s.alternatives) ? s.alternatives : [];
  const toggle = el('button', 'go ghost ai-other');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = alts.length ? 'Other Choices (' + alts.length + ')' : 'No Other Choices Yet';
  const list = el('div', 'ai-alts'); list.hidden = true;
  if (alts.length) {
    toggle.addEventListener('click', () => {
      list.hidden = !list.hidden;
      toggle.setAttribute('aria-expanded', String(!list.hidden));
    });
  } else toggle.hidden = true;
  for (const a of alts) list.appendChild(altRow(s, a, said, ctx, reload));
  if (s.chosen_by === 'you') list.appendChild(backRow(s, said, ctx, reload));
  card.append(toggle, list, said);
  return card;
}

function altRow(s, a, said, ctx, reload) {
  const { el } = ctx;
  const row = el('div', 'ai-alt');
  const top = el('div', 'ai-alt-head');
  const n = el('b'); n.textContent = a.name;
  const m = el('span', 'quiet'); m.textContent = a.maker;
  top.append(n, ' ', m);
  if (a.ready === false) { const b = el('span', 'badge b-orange'); b.textContent = 'Not Ready'; top.append(' ', b); }
  const score = el('p', 'ai-alt-line'); score.textContent = 'On our test: ' + String(a.score || '');
  const price = el('p', 'ai-alt-line');
  const was = money(s.cost_30d_usd);
  price.textContent = money(a.cost_30d_usd) !== null
    ? 'Your last 30 days of this work: about ' + money(a.cost_30d_usd) + (was ? ' (today ' + was + ').' : '.') + (a.cost_note ? ' ' + a.cost_note : '')
    : 'No price yet: there was no work of this kind in the last 30 days.';
  const speed = el('p', 'ai-alt-line quiet'); speed.textContent = String(a.speed || '');
  row.append(top, score, price, speed);
  if (a.can_choose) {
    const use = el('button', 'go ai-use');
    use.type = 'button'; use.textContent = 'Use ' + a.name;
    use.addEventListener('click', () => preview(s, a.model, use, said, ctx, reload));
    row.appendChild(use);
  } else {
    const why = el('p', 'ai-why'); why.textContent = 'Cannot be chosen: ' + String(a.why_not || 'no reason was given');
    row.appendChild(why);
  }
  return row;
}

function backRow(s, said, ctx, reload) {
  const { el } = ctx;
  const row = el('div', 'ai-alt');
  const b = el('button', 'go ghost ai-use');
  b.type = 'button'; b.textContent = "Go Back to the Studio's Choice";
  b.addEventListener('click', () => preview(s, null, b, said, ctx, reload));
  row.appendChild(b);
  return row;
}

// One press shows the effect; a second makes it. The Tool's working sign sits beside what she pressed.
async function preview(s, model, btn, said, ctx, reload) {
  const { el, askBody } = ctx;
  said.innerHTML = '';
  btn.disabled = true;
  const w = el('p', 'working'); w.textContent = 'Working out what would change';
  btn.after(w);
  const r = await askBody({ ai_choose: { step: s.step, model, confirm: false } });
  w.remove(); btn.disabled = false;
  const c = r?.choice;
  if (!r || r.ok !== true || !c) { say(said, el, 'This could not be worked out just now: ' + String(r?.error ?? 'no reason was given') + '.'); return; }
  if (c.ok !== true) { say(said, el, 'Not changed: ' + String(c.reason ?? 'no reason was given')); return; }
  const box = el('div', 'ai-confirm');
  const p = el('p', 'ai-effect'); p.textContent = String(c.say || '');
  const acts = el('div', 'actions');
  const yes = el('button', 'go'); yes.type = 'button'; yes.textContent = 'Yes, Change It';
  const no = el('button', 'go ghost'); no.type = 'button'; no.textContent = 'Keep It as It Is';
  acts.append(yes, no);
  box.append(p, acts);
  said.appendChild(box);
  said.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  no.addEventListener('click', () => { said.innerHTML = ''; });
  yes.addEventListener('click', async () => {
    yes.disabled = true; no.disabled = true;
    const w2 = el('p', 'working'); w2.textContent = 'Changing it';
    acts.after(w2);
    const r2 = await askBody({ ai_choose: { step: s.step, model, confirm: true } });
    w2.remove();
    const c2 = r2?.choice;
    if (!r2 || r2.ok !== true || !c2) { yes.disabled = false; no.disabled = false; say(said, el, 'Not changed: ' + String(r2?.error ?? 'no reason was given') + '.', true); return; }
    if (c2.ok !== true) { say(said, el, 'Not changed: ' + String(c2.reason ?? 'no reason was given')); return; }
    say(said, el, String(c2.say || 'Changed.'));
    setTimeout(reload, 2500);
  });
}

function say(slot, el, text, keep) {
  if (!keep) slot.innerHTML = '';
  const p = el('p', 'ai-result'); p.textContent = text;
  slot.appendChild(p);
}

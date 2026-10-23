// THE AI TAB (seat ai-tab, 2026-10-23; master_spec 4.40 §5.y, decisions 1005-1007). Owner only.
// Alex 2026-10-22: "It gives a ton of control to the customer and also the pricing... I rely on you to keep it straight,
// and also on the tab to see it. Make it visibly user friendly. And then the whole combination thing, what gets what."
// What it shows, all from one reading (lens-ask {ai_tab:true} -> studio-proxy /v1/ai/tab -> studio-core ai_tab()):
//   the balance left, spent this month, the month projected, how top-ups happen;
//   one card per kind of work, in plain words, with what it does for her, the model doing it, its score on the studio's
//   exam, this month's cost, and "Other choices", each with its score, speed and price on her last 30 days of work.
// Changing a model: one press shows the effect (lens-ask {ai_choose:{step, model}}), a second press makes it
// ({confirm:true}). The write lands in the one place models are chosen (studio-core model_choice) and its guard still
// decides, so a choice the tab offers and the database refuses comes back as a reason, never as a silent nothing.
// A choice that cannot be made says why in words; there is no greyed-out button. Nothing is computed here: every number
// and every sentence comes from the reading, so the tab and the box say the same thing.

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
    again.type = 'button'; again.textContent = 'Try again';
    again.addEventListener('click', () => load(wrap, ctx));
    wrap.append(p, again);
    return;
  }
  draw(wrap, r.ai, ctx);
}

function draw(wrap, ai, ctx) {
  const { el, ask } = ctx;
  const h = ai.header || {};

  const intro = el('p', 'lede ai-lede');
  intro.textContent = 'Which AI does each kind of work for you, how well it did on our test, what it costs, and what else you could use.';
  wrap.appendChild(intro);

  // The money, at the top.
  const top = el('div', 'ai-top');
  const tile = (label, value, note) => {
    const t = el('div', 'ai-tile');
    const l = el('span', 'ai-tile-label'); l.textContent = label;
    const v = el('b', 'ai-tile-value'); v.textContent = value;
    t.append(l, v);
    if (note) { const n = el('span', 'ai-tile-note'); n.textContent = note; t.appendChild(n); }
    return t;
  };
  const left = money(h.balance_left_usd);
  top.append(
    tile('Balance left', left ?? 'Not set up', h.balance_state === 'low' ? 'Running low' : h.balance_state === 'stopped_at_zero' ? 'Used up: reading has stopped' : null),
    tile('Spent this month', money(h.this_month_usd) ?? 'Nothing yet', money(h.last_month_usd) ? 'Last month ' + money(h.last_month_usd) : null),
    tile('This month, projected', money(h.projected_month_usd) ? 'About ' + money(h.projected_month_usd) : 'Not known yet', null),
    tile('Next top-up', h.top_up ? 'By the studio' : 'None set up', h.top_up || null),
  );
  wrap.appendChild(top);
  if (h.balance_reason) { const p = el('p', 'notice'); p.textContent = h.balance_reason; wrap.appendChild(p); }

  const basis = el('p', 'quiet ai-basis');
  basis.textContent = String(ai.basis || '');
  wrap.appendChild(basis);

  // One card per kind of work.
  for (const s of (Array.isArray(ai.steps) ? ai.steps : [])) wrap.appendChild(stepCard(s, ctx, () => load(wrap, ctx)));

  const qd = el('p', 'quiet ai-coming-line');
  qd.textContent = String(ai.quick_deep || '');
  wrap.appendChild(qd);

  // Bring your own: listed, marked coming, never a dead button.
  const comingHead = el('h3', 'ai-h'); comingHead.textContent = 'Other ways to run it';
  wrap.appendChild(comingHead);
  for (const c of (Array.isArray(ai.coming) ? ai.coming : [])) {
    const row = el('div', 'ai-coming');
    const b = el('span', 'badge b-grey'); b.textContent = 'Coming';
    const n = el('b'); n.textContent = c.name;
    const say = el('span', 'quiet'); say.textContent = String(c.say || '').split(' Coming.').join('');
    row.append(b, n, say);
    wrap.appendChild(row);
  }

  if (ai.reach) { const p = el('p', 'quiet ai-reach'); p.textContent = ai.reach; wrap.appendChild(p); }

  // Ask it: the box answers anything on this tab.
  const askHead = el('h3', 'ai-h'); askHead.textContent = 'Ask about any of it';
  const asks = el('div', 'ai-asks');
  for (const q of ['Which AI answers my questions?', 'What would the best setup cost me?', 'Why can I not change the model that sorts my mail?']) {
    const b = el('button', 'go ghost ai-ask');
    b.type = 'button'; b.textContent = q;
    b.addEventListener('click', () => ask(q));
    asks.appendChild(b);
  }
  wrap.append(askHead, asks);
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
  if (s.chosen_by === 'you') { const b = el('span', 'badge b-blue'); b.textContent = 'Chosen by you'; runs.append(' ', b); }

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
  toggle.textContent = alts.length ? 'Other choices (' + alts.length + ')' : 'No other choices yet';
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
  if (a.ready === false) { const b = el('span', 'badge b-orange'); b.textContent = 'Not ready'; top.append(' ', b); }
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
  b.type = 'button'; b.textContent = "Go back to the studio's choice";
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
  const yes = el('button', 'go'); yes.type = 'button'; yes.textContent = 'Yes, change it';
  const no = el('button', 'go ghost'); no.type = 'button'; no.textContent = 'Keep it as it is';
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

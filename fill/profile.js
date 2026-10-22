// fill/profile.js - WHAT THE TOOL THINKS YOUR BUSINESS IS (seat know-the-business, Alex 2026-10-10: "The Tool
// should really understand the business after the first run through the documents, the emails, the phone calls.")
//
// Capability "Understand my business, and let me confirm it". Mechanisms: WHO-AND-WHAT (the statements, written
// by subject-resolve's profile pass into public.business_profile), LEARN FROM A CORRECTION (business_profile_answer:
// right, wrong, or her own words) and SHOW (this file). Owner only: both functions refuse anyone else with a reason,
// and a refusal is drawn as a refusal, never as an empty list.
//
// This file decides nothing. Every statement is a guess until she answers it; the database refuses "confirmed"
// without her answer. Each statement opens the emails it came from. What the pass did not read is listed at the
// bottom, because a profile that looks complete when it is not is the failure this capability most risks.
// Lives in the Brain tab's "Read it back to me" section (s-recognition), above the list of what is connected.

import { fmtDate } from './dates.js?v=2026-10-22-dates';
let ctx = null;   // { sb, el, $, countOf }
let last = null;
let saying = '';

const line = (cls, text) => { const p = ctx.el('p', cls); p.textContent = text; return p; };
const day = (d) => fmtDate(d, 'day');
const gmailLink = (e) => 'https://mail.google.com/mail/?authuser=' + encodeURIComponent(e.mailbox) + '#all/' + encodeURIComponent(e.mail_id);

export function initProfile(c) { ctx = c; }

export async function loadProfile() {
  const mount = ctx.$('#profile'); if (!mount) return;
  if (!mount.childElementCount) mount.appendChild(line('quiet working', 'Reading.'));
  try {
    const { data, error } = await ctx.sb.rpc('business_profile_list');
    if (error) throw error;
    last = data;
  } catch (e) {
    const msg = String(e?.message ?? e);
    last = { ok: false, note: msg.includes('Could not find the function')
      ? 'This part is not switched on yet: one change to the brain is waiting to be applied.'
      : 'What the Tool thinks your business is could not be read, so nothing here is known: ' + msg };
  }
  draw();
}

async function answer(id, verdict, words, btns) {
  for (const b of btns) b.disabled = true;
  try {
    const { data, error } = await ctx.sb.rpc('business_profile_answer', { p_id: id, p_verdict: verdict, p_words: words ?? null });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.note ?? data?.reason ?? 'no reason was given');
    saying = verdict === 'right' ? 'Kept as right.' : verdict === 'wrong' ? 'Set aside as wrong. The Tool will not rely on it.' : 'Kept in your words.';
  } catch (e) {
    saying = 'Not kept: ' + (e?.message ?? e) + '. Nothing changed.';
  }
  await loadProfile();
}

function why(s) {
  const d = ctx.el('details', 'recs');
  const sm = ctx.el('summary', 'recs-sum'); sm.textContent = 'Why'; d.appendChild(sm);
  const ul = ctx.el('ul', 'attn');
  for (const e of s.evidence ?? []) {
    const li = ctx.el('li');
    if (e.mail_id && e.mailbox) {
      const a = ctx.el('a'); a.href = gmailLink(e); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = (e.subject || 'An email') + (e.date ? ', ' + day(e.date) : '') + ' (' + e.mailbox + ')';
      const t = ctx.el('p', 'a-title'); t.appendChild(a); li.appendChild(t);
    } else if (e.name) {
      li.appendChild(line('a-title', e.name + (e.kind ? ' (' + e.kind + ')' : '')));
    } else {
      li.appendChild(line('a-title', String(e.record_id ?? 'A record')));
    }
    const detail = [e.why, e.locator ? '"' + e.locator + '"' : ''].filter(Boolean).join(' ');
    if (detail) li.appendChild(line('a-detail', detail));
    ul.appendChild(li);
  }
  d.appendChild(ul);
  return d;
}

function statement(s) {
  const li = ctx.el('li');
  li.appendChild(line('a-title', s.statement));
  const state = s.status === 'confirmed' ? 'You said this is right on ' + day(s.answered_at) + '.'
    : s.status === 'corrected' ? 'In your words, ' + day(s.answered_at) + '. The Tool first said: ' + s.tool_said
    : s.status === 'asked_again' ? 'Asked again: ' + (s.asked_again_because || 'something newer does not fit what you said.')
    : 'A guess (' + (s.confidence || 'unsure') + '). Not relied on until you answer.';
  li.appendChild(line(s.status === 'asked_again' ? 'notice flagged' : 'a-detail', state));

  const row = ctx.el('div', 'actions');
  const mk = (label, ghost) => { const b = ctx.el('button', ghost ? 'go ghost' : 'go'); b.type = 'button'; b.textContent = label; row.appendChild(b); return b; };
  const open = s.status === 'guess' || s.status === 'asked_again';
  const right = mk(open ? 'Right' : s.status === 'rejected' ? 'Right after all' : 'Still right', false);
  const wrong = mk('Wrong', true);
  const fix = mk('Correct it', true);
  const btns = [right, wrong, fix];
  right.hidden = s.status === 'confirmed';
  wrong.hidden = s.status === 'rejected';
  right.addEventListener('click', () => answer(s.id, 'right', null, btns));
  wrong.addEventListener('click', () => answer(s.id, 'wrong', null, btns));
  fix.addEventListener('click', () => {
    if (li.querySelector('textarea')) return;
    const ta = ctx.el('textarea'); ta.rows = 2; ta.maxLength = 1000;
    ta.value = s.statement; ta.setAttribute('aria-label', 'How it really is');
    const save = ctx.el('button', 'go'); save.type = 'button'; save.textContent = 'Save';
    save.addEventListener('click', () => {
      const w = ta.value.trim();
      if (!w) { ta.focus(); return; }
      answer(s.id, 'correct', w, btns.concat([save]));
    });
    li.insertBefore(ta, row.nextSibling); li.insertBefore(save, ta.nextSibling);
    ta.focus();
  });
  li.appendChild(row);
  li.appendChild(why(s));
  return li;
}

function notRead(lp) {
  const b = lp?.boundary ?? {};
  const items = [];
  if (b.messages_not_in_any_pattern_sent) items.push([ctx.countOf(b.messages_not_in_any_pattern_sent) + ' emails not looked at one by one', 'Only messages that repeat were summarized; one-off emails were not read in this pass.']);
  if (b.example_messages_read_in_part) items.push([ctx.countOf(b.example_messages_read_in_part) + ' emails read only in part', 'The opening of each was read, not the whole message.']);
  if (b.other_mailboxes) items.push(['Other mailboxes', 'Only ' + String(lp.source ?? '').split(':')[1] + ' was read in this pass.']);
  if (b.documents) items.push(['Files', 'File contents were not read in this pass; only their kinds and names.']);
  if (b.systems_read_live) items.push(['Books, bank and payments', 'Not read in this pass, so nothing here is checked against them.']);
  for (const g of b.could_not_tell ?? []) items.push(['Could not tell' + (g.area ? ': ' + g.area : ''), g.why_not]);
  const d = ctx.el('details', 'recs');
  const s = ctx.el('summary', 'recs-sum'); s.textContent = 'What this was not based on (' + items.length + ')'; d.appendChild(s);
  const ul = ctx.el('ul', 'attn');
  for (const [t, w] of items) { const li = ctx.el('li'); li.appendChild(line('a-title', t)); if (w) li.appendChild(line('a-detail', w)); ul.appendChild(li); }
  d.appendChild(ul);
  return d;
}

function draw() {
  const mount = ctx.$('#profile'); if (!mount) return;
  mount.innerHTML = '';
  if (!last?.ok) { mount.appendChild(line('notice flagged', last?.note ?? ('This could not be shown' + (last?.reason ? ' (' + last.reason + ')' : '') + '.'))); return; }
  const all = last.statements ?? [];
  const lp = last.last_pass;
  if (!all.length) { mount.appendChild(line('quiet', 'The Tool has not written anything about your business yet.')); return; }

  const answered = all.filter((s) => s.status !== 'guess' && s.status !== 'asked_again').length;
  const box = lp?.source ? String(lp.source).split(':')[1] : '';
  mount.appendChild(line('quiet', 'Read from ' + (lp?.boundary?.months ?? 24) + ' months of ' + (box || 'one mailbox') + ' on ' + day(lp?.finished_at)
    + '. ' + ctx.countOf(answered) + ' of ' + ctx.countOf(all.length) + ' answered. What you mark right or put in your own words is what the Tool relies on; what you mark wrong is set aside.'));
  if (saying) { mount.appendChild(line('quiet', saying)); saying = ''; }

  const shown = all.filter((s) => s.status !== 'rejected');
  const areas = [];
  for (const s of shown) if (!areas.includes(s.area)) areas.push(s.area);
  for (const a of areas) {
    const h = ctx.el('h3'); h.textContent = a.charAt(0).toUpperCase() + a.slice(1); h.style.marginTop = '2rem'; mount.appendChild(h);
    const ul = ctx.el('ul', 'attn');
    for (const s of shown.filter((x) => x.area === a)) ul.appendChild(statement(s));
    mount.appendChild(ul);
  }

  const out = all.filter((s) => s.status === 'rejected');
  if (out.length) {
    const d = ctx.el('details', 'recs');
    const s = ctx.el('summary', 'recs-sum'); s.textContent = 'You said these are wrong (' + out.length + ')'; d.appendChild(s);
    const ul = ctx.el('ul', 'attn');
    for (const r of out) { const li = statement(r); ul.appendChild(li); }
    d.appendChild(ul);
    mount.appendChild(d);
  }
  if (lp) mount.appendChild(notRead(lp));
}

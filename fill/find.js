// fill/find.js - FIND FIRST, THEN WORK ON WHAT WAS FOUND (seat find-first, 2026-10-23; decisions 1010 and 1012).
// Alex, 2026-10-23: "I say 'Diconium payments', find that, and then it reasons only over that, which should be a lot
// cheaper." And: "How would she change that label? How would that look on the screen? ... tapping is as valid as talking."
//
// A find comes back from lens-ask as a found set (state 'found'): whole items (an email conversation, a file, a record, a
// chat), newest first, each with its source and date, every one passed through the door. No model read anything to find
// them. Here she sees them as cards, every card checked; she unchecks what does not belong (or swipes it on a phone), and
// one press works on exactly what is left: Draft a reply from these, Summarize, What is the issue here, or her own words.
// Only then does a model run (lens-ask body.over), and its answer starts with what it read.
// LEARNING BY DOING (decision 1012). What she keeps, unchecks and opens, and a label she sets with the chip, are counted in
// the brain (find_signal_add, as her own sign-in), and her later finds come out in that order: counting, not a model. A label
// she sets is kept as her example for that item; it does not change who may see it (seat find-first's report says why).
// The first time she unchecks or relabels, one line says the Tool learns from it; never again unless she asks.
// "Tell me when new ones arrive" keeps the find as a watch (find_watch_add); seat watches (2026-10-23) reads it every
// 10 minutes and says new matching email in the conversation (fill/watches.js). Superseded 2026-10-23 by seat watches:
// the line saying alerts were not built yet. What it learned is one list, each line removable.
// No regex literals (STANDING-CLAUSES: the write tool).

import { fmtDate } from "./dates.js?v=2026-10-22-dates";

const KIND = { email: "Email", attachment: "Attachment", file: "File", record: "Record", chat: "Chat", meeting: "Meeting", thought: "Your thoughtgram", piece: "Item" };
const SENS = { hr: "people", comp: "pay", compensation: "pay", legal: "legal", finance: "money", financial: "money", restricted: "restricted", personal: "personal" };
const LABELS = ["Client mail", "Supplier", "Invoice or payment", "Contract", "Candidate or contractor", "Internal", "Personal", "Not business"];
const SAID_KEY = "tool.find.learn-said";
let saidHere = false;

function cap(s) { s = String(s || ""); return s ? s[0].toUpperCase() + s.slice(1) : s; }
function chipText(it) {
  // EARLIER AI WORK (seat attention, 2026-10-27, decision 1024 item 8): a saved chat or a document saved from an assistant is
  // labeled as earlier AI work, never as a source; the brain ranks it after the sources (find_for_identity earlier_ai).
  if (it.earlier_ai) return "Earlier AI work";
  const w = (it.kind === "file" || it.kind === "attachment" || it.kind === "record") && it.what && it.what !== "file" ? cap(it.what) : (KIND[it.kind] || "Item");
  const s = SENS[String(it.sensitivity || "").toLowerCase()];
  return s ? w + " · " + s : w;
}
function said() {
  if (saidHere) return true;
  try { return localStorage.getItem(SAID_KEY) === "1"; } catch (_) { return false; }
}
function markSaid() { saidHere = true; try { localStorage.setItem(SAID_KEY, "1"); } catch (_) { /* this browser keeps nothing */ } }

// COPIES OF ONE DOCUMENT (seat versions-reuse, 2026-10-23). The brain groups near-identical files and attachments into one
// family and a find shows each family once; this line says whether this is the latest copy and how many others she can open.
// What changed compares it with the copy just before or after it, reading both through the door like any item she keeps.
function familyLine(ctx, main, it) {
  const f = it.family;
  if (!f || Number(f.copies) < 2) return;
  const others = Number(f.copies) - 1;
  const line = el("p", "find-meta find-family");
  line.textContent = (f.is_latest ? "Latest copy" : "Not the latest: a newer copy is dated " + fmtDate(f.latest_date, "day"))
    + "; " + others + (others === 1 ? " other copy" : " other copies") + " you can open.";
  main.appendChild(line);
  const o = f.other;
  if (!o || !Array.isArray(o.piece_ids) || !o.piece_ids.length) return;
  const b = el("button", "go ghost find-changed"); b.type = "button"; b.textContent = "What changed";
  const out = el("div", "find-changes"); out.setAttribute("aria-live", "polite");
  b.addEventListener("click", async () => {
    b.disabled = true;
    const wait = el("p", "answer-wait working"); wait.textContent = "Comparing the two copies.";
    out.replaceChildren(wait);
    const mine = { key: it.key, kind: it.kind, what: it.what, title: it.title, where: it.where, date: it.date,
      piece_ids: Array.isArray(f.self_piece_ids) && f.self_piece_ids.length ? f.self_piece_ids : it.piece_ids };
    const theirs = { key: o.key, kind: it.kind, what: it.what, title: (o.newer ? "The newer copy" : "The earlier copy"), where: it.where, date: o.date, piece_ids: o.piece_ids };
    const res = await ctx.askBody({ question: "What changed between these two copies?", over: { ask: "changes", items: o.newer ? [theirs, mine] : [mine, theirs] } });
    b.disabled = false;
    const sub = el("div", "find-answer");
    out.replaceChildren(sub);
    if (!res || res.ok !== true) { const p = el("p", "state stalled"); p.textContent = res?.error || "The copies could not be compared just now. Press it again."; sub.appendChild(p); return; }
    ctx.renderAsk(sub, res, { q: "What changed between these two copies?" });
  });
  main.append(b, out);
}

async function signal(ctx, rows) {
  if (!rows.length) return null;
  try { const { data, error } = await ctx.rpc("find_signal_add", { p_signals: rows }); return error ? null : data; } catch (_) { return null; }
}
function lesson(ctx, where) {
  if (said()) return;
  markSaid();
  const p = ctx.el("p", "find-lesson"); p.textContent = "Got it. I learn from this, so the next search puts these first.";
  where.appendChild(p);
}

export function foundCard(slot, body, ctx) {
  const el = ctx.el;
  const found = body.found || {};
  const items = Array.isArray(found.items) ? found.items : [];
  const spec = found.spec || {};
  const about = [spec.about, spec.party, spec.period].filter(Boolean).join(", ");
  const wrap = el("div", "find-set");
  const lead = el("p", "ans-lead"); lead.textContent = String(body.answer || "Nothing was found."); wrap.appendChild(lead);
  // What was searched and what was not: always under the lead, in full ink (the same box answers use).
  const lines = Array.isArray(body.completeness) ? body.completeness : [];
  if (lines.length) {
    const box = el("div", "ans-gap find-lines");
    const ul = el("ul", "ans-gap-list");
    for (const l of lines) { const li = el("li"); li.textContent = String(l); ul.appendChild(li); }
    box.appendChild(ul); wrap.appendChild(box);
  }
  if (!items.length) { slot.appendChild(wrap); return; }
  const how = el("p", "quiet find-how");
  how.textContent = "Everything is checked. Uncheck what does not belong, then pick what to do with the rest.";
  wrap.appendChild(how);

  const keep = new Map();
  const list = el("ul", "find-list");
  items.forEach((it, i) => {
    keep.set(it.key, true);
    const li = el("li", "find-item");
    const lab = el("label", "find-check");
    const box = el("input"); box.type = "checkbox"; box.checked = true;
    box.setAttribute("aria-label", "Keep " + (it.title || "this item"));
    lab.appendChild(box);
    const main = el("div", "find-main");
    const top = el("div", "find-top");
    const chip = el("button", "find-chip"); chip.type = "button"; chip.textContent = chipText(it); chip.title = "Say what this is";
    const title = it.open_url ? el("a", "find-title") : el("span", "find-title");
    title.textContent = it.title || "(untitled)";
    if (it.open_url) {
      title.href = it.open_url; title.target = "_blank"; title.rel = "noopener";
      title.addEventListener("click", () => { signal(ctx, [{ key: it.key, signal: "opened", title: it.title, about }]); });
    }
    top.append(chip, title);
    const meta = el("p", "find-meta");
    meta.textContent = [it.where, fmtDate(it.date, "day"), it.kind === "email" && it.parts > 1 ? it.parts + " messages" : "",
      it.places > 1 ? "in " + it.places + " mailboxes" : "", it.linked ? "linked to them" : ""].filter(Boolean).join(" · ");
    const snip = el("p", "find-snip"); snip.textContent = String(it.snippet || "");
    main.append(top, meta, snip);
    familyLine(ctx, main, it);
    li.append(lab, main);
    const toggle = () => { keep.set(it.key, box.checked); li.classList.toggle("off", !box.checked); if (!box.checked) lesson(ctx, li); };
    box.addEventListener("change", toggle);
    chip.addEventListener("click", () => picker(ctx, li, it, chip, about));
    // On a phone a swipe to the left unchecks it (and back).
    let x0 = null;
    li.addEventListener("touchstart", (e) => { x0 = e.touches && e.touches[0] ? e.touches[0].clientX : null; }, { passive: true });
    li.addEventListener("touchend", (e) => {
      const x1 = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
      if (x0 !== null && x1 !== null && x0 - x1 > 70) { box.checked = !box.checked; toggle(); }
      x0 = null;
    });
    list.appendChild(li);
  });
  wrap.appendChild(list);

  const out = el("div", "find-out"); out.setAttribute("aria-live", "polite");
  const acts = el("div", "actions find-acts");
  const buttons = [];
  const run = async (ask, label) => {
    const kept = items.filter((it) => keep.get(it.key));
    const left = items.filter((it) => !keep.get(it.key));
    if (!kept.length) { const p = el("p", "state stalled"); p.textContent = "Check at least one item first."; out.replaceChildren(p); return; }
    buttons.forEach((b) => { b.disabled = true; });
    const wait = el("p", "answer-wait working");
    wait.textContent = "Reading the " + kept.length + (kept.length === 1 ? " item" : " items") + " you kept.";
    out.replaceChildren(wait);
    const slow = setTimeout(() => { wait.textContent += " Still reading: longer conversations take a little more time."; }, 10000);
    signal(ctx, [...kept.map((k) => ({ key: k.key, signal: "kept", title: k.title, about })), ...left.map((k) => ({ key: k.key, signal: "unticked", title: k.title, about }))]);
    const res = await ctx.askBody({ question: ctx.q || about, over: { ask, items: kept.map((k) => ({ key: k.key, kind: k.kind, what: k.what, title: k.title, where: k.where, date: k.date, piece_ids: k.piece_ids })) } });
    clearTimeout(slow);
    buttons.forEach((b) => { b.disabled = false; });
    const sub = el("div", "find-answer");
    out.replaceChildren(sub);
    if (!res || res.ok !== true) { const p = el("p", "state stalled"); p.textContent = res?.error || "That could not be done just now. Press it again."; sub.appendChild(p); return; }
    ctx.renderAsk(sub, res, { q: ctx.q });
    if (ctx.keepTurn) await ctx.keepTurn(sub, label + " (" + kept.length + (kept.length === 1 ? " item)" : " items)"), res);
  };
  const mk = (label, ask) => { const b = el("button", "go"); b.type = "button"; b.textContent = label; b.addEventListener("click", () => run(ask, label)); buttons.push(b); return b; };
  acts.append(mk("Draft a reply from these", "draft"), mk("Summarize", "summarize"), mk("What is the issue here?", "issue"));
  wrap.appendChild(acts);
  const own = el("div", "find-own");
  const input = el("input"); input.type = "text"; input.placeholder = "Or ask something about these"; input.setAttribute("aria-label", "Ask something about the checked items");
  const go = el("button", "go ghost"); go.type = "button"; go.textContent = "Ask about these"; buttons.push(go);
  go.addEventListener("click", () => { const w = input.value.trim(); if (!w) { input.focus(); return; } run(w, w); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
  own.append(input, go);
  wrap.appendChild(own);
  wrap.appendChild(out);

  const foot = el("div", "find-foot");
  const watch = el("button", "go ghost find-watch"); watch.type = "button"; watch.textContent = "Tell me when new ones arrive";
  watch.addEventListener("click", async () => {
    watch.disabled = true;
    let r = null;
    try { const x = await ctx.rpc("find_watch_add", { p_spec: spec, p_seen: items.map((it) => it.key) }); r = x.error ? { ok: false, reason: x.error.message } : x.data; } catch (e) { r = { ok: false, reason: String(e?.message || e) }; }
    const p = el("p", "quiet");
    p.textContent = r?.ok ? 'Saved as a watch. When new email on this arrives from someone you have written to before, the conversation says so the next time you open the Tool. Ask "what are you watching" to see or remove it.'
      : "Not saved: " + String(r?.reason || "no reason was given") + ".";
    watch.replaceWith(p);
  });
  const learned = el("button", "go ghost find-learned-open"); learned.type = "button"; learned.textContent = "What it learned from you";
  learned.addEventListener("click", () => learnedList(ctx, foot, learned));
  foot.append(watch, learned);
  wrap.appendChild(foot);
  slot.appendChild(wrap);
}

function picker(ctx, li, it, chip, about) {
  const el = ctx.el;
  const open = li.querySelector(".find-labels");
  if (open) { open.remove(); return; }
  const box = el("div", "find-labels");
  const q = el("p", "quiet"); q.textContent = "What is this?"; box.appendChild(q);
  for (const l of LABELS) {
    const b = el("button", "find-label"); b.type = "button"; b.textContent = l;
    b.addEventListener("click", async () => {
      chip.textContent = l;
      box.remove();
      await signal(ctx, [{ key: it.key, signal: "label", value: l, title: it.title, about }]);
      lesson(ctx, li);
    });
    box.appendChild(b);
  }
  li.appendChild(box);
}

async function learnedList(ctx, foot, btn) {
  const el = ctx.el;
  const old = foot.querySelector(".find-learned");
  if (old) { old.remove(); return; }
  const box = el("div", "find-learned"); foot.appendChild(box);
  const wait = el("p", "quiet working"); wait.textContent = "Reading what it learned."; box.appendChild(wait);
  let rows = null, err = null;
  try { const r = await ctx.rpc("find_learned", {}); if (r.error) err = r.error.message; else rows = r.data; } catch (e) { err = String(e?.message || e); }
  box.innerHTML = "";
  if (err) { const p = el("p", "state stalled"); p.textContent = "What it learned could not be read just now: " + err; box.appendChild(p); return; }
  if (!rows || !rows.length) { const p = el("p", "quiet"); p.textContent = "Nothing yet. It learns from what you keep, uncheck, open and label in a search."; box.appendChild(p); return; }
  const ul = el("ul", "find-learned-list");
  for (const r of rows) {
    const li = el("li"); const t = el("span"); t.textContent = String(r.line || "");
    const rm = el("button", "go ghost"); rm.type = "button"; rm.textContent = "Forget this";
    rm.addEventListener("click", async () => {
      rm.disabled = true;
      let ok = false;
      try { const x = await ctx.rpc("find_learned_remove", { p_id: r.id }); ok = !x.error && x.data?.ok === true; } catch (_) { ok = false; }
      if (ok) li.remove(); else { rm.disabled = false; rm.textContent = "Not removed. Try again"; }
    });
    li.append(t, rm); ul.appendChild(li);
  }
  box.appendChild(ul);
}

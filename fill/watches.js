// fill/watches.js - THE TOOL TELLS HER FIRST (seat watches, 2026-10-23; decision 1011, master_spec 4.41 section 5.z item 5).
// Alex, 2026-10-22: Diconium flagged a misapplied payment and he had to go looking. With watches the Tool tells him
// first: one plain line where he already looks (the conversation, when he opens the Tool), the email one tap away,
// and nothing louder. Alex: nothing pushed to phone or email; findings appear in the Tool.
//
// The brain does the watching (migrations/hirekraft/2026-10-23-watches.sql in studio-walkers): every 10 minutes it
// reads only the email that arrived since its last look, with a word search per watch and no AI, and keeps a finding
// only when it is new and not already handled (a reply from her side closes it). This file only shows what
// watch_news() returns for the signed-in person, which has already passed the door: anything resting on email she
// cannot open is counted there, never sent here.
//
// On open: if something is new, the conversation says so once (then it is marked seen); if nothing is new, nothing
// is said. In the box: "tell me when anyone mentions a late payment" adds a watch in her words; "what are you
// watching" shows her watches, what each found and when, with Remove; "stop watching late payment" removes one.
// Done and Not useful close a finding; Not useful counts against that watch (its health line).
// No regex literals (STANDING-CLAUSES: the write tool).

import { fmtDate } from "./dates.js?v=2026-10-22-dates";

let C = null;
let saidOnOpen = false;
const GMAIL_OPEN = "https://mail.google.com/mail/u/";
const ADD_START = ["tell me when", "tell me if", "tell me whenever", "let me know when", "let me know if", "let me know whenever",
  "alert me when", "alert me if", "notify me when", "notify me if", "watch for ", "keep an eye on ", "keep an eye out for "];
const LIST_ASKS = ["what are you watching", "what are you watching for", "what are my watches", "show my watches", "my watches",
  "show watches", "watches", "what do you watch for", "what are you keeping an eye on"];
const STOP_START = ["stop watching", "stop telling me about", "stop telling me when", "remove the watch", "remove watch", "don't watch", "do not watch"];

export function initWatches(ctx) { C = ctx; }

function clean(t) {
  let s = String(t || "").toLowerCase().trim();
  while (s && ".?!".includes(s[s.length - 1])) s = s.slice(0, -1).trim();
  if (s.startsWith("please ")) s = s.slice(7).trim();
  return s;
}

// The box hands every typed line here first; true means it was a watch request and is handled.
export function watchFromBox(text) {
  if (!C) return false;
  const s = clean(text);
  if (!s) return false;
  if (LIST_ASKS.includes(s)) { showList(); return true; }
  const stop = STOP_START.find((p) => s.startsWith(p));
  if (stop) { stopWatching(s.slice(stop.length).trim()); return true; }
  if (ADD_START.some((p) => s.startsWith(p))) { addWatch(String(text).trim()); return true; }
  return false;
}

async function rpc(name, args) {
  try {
    const { data, error } = await C.sb.rpc(name, args || {});
    if (error) return { ok: false, reason: error.message };
    return data || { ok: false, reason: "No answer came back." };
  } catch (e) { return { ok: false, reason: String(e?.message || e) }; }
}

function turn(cls) {
  const log = C.$("#dock-turns");
  if (!log) return null;
  const t = C.el("div", "turn said watch-turn" + (cls ? " " + cls : ""));
  log.appendChild(t);
  C.openPanel();
  return t;
}
function say(t, text, cls) { const p = C.el("p", cls || ""); p.textContent = text; t.appendChild(p); return p; }
function show(t) { t.scrollIntoView({ block: "nearest" }); }

function openUrl(f) {
  const src = String(f.open_source || "");
  if (!src.startsWith("gmail:") || !f.open_id) return "";
  return GMAIL_OPEN + encodeURIComponent(src.slice(6)) + "/#all/" + encodeURIComponent(f.open_id);
}

// One finding: what it is about, who it is from and when, the words that raised it, the email one tap away.
function findingCard(f, onClosed) {
  const li = C.el("li", "find-item watch-item");
  const main = C.el("div", "find-main");
  const top = C.el("div", "find-top");
  const chip = C.el("span", "find-chip watch-chip"); chip.textContent = f.watch || "Watch";
  const url = openUrl(f);
  const title = url ? C.el("a", "find-title") : C.el("span", "find-title");
  title.textContent = f.title || "(no subject)";
  if (url) { title.href = url; title.target = "_blank"; title.rel = "noopener"; }
  top.append(chip, title);
  const meta = C.el("p", "find-meta");
  meta.textContent = [f.from, fmtDate(f.at, "day"), f.new ? "new" : ""].filter(Boolean).join(" · ");
  const snip = C.el("p", "find-snip"); snip.textContent = String(f.line || "");
  const acts = C.el("div", "watch-acts");
  const done = C.el("button", "go ghost"); done.type = "button"; done.textContent = "Done";
  const noise = C.el("button", "go ghost"); noise.type = "button"; noise.textContent = "Not useful";
  const answer = async (a, btn) => {
    done.disabled = true; noise.disabled = true;
    const r = await rpc("watch_hit_answer", { p_id: f.id, p_answer: a });
    const p = C.el("p", "quiet");
    p.textContent = r.ok ? (a === "noise" ? "Closed. Counted as not useful, so this watch's health line shows it." : "Closed as done.")
      : "Not saved: " + (r.reason || "the brain did not answer.");
    acts.replaceWith(p);
    if (r.ok) { li.classList.add("off"); if (onClosed) onClosed(); }
    else { done.disabled = false; noise.disabled = false; }
  };
  done.addEventListener("click", () => answer("done", done));
  noise.addEventListener("click", () => answer("noise", noise));
  acts.append(done, noise);
  main.append(top, meta, snip, acts);
  li.append(main);
  return li;
}

function findingList(t, list) {
  const ul = C.el("ul", "find-list watch-list");
  list.forEach((f) => ul.appendChild(findingCard(f)));
  t.appendChild(ul);
}

// ON OPEN: once per page, and only when something is new.
export async function showWatches() {
  if (!C || saidOnOpen) return;
  saidOnOpen = true;
  const r = await rpc("watch_news");
  if (!r.ok) { console.info("watches: not read", r.reason || ""); return; }
  const fresh = (r.findings || []).filter((f) => f.new);
  if (!fresh.length) return;
  const t = turn("watch-news");
  if (!t) return;
  say(t, fresh.length === 1 ? "One thing your watches found since you last looked." : fresh.length + " things your watches found since you last looked.");
  findingList(t, fresh);
  say(t, 'Ask "what are you watching" to see your watches, or "tell me when ..." to add one.', "quiet");
  show(t);
  await rpc("watch_seen", { p_ids: fresh.map((f) => f.id) });
}

function healthLine(w) {
  const bits = [];
  bits.push(w.found ? (w.found === 1 ? "found 1" : "found " + w.found) : "nothing found yet");
  if (w.noise) bits.push(w.noise + " marked not useful");
  if (w.last_at) bits.push("last " + fmtDate(w.last_at, "day"));
  return bits.join(" · ");
}

async function showList() {
  const t = turn("watch-all");
  if (!t) return;
  const head = say(t, "Looking at your watches...", "quiet");
  show(t);
  const r = await rpc("watch_news");
  if (!r.ok) { head.textContent = "I could not read your watches: " + (r.reason || "the brain did not answer."); return; }
  head.remove();
  const open = r.findings || [];
  say(t, open.length ? (open.length === 1 ? "One finding is open:" : open.length + " findings are open:") : "Nothing your watches found is waiting for you.");
  if (open.length) findingList(t, open);
  // Refused is never shown as empty: what rests on email she cannot open is counted (the brain decided it, not this page).
  const held = Number(r.withheld || 0);
  if (held) say(t, held === 1 ? "One more rests on email you cannot open, so it is not shown." : held + " more rest on email you cannot open, so they are not shown.", "quiet");
  const ws = r.watches || [];
  say(t, ws.length ? "What I watch for you, in new email from people you have written to before:" : "You have no watches yet.");
  const ul = C.el("ul", "find-learned-list watch-watches");
  ws.forEach((w) => {
    const li = C.el("li");
    const txt = C.el("div");
    const b = C.el("b"); b.textContent = w.title; txt.appendChild(b);
    const m = C.el("p", "find-meta"); m.textContent = healthLine(w); txt.appendChild(m);
    const rm = C.el("button", "go ghost"); rm.type = "button"; rm.textContent = "Remove";
    rm.addEventListener("click", async () => {
      rm.disabled = true;
      const x = await rpc("watch_remove", { p_id: w.id });
      if (x.ok) { li.classList.add("off"); rm.replaceWith(Object.assign(C.el("span", "quiet"), { textContent: "Removed" })); }
      else { rm.disabled = false; m.textContent = "Not removed: " + (x.reason || ""); }
    });
    li.append(txt, rm);
    ul.appendChild(li);
  });
  if (ws.length) t.appendChild(ul);
  // Add one in her own words, here as well as in the box.
  const form = C.el("form", "find-own watch-add");
  const inp = C.el("input"); inp.type = "text"; inp.placeholder = "Tell me when anyone mentions a late payment";
  inp.setAttribute("aria-label", "Add a watch in your own words");
  const go = C.el("button", "go"); go.type = "submit"; go.textContent = "Add";
  form.append(inp, go);
  form.addEventListener("submit", (e) => { e.preventDefault(); const v = inp.value.trim(); if (v) { inp.value = ""; addWatch(v); } });
  t.appendChild(form);
  if (r.last_look) say(t, "Last looked " + fmtDate(r.last_look, "whenShort") + ". The Tool looks every 10 minutes.", "quiet");
  show(t);
}

async function addWatch(words) {
  const t = turn("watch-added");
  if (!t) return;
  const p = say(t, "Saving the watch...", "quiet");
  show(t);
  const r = await rpc("watch_add", { p_words: words });
  if (!r.ok) { p.textContent = r.reason || "Not saved."; p.className = ""; return; }
  p.className = "";
  p.textContent = "Watching for: " + r.title + ". When new email from someone you have written to before mentions it, I will say so here, the next time you open the Tool. Nothing is sent to your phone or email.";
  say(t, 'Ask "what are you watching" to see or remove your watches.', "quiet");
}

async function stopWatching(what) {
  const r = await rpc("watch_news");
  if (!r.ok) { const t = turn(); if (t) say(t, "I could not read your watches: " + (r.reason || "")); return; }
  const w = String(what || "").toLowerCase().trim();
  const hits = w ? (r.watches || []).filter((x) => String(x.title || "").toLowerCase().includes(w)) : [];
  if (hits.length !== 1) { showList(); return; }
  const t = turn();
  if (!t) return;
  const x = await rpc("watch_remove", { p_id: hits[0].id });
  say(t, x.ok ? "Stopped watching: " + hits[0].title + "." : "Not removed: " + (x.reason || ""));
  show(t);
}

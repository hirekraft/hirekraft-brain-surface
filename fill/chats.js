// fill/chats.js: the Chats tab (seat chat-import, 2026-10-10; decision cb1a7115). Your chats by subject: seat chats-subjects, 2026-10-29,
// decision 1037 (see the block YOUR CHATS, BY SUBJECT below).
// Bring in chats from outside chatbots. PRIVATE BY DEFAULT; "Share with the company" is explicit and reversible.
// Three ways in, one tab: export-and-pick, paste, forward (email yourself "keep this"); plus the
// "Connect your own Claude" panel (#chats-connector) that seat chat-connector fills.
// THE EXPORT FILE NEVER LEAVES HER COMPUTER: it is opened here, in the browser. Only ticked chats are sent
// (to edge function chat-import, action keep). For the business/personal mark, only each title and a
// short opening are sent, and nothing of that is kept.
// All records go through chat-import -> chat_import_save; reading goes through chat_list / chat_open,
// which apply the one door. Nothing here decides who may see what.

import { fmtDate } from "./dates.js?v=2026-10-22-dates";
let ctx = null;            // { sb, el, $, zone, url, key }
let parsed = [];           // chats read from her export, in memory only
const NL = String.fromCharCode(10);
const CAME = { claude_export: "from a Claude export", chatgpt_export: "from a ChatGPT export", paste: "pasted",
  forward: "from email", connector: "from your Claude" };

export function initChats(c) { ctx = c; }

function el(tag, cls, text) { const e = ctx.el(tag, cls); if (text != null) e.textContent = text; return e; }
function day(iso) {
  if (!iso) return "";
  return fmtDate(iso, "day");
}
function said(host, text, flagged) {
  host.innerHTML = "";
  if (!text) return;
  host.appendChild(el("p", flagged ? "notice flagged" : "quiet", text));
}

async function call(body) {
  const { data } = await ctx.sb.auth.getSession();
  const jwt = data?.session?.access_token;
  if (!jwt) return { ok: false, reason: "unbound", note: "Sign in first." };
  const r = await fetch(ctx.url + "/functions/v1/chat-import", {
    method: "POST",
    headers: { Authorization: "Bearer " + jwt, apikey: ctx.key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await r.json().catch(() => ({ ok: false, reason: "error", note: "The Tool did not answer (HTTP " + r.status + ")." }));
}
async function rpc(fn, args) {
  const { data, error } = await ctx.sb.rpc(fn, args);
  if (error) return { ok: false, reason: "error", note: error.message || "Could not be read." };
  return data;
}

// ---- reading an export, in the browser -------------------------------------------------------
function claudeText(m) {
  if (typeof m.text === "string" && m.text.trim()) return m.text.trim();
  const parts = [];
  for (const b of Array.isArray(m.content) ? m.content : []) if (b && b.type === "text" && typeof b.text === "string") parts.push(b.text);
  return parts.join(NL).trim();
}
function fromClaude(arr) {
  const out = [];
  for (const c of arr) {
    const msgs = [];
    for (const m of Array.isArray(c.chat_messages) ? c.chat_messages : []) {
      const who = m.sender || m.role;
      if (who !== "human" && who !== "assistant") continue;
      const text = claudeText(m);
      if (text) msgs.push({ role: who === "human" ? "person" : "assistant", text, at: m.created_at || null });
    }
    if (msgs.length) out.push({ ref: c.uuid || null, title: (c.name || "").trim(), started_at: c.created_at || null, messages: msgs, came_from: "claude_export" });
  }
  return out;
}
// ChatGPT export: conversations.json, each with a mapping tree; walk from current_node back to the root.
// UNTESTED against a real ChatGPT file as of 2026-10-10 (format from its published layout).
function fromChatGPT(arr) {
  const out = [];
  for (const c of arr) {
    const map = c.mapping || {};
    const chain = [];
    let id = c.current_node;
    const seen = new Set();
    while (id && map[id] && !seen.has(id)) { seen.add(id); chain.push(map[id]); id = map[id].parent; }
    chain.reverse();
    const msgs = [];
    for (const n of chain) {
      const m = n.message;
      const role = m?.author?.role;
      if (role !== "user" && role !== "assistant") continue;
      const parts = Array.isArray(m?.content?.parts) ? m.content.parts.filter((p) => typeof p === "string") : [];
      const text = parts.join(NL).trim();
      if (text) msgs.push({ role: role === "user" ? "person" : "assistant", text, at: m.create_time ? new Date(m.create_time * 1000).toISOString() : null });
    }
    if (msgs.length) out.push({ ref: c.conversation_id || c.id || null, title: (c.title || "").trim(),
      started_at: c.create_time ? new Date(c.create_time * 1000).toISOString() : null, messages: msgs, came_from: "chatgpt_export" });
  }
  return out;
}
async function readExport(file) {
  let text;
  if (file.name.toLowerCase().endsWith(".zip")) {
    const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    // Claude's export now arrives split into several zips; the chats are in conversations-000.zip, and the
    // file inside may be numbered too. Any conversations*.json is accepted.
    const entry = zip.file("conversations.json") || zip.file(/(^|[/])conversations[^/]*[.]json$/)[0];
    if (!entry) throw new Error("No chats inside this file. From a Claude export, use the one named conversations-000.zip.");
    text = await entry.async("string");
  } else {
    text = await file.text();
  }
  const arr = JSON.parse(text);
  if (!Array.isArray(arr)) throw new Error("This is not a list of chats.");
  const sample = arr.find((c) => c && typeof c === "object");
  if (!sample) return [];
  if ("chat_messages" in sample) return fromClaude(arr);
  if ("mapping" in sample) return fromChatGPT(arr);
  throw new Error("This export's format is not one the Tool can read yet (Claude and ChatGPT are).");
}

// ---- the tab -------------------------------------------------------------------------------
export async function loadChats() {
  const host = ctx.$("#chats");
  if (!host) return;
  if (!host.dataset.built) build(host);
  await drawMine();
}

// THREE PARTS ON THE SHARED SUB-TAB ROW (seat tab-split, 2026-10-28, decision 1029): Your chats first (the most used: find
// and open one), then Bring in a chat (export, paste, email), then Connect your Claude. lens.js calls showSubtabs after this
// builds; the row itself is the <nav data-subtabs="chats"> in index.html. Until 2026-10-28 all of it was one page, the
// four ways in above a list of every chat (about 4,000 px on a computer and 7,000 on a phone for the owner).
function part(host, key, label, what, hidden) {
  const d = el("div"); d.dataset.sub = key; d.dataset.label = label; d.hidden = !!hidden;
  if (what) d.appendChild(el("p", "sub-what", what));
  host.appendChild(d); return d;
}

function build(root) {
  root.dataset.built = "1";
  root.innerHTML = "";
  const mine = part(root, "mine", "Your chats", null);
  const host = part(root, "bring", "Bring in a chat", null, true);
  host.appendChild(el("p", "sub-what", "Bring in the thinking you did in your own Claude or ChatGPT. Chats you bring in are private to you until you share them with the company."));

  // export and pick
  const ex = el("details", "chats-way"); ex.open = true;
  ex.appendChild(el("summary", null, "Bring in from an export"));
  ex.appendChild(el("p", "quiet", "In Claude: Settings, Privacy, Export data. In ChatGPT: Settings, Data controls, Export. Then drop the file here."));
  const drop = el("label", "notice");
  drop.style.display = "block"; drop.style.cursor = "pointer"; drop.style.textAlign = "center"; drop.style.padding = "24px";
  drop.textContent = "Drop the export file here, or click to choose it";
  const input = el("input"); input.type = "file"; input.accept = ".zip,.json"; input.hidden = true;
  drop.appendChild(input);
  ex.appendChild(drop);
  ex.appendChild(el("p", "quiet", "Only the chats you check are kept. Chats already in the Tool are marked and skipped. The rest never leave your computer. To mark them business or personal, the Tool reads each title and its first lines; nothing of that is kept."));
  const pickSaid = el("div"); pickSaid.id = "chats-pick-said";
  const pick = el("div"); pick.id = "chats-pick";
  ex.appendChild(pickSaid); ex.appendChild(pick);
  const onFile = (f) => { if (f) openExport(f, pick, pickSaid); };
  input.addEventListener("change", () => onFile(input.files?.[0]));
  drop.addEventListener("dragover", (e) => { e.preventDefault(); });
  drop.addEventListener("drop", (e) => { e.preventDefault(); onFile(e.dataTransfer?.files?.[0]); });
  host.appendChild(ex);

  // paste
  const pa = el("details", "chats-way");
  pa.appendChild(el("summary", null, "Paste one chat"));
  const title = el("input", "work-search"); title.placeholder = "Title (leave empty and the Tool proposes one)";
  title.style.width = "100%";
  const box = el("textarea"); box.rows = 8; box.style.width = "100%"; box.placeholder = "Paste the chat here";
  const keepBtn = el("button", "go", "Keep this chat"); keepBtn.type = "button";
  const pasteSaid = el("div");
  keepBtn.addEventListener("click", async () => {
    const text = box.value.trim();
    if (!text) { said(pasteSaid, "There is nothing to keep yet.", true); return; }
    keepBtn.disabled = true; said(pasteSaid, "Keeping it.");
    const r = await call({ action: "keep", came_from: "paste", title: title.value.trim(), exact: true,
      messages: [{ role: "person", text }] });
    keepBtn.disabled = false;
    if (r.ok) { said(pasteSaid, `Kept as "${r.title}". Private to you.`); box.value = ""; title.value = ""; drawMine(); }
    else said(pasteSaid, r.note || "It was not kept.", true);
  });
  pa.append(title, box, keepBtn, pasteSaid);
  host.appendChild(pa);

  // forward
  const fw = el("details", "chats-way");
  fw.appendChild(el("summary", null, "Send one by email"));
  fw.appendChild(el("p", null, "From your company address, email yourself with a subject that starts with “keep this” and the chat in the body. It appears here within a few minutes, private to you. A chat sent as an attachment is not read."));
  host.appendChild(fw);

  // connect your own Claude (seat chat-connector fills this); its own part since seat tab-split, open, not folded
  const cn = part(root, "connect", "Connect your Claude", null, true);
  const cnHost = el("div"); cnHost.id = "chats-connector";
  drawConnector(cnHost);
  cn.appendChild(cnHost);

  // your chats, by subject (first part)
  buildMine(mine);
}

// ---- connect your own Claude (seat chat-connector, 2026-10-10) ------------------------------------
// The address she pastes into her own Claude, three steps, and her own status. Status comes from
// connector_status(), which answers only about the caller: chatbots she approved (the sign-in system's own
// record) and her last save from one. Whether chatbot sign-in is switched on at all is read from the sign-in
// system's public discovery document, so the panel never claims a step that cannot work yet.
const CONNECTOR_URL = "https://uvdoompnnypmneyrvtas.supabase.co/functions/v1/connector-mcp";
async function drawConnector(host) {
  host.innerHTML = "";
  host.appendChild(el("p", null, "Add HireKraft to your own Claude and it works from your business: it finds your emails, files, records, contacts and meetings and thinks over them itself, so HireKraft pays only for finding. It sees only what you can see here."));
  // seat two-doors (2026-10-26, decision 1021): what the connector does now, in her words. Nothing here sends, books or deletes.
  const can = el(`ul`);
  for (const s of [`“Using HireKraft, find everything about Acme payments since June and tell me if anything looks wrong.”`,
    `“Who is Dana at Acme?” or “What meetings do I have next week?”`,
    `“How do Thinkrooms work in HireKraft?” It answers from HireKraft's own guide and your setup.`,
    `“Save this to HireKraft”, “save this document to HireKraft”, or “add a thought in HireKraft: ...”. A chat or document lands here, private to you; a thought lands in a Thinkroom, seen only by the people in it.`,
    `“Ask HireKraft for its own answer” when you want HireKraft's AI to do the thinking; that one is paid by the business.`]) can.appendChild(el(`li`, null, s));
  host.appendChild(can);
  const addr = el("div"); addr.style.display = "flex"; addr.style.gap = "8px"; addr.style.alignItems = "center";
  const code = el("code", null, CONNECTOR_URL); code.style.wordBreak = "break-all";
  const copy = el("button", "go ghost", "Copy"); copy.type = "button";
  copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(CONNECTOR_URL); copy.textContent = "Copied"; } catch (e) { copy.textContent = "Select and copy it"; } });
  addr.append(code, copy); host.appendChild(addr);
  const ol = el("ol");
  for (const s of ["In your Claude: Settings, Connectors, Add custom connector. Paste the address above.",
    "Claude opens a HireKraft page. Sign in with your usual emailed code and press Allow.",
    "In any chat, ask about your business or say “save this to HireKraft”. Saved chats and documents appear below, marked “from your Claude”."]) ol.appendChild(el("li", null, s));
  host.appendChild(ol);
  host.appendChild(el("p", "quiet", "On a Claude Team or Enterprise seat, only the workspace owner can add it; you then press Connect. Saves from a chatbot are marked condensed, because the chatbot chooses what to pass. What HireKraft hands your Claude is then kept under your own Claude account. Items found by meaning only, not yet read for sensitivity, go only to the owner and to whoever owns their source. ChatGPT can ask on a Pro plan; saving from ChatGPT needs a Business or Enterprise workspace with developer mode on."));
  const st = el("p", "quiet", "Checking your connection."); host.appendChild(st);
  let on = null;
  // The sign-in system's OpenID document lists a registration endpoint only once chatbot sign-in is on.
  // Read this one, not the oauth-authorization-server path: on 2026-10-10 the latter failed to fetch from
  // outside after switch-on while this one answered (seat chat-connector). A failed fetch is unknown, never off.
  try {
    const d = await fetch("https://uvdoompnnypmneyrvtas.supabase.co/auth/v1/.well-known/openid-configuration");
    if (d.ok) { const j = await d.json(); on = !!(j && j.registration_endpoint); } else if (d.status === 404) on = false;
  } catch (e) { on = null; }
  if (on === false) { said(st, "Not switched on yet: the sign-in step for chatbots is waiting to be turned on. Adding the address now will not connect.", true); return; }
  const r = await rpc("connector_status", {});
  if (!r?.ok) { said(st, "Your connection could not be shown: " + (r?.note || "no reason was given") + ".", true); return; }
  const parts = [];
  if (!r.connections.length) parts.push(on === null ? "No chatbot connected (whether chatbot sign-in is on could not be checked)." : "No chatbot connected yet.");
  else parts.push(r.connections.map((c) => `${c.client} connected since ${day(c.since)}`).join("; ") + ".");
  parts.push(r.last_save ? `Last saved from a chatbot ${day(r.last_save)} (${r.saves} so far).` : "Nothing saved from a chatbot yet.");
  said(st, parts.join(" "));
}

async function openExport(file, pick, pickSaid) {
  pick.innerHTML = "";
  said(pickSaid, "Opening the file on your computer.");
  try { parsed = await readExport(file); }
  catch (e) { parsed = []; said(pickSaid, e?.message || "The file could not be read.", true); return; }
  if (!parsed.length) { said(pickSaid, "No chats with messages were found in this file.", true); return; }
  parsed.sort((a, b) => String(b.started_at || "").localeCompare(String(a.started_at || "")));
  said(pickSaid, `${parsed.length} chats found. Marking them business or personal.`);
  const ul = el("ul", "attn");
  const boxes = [];
  parsed.forEach((c, i) => {
    const li = el("li");
    const lab = el("label"); lab.style.display = "flex"; lab.style.gap = "8px"; lab.style.alignItems = "flex-start";
    const cb = el("input"); cb.type = "checkbox"; cb.dataset.i = String(i);
    const txt = el("div");
    txt.appendChild(el("div", "a-title", c.title || "Untitled chat"));
    txt.appendChild(el("div", "a-detail", [day(c.started_at), `${c.messages.length} messages`].filter(Boolean).join(" · ")));
    const mk = el("div", "a-detail", "Marking..."); mk.dataset.mark = String(i);
    txt.appendChild(mk);
    lab.append(cb, txt); li.appendChild(lab); ul.appendChild(li); boxes.push(cb);
  });
  const go = el("button", "go", "Keep the checked chats"); go.type = "button";
  const count = () => { const n = boxes.filter((b) => b.checked).length; go.textContent = n ? `Keep ${n} checked chat${n === 1 ? "" : "s"}` : "Keep the checked chats"; go.disabled = !n; };
  boxes.forEach((b) => b.addEventListener("change", count)); count();
  // CHECK ALL (Alex 2026-10-11: a long export should not need one click per chat). Only chats not yet in the
  // Tool can be checked: the Tool says which it already has (chat-import action known), so a second drop of
  // the same export is Check all, Keep, and only the new ones are sent.
  const marks = new Map();
  const open = () => boxes.filter((b) => !b.disabled);
  const bar = el("div"); bar.style.display = "flex"; bar.style.gap = "8px"; bar.style.flexWrap = "wrap"; bar.style.margin = "8px 0";
  const allB = el("button", "go ghost", "Check all"); allB.type = "button";
  const bizB = el("button", "go ghost", "Check business only"); bizB.type = "button";
  const noneB = el("button", "go ghost", "Uncheck all"); noneB.type = "button";
  allB.addEventListener("click", () => { open().forEach((b) => { b.checked = true; }); count(); });
  noneB.addEventListener("click", () => { boxes.forEach((b) => { b.checked = false; }); count(); });
  bizB.addEventListener("click", () => { open().forEach((b) => { b.checked = marks.get(Number(b.dataset.i)) === "business"; }); count(); });
  bar.append(allB, bizB, noneB);
  pick.append(bar, ul, go);
  go.addEventListener("click", () => keepTicked(boxes, go, pickSaid));

  const cf = parsed[0]?.came_from;
  const kn = await call({ action: "known", came_from: cf, refs: parsed.map((c) => c.ref).filter(Boolean) });
  const have = new Set(kn?.ok ? kn.kept : []);
  let already = 0;
  // ONLY WHAT IS MISSING IS LISTED (Alex 2026-10-11 19:49: "couldn't it just show only what is missing").
  const keptRows = [];
  boxes.forEach((b) => {
    const c = parsed[Number(b.dataset.i)];
    if (c.ref && have.has(c.ref)) {
      already++; b.checked = false; b.disabled = true;
      const node = pick.querySelector(`[data-mark="${b.dataset.i}"]`);
      if (node) { node.dataset.kept = "1"; node.textContent = "Already in the Tool."; }
      const li = b.closest("li"); if (li) { li.hidden = true; keptRows.push(li); }
    }
  });
  if (already) {
    const line = el("p", "quiet");
    line.appendChild(document.createTextNode(`${already} chat${already === 1 ? " is" : "s are"} already in the Tool and not listed. `));
    const sh = el("button", "go ghost", "Show them"); sh.type = "button";
    sh.addEventListener("click", () => { const show = sh.textContent === "Show them"; keptRows.forEach((li) => { li.hidden = !show; }); sh.textContent = show ? "Hide them" : "Show them"; });
    line.appendChild(sh);
    ul.before(line);
  }
  count();

  const items = parsed.slice(0, 600).map((c, i) => ({ i, title: c.title, opening: (c.messages.find((m) => m.role === "person")?.text || "").slice(0, 300) }));
  const r = await call({ action: "mark", items });
  const byI = new Map((r.ok ? r.marks : []).map((m) => [m.i, m]));
  pick.querySelectorAll("[data-mark]").forEach((node) => {
    const m = byI.get(Number(node.dataset.mark));
    if (node.dataset.kept) return;
    if (m && m.mark) marks.set(Number(node.dataset.mark), m.mark);
    node.textContent = !m ? "Not marked; decide yourself." : m.mark ? `Looks ${m.mark === "business" ? "like business" : "personal"}: ${m.why}` : m.why;
  });
  const fresh = parsed.length - already;
  said(pickSaid, `${parsed.length} chats found${already ? `: ${already} already in the Tool, ${fresh} new` : ""}. ${fresh ? "Check the ones to keep." : "Nothing new to keep."}${r.ok ? "" : " (They could not be marked: " + (r.note || "no reason given") + ")"}${kn?.ok ? "" : " (Could not check which are already in the Tool; any you keep twice are skipped.)"}`);
}

async function keepTicked(boxes, go, pickSaid) {
  const picks = boxes.filter((b) => b.checked).map((b) => parsed[Number(b.dataset.i)]);
  go.disabled = true;
  // The working sign beside the button she pressed, with the count and a thin bar (seat conversation-panel).
  const w = el("p", "working"); const wt = el("span"); const bar = el("span", "working-bar"); const fill = el("span");
  bar.appendChild(fill); w.append(wt, bar); go.after(w);
  let kept = 0, dup = 0; const failed = [];
  for (let k = 0; k < picks.length; k++) {
    const c = picks[k];
    said(pickSaid, `Keeping ${k + 1} of ${picks.length}.`);
    go.textContent = `Keeping ${k + 1} of ${picks.length}...`;
    wt.textContent = `Keeping ${k + 1} of ${picks.length}`; fill.style.width = `${Math.round((k / picks.length) * 100)}%`;
    const r = await call({ action: "keep", came_from: c.came_from, title: c.title, started_at: c.started_at, exact: true, origin_ref: c.ref, messages: c.messages });
    if (r.ok && r.duplicate) dup++; else if (r.ok) kept++; else failed.push(`${c.title || "Untitled chat"}: ${r.note || r.reason}`);
  }
  const parts = [`Kept ${kept} chat${kept === 1 ? "" : "s"}, private to you.`];
  if (dup) parts.push(`${dup} ${dup === 1 ? "was" : "were"} already kept.`);
  if (failed.length) parts.push(`${failed.length} not kept: ${failed.join("; ")}`);
  w.remove();
  said(pickSaid, parts.join(" "), failed.length > 0);
  boxes.forEach((b) => { b.checked = false; });
  go.disabled = true; go.textContent = parts[0];
  drawMine();
}

// ---- YOUR CHATS, BY SUBJECT (seat chats-subjects, 2026-10-29, decision 1037; blueprint: the Chats by subject mockup) ----------
// The tab is sorted by what each chat is about, not by date. The brain decides everything shown here (chat_list, chat_open,
// chat_move): which chats she may open, the business's subjects that hold one of them and her count in each, the Tool's line and
// what came out of each chat, in her language when the Tool has written it. This page only lays it out.
// The Tool sorts on its own (chat-import action sort) whenever the brain says chats are owed, and writes its words in her
// language (action say) when they are missing; both with the working sign and a count. Move to is hers and wins.
// Every sentence here is one whole piece, so the language switch can put it in her language; titles, names, dates and the
// chat itself are hers and carry translate="no". Until 2026-10-29 this part was one list of every chat, newest first.
let cs = null;              // { root, list, said, view, subjects, items, sel, open, q, r }
const SAYS_RUNNING = { sort: false, say: false };

function txt(tag, cls, text, keep) { const e = el(tag, cls, text); if (keep) e.setAttribute("translate", "no"); return e; }
function btn(cls, text) { const b = el("button", cls, text); b.type = "button"; return b; }

function buildMine(host) {
  const root = el("div", "cs"); root.dataset.view = "list";
  const top = el("div", "cs-top");
  const words = el("div", "cs-top-words");
  words.append(el("h3", "cs-h", "Your work with Claude, kept whole"),
    el("p", "quiet", "Every chat you or your team saved, sorted by what it is about. In Claude, just say “save this to HireKraft”. The whole chat and every file it made come here, word for word."));
  const howB = btn("go ghost cs-how-b", "How it works");
  top.append(words, howB);
  const how = el("div", "cs-how"); how.hidden = true;
  for (const [h, p] of [["Save it", "Say “save this”, “keep this” or “put this in HireKraft”. Any of these works, in any language."],
    ["Save it again later", "Kept working in the same chat? Save again. It updates the same entry here and keeps the earlier version."],
    ["Pick it back up", "Open any chat here and press Continue in Claude. Claude starts where you left off, with everything that came out of it."]]) {
    const c = el("div", "cs-how-card"); c.append(el("b", null, h), el("p", "quiet", p)); how.appendChild(c);
  }
  howB.addEventListener("click", () => { how.hidden = !how.hidden; howB.textContent = how.hidden ? "How it works" : "Hide how it works"; });
  const said = el("div", "cs-said"); said.setAttribute("aria-live", "polite");
  const search = el("input", "work-search cs-search"); search.type = "search"; search.placeholder = "Search your chats";
  search.setAttribute("aria-label", "Search your chats");
  let t = null;
  search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { cs.q = search.value.trim(); drawMine(); }, 250); });
  const grid = el("div", "cs-grid");
  const subjects = el("nav", "cs-subjects"); subjects.setAttribute("aria-label", "Subjects");
  const list = el("section", "cs-list"); list.setAttribute("aria-label", "Chats in this subject");
  const view = el("article", "cs-open"); view.setAttribute("aria-label", "Open chat");
  grid.append(subjects, list, view);
  const foot = el("div", "cs-foot");
  root.append(top, how, said, search, grid, foot);
  host.appendChild(root);
  cs = { root, subjects, list, view, said, foot, items: [], subs: [], sel: null, open: null, q: "", r: null };
}

// One list of everything she may open here: her chats and loose documents, chats shared with her, her questions from the box.
function itemsOf(r) {
  const out = [];
  for (const c of r.mine || []) if (c.kind !== "document" || !c.made_in) out.push({ t: "chat_import", ...c, mine: true });
  for (const c of r.shared_with_me || []) out.push({ t: "chat_import", ...c, mine: false });
  for (const w of r.tool_chats || []) out.push({ t: "work_chat", id: w.id, title: w.title, kind: "tool", started_at: w.created_at, turns: w.turns, subject_id: w.subject_id, line: w.line, about: w.about, mine: true });
  return out;
}
const NOT_SORTED = "unsorted";
// The kinds of thing a chat can make, as the Tool names them (chat_outs_clean); listed here so each is one of the screen's words.
const KIND_WORDS = ["Doc", "Sheet", "Chart", "Plan", "Posts", "Image", "Prompt", "Note", "Code", "Email"];
void KIND_WORDS;

async function drawMine() {
  if (!cs) return;
  const r = await rpc("chat_list", { p_q: cs.q || null });
  cs.r = r;
  cs.subjects.innerHTML = ""; cs.list.innerHTML = ""; cs.foot.innerHTML = "";
  if (!r?.ok) { cs.list.appendChild(el("p", "notice flagged", r?.note || "Your chats could not be read.")); return; }
  cs.items = itemsOf(r);
  cs.subs = (r.subjects || []).slice();
  if (cs.items.some((x) => !x.subject_id)) cs.subs.push({ id: NOT_SORTED, name: null, line: null, place: "unsorted", chats: cs.items.filter((x) => !x.subject_id).length });
  if (cs.q) drawFound(); else drawSubjects();
  drawFoot(r);
  if (!cs.q) owed(r);
}

function drawSubjects() {
  const ids = cs.subs.map((s) => s.id);
  if (!cs.sel || !ids.includes(cs.sel)) cs.sel = (cs.subs.find((s) => Number(s.chats) > 0) || cs.subs[0] || {}).id || null;
  cs.subjects.appendChild(el("div", "eyebrow", "Subjects"));
  const row = el("div", "cs-subject-row");
  for (const s of cs.subs) {
    const b = btn("cs-subject" + (s.id === cs.sel ? " on" : ""), null);
    b.setAttribute("aria-pressed", s.id === cs.sel ? "true" : "false");
    b.dataset.place = s.place || "normal";
    const name = s.id === NOT_SORTED ? el("span", "cs-subject-name", "Not sorted yet") : txt("span", "cs-subject-name", s.name, true);
    b.append(el("span", "cs-dot"), name, txt("span", "cs-count", String(s.chats ?? 0), true));
    b.addEventListener("click", () => { cs.sel = s.id; cs.root.dataset.view = "list"; drawMine(); });
    row.appendChild(b);
  }
  cs.subjects.appendChild(row);
  cs.subjects.appendChild(el("p", "quiet cs-subject-note", "The Tool sorts new chats into a subject for you. Move one with Move to if it landed in the wrong place."));
  const s = cs.subs.find((x) => x.id === cs.sel);
  const head = el("div", "cs-list-head");
  if (s) {
    head.appendChild(s.id === NOT_SORTED ? el("h3", "cs-h", "Not sorted yet") : txt("h3", "cs-h", s.name, true));
    if (s.id === NOT_SORTED) head.appendChild(el("p", "quiet", "The Tool has not put these in a subject yet."));
    else if (s.line) head.appendChild(txt("p", "quiet", s.line, true));
  } else head.appendChild(el("p", "quiet", "You have not saved any chats yet. In Claude, say “save this to HireKraft”."));
  cs.list.appendChild(head);
  const mine = cs.items.filter((x) => (x.subject_id || NOT_SORTED) === cs.sel);
  const ul = el("ul", "cs-chats");
  for (const c of mine) ul.appendChild(chatRow(c));
  cs.list.appendChild(ul);
  if (!mine.length && s) cs.list.appendChild(el("p", "quiet", s.place === "start" ? "Nothing pinned here yet. Open a chat and use Move to, then Start here." : "No chats here."));
  if (!cs.open || !cs.items.some((x) => x.id === cs.open)) drawOpenEmpty();
}

function drawFound() {
  const head = el("div", "cs-list-head");
  head.appendChild(el("h3", "cs-h", "Chats that mention your words"));
  cs.list.appendChild(head);
  cs.subjects.appendChild(el("p", "quiet", "Searching every subject."));
  const ul = el("ul", "cs-chats");
  for (const c of cs.items) ul.appendChild(chatRow(c));
  cs.list.appendChild(ul);
  if (!cs.items.length) cs.list.appendChild(el("p", "quiet", "None of your chats mention these words."));
}

function keptChip(c) {
  if (c.kind === "tool") return el("span", "cs-chip tool", "Asked in the Tool");
  if (c.kind === "document") return el("span", "cs-chip whole", "A document");
  return c.exact ? el("span", "cs-chip whole", "Whole chat") : el("span", "cs-chip summary", "Only a summary");
}
function metaOf(c) {
  const m = el("span", "cs-meta");
  const who = c.mine ? el("span", null, c.kind === "tool" ? "You, in the Tool" : "You") : txt("span", null, c.brought_by || "", true);
  m.append(who, document.createTextNode(" · "), txt("span", null, day(c.started_at || c.brought_in_at), true));
  const n = c.kind === "tool" ? Number(c.turns || 0) : Number(c.messages || 0);
  if (n) m.append(document.createTextNode(" · "), el("span", null, c.kind === "tool" ? `${n} questions asked` : `${n} messages saved`));
  return m;
}
function chatRow(c) {
  const li = el("li");
  const b = btn("cs-chat" + (c.id === cs.open ? " on" : ""), null);
  b.append(txt("span", "cs-chat-title", c.title, true), metaOf(c));
  if (c.line) b.appendChild(txt("span", "cs-chat-line", c.line, true));
  b.appendChild(keptChip(c));
  b.addEventListener("click", () => openItem(c));
  li.appendChild(b); return li;
}

function drawFoot(r) {
  if (Array.isArray(r.private_counts) && r.private_counts.length) {
    const p = el("p", "quiet");
    p.appendChild(el("span", null, "Private chats other people saved (you cannot open these until they share them): "));
    p.appendChild(txt("span", null, r.private_counts.map((x) => `${x.person} ${x.chats}`).join(", ") + ".", true));
    cs.foot.appendChild(p);
  }
  // MADE FROM LOCKED STAYS LOCKED (seat locks-and-basics, decision 1022): counted, never silently missing.
  const locked = Number(r.shared_locked || 0);
  if (locked) cs.foot.appendChild(el("p", "quiet", locked === 1 ? "1 shared chat is not shown to you: it was made from emails or files you cannot open yourself."
    : `${locked} shared chats are not shown to you: they were made from emails or files you cannot open yourself.`));
}

// THE TOOL SORTS AND SPEAKS HER LANGUAGE ON ITS OWN, with the working sign and a count, next to where she is looking.
async function owed(r) {
  const n = Number(r.owed || 0), w = Number(r.said_owed || 0);
  if (n > 0 && !SAYS_RUNNING.sort) await work("sort", { action: "sort" }, n);
  else if (w > 0 && r.lang && r.lang !== "en" && !SAYS_RUNNING.say) await work("say", { action: "say", lang: r.lang }, w);
}
async function work(kind, body, n) {
  SAYS_RUNNING[kind] = true;
  const box = el("p", "working"); const t = el("span"); const bar = el("span", "working-bar"); const fill = el("span");
  bar.appendChild(fill); box.append(t, bar);
  cs.said.innerHTML = ""; cs.said.appendChild(box);
  let left = n, done = 0, rounds = 0, stop = "";
  while (left > 0 && rounds < 12) {
    rounds++;
    t.textContent = kind === "sort" ? `Sorting your chats into subjects: ${left} to go` : `Putting the subjects in your language: ${left} to go`;
    fill.style.width = `${Math.round((done / (done + left)) * 100)}%`;
    const a = await call(body);
    if (!a?.ok) { stop = a?.reason === "bad_action" ? "off" : "failed"; break; }
    const got = kind === "sort" ? Number(a.sorted || 0) : Number(a.kept || 0) + Number(a.subjects || 0);
    done += got; left = kind === "sort" ? Number(a.owed_left || 0) : Math.max(0, left - got);
    if (!got) { stop = kind === "sort" && Number(a.failed || 0) ? "some" : ""; break; }
  }
  SAYS_RUNNING[kind] = false;
  cs.said.innerHTML = "";
  if (stop === "off") cs.said.appendChild(el("p", "quiet", kind === "sort" ? "Sorting into subjects is not switched on yet. Your chats are all here, under Not sorted yet." : "The subjects are not in your language yet; they show as the Tool wrote them."));
  else if (stop === "failed") cs.said.appendChild(el("p", "notice flagged", kind === "sort" ? "The Tool could not sort your chats just now. Nothing was changed; it tries again the next time you open Chats." : "The subjects could not be put in your language just now. Nothing was changed."));
  else if (stop === "some") cs.said.appendChild(el("p", "quiet", "A few chats could not be sorted this time. They stay under Not sorted yet, and the Tool tries again later."));
  if (done) await drawMine();
}

// ---- the open chat --------------------------------------------------------------------------------------------------------
function drawOpenEmpty() {
  cs.view.innerHTML = "";
  cs.view.appendChild(el("p", "quiet cs-open-empty", "Open a chat to see what came out of it, read it whole, or pick it back up in Claude."));
}

async function openItem(c) {
  cs.open = c.id;
  cs.list.querySelectorAll(".cs-chat").forEach((b) => b.classList.remove("on"));
  cs.root.dataset.view = "open";
  const v = cs.view; v.innerHTML = "";
  const wait = el("p", "working no-late"); wait.appendChild(el("span", null, "Opening the chat.")); v.appendChild(wait);
  if (c.t === "work_chat") return openToolChat(c, v);
  const r = await rpc("chat_open", { p_chat: c.id });
  v.innerHTML = "";
  back(v);
  if (!r?.ok) { v.appendChild(el("p", "notice flagged", r?.note || "This chat could not be opened.")); return; }
  v.appendChild(txt("h3", "cs-open-title", r.title, true));
  const meta = el("p", "quiet cs-meta");
  meta.append(r.mine ? el("span", null, "Saved by you") : txt("span", null, r.brought_by || "", true), document.createTextNode(" · "),
    txt("span", null, day(r.started_at || r.brought_in_at), true), document.createTextNode(" · "),
    r.kind === "document" ? el("span", null, "A document") : r.exact ? el("span", null, `${(r.messages || []).length} messages, whole`) : el("span", null, "Only a summary"),
    document.createTextNode(" · "), el("span", null, r.mine ? (r.shared_at ? "Shared with the company" : "Private to you") : "Shared with you"));
  v.appendChild(meta);
  if (r.title_written && r.original_title) {
    const p = el("p", "quiet cs-renamed");
    p.append(el("span", null, "Renamed by the Tool. It was saved as"), document.createTextNode(" “"), txt("span", null, r.original_title, true), document.createTextNode("”."));
    v.appendChild(p);
  }
  if (!r.exact && r.kind !== "document") {
    const w = el("div", "cs-warn");
    w.append(el("b", null, "Only a summary was saved"),
      el("p", null, "Claude sent a short version, not the whole chat. To keep everything, open that chat in Claude and say:"),
      el("p", "cs-say", "Save the whole chat to HireKraft."),
      el("p", null, "It will replace this entry and keep this one as an earlier version."));
    v.appendChild(w);
  }
  if (Number(r.joined || 0) > 0) v.appendChild(el("p", "cs-joined", "Copies of this chat were joined into this one. Every version is kept."));
  if (r.made_in && r.made_in.title) {
    const p = el("p", "quiet");
    p.append(el("span", null, "Made in the chat"), document.createTextNode(" “"), txt("span", null, r.made_in.title, true), document.createTextNode("”."));
    v.appendChild(p);
  }
  // WHAT CAME OUT OF IT: the documents saved with it, then what the chat itself shows was made. Nothing invented.
  const outs = el("section", "cs-outs");
  outs.appendChild(el("div", "eyebrow", "What came out of it"));
  const docs = Array.isArray(r.came_out_of_it) ? r.came_out_of_it : [];
  const named = Array.isArray(r.named_outs) ? r.named_outs : [];
  for (const d of docs) {
    const card = btn("cs-out", null);
    card.append(el("span", "cs-kind", "Doc"), outWords(d.title, "Saved with the chat"));
    card.addEventListener("click", () => openItem({ t: "chat_import", id: d.id }));
    outs.appendChild(card);
  }
  const savedNames = new Set(docs.map((d) => String(d.title || "").toLowerCase()));
  for (const o of named) {
    if (savedNames.has(String(o.name || "").toLowerCase())) continue;
    const card = el("div", "cs-out");
    card.append(el("span", "cs-kind", o.kind || "Note"), outWords(o.name, o.line, true));
    outs.appendChild(card);
  }
  if (!docs.length && !named.length) outs.appendChild(el("p", "quiet", "Nothing saved from this chat yet."));
  else if (named.length) outs.appendChild(el("p", "quiet cs-outs-note", "Named in the chat. Only what is saved with it opens here."));
  v.appendChild(outs);
  actions(v, r, c);
}
function outWords(name, line, lineIsTools) {
  const w = el("span", "cs-out-words");
  w.appendChild(txt("span", "cs-out-name", name || "", true));
  if (line) w.appendChild(lineIsTools ? txt("span", "cs-out-line", line, true) : el("span", "cs-out-line", line));
  return w;
}
function back(v) {
  const b = btn("go ghost cs-back", "Back to the list");
  b.addEventListener("click", () => { cs.root.dataset.view = "list"; cs.open = null; cs.root.scrollIntoView({ block: "start" }); });
  v.appendChild(b);
}

function actions(v, r, c) {
  const row = el("div", "cs-actions");
  const cont = btn("go", "Continue in Claude");
  const whole = btn("go ghost", "Read the whole chat");
  const move = btn("go ghost", "Move to");
  row.append(cont, whole, move);
  let share = null, rm = null;
  if (r.mine) {
    share = btn("go ghost", r.shared_at ? "Stop sharing" : "Share with the company");
    rm = btn("go ghost cs-remove", "Remove");
    row.append(share, rm);
  }
  v.appendChild(row);
  const slot = el("div", "cs-slot"); v.appendChild(slot);
  const msg = el("div"); v.appendChild(msg);
  // CONTINUE IN CLAUDE: one line to paste in a new Claude chat; her own Claude finds the chat in HireKraft by its title.
  cont.addEventListener("click", async () => {
    slot.innerHTML = "";
    const box = el("div", "cs-cont");
    const line = el("p", "cs-say");
    line.append(el("span", null, "Pick up my HireKraft chat"), document.createTextNode(" “"), txt("span", null, r.title, true), document.createTextNode("” "), el("span", null, "where we left off."));
    box.append(el("b", null, "Paste this into a new Claude chat:"), line);
    slot.appendChild(box);
    let ok = false;
    try { await navigator.clipboard.writeText(line.textContent); ok = true; } catch (_) { ok = false; }
    box.querySelector("b").textContent = ok ? "Copied. Paste this into a new Claude chat:" : "Select and copy this, then paste it into a new Claude chat:";
  });
  whole.addEventListener("click", () => {
    if (slot.querySelector(".cs-whole")) { slot.innerHTML = ""; whole.textContent = "Read the whole chat"; return; }
    slot.innerHTML = ""; whole.textContent = "Hide the conversation";
    slot.appendChild(wholeChat(r));
  });
  move.addEventListener("click", () => {
    if (slot.querySelector(".cs-move")) { slot.innerHTML = ""; return; }
    slot.innerHTML = ""; slot.appendChild(moveTo(c.t || "chat_import", r.id, r.subject_id));
  });
  if (share) share.addEventListener("click", () => shareFlow(r, share, msg));
  if (rm) rm.addEventListener("click", async () => {
    if (!confirm("Remove this chat? It leaves your list and every answer. It is kept in the archive, not erased.")) return;
    const s = await rpc("chat_remove", { p_chat: r.id });
    if (s?.ok) { cs.open = null; drawOpenEmpty(); cs.root.dataset.view = "list"; drawMine(); } else said(msg, s?.note || "That did not work.", true);
  });
}

function whoSaid(r, m) {
  if (m.role !== "assistant") return r.mine ? "You" : null;
  return r.came_from === "chatgpt_export" ? "ChatGPT" : r.came_from === "paste" || r.came_from === "forward" ? "Assistant" : "Claude";
}
function wholeChat(r) {
  const box = el("div", "cs-whole");
  const msgs = Array.isArray(r.messages) ? r.messages : [];
  const head = el("div", "cs-whole-head");
  head.appendChild(el("div", "eyebrow", "The whole conversation"));
  const find = el("input", "work-search"); find.type = "search"; find.placeholder = "Search inside this chat"; find.setAttribute("aria-label", "Search inside this chat");
  const count = el("p", "quiet");
  head.append(find, count);
  box.appendChild(head);
  const rows = [];
  for (const m of msgs) {
    const d = el("div", "cs-msg " + (m.role === "assistant" ? "them" : "me"));
    const w = whoSaid(r, m);
    d.appendChild(w ? txt("span", "cs-msg-who", w, w === "Claude" || w === "ChatGPT") : txt("span", "cs-msg-who", r.brought_by || "", true));
    d.appendChild(txt("div", "cs-msg-text", m.text, true));
    box.appendChild(d); rows.push([d, String(m.text || "").toLowerCase()]);
  }
  const show = () => {
    const q = find.value.trim().toLowerCase();
    let n = 0;
    for (const [d, t] of rows) { const hit = !q || t.includes(q); d.hidden = !hit; if (hit) n++; }
    count.textContent = q ? `Messages that match: ${n}` : `${rows.length} messages in this chat`;
  };
  find.addEventListener("input", show); show();
  if (!msgs.length) box.appendChild(el("p", "quiet", "Only the summary is here until the whole chat is saved."));
  return box;
}

function moveTo(table, id, current) {
  const box = el("div", "cs-move");
  box.appendChild(el("p", "quiet", "Move it to:"));
  const row = el("div", "cs-move-row");
  for (const s of cs.subs) {
    if (s.id === NOT_SORTED || s.id === current) continue;
    if (s.place === "start" && !cs.r?.can_pin) continue;
    const b = btn("cs-move-b", null); b.appendChild(txt("span", null, s.name, true));
    b.addEventListener("click", async () => {
      row.querySelectorAll("button").forEach((x) => { x.disabled = true; });
      const m = await rpc("chat_move", { p_table: table, p_item: id, p_subject: s.id });
      if (m?.ok) { cs.sel = s.id; await drawMine(); box.innerHTML = ""; box.appendChild(el("p", "cs-moved", "Moved. The Tool will file chats like this one there from now on.")); }
      else { row.querySelectorAll("button").forEach((x) => { x.disabled = false; }); box.appendChild(el("p", "notice flagged", m?.note || "It could not be moved just now.")); }
    });
    row.appendChild(b);
  }
  box.appendChild(row);
  return box;
}

// SHARING SHOWS WHAT IS PRIVATE FIRST (seat locks-and-basics, decision 1022), unchanged: the brain decides (chat_share); the first
// press shares nothing when anyone it would reach cannot open everything it was made from, and says what is private and to whom.
async function shareFlow(r, sh, msg) {
  sh.disabled = true;
  const s = await rpc("chat_share", { p_chat: r.id, p_share: !r.shared_at });
  if (s?.ok) { await drawMine(); openItem({ t: "chat_import", id: r.id }); return; }
  sh.disabled = false;
  if (s?.reason !== "needs_confirm") { said(msg, s?.note || "That did not work.", true); return; }
  msg.innerHTML = "";
  const box = el("div", "notice flagged");
  box.append(el("p", null, "Not shared yet."), txt("p", null, s.note || "", false));
  const who = Array.isArray(s.private_to) ? s.private_to : [];
  if (who.length) {
    box.appendChild(el("p", "quiet", "What is in it that these people cannot open themselves:"));
    const ul = el("ul");
    who.forEach((p) => ul.appendChild(txt("li", null, `${p.person}: ${p.items} (` + (Array.isArray(p.sources) ? p.sources.map((x) => `${x.items} ${x.source}`).join(", ") : "") + ")", true)));
    box.appendChild(ul);
  }
  const row2 = el("div", "cs-actions");
  const yes = btn("go", "Share anyway"); const no = btn("go ghost", "Keep it private");
  yes.addEventListener("click", async () => {
    yes.disabled = true; no.disabled = true;
    const t = await rpc("chat_share", { p_chat: r.id, p_share: true, p_confirm: true });
    if (t?.ok) { await drawMine(); openItem({ t: "chat_import", id: r.id }); } else { yes.disabled = false; no.disabled = false; said(msg, t?.note || "That did not work.", true); }
  });
  no.addEventListener("click", () => { msg.innerHTML = ""; msg.appendChild(el("p", "quiet", "Kept private. Nothing was shared.")); });
  row2.append(yes, no); box.appendChild(row2); msg.appendChild(box);
}

// A chat she had in the Tool's box: her questions here, the answers on the Work tab (where they are kept with their sources).
async function openToolChat(c, v) {
  const { data, error } = await ctx.sb.rpc("work_open", { p_chat: c.id });
  v.innerHTML = "";
  back(v);
  if (error || !data?.ok) { v.appendChild(el("p", "notice flagged", data?.note || "This chat could not be opened.")); return; }
  v.appendChild(txt("h3", "cs-open-title", data.chat.title, true));
  const meta = el("p", "quiet cs-meta");
  meta.append(el("span", null, "Asked in the Tool"), document.createTextNode(" · "), txt("span", null, day(data.chat.created_at), true));
  v.appendChild(meta);
  if (String(data.chat.about || "").startsWith("mail:")) v.appendChild(el("p", "quiet", "Started from an email."));
  const outs = el("section", "cs-outs");
  outs.appendChild(el("div", "eyebrow", "What came out of it"));
  const turns = Array.isArray(data.turns) ? data.turns : [];
  outs.appendChild(el("p", "quiet", turns.length ? "The answers, with their sources, are on the Work tab." : "Nothing saved from this chat yet."));
  v.appendChild(outs);
  const row = el("div", "cs-actions");
  const go = btn("go", "Open it on the Work tab");
  go.addEventListener("click", () => { const t = document.querySelector('#tabs .tab[data-tab="work"]'); if (t) t.click(); });
  const move = btn("go ghost", "Move to");
  row.append(go, move); v.appendChild(row);
  const slot = el("div", "cs-slot"); v.appendChild(slot);
  move.addEventListener("click", () => { if (slot.querySelector(".cs-move")) { slot.innerHTML = ""; return; } slot.innerHTML = ""; slot.appendChild(moveTo("work_chat", c.id, c.subject_id)); });
  const qs = el("div", "cs-whole");
  qs.appendChild(el("div", "eyebrow", "What you asked"));
  for (const t of turns) { const d = el("div", "cs-msg me"); d.appendChild(txt("div", "cs-msg-text", t.question, true)); qs.appendChild(d); }
  v.appendChild(qs);
}

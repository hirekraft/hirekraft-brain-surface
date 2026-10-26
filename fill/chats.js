// fill/chats.js: the Chats tab (seat chat-import, 2026-10-10; decision cb1a7115).
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

function build(host) {
  host.dataset.built = "1";
  host.innerHTML = "";
  host.appendChild(el("p", "lede", "Bring in the thinking you did in your own Claude or ChatGPT. Chats you bring in are private to you until you share them with the company."));

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

  // connect your own Claude (seat chat-connector fills this)
  const cn = el("details", "chats-way");
  cn.appendChild(el("summary", null, "Connect your own Claude"));
  const cnHost = el("div"); cnHost.id = "chats-connector";
  drawConnector(cnHost);
  cn.appendChild(cnHost);
  host.appendChild(cn);

  // my chats
  host.appendChild(el("h3", null, "My chats"));
  const search = el("input", "work-search"); search.type = "search"; search.placeholder = "Search your chats";
  search.style.width = "100%";
  let t = null;
  search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => drawMine(search.value), 250); });
  const list = el("div"); list.id = "chats-mine";
  const viewer = el("div"); viewer.id = "chats-view";
  host.append(search, list, viewer);
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
    `“How do thoughtgrams work in HireKraft?” It answers from HireKraft's own guide and your setup.`,
    `“Save this to HireKraft”, “save this document to HireKraft”, or “leave a thought in HireKraft: ...”. Each lands here or in Thoughts, private to you.`,
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

async function drawMine(q) {
  const list = ctx.$("#chats-mine");
  if (!list) return;
  const r = await rpc("chat_list", { p_q: q || null });
  list.innerHTML = "";
  if (!r?.ok) { list.appendChild(el("p", "notice flagged", r?.note || "Your chats could not be read.")); return; }
  const row = (c, theirs) => {
    const li = el("li");
    const b = el("button", "work-open"); b.type = "button"; b.style.textAlign = "left"; b.style.width = "100%";
    b.appendChild(el("div", "a-title", c.title));
    const bits = [theirs ? `shared by ${c.brought_by}` : c.shared_at ? `Shared ${day(c.shared_at)}` : "Private",
      CAME[c.came_from] || c.came_from, day(c.started_at || c.brought_in_at), `${c.messages} messages`];
    b.appendChild(el("div", "a-detail", bits.filter(Boolean).join(" · ")));
    b.addEventListener("click", () => openChat(c.id));
    li.appendChild(b); return li;
  };
  if (!r.mine.length) list.appendChild(el("p", "quiet", r.searched ? `None of your chats mention "${r.searched}" in their title or text.` : "You have not brought in any chats yet."));
  else { const ul = el("ul", "attn"); r.mine.forEach((c) => ul.appendChild(row(c, false))); list.appendChild(ul); }
  if (r.shared_with_me.length) {
    list.appendChild(el("h3", null, "Shared with the company by others"));
    const ul = el("ul", "attn"); r.shared_with_me.forEach((c) => ul.appendChild(row(c, true))); list.appendChild(ul);
  }
  if (Array.isArray(r.private_counts) && r.private_counts.length) {
    list.appendChild(el("p", "quiet", "Private chats other people brought in (you cannot open these until they share them): " +
      r.private_counts.map((p) => `${p.person} ${p.chats}`).join(", ") + "."));
  }
  // MADE FROM LOCKED STAYS LOCKED (seat locks-and-basics, decision 1022): shared chats built from things you cannot open
  // are counted, never silently missing.
  const locked = Number(r.shared_locked || 0);
  if (locked) list.appendChild(el("p", "quiet", `${locked} shared ${locked === 1 ? "chat is" : "chats are"} not shown to you: ` +
    `${locked === 1 ? "it was" : "they were"} made from emails or files you cannot open yourself.`));
}

async function openChat(id) {
  const v = ctx.$("#chats-view");
  v.innerHTML = "";
  const r = await rpc("chat_open", { p_chat: id });
  if (!r?.ok) { v.appendChild(el("p", "notice flagged", r?.note || "This chat could not be opened.")); return; }
  const card = el("div", "notice");
  card.appendChild(el("h3", null, r.title));
  card.appendChild(el("p", "quiet", [r.mine ? (r.shared_at ? `Shared with the company ${day(r.shared_at)}` : "Private to you") : `Shared by ${r.brought_by}`,
    CAME[r.came_from] || r.came_from, r.exact ? "exact text" : "condensed", day(r.started_at || r.brought_in_at)].filter(Boolean).join(" · ")));
  if (r.mine) {
    const n = Number(r.sources_known || 0);
    const line = r.made_from_state === "recorded"
      ? (n ? `Made from ${n} ${n === 1 ? "item" : "items"} HireKraft found for you. Anyone you share it with sees it only if they can open all of them.` : "")
      : r.made_from_state === "untied"
        ? "Saved from your AI assistant. HireKraft could not tie it item by item to what it handed over, so sharing it asks you first."
        : "HireKraft does not know what this was made from, so sharing it asks you first.";
    if (line) card.appendChild(el("p", "quiet", line + (r.past_lock ? " You shared it after being shown what is private in it." : "")));
  }
  const acts = el("div"); acts.style.display = "flex"; acts.style.gap = "8px"; acts.style.margin = "8px 0";
  const msg = el("div");
  if (r.mine) {
    const sh = el("button", r.shared_at ? "go ghost" : "go", r.shared_at ? "Unshare" : "Share with the company"); sh.type = "button";
    // SHARING SHOWS WHAT IS PRIVATE FIRST (seat locks-and-basics, decision 1022). The brain decides (chat_share): if anyone
    // it would reach cannot open everything it was made from, or what it was made from is not known, the first press
    // shares nothing and says what is private and to whom; only "Share anyway" shares it, and that choice is recorded.
    sh.addEventListener("click", async () => {
      sh.disabled = true;
      const s = await rpc("chat_share", { p_chat: id, p_share: !r.shared_at });
      if (s?.ok) { await openChat(id); drawMine(); return; }
      sh.disabled = false;
      if (s?.reason !== "needs_confirm") { said(msg, s?.note || "That did not work.", true); return; }
      msg.innerHTML = "";
      const box = el("div", "notice flagged");
      box.appendChild(el("p", null, "Not shared yet. " + (s.note || "")));
      const who = Array.isArray(s.private_to) ? s.private_to : [];
      if (who.length) {
        box.appendChild(el("p", "quiet", "What is in it that these people cannot open themselves:"));
        const ul = el("ul"); ul.style.paddingLeft = "1.2em";
        who.forEach((p) => ul.appendChild(el("li", null, `${p.person}: ${p.items} ${p.items === 1 ? "item" : "items"} (` +
          (Array.isArray(p.sources) ? p.sources.map((x) => `${x.items} from ${x.source}`).join(", ") : "") + ")")));
        box.appendChild(ul);
      }
      const row2 = el("div"); row2.style.display = "flex"; row2.style.gap = "8px"; row2.style.flexWrap = "wrap";
      const yes = el("button", "go", "Share anyway"); yes.type = "button";
      const no = el("button", "go ghost", "Keep it private"); no.type = "button";
      yes.addEventListener("click", async () => {
        yes.disabled = true; no.disabled = true;
        const t = await rpc("chat_share", { p_chat: id, p_share: true, p_confirm: true });
        if (t?.ok) { await openChat(id); drawMine(); } else { yes.disabled = false; no.disabled = false; said(msg, t?.note || "That did not work.", true); }
      });
      no.addEventListener("click", () => { msg.innerHTML = ""; msg.appendChild(el("p", "quiet", "Kept private. Nothing was shared.")); });
      row2.append(yes, no); box.appendChild(row2); msg.appendChild(box);
    });
    const rm = el("button", "go ghost", "Remove"); rm.type = "button";
    rm.addEventListener("click", async () => {
      if (!confirm("Remove this chat? It leaves your list and every answer. It is kept in the archive, not erased.")) return;
      const s = await rpc("chat_remove", { p_chat: id });
      if (s?.ok) { v.innerHTML = ""; v.appendChild(el("p", "quiet", s.note)); drawMine(); } else said(msg, s?.note || "That did not work.", true);
    });
    acts.append(sh, rm);
  }
  card.append(acts, msg);
  for (const m of r.messages || []) {
    const p = el("div"); p.style.margin = "10px 0"; p.style.whiteSpace = "pre-wrap";
    p.appendChild(el("div", "eyebrow", m.role === "assistant" ? "Assistant" : "Person"));
    p.appendChild(el("div", null, m.text));
    card.appendChild(p);
  }
  v.appendChild(card);
  v.scrollIntoView({ behavior: "smooth", block: "start" });
}

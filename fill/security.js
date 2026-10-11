// fill/security.js - THE SECURITY PANEL, BY PLACE (seat security-panel, Alex 2026-10-10)
//
// Alex, on the first Security tab: "more like an instrument panel than just a lot of writing... I have
// to see WHERE they are... here are the folders with so many files that someone can see."
// Capability "Know who can see what, and what is more open than I meant". Mechanisms: WHO CAN SEE WHAT
// (reads only, through public.audit_panel and public.audit_place_mark_set, both owner only via
// owner_refusal), SHOW (this file). This file computes no finding and decides nothing about access:
// every number is the brain's. Empty is said in words; a part that cannot be read says why.
// NO FILE LISTS: a single file is reached by asking the box. A place's critical files open one click
// down, and only those.

let ctx = null;          // { sb, zone, el, $ , countOf, goto }
let last = null;         // the last panel reading
const live = { refused: null, door: null };

const KIND_WORDS = {
  sow: ["statement of work", "statements of work"], tax_form: ["tax form", "tax forms"],
  bank_statement: ["bank statement", "bank statements"], meeting_notes: ["set of meeting notes", "sets of meeting notes"],
  contact_list: ["contact list", "contact lists"], candidate_database: ["candidate database", "candidate databases"],
};
function kindWords(k, n) {
  const w = KIND_WORDS[k] ?? [k.split("_").join(" "), k.split("_").join(" ") + "s"];
  return ctx.countOf(n) + " " + (Number(n) === 1 ? w[0] : w[1]);
}
const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const note = (mount, text, flagged) => mount.appendChild(line(flagged ? "notice flagged" : "quiet", text));
const plural = (n, one, many) => ctx.countOf(n) + " " + (Number(n) === 1 ? one : many);

export function initPanel(c) { ctx = c; }

// Called by lens.js with the readings it already makes, so nothing is asked of the brain twice.
export function setLive(key, value) { live[key] = value; drawGauges(); }

export async function loadPanel() {
  for (const id of ["#sec-gauges", "#sec-openings", "#sec-grid", "#sec-conflicts"]) {
    const m = ctx.$(id); if (m && !m.childElementCount) note(m, "Reading the latest check.");
  }
  try {
    const { data, error } = await ctx.sb.rpc("audit_panel", { p_tz: ctx.zone() });
    if (error) throw error;
    last = data;
  } catch (e) {
    const msg = String(e?.message ?? e);
    last = { ok: false, note: msg.includes("Could not find the function")
      ? "The panel is not switched on yet: one change to the brain is waiting to be applied."
      : "The panel could not be read, so nothing here is known: " + msg };
  }
  drawAll();
}

function drawAll() {
  drawGauges(); drawOpenings(); drawGrid(); drawConflicts(); drawHow();
}

function refused(mount) {
  mount.innerHTML = "";
  note(mount, last?.note ?? "This could not be shown" + (last?.reason ? " (" + last.reason + ")" : "") + ".", true);
}

// ── a. THE GAUGE ROW ───────────────────────────────────────────────────────
function drawGauges() {
  if (!ctx) return;
  const mount = ctx.$("#sec-gauges"); if (!mount) return;
  mount.innerHTML = "";
  const g = last?.ok ? last.gauges : null;
  const first = last?.ok ? last.run.first_run : false;
  const ch = g?.change?.places;
  const tiles = [
    { n: g?.openings_to_decide, words: "openings need a decision", sub: !last?.ok ? "" : first ? "first run" : (ch ? (ch > 0 ? ch + " more places than last run" : -ch + " fewer places than last run") : "same as last run"), go: "#sec-openings", red: Number(g?.openings_to_decide) > 0 },
    { n: g?.critical_places_beyond_company, words: "places with critical files open beyond the company", sub: first ? "first run" : "", go: "#sec-openings", red: Number(g?.critical_places_beyond_company) > 0 },
    { n: g?.outside_parties, words: "outside people and domains with access", sub: first ? "first run" : "", go: "#sec-grid" },
    { n: g == null ? null : Number(g.delegates) + Number(g.send_as), words: g == null ? "mailbox delegates and send-as" : plural(g.delegates, "delegate", "delegates") + " and " + plural(g.send_as, "send-as", "send-as") + " on mailboxes", sub: "", go: "#sec-grid" },
    { n: live.refused?.ok ? (live.refused.people ?? []).reduce((a, p) => a + Number(p.week ?? 0), 0) : null, words: "questions refused this week", sub: "", go: "#sec-watch", red: (live.refused?.people ?? []).some((p) => p.alert) },
    { n: live.door?.ok && live.door.door?.ran_at ? live.door.door.passing : null, words: live.door?.ok && live.door.door?.ran_at ? "of " + ((live.door.door.lines ?? []).length) + " Tool checks passing" : "Tool checks passing", sub: live.door?.door?.stale ? "not run lately" : "", go: "#sec-door", red: (live.door?.door?.lines ?? []).some((x) => !x.ok) },
  ];
  const row = ctx.el("div", "sp-gauges");
  for (const t of tiles) {
    const b = ctx.el("button", "sp-gauge" + (t.red ? " sp-red" : ""));
    b.type = "button";
    b.appendChild(line("sp-n", t.n == null ? "?" : ctx.countOf(t.n)));
    b.appendChild(line("sp-w", t.words));
    if (t.sub) b.appendChild(line("sp-s", t.sub));
    b.addEventListener("click", () => ctx.$(t.go)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    row.appendChild(b);
  }
  mount.appendChild(row);
  if (last?.ok) note(mount, "Last checked " + last.run.when + (last.run.partial ? ". This check only partly finished; see How this is counted." : "."));
  else if (last) note(mount, last.note ?? "The latest check could not be read.", true);
}

// ── b. OPENINGS, worst first ───────────────────────────────────────────────
function placeRow(p) {
  const li = ctx.el("li", "sp-place");
  const where = [p.where ?? "A drive"].concat(p.path ?? []).join(" › ") + (p.kind === "loose" ? " (files opened one by one)" : "");
  li.appendChild(line("a-title", where));
  const inside = Object.entries(p.inside ?? {}).map(([k, n]) => kindWords(k, n));
  const crit = Number(p.critical) > 0 ? " · " + plural(p.critical, "critical file", "critical files") : "";
  li.appendChild(line("a-detail", "Open to " + p.open_to + " · " + plural(p.files, "file", "files") + crit
    + (inside.length ? " · inside: " + inside.join(", ") : "")));
  const tags = [];
  if (p.is_new) tags.push("New since the last check.");
  if (p.note) tags.push(p.note);
  tags.push("When opened, and by whom: " + (p.opened ?? "not recorded") + ".");
  if (p.state === "quiet") tags.push("Marked on purpose " + (p.marked_at ?? "") + (p.mark_reason ? ": " + p.mark_reason : "") + ".");
  const t = line(p.state === "alert" || p.wider ? "notice flagged" : "quiet", tags.join(" "));
  li.appendChild(t);

  const acts = ctx.el("div", "sp-acts");
  const said = line("quiet", "");
  if (p.state === "quiet") {
    acts.appendChild(button('Take back "on purpose"', () => mark(p, false, said)));
  } else {
    acts.appendChild(button("This is on purpose", () => mark(p, true, said)));
  }
  if (p.link) {
    const a = ctx.el("a", "go ghost"); a.href = p.link; a.target = "_blank"; a.rel = "noopener";
    a.textContent = "Close it in Google"; a.title = "Opens the folder in Google; use Share there to change who can open it.";
    acts.appendChild(a);
  } else {
    acts.appendChild(line("quiet", "These files sit at the top of a person's own Drive; close each in Google."));
  }
  if (Number(p.critical) > 0) acts.appendChild(button("Show the critical files", () => showCritical(p, li)));
  li.appendChild(acts); li.appendChild(said);
  return li;
}

function button(text, fn) {
  const b = ctx.el("button", "go ghost"); b.type = "button"; b.textContent = text;
  b.addEventListener("click", fn); return b;
}

async function mark(p, onPurpose, said) {
  said.textContent = onPurpose ? "Marking." : "Taking it back.";
  const { data, error } = await ctx.sb.rpc("audit_place_mark_set", { p_place_key: p.key, p_on_purpose: onPurpose, p_reason: null });
  if (error || !data?.ok) { said.textContent = data?.note ?? (error ? "That did not save: " + error.message : "That did not save."); return; }
  await loadPanel();
}

async function showCritical(p, li) {
  const prior = li.querySelector(".sp-crit"); if (prior) { prior.remove(); return; }
  const box = ctx.el("div", "sp-crit"); li.appendChild(box);
  note(box, "Reading.");
  const { data, error } = await ctx.sb.rpc("audit_place_files", { p_place_key: p.key });
  box.innerHTML = "";
  if (error || !data?.ok) { note(box, data?.note ?? (error ? "Could not be read: " + error.message : "Could not be read."), true); return; }
  const ul = ctx.el("ul", "ans-list");
  for (const f of data.files ?? []) {
    const it = ctx.el("li");
    const a = ctx.el("a"); a.href = f.link; a.target = "_blank"; a.rel = "noopener"; a.textContent = f.name ?? "A file";
    it.appendChild(a); it.appendChild(document.createTextNode(" (" + (f.kind ?? "critical").split("_").join(" ") + ")"));
    ul.appendChild(it);
  }
  box.appendChild(ul);
  if (Number(data.more) > 0) note(box, plural(data.more, "more critical file is", "more critical files are") + " not listed. Ask the box about a file by name to see who can open it.");
}

function drawOpenings() {
  const mount = ctx.$("#sec-openings"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) { refused(mount); return; }
  const places = last.places ?? [];
  const open = places.filter((p) => p.state !== "quiet");
  const quiet = places.filter((p) => p.state === "quiet");
  if (!places.length) note(mount, last.run.partial
    ? "Nothing was found open in the part that was read. This check did not read everything, so this is not an all-clear."
    : "Nothing is open beyond the people each file was shared with.");
  if (open.length) {
    const ul = ctx.el("ul", "attn");
    for (const p of open) ul.appendChild(placeRow(p));
    mount.appendChild(ul);
  } else if (places.length) note(mount, "Every opening is marked on purpose.");
  if (quiet.length) {
    const d = ctx.el("details", "recs");
    const s = ctx.el("summary", "recs-sum"); s.textContent = "Open on purpose (" + quiet.length + ")"; d.appendChild(s);
    const ul = ctx.el("ul", "attn");
    for (const p of quiet) ul.appendChild(placeRow(p));
    d.appendChild(ul); mount.appendChild(d);
  }
}

// ── c. WHO SEES WHAT GRID ──────────────────────────────────────────────────
function drawGrid() {
  const mount = ctx.$("#sec-grid"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) { refused(mount); return; }
  const cols = last.grid?.columns ?? [], rows = last.grid?.rows ?? [];
  if (!rows.length) { note(mount, "No one was found with access beyond their own mailbox."); return; }
  const wrap = ctx.el("div", "sp-grid-wrap");
  const tbl = ctx.el("table", "sp-grid");
  const hr = ctx.el("tr"); hr.appendChild(ctx.el("th"));
  for (const c of cols) { const th = ctx.el("th"); th.textContent = c.label; th.scope = "col"; hr.appendChild(th); }
  const thead = ctx.el("thead"); thead.appendChild(hr); tbl.appendChild(thead);
  const tb = ctx.el("tbody");
  for (const r of rows) {
    const tr = ctx.el("tr", r.kind === "anyone" || r.kind === "outside" ? "sp-wide" : "");
    const th = ctx.el("th"); th.scope = "row"; th.textContent = r.who; tr.appendChild(th);
    for (const c of cols) { const td = ctx.el("td"); td.textContent = r.cells?.[c.col] ?? ""; tr.appendChild(td); }
    tb.appendChild(tr);
  }
  tbl.appendChild(tb); wrap.appendChild(tbl); mount.appendChild(wrap);
  note(mount, "One row is everything that person or party can reach. Owner: their own. Delegate: opens that mailbox. Can send as: sends mail as that address. Member: belongs to that shared drive. Link or shared: files in that drive open to them.");
}

// ── d. CONFLICTS ───────────────────────────────────────────────────────────
function drawConflicts() {
  const mount = ctx.$("#sec-conflicts"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) { refused(mount); return; }
  const cs = last.conflicts ?? [];
  if (!cs.length) note(mount, "No one holds two powers that should not sit together, by the checks the Tool can run.");
  else {
    const ul = ctx.el("ul", "attn");
    for (const c of cs) {
      const li = ctx.el("li");
      li.appendChild(line("a-title", c.text));
      li.appendChild(line("a-detail", "Why it matters: " + c.why));
      li.appendChild(line("a-detail", "How to fix it: " + c.fix));
      ul.appendChild(li);
    }
    mount.appendChild(ul);
  }
  for (const n of last.not_checked ?? []) note(mount, "Not checked: " + n);
}

// ── how this is counted ────────────────────────────────────────────────────
function drawHow() {
  const mount = ctx.$("#sec-how"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) return;
  const d = ctx.el("details", "recs");
  const s = ctx.el("summary", "recs-sum"); s.textContent = "How this is counted"; d.appendChild(s);
  d.appendChild(line("a-detail", "A file is critical when it would hurt if a stranger got it. Your definition:"));
  const ul = ctx.el("ul", "ans-list");
  for (const k of last.critical_definition ?? []) { const li = ctx.el("li"); li.textContent = k.words + " (set by " + String(k.set_by).split(" (")[0] + ")"; ul.appendChild(li); }
  d.appendChild(ul);
  const ul2 = ctx.el("ul", "ans-list");
  for (const l of last.limits ?? []) { const li = ctx.el("li"); li.textContent = l; ul2.appendChild(li); }
  d.appendChild(ul2);
  d.appendChild(line("quiet", "Changing this definition by telling the box is not built yet."));
  mount.appendChild(d);
}

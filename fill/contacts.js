// fill/contacts.js - THE CONTACTS TAB (seat contacts, Alex 2026-10-12: "prep me before a call or meeting" and "have we
// dealt with this company, who do we know there"; "if I ask for a specific person and that person will be in CATS and
// emails and phone conversations, everywhere, we put everything together and the tool knows to grab the latest one").
//
// Round 3 (Alex 2026-10-12 23:01 and 23:09 PT, decision 996): the card is a search of everything by the person's name and
// every address, the way the owner would do it by hand. ONE CARD, ONE COLUMN: header (name, what they are now, last contact
// on any channel and which), possibly the same person (one press joins them all, untick the odd one out), who they are now
// (one row per fact, older values behind "history" on that row), one timeline merging CATS, HubSpot, mail, files and Slack
// by date (ten lines, then show all), and one line saying which sources were searched and what each gave. The three-column
// tiles of round 1 are gone (Alex: everything looked like CATS).
//
// Capability "Tell me everything about this person or company, current, with its history". Mechanisms: FIND and
// WHO-AND-WHAT in the brain (contact_card), LEARN FROM A CORRECTION (contact_join, contact_fact_set), SHOW (this file).
// This file decides nothing: every fact, line and refusal is the brain's. A part the person may not open says so with
// its reason; refused is never drawn as empty. The box answers the same questions from the same card (lens-ask).
//
// Not a list of every person: a lookup. Type a name, an email address or a company.

import { fmtDate } from "./dates.js?v=2026-10-22-dates";

let ctx = null;   // { sb, el, $, countOf, ask, isOwner }
let mount = null;
let seq = 0;   // each lookup's number: one that finishes after a newer one, or after its screen was replaced, draws nothing
const KEEP = "tool.contacts.last";
const SHOW_FIRST = 10;

const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const head4 = (text) => { const h = ctx.el("h4"); h.textContent = text; h.style.margin = "calc(var(--u) * 4) 0 var(--u)"; return h; };
const day = (d) => fmtDate(d, "day", "undated");
const ago = (n) => n == null ? "" : Number(n) === 0 ? "today" : Number(n) === 1 ? "yesterday" : ctx.countOf(Number(n)) + " days ago";
const FACT_WORDS = { title: "Title", employer: "Works at", location: "Where", status: "Status", stage: "Stage in HubSpot",
  left_company: "Has left the company", email: "Email", phone: "Phone", skills: "Skills" };
const FACT_ORDER = ["title", "employer", "location", "status", "stage", "left_company", "email", "phone", "skills"];
const MANY = new Set(["email", "phone"]);   // several can be true at once; the rest have one current value
const asList = (v) => Array.isArray(v) ? v : (v ? [v] : []);   // one shape: a list of observations, newest first
const sourceOf = (s) => String(s ?? "").startsWith("cats:tables") ? "CATS (2025 copy)" : String(s ?? "").startsWith("cats") ? "CATS"
  : String(s ?? "").startsWith("hubspot") ? "HubSpot" : String(s ?? "").startsWith("slack") ? "Slack" : String(s ?? "");

export function drawContacts(body, c) {
  ctx = c; body.innerHTML = "";
  const top = ctx.el("div", "tab-top");
  top.appendChild(line("tab-count", "Anyone you have dealt with, from CATS, HubSpot, mail, drives, Slack, brought-in chats and your own calendar and address book, as they are now."));
  const what = ctx.el("details", "whatis");
  const ws = ctx.el("summary"); ws.textContent = "What is this?"; what.appendChild(ws);
  what.appendChild(line("quiet", "Type a name, an email address or a company. The Tool searches every connected system the way you would by hand: CATS, HubSpot, every mailbox, every drive, Slack and brought-in chats, by the exact name and every address it knows. It shows the newest of each fact with where and when it came from, says when two sources disagree or a fact is old, and puts everything that happened in one timeline. Records with the same full name elsewhere are offered as possibly the same person; nothing is joined until you say so."));
  top.appendChild(what);
  body.appendChild(top);

  const form = ctx.el("form", "onebox-bar contacts-find");
  const input = ctx.el("input"); input.type = "search"; input.autocomplete = "off";
  input.placeholder = "A name, an email address or a company"; input.setAttribute("aria-label", "Find a person or company");
  const go = ctx.el("button", "send"); go.type = "submit"; go.textContent = "Find";
  form.append(input, go);
  body.appendChild(form);
  mount = ctx.el("div"); mount.setAttribute("aria-live", "polite");
  mount.style.maxWidth = "var(--convo, 48rem)";
  body.appendChild(mount);
  form.addEventListener("submit", (e) => { e.preventDefault(); find(input.value); });

  let last = null;
  try { last = localStorage.getItem(KEEP); } catch (_) { last = null; }
  if (last) { input.value = last; find(last); }
  else mount.appendChild(line("quiet", "Ask the box too: prep me for my call with someone, or who do we know at a company."));
}

async function read(args) {
  try {
    const { data, error } = await ctx.sb.rpc("contact_card", args);
    if (error) throw error;
    return data;
  } catch (e) {
    const msg = String(e?.message ?? e);
    return { ok: false, reason: msg.includes("Could not find the function")
      ? "This part is not switched on yet: one change to the brain is waiting to be applied."
      : "The card could not be read, so nothing here is known: " + msg };
  }
}

async function find(q, person) {
  const query = String(q ?? "").trim();
  if (!query && !person) return;
  if (query) { try { localStorage.setItem(KEEP, query); } catch (_) { /* this page only */ } }
  const mine = ++seq, here = mount;
  mount.innerHTML = "";
  mount.appendChild(line("quiet working", "Searching CATS, HubSpot, every mailbox, every drive, Slack, brought-in chats and your own calendar."));
  const t0 = Date.now();
  const card = await read({ p_query: query || null, p_person: person ?? null });
  // The screen was replaced (she left the tab and came back) or a newer lookup started: this one draws nothing.
  if (mine !== seq || here !== mount || !here.isConnected) return;
  mount.innerHTML = "";
  draw(card, Date.now() - t0);
}

function draw(c, ms) {
  if (!c || c.ok === false) { mount.appendChild(line("notice flagged", c?.reason ?? "The card could not be shown.")); return; }
  if (c.refused_all) {
    mount.appendChild(line("notice flagged", String(c.note ?? "This is in records you cannot open.")));
    if (c.reason) mount.appendChild(line("quiet", "Why: " + String(c.reason).replace("refused: ", "") + "."));
    return;
  }
  if (c.kind === "none") { mount.appendChild(line("quiet", String(c.note ?? "Nothing by exactly that name."))); return; }
  if (c.kind === "choose") return drawChoose(c);
  if (c.kind === "company") return drawCompany(c, ms);
  return drawPerson(c, ms);
}

function drawChoose(c) {
  mount.appendChild(head4(ctx.countOf(c.matches) + " people have exactly this name. Which one?"));
  const ul = ctx.el("ul", "members");
  for (const x of c.choices ?? []) {
    const li = ctx.el("li");
    const b = ctx.el("button", "go ghost"); b.type = "button";
    b.textContent = [x.name, x.employer ? "at " + x.employer : "", "(" + (x.system ?? "") + (x.last_activity ? ", last activity " + day(x.last_activity) : "") + ")"].filter(Boolean).join(" ");
    b.addEventListener("click", () => find("", x.person));
    li.appendChild(b); ul.appendChild(li);
  }
  mount.appendChild(ul);
  mount.appendChild(line("quiet", String(c.note ?? "")));
}

function head(title, sub, ms, asOf) {
  const h = ctx.el("div", "contact-head");
  const n = ctx.el("h3"); n.textContent = title; n.style.margin = "var(--gap) 0 0"; h.appendChild(n);
  if (sub) h.appendChild(line("", sub));
  h.appendChild(line("quiet", "As of " + fmtDate(asOf ?? new Date(), "whenShort") + (ms ? ", read in " + (ms / 1000).toFixed(1) + " s" : "") + "."));
  mount.appendChild(h);
}

function lastContact(c) {
  if (!c.last_contact?.at) { mount.appendChild(line("notice", "No dated contact found in what you can see.")); return; }
  mount.appendChild(line("notice", "Last contact " + ago(c.last_contact.days_ago) + ", " + day(c.last_contact.at) + ", by " + c.last_contact.channel + "."));
}

// NEXT MEETING AND LAST MET (seat calendar-contacts, 2026-10-22): from the asker's OWN calendar only (the brain's
// meetings_for_identity, every meeting through the door, read at the moment of asking). Someone whose calendar is not
// read sees nothing here; the card's not-read line says so.
function meetings(c) {
  const m = c.meetings;
  if (!m || m.calendar !== true) return;
  const at = (x) => x.all_day ? fmtDate(String(x.at).slice(0, 10), "day") : fmtDate(x.at, "when");
  const said = (label, x) => label + " " + at(x) + (x.title ? ": " + x.title : "") + ".";
  const parts = [];
  if (m.next) parts.push(said("Next meeting", m.next));
  if (m.last) parts.push(said("Last met", m.last));
  if (!parts.length) parts.push(m.note ?? "No meetings with them in your calendar.");
  mount.appendChild(line("notice", parts.join(" ")));
  const n = Number(m.past ?? 0), u = Number(m.upcoming ?? 0);
  if (n || u) mount.appendChild(line("quiet", ctx.countOf(n) + " past and " + ctx.countOf(u) + " upcoming in your calendar. Only you see these."));
}

// ONE FACTS TABLE, used for every card: one row per fact, one label per row. A fact is a list of observations, newest first;
// the first is current (for email and phone, every value that is not old). Older values open under "history" on that row.
function factsTable(facts) {
  const wrap = ctx.el("div", "sp-grid-wrap");
  const tbl = ctx.el("table", "sp-grid");
  const tb = ctx.el("tbody");
  const keys = FACT_ORDER.concat(Object.keys(facts ?? {}).filter((k) => !FACT_ORDER.includes(k)));
  for (const k of keys) {
    const obs = asList(facts?.[k]).filter((r) => r && r.value != null && String(r.value) !== "");
    if (!obs.length) continue;
    const now = MANY.has(k) ? (obs.filter((r) => !r.stale).length ? obs.filter((r) => !r.stale) : obs.slice(0, 1)) : obs.slice(0, 1);
    const older = obs.filter((r) => !now.includes(r));
    const tr = ctx.el("tr", now.every((r) => r.stale) ? "sp-wide" : "");
    const th = ctx.el("th"); th.scope = "row"; th.textContent = FACT_WORDS[k] ?? k.split("_").join(" "); tr.appendChild(th);
    const val = ctx.el("td"); val.textContent = now.map((r) => String(r.value)).join(", "); tr.appendChild(val);
    const src = ctx.el("td"); src.textContent = now.map((r) => [r.source, r.at ? day(r.at) : ""].filter(Boolean).join(", ")).join("; "); tr.appendChild(src);
    const flag = ctx.el("td"); flag.style.whiteSpace = "normal";
    const top = now[0] ?? {};
    const notes = [];
    if (now.every((r) => r.stale)) notes.push("Old: more than a year ago, may have changed");
    if (top.owner_said) notes.push("You had set " + top.owner_said.value + " on " + day(top.owner_said.at) + "; this is newer");
    if (Array.isArray(top.also) && top.also.length) notes.push("Also said: " + top.also.map((a) => a.value + " (" + a.source + ", " + day(a.at) + ")").join("; "));
    if (notes.length) flag.appendChild(document.createTextNode(notes.join(". ") + ". "));
    if (older.length) {
      const d = ctx.el("details"); const s = ctx.el("summary"); s.textContent = "history (" + older.length + ")"; s.style.cursor = "pointer"; d.appendChild(s);
      for (const r of older) d.appendChild(line("quiet", String(r.value) + " (" + [r.source, r.at ? day(r.at) : ""].filter(Boolean).join(", ") + (r.stale ? ", old" : "") + ")"));
      flag.appendChild(d);
    }
    tr.appendChild(flag);
    tb.appendChild(tr);
  }
  tbl.appendChild(tb); wrap.appendChild(tbl);
  return wrap;
}

// ONE TIMELINE: date, where, what. Ten lines, then the rest behind one button.
function timeline(rows) {
  if (!rows?.length) { mount.appendChild(line("quiet", "Nothing dated found in what you can see.")); return; }
  const ul = ctx.el("ul", "members");
  const put = (r) => { const li = ctx.el("li"); li.style.padding = "calc(var(--u) * 1) 0"; li.style.borderTop = "1px solid var(--line-2)";
    li.textContent = day(r.at) + " · " + String(r.where ?? "") + " · " + String(r.what ?? ""); ul.appendChild(li); };
  rows.slice(0, SHOW_FIRST).forEach(put);
  mount.appendChild(ul);
  if (rows.length > SHOW_FIRST) {
    const more = ctx.el("button", "go ghost"); more.type = "button"; more.textContent = "Show all " + ctx.countOf(rows.length);
    more.addEventListener("click", () => { rows.slice(SHOW_FIRST).forEach(put); more.remove(); });
    mount.appendChild(more);
  }
}

function searchedLine(c) {
  const parts = (c.searched ?? []).map((s) => s.where + " " + ctx.countOf(s.gave ?? 0) + (s.addresses ? " (" + ctx.countOf(s.addresses) + (Number(s.addresses) === 1 ? " address)" : " addresses)") : ""));
  if (parts.length) mount.appendChild(line("quiet", "Searched: " + parts.join(", ") + "."));
  if (c.linkedin) mount.appendChild(line("quiet", String(c.linkedin)));
  if (c.not_read) mount.appendChild(line("quiet", String(c.not_read)));
}

function refusedLines(c) {
  const m = c.mail ?? {};
  if (Number(m.refused ?? 0)) mount.appendChild(line("quiet", ctx.countOf(m.refused) + " emails are in mailboxes you cannot open: " + String(m.refused_reason ?? "").replace("refused: ", "") + "."));
  const h = c.history ?? {};
  if (Number(h.refused ?? 0)) mount.appendChild(line("quiet", ctx.countOf(h.refused) + " records are in systems you cannot open: " + String(h.refused_reason ?? "").replace("refused: ", "") + "."));
  if (Number(c.refused?.records ?? 0)) mount.appendChild(line("quiet", ctx.countOf(c.refused.records) + " of their records are not open to you: " + (c.refused.reasons ?? []).map((r) => String(r).replace("refused: ", "")).join("; ") + "."));
  if (Number(c.files?.refused ?? 0)) mount.appendChild(line("quiet", ctx.countOf(c.files.refused) + " files or chats naming them are not open to you: " + String(c.files.refused_reason ?? "").replace("refused: ", "") + "."));
}

// POSSIBLY THE SAME PERSON: every record or address found under the same full name, with its evidence. The owner joins them
// all with one press; an unchecked one is the odd one out and is not suggested again. Nothing is joined on its own.
function maybeSame(c) {
  const rows = c.maybe_same ?? [];
  if (!rows.length) return;
  mount.appendChild(head4("Possibly the same person (" + rows.length + ")"));
  const owner = ctx.isOwner() && c.person;
  mount.appendChild(line("quiet", owner ? "Found under the same full name elsewhere. Check the ones that are this person; nothing is joined until you press the button."
                                         : "Found under the same full name elsewhere. Only the owner can say whether they are the same person."));
  const ul = ctx.el("ul", "members");
  const boxes = [];
  for (const p of rows) {
    const li = ctx.el("li"); li.style.padding = "calc(var(--u) * 1) 0";
    const text = (p.kind === "mail" ? String(p.address ?? "") + ": " : "") + [p.evidence, p.kind === "mail" ? "" : "in " + p.in, p.title, p.employer ? "at " + p.employer : ""].filter(Boolean).join(", ");
    if (owner) {
      const lab = ctx.el("label"); const cb = ctx.el("input"); cb.type = "checkbox"; cb.checked = true;
      lab.append(cb, document.createTextNode(" " + text)); li.appendChild(lab); boxes.push([cb, p]);
    } else li.textContent = text;
    ul.appendChild(li);
  }
  mount.appendChild(ul);
  if (!owner) return;
  const act = ctx.el("div", "actions");
  const join = ctx.el("button", "go"); join.type = "button"; join.textContent = "These are all the same person";
  const sync = () => { const n = boxes.filter(([cb]) => cb.checked).length;
    join.textContent = n === boxes.length ? "These are all the same person" : n ? "Join the " + n + " checked" : "None of these are the same person"; };
  boxes.forEach(([cb]) => cb.addEventListener("change", sync));
  join.addEventListener("click", async () => {
    const said = line("quiet working", "Keeping your answer."); act.replaceChildren(said);
    const pick = (on, kind) => boxes.filter(([cb, p]) => cb.checked === on && p.kind === kind).map(([, p]) => p);
    const args = { p_person: c.person,
      p_people: pick(true, "record").map((p) => p.person), p_addresses: pick(true, "mail").flatMap((p) => p.addresses ?? [p.address]),
      p_not_people: pick(false, "record").map((p) => p.person), p_not_addresses: pick(false, "mail").flatMap((p) => p.addresses ?? [p.address]) };
    const { data, error } = await ctx.sb.rpc("contact_join", args);
    said.className = "quiet"; said.textContent = error ? "Not kept: " + error.message : (data?.note ?? data?.reason ?? "");
    if (!error && data?.ok) setTimeout(() => find("", c.person), 500);
  });
  act.appendChild(join);
  mount.appendChild(act);
}

function drawPerson(c, ms) {
  const f = c.facts ?? {};
  const now = (k) => asList(f[k])[0]?.value;
  const what = [now("title"), now("employer") ? "at " + now("employer") : ""].filter(Boolean).join(" ");
  const sub = [what, (c.roles ?? []).join(" · "), c.people_joined > 1 ? "one person across " + c.people_joined + " records (" + (c.joined_by ?? []).join(", ") + ")" : "", c.from_mail_only ? "known from mail only" : ""].filter(Boolean).join(" · ");
  head(c.name, sub, ms, c.as_of);
  lastContact(c);
  meetings(c);
  const act = ctx.el("div", "actions");
  const prep = ctx.el("button", "go"); prep.type = "button"; prep.textContent = "Prep me for a call";
  prep.addEventListener("click", () => ctx.ask("Prep me for my call with " + c.name));
  act.appendChild(prep);
  if (ctx.isOwner() && c.person) {
    const fix = ctx.el("button", "go ghost"); fix.type = "button"; fix.textContent = "Correct a fact";
    fix.addEventListener("click", () => correct(c, act));
    act.appendChild(fix);
  }
  mount.appendChild(act);

  maybeSame(c);
  if (Object.keys(f).length) { mount.appendChild(head4("Who they are now")); mount.appendChild(factsTable(f)); }
  if ((c.holders ?? []).length) mount.appendChild(line("quiet", "Who here holds the relationship: " + c.holders.map((h) => h.who + (h.messages ? " (" + ctx.countOf(h.messages) + " emails)" : "") + (h.in ? " (owner in " + h.in + ")" : "")).join("; ") + "."));

  mount.appendChild(head4("Everything that happened (newest first)"));
  // Older cards carried no timeline: build one from the parts they have, so nothing is left out.
  const rows = Array.isArray(c.timeline) ? c.timeline : [].concat(
    (c.history?.lines ?? []).map((l) => ({ at: l.at, where: sourceOf(l.source), what: l.line })),
    (c.mail?.lines ?? []).map((l) => ({ at: l.at, where: "Mail (" + l.mailbox + ")", what: [l.direction, l.line].filter(Boolean).join(": ") }))
  ).sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
  timeline(rows);
  searchedLine(c);
  refusedLines(c);
}

function correct(c, act) {
  const form = ctx.el("form", "onebox-bar");
  const sel = ctx.el("select"); sel.setAttribute("aria-label", "Which fact");
  for (const k of ["title", "employer", "location", "status", "email", "phone"]) { const o = ctx.el("option"); o.value = k; o.textContent = FACT_WORDS[k]; sel.appendChild(o); }
  const val = ctx.el("input"); val.type = "text"; val.placeholder = "What it is now"; val.setAttribute("aria-label", "What it is now");
  const save = ctx.el("button", "send"); save.type = "submit"; save.textContent = "Keep";
  form.append(sel, val, save);
  act.after(form);
  val.focus();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const said = line("quiet working", "Keeping it."); form.replaceWith(said);
    const { data, error } = await ctx.sb.rpc("contact_fact_set", { p_person: c.person, p_fact: sel.value, p_value: val.value });
    said.className = "quiet"; said.textContent = error ? "Not kept: " + error.message : (data?.note ?? data?.reason ?? "");
    if (!error && data?.ok) setTimeout(() => find("", c.person), 600);
  });
}

function drawCompany(c, ms) {
  const co = c.company ?? {};
  head(co.name, [co.status, co.location, co.website, (co.in ?? []).length ? "in " + co.in.join(", ") : ""].filter(Boolean).join(" · "), ms, c.as_of);
  lastContact(c);
  meetings(c);
  const t = c.history?.totals ?? {};
  const said = [["jobs", "jobs"], ["put_forward_per_older_job_records", "people put forward (older job records)"], ["pipeline_entries", "people in the pipeline"], ["contacts", "contacts"], ["activities", "logged calls, emails and meetings"]]
    .filter(([k]) => Number(t[k] ?? 0) > 0).map(([k, w]) => ctx.countOf(t[k]) + " " + w);
  if (said.length) mount.appendChild(line("quiet", "Found: " + said.join(", ") + "."));
  const act = ctx.el("div", "actions");
  const who = ctx.el("button", "go"); who.type = "button"; who.textContent = "Who do we know here?";
  who.addEventListener("click", () => ctx.ask("Who do we know at " + co.name + ", and what is the best way in?"));
  act.appendChild(who); mount.appendChild(act);

  const p = c.people ?? {};
  mount.appendChild(head4("People we know there (" + ctx.countOf(p.shown ?? 0) + ")"));
  if (Number(p.refused ?? 0)) mount.appendChild(line("quiet", ctx.countOf(p.refused) + " more are in records you cannot open: " + String(p.refused_reason ?? "").replace("refused: ", "") + "."));
  const ul = ctx.el("ul", "members");
  for (const x of p.list ?? []) {
    const li = ctx.el("li");
    const b = ctx.el("button", "go ghost"); b.type = "button";
    b.textContent = [x.name, x.title, x.left_company ? "has left" : "", "(" + x.in + (x.last_activity ? ", last activity " + day(x.last_activity) : "") + ")"].filter(Boolean).join(", ");
    b.addEventListener("click", () => find("", x.person));
    li.appendChild(b); ul.appendChild(li);
  }
  mount.appendChild(ul);
  mount.appendChild(head4("Everything that happened (newest first)"));
  const m = c.mail ?? {};
  const rows = [].concat(
    (c.history?.lines ?? []).map((l) => ({ at: l.at, where: sourceOf(l.source), what: l.line })),
    (m.lines ?? []).map((l) => ({ at: l.at, where: "Mail (" + l.mailbox + ")", what: l.line }))
  ).sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
  timeline(rows);
  if (!(m.lines ?? []).length && m.matched_by) mount.appendChild(line("quiet", "Mail: " + m.matched_by + "."));
  if (c.not_read) mount.appendChild(line("quiet", String(c.not_read)));
  refusedLines(c);
}

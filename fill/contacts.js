// fill/contacts.js - THE CONTACTS TAB (seat contacts, Alex 2026-10-12: "prep me before a call or meeting" and "have we
// dealt with this company, who do we know there"; "if I ask for a specific person and that person will be in CATS and
// emails and phone conversations, everywhere, we put everything together and the tool knows to grab the latest one").
//
// Capability "Tell me everything about this person or company, current, with its history". Mechanisms: FIND and
// WHO-AND-WHAT in the brain (contact_card: one person from several systems by exact keys, every fact with its source and
// date, the newest winning, history from record_history_for_identity, mail through who_can_see), and SHOW (this file).
// This file decides nothing: every fact, line and refusal is the brain's. A part the person may not open says so with
// its reason; refused is never drawn as empty. The box answers the same questions from the same card (lens-ask v27).
//
// Not a list of every person: a lookup. Type a name, an email address or a company.

let ctx = null;   // { sb, el, $, countOf, ask, isOwner }
let mount = null;
let seq = 0;   // each lookup's number: one that finishes after a newer one, or after its screen was replaced, draws nothing
const KEEP = "tool.contacts.last";

const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const day = (d) => d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const ago = (n) => n == null ? "" : Number(n) === 0 ? "today" : Number(n) === 1 ? "yesterday" : ctx.countOf(Number(n)) + " days ago";
const FACT_WORDS = { title: "Title", employer: "Works at", location: "Where", status: "Status", stage: "Stage in HubSpot",
  left_company: "Has left the company", email: "Email", phone: "Phone", skills: "Skills" };
const sourceOf = (s) => String(s ?? "").startsWith("cats:tables") ? "CATS (2025 copy)" : String(s ?? "").startsWith("cats") ? "CATS"
  : String(s ?? "").startsWith("hubspot") ? "HubSpot" : String(s ?? "").startsWith("slack") ? "Slack" : String(s ?? "");

export function drawContacts(body, c) {
  ctx = c; body.innerHTML = "";
  const top = ctx.el("div", "tab-top");
  top.appendChild(line("tab-count", "Anyone you have dealt with, from CATS, HubSpot and mail, as they are now."));
  const what = ctx.el("details", "whatis");
  const ws = ctx.el("summary"); ws.textContent = "What is this?"; what.appendChild(ws);
  what.appendChild(line("quiet", "Type a name, an email address or a company. The Tool puts together what every connected system says about them, shows the newest of each fact with where and when it came from, and says when two sources disagree or a fact is old. Records in different systems become one person only when they share an email address, or when you say they are the same."));
  top.appendChild(what);
  body.appendChild(top);

  const form = ctx.el("form", "onebox-bar contacts-find");
  const input = ctx.el("input"); input.type = "search"; input.autocomplete = "off";
  input.placeholder = "A name, an email address or a company"; input.setAttribute("aria-label", "Find a person or company");
  const go = ctx.el("button", "send"); go.type = "submit"; go.textContent = "Find";
  form.append(input, go);
  body.appendChild(form);
  mount = ctx.el("div"); mount.setAttribute("aria-live", "polite");
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
  const wait = line("quiet working", "Looking across CATS, HubSpot and mail.");
  mount.appendChild(wait);
  const t0 = Date.now();
  const slow = setTimeout(() => { wait.textContent = "Still looking. Large companies take longer."; }, 10000);
  const card = await read({ p_query: query || null, p_person: person ?? null });
  clearTimeout(slow);
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
  mount.appendChild(line("a-title", ctx.countOf(c.matches) + " people have exactly this name. Which one?"));
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
  const n = ctx.el("h3"); n.textContent = title; h.appendChild(n);
  if (sub) h.appendChild(line("quiet", sub));
  h.appendChild(line("quiet", "As of " + new Date(asOf ?? Date.now()).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + (ms ? ", read in " + (ms / 1000).toFixed(1) + " s" : "") + "."));
  mount.appendChild(h);
}

function factsTable(facts) {
  const wrap = ctx.el("div", "sp-grid-wrap");
  const tbl = ctx.el("table", "sp-grid");
  const tb = ctx.el("tbody");
  for (const k of ["title", "employer", "location", "status", "stage", "left_company", "email", "phone", "skills"]) {
    const v = facts?.[k]; if (!v) continue;
    const rows = Array.isArray(v) ? v : [v];
    rows.forEach((r, i) => {
      const tr = ctx.el("tr", r.stale ? "sp-wide" : "");
      const th = ctx.el("th"); th.scope = "row"; th.textContent = i ? "" : (FACT_WORDS[k] ?? k); tr.appendChild(th);
      const val = ctx.el("td"); val.textContent = String(r.value ?? ""); tr.appendChild(val);
      const src = ctx.el("td"); src.textContent = [r.source, day(r.at)].filter(Boolean).join(", "); tr.appendChild(src);
      const flag = ctx.el("td");
      const notes = [];
      if (r.stale) notes.push("Old: more than a year ago, may have changed");
      if (r.owner_said) notes.push("You had set " + r.owner_said.value + " on " + day(r.owner_said.at) + "; this is newer");
      if (Array.isArray(r.also) && r.also.length) notes.push("Also said: " + r.also.map((a) => a.value + " (" + a.source + ", " + day(a.at) + ")").join("; "));
      flag.textContent = notes.join(". "); tr.appendChild(flag);
      tb.appendChild(tr);
    });
  }
  tbl.appendChild(tb); wrap.appendChild(tbl);
  return wrap;
}

function lines(title, rows, render) {
  if (!rows?.length) return;
  mount.appendChild(line("a-title", title));
  const ul = ctx.el("ul", "attn");
  for (const r of rows) { const li = ctx.el("li"); li.appendChild(line("a-detail", render(r))); ul.appendChild(li); }
  mount.appendChild(ul);
}

function refusedLines(c) {
  const m = c.mail ?? {};
  if (Number(m.refused ?? 0)) mount.appendChild(line("quiet", ctx.countOf(m.refused) + " emails are in mailboxes you cannot open: " + String(m.refused_reason ?? "").replace("refused: ", "") + "."));
  const h = c.history ?? {};
  if (Number(h.refused ?? 0)) mount.appendChild(line("quiet", ctx.countOf(h.refused) + " records are in systems you cannot open: " + String(h.refused_reason ?? "").replace("refused: ", "") + "."));
  if (Number(c.refused?.records ?? 0)) mount.appendChild(line("quiet", ctx.countOf(c.refused.records) + " of their records are not open to you: " + (c.refused.reasons ?? []).map((r) => String(r).replace("refused: ", "")).join("; ") + "."));
  if (c.not_read) mount.appendChild(line("quiet", String(c.not_read)));
}

function lastContact(c) {
  if (!c.last_contact?.at) { mount.appendChild(line("quiet", "No dated contact found in what you can see.")); return; }
  mount.appendChild(line("notice", "Last contact " + ago(c.last_contact.days_ago) + ", " + day(c.last_contact.at) + ", by " + c.last_contact.channel + "."));
}

function drawPerson(c, ms) {
  const sub = [(c.roles ?? []).join(" · "), c.people_joined > 1 ? "one person across " + c.people_joined + " records (" + (c.joined_by ?? []).join(", ") + ")" : "", c.from_mail_only ? "known from mail only" : ""].filter(Boolean).join(" · ");
  head(c.name, sub, ms, c.as_of);
  lastContact(c);
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

  if (c.facts && Object.keys(c.facts).length) { mount.appendChild(line("a-title", "Who they are now")); mount.appendChild(factsTable(c.facts)); }
  if ((c.holders ?? []).length) mount.appendChild(line("quiet", "Who here holds the relationship: " + c.holders.map((h) => h.who + (h.messages ? " (" + ctx.countOf(h.messages) + " emails)" : "") + (h.in ? " (owner in " + h.in + ")" : "")).join("; ") + "."));

  lines("What was done with them (newest first)", c.history?.lines, (l) => day(l.at) + " · " + sourceOf(l.source) + " · " + l.line);
  const m = c.mail ?? {};
  lines("Mail (" + ctx.countOf(m.shown ?? 0) + " newest of " + ctx.countOf(m.found ?? 0) + ")", m.lines, (l) => day(l.at) + " · " + l.mailbox + (l.direction ? " · " + l.direction : "") + " · " + l.line);

  if ((c.maybe_same ?? []).length) {
    mount.appendChild(line("a-title", "Possibly the same person"));
    mount.appendChild(line("quiet", "Not joined on their own: only an email address joins records. Say whether they are the same."));
    const ul = ctx.el("ul", "attn");
    for (const p of c.maybe_same) {
      const li = ctx.el("li");
      li.appendChild(line("a-detail", [p.evidence, "in " + p.in, p.title, p.employer ? "at " + p.employer : ""].filter(Boolean).join(", ")));
      if (ctx.isOwner()) {
        const row = ctx.el("div", "actions");
        for (const [same, label] of [[true, "Same person"], [false, "Not the same"]]) {
          const b = ctx.el("button", "go ghost"); b.type = "button"; b.textContent = label;
          b.addEventListener("click", async () => {
            const said = line("quiet working", "Keeping your answer."); row.replaceChildren(said);
            const { data, error } = await ctx.sb.rpc("contact_same_set", { p_a: c.person, p_b: p.person, p_same: same, p_evidence: p.evidence });
            said.className = "quiet"; said.textContent = error ? "Not kept: " + error.message : (data?.note ?? data?.reason ?? "");
            if (!error && data?.ok && same) find("", c.person);
          });
          row.appendChild(b);
        }
        li.appendChild(row);
      }
      ul.appendChild(li);
    }
    mount.appendChild(ul);
  }
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
  const t = c.history?.totals ?? {};
  const said = [["jobs", "jobs"], ["put_forward_per_older_job_records", "people put forward (older job records)"], ["pipeline_entries", "people in the pipeline"], ["contacts", "contacts"], ["activities", "logged calls, emails and meetings"]]
    .filter(([k]) => Number(t[k] ?? 0) > 0).map(([k, w]) => ctx.countOf(t[k]) + " " + w);
  if (said.length) mount.appendChild(line("quiet", "Found: " + said.join(", ") + "."));
  const act = ctx.el("div", "actions");
  const who = ctx.el("button", "go"); who.type = "button"; who.textContent = "Who do we know here?";
  who.addEventListener("click", () => ctx.ask("Who do we know at " + co.name + ", and what is the best way in?"));
  act.appendChild(who); mount.appendChild(act);

  const p = c.people ?? {};
  mount.appendChild(line("a-title", "People we know there (" + ctx.countOf(p.shown ?? 0) + ")"));
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
  lines("What was done with them (newest first)", c.history?.lines, (l) => day(l.at) + " · " + sourceOf(l.source) + " · " + l.line);
  const m = c.mail ?? {};
  if ((m.lines ?? []).length) lines("Mail (" + ctx.countOf(m.shown ?? 0) + " newest of " + ctx.countOf(m.found ?? 0) + ")", m.lines, (l) => day(l.at) + " · " + l.mailbox + " · " + l.line);
  else if (m.matched_by) mount.appendChild(line("quiet", "Mail: " + m.matched_by + "."));
  refusedLines(c);
}

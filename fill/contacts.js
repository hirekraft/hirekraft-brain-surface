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
//
// Seat contacts-match (2026-10-23, decisions 1002, 1011, 1012): the card is built with no AI at all. Records that may be
// the same person are found by matching (the same phone number, the same LinkedIn profile, names that differ only by
// accents, the owner's own address book) and each one asks "Same person? Yes / No"; her answer is kept and becomes a rule
// (a No on two people sharing only a phone number marks that number as shared). The card now also shows the conversations
// both ways (what the business wrote too), money items from the books, and a plain list of what is not read or not
// matched yet. "Summarize these" is the one place an AI reads anything here, only when she presses it, over exactly the
// conversations shown.

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
  what.appendChild(line("quiet", "Type a name, an email address or a company. The Tool searches every connected system the way you would by hand: CATS, HubSpot, every mailbox, every drive, Slack and brought-in chats, by the exact name and every address it knows. It shows the newest of each fact with where and when it came from, says when two sources disagree or a fact is old, and puts everything that happened in one timeline. Records that may be the same person (the same phone number, the same LinkedIn profile, the same name written differently) are matched and shown with a Same person? Yes / No; nothing is joined on a suggestion alone, and your answer is kept. Your own address book counts as your word. No AI is used to build the card."));
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

// POSSIBLY THE SAME PERSON (seat contacts-match): every record or address the matching found, strongest first, each with
// what it rests on, and one small question each: "Same person? Yes / No". Her answer is kept and never asked again; a Yes
// puts them on one card, a No keeps them apart (and a No on two records sharing only a phone number marks that number as
// shared, so it never suggests anyone again). Only the owner answers; nothing is joined on a suggestion alone.
const STRENGTH_WORDS = { sure: "The same person", strong: "Likely the same person", medium: "Possibly the same person",
  weak: "Probably not the same person", "name only": "Only the name is the same" };
function maybeSame(c) {
  const rows = c.maybe_same ?? [];
  if (!rows.length) return;
  mount.appendChild(head4("Same person? (" + rows.length + ")"));
  const owner = ctx.isOwner() && c.person;
  mount.appendChild(line("quiet", owner ? "Found by matching across your systems, strongest first. Your answer is kept, and is never asked again."
                                         : "Found by matching across your systems. Only the owner can say whether they are the same person."));
  const ul = ctx.el("ul", "members");
  for (const p of rows) {
    const li = ctx.el("li"); li.style.padding = "calc(var(--u) * 1) 0"; li.style.borderTop = "1px solid var(--line-2)";
    const who = (p.kind === "mail" ? String(p.address ?? "") : [p.title, p.employer ? "at " + p.employer : "", p.in ? "in " + p.in : ""].filter(Boolean).join(", "));
    li.appendChild(line("", [STRENGTH_WORDS[p.strength] ?? "", who].filter(Boolean).join(": ")));
    if (p.evidence) li.appendChild(line("quiet", "Why: " + p.evidence + "."));
    if (owner) {
      const act = ctx.el("div", "actions"); act.style.display = "flex"; act.style.gap = "var(--u)"; act.style.flexWrap = "wrap";
      const ask = ctx.el("span", "quiet"); ask.textContent = "Same person?"; ask.style.alignSelf = "center";
      const yes = ctx.el("button", "go"); yes.type = "button"; yes.textContent = "Yes";
      const no = ctx.el("button", "go ghost"); no.type = "button"; no.textContent = "No";
      const answer = async (same) => {
        yes.disabled = true; no.disabled = true;
        const said = line("quiet working", "Keeping your answer."); act.replaceChildren(said);
        let r = null;
        try {
          const call = p.kind === "mail"
            ? ctx.sb.rpc("contact_join", same ? { p_person: c.person, p_addresses: p.addresses ?? [p.address] } : { p_person: c.person, p_not_addresses: p.addresses ?? [p.address] })
            : ctx.sb.rpc("contact_same_set", { p_a: c.person, p_b: p.person, p_same: same, p_evidence: (same ? "Yes" : "No") + " from the card: " + (p.evidence ?? "") });
          const { data, error } = await call;
          r = error ? { ok: false, note: "Not kept: " + error.message } : data;
        } catch (e) { r = { ok: false, note: "Not kept: " + String(e?.message ?? e) }; }
        said.className = "quiet"; said.textContent = String(r?.note ?? r?.reason ?? "");
        if (r?.ok && same) setTimeout(() => find("", c.person), 600);
      };
      yes.addEventListener("click", () => answer(true));
      no.addEventListener("click", () => answer(false));
      act.append(ask, yes, no);
      li.appendChild(act);
    }
    ul.appendChild(li);
  }
  mount.appendChild(ul);
}

// CONVERSATIONS BOTH WAYS (seat contacts-match): the brain's one conversation gatherer, by every address the card knows,
// so what the business wrote shows beside what they wrote. Newest conversation first; each says who wrote last. One press
// asks an AI to summarize exactly these, and only then is anything read by an AI.
function conversations(c, about) {
  const v = c.conversations;
  if (!v || !Array.isArray(v.threads)) return;
  mount.appendChild(head4("Conversations (newest first)"));
  if (!v.threads.length) { mount.appendChild(line("quiet", String(v.note ?? "No email conversations with them in the last 12 months in what you can see."))); return; }
  mount.appendChild(line("quiet", ctx.countOf(v.messages_found ?? 0) + " messages in " + ctx.countOf(v.threads_found ?? v.threads.length) + " conversations over the last 12 months, both what they wrote and what your side wrote."));
  const ul = ctx.el("ul", "members");
  for (const t of v.threads) {
    const li = ctx.el("li"); li.style.padding = "calc(var(--u) * 1) 0"; li.style.borderTop = "1px solid var(--line-2)";
    const span = t.from && t.to && day(t.from) !== day(t.to) ? day(t.from) + " to " + day(t.to) : day(t.to ?? t.from);
    li.appendChild(line("", String(t.thread ?? "(no subject)")));
    li.appendChild(line("quiet", [span, ctx.countOf(t.messages ?? 0) + (Number(t.messages) === 1 ? " message" : " messages"),
      t.newest_by ? "last " + t.newest_by : "", Number(t.mailboxes ?? 0) > 1 ? "in " + ctx.countOf(t.mailboxes) + " mailboxes" : ""].filter(Boolean).join(" · ")));
    if (t.opening) li.appendChild(line("quiet", String(t.opening).slice(0, 240) + (String(t.opening).length >= 240 ? "..." : "")));
    ul.appendChild(li);
  }
  mount.appendChild(ul);
  if (!ctx.askBody || !ctx.renderAsk) return;
  const act = ctx.el("div", "actions");
  const sum = ctx.el("button", "go ghost"); sum.type = "button"; sum.textContent = "Summarize these";
  const out = ctx.el("div"); out.setAttribute("aria-live", "polite");
  sum.addEventListener("click", async () => {
    sum.disabled = true;
    const wait = line("answer-wait working", "An AI is reading the " + v.threads.length + (v.threads.length === 1 ? " conversation" : " conversations") + " shown, and nothing else.");
    out.replaceChildren(wait);
    const slow = setTimeout(() => { wait.textContent += " Still reading: longer conversations take a little more time."; }, 10000);
    let res = null;
    try {
      res = await ctx.askBody({ question: "Summarize my conversations with " + about, over: { ask: "summarize",
        items: v.threads.map((t) => ({ key: "thread:" + t.thread, kind: "email", what: "Email conversation", title: t.thread, where: "Mail", date: t.to, piece_ids: t.piece_ids ?? [] })) } });
    } catch (e) { res = { ok: false, error: String(e?.message ?? e) }; }
    clearTimeout(slow);
    sum.disabled = false;
    out.replaceChildren();
    if (!res || res.ok !== true) { out.appendChild(line("notice flagged", res?.error || "That could not be done just now. Press it again.")); return; }
    ctx.renderAsk(out, res, { q: "Summarize my conversations with " + about });
  });
  act.appendChild(sum);
  mount.appendChild(act);
  mount.appendChild(out);
}

// MONEY ITEMS (seat contacts-match): what the books kept in the Tool say is open with them, and what the matching found
// (a payment on the wrong invoice, corrected or not). Only people QuickBooks lets see the books see this; for anyone else
// the not-yet list says how many were kept out and why.
const money = (n, cur) => { const x = Number(n); if (!Number.isFinite(x)) return String(n ?? "");
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: cur || "USD" }).format(x); } catch (_) { return x.toFixed(2); } };
const KIND_WORDS = { invoice: "Invoice", bill: "Bill to pay", "credit memo": "Credit memo" };
function moneyItems(c) {
  const m = c.money;
  if (!m || (!(m.open ?? []).length && !(m.findings ?? []).length)) return;
  mount.appendChild(head4("Money (from your books)"));
  const ul = ctx.el("ul", "members");
  for (const o of m.open ?? []) {
    const li = ctx.el("li"); li.style.padding = "calc(var(--u) * 1) 0"; li.style.borderTop = "1px solid var(--line-2)";
    const t = [KIND_WORDS[o.kind] ?? o.kind, o.number ? String(o.number) : "", "open " + money(o.balance, o.currency) + (o.total && o.total !== o.balance ? " of " + money(o.total, o.currency) : ""),
      o.due ? "due " + day(o.due) : "", o.overdue ? "overdue" : ""].filter(Boolean).join(", ");
    if (o.url) { const a = ctx.el("a"); a.href = o.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = t; li.appendChild(a); } else li.textContent = t;
    ul.appendChild(li);
  }
  for (const f of m.findings ?? []) {
    const li = ctx.el("li"); li.style.padding = "calc(var(--u) * 1) 0"; li.style.borderTop = "1px solid var(--line-2)";
    li.textContent = (f.open ? "To look at: " : "Settled: ") + String(f.finding ?? f.kind) + (f.checked_at ? " (checked " + day(f.checked_at) + ")" : "");
    ul.appendChild(li);
  }
  mount.appendChild(ul);
  if (m.books_read) mount.appendChild(line("quiet", "Your books were last read " + fmtDate(m.books_read, "whenShort") + ". QuickBooks stays the record."));
}

function notYet(c) {
  const rows = (c.not_yet ?? []).filter(Boolean);
  if (!rows.length) return;
  mount.appendChild(head4("Not read or not matched yet"));
  const ul = ctx.el("ul", "members");
  for (const r of rows) { const li = ctx.el("li"); li.className = "quiet"; li.textContent = String(r); ul.appendChild(li); }
  mount.appendChild(ul);
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
  conversations(c, c.name);
  moneyItems(c);
  if ((c.holders ?? []).length) mount.appendChild(line("quiet", "Who here holds the relationship: " + c.holders.map((h) => h.who + (h.messages ? " (" + ctx.countOf(h.messages) + " emails)" : "") + (h.in ? " (owner in " + h.in + ")" : "")).join("; ") + "."));

  mount.appendChild(head4("Everything that happened (newest first)"));
  // Older cards carried no timeline: build one from the parts they have, so nothing is left out.
  const rows = Array.isArray(c.timeline) ? c.timeline : [].concat(
    (c.history?.lines ?? []).map((l) => ({ at: l.at, where: sourceOf(l.source), what: l.line })),
    (c.mail?.lines ?? []).map((l) => ({ at: l.at, where: "Mail (" + l.mailbox + ")", what: [l.direction, l.line].filter(Boolean).join(": ") }))
  ).sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
  timeline(rows);
  notYet(c);
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
  const aka = (co.also_called ?? []).filter((n) => n && n !== co.name);
  if (aka.length) mount.appendChild(line("quiet", "Also known as " + aka.join(", ") + " (the same web address)."));
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
  conversations(c, co.name);
  moneyItems(c);
  mount.appendChild(head4("Everything that happened (newest first)"));
  const m = c.mail ?? {};
  const rows = [].concat(
    (c.history?.lines ?? []).map((l) => ({ at: l.at, where: sourceOf(l.source), what: l.line })),
    (m.lines ?? []).map((l) => ({ at: l.at, where: "Mail (" + l.mailbox + ")", what: l.line })),
    (c.conversations?.messages ?? []).filter((l) => l.direction === "from your side").map((l) => ({ at: l.at, where: "Mail (" + l.mailbox + ")", what: "from your side: " + l.thread }))
  ).sort((a, b) => String(b.at ?? "").localeCompare(String(a.at ?? "")));
  timeline(rows);
  if (!(m.lines ?? []).length && m.matched_by) mount.appendChild(line("quiet", "Mail: " + m.matched_by + "."));
  notYet(c);
  if (c.not_read) mount.appendChild(line("quiet", String(c.not_read)));
  refusedLines(c);
}

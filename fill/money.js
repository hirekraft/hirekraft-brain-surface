// fill/money.js - THE MONEY TAB (seat runway, Alex 2026-10-10: "how much do we have, how much longer can we go...
// what goes out, what have we signed up for, what subscriptions")
//
// Capability "How long can we go, and what am I paying for?". Mechanisms: COMPOSE (in the brain and its functions:
// money-runway works out cash, spend and months left from LIVE readings of Mercury, Wise and QuickBooks through
// system-read with the owner's own sign-in; money_commitments keeps the regular bills seen in the mail) and SHOW (this
// file). This file computes nothing and decides nothing: every figure is the server's, every row says where it came
// from. A part that cannot be shown says why; refused is never drawn as empty.
// 2026-10-12: exports were never used (Alex 2026-10-11: no exports); the runway reads the bank and the books live. The
// box answers the same questions from the same two functions (lens-ask tools runway and subscriptions).
//
// PARTS, top to bottom: owed to you (seat books-truth-2: what the books say, what we believe, clean up the books), how long we can go, what we pay for, where we stand with each contractor (#money-ledger, drawn
// by seat contractor-ledger; this file leaves that mount alone), and what was not read.

import { fmtDate } from "./dates.js?v=2026-10-22-dates";
let ctx = null;   // { sb, el, $, countOf, zone }
let last = null;  // money_commitments
let run = null;   // money-runway
let owed = null;  // books_truth (seat books-truth-2)

const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const note = (mount, text, flagged) => mount.appendChild(line(flagged ? "notice flagged" : "quiet", text));
const money = (n) => n == null ? "" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const whole = (n) => n == null ? "" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });   // a big figure on a tile, whole dollars
const cur = (n, c) => n == null ? "" : Number(n).toLocaleString("en-US", { style: "currency", currency: c || "USD" });
const day = (d) => fmtDate(d, "day");
const when = (t) => fmtDate(t, "whenShort");

export function initMoney(c) { ctx = c; }

async function readRunway() {
  try {
    const { data, error } = await ctx.sb.functions.invoke("money-runway", { body: {} });
    if (!error) return data;
    let body = null; try { body = await error.context?.json?.(); } catch (_) { body = null; }
    return body ?? { ok: false, note: "How long the business can go could not be worked out: " + String(error.message ?? error) };
  } catch (e) { return { ok: false, note: "How long the business can go could not be worked out: " + String(e?.message ?? e) }; }
}
async function readCommitments() {
  try {
    const { data, error } = await ctx.sb.rpc("money_commitments");
    if (error) throw error;
    return data;
  } catch (e) {
    const msg = String(e?.message ?? e);
    return { ok: false, note: msg.includes("Could not find the function")
      ? "This part is not switched on yet: one change to the brain is waiting to be applied."
      : "What the business pays for could not be read, so nothing here is known: " + msg };
  }
}

export async function loadMoney() {
  for (const id of ["#money-owed", "#money-runway", "#money-commitments"]) {
    const m = ctx.$(id); if (m && !m.childElementCount) m.appendChild(line("quiet working", "Reading the bank and the books."));
  }
  const [r, c, o] = await Promise.all([readRunway(), readCommitments(), readOwed()]);
  run = r; last = c; owed = o;
  drawOwed(); drawRunway(); drawCommitments(); drawNotRead();
}

// ── owed to you (seat books-truth-2, 2026-11-02, decision 1063 part 1) ───────
// What the books say beside what the Tool believes, one line on the gap, why behind a press, and the clean-up list. Every
// figure and every item is the brain's (books_truth: records match over the kept QuickBooks copy and the mail); this file
// draws and passes the owner's press to system-read action books_fix: "Check in QuickBooks" reads only, "Fix in QuickBooks"
// writes, then reads QuickBooks back. Nothing is written without that second press. An item to decide has no Fix.
async function readOwed() {
  try {
    const { data, error } = await ctx.sb.rpc("books_truth");
    if (error) throw error;
    return data;
  } catch (e) {
    const msg = String(e?.message ?? e);
    return { ok: false, note: msg.includes("Could not find the function")
      ? "This part is not switched on yet: one change to the brain is waiting to be applied."
      : "What you are owed could not be worked out, so nothing here is known: " + msg };
  }
}
async function booksFix(id, mode) {
  try {
    const { data, error } = await ctx.sb.functions.invoke("system-read", { body: { action: "books_fix", finding_id: id, mode } });
    if (!error) return data;
    let body = null; try { body = await error.context?.json?.(); } catch (_) { body = null; }
    return body ?? { ok: false, reason: "QuickBooks could not be reached: " + String(error.message ?? error) };
  } catch (e) { return { ok: false, reason: "QuickBooks could not be reached: " + String(e?.message ?? e) }; }
}
function lines(mount, list, cls) { const ul = ctx.el("ul", "attn"); for (const t of list ?? []) { const li = ctx.el("li"); li.appendChild(line(cls ?? "a-detail", t)); ul.appendChild(li); } mount.appendChild(ul); }

function owedCard(it) {
  const box = ctx.el("div", "notice" + (it.state === "to_decide" ? " flagged" : ""));
  const t = ctx.el("p"); const b = ctx.el("b"); b.textContent = it.title; t.appendChild(b); box.appendChild(t);
  box.appendChild(line("", it.line));
  if (it.state === "to_decide") box.appendChild(line("quiet", "To decide. " + it.what_fix_does));
  const d = ctx.el("details", "recs");
  const s = ctx.el("summary", "recs-sum"); s.textContent = "See the Detail"; d.appendChild(s);
  d.appendChild(line("a-title", "What QuickBooks says now")); d.appendChild(line("a-detail", it.books_now));
  if ((it.sources ?? []).length) {
    d.appendChild(line("a-title", "What the mail shows"));
    const ul = ctx.el("ul", "attn");
    for (const m of it.sources) {
      const li = ctx.el("li");
      const p = line("a-detail", day(m.date) + ", " + (m.from ?? "") + ": " + m.why + ". ");
      const a = ctx.el("a"); a.href = gmailLink(m); a.target = "_blank"; a.rel = "noopener"; a.textContent = "Open the Email";
      p.appendChild(a); li.appendChild(p); ul.appendChild(li);
    }
    d.appendChild(ul);
  }
  const inv = it.invoices ?? [];
  if (inv.length) {
    d.appendChild(line("a-title", it.state === "to_decide" ? "Where It Stands" : "What the Fix Changes"));
    d.appendChild(table(["", "Open Now", it.state === "to_decide" ? "Open After the Payment" : "Open After"],
      inv.map((x) => [x.doc, money(x.now), money(x.after ?? x.after_payment)])));
  }
  if (it.what_fix_does && it.state !== "to_decide") d.appendChild(line("a-detail", it.what_fix_does));
  if (it.books_link) { const a = ctx.el("a"); a.href = it.books_link; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Open it in QuickBooks"; const p = ctx.el("p", "quiet"); p.appendChild(a); d.appendChild(p); }
  box.appendChild(d);
  if (it.state !== "fix") return box;
  // the owner's two presses: check (reads only), then fix (writes and reads back)
  const acts = ctx.el("div", "actions");
  const out = ctx.el("div"); out.setAttribute("aria-live", "polite");
  const check = ctx.el("button", "go ghost"); check.type = "button"; check.textContent = "Check in QuickBooks";
  check.addEventListener("click", async () => {
    check.disabled = true; out.innerHTML = ""; out.appendChild(line("quiet working", "Reading QuickBooks."));
    const r = await booksFix(it.id, "check");
    out.innerHTML = ""; check.disabled = false;
    if (!r?.ok) { note(out, r?.reason ?? "QuickBooks could not be checked.", true); return; }
    out.appendChild(line("a-title", "Checked in QuickBooks just now"));
    // decision 1068 (1), seat rulings-1068: the account the money goes into, by name, before the Fix press
    if (r.into?.name) { const p = line("a-detail", ""); const b2 = ctx.el("b"); b2.textContent = "Goes into: " + r.into.name; p.appendChild(b2); p.appendChild(document.createTextNode(r.into.how ? ", " + r.into.how + "." : ".")); out.appendChild(p); }
    lines(out, r.lines);
    const fix = ctx.el("button", "go"); fix.type = "button"; fix.textContent = "Fix in QuickBooks";
    out.appendChild(line("quiet", "Nothing is written until you press Fix."));
    fix.addEventListener("click", async () => {
      fix.disabled = true; check.disabled = true;
      const w = line("quiet working", "Writing to QuickBooks, then reading it back."); out.appendChild(w);
      const a = await booksFix(it.id, "apply");
      w.remove();
      if (a?.ok) { out.appendChild(line("a-title", "Done. QuickBooks was changed and read back.")); lines(out, (a.lines ?? []).filter((x) => x.startsWith("Read back"))); }
      else { note(out, (a?.reason ?? "The fix did not go through.") + " Nothing else was changed.", true); lines(out, (a?.lines ?? []).filter((x) => !x.startsWith("Invoice") && !x.startsWith("Credit"))); fix.disabled = false; check.disabled = false; }
    });
    out.appendChild(fix);
  });
  acts.appendChild(check); box.appendChild(acts); box.appendChild(out);
  return box;
}

function drawOwed() {
  const mount = ctx.$("#money-owed"); if (!mount) return;
  mount.innerHTML = "";
  if (!owed?.ok) { note(mount, refusedText(owed, "What you are owed could not be shown"), true); return; }
  const gap = Number(owed.gap ?? 0);
  const row = ctx.el("div", "sp-gauges");
  row.appendChild(tile(whole(owed.books), "Your Books Say", ctx.countOf(owed.open_invoices) + " open invoices, " + ctx.countOf(owed.past_due) + " past due"));
  row.appendChild(tile(whole(owed.believed), "We Believe", gap > 0 ? "less money that arrived" : "the same as your books"));
  mount.appendChild(row);
  mount.appendChild(line("", gap > 0
    ? money(gap) + " has arrived that QuickBooks does not show yet, so your books say you are owed more than you are."
    : "Your books and your mail agree on what you are owed."));
  const items = owed.cleanup ?? [];
  const why = ctx.el("details", "recs");
  const s = ctx.el("summary", "recs-sum"); s.textContent = "Why the Two Differ"; why.appendChild(s);
  const less = items.filter((i) => Number(i.lowers_owed) > 0);
  if (less.length) lines(why, less.map((i) => i.line + " Owed falls by " + money(i.lowers_owed) + " when it is recorded."));
  why.appendChild(line("quiet", owed.how));
  why.appendChild(line("quiet", "Books as kept " + when(owed.books_as_of) + (owed.checked_at ? "; matched with the mail " + when(owed.checked_at) : "") + "."));
  mount.appendChild(why);
  mount.appendChild(line("a-title", items.length ? "Clean up the books: " + items.length : "Clean up the books: nothing to do"));
  for (const it of items) mount.appendChild(owedCard(it));
  const done = owed.fixed_lately ?? [];
  if (done.length) {
    const d = ctx.el("details", "recs");
    const s2 = ctx.el("summary", "recs-sum"); s2.textContent = "Fixed Lately (" + done.length + ")"; d.appendChild(s2);
    lines(d, done.map((x) => day(x.fixed_at) + ": " + x.line));
    mount.appendChild(d);
  }
}

function refusedText(x, fallback) { return x?.note ?? fallback + (x?.reason ? " (" + x.reason + ")" : "") + "."; }

// ── how long we can go ───────────────────────────────────────────────────────
function tile(n, words, sub, red) {
  const b = ctx.el("div", "sp-gauge" + (red ? " sp-red" : ""));
  b.appendChild(line("sp-n", n));
  b.appendChild(line("sp-w", words));
  if (sub) b.appendChild(line("sp-s", sub));
  return b;
}
function table(heads, rows) {
  const wrap = ctx.el("div", "sp-grid-wrap");
  const tbl = ctx.el("table", "sp-grid");
  const hr = ctx.el("tr");
  for (const h of heads) { const th = ctx.el("th"); th.scope = "col"; th.textContent = h; hr.appendChild(th); }
  const thead = ctx.el("thead"); thead.appendChild(hr); tbl.appendChild(thead);
  const tb = ctx.el("tbody");
  for (const r of rows) {
    const tr = ctx.el("tr");
    r.forEach((c, i) => { const td = ctx.el(i ? "td" : "th"); if (!i) td.scope = "row"; td.textContent = c ?? ""; tr.appendChild(td); });
    tb.appendChild(tr);
  }
  tbl.appendChild(tb); wrap.appendChild(tbl);
  return wrap;
}

function drawRunway() {
  const mount = ctx.$("#money-runway"); if (!mount) return;
  mount.innerHTML = "";
  if (!run?.ok) { note(mount, refusedText(run, "How long the business can go could not be shown"), true); return; }
  const rw = run.runway, b = run.burn, bk = run.books;

  const row = ctx.el("div", "sp-gauges");
  if (rw?.cash_only) row.appendChild(tile(String(rw.cash_only.months), "Months at today's spend, on the cash in the bank", "", rw.cash_only.months < 6));
  else row.appendChild(tile("?", "Months left", "Not worked out: see What Was Not Read", true));
  if (rw?.after_collecting_and_paying) row.appendChild(tile(String(rw.after_collecting_and_paying.months), "Months after collecting what we are owed and paying what we owe", ""));
  row.appendChild(tile(run.cash == null ? "?" : money(run.cash), "Cash in the bank now", run.cash == null ? "The bank could not be read" : (run.cash_as_posted ? money(run.cash_bank_own) + " from the banks read live, " + money(run.cash_as_posted) + " as posted in QuickBooks" : "The banks' own figures") + ", " + when(run.as_of), run.cash == null));
  if (b) row.appendChild(tile(money(b.continuing), "Spend a month that continues", "Operating expenses, " + (b.averaged_over ?? []).join(", ")));
  mount.appendChild(row);

  if (rw?.cash_only) note(mount, "How it is worked out: " + rw.cash_only.arithmetic + "." + (rw.after_collecting_and_paying ? " With what is owed: " + rw.after_collecting_and_paying.arithmetic + "." : ""));
  if (b?.stops) note(mount, "With the contractors gone, their billing (" + money(b.stops.income) + " a month) and their pay (" + money(b.stops.cost_of_sales) + " a month) both end, so the spend that continues is the operating expenses. " + b.stops.assumption, true);

  // cash in the bank
  const bankRows = (run.bank_accounts ?? []).map((a) => [a.system + " " + a.name + (a.ending ? " ending " + a.ending : ""),
    a.currency && a.currency !== "USD" ? cur(a.current, a.currency) : money(a.current), a.available != null ? money(a.available) : "", !a.counted ? "not counted (not dollars)" : a.figure === "books" ? "as posted in QuickBooks; this bank is not read live" : "the bank's own figure"]);
  if (bankRows.length) { mount.appendChild(line("a-title", "Cash, account by account")); mount.appendChild(table(["Account", "Current Balance", "Available", ""], bankRows)); }

  // the books, beside
  if (bk) {
    mount.appendChild(line("a-title", "The books (QuickBooks, as posted" + (bk.as_of ? ", " + day(bk.as_of) : "") + ")"));
    mount.appendChild(table(["", "The Books"], [["Bank Accounts as Booked", money(bk.bank)], ["Owed to Us (Open Invoices)", money(bk.owed_to_us)], ["Owed by Us (Unpaid Bills)", money(bk.owed_by_us)], ["Credit Cards", money(bk.credit_cards)]]));
  }

  // monthly spend
  if (b) {
    mount.appendChild(line("a-title", "Monthly spend (QuickBooks, by month)"));
    mount.appendChild(table(["Month", "Income", "Cost of Sales", "Expenses", "Other Expenses"],
      (b.months ?? []).map((m) => [m.month, money(m.income), money(m.cost_of_sales), money(m.expenses), money(m.other_expenses)])));
    note(mount, "Averaged over " + (b.averaged_over ?? []).join(", ") + ": income " + money(b.income) + ", cost of sales " + money(b.cost_of_sales) + ", expenses " + money(b.expenses) + ", other " + money(b.other_expenses) + ". Spend now " + money(b.spend_now) + " a month; continuing " + money(b.continuing) + ".");
    if ((b.largest_lines ?? []).length) {
      const d = ctx.el("details", "recs");
      const s = ctx.el("summary", "recs-sum"); s.textContent = "Largest Expense Lines, a Month (Tell the Box If Any of These Also Stop with the Contractors)"; d.appendChild(s);
      d.appendChild(table(["Line", "A Month"], b.largest_lines.map((l) => [l.name, money(l.monthly)])));
      mount.appendChild(d);
    }
  }
  if (run.subscriptions_from_mail) note(mount, "Of that spend, " + ctx.countOf(run.subscriptions_from_mail.count) + " regular bills seen in the mail come to about " + money(run.subscriptions_from_mail.monthly) + " a month (listed below; part of the spend above, not added to it).");
  if (run.personal_card_spend?.note) note(mount, run.personal_card_spend.note);
  const src = (run.sources ?? []).map((s) => s.system + " " + s.what + (s.read_at ? " (" + when(s.read_at) + ")" : ""));
  if (src.length) note(mount, "Read live just now: " + src.join("; ") + ".");
  note(mount, "Ask the box: how long can we go?");
}

// ── what we pay for ──────────────────────────────────────────────────────────
function gmailLink(e) {
  const box = String(e.mailbox ?? "").split(":")[1] ?? "";
  return "https://mail.google.com/mail/?authuser=" + encodeURIComponent(box) + "#all/" + encodeURIComponent(e.mail_id);
}

function commitmentTable(rows) {
  const wrap = ctx.el("div", "sp-grid-wrap");
  const tbl = ctx.el("table", "sp-grid");
  const heads = ["Who Bills", "How Often", "Last Charge", "Usual", "Card", "Next Expected", "", "From the Emails"];
  const hr = ctx.el("tr");
  for (const h of heads) { const th = ctx.el("th"); th.scope = "col"; th.textContent = h; hr.appendChild(th); }
  const thead = ctx.el("thead"); thead.appendChild(hr); tbl.appendChild(thead);
  const tb = ctx.el("tbody");
  for (const r of rows) {
    const tr = ctx.el("tr", r.state === "looks stopped" ? "sp-wide" : "");
    const th = ctx.el("th"); th.scope = "row"; th.textContent = r.sender; tr.appendChild(th);
    const cells = [
      r.cadence,
      r.last_charge ? money(r.last_amount) + " on " + day(r.last_charge) : "No amount in the emails" + (r.last_mail ? " (last bill " + day(r.last_mail) + ")" : ""),
      r.usual_amount != null && Number(r.usual_amount) !== Number(r.last_amount) ? money(r.usual_amount) : "",
      r.card_last4 ? "ending " + r.card_last4 : "",
      r.state === "active" && r.next_expected ? day(r.next_expected) : "",
      r.state === "looks stopped" ? "Looks stopped: no bill since " + day(r.last_mail) : "",
    ];
    for (const c of cells) { const td = ctx.el("td"); td.textContent = c ?? ""; tr.appendChild(td); }
    const ev = ctx.el("td");
    (r.evidence ?? []).forEach((e, i) => {
      const a = ctx.el("a"); a.href = gmailLink(e); a.target = "_blank"; a.rel = "noopener";
      a.textContent = day(e.date) + (e.amount != null ? " " + money(e.amount) : "");
      if (i) ev.appendChild(document.createTextNode(", "));
      ev.appendChild(a);
    });
    tr.appendChild(ev);
    tb.appendChild(tr);
  }
  tbl.appendChild(tb); wrap.appendChild(tbl);
  return wrap;
}

function drawCommitments() {
  const mount = ctx.$("#money-commitments"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) { note(mount, refusedText(last, "What the business pays for could not be shown"), true); return; }
  const all = last.senders ?? [];
  const sys = all.filter((r) => r.sent_by === "system");
  const people = all.filter((r) => r.sent_by !== "system");
  const active = sys.filter((r) => r.state === "active");
  const stopped = sys.filter((r) => r.state !== "active");
  if (!sys.length) { note(mount, "No company sends this business regular bills or receipts by email in the last 24 months, as far as the mail that was read shows."); }
  else {
    note(mount, ctx.countOf(active.length) + (active.length === 1 ? " company bills" : " companies bill") + " regularly and " + (active.length === 1 ? "is" : "are") + " still billing; " + ctx.countOf(stopped.length) + (stopped.length === 1 ? " looks" : " look") + " stopped. Read from 24 months of mail" + (last.worked_out_at ? ", worked out " + when(last.worked_out_at) : "") + "; not yet matched against the books.");
    mount.appendChild(commitmentTable(active));
    if (stopped.length) {
      const d = ctx.el("details", "recs");
      const s = ctx.el("summary", "recs-sum"); s.textContent = "Looks Stopped (" + stopped.length + "): no bill for well past their usual gap"; d.appendChild(s);
      d.appendChild(commitmentTable(stopped));
      mount.appendChild(d);
    }
  }
  if (people.length) {
    const d = ctx.el("details", "recs");
    const s = ctx.el("summary", "recs-sum"); s.textContent = "Invoices Sent by People (" + people.length + "): clients, contractors and partners, not subscriptions"; d.appendChild(s);
    d.appendChild(commitmentTable(people));
    mount.appendChild(d);
  }
  note(mount, "Ask the box: what are we paying for every month?");
}

// ── what was not read ────────────────────────────────────────────────────────
function drawNotRead() {
  const mount = ctx.$("#money-notread"); if (!mount) return;
  mount.innerHTML = "";
  const items = [].concat(run?.ok ? (run.not_read ?? []) : [{ what: "How Long We Can Go", why: refusedText(run, "Could not be worked out") }],
    last?.ok ? (last.not_read ?? []) : [{ what: "What We Pay For", why: refusedText(last, "Could not be read") }]);
  if (!items.length) { note(mount, "Everything this tab uses was read."); return; }
  const ul = ctx.el("ul", "attn");
  for (const x of items) {
    const li = ctx.el("li");
    li.appendChild(line("a-title", (x.count != null ? ctx.countOf(x.count) + " " : "") + x.what));
    li.appendChild(line("a-detail", x.why));
    ul.appendChild(li);
  }
  mount.appendChild(ul);
}

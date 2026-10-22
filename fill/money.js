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
// PARTS, top to bottom: how long we can go, what we pay for, where we stand with each contractor (#money-ledger, drawn
// by seat contractor-ledger; this file leaves that mount alone), and what was not read.

import { fmtDate } from "./dates.js?v=2026-10-22-dates";
let ctx = null;   // { sb, el, $, countOf, zone }
let last = null;  // money_commitments
let run = null;   // money-runway

const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const note = (mount, text, flagged) => mount.appendChild(line(flagged ? "notice flagged" : "quiet", text));
const money = (n) => n == null ? "" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
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
  for (const id of ["#money-runway", "#money-commitments"]) {
    const m = ctx.$(id); if (m && !m.childElementCount) m.appendChild(line("quiet working", "Reading the bank and the books."));
  }
  const [r, c] = await Promise.all([readRunway(), readCommitments()]);
  run = r; last = c;
  drawRunway(); drawCommitments(); drawNotRead();
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
  if (rw?.cash_only) row.appendChild(tile(String(rw.cash_only.months), "months at today's spend, on the cash in the bank", "", rw.cash_only.months < 6));
  else row.appendChild(tile("?", "months left", "not worked out: see What was not read", true));
  if (rw?.after_collecting_and_paying) row.appendChild(tile(String(rw.after_collecting_and_paying.months), "months after collecting what we are owed and paying what we owe", ""));
  row.appendChild(tile(run.cash == null ? "?" : money(run.cash), "cash in the bank now", run.cash == null ? "the bank could not be read" : (run.cash_as_posted ? money(run.cash_bank_own) + " from the banks read live, " + money(run.cash_as_posted) + " as posted in QuickBooks" : "the banks' own figures") + ", " + when(run.as_of), run.cash == null));
  if (b) row.appendChild(tile(money(b.continuing), "spend a month that continues", "operating expenses, " + (b.averaged_over ?? []).join(", ")));
  mount.appendChild(row);

  if (rw?.cash_only) note(mount, "How it is worked out: " + rw.cash_only.arithmetic + "." + (rw.after_collecting_and_paying ? " With what is owed: " + rw.after_collecting_and_paying.arithmetic + "." : ""));
  if (b?.stops) note(mount, "With the contractors gone, their billing (" + money(b.stops.income) + " a month) and their pay (" + money(b.stops.cost_of_sales) + " a month) both end, so the spend that continues is the operating expenses. " + b.stops.assumption, true);

  // cash in the bank
  const bankRows = (run.bank_accounts ?? []).map((a) => [a.system + " " + a.name + (a.ending ? " ending " + a.ending : ""),
    a.currency && a.currency !== "USD" ? cur(a.current, a.currency) : money(a.current), a.available != null ? money(a.available) : "", !a.counted ? "not counted (not dollars)" : a.figure === "books" ? "as posted in QuickBooks; this bank is not read live" : "the bank's own figure"]);
  if (bankRows.length) { mount.appendChild(line("a-title", "Cash, account by account")); mount.appendChild(table(["Account", "Current balance", "Available", ""], bankRows)); }

  // the books, beside
  if (bk) {
    mount.appendChild(line("a-title", "The books (QuickBooks, as posted" + (bk.as_of ? ", " + day(bk.as_of) : "") + ")"));
    mount.appendChild(table(["", "The books"], [["Bank accounts as booked", money(bk.bank)], ["Owed to us (open invoices)", money(bk.owed_to_us)], ["Owed by us (unpaid bills)", money(bk.owed_by_us)], ["Credit cards", money(bk.credit_cards)]]));
  }

  // monthly spend
  if (b) {
    mount.appendChild(line("a-title", "Monthly spend (QuickBooks, by month)"));
    mount.appendChild(table(["Month", "Income", "Cost of sales", "Expenses", "Other expenses"],
      (b.months ?? []).map((m) => [m.month, money(m.income), money(m.cost_of_sales), money(m.expenses), money(m.other_expenses)])));
    note(mount, "Averaged over " + (b.averaged_over ?? []).join(", ") + ": income " + money(b.income) + ", cost of sales " + money(b.cost_of_sales) + ", expenses " + money(b.expenses) + ", other " + money(b.other_expenses) + ". Spend now " + money(b.spend_now) + " a month; continuing " + money(b.continuing) + ".");
    if ((b.largest_lines ?? []).length) {
      const d = ctx.el("details", "recs");
      const s = ctx.el("summary", "recs-sum"); s.textContent = "Largest expense lines, a month (tell the box if any of these also stop with the contractors)"; d.appendChild(s);
      d.appendChild(table(["Line", "A month"], b.largest_lines.map((l) => [l.name, money(l.monthly)])));
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
  const heads = ["Who bills", "How often", "Last charge", "Usual", "Card", "Next expected", "", "From the emails"];
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
      const s = ctx.el("summary", "recs-sum"); s.textContent = "Looks stopped (" + stopped.length + "): no bill for well past their usual gap"; d.appendChild(s);
      d.appendChild(commitmentTable(stopped));
      mount.appendChild(d);
    }
  }
  if (people.length) {
    const d = ctx.el("details", "recs");
    const s = ctx.el("summary", "recs-sum"); s.textContent = "Invoices sent by people (" + people.length + "): clients, contractors and partners, not subscriptions"; d.appendChild(s);
    d.appendChild(commitmentTable(people));
    mount.appendChild(d);
  }
  note(mount, "Ask the box: what are we paying for every month?");
}

// ── what was not read ────────────────────────────────────────────────────────
function drawNotRead() {
  const mount = ctx.$("#money-notread"); if (!mount) return;
  mount.innerHTML = "";
  const items = [].concat(run?.ok ? (run.not_read ?? []) : [{ what: "how long we can go", why: refusedText(run, "could not be worked out") }],
    last?.ok ? (last.not_read ?? []) : [{ what: "what we pay for", why: refusedText(last, "could not be read") }]);
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

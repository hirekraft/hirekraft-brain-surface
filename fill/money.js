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
// PARTS, top to bottom: the framed part (seat tool-build-money, build step 3: owed to you, you owe, clean up the books; mount
// below, drawn only with fill/frame.js blocks), then behind the part row: how long we can go, what we pay for, where we stand with each contractor (#money-ledger, drawn
// by seat contractor-ledger; this file leaves that mount alone), and what was not read.

import { fmtDate } from "./dates.js?v=2026-10-22-dates";
import { h, nameSpan, card, list, row, button, link, say, working, pair, behind, words } from './frame.js?v=2026-11-03-tool-build-1b';   // the framed part (seat tool-build-money)
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

async function readRunway() { const r = await runwayOnce(ctx.sb); return r?.ok ? r : { ...(r ?? {}), ok: false, note: "How long the business can go could not be worked out: " + String(r?.note ?? r?.reason ?? "no answer came back") }; }   // one live read shared with the framed part (seat tool-build-money)
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
  // The framed part first (seat tool-build-money): owed to you, you owe, clean up the books. It reads on its own.
  const body = ctx.$("#money-body");
  if (body) mount(body, { sb: ctx.sb, lang: ctx.lang, tz: ctx.zone?.(), go: ctx.go, part: ctx.part });
  for (const id of ["#money-runway", "#money-commitments"]) {
    const m = ctx.$(id); if (m && !m.childElementCount) m.appendChild(line("quiet working", "Reading the bank and the books."));
  }
  const [r, c] = await Promise.all([readRunway(), readCommitments()]);
  run = r; last = c;
  drawRunway(); drawCommitments(); drawNotRead();
}

// ── MONEY IN THE FRAME (seat tool-build-money, 2026-11-03; build step 3 of decision 1067; design whole-tool-design-3,
// snapshot 2e2adc7e; decisions 1061, 1063, 1065, 1068) ───────────────────────────────────────────────────────────────
// The framed part of Money, drawn only with fill/frame.js blocks, mounted by mount(el, ctx) like every framed place
// (ctx = { sb, who, lang, tz, go, part }). The CFO's first look: what clients owe (what the books say beside what we
// believe), what we owe, and the clean-up list. Every figure and every item is the brain's: books_truth (records match
// over the kept QuickBooks copy and the mail, seat books-truth-2) and money-runway's books.owed_by_us (as posted in
// QuickBooks). This file computes nothing and decides nothing.
// THE OWNER'S PRESSES (decision 1063, 1068): Fix opens the card with what the fix changes and reads QuickBooks live at
// once (system-read books_fix, mode check: reads only), which names the bank account the money goes into, the one this
// client's previous payment went to. Fix in QuickBooks (mode apply) is the only press that writes; system-read logs it in
// books_writes and reads QuickBooks back. An item to decide has no Fix. One card open at a time, so one filled button.
// SUPERSEDED 2026-11-03 (this seat): books-truth-2's two buttons on the card face, Check in QuickBooks then Fix in
// QuickBooks. The check now runs on the Fix press, so the account is named before the write, in two presses as the
// design shows (Fix, then Fix in QuickBooks). Nothing else changed in what is read or written.
// Refused is never drawn as empty: a reading that did not come back says why in its own card. No regex literals and no
// backslashes (STANDING-CLAUSES).
let runwayP = null, runwayAt = 0;
function runwayOnce(sb) {   // one live read of the bank and the books per minute, shared by the framed part and How long we can go
  if (runwayP && Date.now() - runwayAt < 60000) return runwayP;
  runwayAt = Date.now();
  runwayP = (async () => {
    try {
      if (!sb?.functions?.invoke) return { ok: false, note: "It could not be reached just now." };
      const { data, error } = await sb.functions.invoke("money-runway", { body: {} });
      if (!error) return data;
      let body = null; try { body = await error.context?.json?.(); } catch (_) { body = null; }
      return body ?? { ok: false, note: String(error.message ?? error) };
    } catch (e) { return { ok: false, note: String(e?.message ?? e) }; }
  })();
  return runwayP;
}
async function booksFix(sb, id, mode) {
  try {
    if (!sb?.functions?.invoke) return { ok: false, reason: "It could not be reached just now." };
    const { data, error } = await sb.functions.invoke("system-read", { body: { action: "books_fix", finding_id: id, mode } });
    if (!error) return data;
    let body = null; try { body = await error.context?.json?.(); } catch (_) { body = null; }
    return body ?? { ok: false, reason: "QuickBooks could not be reached: " + String(error.message ?? error) };
  } catch (e) { return { ok: false, reason: "QuickBooks could not be reached: " + String(e?.message ?? e) }; }
}

let openPanel = null;   // the one clean-up card open now
export function mount(el, mctx) {
  el.textContent = "";
  openPanel = null;
  const root = h("div", "vf vf-place");
  root.dataset.place = "money";
  el.appendChild(root);
  const de = mctx.lang === "de";
  const usd = (n, cents) => { const x = Number(n ?? 0); const o = { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }; return de ? x.toLocaleString("de-DE", o) + " $" : "$" + x.toLocaleString("en-US", o); };
  const dayOf = (d) => { try { return new Intl.DateTimeFormat(de ? "de-DE" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(d)); } catch (_) { return String(d ?? "").slice(0, 10); } };

  const grid = h("div", "vf-grid");
  root.appendChild(grid);
  const owed = card("Owed to you");
  owed.el.appendChild(working("Reading your books and your mail."));
  grid.appendChild(owed.el);
  const owe = card("You owe");
  owe.el.appendChild(working("Reading the bank and the books."));
  grid.appendChild(owe.el);
  const clean = card("Clean up the books", "");
  clean.el.appendChild(working("Reading what to clean up."));
  root.appendChild(clean.el);

  const rpc = async (fn) => { try { const { data, error } = await mctx.sb.rpc(fn, {}); return error ? { ok: false, note: error.message } : data; } catch (e) { return { ok: false, note: String(e?.message ?? e) }; } };
  rpc("books_truth").then((d) => { drawOwedCard(owed, d, usd); drawClean(clean, d, mctx, usd, dayOf); });
  runwayOnce(mctx.sb).then((r) => drawOwe(owe, r, mctx, usd));
  return root;
}

const clearCard = (c) => { while (c.el.childNodes.length > 1) c.el.removeChild(c.el.lastChild); };
const why = (d, what) => { const r = String(d?.note ?? d?.reason ?? "No answer came back."); return what + ". " + r + (r.endsWith(".") ? "" : "."); };

function drawOwedCard(c, d, usd) {
  clearCard(c);
  if (!d || d.ok !== true) { c.el.appendChild(say(why(d, "What you are owed could not be worked out"), true)); return; }
  const open = Number(d.open_invoices ?? 0), late = Number(d.past_due ?? 0), gap = Number(d.gap ?? 0);
  c.el.appendChild(pair(
    { label: "Your books say", num: usd(d.books), line: open + (open === 1 ? " open invoice, " : " open invoices, ") + late + " past due" },
    { label: "We believe", num: usd(d.believed), line: gap > 0 ? "Less money that arrived" : "The same as your books" }));
  c.el.appendChild(say(gap > 0 ? usd(gap) + " has arrived that QuickBooks does not show yet." : "Your books and your mail agree."));
  const b = behind("Why the two differ");
  for (const it of (d.cleanup ?? []).filter((i) => Number(i.lowers_owed) > 0)) b.appendChild(say((it.line ?? "") + " Owed falls by " + usd(it.lowers_owed, true) + " when it is recorded."));
  if (d.how) b.appendChild(say(d.how));
  c.el.appendChild(b);
}

function drawOwe(c, r, mctx, usd) {
  clearCard(c);
  const owing = r?.ok === true ? r.books?.owed_by_us : null;
  if (owing === null || owing === undefined) { c.el.appendChild(say(why(r?.ok === true ? { note: "QuickBooks did not give the unpaid bills." } : r, "What you owe could not be read"), true)); }
  else {
    const n = h("div");
    n.append(h("div", "vf-num", usd(owing)), h("div", "vf-num-line", "Unpaid bills in QuickBooks"));
    c.el.appendChild(n);
  }
  if (mctx.part) c.el.appendChild(link("How long we can go", () => mctx.part("runway")));
}

function drawClean(c, d, mctx, usd, dayOf) {
  clearCard(c);
  if (!d || d.ok !== true) { c.side.hidden = true; c.el.appendChild(say(why(d, "What to clean up could not be read"), true)); return; }
  const items = d.cleanup ?? [];
  const nFix = items.filter((i) => i.state === "fix").length, nDecide = items.length - nFix;
  c.side.hidden = !items.length;
  c.side.textContent = [nFix ? nFix + " to fix" : "", nDecide ? nDecide + " to decide" : ""].filter(Boolean).join(" · ");
  if (!items.length) c.el.appendChild(say("Nothing to clean up. Your books match your mail."));
  const l = list();
  for (const it of items) {
    const decide = it.state !== "fix";
    const panel = h("div"); panel.hidden = true;
    const toggle = link(decide ? "Look" : "Fix", () => {
      if (!panel.hidden) { panel.hidden = true; toggle.textContent = decide ? "Look" : "Fix"; openPanel = null; return; }
      if (openPanel && openPanel.close) openPanel.close();
      drawPanel(panel, it, mctx, usd, dayOf, decide);
      panel.hidden = false; toggle.textContent = "Close";
      openPanel = { close: () => { panel.hidden = true; toggle.textContent = decide ? "Look" : "Fix"; } };
    });
    l.appendChild(row({ title: words(it.title ?? "", 8), line: (decide ? "To decide. " : "") + words(it.line ?? "", decide ? 9 : 12), right: toggle }));
    l.appendChild(panel);
  }
  if (items.length) c.el.appendChild(l);
  const done = d.fixed_lately ?? [];
  if (done.length) {
    const b = behind("Fixed lately: " + done.length);
    for (const x of done) b.appendChild(say(dayOf(x.fixed_at) + ": " + (x.line ?? "")));
    c.el.appendChild(b);
  }
  c.el.appendChild(say(d.books_as_of ? "Books as kept on " + dayOf(d.books_as_of) + "." : "When the books were kept is not known."));
}

const openUrl = (u) => () => { try { window.open(u, "_blank", "noopener"); } catch (_) { /* a blocked window: nothing else to do */ } };

// One clean-up card, open: what the fix changes, invoice by invoice; then the live check (reads only) naming where the
// money goes; then the one button that writes. To decide: where it stands, no button.
function drawPanel(panel, it, mctx, usd, dayOf, decide) {
  panel.textContent = "";
  const c = card(decide ? "Where it stands" : "What the fix changes");
  panel.appendChild(c.el);
  if (it.line) c.el.appendChild(say(it.line));   // the whole line, cut on the row to the face limit
  const inv = it.invoices ?? [];
  if (inv.length) {
    const l = list();
    for (const x of inv) l.appendChild(row({ title: String(x.doc ?? ""), line: "Open now " + usd(x.now, true) + ", open after " + usd(x.after ?? x.after_payment, true) }));
    c.el.appendChild(l);
  }
  if (it.what_fix_does) c.el.appendChild(say(decide ? "To decide. " + it.what_fix_does : it.what_fix_does));
  const more = behind("See the detail");
  if (it.books_now) more.appendChild(say("QuickBooks now: " + it.books_now));
  for (const m of it.sources ?? []) {
    const p = say(dayOf(m.date) + ", ");
    p.appendChild(nameSpan(m.from ?? ""));
    p.appendChild(document.createTextNode(": " + (m.why ?? "") + "."));
    more.appendChild(p);
    more.appendChild(link("Open the email", openUrl(gmailLink(m))));
  }
  if (it.books_link) more.appendChild(link("Open it in QuickBooks", openUrl(it.books_link)));
  c.el.appendChild(more);
  if (decide) return;
  const out = h("div", "vf"); out.setAttribute("aria-live", "polite");
  c.el.appendChild(out);
  out.appendChild(working("Reading QuickBooks."));
  booksFix(mctx.sb, it.id, "check").then((r) => {
    out.textContent = "";
    if (!r?.ok) { out.appendChild(say(why(r, "QuickBooks could not be checked"), true)); return; }
    if (r.into?.name) { const g = row({ title: "Goes into: " + r.into.name, line: r.into.how ? words(r.into.how, 12) : "" }); out.appendChild(g); }
    for (const t of r.lines ?? []) out.appendChild(say(t));
    const fix = button("Fix in QuickBooks");
    const note = say("Nothing is written until you press it. QuickBooks is read back after.");
    fix.addEventListener("click", async () => {
      fix.disabled = true;
      note.textContent = "Writing to QuickBooks, then reading it back.";
      note.className = "working";
      const a = await booksFix(mctx.sb, it.id, "apply");
      if (a?.ok) {
        fix.remove();
        note.className = "vf-say"; note.textContent = "Done. QuickBooks was changed and read back.";
        for (const t of (a.lines ?? []).filter((x) => String(x).startsWith("Read back"))) out.appendChild(say(t));
      } else {
        fix.disabled = false;
        note.className = "vf-say vf-refused"; note.dataset.refused = "";
        note.textContent = why(a, "The fix did not go through") + " Nothing else was changed.";
      }
    });
    out.append(fix, note);
  });
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

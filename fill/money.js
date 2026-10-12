// fill/money.js - THE MONEY TAB (seat runway, Alex 2026-10-10: "how much do we have, how much longer can we go...
// what goes out, what have we signed up for, what subscriptions")
//
// Capability "How long can we go, and what am I paying for?". Mechanisms: COMPOSE (code over cited records, in the
// brain: public.money_commitments, owner only via owner_refusal) and SHOW (this file). This file computes nothing
// and decides nothing: every figure is the brain's, every row opens the emails it came from. A part that cannot be
// shown says why; refused is never drawn as empty.
//
// PARTS, top to bottom: how long we can go (runway; waits on the books), what we pay for (from the mail now, checked
// against the books once they are read), where we stand with each contractor (#money-ledger, drawn by seat
// contractor-ledger; this file leaves that mount alone), and what was not read.

let ctx = null;   // { sb, el, $, countOf, zone }
let last = null;

const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const note = (mount, text, flagged) => mount.appendChild(line(flagged ? "notice flagged" : "quiet", text));
const money = (n) => n == null ? "" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const day = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export function initMoney(c) { ctx = c; }

export async function loadMoney() {
  for (const id of ["#money-runway", "#money-commitments"]) {
    const m = ctx.$(id); if (m && !m.childElementCount) note(m, "Reading.");
  }
  try {
    const { data, error } = await ctx.sb.rpc("money_commitments");
    if (error) throw error;
    last = data;
  } catch (e) {
    const msg = String(e?.message ?? e);
    last = { ok: false, note: msg.includes("Could not find the function")
      ? "This part is not switched on yet: one change to the brain is waiting to be applied."
      : "What the business pays for could not be read, so nothing here is known: " + msg };
  }
  drawRunway(); drawCommitments(); drawNotRead();
}

function refused(mount) {
  mount.innerHTML = "";
  note(mount, last?.note ?? "This could not be shown" + (last?.reason ? " (" + last.reason + ")" : "") + ".", true);
}

// ── how long can we go ───────────────────────────────────────────────────────
// Not computed until the books are read. Saying so is the answer; a number from the mail alone would leave out
// cash on hand, money owed and every charge that never sent an email.
function drawRunway() {
  const mount = ctx.$("#money-runway"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) { refused(mount); return; }
  const books = (last.not_read ?? []).find((x) => x.what === "books");
  if (books) {
    note(mount, "Not worked out yet. Months left needs cash on hand, money owed to and by the company, and every charge, and those come from QuickBooks and Wise, which have not been read yet.", true);
    note(mount, "To fix this: put the QuickBooks reports and Wise statements in the Accounting shared drive. Each file shows below once it has been read.");
  }
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
  if (!last?.ok) { refused(mount); return; }
  const all = last.senders ?? [];
  const sys = all.filter((r) => r.sent_by === "system");
  const people = all.filter((r) => r.sent_by !== "system");
  const active = sys.filter((r) => r.state === "active");
  const stopped = sys.filter((r) => r.state !== "active");
  if (!sys.length) { note(mount, "No company sends this business regular bills or receipts by email in the last 24 months, as far as the mail that was read shows."); }
  else {
    note(mount, ctx.countOf(active.length) + " companies bill regularly and are still billing; " + ctx.countOf(stopped.length) + " look stopped. Read from 24 months of mail; not yet checked against the books.");
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
  note(mount, "Ask the box: what are we paying for every month? what did we sign up for that we are not using? what if I cancel two of these?");
}

// ── what was not read ────────────────────────────────────────────────────────
function drawNotRead() {
  const mount = ctx.$("#money-notread"); if (!mount) return;
  mount.innerHTML = "";
  if (!last?.ok) { refused(mount); return; }
  const items = last.not_read ?? [];
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

// fill/ledger.js - WHERE WE STAND WITH EACH CONTRACTOR, AND WITH EACH CUSTOMER AND SUPPLIER (seat contractor-ledger)
//
// Capability (Tool): "Where do we stand with each customer and supplier?" Bench adds: "Where are we with each
// contractor?" Mechanisms: COMPOSE (relationship-ledger, which reads QuickBooks and Wise live through system-read with
// the owner's own sign-in) and SHOW (this file). This file computes nothing and decides nothing: every figure is the
// server's and every row says which record it came from. Refused is never drawn as empty.
// Drawn into #money-ledger on the Money tab (runway left that mount for it). Owner only, like the tab.

let ctx = null;   // { sb, el, $, countOf }
let data = null;

const line = (cls, text) => { const p = ctx.el("p", cls); p.textContent = text; return p; };
const note = (mount, text, flagged) => mount.appendChild(line(flagged ? "notice flagged" : "quiet", text));
const money = (n) => n == null ? "" : Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const day = (d) => d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const mon = (m) => m ? new Date(m + "-15T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
const when = (t) => t ? new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

export function initLedger(c) { ctx = c; }

async function readLedger() {
  try {
    const { data: d, error } = await ctx.sb.functions.invoke("relationship-ledger", { body: { bench: true } });
    if (!error) return d;
    let body = null; try { body = await error.context?.json?.(); } catch (_) { body = null; }
    return body ?? { ok: false, note: "Where we stand could not be worked out: " + String(error.message ?? error) };
  } catch (e) { return { ok: false, note: "Where we stand could not be worked out: " + String(e?.message ?? e) }; }
}

export async function loadLedger() {
  const m = ctx.$("#money-ledger"); if (!m) return;
  m.innerHTML = "";
  m.appendChild(line("a-title", "Where we stand with each contractor"));
  note(m, "Reading the books and Wise.");
  data = await readLedger();
  draw();
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
function fold(summary, build) {
  const d = ctx.el("details", "recs");
  const s = ctx.el("summary", "recs-sum"); s.textContent = summary; d.appendChild(s);
  let built = false;
  d.addEventListener("toggle", () => { if (d.open && !built) { built = true; build(d); } });
  return d;
}
function sourcesOf(records) {
  return (records ?? []).map((r) => r.system + " " + r.kind + " " + r.ref + ", " + day(r.date) + ", " + money(r.amount) + (r.note ? " (" + r.note + ")" : "")).join("; ");
}
function disagreementList(mount, list) {
  if (!(list ?? []).length) return;
  const ul = ctx.el("ul", "attn");
  for (const x of list) {
    const li = ctx.el("li");
    li.appendChild(line("a-title", day(x.date) + ", " + money(x.amount)));
    li.appendChild(line("a-detail", x.what + " " + (x.sources ?? []).map((s) => s.system + " " + s.kind + " " + s.ref).join(" / ")));
    ul.appendChild(li);
  }
  mount.appendChild(ul);
}

function draw() {
  const mount = ctx.$("#money-ledger"); if (!mount) return;
  mount.innerHTML = "";
  mount.appendChild(line("a-title", "Where we stand with each contractor"));
  if (!data?.ok) { note(mount, data?.note ?? ("Where we stand could not be shown" + (data?.reason ? " (" + data.reason + ")" : "") + "."), true); return; }
  const b = data.bench;
  const cs = b?.contractors ?? [];

  if (!cs.length) note(mount, "No client invoice line in the books names a supplier, so no contractor could be paired with what the client was billed.", true);
  else {
    note(mount, "Across " + ctx.countOf(cs.length) + (cs.length === 1 ? " contractor" : " contractors") + ": we still owe them " + money(b.all_contractors.owed_to_contractors)
      + " in unpaid bills, and the client still owes us " + money(b.all_contractors.client_still_owes) + " for their hours.");
    mount.appendChild(table(["Contractor", "Last month billed to the client", "Last bill from them", "We still owe them", "Client still owes us", "Bills not in yet", "Sources disagree"],
      cs.map((c) => [c.name, mon(c.wind_down.last_month_billed_to_client), mon(c.wind_down.last_contractor_bill), money(c.wind_down.owed_to_contractor),
        money(c.wind_down.client_still_owes), (c.wind_down.bills_not_in_yet ?? []).map(mon).join(", "), (c.disagreements ?? []).length ? String(c.disagreements.length) : ""])));
    for (const c of cs) {
      mount.appendChild(fold(c.name + ": month by month, " + ctx.countOf(c.totals.hours) + " hours, margin " + money(c.totals.margin), (d) => {
        d.appendChild(table(["Month", "Hours", "Billed to client", "Client still owes", "Their bill", "Paid in the books", "Sent by Wise", "Still owed to them", "Margin"],
          c.months.map((m) => [mon(m.month), m.hours ? String(m.hours) : "", money(m.billed_to_client), m.client_still_owes ? money(m.client_still_owes) : "",
            money(m.contractor_billed), money(m.paid_in_books), money(m.sent_by_wise), m.still_owed_to_contractor ? money(m.still_owed_to_contractor) : "", money(m.margin)])));
        const inv = [...new Set(c.months.flatMap((m) => m.client_invoices ?? []))];
        if (inv.length) note(d, "Client invoices: " + inv.join(", ") + ".");
        const rel = (data.relationships ?? []).find((r) => r.key === c.key);
        if (rel) note(d, "Their records: " + rel.months.map((m) => sourcesOf(m.records)).filter(Boolean).join("; ") + ".");
        if ((c.disagreements ?? []).length) { d.appendChild(line("a-title", "Where the books and Wise disagree")); disagreementList(d, c.disagreements); }
        note(d, c.wind_down.last_day_note);
      }));
    }
    if (b.client_lines_naming_no_contractor?.lines) note(mount, ctx.countOf(b.client_lines_naming_no_contractor.lines) + " client invoice lines (" + money(b.client_lines_naming_no_contractor.amount) + ") name no supplier, so they are not in any contractor's figures.");
    note(mount, b.months_note);
  }

  // the Tool layer: every customer and supplier
  const rs = data.relationships ?? [];
  mount.appendChild(fold("Every customer and supplier (" + rs.length + "): invoiced, paid and owed, either way", (d) => {
    note(d, "Owed to us in total " + money(data.totals.owed_to_us) + "; owed by us in total " + money(data.totals.owed_by_us) + ".");
    d.appendChild(table(["Who", "Invoiced to them", "Received", "They owe us", "Billed to us", "Paid in the books", "Sent by Wise", "We owe them", "From", "To"],
      rs.map((r) => [r.name, money(r.totals.invoiced), money(r.totals.received), money(r.totals.owed_to_us), money(r.totals.billed), money(r.totals.paid_books),
        money(r.totals.paid_wise), money(r.totals.owed_by_us), mon(r.first_month), mon(r.last_month)])));
    const dis = rs.filter((r) => (r.disagreements ?? []).length || r.note);
    for (const r of dis) {
      d.appendChild(line("a-title", r.name));
      if (r.note) note(d, r.note, true);
      disagreementList(d, r.disagreements);
    }
  }));

  const read = (data.read ?? []).map((s) => s.system + ": " + s.what + " (" + ctx.countOf(s.records) + " records" + (s.read_at ? ", " + when(s.read_at) : "") + ")");
  if (read.length) note(mount, "Read live just now: " + read.join("; ") + ".");
  for (const x of data.not_read ?? []) note(mount, "Not read: " + x.what + ". " + x.why);
  if (data.wise?.cancelled_or_returned) note(mount, ctx.countOf(data.wise.cancelled_or_returned) + " Wise transfers were cancelled or returned and are not counted as paid.");
  note(mount, data.months_note + " Ask the box: where are we with a contractor by name?");
}

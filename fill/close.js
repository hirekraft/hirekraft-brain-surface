// fill/close.js - THE MONTH-END CHECK, CORRECTED CELL BY CELL (seat month-end, 2026-10-26; decisions 1019 and 1020).
// lens-ask v40 answers "month-end check for <client>, <month>" with a table built from the books, the mail and the files
// (body.close: rows, month line, the run's id). Here the owner sees what does not tie first, each with its reasons; rows
// that tie are one line each, opened with a tap. Every cell can be marked Right, or Wrong with the right value
// (close_cell_mark, as her own sign-in; the brain refuses anyone but the owner). When the period is right, one press keeps
// it as the right answer (close_gold_save): one stored test per column, so a later failure names the layer.
// No regex literals (STANDING-CLAUSES: the write tool).

const COLS = [
  ["expected", "Should be there"],
  ["submitted_hours", "Hours submitted"],
  ["approved", "Approved"],
  ["supplier_hours", "Consultant invoice"],
  ["rate", "Rates in force"],
  ["client_invoice", "Client invoice"],
  ["sent", "Invoice sent"],
  ["paid", "Paid"],
];

function money(n) { return typeof n === "number" ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""; }

export function closeCard(slot, body, ctx) {
  const el = ctx.el;
  const c = body.close || {};
  const rows = Array.isArray(c.rows) ? c.rows : [];
  const runId = c.run_id || null;
  const cites = new Map((Array.isArray(body.citations) ? body.citations : []).map((x) => [String(x.n), x]));
  const wrap = el("div", "close-set");
  const lead = el("p", "ans-lead");
  lead.textContent = String(body.answer || "").split(String.fromCharCode(10))[0] || "Month-end check.";
  wrap.appendChild(lead);
  const lines = Array.isArray(body.completeness) ? body.completeness : [];
  if (lines.length) {
    const box = el("div", "ans-gap"); const ul = el("ul", "ans-gap-list");
    for (const l of lines) { const li = el("li"); li.textContent = String(l); ul.appendChild(li); }
    box.appendChild(ul); wrap.appendChild(box);
  }
  for (const n of (Array.isArray(c.notes) ? c.notes : [])) { const p = el("p", "close-note"); p.textContent = String(n); wrap.appendChild(p); }
  if (!rows.length) { slot.appendChild(wrap); return; }
  if (runId) {
    const how = el("p", "quiet close-how");
    how.textContent = "Mark each cell Right, or Wrong and type the right value. The Tool learns from what you correct.";
    wrap.appendChild(how);
  }
  const cellEls = new Map();
  const ex = rows.filter((r) => r.status !== "verified");
  const ok = rows.filter((r) => r.status === "verified");
  if (ex.length) {
    const h = el("p", "close-h"); h.textContent = ex.length === 1 ? "Needs you" : "Need you (" + ex.length + ")"; wrap.appendChild(h);
    for (const r of ex) wrap.appendChild(rowCard(r, false));
  }
  if (ok.length) {
    const h = el("p", "close-h"); h.textContent = "Verified (" + ok.length + "): the sources agree"; wrap.appendChild(h);
    for (const r of ok) wrap.appendChild(rowCard(r, true));
  }
  const m = c.month || {};
  const ml = el("p", "close-month");
  ml.textContent = "The month: " + (m.people ?? 0) + " people, " + (m.verified ?? 0) + " verified, " + (m.exceptions ?? 0) + " need you. Billed " + money(m.billed)
    + ", cost " + money(m.cost) + ", margin " + money(m.margin) + ".";
  wrap.appendChild(ml);
  if (runId) {
    const keepRow = el("div", "close-keep");
    const b = el("button", "close-btn close-gold"); b.type = "button";
    b.textContent = "This month is right now: keep it as the right answer";
    const said = el("p", "quiet close-said");
    b.addEventListener("click", async () => {
      b.disabled = true; said.textContent = "Keeping it...";
      let r = null;
      try { const x = await ctx.rpc("close_gold_save", { p_run: runId }); r = x.error ? { ok: false, note: x.error.message } : x.data; } catch (e) { r = { ok: false, note: String(e?.message || e) }; }
      b.disabled = false;
      const made = r && Array.isArray(r.saved) ? r.saved.filter((s) => s.result && s.result.ok).length : 0;
      said.textContent = r && r.ok ? r.note + " " + made + (made === 1 ? " column check saved." : " column checks saved.") : "Not kept: " + (r?.note || "no answer came back") + ".";
    });
    keepRow.appendChild(b); keepRow.appendChild(said); wrap.appendChild(keepRow);
    loadMarks();
  }
  slot.appendChild(wrap);

  function rowCard(r, folded) {
    const card = el(folded ? "details" : "div", "close-row" + (folded ? " is-verified" : " is-exception"));
    const head = el(folded ? "summary" : "p", "close-name");
    head.textContent = r.name + (folded ? ": " + [r.cells?.approved?.show, r.cells?.paid?.show].filter(Boolean).join("; ") : "");
    card.appendChild(head);
    if (!folded && Array.isArray(r.flags) && r.flags.length) {
      const ul = el("ul", "close-flags");
      for (const f of r.flags) { const li = el("li"); li.textContent = String(f); ul.appendChild(li); }
      card.appendChild(ul);
    }
    const grid = el("div", "close-grid");
    for (const [col, label] of COLS) grid.appendChild(cellBox(r, col, label));
    card.appendChild(grid);
    return card;
  }

  function cellBox(r, col, label) {
    const cell = (r.cells || {})[col] || {};
    const box = el("div", "close-cell" + (col === "rate" && cell.doubt ? " is-doubt" : ""));
    const k = el("p", "close-k"); k.textContent = label; box.appendChild(k);
    const v = el("p", "close-v"); v.textContent = String(cell.show || "Not found"); box.appendChild(v);
    if (cell.why) { const w = el("p", "quiet close-why"); w.textContent = String(cell.why); box.appendChild(w); }
    const refs = Array.isArray(cell.cite) ? cell.cite : [];
    if (refs.length) {
      const src = el("p", "close-src");
      refs.slice(0, 4).forEach((ref, i) => {
        const ci = cites.get(String(ref));
        const t = ci ? (ci.doc || ref) + (ci.date ? ", " + ci.date : "") : String(ref);
        let a;
        if (ci && ci.open_url) { a = el("a", "close-ref"); a.href = ci.open_url; a.target = "_blank"; a.rel = "noopener"; }
        else a = el("span", "close-ref");
        a.textContent = t;
        if (i) src.appendChild(document.createTextNode(" · "));
        src.appendChild(a);
      });
      box.appendChild(src);
    }
    if (runId) {
      const act = el("div", "close-act");
      const right = el("button", "close-btn"); right.type = "button"; right.textContent = "Right";
      const wrong = el("button", "close-btn"); wrong.type = "button"; wrong.textContent = "Wrong";
      const state = el("p", "quiet close-state");
      const form = el("div", "close-fix"); form.hidden = true;
      const inp = el("input", "close-input"); inp.type = "text"; inp.placeholder = "The right value"; inp.setAttribute("aria-label", "The right value for " + label + ", " + r.name);
      const keep = el("button", "close-btn"); keep.type = "button"; keep.textContent = "Keep";
      form.appendChild(inp); form.appendChild(keep);
      right.addEventListener("click", () => mark(r, col, "right", null, state, form));
      wrong.addEventListener("click", () => { form.hidden = false; inp.focus(); });
      keep.addEventListener("click", () => { if (inp.value.trim()) mark(r, col, "wrong", inp.value.trim(), state, form); else { state.textContent = "Type the right value first."; } });
      act.appendChild(right); act.appendChild(wrong);
      box.appendChild(act); box.appendChild(form); box.appendChild(state);
      cellEls.set(r.key + "|" + col, { box, state });
    }
    return box;
  }

  async function mark(r, col, verdict, value, state, form) {
    state.textContent = "Saving...";
    let res = null;
    try { const x = await ctx.rpc("close_cell_mark", { p_run: runId, p_row: r.key, p_col: col, p_verdict: verdict, p_value: value }); res = x.error ? { ok: false, note: x.error.message } : x.data; }
    catch (e) { res = { ok: false, note: String(e?.message || e) }; }
    if (res && res.ok) { form.hidden = true; shown(r.key + "|" + col, { verdict, value }); }
    else state.textContent = "Not saved: " + (res?.note || "no answer came back") + ".";
  }

  function shown(key, m) {
    const c2 = cellEls.get(key); if (!c2) return;
    c2.box.classList.toggle("is-right", m.verdict === "right");
    c2.box.classList.toggle("is-wrong", m.verdict === "wrong");
    c2.state.textContent = m.verdict === "right" ? "You marked this right." : "You corrected this to: " + m.value;
  }

  async function loadMarks() {
    try {
      const x = await ctx.rpc("close_view", { p_run: runId });
      const v = x && !x.error ? x.data : null;
      if (v && v.ok && v.marks) for (const [k2, m2] of Object.entries(v.marks)) shown(k2, m2);
    } catch (_) { /* the marks show on the next open */ }
  }
}

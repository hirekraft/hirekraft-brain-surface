// outputs.js (seat work-outputs, 2026-10-10; Alex 2026-10-08: PDFs for presentations and financial things,
// spreadsheets, "nice charts too"). Mechanism SHOW, with COMPOSE for the files.
//
// AN ANSWER BECOMES A CHART, A PDF, A SPREADSHEET OR SLIDES, BUILT IN HER BROWSER from the answer bodies already
// drawn on her screen, which lens-ask produced through the one door. Nothing is sent anywhere and nothing is
// stored: the file is her download. So a file holds only what her answers held, by construction, not by a check.
// The one call out is for slides: the answers she was shown go back to lens-ask, which writes an outline from them
// and reads nothing else (lens-ask v21, body.outline).
//
// THE CHART'S NUMBERS ARE NOT COMPUTED HERE. lens-ask calculates them by running code over the answer's own figures
// and refuses any point that is not one of those figures or their sum. This file only draws them.
//
// Libraries load on first use only, pinned: jspdf 2.5.1, xlsx 0.18.5, pptxgenjs 3.12.0, from jsDelivr.
// Patterns are not used in this file, so it stays writable by the estate's file tool (STANDING-CLAUSES).

const NL = String.fromCharCode(10);
const LIBS = {
  pdf: { url: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", get: () => window.jspdf && window.jspdf.jsPDF },
  sheet: { url: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", get: () => window.XLSX },
  slides: { url: "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js", get: () => window.PptxGenJS },
};
const loading = {};
function lib(k) {
  const L = LIBS[k];
  if (L.get()) return Promise.resolve(L.get());
  if (!loading[k]) {
    loading[k] = new Promise((ok, no) => {
      const s = document.createElement("script");
      s.src = L.url; s.async = true;
      s.onload = () => (L.get() ? ok(L.get()) : no(new Error("the file maker did not start")));
      s.onerror = () => { loading[k] = null; no(new Error("the file maker could not be loaded; check the connection and try again")); };
      document.head.appendChild(s);
    });
  }
  return loading[k];
}

function mk(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = String(text);
  return e;
}
const SVGNS = "http://www.w3.org/2000/svg";
function sv(tag, attrs, text) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k of Object.keys(attrs || {})) e.setAttribute(k, String(attrs[k]));
  if (text != null) e.textContent = String(text);
  return e;
}

// ── reading an answer body ─────────────────────────────────────────────────────────────
function stripMarks(t) {
  const s = String(t == null ? "" : t);
  let o = "", i = 0;
  while (i < s.length) {
    if (s[i] === "[") {
      const j = s.indexOf("]", i);
      if (j > i && j - i <= 5) {
        const inner = s.slice(i + 1, j);
        o += inner === "g" ? "(general knowledge)" : inner[0] === "w" ? "[web " + inner.slice(1) + "]" : "[" + inner + "]";
        i = j + 1; continue;
      }
    }
    o += s[i]; i++;
  }
  return o;
}
function noMarks(t) {
  const s = String(t == null ? "" : t);
  let o = "", i = 0;
  while (i < s.length) {
    if (s[i] === "[") { const j = s.indexOf("]", i); if (j > i && j - i <= 5) { i = j + 1; continue; } }
    o += s[i]; i++;
  }
  return o.trim();
}
function noTags(t) {
  const s = String(t == null ? "" : t);
  let o = "", inTag = false;
  for (const ch of s) { if (ch === "<") inTag = true; else if (ch === ">") inTag = false; else if (!inTag) o += ch; }
  return o.split(NL).join(" ").trim();
}
function isTableLine(t) { return t.trim().startsWith("|"); }
function cellsOf(line) {
  const parts = line.trim().split("|");
  parts.shift();
  if (parts.length && parts[parts.length - 1].trim() === "") parts.pop();
  return parts.map((c) => c.trim());
}
function isRule(cells) { return cells.every((c) => c && [...c].every((ch) => ch === "-" || ch === ":" || ch === " ")); }

// The answer's own lines, as plain text, without its tables (they go out as tables).
function proseLines(body) {
  const out = [];
  for (const raw of String(body.answer || "").split(NL)) {
    if (isTableLine(raw)) continue;
    let t = raw.trim();
    while (t.startsWith("#")) t = t.slice(1).trim();
    t = t.split("**").join("");
    if (t.startsWith("* ")) t = "- " + t.slice(2);
    if (t === "---") t = "";
    out.push(stripMarks(t));
  }
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}
function tablesIn(body) {
  const out = [];
  if (body.table && Array.isArray(body.table.rows)) {
    const cols = Array.isArray(body.table.columns) ? body.table.columns : [];
    out.push({ title: "List", head: ["Name", "Via"].concat(cols),
      rows: body.table.rows.map((r) => [r.name, r.via].concat(cols.map((c) => (r.cells || {})[c] || ""))) });
    return out;
  }
  let cur = null;
  for (const raw of String(body.answer || "").split(NL)) {
    if (!isTableLine(raw)) { cur = null; continue; }
    const cells = cellsOf(raw);
    if (isRule(cells)) continue;
    if (!cur) { cur = { title: "Table " + (out.length + 1), head: cells, rows: [] }; out.push(cur); }
    else cur.rows.push(cells);
  }
  return out;
}
function titleOf(e) {
  const d = String(e.doc || "").trim();
  if (d && d.toLowerCase() !== "untitled") return d.slice(0, 140);
  const s = noTags(e.snippet);
  return s ? s.slice(0, 100) : "A record";
}
function sourcesOf(body) {
  const ev = Array.isArray(body.citations) && body.citations.length ? body.citations : (Array.isArray(body.evidence) ? body.evidence : []);
  return ev.map((e) => ({ n: e.n, title: titleOf(e), where: whereOf(e), date: e.date || "", url: e.open_url || "" }));
}
function whereOf(e) {
  const src = String(e.source || "");
  if (src.startsWith("gmail:")) return "Gmail, " + src.slice(6);
  if (src.startsWith("drive:")) return "Drive";
  return e.open_in || src;
}
// THE STATED LINE ON WHAT WAS AND WAS NOT READ travels with every file. The server's own lines when it sent any;
// when it sent none, nothing that was found was left out (that is what an empty list means from lens-ask).
function readLines(body) {
  const c = Array.isArray(body.completeness) ? body.completeness.filter(Boolean).map(String) : [];
  if (c.length) return c;
  const n = Number(body.retrieval && body.retrieval.rows_shown);
  if (n > 0) return ["Written from the " + n + " records listed as sources. Nothing that was found was left out."];
  if (Array.isArray(body.web) && body.web.length) return ["No record of the company was used for this answer; it came from the web pages listed and general knowledge."];
  return ["No record of the company was used for this answer."];
}
function hasContent(b) {
  return !!b && typeof b.answer === "string" && b.answer.trim().length > 0
    && (b.state === "answered" || !!b.origins || !!b.table)
    && b.state !== "access_instruction" && b.state !== "output" && b.state !== "refused";
}
function questionOf(slot) {
  const p = slot.previousElementSibling;
  return p && p.classList && p.classList.contains("answer-asked") ? p.textContent.trim() : "";
}
function conversationUpTo(slot) {
  const scope = slot.closest("#answer-in") || (slot.parentElement && slot.parentElement.parentElement) || document;
  const out = [];
  for (const s of scope.querySelectorAll(".answer-slot")) {
    if (s === slot) break;
    if (hasContent(s._outBody)) out.push({ q: questionOf(s), body: s._outBody });
  }
  return out;
}

// ── numbers ─────────────────────────────────────────────────────────────────────────
function fmt(v, unit) {
  const u = String(unit || "").trim().toUpperCase();
  if (u.length === 3) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: u, maximumFractionDigits: 2 }).format(v); } catch (_) { /* not a currency */ }
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v) + (u && u.length !== 3 ? " " + unit : "");
}
function asNumber(s) {
  let t = String(s == null ? "" : s).trim();
  if (!t) return null;
  const money = t.includes("$") || t.includes("€") || t.includes("£");
  let neg = false;
  if (t.startsWith("(") && t.endsWith(")")) { neg = true; t = t.slice(1, -1); }
  for (const c of ["$", "€", "£", "USD", "EUR", "GBP", " "]) t = t.split(c).join("");
  t = t.split(",").join("");
  let pct = false;
  if (t.endsWith("%")) { pct = true; t = t.slice(0, -1); }
  if (!t || t === "-" || t === ".") return null;
  if (![...t].every((ch, i) => (ch >= "0" && ch <= "9") || ch === "." || (ch === "-" && i === 0))) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return { v: neg ? -n : n, pct, money };
}
function sheetCell(s) {
  const raw = noMarks(s);
  const n = asNumber(raw);
  if (!n) return raw;
  if (n.pct) return { t: "n", v: n.v / 100, z: "0.0%" };
  return { t: "n", v: n.v, z: n.money ? "#,##0.00" : (Number.isInteger(n.v) ? "#,##0" : "#,##0.00") };
}

// ── the chart ───────────────────────────────────────────────────────────────────────
const PAL = ["#1f55c8", "#b8401a", "#2f7d4f", "#7a4fb5"];
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
function shortLabel(s, n) { const t = String(s || ""); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
// inline: colours written on each mark (for a file); otherwise classes, so the stylesheet decides.
function chartSvg(ch, inline) {
  const W = 720, H = 380, L = 72, R = 16, T = ch.title ? 36 : 16, B = 56;
  const svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": ch.title || "Chart", xmlns: SVGNS });
  if (inline) svg.appendChild(sv("rect", { x: 0, y: 0, width: W, height: H, fill: "#ffffff" }));
  const ink = (cls, color) => (inline ? { fill: color } : { class: cls });
  if (ch.title) svg.appendChild(sv("text", Object.assign({ x: L, y: 22, "font-size": 15, "font-weight": 600, "font-family": "Helvetica, Arial, sans-serif" }, ink("out-title", "#14171c")), ch.title));
  const all = [];
  for (const s of ch.series) for (const v of s.values) all.push(v);
  const lo = Math.min(0, ...all), hi = niceMax(Math.max(...all, 0));
  const span = hi - lo || 1;
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / span);
  for (let k = 0; k <= 4; k++) {
    const v = lo + span * k / 4, yy = y(v);
    svg.appendChild(sv("line", Object.assign({ x1: L, x2: W - R, y1: yy, y2: yy }, inline ? { stroke: "#e9ecf0" } : { class: "out-grid" })));
    svg.appendChild(sv("text", Object.assign({ x: L - 8, y: yy + 4, "text-anchor": "end", "font-size": 11, "font-family": "Helvetica, Arial, sans-serif" }, ink("out-axis", "#60666f")), fmt(v, ch.unit)));
  }
  const n = ch.labels.length, band = (W - L - R) / n, many = n > 8;
  ch.labels.forEach((lab, i) => {
    const x = L + band * i + band / 2;
    svg.appendChild(sv("text", Object.assign({ x, y: H - B + 18, "text-anchor": "middle", "font-size": many ? 10 : 11, "font-family": "Helvetica, Arial, sans-serif" }, ink("out-axis", "#60666f")), shortLabel(lab, many ? 7 : 14)));
  });
  const k = ch.series.length;
  ch.series.forEach((s, si) => {
    const color = PAL[si % PAL.length];
    if (ch.kind === "line") {
      const pts = s.values.map((v, i) => (L + band * i + band / 2) + "," + y(v)).join(" ");
      svg.appendChild(sv("polyline", Object.assign({ points: pts, fill: "none", "stroke-width": 2.5 }, inline ? { stroke: color } : { class: "out-line out-s" + si })));
    }
    s.values.forEach((v, i) => {
      const tip = (s.name ? s.name + ", " : "") + ch.labels[i] + ": " + fmt(v, ch.unit) + "  (sources " + s.marks[i].join(", ") + ")";
      let mark;
      if (ch.kind === "line") {
        mark = sv("circle", Object.assign({ cx: L + band * i + band / 2, cy: y(v), r: 4 }, inline ? { fill: color } : { class: "out-dot out-s" + si }));
      } else {
        const bw = Math.max(4, (band * 0.7) / k), x = L + band * i + band * 0.15 + bw * si;
        const top = Math.min(y(v), y(0)), h = Math.max(1, Math.abs(y(v) - y(0)));
        mark = sv("rect", Object.assign({ x, y: top, width: bw, height: h, rx: 2 }, inline ? { fill: color } : { class: "out-bar out-s" + si }));
      }
      mark.appendChild(sv("title", {}, tip));
      svg.appendChild(mark);
    });
  });
  if (k > 1) {
    ch.series.forEach((s, si) => {
      const x = L + si * 150;
      svg.appendChild(sv("rect", Object.assign({ x, y: H - 22, width: 10, height: 10, rx: 2 }, inline ? { fill: PAL[si % PAL.length] } : { class: "out-bar out-s" + si })));
      svg.appendChild(sv("text", Object.assign({ x: x + 16, y: H - 13, "font-size": 11, "font-family": "Helvetica, Arial, sans-serif" }, ink("out-axis", "#60666f")), shortLabel(s.name, 18)));
    });
  }
  return svg;
}
function chartNote(ch) {
  return ch.computed_by === "code"
    ? "Calculated by running code over the figures in this answer. Each point comes from the sources marked on it."
    : "Checked against the figures in this answer. Each point comes from the sources marked on it.";
}
function chartBlock(ch) {
  const fig = mk("figure", "out-chart");
  fig.appendChild(chartSvg(ch, false));
  fig.appendChild(mk("figcaption", "out-note", chartNote(ch)));
  return fig;
}
function chartImage(ch) {
  return new Promise((ok) => {
    const xml = new XMLSerializer().serializeToString(chartSvg(ch, true));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 1440; c.height = 760;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => ok(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  });
}

// ── the files ───────────────────────────────────────────────────────────────────────
function fileName(q, ext) {
  let s = "";
  for (const ch of String(q || "answer").toLowerCase()) s += (ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") ? ch : "-";
  s = s.split("-").filter(Boolean).slice(0, 8).join("-") || "answer";
  const d = new Date();
  const day = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  return s + "-" + day + "." + ext;
}
// The PDF's built-in font carries Western European letters only; anything else is spelt out, never dropped silently.
const SPELL = { "✓": "yes", "✗": "no", "–": "-", "—": "-", "…": "...", "‘": "'", "’": "'", "“": '"', "”": '"', "•": "-", "→": "->", "€": "EUR " };
function latin(s) {
  let o = "";
  for (const ch of String(s == null ? "" : s)) {
    const c = ch.codePointAt(0);
    o += c < 256 ? ch : (SPELL[ch] != null ? SPELL[ch] : "?");
  }
  return o;
}
function titleFor(turns) { return turns.length === 1 ? (turns[0].q || "Answer") : "Conversation"; }
function made() { return "Made " + new Date().toLocaleString() + " from what was on your screen. Nothing else is in this file."; }

async function makePdf(turns) {
  const JsPDF = await lib("pdf");
  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 54, TW = W - 2 * M;
  let y = M;
  const room = (h) => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const text = (s, size, style, color) => {
    doc.setFont("helvetica", style || "normal"); doc.setFontSize(size); doc.setTextColor(color || "#14171c");
    for (const line of doc.splitTextToSize(latin(s), TW)) { room(size * 1.4); doc.text(line, M, y + size); y += size * 1.4; }
  };
  const title = titleFor(turns);
  text(title, 18, "bold"); y += 2;
  text(made(), 9, "normal", "#60666f"); y += 10;
  for (const t of turns) {
    if (turns.length > 1) { y += 10; text(t.q, 13, "bold"); y += 2; }
    for (const line of proseLines(t.body)) { if (!line) { y += 5; continue; } text(line, 10.5); }
    for (const tb of tablesIn(t.body)) {
      y += 6; text(tb.head.join("   |   "), 9.5, "bold");
      for (const r of tb.rows) text(r.map(stripMarks).join("   |   "), 9.5);
    }
    if (t.body.chart) {
      const png = await chartImage(t.body.chart);
      if (png) { const ih = TW * 380 / 720; y += 8; room(ih); doc.addImage(png, "JPEG", M, y, TW, ih); y += ih + 4; text(chartNote(t.body.chart), 8.5, "italic", "#60666f"); }
    }
    const src = sourcesOf(t.body);
    if (src.length) { y += 8; text("Sources", 11, "bold"); for (const s of src) text("[" + s.n + "] " + s.title + (s.where ? ", " + s.where : "") + (s.date ? ", " + s.date : ""), 9); }
    const web = Array.isArray(t.body.web) ? t.body.web : [];
    if (web.length) { y += 6; text("From the web", 11, "bold"); for (const w of web) text("[web " + w.n + "] " + (w.title || "") + "  " + (w.url || ""), 9); }
    y += 6; text("What was and was not read", 11, "bold");
    for (const l of readLines(t.body)) text(l, 9);
  }
  doc.save(fileName(title, "pdf"));
}

async function makeSheet(turns) {
  const X = await lib("sheet");
  const wb = X.utils.book_new();
  const used = new Set();
  const add = (name, aoa) => {
    let n = name.slice(0, 28), k = 2;
    while (used.has(n)) n = name.slice(0, 24) + " " + (k++);
    used.add(n);
    const ws = X.utils.aoa_to_sheet(aoa);
    const widths = [];
    for (const row of aoa) row.forEach((c, i) => { const w = String(c && typeof c === "object" ? c.v : c == null ? "" : c).length; widths[i] = Math.min(60, Math.max(widths[i] || 8, w + 2)); });
    ws["!cols"] = widths.map((w) => ({ wch: w }));
    X.utils.book_append_sheet(wb, ws, n);
  };
  const answer = [["Made", new Date().toLocaleString()], []];
  const later = [];
  const sources = [["Number", "Source", "Where", "Date", "Link"]];
  const read = [];
  turns.forEach((t, i) => {
    const pre = turns.length > 1 ? (i + 1) + " " : "";
    answer.push(["Question", t.q]);
    for (const line of proseLines(t.body)) answer.push(["", line]);
    answer.push([]);
    for (const tb of tablesIn(t.body)) later.push([pre + tb.title, [tb.head.map(noMarks)].concat(tb.rows.map((r) => r.map(sheetCell)))]);
    const ch = t.body.chart;
    if (ch) {
      const z = String(ch.unit || "").trim().length === 3 ? "#,##0.00" : "#,##0.##";
      later.push([pre + "Chart", [[ch.title || ""].concat(ch.series.map((s) => s.name || "Value"))]
        .concat(ch.labels.map((l, j) => [l].concat(ch.series.map((s) => ({ t: "n", v: s.values[j], z })))))]);
    }
    for (const s of sourcesOf(t.body)) sources.push([pre + s.n, s.title, s.where, s.date, s.url]);
    for (const w of (Array.isArray(t.body.web) ? t.body.web : [])) sources.push([pre + "web " + w.n, w.title || "", "the web", "", w.url || ""]);
    for (const l of readLines(t.body)) read.push([pre + l]);
  });
  add("Answer", answer);
  for (const [n, aoa] of later) add(n, aoa);
  add("Sources", sources.concat([[], ["What was and was not read"]], read));
  X.writeFile(wb, fileName(titleFor(turns), "xlsx"));
}

async function askOutline(ctx, turns, n, ask) {
  const { data } = await ctx.session();
  const jwt = data && data.session && data.session.access_token;
  if (!jwt) throw new Error("you are not signed in on this browser");
  let tz = "UTC";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (_) { /* keep UTC */ }
  const r = await fetch(ctx.askUrl, {
    method: "POST",
    headers: { Authorization: "Bearer " + jwt, apikey: ctx.key, "Content-Type": "application/json" },
    body: JSON.stringify({ question: ask || "Turn this into slides", tz, outline: { slides: n || null },
      turns: turns.map((t) => ({ q: t.q, a: String(t.body.answer || "").slice(0, 6000), chart: !!t.body.chart })) }),
  });
  const j = await r.json().catch(() => null);
  if (!j || j.ok !== true) throw new Error((j && j.error) || "the slides could not be written (" + r.status + ")");
  if (j.state !== "outline" || !j.deck) throw new Error(j.answer || "no slides came back");
  return j.deck;
}

async function makeSlides(turns, deck) {
  const P = await lib("slides");
  const p = new P();
  p.layout = "LAYOUT_WIDE";
  const ink = "14171C", dim = "60666F";
  let s = p.addSlide();
  s.addText(deck.title || titleFor(turns), { x: 0.6, y: 2.3, w: 12, h: 1.3, fontSize: 36, bold: true, color: ink });
  s.addText("Made " + new Date().toLocaleDateString() + " from a conversation with your business records", { x: 0.6, y: 3.7, w: 12, h: 0.5, fontSize: 14, color: dim });
  for (const sl of deck.slides) {
    s = p.addSlide();
    s.addText(sl.title, { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 28, bold: true, color: ink });
    const t = sl.chart_from_turn ? turns[sl.chart_from_turn - 1] : null;
    const ch = t && t.body.chart;
    const pts = sl.points.map((x) => ({ text: x, options: { bullet: true, breakLine: true } }));
    if (pts.length) s.addText(pts, { x: 0.6, y: 1.4, w: ch ? 5.4 : 12, h: 5.4, fontSize: 18, color: ink, valign: "top" });
    if (ch) {
      s.addChart(ch.kind === "line" ? p.ChartType.line : p.ChartType.bar,
        ch.series.map((se) => ({ name: se.name || ch.title || "Value", labels: ch.labels, values: se.values })),
        { x: pts.length ? 6.2 : 0.6, y: 1.4, w: pts.length ? 6.6 : 12, h: 5.4, chartColors: ["1F55C8", "B8401A", "2F7D4F", "7A4FB5"],
          showLegend: ch.series.length > 1, showTitle: !!ch.title, title: ch.title || "", titleFontSize: 14,
          catAxisLabelFontSize: 11, valAxisLabelFontSize: 11 });
    }
  }
  s = p.addSlide();
  s.addText("Sources", { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 28, bold: true, color: ink });
  const lines = [], seen = new Set();
  for (const t of turns) for (const x of sourcesOf(t.body)) {
    const key = x.title + "|" + x.date;
    if (seen.has(key) || lines.length >= 16) continue;
    seen.add(key); lines.push(x.title + (x.where ? ", " + x.where : "") + (x.date ? ", " + x.date : ""));
  }
  if (!lines.length) lines.push("No record of the company was used for these slides.");
  for (const t of turns) for (const l of readLines(t.body)) if (!seen.has(l)) { seen.add(l); lines.push(l); }
  s.addText(lines.map((l) => ({ text: l, options: { breakLine: true } })), { x: 0.6, y: 1.3, w: 12, h: 5.8, fontSize: 12, color: dim, valign: "top" });
  await p.writeFile({ fileName: fileName(deck.title || titleFor(turns), "pptx") });
}

const WORD = { pdf: "PDF", spreadsheet: "spreadsheet", slides: "slides" };
async function make(kind, turns, ctx, said, n, ask) {
  if (!turns.length) { said.textContent = "There is no answer here to make it from yet."; return; }
  try {
    if (kind === "pdf") { said.textContent = "Making the PDF."; await makePdf(turns); }
    else if (kind === "spreadsheet") { said.textContent = "Making the spreadsheet."; await makeSheet(turns); }
    else { said.textContent = "Writing the slides from what you were shown."; const deck = await askOutline(ctx, turns, n, ask); said.textContent = "Making the slides."; await makeSlides(turns, deck); }
    said.textContent = "The " + WORD[kind] + " is in your downloads. It was made on this computer and is not kept anywhere else.";
  } catch (e) {
    said.textContent = "The " + WORD[kind] + " could not be made: " + (e && e.message ? e.message : e);
  }
}

function buttons(slot, ctx) {
  const row = mk("div", "out-row");
  const said = mk("p", "out-said");
  said.setAttribute("aria-live", "polite");
  for (const [kind, label] of [["pdf", "PDF"], ["spreadsheet", "Spreadsheet"], ["slides", "Slides"]]) {
    const b = mk("button", "out-btn", label);
    b.type = "button";
    b.title = "Make a " + WORD[kind] + " of this answer";
    b.addEventListener("click", async () => {
      b.disabled = true;
      await make(kind, [{ q: questionOf(slot), body: slot._outBody }], ctx, said, null, questionOf(slot));
      b.disabled = false;
    });
    row.appendChild(b);
  }
  const wrap = mk("div", "out-wrap");
  wrap.append(row, said);
  return wrap;
}

// "make this a PDF", "turn this chat into five slides": lens-ask says which file and of what; it is made here
// from the answers above it. A kept turn reopened later does not download again by itself; it offers to.
function outputTurn(slot, body, ctx) {
  const o = body.output;
  const said = mk("p", "out-said");
  said.setAttribute("aria-live", "polite");
  const run = () => {
    const before = conversationUpTo(slot);
    const turns = o.of === "chat" ? before : before.slice(-1);
    return make(o.kind, turns, ctx, said, o.slides, questionOf(slot));
  };
  if (body._built) {
    const b = mk("button", "out-btn", "Make it again");
    b.type = "button";
    b.addEventListener("click", async () => { b.disabled = true; await run(); b.disabled = false; });
    const row = mk("div", "out-row"); row.appendChild(b);
    slot.append(row, said);
    return;
  }
  body._built = true;
  slot.appendChild(said);
  run();
}

export function attachOutputs(slot, body, ctx) {
  if (!slot || !body || typeof body !== "object") return;
  slot._outBody = body;
  if (body.chart && Array.isArray(body.chart.labels) && Array.isArray(body.chart.series) && body.chart.series.length) {
    const block = chartBlock(body.chart);
    const before = slot.querySelector(":scope > details");
    if (before) slot.insertBefore(block, before); else slot.appendChild(block);
  }
  if (body.state === "output" && body.output) { outputTurn(slot, body, ctx); return; }
  if (hasContent(body)) slot.appendChild(buttons(slot, ctx));
}

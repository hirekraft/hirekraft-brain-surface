// ─────────────────────────────────────────────────────────────────────────────
// LOGIC AND STATE. No colour, size or spacing value appears in this file; those
// live entirely in skin.css. The aesthetic can be replaced without opening this.
//
// Reading is live. Every figure on the surface comes from one call to
// brain_shape(), which resolves the caller from their signed token. Nothing is
// cached and nothing is hand-typed. Where the brain holds no value, the surface
// says so — it never fills the gap with something plausible.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { onBrainChange } from "../doorbell.js";

const SUPABASE_URL = "https://uvdoompnnypmneyrvtas.supabase.co";
// Public by design: it names the project, it grants nothing. All authority is in the JWT.
const PUBLISHABLE_KEY = "sb_publishable_joP87JJiePfN3k1uPoxxVA_DLGT1zv5";

const sb = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, flowType: "pkce" },
});

const $ = (s, r = document) => r.querySelector(s);
const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };
const icon = (id, cls = "mark") =>
  `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

let shape = null;   // the live reading, or null until it lands

// ── the six groups are known before any data arrives, so the frame can be drawn
//    immediately and the reading can land into reserved space without moving it.
const GROUPS = [
  { key: "email",    label: "Email",             icon: "i-mail" },
  { key: "drives",   label: "Drives & folders",  icon: "i-drive" },
  { key: "calendar", label: "Calendar",          icon: "i-cal" },
  { key: "contacts", label: "Contacts",          icon: "i-people" },
  { key: "systems",  label: "Systems",           icon: "i-system" },
  { key: "loose",    label: "Loose files",       icon: "i-loose" },
];

// ── what can actually be connected today. `wired` is not a guess: it reflects
//    which source types have OAuth configured on this project. Anything not
//    wired says so instead of offering a button that cannot work.
const PICKERS = {
  email: {
    head: "Which mail?", sub: "Pick your provider. You sign in on their page, not here.",
    options: [
      { name: "Google",             type: "gmail", wired: true },
      { name: "Microsoft",          wired: false },
      { name: "Yahoo",              wired: false },
      { name: "Enter your address", wired: false },
    ],
  },
  drives: {
    head: "Which drive?", sub: "Your files stay where they are. Nothing is moved or reorganised.",
    options: [
      { name: "Google Drive", type: "drive", wired: true },
      { name: "OneDrive",     wired: false },
      { name: "Dropbox",      wired: false },
      { name: "Box",          wired: false },
    ],
  },
  calendar: {
    head: "Which calendar?", sub: "Meetings, and who was in them.",
    options: [{ name: "Google Calendar", wired: false }, { name: "Outlook Calendar", wired: false }],
  },
  contacts: {
    head: "Which directory?", sub: "So the people already known from mail can be checked against a list.",
    options: [{ name: "Google Contacts", wired: false }, { name: "Phone", wired: false }],
  },
  systems: {
    head: "Which system?", sub: "These are reached at the moment you ask, not copied.",
    options: [{ name: "QuickBooks", type: "qbo", wired: true, account: true },
              { name: "Wise",       wired: false }],
  },
  loose: {
    head: "Drop in files", sub: "A one-off set of documents that does not live in a connected drive.",
    options: [], loose: true,
  },
};

// ── formatting ───────────────────────────────────────────────────────────────

const fmtWindow = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return `${date}, ${time}`;
};

const fmtDay = (iso) => iso
  ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  : null;

// Health is stated in words. Healthy is quiet; anything else says what it is.
const HEALTH = {
  reading:     "reading live",
  behind:      "behind its schedule",
  paused:      "read before; nothing scheduled to read it again",
  never:       "connected, never read",
  refused:     "connected, but the last read was refused",
  unconnected: "not connected",
};
// The words above are the claim; these map them onto the skin's existing states so
// the new vocabulary introduces no new colour. "refused" and "never" used to both
// render as "read once, not on a schedule" -- a revoked source reading as a calm
// sentence -- which is why the derivation moved into the database.
const HEALTH_CLASS = {
  reading: "live", behind: "stalled", paused: "unread",
  never: "unread", refused: "stalled", unconnected: "off",
};

const escape = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ── reading the brain ────────────────────────────────────────────────────────

async function readBrain() {
  const tree = $("#tree");
  try {
    const { data, error } = await sb.rpc("brain_shape");
    if (error) throw error;

    if (data?.state === "unbound") { renderState("unbound"); routeOnState("unbound"); return; }

    shape = data;
    renderWho();
    fillTree();
    fillAttention();
    fillRecognition();
    renderState("live");
    routeOnState("live");
  } catch (e) {
    // Never fabricate and never hang. Say the reading did not come back.
    renderState("unreachable", e?.message ?? String(e));
    routeOnState("unknown");
  } finally {
    tree.setAttribute("aria-busy", "false");
  }
}

function renderState(state, detail) {
  const box = $("#live-state");
  const who = $("#whoami");
  box.innerHTML = "";
  const b = el("div", "banner");

  if (state === "live") {
    b.className = "quiet";
    b.textContent = `Read live from your brain at ${fmtWindow(shape.read_at)}. `
      + `Every figure above comes from that reading.`;
  } else if (state === "unbound") {
    b.className = "banner bad";
    b.innerHTML = `This browser is not signed in to a brain identity, so there is nothing to show. `
      + `Nothing is hidden and nothing has failed — an unsigned request resolves to nobody. `
      + `<a href="../login/">Sign in</a> and this fills in.`;
    who.innerHTML = `<span class="quiet">not signed in</span>`;
    blankSkeletons("nothing to read");
  } else {
    b.className = "banner bad";
    b.textContent = "The brain could not be reached just now, so nothing above is filled in. "
      + "This is the reading failing, not the sources being empty. "
      + (detail ? `Reported: ${detail}` : "");
    who.innerHTML = `<span class="quiet">reading unavailable</span>`
      + `<br><span class="m-nav">we could not read your source list`
      + `${detail ? ` &mdash; ${escape(detail)}` : ""}</span>`;
    blankSkeletons("could not reach");
  }
  box.appendChild(b);
}

// A placeholder that never resolves would be a spinner that lies. When the read
// fails, the reserved space says why instead of breathing forever.
function blankSkeletons(word) {
  document.querySelectorAll("#tree [data-shape]").forEach((cell) => {
    cell.innerHTML = `<span class="state unread"><span class="dot"></span>${word}</span>`;
  });
}

function renderWho() {
  const v = shape.viewer;
  $("#whoami").innerHTML = `<b>${escape(v.name)}</b><br>${escape(v.role ?? "")}`;
  $("#sum-head").textContent = v.all_access
    ? "What is in it."
    : "What is in it, as far as you reach.";
}

// ── the tree: structure first, then the reading lands into it ────────────────

function drawTreeFrame(sel = "#tree", pfx = "") {
  const tree = $(sel);
  if (!tree) return;
  tree.innerHTML = "";
  for (const g of GROUPS) {
    const wrap = el("div", "grp");
    wrap.dataset.group = g.key;

    const row = el("button", "grp-row");
    row.type = "button";
    row.setAttribute("aria-expanded", "false");
    row.id = `row-${pfx}${g.key}`;
    row.innerHTML =
      `<span class="grp-label">${g.label}</span>` +
      `<span class="grp-shape" data-shape><span class="skel"></span></span>` +
      `<svg class="chev" width="14" height="14" aria-hidden="true"><use href="#i-chev"/></svg>`;

    const body = el("div");
    body.hidden = true;
    body.id = `body-${pfx}${g.key}`;
    row.setAttribute("aria-controls", body.id);

    row.addEventListener("click", () => toggle(g.key, pfx));
    wrap.append(row, body);
    tree.appendChild(wrap);
  }
}

// One lens, one reading. The prefix arguments survive so the renderer stays
// reusable, but there is only one set of groups now.
function groupsFor() { return shape?.groups ?? []; }

function fillTree(sel = "#tree", pfx = "") {
  const root = $(sel);
  if (!root) return;
  for (const g of GROUPS) {
    const data = groupsFor(pfx).find((x) => x.key === g.key);
    const cell = $(`[data-group="${g.key}"] [data-shape]`, root);
    if (!data) { cell.innerHTML = `<span class="state unread">not tracked</span>`; continue; }

    if (!data.connected) {
      cell.innerHTML = `<span class="state unread"><span class="dot"></span>nothing connected</span>`;
      continue;
    }
    // The overview carries shape, aliveness and reach back — never a raw file count.
    // "Email - 6 mailboxes - reading live - back to Mar 2024".
    const live = data.live ?? (data.members ?? []).filter((m) => m.health === "reading").length;
    const total = data.members?.length ?? data.count;
    const alive = data.kind === "reached"
      ? "reached when asked"
      : (live === total ? "all reading live"
         : live === 0 ? "none reading live" : `${live} of ${total} reading live`);
    // "back to Mar 2024" - the month the memory reaches back to, not a full date.
    const span = data.span
      ? ` &middot; back to ${new Date(data.span).toLocaleDateString(undefined,
          { month: "short", year: "numeric" })}`
      : "";
    cell.innerHTML =
      `<span>${data.count} ${escape(data.noun)}</span> &middot; <span class="state">${alive}</span>`
      + span;
  }
}

function toggle(key, pfx = "") {
  const row = $(`#row-${pfx}${key}`);
  const body = $(`#body-${pfx}${key}`);
  const open = row.getAttribute("aria-expanded") === "true";
  row.setAttribute("aria-expanded", String(!open));
  body.hidden = open;
  if (!open) drawMembers(key, body, pfx);
}

// Level 2 — the members, expanded in place. Each carries its reading window.
function drawMembers(key, body, pfx = "") {
  body.innerHTML = "";
  const data = groupsFor(pfx).find((x) => x.key === key);

  if (!data) {
    body.innerHTML = `<p class="empty-note">This part of the brain has not been read in this `
      + `browser, so there is nothing to open yet.</p>`;
    return;
  }
  if (!data.connected) {
    const p = el("p", "empty-note");
    p.textContent = data.empty_note ?? "Nothing connected yet.";
    const b = el("button", "go");
    b.type = "button";
    b.textContent = `Connect ${data.label.toLowerCase()}`;
    b.addEventListener("click", () => openConnect(key));
    body.append(p, b);
    return;
  }

  const list = el("ul", "members");
  for (const m of data.members) {
    const li = el("li");
    const btn = el("button", "member");
    btn.type = "button";

    const from = fmtWindow(m.window_from);
    const win = from
      ? `from ${from} &rarr; now`
      : `<span class="state unread">no dates recorded for this source</span>`;
    const grants = m.grants && m.grants > 1 ? ` &middot; reachable by ${m.grants} people` : "";

    const nav = m.nav ? `<span class="m-nav">${escape(m.nav)}</span>` : "";
    btn.innerHTML =
      `<span class="m-name${m.named === false ? " unnamed" : ""}">${escape(m.name)}${grants}${nav}</span>` +
      `<span class="m-win">${win}</span>` +
      `<svg class="chev" width="14" height="14" aria-hidden="true"><use href="#i-chev"/></svg>`;

    btn.addEventListener("click", () => {
      if (m.opens) { userMoved = true; location.href = m.opens; return; }
      drawPlaceholder(li, m, data);
    });
    li.appendChild(btn);

    const st = el("div", `state ${HEALTH_CLASS[m.health] ?? ""}`);
    st.innerHTML = `<span class="dot"></span>${HEALTH[m.health] ?? m.health}`
      + (m.latest && m.health !== "reading" ? ` &middot; newest item ${fmtDay(m.latest)}` : "");
    li.appendChild(st);

    list.appendChild(li);
  }
  body.appendChild(list);
}

// Level 3 — wired, and honest that the room is not built yet.
function drawPlaceholder(li, m, group) {
  const open = $(".placeholder", li);
  if (open) { open.remove(); return; }

  const box = el("div", "placeholder");
  const what = group.key === "email"   ? "inbox"
             : group.key === "drives"  ? "files"
             : group.key === "systems" ? "figures" : "records";
  box.innerHTML =
    `<h3>This is where the ${what} for ${escape(m.name)} will live.</h3>` +
    `<p class="quiet">Reading and acting on ${what} is a separate build. The way in is wired now, `
    + `so it opens here when it lands, and nothing else about this screen changes.</p>`
    + (m.items
        ? `<p class="quiet">The brain currently holds ${m.items.toLocaleString()} pieces from this source.</p>`
        : `<p class="quiet">The brain holds nothing from this source yet.</p>`);
  li.appendChild(box);
}

// ── recognition: describe what is seen, name what is not. Never rank. ───────

function fillRecognition() {
  const ul = $("#recog");
  ul.innerHTML = "";
  const lines = [];

  const mail = shape.groups.find((g) => g.key === "email");
  if (mail?.connected) {
    const dated = mail.members.filter((m) => m.window_from);
    const earliest = dated.map((m) => m.window_from).sort()[0];
    lines.push(`Mail is being read from ${mail.count} mailboxes`
      + (earliest ? `, reaching back to ${fmtDay(earliest)}.` : "."));
  }

  const dr = shape.groups.find((g) => g.key === "drives");
  if (dr?.connected) {
    const named = dr.members.filter((m) => m.named !== false);
    if (named.length) {
      lines.push(`${named.length} named drives are being read: `
        + named.slice(0, 6).map((m) => m.name).join(", ")
        + (named.length > 6 ? `, and ${named.length - 6} more.` : "."));
    }
    const shared = dr.members.filter((m) => m.grants > 1);
    if (shared.length) {
      lines.push(`${shared.length} of those are reached by more than one person, each through `
        + `their own account rather than a shared key.`);
    }
  }

  const sys = shape.groups.find((g) => g.key === "systems");
  if (sys?.connected) {
    const reached = sys.members.filter((m) => m.reached);
    const held = sys.members.filter((m) => !m.reached && m.items > 0);
    if (held.length) {
      lines.push(`Records from ${held.length} earlier system${held.length === 1 ? "" : "s"} `
        + `have been read in and kept.`);
    }
    if (reached.length) {
      lines.push(`${reached.map((m) => m.name).join(", ")} can be reached when asked, but nothing `
        + `from it is remembered.`);
    }
  }

  // Gaps, stated as plainly as the things present. These are the next connects.
  for (const g of shape.groups.filter((g) => !g.connected)) {
    lines.push({ gap: `Nothing describes your ${g.label.toLowerCase()} yet.` });
  }
  for (const m of shape.groups.flatMap((g) => g.members ?? []).filter((m) => m.health === "never")) {
    lines.push({ gap: `${m.name} is connected but has never been read, so nothing from it is known.` });
  }
  for (const m of shape.groups.flatMap((g) => g.members ?? []).filter((m) => m.health === "refused")) {
    lines.push({ gap: `${m.name} is connected, but the last attempt to read it was refused.` });
  }

  for (const l of lines) {
    const li = el("li", typeof l === "object" ? "gap" : "");
    li.textContent = typeof l === "object" ? l.gap : l;
    ul.appendChild(li);
  }
  const tail = el("li", "gap");
  tail.textContent = "If any of this is wrong, say so — a correction from you outranks anything it read.";
  ul.appendChild(tail);
}

// ── where we could do more ───────────────────────────────────────────────────

function fillAttention() {
  const ul = $("#attn");
  const head = $("#attn-count");
  if (head) {
    const n = shape.needs_you ?? 0;
    const other = (shape.attention?.length ?? 0) - n;
    head.textContent = n === 0
      ? "nothing needs you"
      : `${n} need${n === 1 ? "s" : ""} you`
        + (other > 0 ? `, ${other} ${other === 1 ? "is" : "are"} ours` : "");
  }
  ul.innerHTML = "";
  if (!shape.attention?.length) {
    ul.innerHTML = `<li class="quiet" style="border-left:0">Nothing needs you right now.</li>`;
    return;
  }
  for (const a of shape.attention) {
    const li = el("li");
    li.innerHTML = `<div class="a-title">${escape(a.title)}</div>`
      + `<div class="a-detail">${escape(a.detail)}</div>`;

    if (a.files?.length) {
      const box = el("div", "a-files");
      a.files.forEach((f, i) => {
        const link = el("a");
        link.href = f.url; link.target = "_blank"; link.rel = "noopener";
        link.textContent = `Open file ${i + 1} in your Drive`;
        box.appendChild(link);
      });
      li.appendChild(box);
    } else if (a.needs_customer === false || a.actionable === false) {
      // Never a button that would fail. An item this person cannot action says so,
      // and says whose it is, rather than routing them into a refusal.
      li.classList.add("ours");
      const mine = el("div", "a-mine");
      mine.textContent = `${a.fix}. ${a.why_not ?? ""}`.trim();
      li.appendChild(mine);
    } else {
      const fix = el("button", "a-fix");
      fix.type = "button";
      fix.textContent = a.fix;
      fix.addEventListener("click", () => routeFix(a));
      li.appendChild(fix);
    }
    ul.appendChild(li);
  }
}

function routeFix(a) {
  // Route by the source the fault is actually about, never by words in its title.
  if (a.source && a.source.startsWith("gmail:")) return openConnect("email");
  if (a.source && a.source.startsWith("drive:")) return openConnect("drives");
  const t = a.title.toLowerCase();
  if (t.includes("calendar"))   return openConnect("calendar");
  if (t.includes("contacts"))   return openConnect("contacts");
  if (t.includes("quickbooks")) return openConnect("systems");
  if (t.includes("mailbox"))    return openConnect("email");
  if (t.includes("drive"))      return openConnect("drives");
  say(`That one has no one-tap fix wired yet. What it needs: ${a.fix.toLowerCase()}.`);
}

// ── connect: one shape, every source type ────────────────────────────────────

function openConnect(groupKey) {
  goto("s-connect");
  const p = PICKERS[groupKey];
  if (!p) return stageTypes();
  stageProviders(groupKey, p);
}

function stageTypes() {
  $("#connect-eyebrow").textContent = "Connect a source";
  $("#connect-head").textContent = "What should Tool read?";
  $("#connect-sub").textContent = "Pick one. The steps are the same every time, whichever you choose.";
  const stage = $("#connect-stage");
  stage.innerHTML = "";
  const grid = el("div", "tiles");
  for (const g of GROUPS) {
    const b = el("button", "tile");
    b.type = "button";
    const kind = g.key === "systems" ? "reached when asked" : "read and remembered";
    b.innerHTML = icon(g.icon)
      + `<span class="t-name">${g.label}</span><span class="t-sub">${kind}</span>`;
    b.addEventListener("click", () => openConnect(g.key));
    grid.appendChild(b);
  }
  stage.appendChild(grid);
}

function stageProviders(groupKey, p) {
  $("#connect-eyebrow").textContent = "Connect a source";
  $("#connect-head").textContent = p.head;
  $("#connect-sub").textContent = p.sub;
  const stage = $("#connect-stage");
  stage.innerHTML = "";

  if (p.loose) return stageLoose(stage);

  const grid = el("div", "tiles");
  for (const o of p.options) {
    const b = el("button", "tile");
    b.type = "button";
    b.innerHTML =
      `<span class="mark" aria-hidden="true" style="display:grid;place-items:center;`
      + `border:1px solid currentColor;border-radius:3px;font-size:11px;font-weight:500">`
      + `${escape(o.name[0])}</span>`
      + `<span class="t-name">${escape(o.name)}</span>`
      + `<span class="t-sub">${o.wired ? "ready" : "not connected yet"}</span>`;
    b.addEventListener("click", () =>
      o.wired ? stageScope(groupKey, o) : stageNotWired(stage, o));
    grid.appendChild(b);
  }
  stage.appendChild(grid);

  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back to all sources";
  back.addEventListener("click", stageTypes);
  stage.appendChild(back);
}

function stageNotWired(stage, o) {
  const n = el("div", "notice flagged");
  n.innerHTML = `<b>${escape(o.name)} is not connected yet.</b> It is not built, so nothing here `
    + `pretends it is. Providers get added when a customer needs one — say the word and it gets `
    + `built, rather than sitting on a roadmap.`;
  stage.appendChild(n);
}

// The account-shaped truth is told at the moment it applies, not in a policy page.
function stageScope(groupKey, provider) {
  const stage = $("#connect-stage");
  stage.innerHTML = "";

  if (provider.account) {
    $("#connect-head").textContent = `Connect ${provider.name}`;
    $("#connect-sub").textContent = "";
    const n = el("div", "notice flagged");
    n.innerHTML = `<b>${escape(provider.name)} has no per-person boundary.</b> It connects at owner `
      + `level, so anyone who can reach it here sees all of it. There is no way to show one person `
      + `only their part, and this screen will not pretend otherwise. Only you can connect it.`;
    stage.appendChild(n);
    stage.appendChild(consentButton(provider, "admin", groupKey));
    const back = el("button", "go ghost");
    back.type = "button"; back.textContent = "Back";
    back.addEventListener("click", () => stageProviders(groupKey, PICKERS[groupKey]));
    stage.appendChild(back);
    return;
  }

  $("#connect-head").textContent = "Whose account?";
  $("#connect-sub").textContent = "This decides what gets listed, and what your colleagues see later.";

  const box = el("div", "choices");
  const noun = groupKey === "email" ? "mailbox" : "drive";

  const admin = el("button", "choice");
  admin.type = "button";
  admin.innerHTML = icon("i-lock")
    + `<span><span class="c-name">As administrator</span>`
    + `<span class="c-sub">Every company ${noun} is listed and you choose which go in. `
    + `Each colleague who signs in later reaches only their own.</span></span>`;
  admin.addEventListener("click", () => stageConsent(provider, "admin", groupKey));

  const solo = el("button", "choice");
  solo.type = "button";
  solo.innerHTML = icon("i-person")
    + `<span><span class="c-name">Just my account</span>`
    + `<span class="c-sub">Only what the account you sign in with already reaches.</span></span>`;
  solo.addEventListener("click", () => stageConsent(provider, "individual", groupKey));

  box.append(admin, solo);
  stage.appendChild(box);

  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back";
  back.addEventListener("click", () => stageProviders(groupKey, PICKERS[groupKey]));
  stage.appendChild(back);
}

function stageConsent(provider, scope, groupKey) {
  const stage = $("#connect-stage");
  stage.innerHTML = "";
  $("#connect-head").textContent = `Sign in with ${provider.name}`;
  $("#connect-sub").textContent = "";

  const n = el("div", "notice");
  n.innerHTML = `You sign in on ${escape(provider.name)}'s own page. Your password is never seen `
    + `here and never stored. Tool reaches only what that account already reaches, and you can `
    + `withdraw it from your ${escape(provider.name)} account at any time.`;
  stage.appendChild(n);

  if (scope === "admin") {
    const which = el("div", "notice");
    which.innerHTML = `<b>Which mailbox should this cover?</b> Leave it blank to use your own.`
      + `<br><input id="mbx" type="email" placeholder="name@yourcompany.com" `
      + `style="margin-top:.6rem;width:100%;max-width:22rem;font:inherit;padding:.5rem;`
      + `border:1px solid currentColor;border-radius:4px;background:none;color:inherit">`;
    stage.appendChild(which);
  }

  stage.appendChild(consentButton(provider, scope, groupKey));

  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back";
  back.addEventListener("click", () => stageScope(groupKey, provider));
  stage.appendChild(back);
}

function consentButton(provider, scope, groupKey) {
  const wrap = el("div", "actions");
  const b = el("button", "go");
  b.type = "button";
  b.textContent = `Continue to ${provider.name}`;
  b.addEventListener("click", async () => {
    b.disabled = true;
    b.textContent = "Preparing\u2026";
    const mailbox = $("#mbx")?.value?.trim() || null;
    try {
      // source_begin resolves the acting identity from the token. There is no
      // identity to pass, which is the point.
      const { data, error } = await sb.rpc("source_begin", {
        p_source_type: provider.type, p_scope: scope, p_mailbox: mailbox,
      });
      if (error) throw error;

      if (!data?.ok) {
        b.disabled = false;
        b.textContent = `Continue to ${provider.name}`;
        return stageStopped({
          unbound:    "You are not signed in to a brain identity, so nothing can be connected. Sign in first.",
          owner_only: "Connecting on behalf of the firm is an owner-level act, and this identity is not an owner.",
          not_wired:  "That provider is not wired up, so there is nothing to consent to yet.",
          no_mailbox: "No address to connect. Enter the mailbox this should cover.",
        }[data?.reason] ?? `It stopped short: ${data?.reason ?? "unknown"}.`);
      }

      if (data.existing) {
        const n = el("div", "notice flagged");
        n.innerHTML = `<b>This source is already connected.</b> ${escape(data.note)}`;
        $("#connect-stage").appendChild(n);
      }
      // Hand off to the provider. The consent itself is a human act, by design.
      window.location.href = `${SUPABASE_URL}/functions/v1/oauth-start`
        + `?source_id=${encodeURIComponent(data.source_id)}`;
    } catch (e) {
      b.disabled = false;
      b.textContent = `Continue to ${provider.name}`;
      stageStopped(`The connect could not be started: ${e?.message ?? e}`);
    }
  });
  wrap.appendChild(b);
  return wrap;
}

function stageStopped(msg) {
  const n = el("div", "notice flagged");
  n.textContent = msg;
  $("#connect-stage").appendChild(n);
}

// Loose files: the gate is wired as an affordance. The estimate itself is the one
// piece deliberately not built here, and it says so rather than showing a number
// nobody calculated.
function stageLoose(stage) {
  const n = el("div", "notice");
  n.innerHTML = `<b>Large drops are checked before they are read.</b> A drop is scanned for its `
    + `size and shape first, and what reading it costs is shown for your approval before anything `
    + `is read. Nothing expensive happens quietly.`;
  const flag = el("div", "notice flagged");
  flag.innerHTML = `<b>Not finished in this build:</b> the scan and the approval step exist, but the `
    + `cost figure itself is not calculated yet. Rather than show an invented number, this stops `
    + `here — dropping files stays switched off until the estimate is real.`;
  stage.append(n, flag);
  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back to all sources";
  back.addEventListener("click", stageTypes);
  stage.appendChild(back);
}

// ── the consultant ──────────────────────────────────────────────────────────
// Answers from the live reading and from what is on this screen. When it does not
// know, it says which kind of not-knowing it is rather than improvising.

function say(text, asked) {
  const log = $("#dock-turns");
  if (asked) { const q = el("div", "turn asked"); q.textContent = asked; log.appendChild(q); }
  const a = el("div", "turn said");
  a.textContent = text;
  log.appendChild(a);
  $("#dock").classList.add("open");
  $("#dock-log").scrollTop = $("#dock-log").scrollHeight;
}

function answer(raw) {
  const q = raw.toLowerCase();
  const g = (k) => shape?.groups.find((x) => x.key === k);

  if (!shape) {
    return "The brain has not been read in this browser yet, so I cannot tell you what is in it. "
      + "That is a reading problem on this screen, not an empty brain.";
  }
  if (/(what|which).*(connect|source|read)/.test(q) || /^sources?\??$/.test(q)) {
    const on = shape.groups.filter((x) => x.connected).map((x) => `${x.label} (${x.count})`).join(", ");
    const off = shape.groups.filter((x) => !x.connected).map((x) => x.label).join(", ");
    return `Connected: ${on}. Not connected: ${off}. All of that comes from the reading taken at `
      + `${fmtWindow(shape.read_at)}.`;
  }
  if (/(how far|how long|back to|window|since when|history)/.test(q)) {
    const m = (g("email")?.members ?? []).filter((x) => x.window_from);
    if (!m.length) return "No mailbox has a recorded start date, so I cannot tell you how far back it reaches.";
    return `Mail reaches back to ${fmtDay(m.map((x) => x.window_from).sort()[0])}. Each mailbox shows `
      + `its own start when you open the Email line. Anything older is fetched only when a question `
      + `needs it, which keeps the reading cost down.`;
  }
  if (/(quickbooks|qbo|accounting system|books)/.test(q)) {
    return "QuickBooks is the reached kind: it is not copied in. It is asked at the moment you need "
      + "a figure, so the number is current, but nothing from it is remembered. It connects at owner "
      + "level and has no per-person boundary.";
  }
  if (/(two kinds|difference|remembered|reached)/.test(q)) {
    return "Two kinds. Read and remembered — mail, files, calendar — become part of the memory, so "
      + "they can be reasoned over in depth. Reached and used — QuickBooks and tools like it — are "
      + "asked at the moment you need them: current, but only what was asked for.";
  }
  if (/(safe|secure|privacy|who can see|permission|access)/.test(q)) {
    return `You are resolved as ${shape.viewer.name}, ${shape.viewer.role}. What you can see is what `
      + `your own accounts already let you see, checked as the answer is assembled rather than after. `
      + `Nothing here reaches Sense, and this brain sits in your own database.`;
  }
  if (/(move|change|delete|modify|read.?only|touch)/.test(q)) {
    return "It reads. It does not move, rename or delete anything. Your files and mail stay exactly "
      + "where they are, and you can leave at any time with nothing to unpick.";
  }
  if (/(wrong|problem|fix|attention|do more|broken)/.test(q)) {
    const n = shape.attention?.length ?? 0;
    return n
      ? `${n} things need you, listed under "where we could do more", each with what to do about it. `
        + `Retries and rate limits are not in that list; they sort themselves out.`
      : "Nothing needs you right now.";
  }
  if (/(cost|price|expensive|how much|spend)/.test(q)) {
    return "Reading has a cost, so the default window is about a year and older material is fetched "
      + "only when a question needs it. Large one-off drops are measured and priced for your approval "
      + "first — though that estimate is not yet calculated in this build.";
  }
  if (/(reading|updating|up to date|fresh|behind|stopped|still working)/.test(q)) {
    if (!shape) return "I have not been able to read your sources, so I cannot tell you what "
      + "is reading. That is a reading failure on this screen, not an answer.";
    const gs = shape.groups.filter((g) => g.connected);
    const conn = gs.reduce((n, g) => n + (g.count ?? 0), 0);
    const live = gs.reduce((n, g) => n + (g.live ?? 0), 0);
    return `${conn} sources have a permission held and ${live} are actually reading. Those are `
      + `different facts: a permission we hold brings nothing in on its own. `
      + `${shape.needs_you ?? 0} of the things below need a decision from you.`;
  }
  return "I can answer what is connected, what is actually reading, how far back each source "
    + "reaches, what needs you, how the "
    + "two kinds of connection differ, and what this can and cannot see. Questions about the contents "
    + "of your actual mail and documents come when those lenses are built — I would rather say that "
    + "than guess.";
}

// The sources tab was a second build of this same lens and is retired. What it
// derived came across into brain_shape: the credential mechanism, the drill-in
// labels, the faults grouped by cause, and the count that separates what needs you
// from what is ours.

// ── steps ───────────────────────────────────────────────────────────────────

// The page opens on the holding state, so this must ALWAYS land somewhere - a
// route that declines to move now leaves the person waiting rather than on a
// merely-wrong screen.
let routed = false;
function routeOnState(mode) {
  if (routed) return;                           // this chooses the OPENING screen, once
  if (userMoved) return;                        // never move someone who has chosen
  routed = true;
  if (location.hash === "#sources") { goto("s-summary"); return; }
  // Nobody signed in: the introduction is the honest screen, and it claims nothing
  // about data because there is no identity to claim it about.
  if (mode === "unbound") { goto("s-intro"); return; }
  // The reading failed, so the state is unknown. Show the lens carrying its own
  // failure rather than a first-run screen, which would assert an empty brain on
  // the strength of a request that never came back.
  if (mode === "unknown") { goto("s-summary"); return; }
  const connected = (shape?.groups ?? []).reduce((n, g) => n + (g.count ?? 0), 0);
  goto(connected > 0 ? "s-summary" : "s-intro");
}

function goto(id) {
  document.querySelectorAll("section.step").forEach((s) => { s.hidden = s.id !== id; });
  window.scrollTo({ top: 0 });
  if (id === "s-connect" && !$("#connect-stage").children.length) stageTypes();
}

// ── boot ────────────────────────────────────────────────────────────────────

drawTreeFrame();                 // the frame first, instantly, with space reserved
stageTypes();

// Once a person has chosen a screen, a late-arriving reading must not move them
// off it. Declared before the first read is issued, below.
let userMoved = false;
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-goto]");
  if (b) { userMoved = true; goto(b.dataset.goto); }
});

$("#ask-send").addEventListener("click", ask);
$("#ask").addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });

function ask() {
  const v = $("#ask").value.trim();
  if (!v) { $("#dock").classList.toggle("open"); return; }
  $("#ask").value = "";
  say(answer(v), v);
}

say("I am here the whole way through. Ask about anything on this screen — what is connected, how far "
  + "back it reads, or what any of it means.");

readBrain();                     // then the live reading lands into the frame
// An old #sources link still lands somewhere true: there is one lens now. Routed
// immediately rather than waiting for the read, because it is already a decision.
if (location.hash === "#sources") { userMoved = true; goto("s-summary"); }

/* ================= the doorbell ================= */
/* A source going live, falling behind, or a read landing is the same class of
   change as new mail, so this lens takes the same bell. The re-ask goes through
   brain_shape() - the one gated reading - and a group the person has opened is
   redrawn from the new reading rather than snapped shut. */
async function refreshBrain() {
  await readBrain();
  document.querySelectorAll('#tree [aria-expanded="true"]').forEach((row) => {
    const key = row.id.replace(/^row-/, "");
    const body = $("#body-" + key);
    if (body && !body.hidden) drawMembers(key, body);
  });
}

sb.auth.getSession().then(({ data }) => {
  const jwt = data?.session?.access_token;
  if (jwt) onBrainChange(sb, jwt, refreshBrain, { label: "brain" });
});

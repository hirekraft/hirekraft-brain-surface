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
// The Mail tab (seat mail-redesign, 2026-10-07). Its token moves with this file's own.
import { initMail, drawMail, chooseMailbox, askFromMailBar } from "./mail.js?v=2026-10-07-workspace";

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

// Mailbox rows, keyed by source key. Their words live in mailbox_state() on the
// brain rather than here: the wording IS the design on this screen, and a wording
// change should cost a migration, not a redeploy of a lens.
let mailboxes = new Map();
let mbxError = null;

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

// ARRIVAL COSTS ONE ROUND TRIP, NOT TWO. All three readings now start together.
// brain_shape does not feed readMailboxes or readDriveStates - neither of them
// touches `shape` - so awaiting it before starting them was a whole extra trip
// on every arrival, for no dependency.
//
// Navigation was never re-reading the brain: goto() only hides and shows
// sections and stages the connect screen once, openConnect stages a picker
// without reading, and drawMembers fetches nothing. This function runs twice by
// design, at boot and when the doorbell says something changed.
//
// Both helpers swallow their own errors and never reject, so starting them
// before the unbound check cannot produce an unhandled rejection. A signed-out
// caller spends two cheap gated calls whose results are then ignored.
async function readBrain() {
  const tree = $("#tree");
  try {
    const mbx = readMailboxes();
    const drv = readDriveStates();
    const { data, error } = await sb.rpc("brain_shape");
    if (error) throw error;

    if (data?.state === "unbound") { renderState("unbound"); routeOnState("unbound"); return; }

    shape = data;
    await Promise.all([mbx, drv]);
    renderWho();
    fillTree();
    fillAttention();
    fillRecognition();
    fillAdoptable();
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

// Never falls back to the old vocabulary when it fails. A row that cannot say its
// state says that, rather than borrowing a sentence from somewhere else that might
// happen to be reassuring.
async function readMailboxes() {
  mailboxes = new Map();
  mbxError = null;
  try {
    const { data, error } = await sb.rpc("mailbox_state");
    if (error) throw error;
    for (const r of data ?? []) mailboxes.set(r.source_key, r);
  } catch (e) {
    mbxError = e?.message ?? String(e);
  }
}

// Remembered so a source tab can say whether the reading is still coming, failed,
// or found nobody signed in, rather than guessing from an empty list.
let readingState = null;
function renderState(state, detail) {
  readingState = state;
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
  // Every reading ends here, so an open source tab is redrawn from it (seat tool-tabs).
  if ($('#s-lens') && !$('#s-lens').hidden) drawLens();
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
  // Tests are the owner's. Hiding the way in is courtesy; the brain refuses anyone else.
  const te = $("#tests-entry");
  if (te) te.hidden = !v.all_access;
  const ae = $("#access-entry");
  if (ae) ae.hidden = !v.all_access;
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
    const total = data.members?.length ?? data.count;
    let alive;
    if (g.key === "drives" && driveStates.size) {
      // The same words the rows below use, and the same words the picker uses.
      const rows = [...driveStates.values()];
      const need = rows.filter((r) => r.state === "needs_signin" || r.state === "shut_out").length;
      const busy = rows.filter((r) => r.state === "filling").length;
      const ok   = rows.filter((r) => r.state === "ready").length;
      const unread = rows.filter((r) => r.state === 'unread').length;
      const failed = rows.filter((r) => r.state === 'failed').length;
      alive = [busy ? `${busy} reading now` : null,
               unread ? `${unread} not read yet` : null,
               failed ? `${failed} stopped` : null,
               ok ? `${ok} up to date` : null,
               need ? `${need} need you` : null]
              .filter(Boolean).join(", ") || "none chosen yet";
    } else if (g.key === "email" && mailboxes.size) {
      // The group counts in the same words its own rows use. Two vocabularies for
      // one fact is how a summary starts disagreeing with the list below it.
      const rows = [...mailboxes.values()];
      // Counted from what happened to each mailbox (seat mail-lens, 2026-10-06). The
      // old count called every mailbox that did not need the person working, so a
      // mailbox never read once was counted as working.
      const count = (f) => rows.filter(f).length;
      const reading = count((r) => r.state === 'reading' || r.state === 'closed_to_you');
      const unread = count((r) => r.state === 'unread');
      const stopped = count((r) => r.state === 'stopped');
      const need = count((r) => r.needs_you);
      alive = [reading ? `${reading} reading` : null,
               unread ? `${unread} not read yet` : null,
               stopped ? `${stopped} stopped` : null,
               need ? `${need} need you` : null].filter(Boolean).join(', ') || 'state not recorded';
      // A mailbox row is keyed by its full source key on this screen, and the picker
      // keys drives by a bare id. Both lookups are explicit rather than assumed -
      // guessing one shape from the other is what labelled every live drive junk.
    } else if (g.key === "email" && mbxError) {
      alive = "state could not be read";
    } else {
      const live = data.live ?? (data.members ?? []).filter((m) => m.health === "reading").length;
      alive = data.kind === "reached"
        ? "reached when asked"
        : (live === total ? "all reading live"
           : live === 0 ? "none reading live" : `${live} of ${total} reading live`);
    }
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

  // Without this the drive rows are a report on decisions nobody was ever asked
  // to make. The list below is the consequence of the choice; this is the choice.
  if (key === "drives") {
    const choose = el("button", "go");
    choose.type = "button";
    choose.textContent = "Choose what comes in";
    choose.style.marginBottom = "1.2rem";
    choose.addEventListener("click", () => stageDrivePicker(driveAccountKey()));
    body.appendChild(choose);
  }

  const list = el("ul", "members");
  // Mailboxes from more than one company are grouped under their domain, so they are
  // told apart at a glance (Alex, 2026-10-06). One domain needs no heading.
  const domainOf = (m) => m.domain ?? String(m.full ?? '').split('@')[1] ?? '';
  const domains = key === 'email' ? new Set(data.members.map(domainOf)) : new Set();
  const members = domains.size > 1
    ? [...data.members].sort((a, b) => domainOf(a).localeCompare(domainOf(b)))
    : data.members;
  let lastDomain = null;
  for (const m of members) {
    if (domains.size > 1 && domainOf(m) !== lastDomain) {
      lastDomain = domainOf(m);
      const h = el('li', 'quiet');
      h.style.margin = '1rem 0 .3rem';
      h.textContent = lastDomain;
      list.appendChild(h);
    }
    const li = el("li");
    const btn = el("button", "member");
    btn.type = "button";

    const from = fmtWindow(m.window_from);
    const win = from
      ? `from ${from} &rarr; now`
      : `<span class="state unread">${m.health === 'never' ? 'nothing read yet' : 'no dates recorded for this source'}</span>`;
    const grants = m.grants && m.grants > 1 ? ` &middot; reachable by ${m.grants} people` : "";

    const nav = m.nav ? `<span class="m-nav">${escape(m.nav)}</span>` : "";
    btn.innerHTML =
      `<span class="m-name${m.named === false ? " unnamed" : ""}">${escape(m.full ?? m.name)}${grants}${nav}</span>` +
      `<span class="m-win">${win}</span>` +
      `<svg class="chev" width="14" height="14" aria-hidden="true"><use href="#i-chev"/></svg>`;

    btn.addEventListener("click", () => {
      // brain_shape has always carried `target` (the real source key) beside
      // `opens`, and the link ignored it - so every mailbox opened whatever the
      // mail lens defaults to. Clicking recruitment@ landed on alex@, which is
      // the worst possible version of wrong on a surface about whose mail is whose.
      // A mailbox opens in the Mail tab now; the July page at /mail/ is archived (seat
      // mail-redesign, 2026-10-07).
      if (key === 'email' && m.target && m.target.startsWith('gmail:')) {
        userMoved = true;
        chooseMailbox(m.target);
        goto('s-lens', 'email');
        return;
      }
      if (m.opens) {
        userMoved = true;
        location.href = m.target && m.target.startsWith("gmail:")
          ? `${m.opens}?mailbox=${encodeURIComponent(m.target)}`
          : m.opens;
        return;
      }
      drawPlaceholder(li, m, data);
    });
    li.appendChild(btn);

    const mb = key === "email"  ? mailboxes.get(m.target)
             : key === "drives" ? driveStateFor(m.target)
             : null;
    if (mb) {
      li.appendChild(mb.tone ? driveLine(mb) : mailboxLine(mb));
    } else if (key === "drives") {
      // No state for this row. That is a statement about OUR records, not about the
      // drive: it may be an old entry with no root, or something this screen cannot
      // account for. Either way it says it cannot say. The previous wording here
      // declared every one of them worthless, which is the failure a fallback must
      // never commit - asserting instead of admitting.
      const st = el("div", "state tone-plain");
      st.innerHTML = `<span class="dot"></span>Not one of the drives you chose &mdash; `
        + `an older record, kept until you decide about it`;
      li.appendChild(st);
    } else if (key === "email" && mbxError) {
      const st = el("div", "state stalled");
      st.innerHTML = `<span class="dot"></span>Its state could not be read just now `
        + `(${escape(mbxError)}), so this line is not a claim either way.`;
      li.appendChild(st);
    } else {
      const st = el("div", `state ${HEALTH_CLASS[m.health] ?? ""}`);
      st.innerHTML = `<span class="dot"></span>${HEALTH[m.health] ?? m.health}`
        + (m.latest && m.health !== "reading" ? ` &middot; newest item ${fmtDay(m.latest)}` : "");
      li.appendChild(st);
    }

    list.appendChild(li);
  }
  body.appendChild(list);
}

// One drive, one line, the same sentence the picker shows. Where something needs a
// person it says so; where it does not, it is quiet.
// A mail member's target is a full source key; a drive member's is the bare Google
// id. Try what we are given and the two forms a drive key takes, rather than assume
// one group's shape from the other's.
function driveStateFor(target) {
  if (!target) return null;
  return driveStates.get(target)
      ?? driveStates.get(`drive:shared:${target}`)
      ?? driveStates.get(`drive:folder:${target}`)
      ?? null;
}

function driveLine(s) {
  const wrap = el("div", `state tone-${s.tone}`);
  wrap.innerHTML = `<span class="dot"></span><span class="s-head">${escape(s.headline)}</span>`
    + (s.detail ? ` &middot; ${escape(s.detail)}` : "");
  if (s.action === "sign_in") wrap.appendChild(signInAgainControl(s));
  if (s.action === "resume")  wrap.appendChild(resumeControl(s));
  return wrap;
}

// One switch, and it says so. The drive is already chosen and already read; all
// that lapsed is anything looking at it again.
function resumeControl(s) {
  const b = el("button", "a-fix");
  b.type = "button";
  b.style.marginLeft = ".7rem";
  b.textContent = s.action_label ?? "Start reading it again";
  b.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    b.disabled = true;
    const was = b.textContent;
    b.textContent = "starting\u2026";
    try {
      const { data, error } = await sb.rpc("source_resume", { p_source_key: s.source_key });
      if (error) throw error;
      if (!data?.ok) { b.disabled = false; b.textContent = data?.note ?? was; return; }
      say(`${s.label}: back on its schedule. ${data.note}`);
      await readDriveStates();
      for (const redraw of rowRedraws) redraw();
      await refreshBrain();
    } catch (e) {
      b.disabled = false;
      b.textContent = `Could not start it: ${e?.message ?? e}`;
    }
  });
  return b;
}

// The states carry no new colour: they land on the skin's existing three.
const MBX_CLASS = {
  reading: "live", closed_to_you: "live", unread: "unread", stopped: "stalled",
  off: "unread", not_yours: "unread",
};

// One mailbox, one state, and where something is wrong the press that fixes it is
// on this line. A problem in one place and its solution in another is how a screen
// tells someone they are stuck.
function mailboxLine(mb) {
  // Same tone vocabulary as a drive. A row that needs a person looks the same
  // whether it is a mailbox or a drive, because that is the whole point of a tone.
  const wrap = el("div", `state tone-${mb.tone ?? MBX_CLASS[mb.state] ?? "plain"}`);
  // When it was last read, in the viewer's own time (seat mail-lens, 2026-10-06).
  const read = mb.last_read_at ? `, last read ${fmtWindow(mb.last_read_at)}` : '';
  wrap.innerHTML = `<span class="dot"></span><span class="s-head">${escape(mb.headline)}${read}</span>`
    + (mb.detail ? ` &middot; ${escape(mb.detail)}` : "");
  if (!mb.action_label) return wrap;

  const b = el("button", "go ghost");
  b.type = "button";
  b.textContent = mb.action_label;
  b.style.marginLeft = ".6rem";
  b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const was = b.textContent;
    b.textContent = "opening Google";
    // Individual scope, always. The administrator path writes a firm-property
    // posture - the one the mail lens refuses - so that consent would complete
    // and this row would not move.
    const gmail = PICKERS.email.options.find((o) => o.type === "gmail");
    beginConnect(gmail, "individual", mb.address, b, () => { b.textContent = was; });
  });
  wrap.appendChild(b);
  return wrap;
}

// Level 3 — wired, and honest that the room is not built yet.
function drawPlaceholder(li, m, group) {
  const open = $(".placeholder", li);
  if (open) { open.remove(); return; }

  const box = el("div", "placeholder");
  const what = group.key === "email"   ? "inbox"
             : group.key === "drives"  ? "files"
             : group.key === "systems" ? "figures" : "records";

  // A row that says "not connected" has to carry the way to connect it. Describing a
  // room that will exist later, to someone who opened that row to open the door, is
  // the same defect as stating a problem in one place and its remedy in another -
  // which every other line on this screen already refuses to do.
  if (m.health === "unconnected") {
    box.innerHTML =
      `<h3>${escape(m.name)} is not connected yet.</h3>`
      + `<p class="quiet">${group.key === "systems"
          ? "Connecting stores a permission in your own workspace and nothing else. A system "
            + "of record is read at the moment you ask something of it, never copied out."
          : "Connecting stores a permission in your own workspace. Nothing is moved and "
            + "nothing is reorganised."}</p>`;
    const go = el("button", "go");
    go.type = "button";
    go.textContent = `Connect ${m.name}`;
    go.addEventListener("click", (ev) => { ev.stopPropagation(); openConnect(group.key); });
    box.appendChild(go);
    li.appendChild(box);
    return;
  }

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

// ── the picker: the customer names what comes in ─────────────────────────────
//
// Two gates, in order (Principle 64). This is the first: the outer boundary, drawn
// by the person who knows where their business lives. The brain classifies inside
// it and never draws it. "Africa Trip 2025" and "HireKraft_Citi_Bank" sit next to
// each other in the same list, and no classifier should be deciding between them.

function driveAccountKey() {
  const who = shape?.viewer?.email;
  return who ? `drive:oauth:${who}` : null;
}

// supabase-js reports a non-2xx as a bare "Edge Function returned a non-2xx status",
// which throws away the sentence the function wrote explaining why. Read the body.
// The states, keyed by source. Their words live in drive_state() on the brain, so
// changing what a row SAYS is a migration rather than a redeploy of this file.
let driveStates = new Map();

async function readDriveStates() {
  try {
    const { data, error } = await sb.rpc("drive_state");
    if (error) throw error;
    driveStates = new Map((data ?? []).map((r) => [r.source_key, r]));
  } catch {
    driveStates = new Map();   // a state that cannot be read is not asserted
  }
}

async function driveFn(body) {
  const { data, error } = await sb.functions.invoke("workspace-drive-sources", { body });
  if (error) {
    let detail = error.message ?? String(error);
    try { const j = await error.context?.json(); if (j?.error) detail = j.error; } catch { /* keep detail */ }
    throw new Error(detail);
  }
  if (data && data.ok === false) throw new Error(data.error ?? "it stopped short without saying why");
  return data;
}

function pickerRow(item, accountKey) {
  const li = el("li");
  const btn = el("button", "member");
  btn.type = "button";

  btn.className = "member pick";

  // Every word here comes from drive_state(): the queue for progress, the stored
  // files for what landed, the recorded permission for whether it can still reach.
  // The tick decides whether a drive SHOULD be read; it never says what IS happening.
  const draw = (chosen, moving, trouble) => {
    const s = driveStates.get(item.source_key);
    const head = moving ?? (s ? s.headline : (chosen ? "reading" : "Not reading"));
    btn.innerHTML =
      `<span class="pick-box"><svg aria-hidden="true"><use href="#i-check"/></svg></span>`
      + `<span class="m-name">${escape(item.name)}</span>`
      + `<span class="m-win">${escape(head)}</span>`;
    btn.setAttribute("aria-pressed", String(chosen));

    const tone = moving ? "amber" : (s ? s.tone : "plain");
    const detail = trouble ?? (moving ? "" : (s ? s.detail : ""));

    const st = $(".state", li) ?? el("div", "state");
    st.className = `state tone-${trouble ? "red" : tone}`;
    st.innerHTML = `<span class="dot"></span>`
      + `<span class="s-head">${escape(head)}</span>`
      + (detail ? ` &middot; ${escape(detail)}` : "");
    if (!st.parentNode) li.appendChild(st);

    // The remedy sits on the line that states the problem, and only where there is
    // one. Everything else stays silent: a fault that heals itself is not a task.
    if (!moving && !trouble && s?.action === "forget") st.appendChild(forgetControl(item, draw));
    if (!moving && !trouble && s?.action === "sign_in") st.appendChild(signInAgainControl(s));
  };

  btn.addEventListener("click", async () => {
    const next = !item.chosen;
    btn.disabled = true;
    draw(item.chosen, next ? "starting\u2026" : "stopping\u2026");
    try {
      if (next) {
        const p = await driveFn({
          action: "point", root_kind: item.kind, root_id: item.id,
          label: item.name, account_source_key: accountKey,
        });
        await driveFn({ action: "walk_now", source_id: p.source_id });
      } else {
        await driveFn({ action: "unpoint", source_key: item.source_key });
      }
      item.chosen = next;
      draw(item.chosen);
    } catch (e) {
      // The refusal is quoted, not summarised. These sentences say which person a
      // source belongs to and why it was refused, and a paraphrase loses that.
      draw(item.chosen, null, `did not change: ${e?.message ?? e}`);
    } finally {
      btn.disabled = false;
    }
  });

  li.appendChild(btn);
  draw(item.chosen);
  rowRedraws.push(() => draw(item.chosen));
  return li;
}

// The one fault on these rows a person can actually fix. Everything else that goes
// wrong is ours and retries itself, so it is never put in front of them as a job.
function signInAgainControl(s) {
  const b = el("button", "a-fix");
  b.type = "button";
  b.style.marginLeft = ".7rem";
  b.textContent = s.action_label ?? "Sign in again";
  b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const drive = PICKERS.drives.options.find((o) => o.type === "drive");
    beginConnect(drive, "individual", null, b, () => { b.textContent = s.action_label; });
  });
  return b;
}

// Stopping is reversible; this is not. So it asks once, in the same place, and says
// the number out loud before it does anything.
// Watching a drive fill should be watching, not reloading. This re-reads only the
// states -- one cheap call, no Drive traffic -- and only while something is actually
// moving. The moment nothing is filling it stops, so an idle screen is silent.
let fillWatch = null;
function watchWhileFilling() {
  if (fillWatch) { clearInterval(fillWatch); fillWatch = null; }
  const anyFilling = () => [...driveStates.values()].some((s) => s.state === "filling");
  if (!anyFilling()) return;
  fillWatch = setInterval(async () => {
    if (!document.getElementById("connect-stage")?.isConnected) {
      clearInterval(fillWatch); fillWatch = null; return;
    }
    await readDriveStates();
    for (const redraw of rowRedraws) redraw();
    if (!anyFilling()) { clearInterval(fillWatch); fillWatch = null; }
  }, 8000);
}

// Every row registers how to redraw itself, so a fresh reading lands on the rows
// that are already on screen instead of rebuilding the list under the person's hands.
let rowRedraws = [];

function forgetControl(item, redraw) {
  const b = el("button", "a-fix");
  b.type = "button";
  b.style.marginLeft = ".7rem";
  b.textContent = "Remove what it read";
  let armed = false;

  b.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    if (!armed) {
      armed = true;
      b.textContent = `Yes, remove ${item.files_read} ${item.files_read === 1 ? "file" : "files"}`;
      return;
    }
    b.disabled = true;
    b.textContent = "removing\u2026";
    try {
      const { data, error } = await sb.rpc("source_forget", { p_source_key: item.source_key });
      if (error) throw error;
      if (!data?.ok) {
        // Quoted, not summarised. These sentences say what the person MAY do, and a
        // paraphrase turns "not yours to do" into "something went wrong".
        b.disabled = false; armed = false;
        b.textContent = data?.note ?? "It did not happen, and no reason was given.";
        return;
      }
      say(`${item.name}: ${data.files_removed} removed from the memory. `
        + `The files themselves are untouched in your Drive.`);
      item.files_read = 0;
      redraw(false);
    } catch (e) {
      b.disabled = false; armed = false;
      b.textContent = `Could not remove: ${e?.message ?? e}`;
    }
  });
  return b;
}

async function stageDrivePicker(accountKey) {
  userMoved = true;
  goto("s-connect");
  const stage = $("#connect-stage");
  $("#connect-eyebrow").textContent = "Drives and folders";
  $("#connect-head").textContent = "Which of these should come in?";
  $("#connect-sub").textContent = "";
  stage.innerHTML = `<p class="quiet">Reading the names of your drives and folders.</p>`;

  if (!accountKey) {
    stage.innerHTML = "";
    const n = el("div", "notice flagged");
    n.innerHTML = `<b>No Google Drive account is signed in yet.</b> Sign in first and this `
      + `list fills with what that account reaches.`;
    stage.appendChild(n);
    return;
  }

  let data;
  try {
    [data] = await Promise.all([
      driveFn({ action: "discover", account_source_key: accountKey }),
      readDriveStates(),
    ]);
  } catch (e) {
    stage.innerHTML = "";
    const n = el("div", "notice flagged");
    n.innerHTML = `<b>The list could not be read, so nothing below is a claim about your Drive.</b> `
      + escape(e?.message ?? e);
    stage.appendChild(n);
    return;
  }

  stage.innerHTML = "";
  rowRedraws = [];
  const said = el("div", "notice");
  said.innerHTML = `<b>Tick a box to have Tool read that drive or folder. Untick it to stop.</b> `
    + `Tool reads what is ticked here and nothing else. Building this list needed only `
    + `the names &mdash; no file was opened, and nothing was added to the memory.`;
  stage.appendChild(said);

  const section = (title, sub, items) => {
    if (!items.length) return;
    const h = el("h3");
    h.textContent = title;
    h.style.marginTop = "2rem";
    stage.appendChild(h);
    const p = el("p", "quiet");
    p.textContent = sub;
    stage.appendChild(p);
    const ul = el("ul", "members");
    for (const it of items) ul.appendChild(pickerRow(it, accountKey));
    stage.appendChild(ul);
  };

  section("Shared drives", "The company's own drives. Everyone on them already sees what is in them.",
          data.items.filter((i) => i.kind === "shared_drive"));
  section("In your own Drive", "Nothing here comes in unless you say so. Choosing a folder brings "
          + "everything inside it, now and later.",
          data.items.filter((i) => i.kind === "my_drive_folder"));

  watchWhileFilling();

  // No button here: the section already carries "See what is connected now", and a
  // second copy of it put an identical control under the dock.
}

// The dock is fixed to the bottom and its height is not a constant - it grows the
// moment the consultant says anything. The page reserved a fixed number for it, so
// whatever sat at the foot of a screen went under it. Reserve what it actually
// occupies instead, and keep reserving it as that changes.
function reserveForDock() {
  const dock = $("#dock");
  if (!dock) return;
  const set = () => {
    const h = dock.getBoundingClientRect().height;
    document.body.style.paddingBottom = `calc(${Math.ceil(h)}px + 2.5rem)`;
  };
  set();
  if (typeof ResizeObserver === "function") new ResizeObserver(set).observe(dock);
  window.addEventListener("resize", set);
}
reserveForDock();

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

// ── mailboxes that hold a key but are not yet yours to read ─────────────────
// Signing in to Google proves you hold the mailbox's key. It does not say who may
// read it through this surface, and the two must stay separate acts: a silent
// sweep on page load would re-point sources nobody asked about. So this is an
// offer, shown only when there is one to make, and taken deliberately.
// justDone: an address bound a moment ago. Without it this block re-renders, finds
// nothing left to offer, and empties itself - which is correct and reads exactly
// like the button having done nothing. The confirmation has to outlive the
// refresh that the success caused.
async function fillAdoptable(justDone) {
  const box = $("#adopt");
  if (!box) return;
  box.innerHTML = "";

  const doneLine = justDone
    ? `<b>Done.</b> ${escape(justDone)} is now yours to read. `
      + `Open it from the Email group above.`
    : null;

  let rows = [];
  try {
    const { data, error } = await sb.rpc("connectable_mailboxes");
    if (error) throw error;
    rows = (data ?? []).filter((r) => r.credential_held && !r.bound_to_me);
  } catch {
    return;   // an offer that cannot be made is simply absent; it claims nothing
  }
  if (!rows.length) {
    if (doneLine) {
      const w = el("div", "notice");
      w.innerHTML = doneLine;
      box.appendChild(w);
    }
    return;
  }

  const many = rows.length !== 1;
  const wrap = el("div", "notice flagged");
  wrap.innerHTML = (doneLine ? doneLine + "<br><br>" : "")
    + `<b>${rows.length} mailbox${many ? "es" : ""} ${many ? "are" : "is"} `
    + `signed in but not yet readable by you.</b> Signing in proved you hold the key. `
    + `This is the separate step that says who may read it here.`;

  const list = el("div", "choices");
  for (const r of rows) {
    const b = el("button", "choice");
    b.type = "button";
    b.innerHTML = `<span aria-hidden="true"></span><span>`
      + `<span class="c-name">${escape(r.address)}</span>`
      + `<span class="c-sub">${escape(r.note)} Make it readable by me.</span></span>`;
    b.addEventListener("click", async () => {
      const sub = b.querySelector(".c-sub");
      b.disabled = true;
      sub.textContent = "binding";
      try {
        const { data, error } = await sb.rpc("source_adopt", { p_source_key: r.source_key });
        if (error) throw error;
        if (!data?.ok) {
          // The refusal is quoted rather than summarised, so the reason survives.
          sub.textContent = data?.note ?? `Not bound: ${data?.reason ?? "unknown"}.`;
          b.disabled = false;
          return;
        }
        sub.textContent = data.changed
          ? "bound to you - it reads here now"
          : "already yours to read";
        // Re-render, but carry the result through it rather than losing it.
        fillAdoptable(r.address);
      } catch (e) {
        sub.textContent = `Could not bind: ${e?.message ?? e}`;
        b.disabled = false;
      }
    });
    list.appendChild(b);
  }
  wrap.appendChild(list);
  box.appendChild(wrap);
}

// THE ATTENTION BOX EXISTS ONLY WHEN SOMETHING DOES. It used to be a permanent
// heading with a permanent "Nothing needs you right now" underneath, which is how
// a thing stops being read: a box that is always there is furniture, and furniture
// is invisible on the day it finally says something.
//
// It counts what needs ALEX, not what is non-zero. Work that is ours is listed
// inside so he can see we know about it, and it never makes the box urgent.
function fillAttention() {
  const ul = $("#attn");
  const panel = $("#attn-panel");
  const boxes = $("#below-tiles");
  const head = $("#attn-count");
  const items = shape.attention ?? [];
  const mine = shape.needs_you ?? 0;
  const ours = items.length - mine;

  if (panel) panel.hidden = true;

  if (boxes) {
    boxes.innerHTML = "";

    const see = el("button", "box");
    see.type = "button";
    see.innerHTML = `<span class="box-t">See what is connected</span>`
      + `<span class="box-d">Every source, whether it is working, and how far back it goes.</span>`;
    see.addEventListener("click", () => {
      const t = $("#tree");
      if (t) t.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    boxes.appendChild(see);

    // WHO SEES WHAT sits beside what is connected, for the owner (seat who-sees-what).
    if (shape.viewer?.all_access) {
      const w = el("button", "box");
      w.type = "button";
      w.innerHTML = `<span class="box-t">Who sees what</span>`
        + `<span class="box-d">Each person, what their own Google account opens, and your changes.</span>`;
      w.addEventListener("click", () => { userMoved = true; goto("s-access"); });
      boxes.appendChild(w);
    }

    // No items, no box. Nothing takes its place and nothing says so.
    if (items.length) {
      const b = el("button", mine > 0 ? "box needs" : "box");
      b.type = "button";
      const label = mine > 0
        ? `${mine} need${mine === 1 ? "s" : ""} you`
        : `${ours} ${ours === 1 ? "is" : "are"} ours, nothing needs you`;
      b.innerHTML = `<span class="box-t">Needs attention</span>`
        + `<span class="box-d">${escape(label)}</span>`;
      b.addEventListener("click", () => {
        if (!panel) return;
        panel.hidden = false;
        panel.scrollIntoView({ block: "start", behavior: "smooth" });
      });
      boxes.appendChild(b);
    }
  }

  if (head) {
    head.textContent = mine === 0
      ? "nothing needs you"
      : `${mine} need${mine === 1 ? "s" : ""} you`
        + (ours > 0 ? `, ${ours} ${ours === 1 ? "is" : "are"} ours` : "");
  }
  drawReconnect();
  if (!ul) return;
  ul.innerHTML = "";
  if (!items.length) return;
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

// SOURCES THAT CANNOT BE OPENED, ONE PLAIN LINE ON THE BRAIN TAB (seat mail-redesign; Alex's
// ruling 2026-10-06 with HQ's refinement). It used to be a note at the foot of the mail view
// saying "there's more of this story we can't reach from here", which was a connection
// problem shown in the wrong place. The rows come from the two readings this tab already
// makes: a mailbox whose row offers a sign-in or connect, and a drive Google will not open
// or that needs a sign-in. Each is listed with its own line, which carries its fix. None, no line.
function drawReconnect() {
  const box = $('#reconnect');
  if (!box) return;
  box.innerHTML = '';
  const rows = [...mailboxes.values()].filter((m) => m.action)
    .map((m) => ({ name: m.address, line: () => mailboxLine(m) }))
    .concat([...driveStates.values()].filter((d) => d.state === 'needs_signin' || d.state === 'shut_out')
      .map((d) => ({ name: d.label, line: () => driveLine(d) })));
  if (!rows.length) return;
  const head = el('p', 'reconnect-head');
  head.textContent = `${rows.length} ${rows.length === 1 ? 'source' : 'sources'} cannot be opened right now. `;
  const show = el('button', 'work-add');
  show.type = 'button';
  show.textContent = 'See each one and what would open it';
  const ul = el('ul', 'members');
  ul.hidden = true;
  for (const r of rows) {
    const li = el('li');
    li.appendChild(el('span', 'm-name')).textContent = r.name;
    li.appendChild(r.line());
    ul.appendChild(li);
  }
  show.addEventListener('click', () => { ul.hidden = !ul.hidden; });
  head.appendChild(show);
  box.append(head, ul);
}

// prefillAsk() is gone (seat email-workspace, 2026-10-07): the Mail tab no longer starts a question
// in the Ask bar for her; the bar itself asks about the open email while she is on Mail.

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

  // Only mail has a real fork here. For Drive both branches resolve to the same
  // source key, the same posture and the same reach - the choice decided nothing
  // except who was allowed to make it. Asking anyway is a screen pretending to
  // take a decision from you.
  if (provider.type !== "gmail") return stageConsent(provider, "individual", groupKey);

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

  // Drive names no mailbox, so without this the person is handed to Google with no
  // statement of whose account is about to be used - which is how a connect reads
  // as something happening TO you rather than something you did.
  if (provider.type === "drive") {
    const who = shape?.viewer?.email;
    const w = el("div", "notice flagged");
    w.innerHTML = `<b>You are signing in as ${escape(who ?? "your own Google account")}.</b> `
      + `Connecting a drive under a different Google account is not built yet: this is `
      + `recorded under the account above whichever one you pick on Google's screen, so `
      + `use this one.`
      + `<br><br>Signing in stores the permission and nothing more. It does not add a drive `
      + `to the list, and it does not start reading one. Each drive says on its own line `
      + `where it stands.`;
    stage.appendChild(w);
  }

  // Gate on what this actually is, not on the scope word next to it. Written as
  // `scope === "admin"`, this put the company mailbox list on the Drive consent
  // screen, where picking a line would have created a drive keyed by a mailbox.
  if (scope === "admin" && provider.type === "gmail") {
    // The copy on the previous screen promises every company mailbox is listed.
    // It used to show a blank address box, which is a different thing and left
    // the person guessing their own addresses. The list is read live.
    const which = el("div", "notice");
    which.innerHTML = `<b>Which mailbox?</b> <span class="quiet">reading your company mailboxes</span>`;
    stage.appendChild(which);
    listMailboxes(which, provider, scope);
  }

  stage.appendChild(consentButton(provider, scope, groupKey));

  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back";
  back.addEventListener("click", () => stageScope(groupKey, provider));
  stage.appendChild(back);
}

// The address box stays as the fallback, and is the only input consentButton
// reads. Picking from the list fills it; typing into it still works.
function mbxInput(v) {
  return `<input id="mbx" type="email" value="${escape(v)}" placeholder="name@yourcompany.com" `
    + `style="margin-top:.6rem;width:100%;max-width:22rem;font:inherit;padding:.5rem;`
    + `border:1px solid currentColor;border-radius:4px;background:none;color:inherit">`;
}

// Live, from connectable_mailboxes(). Each line says what is true of that mailbox
// today rather than offering an identical button for every one of them.
async function listMailboxes(box, provider, scope) {
  try {
    const { data, error } = await sb.rpc("connectable_mailboxes");
    if (error) throw error;
    const rows = data ?? [];
    if (!rows.length) {
      box.innerHTML = `<b>Which mailbox?</b> Nothing is on record yet, so type the address.`
        + mbxInput("");
      return;
    }
    box.innerHTML = `<b>Which mailbox?</b> These are the company mailboxes on record. `
      + `Pick the one you are about to sign in as.`
      + `<div class="choices" id="mbx-list"></div>`
      + `<p class="quiet">A mailbox that has never been connected here does not `
      + `appear on this list. Type its address instead - a new address, or one this `
      + `brain has never been pointed at.</p>`
      + mbxInput("");
    const list = box.querySelector("#mbx-list");
    for (const r of rows) {
      const b = el("button", "choice");
      b.type = "button";
      b.innerHTML = `<span aria-hidden="true"></span>`
        + `<span><span class="c-name">${escape(r.address)}</span>`
        + `<span class="c-sub">${escape(r.note)}</span></span>`;
      // ONE GESTURE. This used to fill the address box, which then needed a second
      // click on a button somewhere below - two acts for a choice the click had
      // already made, and the filled box read like a form to check rather than a
      // decision taken.
      b.addEventListener("click", () => {
        list.querySelectorAll(".choice").forEach((x) => x.removeAttribute("aria-pressed"));
        b.setAttribute("aria-pressed", "true");
        const sub = b.querySelector(".c-sub");
        if (sub) sub.textContent = `opening ${provider.name}`;
        beginConnect(provider, scope, r.address, b, () => {
          if (sub) sub.textContent = r.note;
        });
      });
      list.appendChild(b);
    }
  } catch (e) {
    // Never a spinner that lies. If the list cannot be read, say so and fall back.
    box.innerHTML = `<b>Which mailbox?</b> The list could not be read `
      + `(${escape(e?.message ?? e)}), so type the address instead.` + mbxInput("");
  }
}

// ONE PATH TO THE PROVIDER, whether the address came from a click on the list or
// from the box. Two copies of this would be two truths, and the one nobody used
// would be the one that rotted.
async function beginConnect(provider, scope, mailbox, btn, restore) {
  if (btn) btn.disabled = true;
  const giveBack = () => { if (btn) btn.disabled = false; if (restore) restore(); };
  try {
    // source_begin resolves the acting identity from the token. There is no
    // identity to pass, which is the point. And nothing on the far side of the
    // consent hop knows this surface's address, so this page says where to come
    // back to rather than anyone hard-coding it.
    const { data, error } = await sb.rpc("source_begin", {
      p_source_type: provider.type, p_scope: scope, p_mailbox: mailbox || null,
      p_return_to: location.origin + location.pathname,
    });
    if (error) throw error;

    if (!data?.ok) {
      giveBack();
      return stageStopped({
        unbound:    "You are not signed in to a brain identity, so nothing can be connected. Sign in first.",
        owner_only: "Connecting on behalf of the firm is an owner-level act, and this identity is not an owner.",
        not_wired:  "That provider is not wired up, so there is nothing to consent to yet.",
        no_mailbox: "No address to connect. Pick a mailbox, or type one.",
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
    giveBack();
    stageStopped(`The connect could not be started: ${e?.message ?? e}`);
  }
}

function consentButton(provider, scope, groupKey) {
  const wrap = el("div", "actions");
  const b = el("button", "go");
  b.type = "button";
  b.textContent = `Continue to ${provider.name}`;
  b.addEventListener("click", () => {
    const label = b.textContent;
    b.textContent = "Preparing\u2026";
    beginConnect(provider, scope, $("#mbx")?.value?.trim() || null, b,
      () => { b.textContent = label; });
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

// ── the dock ────────────────────────────────────────────────────────────────
// It reports what this surface DID. It does not answer questions, and as of
// 2026-09-09 it no longer offers to: the question box called nothing and replied
// from a fixed list of client-side strings.

function say(text, asked) {
  const log = $("#dock-turns");
  if (asked) { const q = el("div", "turn asked"); q.textContent = asked; log.appendChild(q); }
  const a = el("div", "turn said");
  a.textContent = text;
  log.appendChild(a);
  $("#dock").classList.add("open");
  $("#dock-log").scrollTop = $("#dock-log").scrollHeight;
}

// -- the ask ----------------------------------------------------------------
// THE SERVER SETS THE STATE AND THIS FILE MAY NOT. lens-ask returns one of four
// states and carries an `answer` field in exactly ONE of them. So nothing below
// needs a rule saying "do not present retrieval as an answer": in the other three
// states there is no field here to present. The code reads `state` and never
// infers one by counting records.
//
// The answer lands in the conversation, under the question that asked it: in the middle column
// on Work, in the dock elsewhere. (The older wording here, that it lands in the page body above
// the dock, was superseded on 2026-09-27 and removed on 2026-10-06 by seat chat-layout.)

const ASK_URL = `${SUPABASE_URL}/functions/v1/lens-ask`;
let asking = false;
let lastAsked = "";

const ASK_HEAD = {
  answered:        "Answer",
  records_only:    "What the record says",
  word_match_only: "A word match, not an answer",
  nothing_close:   "Nothing close to this",
};

function yearOf(iso) { return iso ? String(iso).slice(0, 4) : ""; }

// THE ANSWER LEADS. Everything else sits under it or behind a click.
//
// What this replaced, so it is not reinstated by someone reading only the code:
// twelve records were dumped down the page, ten of them titled "Untitled" and
// several showing raw HTML markup; the answer took three paragraphs to say it had
// found nothing; and "12 of 24 records were not read" - the most important line on
// the screen - sat at the bottom in grey.

// Markup never reaches the screen. A stored passage that is really an HTML email
// body is not text a person can read, so it is not shown as if it were.
function stripMarkup(s) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function looksLikeMarkup(s) {
  const t = String(s ?? "");
  if (!t) return false;
  return /<\/?(div|span|p|table|tr|td|th|br|img|a|html|body|head|style|font|meta|o:p)\b/i.test(t)
    || /style\s*=\s*["']/i.test(t)
    || (t.match(/&[a-z#0-9]+;/gi) || []).length > 2;
}

// TITLES CUT AT WORD BOUNDARIES, NEVER MID-WORD. Locked 2026-08-18.
function cutWords(s, max) {
  const t = String(s ?? "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 20 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-]+$/, "") + "\u2026";
}

// "Untitled" is not a name, it is the absence of one shown ten times over. A record
// with no title gets one derived from its own readable text, and failing that from
// the source it came from.
function titleFor(e) {
  const given = String(e.doc ?? "").trim();
  if (given && !/^untitled$/i.test(given)) return given;
  const clean = stripMarkup(e.snippet);
  if (clean.length > 12) return cutWords(clean, 64);
  const src = String(e.source ?? "").trim();
  return src ? "A record from " + src : "A record with no name";
}

// THE MODEL WRITES MARKDOWN AND THIS RENDERS IT. Until 2026-09-24 it did not, so a
// six-column table of contractor agreements arrived on screen as a single run of
// pipes and dashes, "**Contractor Agreements**" arrived with its asterisks, and
// "---" arrived as three hyphens. The content was right and unreadable.
//
// Markdown is rendered STRUCTURALLY, never by writing the model's text as HTML: the
// parser emits elements and every scrap of model text lands as a text node. So a
// table in the answer cannot inject markup, which is the reason the old renderer
// refused markdown in the first place. Refusing to PARSE it was the wrong fix for a
// real concern.
//
// Supported because the model emits it: headings, GFM tables, bullet and numbered
// lists, horizontal rules, inline bold, and [n] citations. Anything else stays text.

// Inline: [3] becomes a citation, **text** becomes emphasis, the rest is a text node.
// ORIGINS (lens-ask v17, seat answer-like-claude, Alex 2026-10-07). [w2] is a web page from this answer's own
// search, drawn as a mark that opens it in the list below; [g] is the model's general knowledge, drawn as a
// quiet words-mark. Only [n] is a record of the company. Split by hand, not by pattern, so this file stays
// writable (see PATTERNS ARE BUILT, below).
function inlineInto(parent, text) {
  const s = String(text);
  let i = 0, plain = "";
  const flush = () => { if (plain) { inlineBase(parent, plain); plain = ""; } };
  while (i < s.length) {
    if (s[i] === "[") {
      const j = s.indexOf("]", i);
      const inner = j > i ? s.slice(i + 1, j) : "";
      if (inner === "g") {
        flush(); spaceBefore(parent);
        const m = el("span", "cite-g"); m.textContent = "(general knowledge)"; m.title = "From general knowledge, not from your records";
        parent.appendChild(m); i = j + 1; continue;
      }
      const n = inner.slice(1);
      if (inner[0] === "w" && n.length > 0 && n.length <= 2 && String(Number(n)) === n) {
        flush(); spaceBefore(parent);
        const a = el("a", "cite cite-web"); a.href = "#"; a.dataset.web = n; a.textContent = "web " + n; a.title = "A web page found for this question";
        parent.appendChild(a); i = j + 1; continue;
      }
    }
    plain += s[i]; i++;
  }
  flush();
}
function spaceBefore(parent) {
  const prev = parent.lastChild;
  if (prev && !(prev.nodeType === 3 && prev.textContent.endsWith(" "))) parent.appendChild(document.createTextNode(" "));
}
function inlineBase(parent, text) {
  for (const part of String(text).split(/(\[\d+\]|\*\*[^*]+\*\*)/)) {
    if (!part) continue;
    const c = /^\[(\d+)\]$/.exec(part);
    if (c) {
      // SOURCE NUMBERS NEVER TOUCH A NAME OR EACH OTHER (seat show, 2026-10-01): "[15][16]"
      // after a bold name drew as one run of digits glued to the name.
      const prev = parent.lastChild;
      if (prev && !(prev.nodeType === 3 && prev.textContent.endsWith(" "))) parent.appendChild(document.createTextNode(" "));
      const a = el("a", "cite");
      a.href = "#rec-" + c[1];
      a.textContent = c[1];
      a.dataset.rec = c[1];
      parent.appendChild(a);
      continue;
    }
    const b = /^\*\*([^*]+)\*\*$/.exec(part);
    if (b) {
      const s = el("strong");
      s.textContent = b[1];
      parent.appendChild(s);
      continue;
    }
    parent.appendChild(document.createTextNode(part));
  }
}
// Kept so older call sites and the harness keep working.
function citedInto(parent, block) { inlineInto(parent, block); }

function splitRow(line) {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((s) => s.trim());
}

// A SET IS A TABLE WHEN THE MODEL SENDS ONE. Each cell carries its column name so the
// table can restack as labelled rows on a phone rather than scrolling off the side.
function tableOf(head, rows) {
  const box = el("div", "ans-table-wrap");
  const t = el("table", "ans-table");
  const thead = el("thead"), htr = el("tr");
  for (const h of head) { const th = el("th"); th.textContent = h; htr.appendChild(th); }
  thead.appendChild(htr); t.appendChild(thead);
  const tb = el("tbody");
  for (const r of rows) {
    const tr = el("tr");
    for (let i = 0; i < head.length; i++) {
      const td = el("td");
      td.dataset.label = head[i] || "";
      inlineInto(td, r[i] ?? "");
      tr.appendChild(td);
    }
    tb.appendChild(tr);
  }
  t.appendChild(tb); box.appendChild(t);
  return box;
}

// PATTERNS ARE BUILT, NOT WRITTEN, and that is on purpose.
// The file-writing tool mangles escaped characters, which is what stopped this
// function landing for two days. Written as literals it carries backslashes,
// brace quantifiers and unicode escapes, and the write fails. Assembled from
// plain strings at runtime it carries none, and the write goes through.
// If you rewrite these as literal regexes you will not be able to save the file.
const BS = String.fromCharCode(92);
const RX = {
  rule:   new RegExp("^(-{3,}|[*]{3,}|_{3,})$"),
  head:   new RegExp("^#{1,6}" + BS + "s+(.*)$"),
  bold:   new RegExp("^[*][*](.+?)[*][*]:?$"),
  row:    new RegExp("^[|].*[|]" + BS + "s*$"),
  sep:    new RegExp("^[|][" + BS + "s:|-]+[|]" + BS + "s*$"),
  bullet: new RegExp("^([-*" + BS + "u2022]|" + BS + "d+[.)])" + BS + "s+"),
  digit:  new RegExp("^" + BS + "d"),
  stars:  new RegExp("[*][*]", "g"),
};

function mdOneBlock(wrap, lines, i, flush) {
  const t = lines[i].trim();

  // A rule between sections is redundant once the sections are headed.
  if (RX.rule.test(t)) { flush(); return i + 1; }

  const h = RX.head.exec(t) || RX.bold.exec(t);
  if (h) {
    flush();
    const hd = el("p", "ans-h");
    hd.textContent = h[1].replace(RX.stars, "").trim();
    wrap.appendChild(hd);
    return i + 1;
  }

  if (RX.row.test(t) && i + 1 < lines.length && RX.sep.test(lines[i + 1].trim())) {
    flush();
    const head = splitRow(t);
    let j = i + 2;
    const rows = [];
    while (j < lines.length && RX.row.test(lines[j].trim())) { rows.push(splitRow(lines[j].trim())); j++; }
    wrap.appendChild(tableOf(head, rows));
    return j;
  }

  if (RX.bullet.test(t)) {
    flush();
    const list = el(RX.digit.test(t) ? "ol" : "ul", "ans-list");
    let j = i;
    while (j < lines.length && RX.bullet.test(lines[j].trim())) {
      const li = el("li");
      inlineInto(li, lines[j].trim().replace(RX.bullet, ""));
      list.appendChild(li);
      j++;
    }
    wrap.appendChild(list);
    return j;
  }

  return -1;
}

function mdBlocks(text, cls) {
  const wrap = el("div", cls || "ans-prose");
  const lines = String(text).split(String.fromCharCode(10));
  let para = [];
  const flush = () => {
    if (!para.length) return;
    const p = el("p");
    inlineInto(p, para.join(" "));
    wrap.appendChild(p);
    para = [];
  };
  for (let i = 0; i < lines.length; ) {
    if (!lines[i].trim()) { flush(); i++; continue; }
    const next = mdOneBlock(wrap, lines, i, flush);
    if (next < 0) { para.push(lines[i].trim()); i++; continue; }
    i = next;
  }
  flush();
  return wrap;
}
function proseBlocks(text, cls) { return mdBlocks(text, cls); }

// EVIDENCE IS COLLAPSED BY DEFAULT, ALWAYS. Each record is its own disclosure, so a
// citation opens THAT passage rather than landing the reader in a wall of twelve.
function sourceName(s) {
  if (s.startsWith("gmail:")) return "Mail, " + s.slice(6);
  if (s.startsWith("drive:")) return "Files, " + s.slice(6);
  return s || "Other records";
}

function recordList(evidence, summaryText) {
  const wrap = el("details", "recs");
  const sum = el("summary", "recs-sum");
  sum.textContent = `${summaryText} (${evidence.length})`;
  wrap.appendChild(sum);

  const ul = el("ul", "records");
  // GROUPED BY WHERE IT CAME FROM, newest first in each (seat answer, 2026-10-07: Alex asked for
  // "a quick summary of all the sources that touch on it"). Groups keep the order in which their
  // first record ranked; numbers and ids are unchanged, so every citation still finds its record.
  const order = [];
  const groups = new Map();
  for (const e of evidence) {
    const k = e.source ?? "";
    if (!groups.has(k)) { groups.set(k, []); order.push(k); }
    groups.get(k).push(e);
  }
  const sorted = [];
  for (const k of order) sorted.push(...groups.get(k).sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))));
  let lastGroup = null;
  for (const e of sorted) {
    if (order.length > 1 && (e.source ?? "") !== lastGroup) {
      lastGroup = e.source ?? "";
      const g = el("li", "record-group"); g.textContent = sourceName(lastGroup);
      ul.appendChild(g);
    }
    const li = el("li", "record");
    li.id = "rec-" + e.n;

    const d = el("details", "record-d");
    const s = el("summary", "record-head");
    const n = el("span", "record-n"); n.textContent = e.n;
    const doc = el("span", "record-doc"); doc.textContent = titleFor(e);
    const src = el("span", "record-src"); src.textContent = (e.date ? e.date + " · " : "") + (e.source ?? "");
    s.append(n, doc, src);
    d.appendChild(s);

    // Only an https url the server actually sent becomes a link. Anything else is
    // text: a dead link in an evidence panel teaches that citations are decorative.
    const openable = typeof e.open_url === "string" && /^https:\/\//.test(e.open_url);
    if (openable) {
      const go = el("a", "record-go");
      go.href = e.open_url; go.target = "_blank"; go.rel = "noopener noreferrer";
      go.textContent = "Open in " + (e.open_in || "the source");
      d.appendChild(go);
    }

    const raw = e.snippet ?? "";
    if (looksLikeMarkup(raw)) {
      const note = el("p", "record-note");
      note.textContent = openable
        ? "Stored as markup rather than readable text. Open the original to read it."
        : "Stored as markup rather than readable text.";
      d.appendChild(note);
    } else {
      const clean = stripMarkup(raw);
      if (clean) {
        const snip = el("p", "record-snip");
        snip.textContent = cutWords(clean, 700);
        d.appendChild(snip);
      }
    }

    li.appendChild(d);
    ul.appendChild(li);
  }
  wrap.appendChild(ul);
  return wrap;
}

function askProblem(slot, msg) {
  slot.innerHTML = "";
  const p = el("p", "ans-lead");
  p.textContent = msg || "That did not get an answer.";
  slot.appendChild(p);
}

// A SET ANSWER ARRIVES AS DATA AND IS DRAWN AS ONE TABLE (seat show, 2026-10-01).
// The target Alex agreed on 2026-10-01: the first line answers; one compact table, each
// name opening the email it came from; a dash where the record does not say; the
// not-counted rows behind one tap; one line for anything that could not be checked;
// ONE plain line on what was read. The boundary sits under the table here, not under
// the lead: that placement is the agreed target and supersedes, for set answers only,
// the 2026-09-14 rule that put the gap directly under the lead.
const DASH = String.fromCharCode(8211);
function tableAnswer(slot, body) {
  const t = body.table;
  const lead = el("p", "ans-lead");
  lead.textContent = String(t.lead || "");
  slot.appendChild(lead);

  const cols = Array.isArray(t.columns) ? t.columns : [];
  const rows = Array.isArray(t.rows) ? t.rows : [];
  if (rows.length) {
    const head = ["Name", "Via"].concat(cols);
    const box = el("div", "ans-table-wrap");
    const tb = el("table", "ans-table");
    const thead = el("thead"), htr = el("tr");
    for (const h of head) { const th = el("th"); th.textContent = h; htr.appendChild(th); }
    thead.appendChild(htr); tb.appendChild(thead);
    const body2 = el("tbody");
    for (const r of rows) {
      const tr = el("tr");
      const name = el("td"); name.dataset.label = "Name";
      name.appendChild(openName(r.name, r.open_url));
      const via = el("td"); via.dataset.label = "Via"; via.textContent = r.via || "direct";
      tr.append(name, via);
      for (const c of cols) {
        const td = el("td"); td.dataset.label = c;
        const v = r.cells && typeof r.cells[c] === "string" ? r.cells[c] : "";
        td.textContent = v || DASH;
        tr.appendChild(td);
      }
      body2.appendChild(tr);
    }
    tb.appendChild(body2); box.appendChild(tb);
    slot.appendChild(box);
  }

  const nc = Array.isArray(t.not_counted) ? t.not_counted : [];
  if (nc.length) {
    const fold = el("details", "recs");
    const sum = el("summary", "recs-sum");
    sum.textContent = `${nc.length} more ${nc.length === 1 ? "was" : "were"} linked but not counted`;
    fold.appendChild(sum);
    const ul = el("ul", "ans-list");
    for (const r of nc) {
      const li = el("li");
      li.appendChild(openName(r.name, r.open_url));
      if (r.why) li.appendChild(document.createTextNode(": " + r.why));
      ul.appendChild(li);
    }
    fold.appendChild(ul);
    slot.appendChild(fold);
  }

  if (t.not_checked) {
    const p = el("p", "ans-meta"); p.textContent = String(t.not_checked); slot.appendChild(p);
  }
  if (t.boundary) {
    const p = el("p", "ans-gap-lead"); p.textContent = String(t.boundary); slot.appendChild(p);
  }
}

// A name opens its source only when the server sent an https link for it.
function openName(name, url) {
  if (typeof url === "string" && url.startsWith("https://")) {
    const a = el("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.textContent = String(name || "");
    return a;
  }
  return document.createTextNode(String(name || ""));
}

function renderAsk(slot, body) {
  slot.innerHTML = "";
  if (body.state === "answered" && body.table && typeof body.table === "object") { tableAnswer(slot, body); return; }
  // A typed instruction about who sees what (lens-ask v14): its line and the preview card.
  if (body.state === "access_instruction") { accessAnswer(slot, body); return; }
  const state = body.state;
  // lens-ask v17: an answer from the web or general knowledge is drawn whatever the records gave. `state`
  // still says what the records gave, and the answer says it in its own first sentence.
  const answered = (state === "answered" || body.origins) && typeof body.answer === "string" && body.answer;

  // 1. THE LEAD. One or two sentences, and nothing above it. When the server
  //    composed an answer the answer IS the lead; a heading reading "Answer" above
  //    an answer is the page showing its working.
  let rest = null;
  if (answered) {
    const blocks = String(body.answer).split(/\n{2,}/);
    slot.appendChild(proseBlocks(blocks[0], "ans-lead-prose"));
    if (blocks.length > 1) rest = blocks.slice(1).join("\n\n");
  } else {
    const lead = el("p", "ans-lead");
    lead.textContent = body.state_reason || ASK_HEAD[state] || "Nothing to show.";
    slot.appendChild(lead);
  }

  // 2. WHAT IT DID NOT SEE, DIRECTLY UNDER THE LEAD AND IN FULL INK. This was at the
  //    bottom in grey while being the line that decided whether the answer could be
  //    trusted. The server sends `completeness` empty when nothing was lost, so
  //    anything here always means something. Never computed on this side.
  if (Array.isArray(body.completeness) && body.completeness.length) {
    const box = el("div", "ans-gap");
    const first = el("p", "ans-gap-lead");
    first.textContent = String(body.completeness[0]);
    box.appendChild(first);
    if (body.completeness.length > 1) {
      const ul = el("ul", "ans-gap-list");
      for (const line of body.completeness.slice(1)) {
        const li = el("li"); li.textContent = String(line); ul.appendChild(li);
      }
      box.appendChild(ul);
    }
    slot.appendChild(box);
  }

  // 3. THE REST OF THE ANSWER, below the lead.
  if (rest) slot.appendChild(proseBlocks(rest));
  if (!answered && state === "records_only" && body.not_composed_because) {
    const n = el("p", "ans-meta");
    n.textContent = "Not composed because " + body.not_composed_because + ".";
    slot.appendChild(n);
  }

  // 4. SOURCES BEHIND A CLICK, with the audit line inside them rather than on the page.
  const ev = (Array.isArray(body.citations) && body.citations.length)
    ? body.citations
    : (Array.isArray(body.evidence) ? body.evidence : []);
  if (ev.length) {
    // The audit line (records looked at, closeness, floor) is gone from the page by
    // Alex's ruling of 2026-09-25: the reader is not only Alex, and it was the working.
    // The figures stay in body.retrieval for anyone measuring.
    slot.appendChild(recordList(ev, answered && state === "answered" ? "The records this came from" : "What came back"));
  }

  // 5. THE WEB (lens-ask v17): each page this answer's search used, by its title, opening in a new tab.
  if (Array.isArray(body.web) && body.web.length) {
    const box = el("details", "recs");
    const sum = el("summary"); sum.textContent = "From the web (" + body.web.length + ")"; box.appendChild(sum);
    const ol = el("ol", "record-list");
    for (const w of body.web) {
      const li = el("li"); li.dataset.webn = String(w.n);
      const u = String(w.url || "");
      if (u.startsWith("https://") || u.startsWith("http://")) {
        const a = el("a"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = w.n + ". " + String(w.title || u); li.appendChild(a);
      } else li.textContent = w.n + ". " + String(w.title || "");
      ol.appendChild(li);
    }
    box.appendChild(ol); slot.appendChild(box);
  }
}

// A citation opens the one passage it points at, rather than scrolling the reader
// into a list and leaving them to find it.
document.addEventListener("click", (e) => {
  const a = e.target.closest ? e.target.closest("a.cite") : null;
  if (a && a.dataset.web) {
    e.preventDefault();
    const scope = a.closest(".answer-slot") || document;
    const li = scope.querySelector("li[data-webn='" + a.dataset.web + "']");
    if (!li) return;
    const d = li.closest("details"); if (d) d.open = true;
    li.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  if (!a || !a.dataset.rec) return;
  const li = document.getElementById("rec-" + a.dataset.rec);
  if (!li) return;
  e.preventDefault();
  const outer = li.closest("details.recs");
  if (outer) outer.open = true;
  const inner = li.querySelector("details.record-d");
  if (inner) inner.open = true;
  li.scrollIntoView({ block: "center", behavior: "smooth" });
});

async function ask(question) {
  const q = (question ?? "").trim();
  if (!q || asking) return;
  asking = true;

  const sec = $("#s-answer");
  const mount = $("#answer-in");
  sec.hidden = false;

  // THE CONVERSATION SURVIVES. Each question appends a turn and nothing clears
  // what came before. Until now every new question ran mount.innerHTML = "", so
  // asking a second thing destroyed the first answer and its records with it -
  // which is the one thing a person needs when checking a second answer against
  // a first. Navigation was never the problem: goto() only hides section.step and
  // this section is not one.
  const turn = el("div", "answer-turn");
  const asked = el("p", "answer-asked"); asked.textContent = q;
  const slot = el("div", "answer-slot");
  const wait = el("p", "answer-wait"); wait.textContent = "Reading your records.";
  slot.appendChild(wait);
  turn.append(asked, slot);
  mount.appendChild(turn);
  turn.scrollIntoView({ block: "start", behavior: "smooth" });

  try {
    const { data } = await sb.auth.getSession();
    const jwt = data?.session?.access_token;
    if (!jwt) {
      askProblem(slot, "You are not signed in on this browser, so there is nobody for the brain "
        + "to answer as. Sign in and ask again.");
      return;
    }
    const r = await fetch(ASK_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
      // The previous question on this page travels as context, so "i meant the X role"
      // is answered as the question it continues. lens-ask decides whether it does.
      // Her time zone travels with every question so lens-ask resolves 'last month' against her
      // today, never against the dates in the records (seat chat-layout, 2026-10-06).
      body: JSON.stringify(Object.assign({ question: q, tz: zone() }, lastAsked ? { follows: lastAsked } : {})),
    });
    const body = await r.json().catch(() => null);
    if (!body) { askProblem(slot, `The brain did not answer (${r.status}). Nothing was changed.`); return; }
    if (body.ok !== true) { askProblem(slot, body.error ?? `The brain refused this (${r.status}).`); return; }
    renderAsk(slot, body);
    // Save as test sits on every answer, for the owner (seat save-as-test). lastAsked is still the
    // previous question here, so the form knows when this one was a follow-on.
    if (shape?.viewer?.all_access) slot.appendChild(saveAsTest(q, lastAsked));
    lastAsked = q;
    await keepTurn(slot, q, body);
  } catch (e) {
    askProblem(slot, `The brain could not be reached: ${e?.message ?? e}`);
  } finally {
    asking = false;
  }
}

// THE PREPARED QUESTIONS ARE GONE, removed 2026-09-27 at Alex's instruction.
// They cost more than they gave: ask_openers ran on every load, raced the statement
// timeout, and printed "canceling statement due to statement timeout" onto the page
// as a suggestion. A box that sometimes offers questions and sometimes offers a
// database error teaches people not to read it.
// The input placeholder used to be derived from the same call and is now fixed text.
// If a derived placeholder is wanted again it needs a reading that cannot time out,
// not this one brought back.

(function wireAsk() {
  const input = $("#ask-input"), send = $("#ask-send");
  if (!input || !send) return;
  // On Mail the question goes to the open email's conversation (seat email-workspace).
  const go = () => { const v = input.value; input.value = ''; if (onMail && v.trim() && askFromMailBar(v.trim())) return; ask(v); };
  send.addEventListener("click", go);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
})();

// The sources tab was a second build of this same lens and is retired. What it
// derived came across into brain_shape: the credential mechanism, the drill-in
// labels, the faults grouped by cause, and the count that separates what needs you
// from what is ours.

// ── TESTS (seat testing-tab, 2026-10-02, ruling 903) ─────────────────────────
// THE OWNER SEES EACH TEST IN FULL HERE: the question, the right answer and the date it is
// true as of, what came back, passed or failed, and when. The studio surface shows the same
// tests by a neutral label only; questions and answers never leave this brain.
// OWNER ONLY, ENFORCED IN THE BRAIN: stored_test_owner_view() and stored_test_set_answer()
// refuse anyone who is not all-access, with a reason. The entry is hidden for everyone else
// as a courtesy, not as the guard.
// Run now calls the stored-tests runner with this person's own sign-in; the runner accepts
// an owner's sign-in or the brain's gate key and nothing else. Results land one by one.
const TESTS_URL = `${SUPABASE_URL}/functions/v1/stored-tests`;
const TEST_TONE = { passing: "tone-green", failing: "tone-red", error: "tone-red", owed: "tone-amber",
                    "never run": "tone-plain", "waiting for a run": "tone-plain" };
const TEST_WORD = { passing: "passed", failing: "failed", error: "could not run", owed: "waiting for your right answer",
                    "never run": "saved, not run yet", "waiting for a run": "answer saved, not run yet" };
let testsRead = null;

function testWhen(iso) { return iso ? fmtWindow(iso) : "never"; }

function rightAnswerText(t) {
  const k = t.known_answer;
  if (!k) return "Not given yet.";
  const asOf = t.answer_as_of ? ` As of ${fmtDay(t.answer_as_of)}.` : "";
  if (typeof k.n === "number") return `${k.n}.${asOf}`;
  if (Array.isArray(k.names)) return `${k.names.length} named: ${k.names.join(", ")}.${asOf}`;
  if (typeof k.period === 'string') return `The answer says it means ${k.period}.${asOf}`;
  if (Array.isArray(k.state_in)) return `The Tool must reply: ${k.state_in.join(" or ")}.`;
  return "Stored in a shape this screen does not recognise.";
}

function cameBackText(t) {
  if (!t.last_run_at) return "Not run yet.";
  const g = t.last_got || {};
  const parts = [t.last_reason || ""];
  if (Array.isArray(g.missing) && g.missing.length) parts.push(`Missing: ${g.missing.join(", ")}.`);
  if (Array.isArray(g.extra) && g.extra.length) parts.push(`Not expected: ${g.extra.join(", ")}.`);
  return parts.filter(Boolean).join(" ");
}

function answerForm(t, li) {
  const box = el("div", "t-form");
  box.innerHTML = `
    <p class="quiet">Give the right answer as it stands on a date. Use a number for "how many",
      or a list of names, one per line, for "who".</p>
    <label class="t-field">The right answer
      <textarea rows="3" class="t-answer" placeholder="A number, or names one per line"></textarea></label>
    <label class="t-field">True as of
      <input type="date" class="t-asof"></label>
    <div class="actions"><button class="go t-save" type="button">Save the answer</button></div>
    <p class="quiet t-said" aria-live="polite"></p>`;
  const asof = box.querySelector(".t-asof");
  asof.value = new Date().toISOString().slice(0, 10);
  asof.max = asof.value;
  box.querySelector(".t-save").addEventListener("click", async (e) => {
    const btn = e.currentTarget, said = box.querySelector(".t-said");
    const raw = box.querySelector(".t-answer").value.trim();
    const ans = parseAnswer(raw);
    if (!ans) { said.textContent = "Type the answer first."; return; }
    btn.disabled = true; said.textContent = "Saving.";
    try {
      const { data, error } = await sb.rpc("stored_test_set_answer", {
        p_test: t.id,
        p_judge: ans.judge,
        p_known: ans.known,
        p_as_of: asof.value || null,
      });
      if (error) throw error;
      said.textContent = data?.ok ? `${data.note}` : (data?.note ?? data?.reason ?? "Not saved, and no reason was given.");
      if (data?.ok) await loadTests();
    } catch (err) {
      said.textContent = `Not saved: ${err?.message ?? err}`;
    } finally { btn.disabled = false; }
  });
  li.appendChild(box);
}

// A number is a count, anything else is a list of names, one per line. One reading of what was
// typed, used by the answer form on a test and by Save as test (seat save-as-test, 2026-10-02).
function parseAnswer(raw) {
  const lines = String(raw ?? "").split(String.fromCharCode(10)).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  const isNumber = lines.length === 1 && String(Number(lines[0])) === lines[0] && Number(lines[0]) >= 0;
  return isNumber ? { judge: "count", known: { n: Number(lines[0]) } } : { judge: "set", known: { names: lines } };
}

// SAVE AS TEST (seat save-as-test, 2026-10-02, Alex's rulings of that day). On every answer, for
// the owner. The button is shown only to the all-access viewer as a courtesy; stored_test_create()
// in the brain refuses anyone else with a reason. Alex types the right answer and the date it is
// true as of. A neutral label is suggested from the QUESTION by the stored-tests runner, which
// offers it only if the brain's label check passes it; he can change it, and the brain checks it
// again when he saves. The brain adds "(up to and including <date>)" to the stored question, so
// later records cannot change its right answer.
function saveAsTest(q, follows) {
  const wrap = el("div", "t-save-as");
  const open = el("button", "go ghost");
  open.type = "button";
  open.textContent = "Save as test";
  open.addEventListener("click", () => { open.hidden = true; wrap.appendChild(saveForm(q, follows)); }, { once: true });
  wrap.appendChild(open);
  return wrap;
}

async function suggestLabelFor(q) {
  const { data } = await sb.auth.getSession();
  const jwt = data?.session?.access_token;
  if (!jwt) return { ok: false, error: "Not signed in on this browser." };
  const r = await fetch(TESTS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "suggest_label", question: q }),
  });
  const body = await r.json().catch(() => null);
  // A runner older than this action reads the call as "run the tests". Say so rather than
  // presenting a run's reply as a missing label.
  if (body?.started) return { ok: false, error: "The label suggestion is not switched on yet, so a test run was started instead." };
  return body ?? { ok: false, error: `No reply (${r.status}).` };
}

function saveForm(q, follows) {
  const box = el("div", "t-form");
  box.innerHTML = `
    <p class="quiet">Keep this question as a test. Give the right answer as it stands on a date.
      The question is kept up to that date, so records arriving later do not change it.</p>
    ${follows ? `<p class="quiet">This question followed an earlier one. Make it stand on its own before saving.</p>` : ""}
    <label class="t-field">The question
      <textarea rows="2" class="t-q"></textarea></label>
    <label class="t-field">The right answer
      <textarea rows="3" class="t-answer" placeholder="A number, or names one per line"></textarea></label>
    <label class="t-field">True as of
      <input type="date" class="t-asof"></label>
    <label class="t-field">Label. The only part of a test the studio sees: lowercase words, no names, figures or dates.
      <input type="text" class="t-label" maxlength="120"></label>
    <p class="quiet t-label-said" aria-live="polite">Suggesting a label.</p>
    <div class="actions"><button class="go t-save" type="button">Save the test</button></div>
    <p class="quiet t-said" aria-live="polite"></p>`;
  box.querySelector(".t-q").value = q;
  const asof = box.querySelector(".t-asof");
  asof.value = new Date().toISOString().slice(0, 10);
  asof.max = asof.value;
  const label = box.querySelector(".t-label");
  const labelSaid = box.querySelector(".t-label-said");
  suggestLabelFor(q).then((s) => {
    if (s?.ok && s.label) {
      if (!label.value) label.value = s.label;
      labelSaid.textContent = "Suggested. Change it if you like.";
    } else {
      labelSaid.textContent = `${s?.error ?? "No label was suggested."} Write one.`;
    }
  }).catch((e) => { labelSaid.textContent = `No label was suggested (${e?.message ?? e}). Write one.`; });

  box.querySelector(".t-save").addEventListener("click", async (e) => {
    const btn = e.currentTarget, said = box.querySelector(".t-said");
    const ans = parseAnswer(box.querySelector(".t-answer").value);
    if (!ans) { said.textContent = "Type the right answer first."; return; }
    btn.disabled = true; said.textContent = "Saving.";
    try {
      const { data, error } = await sb.rpc("stored_test_create", {
        p_question: box.querySelector(".t-q").value.trim(),
        p_judge: ans.judge, p_known: ans.known,
        p_as_of: asof.value || null, p_label: label.value.trim(),
      });
      if (error) throw error;
      if (!data?.ok) { said.textContent = data?.note ?? data?.reason ?? "Not saved, and no reason was given."; btn.disabled = false; return; }
      said.textContent = data.note;
      const go = el("button", "go ghost");
      go.type = "button"; go.dataset.goto = "s-tests"; go.textContent = "Open Tests";
      said.after(go);
      btn.hidden = true;
      if (testsRead) await loadTests();
    } catch (err) {
      said.textContent = `Not saved: ${err?.message ?? err}`;
      btn.disabled = false;
    }
  });
  return box;
}

function testItem(t) {
  const li = el("li");
  if (t.kind !== "test" || !t.newly_broken) li.className = "ours";
  const ctl = t.kind !== "test";
  const word = t.newly_broken ? "newly broken: it passed before and fails now"
    : ctl ? (t.state === "never run" ? "never run" : (t.doing_its_job ? "doing its job" : "not doing its job"))
    : (TEST_WORD[t.state] ?? t.state);
  const tone = t.newly_broken ? "tone-red"
    : ctl ? (t.doing_its_job ? "tone-green" : (t.state === "never run" ? "tone-plain" : "tone-red"))
    : (TEST_TONE[t.state] ?? "tone-plain");
  li.innerHTML = `
    <p class="a-title">${escape(t.label)}</p>
    <p class="state ${tone}"><span class="dot"></span>${escape(word)}</p>
    <p class="a-detail"><b>Asked as:</b> ${escape(t.asks_as === "owner" ? "the owner" : "a person with limited access")}${t.pair ? ` &middot; one half of a security pair` : ""}</p>
    <p class="a-detail"><b>Question:</b> ${escape(t.question)}</p>
    <p class="a-detail"><b>Right answer:</b> ${escape(rightAnswerText(t))}</p>
    <p class="a-detail"><b>What came back:</b> ${escape(cameBackText(t))}</p>
    <p class="a-detail"><b>When:</b> ${escape(testWhen(t.last_run_at))}${t.last_trigger === "deploy" ? " (after a change)" : ""}</p>`;
  if (t.kind === "test" && !t.known_answer) answerForm(t, li);
  return li;
}

function drawTests(v) {
  const mount = $("#tests");
  mount.innerHTML = "";
  if (!v.ok) {
    const n = el("p", "notice"); n.textContent = v.note ?? `Refused: ${v.reason ?? "no reason given"}.`;
    mount.appendChild(n); $("#tests-run").hidden = true; return;
  }
  $("#tests-run").hidden = false;
  const c = v.counts?.tests ?? {}, k = v.counts?.controls ?? {};
  const failing = Number(c.failing ?? 0) + Number(c.error ?? 0);
  const head = el("p", "quiet");
  head.textContent = `${c.passing ?? "?"} passing, ${failing} failing, ${c.answer_owed ?? "?"} waiting for your right answer. `
    + (k.discriminates ? "The controls are doing their job, so these results can be trusted."
                       : "The controls are not doing their job, so no result can be trusted until they are.")
    + ` Read ${fmtWindow(v.read_at)}.`;
  mount.appendChild(head);
  const tests = (v.tests ?? []).filter((t) => t.kind === "test");
  const ctls = (v.tests ?? []).filter((t) => t.kind !== "test");
  const ul = el("ul", "attn");
  tests.forEach((t) => ul.appendChild(testItem(t)));
  if (!tests.length) { const n = el("p", "notice"); n.textContent = "No tests yet. Each scenario you judge here becomes one."; mount.appendChild(n); }
  else mount.appendChild(ul);
  if (ctls.length) {
    const d = el("details", "t-controls");
    d.innerHTML = `<summary class="quiet">Controls (${ctls.length}): the checks on the checks, not your tests</summary>`;
    const cu = el("ul", "attn");
    ctls.forEach((t) => cu.appendChild(testItem(t)));
    d.appendChild(cu); mount.appendChild(d);
  }
}

async function loadTests() {
  const mount = $("#tests");
  if (!mount) return;
  if (!testsRead) mount.innerHTML = `<p class="quiet">Reading your tests.</p>`;
  try {
    const { data, error } = await sb.rpc("stored_test_owner_view");
    if (error) throw error;
    testsRead = data;
    drawTests(data);
  } catch (e) {
    mount.innerHTML = "";
    const n = el("p", "notice flagged");
    n.textContent = `The tests could not be read, so nothing here is known: ${e?.message ?? e}`;
    mount.appendChild(n);
  }
}

(function wireTestsRun() {
  const btn = $("#tests-run");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const said = $("#tests-said");
    btn.disabled = true; said.textContent = "Starting.";
    try {
      const { data } = await sb.auth.getSession();
      const jwt = data?.session?.access_token;
      if (!jwt) { said.textContent = "Not signed in on this browser, so the tests cannot be run."; return; }
      const r = await fetch(TESTS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "on_demand" }),
      });
      const body = await r.json().catch(() => null);
      if (!body?.ok) { said.textContent = body?.error ?? `The tests did not start (${r.status}).`; return; }
      said.textContent = "Started. Each test asks the Tool as the person it names; results land one by one. This list refreshes on its own for a few minutes.";
      const before = testsRead?.counts?.last_run_at ?? null;
      for (let i = 0; i < 12; i++) {
        await new Promise((ok) => setTimeout(ok, 15000));
        await loadTests();
        const now = testsRead?.counts?.last_run_at ?? null;
        if (now && now !== before) said.textContent = `Results arriving. Last result ${fmtWindow(now)}.`;
      }
    } catch (e) {
      said.textContent = `The tests did not start: ${e?.message ?? e}`;
    } finally { btn.disabled = false; }
  });
})();

// -- WHO SEES WHAT (seat who-sees-what Phase B, 2026-10-06) --
// Capability: "I decide who in my company sees what", the owner's view. OWNER ONLY, ENFORCED
// IN THE BRAIN: access_people, access_person, access_rule_change and access_rule_retire refuse
// anyone who is not an owner, with a reason. The way in is hidden for everyone else as a
// courtesy, not as the guard.
// NOTHING CHANGES WITHOUT A PREVIEW. Every change is first asked of the same function that
// makes it with confirm false, which counts the effect through the door and writes nothing;
// one tap confirms. A typed instruction ("Erin shouldn't see pay figures") arrives from
// lens-ask as a proposal and goes through exactly the same card; lens-ask changes nothing.
// What a person sees from Google is the brain's sentence, shown as it is.
let accessRead = null;

async function accessCall(fn, args) {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw error;
  return data;
}
const countOf = (n) => Number(n ?? 0).toLocaleString();

// One change, previewed, then confirmed or left. p: { action: "withhold", person_id, kind,
// source } or { action: "restore", rule_id }. Drawn into `mount`; returns the card.
function changeCard(p, mount) {
  const box = el("div", "notice access-card");
  const said = el("p");
  said.textContent = "Working out what this would change.";
  const acts = el("div", "actions");
  box.append(said, acts);
  mount.appendChild(box);
  const call = (confirm) => p.action === "restore"
    ? accessCall("access_rule_retire", { p_rule: p.rule_id, p_confirm: confirm })
    : accessCall("access_rule_change", { p_identity: p.person_id, p_content_kind: p.kind,
        p_source_key: p.source ?? null, p_confirm: confirm });
  (async () => {
    let v;
    try { v = await call(false); }
    catch (e) { said.textContent = `What this would change could not be worked out, so nothing is offered: ${e?.message ?? e}`; return; }
    if (!v?.ok) { said.textContent = v?.note ?? "This cannot be changed, and no reason was given."; return; }
    said.textContent = v.words;
    const yes = el("button", "go"); yes.type = "button"; yes.textContent = "Confirm";
    const no = el("button", "go ghost"); no.type = "button"; no.textContent = "Leave it as it is";
    acts.append(yes, no);
    no.addEventListener("click", () => { acts.innerHTML = ""; said.textContent = "Nothing was changed."; });
    yes.addEventListener("click", async () => {
      yes.disabled = true; no.disabled = true;
      let d;
      try { d = await call(true); }
      catch (e) { yes.disabled = false; no.disabled = false; said.textContent = `Not changed: ${e?.message ?? e}`; return; }
      acts.innerHTML = "";
      if (!d?.ok) { said.textContent = d?.note ?? "Not changed, and no reason was given."; return; }
      said.textContent = d.words;
      if (p.action !== "restore" && d.rule_id) {
        const undo = el("button", "go ghost"); undo.type = "button"; undo.textContent = "Undo";
        undo.addEventListener("click", () => { undo.remove(); changeCard({ action: "restore", rule_id: d.rule_id }, mount); });
        acts.appendChild(undo);
      }
      if (accessRead) loadAccess();
    });
  })();
  return box;
}

// A typed instruction, answered: lens-ask's one line, then the card when it sent a proposal.
function accessAnswer(slot, body) {
  const lead = el("p", "ans-lead");
  lead.textContent = String(body.answer || body.state_reason || "");
  slot.appendChild(lead);
  if (body.proposal && typeof body.proposal === "object") changeCard(body.proposal, slot);
}

async function loadAccess() {
  const mount = $("#access");
  if (!mount) return;
  if (!accessRead) mount.innerHTML = `<p class="quiet">Reading who sees what.</p>`;
  try {
    accessRead = await accessCall("access_people", {});
    drawAccess(accessRead);
  } catch (e) {
    mount.innerHTML = "";
    const n = el("p", "notice flagged");
    n.textContent = `Who sees what could not be read, so nothing here is known: ${e?.message ?? e}`;
    mount.appendChild(n);
  }
}

function drawAccess(v) {
  const mount = $("#access");
  mount.innerHTML = "";
  if (!v?.ok) {
    const n = el("p", "notice");
    n.textContent = v?.note ?? `Refused: ${v?.reason ?? "no reason given"}.`;
    mount.appendChild(n);
    return;
  }
  const ul = el("ul", "attn");
  for (const p of v.people ?? []) {
    const li = el("li");
    li.dataset.person = p.id;
    const t = el("p", "a-title"); t.textContent = p.name + (p.is_you ? " (you)" : "");
    const d = el("p", "a-detail"); d.textContent = p.line;
    li.append(t, d);
    for (const c of p.changes ?? []) {
      const row = el("p", "a-detail access-change");
      row.textContent = c.words + " ";
      const undo = el("button", "go ghost"); undo.type = "button"; undo.textContent = "Undo";
      const slot = el("div");
      undo.addEventListener("click", () => { undo.hidden = true; changeCard({ action: "restore", rule_id: c.rule_id }, slot); });
      row.appendChild(undo);
      li.append(row, slot);
    }
    if (!p.is_owner) {
      const more = el("button", "go ghost"); more.type = "button"; more.textContent = "Exactly what, and why";
      const detail = el("div");
      more.addEventListener("click", () => {
        if (detail.childElementCount) { detail.innerHTML = ""; return; }
        personDetail(p, detail);
      });
      li.append(more, detail);
    }
    ul.appendChild(li);
  }
  mount.appendChild(ul);
  for (const w of v.warnings ?? []) {
    const n = el("p", "notice flagged"); n.textContent = w.words; mount.appendChild(n);
  }
  if (Number(v.not_signing_in) > 0) {
    const n = el("p", "quiet");
    n.textContent = `${countOf(v.not_signing_in)} more people appear in your records but cannot sign in, so they see nothing here.`;
    mount.appendChild(n);
  }
  const other = (v.people ?? []).find((p) => !p.is_owner);
  const hint = el("p", "quiet");
  hint.textContent = `To change something, say it in the question box, for example "${other ? other.name : "Sam"} shouldn't see pay figures". `
    + `You see what it would change before anything changes, and every change can be undone.`;
  mount.appendChild(hint);
}

// One person: exactly what they can and cannot see, and why, counted by the brain.
async function personDetail(p, mount) {
  mount.innerHTML = `<p class="quiet">Reading.</p>`;
  let v;
  try { v = await accessCall("access_person", { p_identity: p.id }); }
  catch (e) { mount.innerHTML = ""; const n = el("p", "quiet"); n.textContent = `This could not be read: ${e?.message ?? e}`; mount.appendChild(n); return; }
  mount.innerHTML = "";
  if (!v?.ok) { const n = el("p", "quiet"); n.textContent = v?.note ?? "Not shown, and no reason was given."; mount.appendChild(n); return; }
  const part = (head, lines) => {
    if (!lines.length) return;
    const h = el("p", "a-detail"); const b = el("b"); b.textContent = head; h.appendChild(b);
    const u = el("ul", "ans-list");
    for (const line of lines) { const li = el("li"); li.textContent = line; u.appendChild(li); }
    mount.append(h, u);
  };
  const cap = (s) => String(s ?? "").charAt(0).toUpperCase() + String(s ?? "").slice(1);
  part("Sees", [
    ...(v.sees_words ? [v.sees_words] : []),
    ...(v.sees ?? []).map((s) => `${cap(s.words)}, ${countOf(s.records)} records. ${s.why}`),
    ...(Number(v.records_about_this_person) > 0 ? [`${countOf(v.records_about_this_person)} records about this person in other places.`] : []),
  ]);
  part("Kept back by your changes", (v.withheld ?? []).map((w) =>
    `${countOf(w.records)} records: ${String(w.reason ?? "").split("refused: ").join("")}`));
  part("Cannot see", (v.cannot ?? []).map((c) =>
    `${cap(c.words)}${c.detail && !String(c.detail).includes(":") ? ` (${c.detail})` : ""}. ${c.why}`));
  const acts = el("div", "actions");
  const slot = el("div");
  for (const [kind, label] of [["pay_and_rates", "pay and rate figures"], ["everything", "everything"]]) {
    const b = el("button", "go ghost"); b.type = "button"; b.textContent = `Keep ${label} from ${v.name}`;
    b.addEventListener("click", () => { slot.innerHTML = ""; changeCard({ action: "withhold", person_id: v.id, kind, source: null }, slot); });
    acts.appendChild(b);
  }
  mount.append(acts, slot);
}

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
  if (location.hash === "#tests" && $("#s-tests")) { goto("s-tests"); return; }
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

// THE BRAIN TAB SHOWS CONNECTING AND WHAT IS CONNECTED TOGETHER (Alex, 2026-10-02,
// seat tool-tabs). Either id shows both, so every existing call site still lands on
// the Brain tab unchanged. This is still the only router: a tab is a goto() call.
const BRAIN_PAIR = ['s-connect', 's-summary'];
let lensKey = null;
function goto(id, key) {
  const show = BRAIN_PAIR.includes(id) ? BRAIN_PAIR : [id];
  document.querySelectorAll("section.step").forEach((s) => { s.hidden = !show.includes(s.id); });
  window.scrollTo({ top: 0 });
  if (id === "s-connect" && !$("#connect-stage").children.length) stageTypes();
  if (id === "s-tests") loadTests();
  if (id === "s-access") loadAccess();
  if (id === 's-lens') { lensKey = key ?? lensKey; drawLens(); }
  workDock(id === 's-work');
  mailDock(id === 's-lens' && lensKey === 'email');
  if (id === 's-work') loadWork();
  markTab(id === 's-lens' ? lensKey : id === 's-work' ? 'work' : 'brain');
}

// -- tabs (seat tool-tabs, 2026-10-02) --
// Alex's order and his words. Every tab shows from day one. A source tab shows what
// the Brain tab's own list shows for that source, drawn by the same drawMembers, or
// one line saying it is not connected and pointing to Brain. No lens features here:
// each tab is fleshed out later, one at a time.
const TABS = [{ key: 'brain', label: 'Brain' }, { key: 'work', label: 'Work' },
  ...GROUPS.map((g) => ({ key: g.key, label: g.key === 'email' ? 'Mail' : g.label }))];

function markTab(key) {
  document.querySelectorAll('#tabs .tab').forEach((b) => {
    if (b.dataset.tab === key) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

function drawTabs() {
  const nav = $('#tabs');
  if (!nav) return;
  nav.innerHTML = '';
  for (const t of TABS) {
    const b = el('button', 'tab');
    b.type = 'button';
    b.dataset.tab = t.key;
    b.textContent = t.label;
    b.addEventListener('click', () => {
      userMoved = true;
      if (t.key === 'brain') goto('s-summary'); else if (t.key === 'work') goto('s-work'); else goto('s-lens', t.key);
    });
    nav.appendChild(b);
  }
  markTab('brain');
}

function drawLens() {
  const t = TABS.find((x) => x.key === lensKey);
  const body = $('#lens-body');
  if (!t || !body) return;
  // MAIL IS AN INBOX YOU CAN WORK IN (seat mail-redesign, Alex 2026-10-06): three columns
  // across the window, drawn by mail.js. The tab itself names it, so no heading.
  $('#lens-head').hidden = lensKey === 'email';
  if (lensKey === 'email') { drawMail(body); return; }
  $('#lens-head').textContent = t.label;
  body.innerHTML = '';
  const data = groupsFor().find((x) => x.key === lensKey);
  const line = el('p', 'quiet');
  if (!data) {
    line.textContent = readingState === null ? 'Reading your brain. This fills in when the reading lands.'
      : readingState === 'unbound' ? 'Nobody is signed in on this browser, so there is nothing to show.'
      : 'Your brain could not be read just now, so nothing here is a claim either way.';
    body.appendChild(line);
    return;
  }
  if (!data.connected) {
    line.textContent = 'Nothing connected here yet.';
    const b = el('button', 'go ghost');
    b.type = 'button';
    b.textContent = 'Connect it in Brain';
    b.addEventListener('click', () => { userMoved = true; openConnect(lensKey); });
    body.append(line, b);
    return;
  }
  // The same one-line overview the Brain tab's list shows, copied rather than recounted.
  const cell = $(`#tree [data-group='${lensKey}'] [data-shape]`);
  line.innerHTML = cell ? cell.innerHTML : '';
  const list = el('div');
  body.append(line, list);
  drawMembers(lensKey, list);
}

// -- WORK (seat work-tab, 2026-10-06, Alex's rulings 2026-10-02 and 2026-10-06) --
// Every question asked in the Tool is kept as a chat, whichever tab it was asked from, because
// there is one Ask and it calls keepTurn() after each answer.
// THE ARRANGEMENT IS THE CLAUDE CHAT APP'S (Alex 2026-10-06), not its branding: a left sidebar
// with New chat, then Projects, then recent chats newest first; the open conversation in the
// middle with the question box at the bottom of it; a project opens to its own list of chats.
// ONE RENDERER: on the Work tab the dock's conversation (#s-answer) and question box (.dock-bar)
// are MOVED into the middle column, and moved back when leaving, so turns are still drawn only
// by renderAsk and asked only by ask(). No second conversation panel exists.
// Opening a chat redraws its turns FROM WHAT WAS KEPT, without asking again; the next Ask
// continues that chat. Recents shows chats not in a project; a project shows its own.
// PRIVATE TO THE PERSON, ENFORCED IN THE BRAIN: work_list, work_open, work_keep, work_project_new
// and work_move resolve the person from the sign-in and refuse anything else with a reason.
// Nothing here filters by person; the screen only shows what the brain returns.
let workChat = null;      // the chat the Ask is continuing, or null for a new one
let workInto = null;      // a project a NEW chat goes into once its first turn is kept
let workView = null;      // the project shown in the middle, or null for the conversation
let workRead = null;      // the last work_list() reply

function workSaid(text) { const s = $('#work-said'); if (s) s.textContent = text || ''; }

// Moves the one conversation and the one question box between the dock and the Work middle.
function workDock(onWork) {
  const ans = $('#s-answer'), bar = document.querySelector('.dock-bar'), slot = $('#work-convo');
  const home = document.querySelector('.dock-in');
  if (!ans || !bar || !slot || !home) return;
  if (onWork && ans.parentElement !== slot) { slot.append(ans, bar); }
  if (!onWork && ans.parentElement === slot) { home.append(ans, bar); }
  $('#dock').hidden = !!onWork;
}

// THE MAIL TAB KEEPS ITS CONVERSATIONS WITH THE EMAIL (seat email-workspace, Alex 2026-10-07: the
// band of conversation under the Mail columns squeezed them to a strip, and an answer about one
// email stayed on screen over the next). While Mail is open the dock is only the question box: the
// conversation is parked, not destroyed, so every other tab finds it as it was left, and what is
// asked on Mail is answered in the reading column by mail.js (askFromMailBar).
let onMail = false;
function mailDock(on) {
  const ans = $('#s-answer');
  if (!ans) return;
  let park = $('#answer-park');
  if (!park) { park = el('div'); park.id = 'answer-park'; park.hidden = true; document.body.appendChild(park); }
  if (on && ans.closest('#dock')) park.appendChild(ans);
  if (!on && ans.parentElement === park) document.querySelector('.dock-in')?.insertBefore(ans, document.querySelector('.dock-in > .dock-bar'));
  if (onMail && !on) $('#ask-input').placeholder = 'Ask about what is in your brain';
  onMail = on;
}

// into: { chat, about, title } keeps the turn in a chat of its own (the conversation about one email,
// answer.js) instead of the Work chat that happens to be open; work_keep finds or makes this person's
// chat about that email and into.chat remembers it. Without into, as before.
async function keepTurn(slot, q, body, into) {
  try {
    if (into) {
      const { data, error } = await sb.rpc('work_keep', Object.assign({ p_chat: into.chat ?? null, p_question: q, p_answer: body },
        into.about ? { p_about: into.about, p_title: into.title ?? null } : {}));
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.note ?? data?.reason ?? 'no reason was given');
      into.chat = data.chat_id;
      if (!$('#s-work').hidden) loadWork();
      return;
    }
    const fresh = !workChat;
    const { data, error } = await sb.rpc('work_keep', { p_chat: workChat, p_question: q, p_answer: body });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.note ?? data?.reason ?? 'no reason was given');
    workChat = data.chat_id;
    if (fresh && workInto) {
      const m = await sb.rpc('work_move', { p_chat: workChat, p_project: workInto });
      if (m.error || !m.data?.ok) throw new Error(`kept, but not put in the project: ${m.error?.message ?? m.data?.note}`);
    }
    workInto = null;
    if (!$('#s-work').hidden) loadWork();
  } catch (e) {
    const p = el('p', 'quiet'); p.textContent = `This answer was not kept in Work: ${e?.message ?? e}`;
    slot.appendChild(p);
  }
}

function showConvo() {
  workView = null;
  $('#work-project-view').hidden = true; $('#work-convo').hidden = false;
}

function newChat(projectId) {
  workChat = null; lastAsked = ''; workInto = projectId ?? null;
  const mount = $('#answer-in'); if (mount) mount.innerHTML = '';
  $('#s-answer').hidden = true;
  showConvo(); markOpen();
  const p = workInto && workRead?.projects.find((x) => x.id === workInto);
  $('#ask-input').placeholder = p ? `New chat in ${p.name}` : 'Ask about what is in your brain';
  $('#ask-input')?.focus();
}

async function openChat(id) {
  workSaid('Opening.');
  const { data, error } = await sb.rpc('work_open', { p_chat: id });
  if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'That chat could not be opened.'); return; }
  workSaid('');
  showConvo();
  const mount = $('#answer-in'); mount.innerHTML = '';
  $('#s-answer').hidden = false;
  for (const t of data.turns) {
    const turn = el('div', 'answer-turn');
    const asked = el('p', 'answer-asked'); asked.textContent = t.question;
    const slot = el('div', 'answer-slot');
    turn.append(asked, slot); mount.appendChild(turn);
    if (t.withheld || t.answer?.state === 'withheld') { const p = el('p', 'quiet'); p.textContent = t.answer?.note ?? 'No longer shown.'; slot.appendChild(p); }
    else { try { renderAsk(slot, t.answer); } catch (e) { const p = el('p', 'quiet'); p.textContent = `This kept answer could not be drawn: ${e?.message ?? e}`; slot.appendChild(p); } }
    const when = el('p', 'quiet work-when');
    when.textContent = `As shown on ${new Date(t.asked_at).toLocaleString()}. Not asked again.`;
    slot.appendChild(when);
  }
  workChat = data.chat.id; workInto = null;
  lastAsked = data.turns.length ? data.turns[data.turns.length - 1].question : '';
  $('#ask-input').placeholder = 'Continue this chat';
  markOpen();
  mount.lastElementChild?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function markOpen() {
  document.querySelectorAll('#s-work [data-chat]').forEach((b) => {
    if (b.dataset.chat === workChat && !workView) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('#s-work [data-project]').forEach((b) => {
    if (b.dataset.project === workView) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
}

function chatRow(c, projects) {
  const li = el('li', 'work-chat');
  const b = el('button', 'work-open'); b.type = 'button'; b.dataset.chat = c.id; b.textContent = c.title;
  b.addEventListener('click', () => openChat(c.id));
  const mv = el('select', 'work-move'); mv.setAttribute('aria-label', 'Move this chat');
  const opts = [['', c.project_id ? 'Move' : 'Move'], ...projects.filter((p) => p.id !== c.project_id).map((p) => [p.id, `To ${p.name}`])];
  if (c.project_id) opts.push(['none', 'Out of the project']);
  if (opts.length === 1) mv.hidden = true;
  for (const [v, label] of opts) { const o = el('option'); o.value = v; o.textContent = label; mv.appendChild(o); }
  mv.addEventListener('change', async () => {
    if (!mv.value) return;
    const target = mv.value === 'none' ? null : mv.value;
    const { data, error } = await sb.rpc('work_move', { p_chat: c.id, p_project: target });
    if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'Not moved, and no reason was given.'); return; }
    loadWork();
  });
  li.append(b, mv);
  return li;
}

function openProject(id) {
  workView = id;
  const p = workRead?.projects.find((x) => x.id === id);
  if (!p) { showConvo(); return; }
  $('#work-convo').hidden = true;
  const v = $('#work-project-view'); v.hidden = false; v.innerHTML = '';
  const h = el('h2'); h.textContent = p.name;
  const go = el('button', 'go'); go.type = 'button'; go.textContent = `New chat in ${p.name}`;
  go.addEventListener('click', () => newChat(id));
  const ul = el('ul', 'work-chats');
  const mine = workRead.chats.filter((c) => c.project_id === id);
  for (const c of mine) ul.appendChild(chatRow(c, workRead.projects));
  if (!mine.length) { const e = el('li', 'quiet'); e.textContent = 'No chats here yet. Start one, or move a chat here from Recents.'; ul.appendChild(e); }
  v.append(h, go, ul);
  markOpen();
}

async function loadWork() {
  const { data, error } = await sb.rpc('work_list');
  if (error) { workSaid(`Your chats could not be read: ${error.message}`); return; }
  if (!data?.ok) { workSaid(data?.note ?? 'Your chats could not be read, and no reason was given.'); return; }
  workRead = data; workSaid('');
  const pl = $('#work-projects'); pl.innerHTML = '';
  for (const p of data.projects) {
    const li = el('li');
    const b = el('button', 'work-open'); b.type = 'button'; b.dataset.project = p.id;
    const n = data.chats.filter((c) => c.project_id === p.id).length;
    b.textContent = p.name;
    const k = el('span', 'quiet work-count'); k.textContent = String(n);
    b.appendChild(k);
    b.addEventListener('click', () => openProject(p.id));
    li.appendChild(b); pl.appendChild(li);
  }
  if (!data.projects.length) { const e = el('li', 'quiet'); e.textContent = 'None yet.'; pl.appendChild(e); }
  const rl = $('#work-recents'); rl.innerHTML = '';
  const loose = data.chats.filter((c) => !c.project_id);
  for (const c of loose) rl.appendChild(chatRow(c, data.projects));
  if (!data.chats.length) { const e = el('li', 'quiet'); e.textContent = 'Nothing asked yet. Anything you ask, on any tab, is kept here.'; rl.appendChild(e); }
  if (workView) openProject(workView); else markOpen();
}

(function wireWork() {
  $('#work-new')?.addEventListener('click', () => newChat(null));
  $('#work-project-new')?.addEventListener('click', async () => {
    const name = (window.prompt('Name the project') ?? '').trim();
    if (!name) return;
    const { data, error } = await sb.rpc('work_project_new', { p_name: name });
    if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'Not created, and no reason was given.'); return; }
    await loadWork();
    openProject(data.project_id);
  });
})();

// ── boot ────────────────────────────────────────────────────────────────────

// TODAY IN THE HEADER (seat chat-layout, 2026-10-06, Alex's ruling that day). The date, time and
// time zone come from this computer, or from a zone she picks here, kept in this browser. The
// same zone travels with every question (ask), so the Tool and the header agree on today.
const TZ_KEY = 'tool.timezone';
function ownZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (_) { return 'UTC'; }
}
function zone() {
  try { const z = localStorage.getItem(TZ_KEY); if (z) return z; } catch (_) { /* storage off: the computer's */ }
  return ownZone();
}
function drawClock() {
  const when = $('#clock-when'), zbtn = $('#clock-zone');
  if (!when || !zbtn) return;
  const z = zone(), now = new Date();
  try {
    const day = now.toLocaleDateString(undefined, { timeZone: z, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const time = now.toLocaleTimeString(undefined, { timeZone: z, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    when.textContent = `${day}, ${time}`;
  } catch (_) { when.textContent = now.toString(); }
  zbtn.textContent = z.split('_').join(' ') + (z === ownZone() ? '' : ' (your setting)');
}
(function wireClock() {
  const zbtn = $('#clock-zone'), pick = $('#clock-pick');
  if (!zbtn || !pick) return;
  zbtn.addEventListener('click', () => {
    if (!pick.hidden) { pick.hidden = true; return; }
    pick.innerHTML = '';
    let set = null; try { set = localStorage.getItem(TZ_KEY); } catch (_) { /* none */ }
    const own = el('option'); own.value = ''; own.textContent = `This computer's (${ownZone().split('_').join(' ')})`;
    pick.appendChild(own);
    let zones = []; try { zones = Intl.supportedValuesOf('timeZone'); } catch (_) { zones = [ownZone()]; }
    for (const z of zones) {
      const o = el('option'); o.value = z; o.textContent = z.split('_').join(' ');
      if (z === set) o.selected = true;
      pick.appendChild(o);
    }
    pick.hidden = false; pick.focus();
  });
  pick.addEventListener('change', () => {
    try { if (pick.value) localStorage.setItem(TZ_KEY, pick.value); else localStorage.removeItem(TZ_KEY); } catch (_) { /* kept for this page only */ }
    pick.hidden = true; drawClock();
  });
  drawClock();
  setInterval(drawClock, 20000);
})();

drawTreeFrame();                 // the frame first, instantly, with space reserved
stageTypes();
drawTabs();
initMail({
  sb, url: SUPABASE_URL, key: PUBLISHABLE_KEY, el,
  mailboxes: () => mailboxes, mbxError: () => mbxError,
  viewer: () => shape?.viewer ?? null, readingState: () => readingState,
  mailboxLine, openConnect,
  // Seat answer, 2026-10-07: the answer conversation on the Mail tab draws and keeps its turns
  // with the same two functions as the Ask bar, so there is one way an answer looks and is kept.
  renderAsk, keepTurn, zone,
});

// Once a person has chosen a screen, a late-arriving reading must not move them
// off it. Declared before the first read is issued, below.
let userMoved = false;
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-goto]");
  if (b) {
    userMoved = true;
    goto(b.dataset.goto);
    // Arriving at the summary after changing what is read must not show the reading
    // from before the change.
    if (b.dataset.goto === "s-summary") refreshBrain();
    // The two now sit on one tab, so this button moves down to the list (seat tool-tabs).
    if (b.dataset.goto === 's-summary' && b.closest('#s-connect')) $('#s-summary').scrollIntoView();
  }
});

// Nothing opens the log on load. A paragraph here pushed the bar underneath an
// explanation, which is what made it read as chrome rather than as a control.

readBrain();                     // then the live reading lands into the frame

// Landing back from a provider. The round trip now ends where it started, rather
// than on a page telling the person to close the window and find their own way
// back. Each outcome says which one it was; none of them is silent.
(async () => {
  const q = new URLSearchParams(location.search);
  const done = q.get("connected");
  const declined = q.get("connect_declined");
  const failed = q.get("connect_error");
  if (!done && !declined && !failed) return;
  userMoved = true;
  goto("s-summary");
  // Clear the marker so a reload does not repeat the message as though it just happened.
  history.replaceState({}, "", location.pathname);

  if (declined) {
    const why = q.get("reason");
    return say(`That sign-in was declined${why ? ` (${why})` : ""}. Nothing changed, and nothing was stored.`);
  }
  if (failed) {
    return say(`The connection did not complete: ${failed}. Nothing was stored.`);
  }

  // A source key is not a sentence. Say it the way the person would.
  const isMail   = done.startsWith("gmail:");
  const isSystem = done.startsWith("qbo:");
  const named  = done.replace(/^gmail:/, "").replace(/^drive:oauth:/, "");
  say(isSystem
    ? `QuickBooks is connected. The permission is stored in your own workspace, and that `
      + `is all that changed - nothing has been copied out of it. QuickBooks is a system of `
      + `record, so it is read at the moment you ask something of it, not before.`
    : isMail
    ? `${named} is connected. The permission is stored in your own workspace.`
    : `Google Drive is connected for ${named}. The permission is stored in your own `
      + `workspace - and that is all it is. No drive was added to the list and no read `
      + `was started by this. Each drive says on its own line where it stands.`);

  // FINISH THE ACT THE PERSON JUST PERFORMED. Holding a mailbox's key and being
  // allowed to read it here stay two different facts, and the standing offer below
  // still exists for anything found lying in that state. But making someone hunt
  // for a button immediately after they signed in as this exact mailbox, in this
  // session, by their own deliberate act, is not a safeguard - it is an unfinished
  // sentence. The thing this guards against is a SILENT SWEEP over sources nobody
  // asked about; this is the one source they just asked about, named in the return.
  // A system source is firm property and deliberately belongs to no single identity -
  // source_begin sets its owner to null. Adopting it would hand the company's books to
  // whoever happened to click connect, as a silent side effect of a success message.
  // There is also no second gate to walk to: nothing is chosen, and nothing is read
  // until a question is asked.
  if (isSystem) return;

  try {
    const { data, error } = await sb.rpc("source_adopt", { p_source_key: done });
    if (error) throw error;
    if (data?.ok) {
      say(data.changed
        ? (isMail
            ? `It is now yours to read. Open it from the Email group above.`
            : `It is now yours to read.`)
        : `It was already yours to read.`);
    } else {
      say(`It is connected, but not yet readable by you: `
        + `${data?.note ?? data?.reason ?? "the reason was not given"}`);
    }
  } catch (e) {
    say(`It is connected, but making it readable by you did not complete: ${e?.message ?? e}`);
  }
  fillAdoptable();

  // A drive consent is step one of two, and until now there was no step two - which
  // is exactly why signing in read as nothing having happened. Go to the choosing.
  if (!isMail) await stageDrivePicker(done);
})();
// An old #sources link still lands somewhere true: there is one lens now. Routed
// immediately rather than waiting for the read, because it is already a decision.
if (location.hash === "#sources") { userMoved = true; goto("s-summary"); }
// The archived /mail/ page sends its visitors here as #mail, with the mailbox they asked for.
if (location.hash.startsWith('#mail')) {
  userMoved = true;
  const asked = new URLSearchParams(location.hash.split('?')[1] || '').get('mailbox');
  if (asked) chooseMailbox(asked);
  goto('s-lens', 'email');
}

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

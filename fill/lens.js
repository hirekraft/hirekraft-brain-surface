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
import { initMail, drawMail, chooseMailbox, askFromMailBar, findMail, clearFind, doFromBox, mailScope, mailHints, openEmail, mailReading } from "./mail.js?v=2026-10-13-own-state";
import { initBox, drawBox, speakAnswer } from "./box.js?v=2026-10-12-panel";
import { attachOutputs } from "./outputs.js?v=2026-10-13-wide";
import { initPanel, loadPanel, setLive } from "./security.js?v=2026-10-12-working"; import { initChats, loadChats } from "./chats.js?v=2026-10-12-working"; // Chats tab (seat chat-import)
import { initMoney, loadMoney } from "./money.js?v=2026-10-12-working"; // Money tab (seat runway)
import { initProfile, loadProfile } from "./profile.js?v=2026-10-12-working"; // what the Tool thinks the business is (seat know-the-business)

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
  // ONE FIELD, NO PROVIDER TILES (Alex, HQ 6 2026-09-27, reaffirmed 2026-10-06; built by
  // seat connect-by-address 2026-10-08). The Google / Microsoft / Yahoo / Enter your
  // address tiles are retired: she types her address and the Tool works out the provider.
  email: {
    head: "Connect your email", sub: "Type your email address. You sign in on their page, not here.",
    address: true,
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
              { name: "Wise",       key: "wise", account: true },
              { name: "HubSpot",    key: "hubspot", account: true },
              { name: "CATS",       key: "cats", account: true },
              { name: "Mercury",    key: "mercury", account: true },
              { name: "Slack",      key: "slack", account: true }],
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
// A reading's fingerprint: what the screen draws from it, without what she cannot see change (the reading's own
// timestamp, a walk's lease). Two readings with the same fingerprint draw the same screen (seat conversation-panel).
const UNSEEN_KEY = new RegExp('lease|^read_at$', 'i');
function readingPrint() {
  return JSON.stringify([shape, [...mailboxes.values()], [...driveStates.values()]],
    (k, v) => (k && UNSEEN_KEY.test(k) ? undefined : v));
}
let lastPrint = null;

// Returns true when it drew, false when the new reading draws nothing new (onlyIfChanged), so the caller knows.
async function readBrain(opts = {}) {
  const tree = $("#tree");
  try {
    const mbx = readMailboxes();
    const drv = readDriveStates();
    const { data, error } = await sb.rpc("brain_shape");
    if (error) throw error;

    if (data?.state === "unbound") { renderState("unbound"); routeOnState("unbound"); return true; }

    shape = data;
    await Promise.all([mbx, drv]);
    const print = readingPrint();
    if (opts.onlyIfChanged && print === lastPrint) {
      // Nothing she can see changed: only the time of the reading moves.
      const line = $("#live-state .quiet");
      if (line) line.textContent = `Read live from your brain at ${fmtWindow(shape.read_at)}. Every figure above comes from that reading.`;
      return false;
    }
    lastPrint = print;
    renderWho();
    fillTree();
    fillAttention();
    fillRecognition();
    fillAdoptable();
    renderState("live");
    routeOnState("live");
    return true;
  } catch (e) {
    // Never fabricate and never hang. Say the reading did not come back.
    renderState("unreachable", e?.message ?? String(e));
    routeOnState("unknown");
    lastPrint = null;
    return true;
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
  // Every reading ends here, so an open source tab is redrawn from it (seat tool-tabs), EXCEPT a tab whose screen
  // keeps its own state (seat conversation-panel, round 4; Alex 2026-10-13: the Contacts card "is somehow always
  // reloading"). Those draw on tab entry only; a reading may refresh what beside them comes from the reading.
  if ($('#s-lens') && !$('#s-lens').hidden) { if (lensKey in OWN_STATE) OWN_STATE[lensKey](); else drawLens(); }
  if ($('#s-security') && !$('#s-security').hidden) drawSecConnected();
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
  // THE CUSTOMER'S OWN NAME IN THE MASTHEAD, as she writes it (seat conversation-panel, Alex 2026-10-12), from the
  // brain's business_name(). Until that read exists on this brain the masthead keeps its text; nothing is guessed.
  sb.rpc('business_name').then(({ data, error }) => {
    const span = document.querySelector('.wordmark span');
    if (!error && typeof data === 'string' && data.trim() && span) span.textContent = data.trim();
  }).catch(() => { /* the read is not there yet: the masthead stays as it was */ });
  $("#whoami").innerHTML = `<b>${escape(v.name)}</b><br>${escape(v.role ?? "")}`;
  $("#sum-head").textContent = v.all_access
    ? "What is in it."
    : "What is in it, as far as you reach.";
  // The one-line count under the heading: what the reading itself lists, never recounted here.
  const groups = (shape.groups ?? []).filter((g) => (g.count ?? 0) > 0);
  const n = groups.reduce((t, g) => t + g.count, 0);
  $("#sum-count").textContent = n ? `${n} ${n === 1 ? 'source' : 'sources'} connected, in ${groups.length} ${groups.length === 1 ? 'kind' : 'kinds'}` : '';
  // Tests are the owner's. Hiding the way in is courtesy; the brain refuses anyone else.
  const te = $("#tests-entry");
  if (te) te.hidden = !v.all_access;
  // Owner tabs (Security, Money) are the owner's. Hidden is courtesy; the brain refuses anyone else.
  // 2026-10-12 seat runway: was a lookup of the Security tab by name, so a second owner tab would have shown to
  // everyone; now every TABS entry marked owner is hidden for anyone without all access.
  document.querySelectorAll('#tabs .tab').forEach((b) => { if (TABS.find((t) => t.key === b.dataset.tab)?.owner) b.hidden = !v.all_access; });
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
      // 'gaps' (seat drive-coverage 2026-10-11): Google holds files the Tool has not seen or read.
      // Without this line a drive that is not fully read was counted nowhere in the summary.
      const gaps = rows.filter((r) => r.state === 'gaps').length;
      alive = [busy ? `${busy} reading now` : null,
               unread ? `${unread} not read yet` : null,
               failed ? `${failed} stopped` : null,
               gaps ? `${gaps} not fully read` : null,
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
    li.dataset.key = m.target ?? m.name;
    const btn = el("button", "member");
    btn.type = "button";

    // A system's own line below says when it was connected and last asked. The date window here read a
    // chunk span a live-read system never has, hence "no dates recorded" (seat systems-list, 2026-10-11).
    const from = key === 'systems' ? null : fmtWindow(m.window_from);
    const win = key === 'systems' ? '' : from
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
      drawConnectOffer(li, m, data);
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
      li.appendChild(badgeLine(st, ['Not chosen', 'grey']));
    } else if (key === "email" && mbxError) {
      const st = el("div", "state stalled");
      st.innerHTML = `<span class="dot"></span>Its state could not be read just now `
        + `(${escape(mbxError)}), so this line is not a claim either way.`;
      li.appendChild(st);
    } else if (key === 'systems') {
      li.appendChild(systemLine(m, data));
    } else {
      const st = el("div", `state ${HEALTH_CLASS[m.health] ?? ""}`);
      st.innerHTML = `<span class="dot"></span>${HEALTH[m.health] ?? m.health}`
        + (m.latest && m.health !== "reading" ? ` &middot; newest item ${fmtDay(m.latest)}` : "");
      li.appendChild(badgeLine(st, HEALTH_WORD[m.health]));
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

// ── ONE STATUS WORD PER LINE (seat conversation-panel, Alex 2026-10-12) ──────
// The word is chosen from the STATE the brain decided (drive_state, mailbox_state, brain_shape), never from a color,
// and green is used only where the brain says the thing is up to date. The brain's own sentence opens on click.
const DRIVE_WORD = {
  ready: ['Up to date', 'green'], filling: ['Reading', 'blue'], gaps: ['Needs you', 'orange'],
  needs_signin: ['Needs you', 'orange'], shut_out: ['Needs you', 'orange'], paused: ['Needs you', 'orange'],
  unread: ['Not read', 'grey'], failed: ['Stopped', 'orange'], behind: ['Behind', 'orange'],
  empty: ['Empty', 'grey'], stopped: ['Stopped', 'grey'], left_out: ['Not read', 'grey'],
};
const MAIL_WORD = {
  reading: ['Reading', 'blue'], closed_to_you: ['Not yours', 'grey'], unread: ['Not read', 'grey'],
  stopped: ['Needs you', 'orange'], off: ['Off', 'grey'], not_yours: ['Not yours', 'grey'],
};
const HEALTH_WORD = {
  reading: ['Reading', 'blue'], behind: ['Behind', 'orange'], paused: ['Not kept up to date', 'grey'],
  never: ['Not read', 'grey'], refused: ['Needs you', 'orange'], unconnected: ['Not connected', 'grey'],
};
function badge(word, kind) { const b = el('span', 'badge b-' + kind); b.textContent = word; return b; }
// Puts the badge first and folds the line's existing sentence behind it. Call before any action button is added:
// the button stays on the line, visible, because a problem and its remedy belong together.
function badgeLine(wrap, pair, count) {
  const [word, kind] = pair ?? ['Unknown', 'grey'];
  const full = el('span', 's-full'); full.innerHTML = wrap.innerHTML; full.hidden = true;
  const btn = el('button', 's-badge'); btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.appendChild(badge(word, kind));
  if (count) { const c = el('span', 's-count'); c.textContent = count; btn.appendChild(c); }
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    full.hidden = !full.hidden;
    btn.setAttribute('aria-expanded', String(!full.hidden));
  });
  wrap.innerHTML = '';
  wrap.classList.add('badged');
  wrap.append(btn, full);
  return wrap;
}
function driveCount(s) {
  if (s.state === 'filling') return `${s.done} of ${s.done + s.waiting}`;
  if (s.files) return `${Number(s.files).toLocaleString()} ${s.files === 1 ? 'file' : 'files'} read`;
  return '';
}

function driveLine(s) {
  const wrap = el("div", `state tone-${s.tone}`);
  wrap.innerHTML = `<span class="dot"></span><span class="s-head">${escape(s.headline)}</span>`
    + (s.detail ? ` &middot; ${escape(s.detail)}` : "");
  badgeLine(wrap, DRIVE_WORD[s.state], driveCount(s));
  if (s.action === "sign_in") wrap.appendChild(signInAgainControl(s));
  if (s.action === "resume")  wrap.appendChild(resumeControl(s));
  return wrap;
}

// One system, one line (seat systems-list, 2026-10-11). An import says it was brought in and is not updated,
// in grey and never red: it has no schedule, so it cannot be behind one. A connected system says when it was
// connected and when it was last asked. Built from facts brain_shape carries; nothing here is guessed.
function systemLine(m, group) {
  const wrap = el('div', 'state tone-plain');
  let text;
  // A brain that predates this line sends no last_read at all (undefined, not null). Then the older health
  // words stand, rather than claiming "not read yet" about a system that was read.
  if (!('last_read' in m)) {
    wrap.className = `state ${HEALTH_CLASS[m.health] ?? ''}`;
    wrap.innerHTML = `<span class="dot"></span>${HEALTH[m.health] ?? escape(m.health)}`;
    return badgeLine(wrap, HEALTH_WORD[m.health]);
  }
  let word;
  if (m.mechanism === 'imported') {
    word = ['Imported', 'grey'];
    const brought = `brought in on ${fmtDay(m.last_read) ?? 'a date not recorded'}`;
    const live = m.superseded_by && (group.members ?? []).find((x) => x.target === m.superseded_by);
    text = live
      ? `Older copy, ${brought}; ${escape(live.name)} is now read directly`
      : `Brought in on ${fmtDay(m.last_read) ?? 'a date not recorded'}, not updated since`;
    if (m.items) text += ` &middot; ${Number(m.items).toLocaleString()} pieces held`;
  } else if (m.health === 'refused' || m.health === 'unconnected') {
    wrap.className = `state ${HEALTH_CLASS[m.health]}`;
    word = HEALTH_WORD[m.health];
    text = HEALTH[m.health];
    if (m.kept && m.walk_line) text += ` &middot; ${escape(m.walk_line)}`;
  } else if (m.kept) {
    // seat records-in 2026-10-12: a KEPT system is read into the brain on a schedule, not read when asked.
    // walk_line is the walk's own sentence (first read under way, up to date, paused for the cost check, or stopped and why).
    if (m.last_read) wrap.className = 'state live';
    word = m.last_read ? ['Reading', 'blue'] : ['Not read', 'grey'];
    text = m.last_read ? `Kept, last read ${fmtWindow(m.last_read)}` : 'Kept, first read not started yet';
    if (m.items) text += ` &middot; ${Number(m.items).toLocaleString()} pieces kept`;
    if (m.walk_line) text += ` &middot; ${escape(m.walk_line)}`;
  } else {
    const since = m.connected_at ? `Connected ${fmtDay(m.connected_at)}` : 'Connected';
    if (m.last_read) wrap.className = 'state live';
    word = m.last_read ? ['Read live', 'blue'] : ['Not read', 'grey'];
    text = m.last_read
      ? `${since}, read when you ask, last asked ${fmtWindow(m.last_read)}`
      : `${since}, not read yet`;
  }
  wrap.innerHTML = `<span class="dot"></span><span class="s-head">${text}</span>`;
  return badgeLine(wrap, word, m.items ? `${Number(m.items).toLocaleString()} pieces` : '');
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
  badgeLine(wrap, MAIL_WORD[mb.state], mb.last_read_at ? `last read ${fmtWindow(mb.last_read_at)}` : '');
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
    beginConnect(GMAIL, "individual", mb.address, b, () => { b.textContent = was; }, mb.address);
  });
  wrap.appendChild(b);
  return wrap;
}

// A row that is not connected opens the way to connect it, and nothing else.
// RETIRED 2026-10-11 (seat systems-list, HQ 7's brief from Alex's screenshot): the grey box "This is where the
// <figures/files> for X will live. Reading and acting on them is a separate build." It was false by then (drive
// files and systems are read), it served drives as well as systems, and it is removed, not hidden. Nothing
// replaces it: a row's own line says what is true. Clicking a connected row without a lens does nothing.
function drawConnectOffer(li, m, group) {
  const open = $(".placeholder", li);
  const btn = $(".member", li);
  if (open) { open.remove(); btn?.setAttribute('aria-expanded', 'false'); return; }

  const box = el("div", "placeholder");

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
            + "nothing is reorganized."}</p>`;
    const go = el("button", "go");
    go.type = "button";
    go.textContent = `Connect ${m.name}`;
    go.addEventListener("click", (ev) => { ev.stopPropagation(); openConnect(group.key); });
    box.appendChild(go);
    li.appendChild(box);
    btn?.setAttribute('aria-expanded', 'true');
  }
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
  said.innerHTML = `<b>Check a box to have Tool read that drive or folder. Uncheck it to stop.</b> `
    + `Tool reads what is checked here and nothing else. Building this list needed only `
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

// (reserveForDock retired 2026-10-12, seat conversation-panel: the conversation is a panel on the right, not a
// bottom dock, so nothing at the foot of a page goes under it.)

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

    // Who sees what moved to the Security tab on 2026-10-08 (seat security-tab, Alex's ruling that day).

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
  if (p.address) return stageAddress(stage);

  const grid = el("div", "tiles");
  for (const o of p.options) {
    const b = el("button", "tile");
    b.type = "button";
    b.innerHTML =
      `<span class="mark" aria-hidden="true" style="display:grid;place-items:center;`
      + `border:1px solid currentColor;border-radius:3px;font-size:11px;font-weight:500">`
      + `${escape(o.name[0])}</span>`
      + `<span class="t-name">${escape(o.name)}</span>`
      + `<span class="t-sub">${o.wired || o.key ? "ready" : "not connected yet"}</span>`;
    b.addEventListener("click", () =>
      o.key ? stageKey(groupKey, o) : o.wired ? stageScope(groupKey, o) : stageNotWired(stage, o));
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

// CONNECT BY KEY (seat connect-systems, 2026-10-11). Wise and HubSpot offer a small business no sign-in page the
// Tool can use, so the owner creates a read-only key in the system's own settings and pastes it here. system-read
// tests it against the system first; only a key the system accepts is kept, in this brain's own vault. The field is
// cleared the moment it is sent and the key is never shown again. The brain refuses anyone but the owner.
const SYSTEM_READ_URL = `${SUPABASE_URL}/functions/v1/system-read`;
const KEY_HOW = {
  wise: "In Wise, signed in to the business account, open Your Account, then Integrations and Tools, then API tokens. Choose Add new token, set it to Read only, and copy it (Wise shows it once).",
  hubspot: "In HubSpot (as a super admin), open Development and create a service key with read access to CRM contacts, companies and deals, then copy it. An access token from a private app under Development, Legacy apps works too.",
  cats: "In CATS, open Settings, then Administration, then API Keys, create a key named Verrandi (read only if CATS offers it), and copy it. The Tool only ever reads from CATS.",
  mercury: "In Mercury, open Settings, then API Tokens, create a token with Read Only access, and copy it. If Mercury asks for allowed IP addresses, say so here: the Tool cannot use a token tied to fixed addresses.",
  slack: "The app only reads, and only what you yourself can see in Slack. It lives in your own workspace, so Slack does not slow it down.",
};
// Slack's internal-app manifest (read-only USER scopes: the token reads exactly what the installing person sees).
// Named after the customer's own Tool (Alex 2026-10-12: HireKraft's systems carry HireKraft's name), pre-filled from
// the masthead's wordmark and editable, so nothing here names a customer.
function slackManifest(name) {
  const n = String(name || "").trim().slice(0, 35) || "Tool";
  return JSON.stringify({
    display_information: { name: n, description: `Reads your Slack for your own questions in ${n}. Read only.` },
    oauth_config: { scopes: { user: ["channels:history", "channels:read", "groups:history", "groups:read", "users:read", "users:read.email", "team:read"] } },
    settings: { org_deploy_enabled: false, socket_mode_enabled: false, token_rotation_enabled: false },
  }, null, 2);
}
function slackDefaultName() {
  const w = (document.querySelector(".wordmark span")?.textContent || "").trim();
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : "Tool";
}
// Slack's create page changed in 2026: a wizard ending in Create and Install, which fails for an app that only
// reads as a person (seen on Alex's screen 2026-10-12). Installing from the app's own OAuth & Permissions page works
// (that is how HireKraft's Slack was connected). So the steps lead there, whatever the wizard does.
const SLACK_STEPS = [
  "Type the app's name above (your business name), then press Copy the manifest.",
  "In a browser signed in to Slack, open api.slack.com/apps.",
  "If an app with that name is already listed under Your Apps, open it and skip to step 5. Otherwise choose Create New App, then From a manifest, pick your workspace and paste.",
  "Finish creating the app. If Slack shows Installation was not completed, that is expected here: carry on.",
  "Open the app, then OAuth & Permissions in the left menu, then Install to Workspace (or Reinstall), then Allow.",
  "On that same page, copy the User OAuth Token (it starts with xoxp-) and paste it below.",
];
function stageKey(groupKey, o) {
  const stage = $("#connect-stage");
  stage.innerHTML = "";
  $("#connect-head").textContent = `Connect ${o.name}`;
  $("#connect-sub").textContent = "";
  const n = el("div", "notice flagged");
  n.innerHTML = `<b>${escape(o.name)} has no per-person boundary.</b> A key opens the whole account, so only you `
    + `connect it and only your questions read it. The Tool only reads; it never changes anything in ${escape(o.name)}.`;
  const how = el("p", "quiet");
  how.textContent = KEY_HOW[o.key] ?? "";
  const form = el("form", "");
  form.innerHTML = `<label for="key-in"><b>Paste the key</b></label>`
    + `<input id="key-in" type="password" autocomplete="off" spellcheck="false" required `
    + `style="display:block;margin-top:.5rem;width:100%;max-width:28rem;font:inherit;padding:.6rem;`
    + `border:1px solid currentColor;border-radius:6px;background:none;color:inherit">`
    + `<div class="actions"><button class="go" type="submit">Connect</button></div>`;
  const out = el("div", "");
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const input = form.querySelector("#key-in");
    const key = input.value.trim();
    input.value = "";
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Checking the key";
    try {
      const { data } = await sb.auth.getSession();
      const jwt = data?.session?.access_token;
      if (!jwt) throw new Error("you are not signed in on this browser");
      const r = await fetch(SYSTEM_READ_URL, { method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", kind: o.key, key }) });
      const body = await r.json().catch(() => null);
      out.innerHTML = "";
      const msg = el("div", body?.ok ? "notice" : "notice flagged");
      msg.textContent = body?.ok
        ? `${o.name} is connected. Ask the box about it in your own words.`
        : `Not connected: ${body?.reason ?? body?.error ?? "no reason was given"} Nothing was kept.`;
      out.appendChild(msg);
      if (body?.ok) await refreshBrain();
    } catch (e) {
      out.innerHTML = "";
      const msg = el("div", "notice flagged");
      msg.textContent = `Not connected: ${e?.message ?? e}. Nothing was kept.`;
      out.appendChild(msg);
    } finally { btn.disabled = false; btn.textContent = "Connect"; }
  });
  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back";
  back.addEventListener("click", () => stageProviders(groupKey, PICKERS[groupKey]));
  const extra = [];
  if (o.key === "slack") {
    const nameLab = el("label", "");
    nameLab.innerHTML = "<b>The app's name in Slack</b>";
    const nameIn = el("input", "");
    nameIn.type = "text"; nameIn.value = slackDefaultName(); nameIn.maxLength = 35;
    nameIn.style.cssText = "display:block;margin:.5rem 0 1rem;width:100%;max-width:28rem;font:inherit;padding:.6rem;border:1px solid currentColor;border-radius:6px;background:none;color:inherit";
    const steps = el("ol", "");
    for (const s of SLACK_STEPS) { const li = el("li", ""); li.textContent = s; steps.appendChild(li); }
    const ta = el("textarea", "");
    ta.readOnly = true; ta.value = slackManifest(nameIn.value); ta.rows = 12;
    nameIn.addEventListener("input", () => { ta.value = slackManifest(nameIn.value); });
    extra.push(nameLab, nameIn, steps);
    ta.style.cssText = "display:block;width:100%;max-width:28rem;font:12px/1.4 ui-monospace,monospace;padding:.6rem;border:1px solid currentColor;border-radius:6px;background:none;color:inherit";
    const copy = el("button", "go ghost"); copy.type = "button"; copy.textContent = "Copy the manifest";
    copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(ta.value); copy.textContent = "Copied"; } catch (_) { ta.select(); } });
    extra.push(ta, copy);
  }
  stage.append(n, how, ...extra, form, out, back);
  form.querySelector("#key-in").focus();
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

  // Mail no longer comes through here: it is one field (stageAddress). The old
  // "Whose account?" fork for mail was removed with the provider tiles, 2026-10-08.
  return stageConsent(provider, "individual", groupKey);
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

  stage.appendChild(consentButton(provider, scope, groupKey));

  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back";
  back.addEventListener("click", () => stageScope(groupKey, provider));
  stage.appendChild(back);
}

// ── connect mail by address ─────────────────────────────────────────────────
// She types her address. oauth-start (?address=) says who holds that mail from where the
// domain's mail is delivered; only the domain leaves, never the address. If it cannot
// tell, the screen asks THEN, never up front. The typed address is the mailbox expected:
// the provider's page opens with that account chosen, and the callback refuses a sign-in
// as any other account (oauth-callback right-account check), so this screen is the
// convenience and the callback is the control.
const GMAIL = { name: "Google", type: "gmail" };
const MAIL_BY = { google: "Google", microsoft: "Microsoft", yahoo: "Yahoo" };

function stageAddress(stage) {
  const form = el("form", "");
  form.innerHTML = `<label for="addr-in"><b>Your email address</b></label>`
    + `<input id="addr-in" type="email" autocomplete="email" required `
    + `placeholder="name@yourcompany.com" style="display:block;margin-top:.5rem;width:100%;`
    + `max-width:24rem;font:inherit;padding:.6rem;border:1px solid currentColor;`
    + `border-radius:6px;background:none;color:inherit">`
    + `<div class="actions"><button class="go" type="submit">Continue</button></div>`;
  const out = el("div", "");
  form.addEventListener("submit", (ev) => { ev.preventDefault(); lookUpAddress(form, out); });
  stage.append(form, out);

  const back = el("button", "go ghost");
  back.type = "button"; back.textContent = "Back to all sources";
  back.addEventListener("click", stageTypes);
  stage.appendChild(back);
  form.querySelector("#addr-in").focus();
}

function addrSay(out, html, flagged) {
  out.innerHTML = "";
  const n = el("div", flagged ? "notice flagged" : "notice");
  n.innerHTML = html;
  out.appendChild(n);
  return n;
}

async function lookUpAddress(form, out) {
  const address = form.querySelector("#addr-in").value.trim().toLowerCase();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "Checking…";
  const restore = () => { btn.disabled = false; btn.textContent = "Continue"; };
  let r;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/oauth-start?address=${encodeURIComponent(address)}`);
    r = await res.json();
  } catch (_e) {
    r = { ok: false, reason: "lookup_failed" };
  }
  const where = escape(r.domain ?? address.split("@")[1] ?? "that address");

  if (!r.ok && r.reason === "not_an_address") {
    restore();
    return addrSay(out, "That does not look like an email address. Check it and try again.", true);
  }
  if (!r.ok && r.reason === "no_mail_records") {
    restore();
    return addrSay(out, `<b>${where} does not receive email,</b> so there is no mailbox to `
      + `connect. Check the spelling.`, true);
  }
  if (!r.ok) {
    restore();
    return askMailProvider(out, address, `Who handles mail for ${where} could not be looked up just now.`);
  }
  if (!MAIL_BY[r.provider]) {
    restore();
    return askMailProvider(out, address, `Mail for ${where} goes through a service that could not be recognized.`);
  }
  if (!r.supported) {
    restore();
    return mailNotBuilt(out, address, MAIL_BY[r.provider]);
  }
  startMailConnect(out, address, btn, restore);
}

function mailNotBuilt(out, address, name) {
  addrSay(out, (name
    ? `<b>${escape(address)} is ${escape(name)} mail.</b> Connecting ${escape(name)} mail is not built yet`
    : `<b>Only Google mail can be connected so far.</b> Other providers are not built yet`)
    + `, so nothing here pretends otherwise. Nothing was stored.`, true);
}

function startMailConnect(out, address, btn, restore) {
  addrSay(out, `<b>${escape(address)} is Google mail.</b> Opening Google's page with this `
    + `account chosen. Sign in as ${escape(address)}: a sign-in as any other account is refused `
    + `and nothing is kept.`);
  if (btn) btn.textContent = "Opening Google…";
  beginConnect(GMAIL, "admin", address, btn, restore, address);
}

// Asked only when the Tool could not tell, never up front.
function askMailProvider(out, address, why) {
  const n = addrSay(out, `${why} Which company handles this mail?`);
  const box = el("div", "choices");
  for (const [key, name] of Object.entries({ google: "Google", microsoft: "Microsoft", other: "Someone else" })) {
    const b = el("button", "choice");
    b.type = "button";
    b.innerHTML = `<span aria-hidden="true"></span><span><span class="c-name">${name}</span></span>`;
    b.addEventListener("click", () => key === "google"
      ? startMailConnect(out, address, b, null)
      : mailNotBuilt(out, address, key === "microsoft" ? "Microsoft" : null));
    box.appendChild(b);
  }
  n.appendChild(box);
}

// ONE PATH TO THE PROVIDER, whether the address came from a click on the list or
// from the box. Two copies of this would be two truths, and the one nobody used
// would be the one that rotted.
// hint: an address the person typed on this screen. It is echoed to the provider so the
// right account is pre-chosen; nothing read from the brain is ever put into it.
async function beginConnect(provider, scope, mailbox, btn, restore, hint) {
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

    // A typed address tries the owner path first: an owner's own sign-in is then read
    // through that sign-in. Anyone else is connected for themselves.
    if (!data?.ok && data?.reason === "owner_only" && hint && scope === "admin") {
      return beginConnect(provider, "individual", mailbox, btn, restore, hint);
    }

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
      + `?source_id=${encodeURIComponent(data.source_id)}`
      + (hint ? `&login_hint=${encodeURIComponent(hint)}` : "");
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

// ── what this screen did, said in the conversation panel ─────────────────────
// It reports what this surface DID (a source resumed, a mailbox adopted, a sign-in declined).
function say(text, asked) {
  const log = $("#dock-turns");
  if (asked) { const q = el("div", "turn asked"); q.textContent = asked; log.appendChild(q); }
  const a = el("div", "turn said");
  a.textContent = text;
  log.appendChild(a);
  openPanel();
  a.scrollIntoView({ block: "nearest" });
}

// ── THE CONVERSATION PANEL (seat conversation-panel, Alex 2026-10-12) ──────────
// SHOW only: where the one conversation is drawn and whether it is on screen. It asks nothing and keeps
// nothing (ask() and keepTurn() do). Three states, all reversible without a refresh: open (on the right; the
// tab reflows beside it on a wide screen, it overlays a narrow one, it is the whole screen on a phone), full
// (widened over the tab), and put away (a tab on the right edge, named after the conversation, which reopens
// it with the same scroll). Esc puts it away. The state is per page; nothing is stored.
let panelScroll = 0;
function panelTitle(t) {
  if (!$("#panel")) return;
  const s = String(t || "").trim();
  const name = s ? (s.length > 48 ? s.slice(0, 46).trimEnd() + "..." : s) : "New conversation";
  $("#panel-title").textContent = name;
  $("#panel-tab-name").textContent = name;
  $("#panel-tab").setAttribute("aria-label", "Open the conversation: " + name);
}
function panelOpen() { return !!$("#panel") && !$("#panel").hidden; }
function openPanel() {
  const p = $("#panel");
  if (!p) return;
  if (p.classList.contains("in-work")) { drawBox(); return; }   // on Work the conversation is the page itself
  if (p.hidden) {
    p.hidden = false;
    $("#panel-tab").hidden = true;
    document.body.dataset.panel = p.classList.contains("full") ? "full" : "open";
    $("#panel-body").scrollTop = panelScroll;
  }
  drawBox();
}
function putAway() {
  const p = $("#panel");
  if (!p || p.hidden || p.classList.contains("in-work")) return;
  panelScroll = $("#panel-body").scrollTop;
  p.hidden = true;
  delete document.body.dataset.panel;
  // The tab on the edge only when there is something to come back to.
  const has = !!$("#answer-in").children.length || !!$("#dock-turns").children.length;
  $("#panel-tab").hidden = !has;
  if (has) $("#panel-tab").focus({ preventScroll: true });
  drawBox();
}
function fullPanel(on) {
  const p = $("#panel");
  const full = on ?? !p.classList.contains("full");
  p.classList.toggle("full", full);
  $("#panel-full").setAttribute("aria-pressed", String(full));
  $("#panel-full").setAttribute("aria-label", full ? "Back beside the tab" : "Full screen");
  $("#panel-full").title = full ? "Back beside the tab" : "Full screen";
  if (!p.hidden) document.body.dataset.panel = full ? "full" : "open";
}
(function wirePanel() {
  if (!$("#panel")) return;
  $("#panel-away").addEventListener("click", putAway);
  $("#panel-full").addEventListener("click", () => fullPanel());
  $("#panel-new").addEventListener("click", () => newChat(null));
  $("#panel-work")?.addEventListener("click", () => { userMoved = true; goTab('work'); });
  $("#panel-list")?.addEventListener("click", () => $("#s-work")?.classList.toggle("list-open"));
  $("#work-view-close")?.addEventListener("click", closeWide);
  $("#panel-tab").addEventListener("click", () => { openPanel(); $("#panel-input").focus({ preventScroll: true }); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !panelOpen() || e.defaultPrevented) return;
    // Esc first closes what is open on top (a menu, the box's examples); only then the panel.
    if (document.querySelector(".work-menu") || !$("#onebox-tips").hidden) return;
    putAway();
  });
  // On a phone: pull the panel down by its handle or header to put it away.
  let y0 = null;
  const start = (e) => { if (window.innerWidth <= 720) y0 = e.touches[0].clientY; };
  const move = (e) => {
    if (y0 === null) return;
    const dy = e.touches[0].clientY - y0;
    if (dy > 0) $("#panel").style.transform = "translateY(" + dy + "px)";
  };
  const end = (e) => {
    if (y0 === null) return;
    const dy = (e.changedTouches[0]?.clientY ?? y0) - y0;
    y0 = null;
    $("#panel").style.transform = "";
    if (dy > 90) putAway();
  };
  for (const h of [$("#panel-handle"), document.querySelector(".panel-head")]) {
    h.addEventListener("touchstart", start, { passive: true });
    h.addEventListener("touchmove", move, { passive: true });
    h.addEventListener("touchend", end);
  }
})();

// -- the ask ----------------------------------------------------------------
// THE SERVER SETS THE STATE AND THIS FILE MAY NOT. lens-ask returns one of four
// states and carries an `answer` field in exactly ONE of them. So nothing below
// needs a rule saying "do not present retrieval as an answer": in the other three
// states there is no field here to present. The code reads `state` and never
// infers one by counting records.
//
// The answer lands in the conversation panel, under the question that asked it, on every tab
// (seat conversation-panel, 2026-10-12).

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
      // [b2] (lens-ask v22/v23): a figure read live from a connected system (QuickBooks, Wise, HubSpot) when she
      // asked; which system is named in the first line under the answer. Drawn as words, like [g].
      if (inner[0] === "b" && inner.length > 1 && inner.length <= 3 && String(Number(inner.slice(1))) === inner.slice(1)) {
        flush(); spaceBefore(parent);
        const m = el("span", "cite-g"); m.textContent = "(read live)"; m.title = "Read live from a connected system when you asked; the line under the answer names it";
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

// THE EMAILS AN ANSWER RESTS ON (seat talk-to-the-tool, 2026-10-12, Alex 2026-10-11: "whenever I ask the tool
// anything, it goes back to the email screen"). A find is no longer a jump to Mail decided by the first word:
// every question goes to the conversation, and when the answer rests on emails, those emails are listed in it,
// each opening in its own mailbox on Mail. The list is read from the answer's own citations (lens-ask's open
// links into Gmail carry the mailbox and the email's id), so it shows exactly what the answer used and nothing
// the screen chose. The sources below still open each one in Gmail.
const GMAIL_OPEN = "https://mail.google.com/mail/u/";
function emailsOf(body) {
  const ev = (Array.isArray(body.citations) && body.citations.length) ? body.citations
    : (Array.isArray(body.evidence) ? body.evidence : []);
  const out = [], seen = new Set();
  for (const e of ev) {
    const u = String(e?.open_url || "");
    if (!u.startsWith(GMAIL_OPEN)) continue;
    const rest = u.slice(GMAIL_OPEN.length);
    const cut = rest.indexOf("/#all/");
    if (cut <= 0) continue;
    let mailbox = "";
    try { mailbox = decodeURIComponent(rest.slice(0, cut)); } catch (_) { continue; }
    const id = rest.slice(cut + 6);
    if (!mailbox.includes("@") || !id || seen.has(mailbox + "|" + id)) continue;
    seen.add(mailbox + "|" + id);
    out.push({ key: "gmail:" + mailbox, mailbox, id, title: String(e.doc || ""), snippet: String(e.snippet || "") });
  }
  return out;
}
const EMAILS_SHOWN = 8;
function emailList(mails) {
  const box = el("div", "ans-emails");
  const h = el("p", "ans-emails-head");
  h.textContent = mails.length === 1 ? "The email this rests on" : `The ${mails.length} emails this rests on`;
  box.appendChild(h);
  const ul = el("ul", "ans-emails-list");
  for (const m of mails.slice(0, EMAILS_SHOWN)) {
    const li = el("li");
    const b = el("button", "ans-email");
    b.type = "button";
    b.title = "Open this email";
    const t = el("span", "ans-email-subj"); t.textContent = m.title || "(no subject)";
    const w = el("span", "ans-email-box"); w.textContent = m.mailbox;
    b.append(t, w);
    const sn = m.snippet.split(String.fromCharCode(10)).map((s) => s.trim()).filter(Boolean).join(" ").slice(0, 140);
    if (sn) { const s = el("span", "ans-email-snip"); s.textContent = sn; b.appendChild(s); }
    b.addEventListener("click", () => openFromAnswer(m.key, m.id));
    li.appendChild(b);
    ul.appendChild(li);
  }
  box.appendChild(ul);
  if (mails.length > EMAILS_SHOWN) {
    const p = el("p", "quiet");
    p.textContent = `${mails.length - EMAILS_SHOWN} more are in the records below.`;
    box.appendChild(p);
  }
  return box;
}
// The one move to Mail: she opened an email from an answer.
function openFromAnswer(key, id) { userMoved = true; goto("s-lens", "email"); openEmail(key, id); }

// HEARING A SPOKEN QUESTION where the browser cannot (box.js microphone, seat talk-to-the-tool): the recording
// goes to lens-ask, which writes it down and sends back only the words. As the signed-in person, like every ask.
async function hearSpoken(b64, mime) {
  const { data } = await sb.auth.getSession();
  const jwt = data?.session?.access_token;
  if (!jwt) return { state: "heard_failed", answer: "You are not signed in on this browser, so nothing can be written down. Sign in and try again." };
  const r = await fetch(ASK_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ listen: b64, mime_type: mime }),
  });
  const j = await r.json().catch(() => null);
  return j ?? { state: "heard_failed", answer: `The Tool did not answer (${r.status}).` };
}

// ANSWERS BECOME CHARTS AND FILES (seat work-outputs, 2026-10-10). Every answer drawn anywhere passes here once,
// so its chart and the PDF / Spreadsheet / Slides buttons come with it, kept answers and the email conversation
// included. outputs.js builds files in the browser from the body drawn here and sends nothing.
const OUT_CTX = { askUrl: ASK_URL, key: PUBLISHABLE_KEY, session: () => sb.auth.getSession(),
  // A PDF made from an answer also shows wide beside the conversation (seat conversation-panel, item 15).
  view: (title, url) => { const f = el('iframe', 'wide-pdf'); f.src = url; f.dataset.blob = url; f.title = title; showWide(title, f); } };
function renderAsk(slot, body) {
  drawAsk(slot, body);
  dropEchoHeading(slot);
  try { attachOutputs(slot, body, OUT_CTX); }
  catch (e) { const p = el("p", "quiet"); p.textContent = `The chart or the file buttons could not be drawn: ${e?.message ?? e}`; slot.appendChild(p); }
  wideButtons(slot);
}
// A FIRST HEADING THAT ONLY REPEATS HER QUESTION IS DROPPED (seat conversation-panel, round 4): her question already
// shows as the bubble above. "Repeats" means at least 70% of the heading's words are words of her question, ignoring
// small words; only the answer's first element, and only a heading.
const SMALL_WORDS = new Set(['a', 'an', 'the', 'my', 'your', 'our', 'for', 'with', 'to', 'of', 'and', 'on', 'in', 'me', 'you', 'we']);
const wordsOf = (t) => String(t || '').toLowerCase().split(new RegExp('[^a-z0-9]+')).filter((w) => w && !SMALL_WORDS.has(w));
function dropEchoHeading(slot) {
  const asked = slot.closest('.answer-turn')?.querySelector('.answer-asked')?.textContent;
  const first = slot.querySelector('.ans-lead-prose > .ans-h:first-child, .ans-h:first-child');
  if (!asked || !first || slot.querySelector('.ans-h') !== first) return;
  const q = new Set(wordsOf(asked)), h = wordsOf(first.textContent);
  if (h.length && h.filter((w) => q.has(w)).length / h.length >= 0.7) first.remove();
}
function drawAsk(slot, body) {
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

  // 3b. THE EMAILS IT RESTS ON, each opening on Mail (seat talk-to-the-tool). See emailsOf.
  const mails = emailsOf(body);
  if (mails.length) slot.appendChild(emailList(mails));

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
  if (!mount.children.length && !workChat) panelTitle(q);
  sec.hidden = false;
  openPanel();

  // THE CONVERSATION SURVIVES. Each question appends a turn and nothing clears
  // what came before. Until now every new question ran mount.innerHTML = "", so
  // asking a second thing destroyed the first answer and its records with it -
  // which is the one thing a person needs when checking a second answer against
  // a first. Navigation was never the problem: goto() only hides section.step and
  // this section is not one.
  const turn = el("div", "answer-turn");
  const asked = el("p", "answer-asked"); asked.textContent = q;
  const slot = el("div", "answer-slot");
  const wait = el("p", "answer-wait working"); wait.textContent = "Reading your records.";
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
    drawBox();   // the top box now says it continues this conversation
    speakAnswer(slot);   // read aloud when she switched it on (box.js); never for a reopened, kept answer
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

// THE BOX IS WIRED BY box.js (seat one-box, 2026-10-08): it decides find, ask or do and hands an
// ask to ask() here, or to mail.js on the Mail tab. SUPERSEDES wireAsk, which sent everything to ask().

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
  return "Stored in a shape this screen does not recognize.";
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
  if (!(v.people ?? []).some((p) => (p.changes ?? []).length)) {
    const n = el("p", "quiet"); n.textContent = "You have not kept anything back from anyone yet."; mount.appendChild(n);
  }
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
  hint.textContent = `To change something, tell the box at the top of the page, for example "${other ? other.name : "Sam"} shouldn't see pay figures". `
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

// -- SECURITY AND ADMIN (seat security-tab, Alex 2026-10-08; panel by seat security-panel, 2026-10-10) --
// Capabilities "Know who can see what, and what is more open than I meant" and "I decide who in my
// company sees what". Every part is read from a brain function that refuses anyone but the owner with
// a reason (audit_panel, refusal_watch, access_people, security_watch_extras). This screen decides
// nothing about access and computes no finding. Empty is said in words, never left blank; a part that
// cannot be read says so and why, and the other parts still draw.
// SUPERSEDED 2026-10-10 (Alex, on screen: "really not workable... I have to see WHERE they are"): the
// findings list drawn from audit_latest, which listed files one by one, is retired from this tab. The
// panel (gauges, openings by place, the grid, conflicts) is drawn by security.js. audit_latest still
// answers "how secure is my business?" in the box.

function secNote(mount, text, flagged) {
  const n = el("p", flagged ? "notice flagged" : "quiet"); n.textContent = text; mount.appendChild(n); return n;
}
function secRefused(mount, v, what) {
  secNote(mount, v?.note ?? `${what} could not be shown${v?.reason ? ` (${v.reason})` : ""}.`, true);
}
function secState(tone, text) {
  const s = el("p", `state ${tone}`); s.innerHTML = `<span class="dot"></span>`;
  s.appendChild(document.createTextNode(text)); return s;
}
function secLine(cls, text) { const p = el("p", cls); p.textContent = text; return p; }
async function secCall(fn, args) {
  const { data, error } = await sb.rpc(fn, args ?? {});
  if (error) throw error;
  return data;
}

// What is connected comes from the reading this page already holds (brain_shape), not a second count.
const CAN_TELL = {
  email: "Google tells the Tool who may open each mailbox, so each person sees only the mail their own Google account opens.",
  drives: "Google tells the Tool who may open each file, so each person sees only the files their own Google account opens.",
  calendar: "Google tells the Tool who may see each calendar.",
  contacts: "Google tells the Tool who may see each contact list.",
  systems: "Cannot tell the Tool who may see what, so only owners see it unless you decide otherwise.",
  loose: "Files loaded by hand carry no sharing of their own, so only owners see them unless you decide otherwise.",
};
function drawSecConnected() {
  const mount = $("#sec-connected"); if (!mount) return;
  mount.innerHTML = "";
  if (!shape) {
    secNote(mount, readingState === null ? "Reading what is connected."
      : "What is connected could not be read just now, so nothing here is a claim either way.");
    return;
  }
  const ul = el("ul", "attn");
  const off = [];
  for (const g of GROUPS) {
    const d = groupsFor().find((x) => x.key === g.key);
    if (!d || !d.connected) { off.push(g.key === "email" ? "Mail" : g.label); continue; }
    const li = el("li");
    li.appendChild(secLine("a-title", `${g.key === "email" ? "Mail" : g.label}: ${d.count} ${d.noun}`));
    li.appendChild(secState(g.key === "systems" || g.key === "loose" ? "tone-amber" : "tone-green", CAN_TELL[g.key] ?? ""));
    if (g.key === "systems" && (d.members ?? []).length) li.appendChild(secLine("a-detail", d.members.map((x) => x.name).join(", ")));
    ul.appendChild(li);
  }
  if (ul.childElementCount) mount.appendChild(ul);
  else secNote(mount, "Nothing is connected yet, so the Tool reads nothing and shows nothing to anyone.");
  if (off.length) secNote(mount, `Not connected: ${off.join(", ")}.`);
}

function drawSecWatch(v) {
  const mount = $("#sec-watch"); mount.innerHTML = "";
  if (!v?.ok) { secRefused(mount, v, "Refused attempts"); return; }
  const people = v.people ?? [];
  if (!people.length) { secNote(mount, "No one has been refused this week."); }
  else {
    const ul = el("ul", "attn");
    for (const p of people) {
      const li = el("li");
      li.appendChild(secLine("a-title", p.name));
      const kinds = (p.by_kind ?? []).map((k) => k.words ?? k.kind).filter(Boolean);
      li.appendChild(secLine("a-detail", `Refused ${countOf(p.today)} ${Number(p.today) === 1 ? "time" : "times"} today and ${countOf(p.week)} this week.`
        + (kinds.length ? ` On: ${kinds.join(", ")}.` : "")));
      if (p.alert) li.appendChild(secState("tone-red", `Alert: ${p.alert_why ?? "keeps trying"}.`));
      ul.appendChild(li);
    }
    mount.appendChild(ul);
  }
  secNote(mount, "Alerts show here and in the box when you open the Tool. Alerts by email are not built yet.");
}

function drawSecExtras(v) {
  const sends = $("#sec-sends"), door = $("#sec-door");
  sends.innerHTML = ""; door.innerHTML = "";
  if (!v?.ok) { secRefused(sends, v, "The send record"); secRefused(door, v, "The Tool's own checks"); return; }
  const s = v.sends ?? {};
  if (!Number(s.total)) secNote(sends, "Nothing has been sent from the Tool yet.");
  else {
    secNote(sends, `${countOf(s.total)} ${Number(s.total) === 1 ? "email" : "emails"} sent from the Tool so far. The latest:`);
    const ul = el("ul", "attn");
    for (const x of s.last ?? []) { const li = el("li"); li.appendChild(secLine("a-detail", `${fmtWindow(x.at)}: ${x.who}, from ${x.mailbox} (${x.status}).`)); ul.appendChild(li); }
    sends.appendChild(ul);
  }
  const d = v.door ?? {};
  if (!d.ran_at) { secNote(door, "The Tool's own checks have never run, so nothing here is known.", true); return; }
  if (d.stale) secNote(door, `The Tool's own checks have not run since ${fmtWindow(d.ran_at)}, so what follows may be out of date.`, true);
  const lines = d.lines ?? [];
  const failing = lines.filter((x) => !x.ok);
  if (failing.length) {
    const ul = el("ul", "attn");
    for (const l of failing) { const li = el("li"); li.appendChild(secState("tone-amber", l.text)); ul.appendChild(li); }
    door.appendChild(ul);
  }
  const det = el("details", "recs");
  const sum = el("summary", "recs-sum"); sum.textContent = `${countOf(d.passing)} passing, last checked ${fmtWindow(d.ran_at)}`; det.appendChild(sum);
  const pl = el("ul", "ans-list");
  for (const l of lines.filter((x) => x.ok)) { const li = el("li"); li.textContent = l.text; pl.appendChild(li); }
  det.appendChild(pl); door.appendChild(det);
}

function secFailed(id, what) {
  return (e) => {
    const m = $(id); if (!m) return;
    m.innerHTML = "";
    const msg = String(e?.message ?? e);
    secNote(m, msg.includes("Could not find the function")
      ? `${what}: this part is not switched on yet.`
      : `${what} could not be read, so nothing here is known: ${msg}`, true);
  };
}
function secBusy(id, text) { const m = $(id); if (m && !m.childElementCount) secNote(m, text); }

async function loadSecurity() {
  initPanel({ sb, zone, el, $, countOf });
  drawSecConnected();
  loadAccess();
  secBusy("#sec-watch", "Reading refused attempts.");
  secBusy("#sec-sends", "Reading the send record.");
  secBusy("#sec-door", "Reading the Tool's own checks.");
  loadPanel();
  secCall("refusal_watch", { p_tz: zone() }).then((v) => { setLive("refused", v); drawSecWatch(v); }).catch(secFailed("#sec-watch", "Refused attempts"));
  secCall("security_watch_extras", { p_tz: zone() }).then((v) => { setLive("door", v); drawSecExtras(v); }).catch((e) => {
    secFailed("#sec-sends", "The send record")(e); secFailed("#sec-door", "The Tool's own checks")(e);
  });
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
  if (location.hash === "#security" && $("#s-security")) { goto("s-security"); return; }
  // Nobody signed in: the introduction is the honest screen, and it claims nothing
  // about data because there is no identity to claim it about.
  if (mode === "unbound") { goto("s-intro"); return; }
  // The reading failed, so the state is unknown. Show the lens carrying its own
  // failure rather than a first-run screen, which would assert an empty brain on
  // the strength of a request that never came back.
  if (mode === "unknown") { goto("s-summary"); return; }
  const connected = (shape?.groups ?? []).reduce((n, g) => n + (g.count ?? 0), 0);
  if (!connected) { goto("s-intro"); return; }
  // THE TAB SHE USED LAST, in this browser; Mail the first time (seat conversation-panel, Alex 2026-10-12).
  // An owner-only tab remembered by someone who is not the owner falls back to Mail.
  let last = null;
  try { last = localStorage.getItem(TAB_KEY); } catch (_) { /* storage off: Mail */ }
  const t = TABS.find((x) => x.key === last && (!x.owner || shape?.viewer?.all_access));
  goTab(t ? t.key : 'email');
}

// THE BRAIN TAB SHOWS CONNECTING AND WHAT IS CONNECTED TOGETHER (Alex, 2026-10-02,
// seat tool-tabs). Either id shows both, so every existing call site still lands on
// the Brain tab unchanged. This is still the only router: a tab is a goto() call.
const BRAIN_PAIR = ['s-connect', 's-summary'];
let lensKey = null;
function goto(id, key) {
  if (id === 's-access') id = 's-security';   // who sees what moved to the Security tab (seat security-tab)
  const show = BRAIN_PAIR.includes(id) ? BRAIN_PAIR : [id];
  document.querySelectorAll("section.step").forEach((s) => { s.hidden = !show.includes(s.id); });
  window.scrollTo({ top: 0 });
  if (id === "s-connect" && !$("#connect-stage").children.length) stageTypes();
  if (id === "s-tests") loadTests();
  if (id === "s-security") loadSecurity();
  if (id === 's-lens') { lensKey = key ?? lensKey; drawLens(); }
  onMail = id === 's-lens' && lensKey === 'email';
  workPanel(id === 's-work');
  if (id === 's-money') { initMoney({ sb, el, $, countOf, zone }); loadMoney();
    // seat contractor-ledger 2026-10-12: where we stand with each contractor, drawn into #money-ledger (runway's mount).
    import("./ledger.js?v=2026-10-12-working").then((L) => { L.initLedger({ sb, el, $, countOf }); L.loadLedger(); }).catch((e) => { const m = $("#money-ledger"); if (m) m.textContent = "Where we stand with each contractor could not be loaded: " + String(e?.message ?? e); }); }
  if (id === 's-recognition') { initProfile({ sb, el, $, countOf }); loadProfile(); }
  if (id === 's-work') loadWork(); if (id === 's-chats') { initChats({ sb, el, $, zone, url: SUPABASE_URL, key: PUBLISHABLE_KEY }); loadChats(); }
  const tabNow = id === 's-lens' ? lensKey : id === 's-work' ? 'work' : id === 's-security' ? 'security' : id === 's-money' ? 'money' : id === 's-chats' ? 'chats' : 'brain';
  markTab(tabNow);
  document.body.dataset.tab = tabNow;
  // Remembered so the Tool opens where she was (seat conversation-panel); first-run screens are not tabs.
  if (!['s-intro', 's-kinds'].includes(id)) { try { localStorage.setItem(TAB_KEY, tabNow); } catch (_) { /* this page only */ } }
  drawBox();
}

// -- tabs (seat tool-tabs, 2026-10-02) --
// Alex's order and his words. Every tab shows from day one. A source tab shows what
// the Brain tab's own list shows for that source, drawn by the same drawMembers, or
// one line saying it is not connected and pointing to Brain. No lens features here:
// each tab is fleshed out later, one at a time.
// ORDER (seat conversation-panel, Alex 2026-10-12): the daily tabs first (Mail, Work, Money, Drives, Calendar,
// Contacts), then Brain, Chats, Security, Systems, Loose files. Owner-only tabs are shown once the reading says
// she is an owner (Security: seat security-tab, 2026-10-08; Money: seat runway, 2026-10-10).
const GROUP_TAB = (k, label) => ({ key: k, label: label ?? GROUPS.find((g) => g.key === k).label });
const TABS = [GROUP_TAB('email', 'Mail'), { key: 'work', label: 'Work' }, { key: 'money', label: 'Money', owner: true },
  GROUP_TAB('drives', 'Drives'), GROUP_TAB('calendar'), GROUP_TAB('contacts'),
  { key: 'brain', label: 'Brain' }, { key: 'chats', label: 'Chats' }, { key: 'security', label: 'Security', owner: true },
  GROUP_TAB('systems'), GROUP_TAB('loose')];
const TAB_KEY = 'tool.tab';
function goTab(key) {
  if (key === 'brain') goto('s-summary'); else if (key === 'work') goto('s-work');
  else if (key === 'security') goto('s-security'); else if (key === 'money') goto('s-money'); else if (key === 'chats') goto('s-chats'); else goto('s-lens', key);
}

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
    if (t.owner) b.hidden = !shape?.viewer?.all_access;
    b.addEventListener('click', () => { userMoved = true; goTab(t.key); });
    nav.appendChild(b);
  }
}

// TABS THAT KEEP THEIR OWN STATE (seat conversation-panel, round 4). Every lensKey branch of drawLens, checked:
//   email    keeps its own state (the open email, the inbox page, a find): a reading redraws only the mailbox column,
//            which is the part that comes from the reading. Until now every reading rebuilt the open email, reloading
//            its frame and losing its scroll.
//   contacts keeps its own state (the card she looked up): a reading draws nothing. Until now every reading cleared
//            the card and looked the person up again, so a slow lookup never stayed on screen.
//   drives, calendar, systems, loose: drawn from the reading itself; redrawn, with keepOpen putting back what she opened.
const OWN_STATE = { email: () => mailReading(), contacts: () => {} };

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
  // THE CONTACTS TAB (seat contacts, 2026-10-13): a lookup of anyone or any company the business has dealt with, from
  // every connected system and mail, drawn by contacts.js from the brain's contact_card. It does not wait for Google
  // Contacts to be connected: CATS, HubSpot and mail already hold the people.
  if (lensKey === 'contacts') {
    import('./contacts.js?v=2026-10-13-own-state').then((C) => C.drawContacts(body, { sb, el, $, countOf, ask, isOwner: () => !!shape?.viewer?.all_access }))
      .catch((e) => { const p = el('p', 'notice flagged'); p.textContent = 'The Contacts tab could not be loaded: ' + String(e?.message ?? e); body.appendChild(p); });
    return;
  }
  const data = groupsFor().find((x) => x.key === lensKey);
  if (lensKey === 'drives' && data?.connected) { drawDrives(body, data); return; }
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

// -- DRIVES AS FOLDERS (seat conversation-panel, Alex 2026-10-12; approved picture, board Drives) --
// One tile per drive she chose: the folder mark, its name, what kind of place it is, ONE status word with a short
// count, and its remedy if it has one. Everything on a tile comes from drive_state, the same reading as the Brain
// tab's lines; nothing is counted here. Older connections she did not choose fold behind one line. A list view
// (the Brain tab's own rows) is one click away and remembered in this browser.
// NOT BUILT, STATED: opening a drive to see its folders and each file's outcome. The brain keeps no folder names,
// and no names for files it did not read, so that view needs the drive reader to keep the names Google already
// gives it; set out for HQ in the seat report rather than drawn from guesses.
const DRIVE_KIND = { shared_drive: 'Shared drive', my_drive_folder: 'Folder in your Drive', account: 'Your Drive' };
const DRIVES_VIEW = 'tool.drives.view';
function drawDrives(body, data) {
  let view = 'tiles';
  try { view = localStorage.getItem(DRIVES_VIEW) || 'tiles'; } catch (_) { /* tiles */ }
  const members = data.members ?? [];
  const mine = members.map((m) => ({ m, s: driveStateFor(m.target) })).filter((x) => x.s);
  const older = members.filter((m) => !driveStateFor(m.target));
  const need = mine.filter((x) => (DRIVE_WORD[x.s.state] ?? [])[1] === 'orange').length;
  const busy = mine.filter((x) => x.s.state === 'filling').length;

  const top = el('div', 'drives-top');
  const count = el('p', 'tab-count');
  count.textContent = [`${mine.length} ${mine.length === 1 ? 'drive' : 'drives'}`, need ? `${need} need you` : '', busy ? `${busy} reading` : '']
    .filter(Boolean).join(' · ');
  const choose = el('button', 'go ghost'); choose.type = 'button'; choose.textContent = 'Choose what comes in';
  choose.addEventListener('click', () => stageDrivePicker(driveAccountKey()));
  const flip = el('div', 'drives-view'); flip.setAttribute('role', 'group'); flip.setAttribute('aria-label', 'Show drives as');
  for (const [v, label] of [['tiles', 'Folders'], ['list', 'List']]) {
    const b = el('button', 'drives-flip'); b.type = 'button'; b.textContent = label;
    b.setAttribute('aria-pressed', String(view === v));
    b.addEventListener('click', () => { try { localStorage.setItem(DRIVES_VIEW, v); } catch (_) { /* this page only */ } drawDrives(body, data); });
    flip.appendChild(b);
  }
  top.append(count, choose, flip);
  body.innerHTML = '';
  body.appendChild(top);

  if (view === 'list') { const list = el('div'); body.appendChild(list); drawMembers('drives', list); return; }

  const grid = el('ul', 'drives-grid');
  for (const { m, s } of mine) {
    const li = el('li', 'drive-tile' + ((DRIVE_WORD[s.state] ?? [])[1] === 'grey' ? ' is-grey' : ''));
    li.dataset.key = s.source_key;
    const head = el('div', 'drive-head');
    head.innerHTML = `<svg class="drive-mark" aria-hidden="true"><use href="#i-drive"/></svg>`;
    const names = el('div', 'drive-names');
    const n = el('p', 'drive-name'); n.textContent = s.label || m.name;
    const k = el('p', 'drive-kind'); k.textContent = DRIVE_KIND[s.kind] ?? 'Drive';
    names.append(n, k); head.appendChild(names);
    li.append(head, driveLine(s));
    grid.appendChild(li);
  }
  if (!mine.length) { const p = el('p', 'quiet'); p.textContent = 'No drive is chosen yet. Choose what comes in to start.'; body.appendChild(p); }
  body.appendChild(grid);

  if (older.length) {
    const d = el('details', 'drives-older'); d.dataset.key = 'drives-older';
    const sum = el('summary'); sum.textContent = `Show ${older.length} older ${older.length === 1 ? 'connection' : 'connections'} you did not choose`;
    const ul = el('ul', 'members');
    for (const m of older) {
      const li = el('li'); li.dataset.key = m.target ?? m.name;
      const p = el('p', 'drive-name'); p.textContent = m.name;
      const st = el('div', 'state tone-plain');
      st.innerHTML = `<span class="dot"></span>Not one of the drives you chose &mdash; an older record, kept until you decide about it`;
      li.append(p, badgeLine(st, ['Not chosen', 'grey']));
      ul.appendChild(li);
    }
    d.append(sum, ul);
    body.appendChild(d);
  }
}

// -- WORK (seat work-tab, 2026-10-06, Alex's rulings 2026-10-02 and 2026-10-06) --
// Every question asked in the Tool is kept as a chat, whichever tab it was asked from, because
// there is one Ask and it calls keepTurn() after each answer.
// THE ARRANGEMENT EVERY AI CHAT SHARES (Alex 2026-10-08, seat work-chat; refines his 2026-10-06
// ruling): "They all look the same because millions of people know it is the best way to work.
// Meet the customer where they are." The convention, in the Tool's own look: a sidebar that folds,
// with New chat, a search over her chats, Projects, Pinned, then her chats by day (Today,
// Yesterday, Previous 7 days, Previous 30 days, then by month, in HER time zone); each row has a
// small menu to rename, pin, move to a project or delete. The conversation in the middle at a
// readable width, and the input UNDER it. SUPERSEDES the 2026-10-08 one-box note that the box no
// longer moves: it is still the one box, at the top of every other tab, docked under the
// conversation here because that is where every chat puts it.
// ONE RENDERER: turns are drawn only by renderAsk, into the conversation panel, asked only by ask(),
// routed only by box.js. Work is the list (seat conversation-panel, 2026-10-12): opening a chat redraws
// its turns in the panel FROM WHAT WAS KEPT, on whatever tab she is on, without asking again; the next
// question continues that chat. A chat is titled from its first question (work_keep), or by its email.
// DELETE IS AN ARCHIVE (Alex 2026-10-01): work_discard retires the chat; it leaves her list and her
// search and stays in the brain. SEARCH reads chat titles and her own questions, never answers, so
// an answer withheld after her access narrowed cannot be found by its words (work_list, p_q).
// PRIVATE TO THE PERSON, ENFORCED IN THE BRAIN: every work_* function resolves the person from the
// sign-in and refuses anything else with a reason. Nothing here filters by person.
let workChat = null;      // the chat the Ask is continuing, or null for a new one
let workInto = null;      // a project a NEW chat goes into once its first turn is kept
let workView = null;      // the project shown in the middle, or null for the conversation
let workRead = null;      // the last work_list() reply
let workQ = '';           // what the sidebar search is looking for, or ''

function workSaid(text) { const s = $('#work-said'); if (s) s.textContent = text || ''; }

// THE CONVERSATION, FULL SIZE ON WORK (seat conversation-panel, item 15). On Work the one panel element moves into the
// middle of the page (#work-convo-slot) and becomes the conversation at reading width; leaving Work it goes back to the
// right edge, open if there is a conversation. One renderer: the same element, moved, never a copy.
let panelHome = null;
function workPanel(onWork) {
  const p = $('#panel'), slot = $('#work-convo-slot');
  if (!p || !slot) return;
  if (onWork && p.parentElement !== slot) {
    if (!panelHome) { panelHome = document.createComment('the conversation panel lives here'); p.before(panelHome); }
    slot.appendChild(p);
    p.classList.add('in-work'); p.classList.remove('full'); p.style.transform = '';
    p.hidden = false; $('#panel-tab').hidden = true;
    delete document.body.dataset.panel;
    // On a phone, arriving with nothing open shows the list; with a conversation open, the conversation.
    const has = !!$('#answer-in').children.length || !!$('#dock-turns').children.length;
    $('#s-work')?.classList.toggle('list-open', !has);
    drawBox();
  } else if (!onWork && p.parentElement === slot) {
    panelHome.after(p);
    p.classList.remove('in-work');
    p.hidden = true;
    closeWide();
    const has = !!$('#answer-in').children.length || !!$('#dock-turns').children.length;
    // On a phone the sheet would cover the tab she just chose: leave it on the edge, one tap away.
    if (has) { openPanel(); if (window.innerWidth <= 720) putAway(); } else drawBox();
  }
}

// WIDE VIEW BESIDE THE CONVERSATION (seat conversation-panel, item 15): a table or chart from an answer, or a PDF made
// from it, shown wide on the right of Work. Asked for from another tab, it opens Work first. Closed, the conversation
// takes the width. What it shows is a copy of what is already drawn in the answer, never a new reading.
function showWide(title, node) {
  if ($('#s-work')?.hidden) { userMoved = true; goTab('work'); }
  const v = $('#work-view'), body = $('#work-view-body');
  if (!v || !body) return;
  body.innerHTML = '';
  body.appendChild(node);
  $('#work-view-title').textContent = title || 'From the answer';
  v.hidden = false;
  $('#s-work').classList.add('viewing');
}
function closeWide() {
  const v = $('#work-view');
  if (!v || v.hidden) return;
  const f = v.querySelector('iframe[data-blob]');
  if (f) { try { URL.revokeObjectURL(f.dataset.blob); } catch (_) { /* gone already */ } }
  v.hidden = true; $('#work-view-body').innerHTML = '';
  $('#s-work')?.classList.remove('viewing');
}
// "Open wide" under every table and chart in an answer.
function wideButtons(slot) {
  const asked = slot.closest('.answer-turn')?.querySelector('.answer-asked')?.textContent || '';
  for (const box of slot.querySelectorAll('.ans-table-wrap, .out-chart')) {
    if (box.nextElementSibling?.classList.contains('wide-open')) continue;
    const b = el('button', 'wide-open'); b.type = 'button'; b.textContent = 'Open wide';
    b.addEventListener('click', () => showWide(asked, box.cloneNode(true)));
    box.after(b);
  }
}

// On Mail an open email keeps its own conversation in the reading column (mail.js, seat email-workspace,
// Alex 2026-10-07); everything else she asks there goes to the panel. Set by goto().
// (workDock and mailDock, which moved or parked the conversation per tab, retired 2026-10-12 by seat
// conversation-panel: the panel is the one place the conversation is shown, on every tab.)
let onMail = false;

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

function newChat(projectId) {
  workChat = null; lastAsked = ''; workInto = projectId ?? null;
  const mount = $('#answer-in'); if (mount) mount.innerHTML = '';
  $('#dock-turns').innerHTML = '';
  $('#s-answer').hidden = true;
  panelScroll = 0;
  const p = workInto && workRead?.projects.find((x) => x.id === workInto);
  panelTitle(p ? `New conversation in ${p.name}` : '');
  openPanel(); markOpen(); closeWide(); $('#s-work')?.classList.remove('list-open');
  drawBox();
  $('#panel-input')?.focus();
}

async function openChat(id) {
  workSaid('Opening.'); $('#work-said').classList.add('working');
  const { data, error } = await sb.rpc('work_open', { p_chat: id });
  $('#work-said').classList.remove('working');
  if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'That chat could not be opened.'); return; }
  workSaid('');
  const mount = $('#answer-in'); mount.innerHTML = '';
  $('#dock-turns').innerHTML = '';
  $('#s-answer').hidden = false;
  panelTitle(data.chat.title); openPanel();
  closeWide(); $('#s-work')?.classList.remove('list-open');
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
  drawBox();
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

// One chat in the sidebar: its title opens it; the small menu renames, pins, moves or deletes it.
function chatRow(c, projects) {
  const li = el('li', 'work-chat');
  const b = el('button', 'work-open'); b.type = 'button'; b.dataset.chat = c.id; b.textContent = c.title;
  b.title = c.title;
  b.addEventListener('click', () => openChat(c.id));
  const more = el('button', 'work-more'); more.type = 'button'; more.textContent = '···';
  more.setAttribute('aria-label', `More for ${c.title}`); more.setAttribute('aria-haspopup', 'menu');
  more.addEventListener('click', (e) => { e.stopPropagation(); chatMenu(li, c, projects); });
  li.append(b, more);
  return li;
}

async function workSet(id, args) {
  const { data, error } = await sb.rpc('work_set', Object.assign({ p_chat: id }, args));
  if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'Not changed, and no reason was given.'); return false; }
  return true;
}

function closeMenus() { document.querySelectorAll('#s-work .work-menu').forEach((m) => m.remove()); }

function chatMenu(li, c, projects) {
  const open = li.querySelector('.work-menu');
  closeMenus();
  if (open) return;
  const m = el('div', 'work-menu'); m.setAttribute('role', 'menu');
  const item = (label, fn) => {
    const i = el('button', 'work-item'); i.type = 'button'; i.setAttribute('role', 'menuitem'); i.textContent = label;
    i.addEventListener('click', async (e) => { e.stopPropagation(); closeMenus(); await fn(); });
    m.appendChild(i);
  };
  item('Rename', () => renameRow(li, c));
  item(c.pinned_at ? 'Unpin' : 'Pin', async () => { if (await workSet(c.id, { p_pinned: !c.pinned_at })) loadWork(); });
  for (const p of projects.filter((x) => x.id !== c.project_id)) {
    item(`Move to ${p.name}`, () => moveChat(c.id, p.id));
  }
  if (c.project_id) item('Take out of the project', () => moveChat(c.id, null));
  item('Delete', async () => {
    if (!window.confirm(`Delete "${c.title}"? It leaves your chats and is kept in the archive.`)) return;
    const { data, error } = await sb.rpc('work_discard', { p_chat: c.id });
    if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'Not deleted, and no reason was given.'); return; }
    if (workChat === c.id) newChat(null);
    loadWork();
  });
  li.appendChild(m);
  m.querySelector('button')?.focus();
}

async function moveChat(id, project) {
  const { data, error } = await sb.rpc('work_move', { p_chat: id, p_project: project });
  if (error || !data?.ok) { workSaid(error?.message ?? data?.note ?? 'Not moved, and no reason was given.'); return; }
  loadWork();
}

// Rename in place: the title becomes a field; Enter keeps the new name, Escape keeps the old one.
function renameRow(li, c) {
  const b = li.querySelector('.work-open'); if (!b) return;
  const f = el('input', 'work-rename'); f.type = 'text'; f.value = c.title; f.maxLength = 120;
  f.setAttribute('aria-label', 'New name for this chat');
  b.replaceWith(f); f.focus(); f.select();
  let done = false;
  const finish = async (keep) => {
    if (done) return; done = true;
    const t = f.value.trim();
    if (keep && t && t !== c.title) { if (await workSet(c.id, { p_title: t })) { loadWork(); return; } }
    f.replaceWith(b);
  };
  f.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
  f.addEventListener('blur', () => finish(true));
}

// Which day group a chat falls in, from when it last moved, counted in HER time zone.
function dayGroup(iso, now) {
  const z = zone();
  const key = (d) => { try { return d.toLocaleDateString('en-CA', { timeZone: z }); } catch (_) { return d.toISOString().slice(0, 10); } };
  const d = new Date(iso);
  const diff = Math.round((Date.parse(key(now)) - Date.parse(key(d))) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return 'Previous 7 days';
  if (diff <= 30) return 'Previous 30 days';
  try { return d.toLocaleDateString(undefined, { timeZone: z, month: 'long', year: 'numeric' }); } catch (_) { return key(d).slice(0, 7); }
}

function chatGroup(host, label, chats, projects) {
  if (!chats.length) return;
  const h = el('h3'); h.textContent = label;
  const ul = el('ul', 'work-chats');
  for (const c of chats) ul.appendChild(chatRow(c, projects));
  host.append(h, ul);
}

function openProject(id) {
  workView = id;
  const p = workRead?.projects.find((x) => x.id === id);
  const v = $('#work-project-view');
  if (!p) { workView = null; v.hidden = true; markOpen(); return; } v.hidden = false; v.innerHTML = '';
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
  const q = workQ;
  const { data, error } = await sb.rpc('work_list', q ? { p_q: q } : {});
  if (q !== workQ) return;   // she typed again while this was on its way; the newer reading wins
  if (error) { workSaid(`Your chats could not be read: ${error.message}`); return; }
  if (!data?.ok) { workSaid(data?.note ?? 'Your chats could not be read, and no reason was given.'); return; }
  workSaid('');
  if (!q) workRead = data;
  const projects = data.projects;
  const pl = $('#work-projects'); pl.innerHTML = '';
  for (const p of projects) {
    const li = el('li');
    const b = el('button', 'work-open'); b.type = 'button'; b.dataset.project = p.id;
    const n = (workRead?.chats ?? data.chats).filter((c) => c.project_id === p.id).length;
    b.textContent = p.name;
    const k = el('span', 'quiet work-count'); k.textContent = String(n);
    b.appendChild(k);
    b.addEventListener('click', () => openProject(p.id));
    li.appendChild(b); pl.appendChild(li);
  }
  if (!projects.length) { const e = el('li', 'quiet'); e.textContent = 'None yet.'; pl.appendChild(e); }
  const pin = $('#work-pinned'), rl = $('#work-recents');
  pin.innerHTML = ''; rl.innerHTML = '';
  if (q) {
    // A search shows every chat it found, in projects or not, and says what it looked through.
    chatGroup(rl, 'Found', data.chats, projects);
    const note = el('p', 'quiet work-searched');
    note.textContent = data.chats.length
      ? 'Searched your chat names and your own questions. Answers are not searched.'
      : `No chat name or question of yours contains "${q}". Answers are not searched.`;
    rl.appendChild(note);
  } else {
    chatGroup(pin, 'Pinned', data.chats.filter((c) => c.pinned_at), projects);
    const loose = data.chats.filter((c) => !c.project_id && !c.pinned_at);
    const now = new Date(), groups = new Map();
    for (const c of loose) {
      const g = dayGroup(c.updated_at, now);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(c);
    }
    for (const [label, chats] of groups) chatGroup(rl, label, chats, projects);
    if (!data.chats.length) { const e = el('p', 'quiet'); e.textContent = 'Nothing asked yet. Anything you ask, on any tab, is kept here.'; rl.appendChild(e); }
  }
  if (workView && !q) openProject(workView); else markOpen();
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
  let wait = null;
  $('#work-search')?.addEventListener('input', (e) => {
    clearTimeout(wait);
    wait = setTimeout(() => { workQ = e.target.value.trim(); loadWork(); }, 250);
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.work-menu')) closeMenus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenus(); });
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
  scopeChanged: () => drawBox(),
});
// THE ONE BOX (seat one-box, 2026-10-08): what it needs from this page, and nothing it does itself.
initBox({
  el, ask, hear: hearSpoken,
  // seat refusal-wire, 2026-10-08: who is viewing, and the owner's refused-attempts reader (the brain refuses anyone else).
  viewer: () => shape?.viewer ?? null,
  refusalWatch: async () => {
    const { data, error } = await sb.rpc('refusal_watch', { p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
    if (error) throw error;
    return data;
  },
  onMail: () => onMail,
  mailScope, mailHints, findMail, clearFind, doFromBox, askFromMailBar,
  showMail: () => { userMoved = true; if (!onMail) goto('s-lens', 'email'); },
  mailboxAddresses: () => [...mailboxes.values()].map((m) => m.address),
  readingMailboxKeys: () => [...mailboxes.values()].filter((m) => m.state === 'reading').map((m) => m.source_key),
  // While the panel shows a conversation, the top box continues it; New in the panel starts a fresh one.
  continuing: () => panelOpen() && !!$('#answer-in').children.length,
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
// WHAT SHE OPENED STAYS OPEN (seat conversation-panel, round 2; Alex 2026-10-12: on Systems a row "shows me
// briefly, and then it disappears again"; on Drives the older connections "just disappear again quickly"). Since
// the walks write their progress every two minutes, the bell rang constantly and every redraw rebuilt rows shut.
// Now: (1) a reading that draws nothing new draws nothing (readingPrint); (2) at most one redraw every 4 seconds,
// and none while she is typing in a form on the page; (3) every redraw goes through keepOpen, which puts back
// what she had open (folds, opened status sentences, an opened row, scroll), keyed by the row it sits in.
const REDRAW_GAP = 4000;
let lastRedraw = 0;
async function refreshBrain() {
  const wait = REDRAW_GAP - (Date.now() - lastRedraw);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const a = document.activeElement;
  if (a && a.matches('input, textarea, select') && a.closest('#main')) { setTimeout(refreshBrain, REDRAW_GAP); return; }
  await keepOpen($('#main'), async () => {
    const drew = await readBrain({ onlyIfChanged: true });
    if (!drew) return;
    document.querySelectorAll('#tree [aria-expanded="true"]').forEach((row) => {
      const key = row.id.replace(/^row-/, "");
      const body = $("#body-" + key);
      if (body && !body.hidden) drawMembers(key, body);
    });
  });
  lastRedraw = Date.now();
}

// One helper for every redraw: note what is open under root, redraw, put it back. A thing is known by the nearest
// row or section around it (data-key, else id) and its place among its kind there, never by its words.
const OPENABLE = 'details, .s-badge, .member';
function openKey(node) {
  const host = node.parentElement?.closest('[data-key], [id]');
  if (!host) return null;
  const kind = node.matches('details') ? 'details' : node.matches('.s-badge') ? '.s-badge' : '.member';
  const same = [...host.querySelectorAll(kind)].filter((n) => n.parentElement?.closest('[data-key], [id]') === host);
  return (host.dataset.key ?? host.id) + '|' + kind + '|' + same.indexOf(node);
}
async function keepOpen(root, redraw) {
  if (!root) return redraw();
  const open = new Set();
  root.querySelectorAll('details[open], .s-badge[aria-expanded="true"], .member[aria-expanded="true"]')
    .forEach((n) => { const k = openKey(n); if (k) open.add(k); });
  const scrolled = [];
  root.querySelectorAll('[id], [data-key], .mailx-side, .mailx-list, .mailx-read').forEach((n) => {
    if (n.scrollTop > 0) scrolled.push([n.id || n.dataset.key || n.className, n.scrollTop]);
  });
  const y = window.scrollY;
  await redraw();
  root.querySelectorAll(OPENABLE).forEach((n) => {
    const k = openKey(n);
    if (!k || !open.has(k)) return;
    if (n.matches('details')) n.open = true;
    else if (n.getAttribute('aria-expanded') !== 'true') n.click();
  });
  for (const [k, top] of scrolled) {
    const n = root.querySelector('#' + CSS.escape(k)) ?? root.querySelector(`[data-key="${CSS.escape(k)}"]`)
      ?? root.getElementsByClassName(String(k).split(' ')[0])[0];
    if (n) n.scrollTop = top;
  }
  window.scrollTo({ top: y });
}

sb.auth.getSession().then(({ data }) => {
  const jwt = data?.session?.access_token;
  if (jwt) onBrainChange(sb, jwt, refreshBrain, { label: "brain" });
});

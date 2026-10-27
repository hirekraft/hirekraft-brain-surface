// THE SUB-TAB ROW (seat people-and-access, 2026-10-27, decision 1029: "tabs within tabs").
// ONE shared part of SHOW. Any tab that does several jobs uses it; no tab builds its own.
//
// HOW A TAB USES IT
//   1. In fill/index.html, give the tab's section one empty <nav data-subtabs="<tab key>"></nav> right under
//      its heading, and wrap each job in an element with data-sub="<sub key>" and data-label="<words>".
//      The order of the data-sub elements is the order of the row.
//   2. When the tab is shown, call showSubtabs(sectionElement, "<tab key>", personKey). That is all.
//      personKey is who is signed in (the Tool passes the signed-in email), so the last chosen sub-tab
//      is remembered per person, in this browser.
//   3. A link to a sub-tab is "#<tab key>/<sub key>" (subLink below), for example #security/audit.
//      The box, What's new and the To test list open a sub-tab directly with that link; lens.js sends
//      any such link to the right tab, and this part picks the sub-tab.
//   4. Something inside one sub-tab that points into another calls reveal("#element-id"): the sub-tab
//      holding that element is chosen first, then the page scrolls to it.
// On a phone the row is one line that scrolls sideways; every target is at least 44 px (skin.css,
// "A PHONE IS A FIRST-CLASS SIZE"). Nothing here reads the brain.

const KEY = (tab, person) => "tool.sub." + tab + "." + String(person || "anyone").toLowerCase();

export const subLink = (tab, sub) => "#" + tab + "/" + sub;

function fromHash(tab) {
  const h = String(location.hash || "").slice(1).split("?")[0];
  const [t, s] = h.split("/");
  return t === tab && s ? s : null;
}

function choose(section, tab, sub, person, write) {
  const panels = [...section.querySelectorAll("[data-sub][data-label]")];
  if (!panels.some((p) => p.dataset.sub === sub)) sub = panels[0]?.dataset.sub;
  for (const p of panels) p.hidden = p.dataset.sub !== sub;
  for (const b of section.querySelectorAll("[data-subtabs] [role=tab]")) {
    const on = b.dataset.for === sub;
    b.setAttribute("aria-selected", on ? "true" : "false");
    b.tabIndex = on ? 0 : -1;
    if (on && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  try { localStorage.setItem(KEY(tab, person), sub); } catch (_) { /* storage off: not remembered */ }
  if (write) { try { history.replaceState(null, "", subLink(tab, sub)); } catch (_) { /* link not updated */ } }
  section.dispatchEvent(new CustomEvent("subtab", { detail: { tab, sub } }));
  return sub;
}

export function showSubtabs(section, tab, person) {
  if (!section) return null;
  const nav = section.querySelector("[data-subtabs]");
  const panels = [...section.querySelectorAll("[data-sub][data-label]")];
  if (!nav || !panels.length) return null;
  if (!nav.childElementCount) {
    nav.className = "subtabs";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Parts of this tab");
    for (const p of panels) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "subtab"; b.setAttribute("role", "tab");
      b.dataset.for = p.dataset.sub; b.textContent = p.dataset.label || p.dataset.sub;
      if (!p.id) p.id = "sub-" + tab + "-" + p.dataset.sub;
      b.setAttribute("aria-controls", p.id);
      b.addEventListener("click", () => choose(section, tab, p.dataset.sub, nav.dataset.person, true));
      nav.appendChild(b);
    }
    nav.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const bs = [...nav.querySelectorAll("[role=tab]")];
      const i = bs.findIndex((x) => x.getAttribute("aria-selected") === "true");
      const n = bs[(i + (e.key === "ArrowRight" ? 1 : bs.length - 1)) % bs.length];
      n.focus(); n.click();
    });
  }
  nav.dataset.person = person || "";
  let want = fromHash(tab);
  if (!want) { try { want = localStorage.getItem(KEY(tab, person)); } catch (_) { want = null; } }
  return choose(section, tab, want, person, false);
}

// A link inside the page changed (#security/checks while already on Security): pick that sub-tab.
export function followHash() {
  const h = String(location.hash || "").slice(1).split("?")[0];
  const [t, s] = h.split("/");
  if (!t || !s) return false;
  const nav = document.querySelector('[data-subtabs="' + t + '"]');
  const section = nav?.closest("section");
  if (!section || section.hidden) return false;
  choose(section, t, s, nav.dataset.person, false);
  return true;
}

// Point at something in another sub-tab of the same tab: choose its sub-tab, then scroll to it.
export function reveal(selector) {
  const target = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!target) return;
  const panel = target.closest("[data-sub][data-label]");
  const section = panel?.closest("section");
  const nav = section?.querySelector("[data-subtabs]");
  if (panel && panel.hidden && nav) choose(section, nav.dataset.subtabs, panel.dataset.sub, nav.dataset.person, true);
  target.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

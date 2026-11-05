// fill/brain.js - WHICH BUSINESS'S BRAIN THIS SCREEN OPENS (seat any-brain round 2, 2026-11-05, decision 1097 shape A).
//
// THE ONE PLACE the screen learns its brain: the address, the public key and the business's name. Every tab already
// takes url and key from lens.js; lens.js, the sign-in page and the connect page take them from here. No other file
// names a brain (the front door in fill/index.html reads the same remembered choice by the same storage name; the
// unsubscribe page reads the brain from its link, for links that cannot carry a sign-in).
//
// HOW IT IS KNOWN. At sign-in, Verrandi's address book (studio-core brain-door) finds her brain from her work email,
// that brain checks her code, and the door hands back the brain with the session: this browser remembers it under
// verrandi.brain. A browser signed in before the one door holds only the brain's own stored sign-in, whose name
// carries the brain's ref (sb-<ref>-auth-token): the door is asked once for that ref's key and name, and it is
// remembered. Being remembered lets nobody in: the brain still checks every call against her token.
//
// NO BRAIN, NO SCREEN. With nothing remembered and no stored sign-in she is sent to sign in. With a remembered or
// stored brain the directory no longer opens, the screen draws the reason and a way to sign in again, before any tab.
// No regex literals and no backslashes (STANDING-CLAUSES).

export const DOOR = "https://yzsudnjwqplaaiwxbusi.supabase.co/functions/v1/brain-door";
export const REMEMBER = "verrandi.brain";
const REF = new RegExp("^[a-z]{20}$");
const STORED = new RegExp("^sb-([a-z]{20})-auth-token$");

function valid(b) {
  return !!(b && typeof b === "object" && REF.test(String(b.ref || "")) && b.url === "https://" + b.ref + ".supabase.co"
    && typeof b.key === "string" && b.key.startsWith("sb_publishable_") && typeof b.name === "string");
}

export function remembered() {
  try { const b = JSON.parse(localStorage.getItem(REMEMBER) || "null"); return valid(b) ? b : null; } catch (e) { return null; }
}

export function remember(b) {
  if (!valid(b)) return false;
  try { localStorage.setItem(REMEMBER, JSON.stringify({ customer: b.customer, name: b.name, ref: b.ref, url: b.url, key: b.key })); return true; }
  catch (e) { return false; }
}

export function forget() { try { localStorage.removeItem(REMEMBER); } catch (e) { /* nothing to forget */ } }

// The brains this browser holds a sign-in for (the brain's own client stores it under sb-<ref>-auth-token).
export function storedRefs() {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const m = STORED.exec(localStorage.key(i) || ""); if (m) out.push(m[1]); } } catch (e) { /* storage blocked */ }
  return out;
}

export async function askDoor(body) {
  try {
    const r = await fetch(DOOR, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    return j || { ok: false, reason: "down", words: "The sign-in door could not be reached just now. Try again in a minute." };
  } catch (e) {
    return { ok: false, reason: "down", words: "The sign-in door could not be reached just now. Try again in a minute." };
  }
}

// { ok:true, brain } | { ok:false, reason:'none' } (nothing here: go and sign in) | { ok:false, reason, words } (drawn).
export async function resolveBrain() {
  const b = remembered();
  if (b) return { ok: true, brain: b };
  const refs = storedRefs();
  if (!refs.length) return { ok: false, reason: "none" };
  if (refs.length > 1) return { ok: false, reason: "many", words: "This browser is signed in to more than one Tool. Sign in again with your work email to choose." };
  const r = await askDoor({ action: "brain", ref: refs[0] });
  if (r.ok && remember(r.brain)) return { ok: true, brain: remembered() };
  return { ok: false, reason: r.reason || "no_brain", words: r.words || "This sign-in does not point to an open Tool. Sign in again with your work email." };
}

// The refusal, drawn in place of the whole screen, before any tab. Plain words and one way on.
export function drawNoBrain(words, signinHref) {
  document.querySelectorAll(".shell").forEach((n) => { n.hidden = true; });   // the masthead and the main area alike
  const box = document.createElement("main");
  box.className = "no-brain";
  box.setAttribute("role", "alert");
  const h = document.createElement("h1"); h.textContent = "No Tool to open";
  const p = document.createElement("p"); p.textContent = words;
  const a = document.createElement("a"); a.href = signinHref; a.className = "go"; a.textContent = "Sign in again";
  box.append(h, p, a);
  document.body.appendChild(box);
}

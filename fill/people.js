// SECURITY, PEOPLE AND ACCESS (seat people-and-access, 2026-10-27, decision 1028). Owner only.
// Who is in, what each person sees in one line, what they added themselves, what the owner opened to
// them, invite by email, and the systems that show everything to whoever connects them.
// Every fact is read from the brain (people_access, at the one door: identity_read_grants); this screen
// decides nothing about access. Every change is first asked of the function that makes it with confirm
// false, which writes nothing; one press confirms. Refused is said in words, never shown as empty.
// SUPERSEDES the "your own rules for who sees what" list (lens.js loadAccess/drawAccess, seat who-sees-what
// 2026-10-06), which sat folded at the bottom of the tab: its people list, its Undo and its "Exactly what,
// and why" now live here, in one list.

let c = null;          // { sb, el, $, countOf, personDetail, changeCard, signinUrl }
let read = null;

export function initPeople(ctx) { c = ctx; }

const say = (mount, text, cls) => { const p = c.el("p", cls ?? "quiet"); p.textContent = text; mount.appendChild(p); return p; };
const button = (label, ghost) => { const b = c.el("button", ghost ? "go ghost" : "go"); b.type = "button"; b.textContent = label; return b; };
async function rpc(fn, args) { const { data, error } = await c.sb.rpc(fn, args ?? {}); if (error) throw error; return data; }

// One change, previewed then confirmed. call(confirm) returns the brain's { ok, words, note }.
function card(mount, call, after) {
  mount.innerHTML = "";
  const box = c.el("div", "notice access-card");
  const said = c.el("p"); said.textContent = "Working out what this would change.";
  const acts = c.el("div", "actions");
  box.append(said, acts); mount.appendChild(box);
  (async () => {
    let v;
    try { v = await call(false); } catch (e) { said.textContent = "What this would change could not be worked out, so nothing is offered. " + (e?.message ?? ""); return; }
    if (!v?.ok) { said.textContent = v?.note ?? "This cannot be changed, and no reason was given."; return; }
    said.textContent = v.words;
    const yes = button("Confirm"), no = button("Leave it as it is", true);
    acts.append(yes, no);
    no.addEventListener("click", () => { acts.innerHTML = ""; said.textContent = "Nothing was changed."; });
    yes.addEventListener("click", async () => {
      yes.disabled = no.disabled = true;
      let d;
      try { d = await call(true); } catch (e) { yes.disabled = no.disabled = false; said.textContent = "Not changed. " + (e?.message ?? ""); return; }
      acts.innerHTML = "";
      if (!d?.ok) { said.textContent = d?.note ?? "Not changed, and no reason was given."; return; }
      said.textContent = d.words;
      if (after) await after(d, said);
      keep(said.textContent);   // the sentence stays at the top of the list after it is read again
      loadPeople();
    });
  })();
}

// What the last change did, kept above the list so reading the list again does not wipe it.
function keep(text) { const k = c?.$("#people-said"); if (k) { k.textContent = text; k.hidden = !text; } }

export async function loadPeople() {
  const outer = c?.$("#people"); if (!outer) return;
  let mount = c.$("#people-body");
  if (!mount) {
    const k = c.el("p", "notice people-said"); k.id = "people-said"; k.hidden = true; k.setAttribute("aria-live", "polite");
    mount = c.el("div"); mount.id = "people-body";
    outer.append(k, mount);
  }
  if (!read) say(mount, "Reading who is in.");
  try { read = await rpc("people_access"); }
  catch (e) {
    mount.innerHTML = "";
    const msg = String(e?.message ?? e);
    say(mount, msg.includes("Could not find the function") ? "Who is in: this part is not switched on yet."
      : "Who is in could not be read, so nothing here is known. " + msg, "notice flagged");
    return;
  }
  draw(mount, read);
}

function draw(mount, v) {
  mount.innerHTML = "";
  if (!v?.ok) { say(mount, v?.note ?? "Not shown, and no reason was given.", "notice"); return; }
  const people = v.people ?? [];
  const others = people.filter((p) => !p.is_owner);

  const h = c.el("h3"); h.textContent = "Who is in"; mount.appendChild(h);
  say(mount, "Everyone who can sign in to the Tool, or has been invited. Mail, drives, calendars and contacts follow Google: each person sees what their own Google account opens, with nothing to set up.");
  const ul = c.el("ul", "attn people");
  for (const p of people) ul.appendChild(personRow(p, v));
  mount.appendChild(ul);
  if (Number(v.not_signing_in) > 0)
    say(mount, c.countOf(v.not_signing_in) + " more people appear in your records but cannot sign in, so they see nothing.");

  mount.appendChild(inviteForm());
  mount.appendChild(allAccess(v, others));
}

function personRow(p, v) {
  const li = c.el("li", "person");
  li.dataset.person = p.id;
  const t = c.el("p", "a-title");
  t.textContent = p.name + (p.is_you ? " (you)" : "") + (p.email && p.email !== p.name ? " · " + p.email : "");
  const st = c.el("span", "chip " + (p.state === "signed_in" ? "chip-on" : "chip-wait"));
  st.textContent = p.is_owner ? "Owner" : p.state === "signed_in" ? "Signed in" : "Invited, not signed in yet";
  t.append(" ", st);
  li.appendChild(t);
  say(li, p.is_owner ? "Sees everything, as the owner." : p.sees_line ? "Sees " + p.sees_line + "." : "Sees nothing yet: none of the connected sources opens anything to this address.", "a-detail");

  const list = (head, items, label, act) => {
    if (!items?.length) return;
    say(li, head, "a-detail sub-head");
    for (const it of items) {
      const row = c.el("p", "a-detail access-change"); row.textContent = it.words + " ";
      const b = button(label, true); const slot = c.el("div");
      b.addEventListener("click", () => act(it, slot));
      row.appendChild(b); li.append(row, slot);
    }
  };
  const close = (it, slot) => card(slot, (confirm) => rpc("access_close", { p_rule: it.rule_id, p_confirm: confirm }));
  list("Added themselves:", p.added_self, "Remove", close);
  list("You opened:", p.your_grants, "Remove", close);
  list("Kept back by you:", p.kept_back, "Undo", (it, slot) => c.changeCard({ action: "restore", rule_id: it.rule_id }, slot));

  if (p.is_owner) return li;
  const acts = c.el("div", "actions"); const slot = c.el("div");
  const open = button("Open something to " + firstName(p), true);
  open.addEventListener("click", () => openPicker(p, v, slot));
  acts.appendChild(open);
  if (p.state === "signed_in" && c.personDetail) {
    const more = button("Exactly what, and why", true);
    more.addEventListener("click", () => { if (slot.childElementCount) { slot.innerHTML = ""; return; } c.personDetail({ id: p.id, name: p.name }, slot); });
    acts.appendChild(more);
  }
  if (p.state === "invited") {
    const again = button("Send the sign-in email again", true);
    again.addEventListener("click", () => sendSignIn(p.email, slot));
    const cancel = button("Cancel the invitation", true);
    cancel.addEventListener("click", async () => {
      slot.innerHTML = "";
      let d; try { d = await rpc("person_invite_cancel", { p_identity: p.id }); } catch (e) { say(slot, "Not cancelled. " + (e?.message ?? "")); return; }
      keep(d?.ok ? d.words : (d?.note ?? "Not cancelled.")); loadPeople();
    });
    acts.append(again, cancel);
  }
  li.append(acts, slot);
  return li;
}

const firstName = (p) => String(p.name || p.email || "them").split(/[ @]/)[0];

// What the owner can open to a person: a mailbox nobody is a delegate on (the owner's grant), or an
// all-access system. What Google already opens needs nothing from the owner and is not offered.
function openPicker(p, v, slot) {
  slot.innerHTML = "";
  const have = new Set((p.sees ?? []).map((s) => s.source));
  const box = c.el("div", "notice");
  say(box, "What Google already lets " + firstName(p) + " open, they see without anything from you. You can add:", "a-detail");
  const acts = c.el("div", "actions"); const out = c.el("div");
  let n = 0;
  for (const m of v.mailboxes_no_delegate ?? []) {
    const key = "gmail:" + m; if (have.has(key)) continue;
    const b = button(m + " (a mailbox, as your grant)", true);
    b.addEventListener("click", () => card(out, (confirm) => rpc("access_open", { p_identity: p.id, p_source_key: key, p_confirm: confirm })));
    acts.appendChild(b); n++;
  }
  for (const s of v.all_access ?? []) {
    if (!s.connected || have.has(s.source_key)) continue;
    const b = button(s.name + " (shows everything)", true);
    b.addEventListener("click", () => card(out, (confirm) => rpc("access_open", { p_identity: p.id, p_source_key: s.source_key, p_confirm: confirm })));
    acts.appendChild(b); n++;
  }
  if (!n) say(box, "Nothing else to add: everything connected either follows Google or is already open to " + firstName(p) + ".", "a-detail");
  box.append(acts, out); slot.appendChild(box);
}

function inviteForm() {
  const wrap = c.el("div", "invite");
  const h = c.el("h3"); h.textContent = "Invite someone"; wrap.appendChild(h);
  say(wrap, "Type their work email. They get an ordinary sign-in email, and on first sign-in they see what their own accounts open. You see what that is before anything is sent.");
  const row = c.el("div", "invite-row");
  const email = c.el("input"); email.type = "email"; email.autocomplete = "off"; email.placeholder = "Their email address"; email.setAttribute("aria-label", "Their email address");
  const name = c.el("input"); name.type = "text"; name.autocomplete = "off"; name.placeholder = "Their name (optional)"; name.setAttribute("aria-label", "Their name");
  const go = button("Invite");
  row.append(email, name, go); wrap.appendChild(row);
  const out = c.el("div"); wrap.appendChild(out);
  const start = () => {
    const e = email.value.trim(); if (!e) { out.innerHTML = ""; say(out, "Type their email address first."); return; }
    card(out, (confirm) => rpc("person_invite", { p_email: e, p_name: name.value.trim() || null, p_confirm: confirm }),
      async (d, said) => { email.value = ""; name.value = ""; await sendSignIn(d.email, out, said); });
  };
  go.addEventListener("click", start);
  email.addEventListener("keydown", (e) => { if (e.key === "Enter") start(); });
  return wrap;
}

// The ordinary sign-in email, the same one anyone gets on the sign-in page. Nothing else is sent.
async function sendSignIn(addr, mount, said) {
  const line = said ?? say(mount, "");
  line.textContent = "Sending the sign-in email to " + addr + ".";
  let error = null;
  try { ({ error } = await c.sb.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true, emailRedirectTo: c.signinUrl } })); }
  catch (e) { error = e; }
  line.textContent = error
    ? addr + " is invited, but the sign-in email could not be sent just now. They can open the sign-in page and type their address to get it."
    : addr + " is invited. They got an ordinary sign-in email; they type the code or press the link, and see what their own accounts open.";
}

function allAccess(v, others) {
  const wrap = c.el("div", "all-access");
  const h = c.el("h3"); h.textContent = "Systems that show everything to whoever connects them"; wrap.appendChild(h);
  say(wrap, "Some systems connect with one company login that sees everything, so the Tool cannot tell people apart there. Only you see them here unless you open one to someone. Everyone else keeps using the app with their own login.");
  const ul = c.el("ul", "attn");
  for (const s of v.all_access ?? []) {
    const li = c.el("li");
    const t = c.el("p", "a-title"); t.textContent = s.name + (s.connected ? "" : " (not connected)"); li.appendChild(t);
    const who = ["you"].concat((s.open_to ?? []).map((o) => o.name));
    say(li, "Shows " + s.exposes + ". Who sees it here: " + who.join(", ") + ".", "a-detail");
    for (const o of s.open_to ?? []) {
      const row = c.el("p", "a-detail access-change"); row.textContent = "Open to " + o.name + " ";
      const b = button("Remove", true); const slot = c.el("div");
      b.addEventListener("click", () => card(slot, (confirm) => rpc("access_close", { p_rule: o.rule_id, p_confirm: confirm })));
      row.appendChild(b); li.append(row, slot);
    }
    const acts = c.el("div", "actions"); const slot = c.el("div");
    if (s.connected) for (const p of others) {
      if ((s.open_to ?? []).some((o) => o.identity_id === p.id)) continue;
      const b = button("Open to " + firstName(p), true);
      b.addEventListener("click", () => card(slot, (confirm) => rpc("access_open", { p_identity: p.id, p_source_key: s.source_key, p_confirm: confirm })));
      acts.appendChild(b);
    }
    const blk = button(s.block_others ? "Let others connect it too" : "Block others from connecting it", true);
    blk.addEventListener("click", async () => {
      slot.innerHTML = "";
      let d; try { d = await rpc("all_access_block", { p_source_type: s.source_type, p_block: !s.block_others }); } catch (e) { say(slot, "Not changed. " + (e?.message ?? "")); return; }
      keep(d?.ok ? d.words : (d?.note ?? "Not changed.")); loadPeople();
    });
    acts.appendChild(blk);
    say(li, s.block_others ? "Only an owner can connect it." : "Others may connect it too; only you see it here unless you open it.", "a-detail");
    li.append(acts, slot); ul.appendChild(li);
  }
  wrap.appendChild(ul);
  return wrap;
}

// fill/head.js - THE HEADER, CLEANED UP (seat setup-clean, 2026-11-13; decision 1172 point 1; picture HsJKa9JnsgmDza5dtX3gUH part 1;
// Alex 18:51 PT: the header was "very bunched up": twelve things, two step counts, three money figures). Part of SHOW; no mechanism.
//
// THE HEADER NOW HOLDS FOUR THINGS: Verrandi and the company on the left (index.html, the wordmark); on the right Working (the one
// indicator, fill/working.js), Credit (lens.js, the AI meter's balance) and the person's initial. THE INITIAL OPENS: her name and
// role, Language, Look, Settings, Sign Out, and today's date with its time zone.
// NOTHING IS BUILT A SECOND TIME. The name, the language switch and the Look switch are the ones lens.js, words.js and looks.js
// already put in #whoami; this file moves #whoami into the menu it opens. The date block is index.html's #clock, moved the same way.
// Signed out, #whoami goes back into the header so its Sign in link is in plain sight (headOut).
// WHAT LEFT THE HEADER, AND WHERE IT IS ENFORCED (skin.css, block THE HEADER, CLEANED UP): the date block (in the menu); the Brain
// chip with its step count and the Getting started / Settings link (hidden while this header is on: the Brain is a tab once Ready,
// Settings is in the menu); "Being fixed" and "Healthy" (the health word shows only when it says Needs you: that one is hers);
// the setup money (ready.js no longer draws it; money is on the step that spends it).
// No regex literals and no backslashes (STANDING-CLAUSES).

let C = null, me = null, menu = null, open = false;

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }

// "Alex Nacimiento" gives AN; one word gives its first letter; nothing gives nothing.
export function initials(name) {
  const w = String(name || '').trim().split(' ').filter(Boolean);
  if (!w.length) return '';
  return (w[0].slice(0, 1) + (w.length > 1 ? w[w.length - 1].slice(0, 1) : '')).toUpperCase();
}

function toggle(to) {
  open = to === undefined ? !open : !!to;
  if (menu) menu.hidden = !open;
  if (me) me.setAttribute('aria-expanded', open ? 'true' : 'false');
}

// ctx: { name, role, settings(), signOut() }. Called each time the signed-in person is drawn (lens.js renderWho).
export function initHead(ctx) {
  C = ctx;
  const head = document.querySelector('.masthead'), who = document.querySelector('#whoami');
  if (!head || !who) return;
  if (!me) {
    me = el('button', 'hd-me'); me.type = 'button'; me.id = 'hd-me';
    me.setAttribute('aria-haspopup', 'true'); me.setAttribute('aria-controls', 'hd-menu'); me.setAttribute('aria-expanded', 'false');
    me.setAttribute('translate', 'no');
    menu = el('div', 'hd-menu'); menu.id = 'hd-menu'; menu.hidden = true;
    menu.setAttribute('role', 'region'); menu.setAttribute('aria-label', 'You, your language, your look and your settings');
    const acts = el('div', 'hd-acts');
    const set = el('button', 'hd-item', 'Settings'); set.type = 'button'; set.id = 'hd-settings';
    set.addEventListener('click', () => { toggle(false); if (C && C.settings) C.settings(); });
    const out = el('button', 'hd-item', 'Sign Out'); out.type = 'button'; out.id = 'hd-out';
    out.addEventListener('click', () => {
      out.disabled = true; out.textContent = 'Signing Out';
      const go = () => { location.href = '../login/'; };
      Promise.resolve().then(() => (C && C.signOut ? C.signOut() : null)).then(go, go);
    });
    acts.append(set, out);
    menu.appendChild(acts);
    head.append(me, menu);
    me.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => { if (open && !menu.contains(e.target) && !me.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') { toggle(false); me.focus(); } });
  }
  if (who.parentNode !== menu) menu.prepend(who);
  const clock = document.querySelector('#clock');
  if (clock && clock.parentNode !== menu) menu.appendChild(clock);
  const ini = initials(ctx && ctx.name);
  me.textContent = ini || '?';
  me.setAttribute('aria-label', (ctx && ctx.name ? String(ctx.name) : 'You') + ': open your name, language, look, settings and sign out');
  me.title = ctx && ctx.name ? String(ctx.name) + (ctx.role ? ', ' + String(ctx.role) : '') : '';
  document.body.classList.add('hd-on'); document.body.classList.remove('hd-out');
}

// Nobody is signed in, or the reading failed: what lens.js wrote into #whoami (Sign in, or why) is shown in the header itself.
export function headOut() {
  const head = document.querySelector('.masthead'), who = document.querySelector('#whoami');
  toggle(false);
  if (head && who && who.parentNode !== head) { if (me && me.parentNode === head) head.insertBefore(who, me); else head.appendChild(who); }
  document.body.classList.add('hd-out'); document.body.classList.remove('hd-on');
}

// fill/nav.js - MORE, THE RETIRED TABS, SETTINGS AND THE GEAR (seat tool-build-people, 2026-11-03; decisions 1065, 1067, 1069;
// design whole-tool-design-3, snapshot 2e2adc7e, build step 6). Part of SHOW, beside fill/frame.js (the places and the signs).
// Kept in its own file so the frame's blocks keep the one address every framed place imports (frame.js?v=...): a change here
// needs no change in the five places' files.
// No regex literals and no backslashes (STANDING-CLAUSES).
import { h, card, list, row, link, say, icon } from './frame.js?v=2026-11-03-tool-build-1b';

// MORE: what sits under More, in this order. Security first (the owner's; it is also the shield), then Brain (the owner's word for
// what the Tool knows, decision 1067 (2)), then Settings (also the gear beside the signs). lens.js builds its tabs from frame.js
// PLACES and this list, and from nothing else.
export const MORE = [
  { key: 'security', label: 'Security', owner: true },
  { key: 'brain', label: 'Brain' },
  { key: 'settings', label: 'Settings' },
];

// RETIRED TABS. Each old tab is no longer a tab; its page still opens from where it now lives, and an old remembered tab opens
// that place instead. ENFORCED: (1) lens.js builds its tabs from PLACES and MORE only, so none of these can be drawn as a tab;
// (2) the automatic frame check (studio-walkers scripts/frame-check/check.py, rule retired) fails if a key below is in PLACES or
// MORE, if MORE is not Security, Brain, Settings, or if lens.js builds its tabs from anything else, and its planted run puts
// Drives back under More to prove the rule fires; (3) lens.js opens RETIRED[key] when a browser remembers one as its last tab,
// and lights that place's tab while one of these pages is open.
// SUPERSEDED 2026-11-03: the older tabs under More (seat tool-build-1, until this step).
export const RETIRED = {
  drives: 'settings',     // Files and drives: a row in Settings
  systems: 'settings',    // Sign-ins and systems: a row in Settings; the sign-ins themselves are at the top of Settings
  loose: 'settings',      // Loose files: a row in Settings
  ai: 'settings',         // The AI and what it costs: a row in Settings, owner only
  calendar: 'today',      // decision 1067 (1): today and this week on Today, the full calendar one press away
  chats: 'work',          // decision 1067 (3): saved chats are Conversations, inside Ask
  thoughts: 'work',       // decision 1067 (3): Thinkrooms are Conversations, inside Ask
};

// SETTINGS, behind the gear and under More (design pass 1: "Settings keeps the rest"). Your sign-ins first, because that is
// where the check mark's Fix lands (ctx.signins draws them, from google.js), then one row for each page that used to be a tab.
// ctx: { go, owner, signins }.
export function drawSettings(el, ctx) {
  el.textContent = '';
  const root = h('div', 'vf vf-place'); root.dataset.place = 'settings';
  const top = card('Your sign-ins');
  top.el.appendChild(say('Sign in again here when the check mark asks you to.'));
  const mount = h('div', 'vf-signins'); top.el.appendChild(mount);
  root.appendChild(top.el);
  const c = card('Settings');
  const l = list();
  const rows = [
    ['Sign-ins and systems', 'Every system the Tool reads, and its state', 'systems'],
    ['Files and drives', 'Shared drives and folders, and tidying them', 'drives'],
    ['Loose files', 'Files added by hand', 'loose'],
    ...(ctx.owner ? [['The AI and what it costs', 'Which AI does each job, and its cost', 'ai']] : []),
  ];
  for (const [t, line, key] of rows) l.appendChild(row({ title: t, line, right: link('Open', () => ctx.go(key)) }));
  c.el.appendChild(l);
  root.appendChild(c.el);
  el.appendChild(root);
  if (ctx.signins) ctx.signins(mount);
  return root;
}

// THE GEAR beside the two signs: opens Settings. after: the signs' wrapper (#health).
export function wireGear(after, go) {
  if (!after) return null;
  const gear = h('button', 'vf-gear'); gear.type = 'button'; gear.appendChild(icon('gear'));
  gear.setAttribute('aria-label', 'Settings'); gear.title = 'Settings';
  gear.addEventListener('click', () => go('settings'));
  after.appendChild(gear);
  return gear;
}

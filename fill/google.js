// YOUR GOOGLE SIGN-IN (seat calendar-contacts, 2026-10-13; decision 993, HQ addendum 1b).
// One Google sign-in per person lets the Tool read that person's own calendar and address book
// (theirs alone) and keep files they add to a conversation in a folder of their own Drive.
// This part only SHOWS the caller's own state, from the brain's google_signin_state(), and hands
// the button to lens.js's one connect path (beginConnect); it starts nothing itself.
// Shown on the Systems tab and the Calendar tab. Owner and everyone else see the same thing:
// their own sign-in, never anyone else's. Every date goes through fill/dates.js.

import { fmtDate, zone } from './dates.js?v=2026-10-22-dates';
import { plainWords } from './plain.js?v=2026-10-27-mail-views';   // raw error words never reach her (seat day-one-fixes, morning-audit-2 fix 6)

const WORDS = {
  'calendar.readonly': 'your calendar',
  'contacts.readonly': 'your address book',
  'directory.readonly': 'the company directory',
  'drive.file': 'files you add to a conversation',
};
const ASKED = Object.keys(WORDS);

function list(xs) {
  return xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];
}

export async function drawGoogleSignin(box, { sb, el, connect }) {
  box.innerHTML = '';
  const card = el('div', 'notice');
  const wait = el('p', 'working');
  wait.textContent = 'Checking your Google sign-in.';
  card.appendChild(wait);
  box.appendChild(card);

  let s;
  try {
    const { data, error } = await sb.rpc('google_signin_state');
    if (error) throw error;
    s = data;
  } catch (e) {
    card.innerHTML = '';
    const p = el('p', '');
    p.textContent = 'Your Google sign-in could not be checked just now: ' + plainWords(String(e?.message ?? e));
    card.appendChild(p);
    return;
  }
  card.innerHTML = '';
  // THE NEXT 7 DAYS (seat calendar-in, 2026-11-14): on the Calendar tab only, under this card. Its own reading, so it
  // shows whatever the sign-in card says. body.dataset.tab is read here, after the wait, when the tab has settled.
  if (s?.ok && document.body.dataset.tab === 'calendar') drawWeek(box, { sb, el });
  if (!s?.ok) {
    const p = el('p', '');
    p.textContent = 'Nobody is signed in on this browser, so there is no Google sign-in to show.';
    card.appendChild(p);
    return;
  }

  const h = el('h3', '');
  h.textContent = 'Your Calendar and Contacts';
  card.appendChild(h);

  const p = el('p', '');
  const granted = (s.granted ?? []).filter((g) => WORDS[g]);
  const missing = ASKED.filter((g) => !granted.includes(g));
  if (s.state === 'granted') {
    const when = fmtDate(s.granted_at);
    p.textContent = `You signed in to Google as ${s.email}${when ? ' on ' + when : ''}. `
      + (granted.length ? `Google allowed ${list(granted.map((g) => WORDS[g]))}.` : 'Google did not say what it allowed.');
  } else {
    p.textContent = (s.state === 'asked' ? 'You started a Google sign-in that did not finish. ' : '')
      + 'One Google sign-in lets the Tool read your own calendar and address book, which only you see, '
      + 'and keep files you add to a conversation in a folder of your own Drive. '
      + `You sign in on Google's page as ${s.email}; a sign-in as any other account is refused and nothing is kept.`;
  }
  card.appendChild(p);

  // WHAT HAS BEEN READ (round 4, 2026-10-22): the walk's own line for your calendar and your address book, from the
  // brain (google_signin_state.reading), with when it last read and the reason when a read stopped.
  if (s.state === 'granted') {
    const reading = Array.isArray(s.reading) ? s.reading : [];
    if (!reading.length) {
      const r = el('p', 'quiet');
      r.textContent = 'Reading your calendar and address book starts within a few minutes of signing in.';
      card.appendChild(r);
    }
    for (const r of reading) {
      const q = el('p', r.failed ? 'notice flagged' : 'quiet');
      const what = r.what === 'calendar' ? 'Your calendar' : 'Your address book';
      // ONE NUMBER (seat day-one-fixes 2026-11-14, decision 1172 (5), morning-audit-2 fix 5): the records kept, counted by the brain
      // (google_signin_state kept), not the walk's running tally of keeps ("1,721 meetings kept" while 892 are kept). The walk's line
      // is still said when the brain gives no count (an older brain), and its words whenever the read stopped or is held.
      const kept = Number(r.kept);
      const counted = r.kept !== undefined && r.kept !== null && Number.isFinite(kept)
        ? kept.toLocaleString('en-US') + (r.what === 'calendar' ? (kept === 1 ? ' entry' : ' entries') : (kept === 1 ? ' contact' : ' contacts')) + ' kept and searchable.' : null;
      const said = r.failed ? plainWords('the last read stopped: ' + r.failed) : (r.paused || counted || r.line || 'waiting for its first read.');
      const last = r.last_read_at ? ' Last read ' + fmtDate(r.last_read_at, 'when') + '.' : '';
      q.textContent = what + ': ' + said + last;
      card.appendChild(q);
    }
  }

  if (s.state === 'granted' && missing.length) {
    const m = el('p', 'quiet');
    m.textContent = `Not allowed: ${list(missing.map((g) => WORDS[g]))}. To change that, sign in again and keep those boxes checked.`;
    card.appendChild(m);
  }

  if (s.state !== 'granted' || missing.length) {
    const actions = el('div', 'actions');
    const b = el('button', 'go');
    b.type = 'button';
    const label = s.state === 'granted' ? 'Sign In to Google Again' : 'Sign In with Google';
    b.textContent = label;
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      b.textContent = 'Opening Google…';
      b.classList.add('working', 'no-late');
      connect(b, () => { b.textContent = label; b.classList.remove('working', 'no-late'); });
    });
    actions.appendChild(b);
    card.appendChild(actions);
  }
}

// THE NEXT 7 DAYS (seat calendar-in, 2026-11-14; brief: one plain list proves the calendar read on her screen, the
// Calendar tab picture comes later). Read from the brain's my_week(): her own kept meetings from today, each through
// the door, with invitations in her mail that are not on her calendar yet, and what is known of each meeting's notes.
// A plain list: day, time, title, who, where, notes. Nothing here can change a meeting. Titles, people and places are
// hers and are never translated (translate="no"); the Tool's own words stand alone so words.js can find them.
// EVERY CALENDAR SHE MAY SEE (seat calendar-walk-2, 2026-11-18, decision 1177): my_week now reads her own calendar and each
// shared mailbox's she may open (Accounting, Admin, ...), all read company-wide with nobody signing in. With more than one
// calendar each meeting says whose calendar it is on. A calendar not read yet, or refused, is said by name with the reason,
// so an empty week never hides a calendar that was not read. A standing check-in (the daily check-in with Erin) is shown
// ONCE at the top, not as a meeting on every day (decision 1177 (2)). SUPERSEDED 2026-11-18: the closing line said every
// calendar here is one only she sees; a shared mailbox's is seen by everyone who may open that mailbox.
const NOTES = {
  notes: 'Notes were kept.',
  unsure: 'Notes that may be of this call were kept.',
  reading: 'Notes are being read now.',
  none: 'No notes were taken.',
};
const dayOf = (r) => (r.all_day ? String(r.start).slice(0, 10) : new Date(r.start).toLocaleDateString('en-CA', { timeZone: zone() }));

async function drawWeek(box, { sb, el }) {
  const card = el('div', 'notice');
  const h = el('h3', '');
  h.textContent = 'The Next 7 Days';
  card.appendChild(h);
  const wait = el('p', 'working');
  wait.textContent = 'Reading your calendar.';
  card.appendChild(wait);
  box.appendChild(card);
  const say = (text, cls) => { const p = el('p', cls || 'quiet'); p.textContent = text; card.appendChild(p); return p; };
  let w;
  try {
    const { data, error } = await sb.rpc('my_week', { p_tz: zone() });
    if (error) throw error;
    w = data;
  } catch (e) {
    wait.remove();
    say('Your next 7 days could not be read just now: ' + plainWords(String(e?.message ?? e)), 'notice flagged');
    return;
  }
  wait.remove();
  if (!w?.ok) { say(w?.note || 'Your next 7 days are not shown.'); return; }
  if (w.refused) { say(w.reason || 'Your next 7 days could not be read.', 'notice flagged'); return; }
  const rows = Array.isArray(w.rows) ? w.rows : [];
  const cals = Array.isArray(w.calendars) ? w.calendars : [];
  const shared = Array.isArray(w.shared) ? w.shared : [];
  const many = cals.length > 1;
  // what was not read, by name, with the reason (never an empty week)
  for (const n of (Array.isArray(w.not_read) ? w.not_read : [])) {
    const p = el('p', n.state === 'refused' ? 'notice flagged' : 'quiet');
    p.style.overflowWrap = 'anywhere';
    const lead = el('span', '');
    lead.textContent = n.state === 'refused' ? 'Could not be read:' : 'Not read yet:';
    p.appendChild(lead);
    const box1 = el('span', '');
    box1.setAttribute('translate', 'no');
    box1.textContent = ' ' + String(n.mailbox || '') + ' ';
    p.appendChild(box1);
    const why = el('span', 'state');
    why.textContent = plainWords(String(n.reason || ''));
    p.appendChild(why);
    card.appendChild(p);
  }
  // standing check-ins, once each
  for (const s1 of (Array.isArray(w.standing) ? w.standing : [])) {
    const p = el('p', '');
    p.style.overflowWrap = 'anywhere';
    const lead = el('span', '');
    lead.textContent = 'Standing check-in:';
    p.appendChild(lead);
    const t = el('span', '');
    t.setAttribute('translate', 'no');
    t.textContent = ' ' + (s1.title || '(No title)') + ' ';
    t.style.fontWeight = '600';
    p.appendChild(t);
    const how = el('span', '');
    how.textContent = s1.weekdays_only ? '· weekdays' : '· most days';
    p.appendChild(how);
    card.appendChild(p);
    const who = (Array.isArray(s1.attendees) ? s1.attendees : []).filter((a) => typeof a === 'string' && a);
    if (who.length) { const q = say(who.join(', ')); q.setAttribute('translate', 'no'); q.style.overflowWrap = 'anywhere'; }
    say('Shown once here, not as a meeting on each of its days.');
  }
  if (!rows.length) {
    say(w.calendar === false ? (w.reason || 'Your calendar is not read yet.') : 'Nothing on your calendar in the next 7 days.');
    return;
  }
  if (w.calendar === false) say('Your calendar is not read yet. These are invitations in your mail.');
  let day = null;
  for (const r of rows) {
    const d = dayOf(r);
    if (d !== day) {
      day = d;
      const dh = el('p', '');
      const b = el('b', '');
      b.textContent = fmtDate(d, 'long');
      dh.appendChild(b);
      card.appendChild(dh);
    }
    const p = el('p', '');
    p.style.overflowWrap = 'anywhere';
    const part = (text, keep) => { const sp = el('span', ''); if (keep) sp.setAttribute('translate', 'no'); sp.textContent = text; p.appendChild(sp); return sp; };
    if (r.all_day) part('All day'); else part(fmtDate(r.start, 'time') + (r.end ? ' to ' + fmtDate(r.end, 'timeZone') : ''), true);
    part(' · ', true);
    part(r.title || '(No title)', true).style.fontWeight = '600';
    card.appendChild(p);
    const who = (Array.isArray(r.attendees) ? r.attendees : []).filter((a) => typeof a === 'string' && a);
    const lines = [];
    if (who.length) lines.push([who.slice(0, 6).join(', ') + (who.length > 6 ? ', and ' + (who.length - 6) + ' more' : ''), true]);
    if (r.where && !String(r.where).startsWith('http')) lines.push([String(r.where), true]);
    if (many && r.mailbox && !r.from_invitation) lines.push([String(r.mailbox), true]);
    if (r.from_invitation) lines.push(['An invitation in your mail, not on your calendar yet.', false]);
    if (NOTES[r.notes]) lines.push([NOTES[r.notes], false]);
    for (const [text, keep] of lines) {
      const q = say(text);
      q.style.overflowWrap = 'anywhere';
      if (keep) q.setAttribute('translate', 'no');
    }
  }
  if (shared.length) say('From your own calendar, which only you see, and the calendars of shared mailboxes you may open, which everyone who may open them sees. Read only: nothing here changes a meeting.');
  else say('From your own calendar, which only you see. Read only: nothing here changes a meeting.');
}

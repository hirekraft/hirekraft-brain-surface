// YOUR GOOGLE SIGN-IN (seat calendar-contacts, 2026-10-13; decision 993, HQ addendum 1b).
// One Google sign-in per person lets the Tool read that person's own calendar and address book
// (theirs alone) and keep files they add to a conversation in a folder of their own Drive.
// This part only SHOWS the caller's own state, from the brain's google_signin_state(), and hands
// the button to lens.js's one connect path (beginConnect); it starts nothing itself.
// Shown on the Systems tab and the Calendar tab. Owner and everyone else see the same thing:
// their own sign-in, never anyone else's.

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
    p.textContent = 'Your Google sign-in could not be checked just now: ' + String(e?.message ?? e);
    card.appendChild(p);
    return;
  }
  card.innerHTML = '';
  if (!s?.ok) {
    const p = el('p', '');
    p.textContent = 'Nobody is signed in on this browser, so there is no Google sign-in to show.';
    card.appendChild(p);
    return;
  }

  const h = el('h3', '');
  h.textContent = 'Your calendar and contacts';
  card.appendChild(h);

  const p = el('p', '');
  const granted = (s.granted ?? []).filter((g) => WORDS[g]);
  const missing = ASKED.filter((g) => !granted.includes(g));
  if (s.state === 'granted') {
    const when = s.granted_at ? new Date(s.granted_at).toLocaleDateString() : '';
    p.textContent = `You signed in to Google as ${s.email}${when ? ' on ' + when : ''}. `
      + (granted.length ? `Google allowed ${list(granted.map((g) => WORDS[g]))}. ` : 'Google did not say what it allowed. ')
      + 'Reading your calendar and address book is not switched on yet, so nothing from them has been read.';
  } else {
    p.textContent = (s.state === 'asked' ? 'You started a Google sign-in that did not finish. ' : '')
      + 'One Google sign-in lets the Tool read your own calendar and address book, which only you see, '
      + 'and keep files you add to a conversation in a folder of your own Drive. '
      + `You sign in on Google's page as ${s.email}; a sign-in as any other account is refused and nothing is kept.`;
  }
  card.appendChild(p);

  if (s.state === 'granted' && missing.length) {
    const m = el('p', 'quiet');
    m.textContent = `Not allowed: ${list(missing.map((g) => WORDS[g]))}. To change that, sign in again and keep those boxes checked.`;
    card.appendChild(m);
  }

  if (s.state !== 'granted' || missing.length) {
    const actions = el('div', 'actions');
    const b = el('button', 'go');
    b.type = 'button';
    const label = s.state === 'granted' ? 'Sign in to Google again' : 'Sign in with Google';
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

// fill/dates.js - THE ONE WAY THE SCREEN WRITES A DATE, and the one time zone (seat calendar-contacts, 2026-10-22).
//
// Alex 2026-10-11 (decision 75d7b742): every word the customer sees is American English. HQ 2026-10-22: every date the
// screen shows goes through ONE formatter, fixed as a class. Before this file there were nine private copies; half
// followed the browser's language, so a European browser showed 22/10/2026 on the Google card. Every date here is
// American ("Oct 22, 2026", "2:30 PM PDT"), in the time zone the header shows: this computer's, or the one she picked
// (kept in this browser under TZ_KEY). The zone used to live in lens.js; it lives here so the header and every date agree.
// A day-only value ("2026-10-22", an all-day meeting) and a month ("2026-09") are shown as that day or month, never
// moved by a time zone. Not for values that are not read as words: date input boxes, file names, internal sort keys.
// No regex literals (STANDING-CLAUSES: the write tool).

export const TZ_KEY = 'tool.timezone';
export function ownZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (_) { return 'UTC'; }
}
export function zone() {
  try { const z = localStorage.getItem(TZ_KEY); if (z) return z; } catch (_) { /* storage off: the computer's */ }
  return ownZone();
}

const KINDS = {
  day: { month: 'short', day: 'numeric', year: 'numeric' },            // Oct 22, 2026
  short: { month: 'short', day: 'numeric' },                           // Oct 22
  year: { year: 'numeric' },                                           // 2026
  month: { month: 'short', year: 'numeric' },                          // Oct 2026
  monthLong: { month: 'long', year: 'numeric' },                       // October 2026
  time: { hour: 'numeric', minute: '2-digit' },                        // 2:30 PM
  timeZone: { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' },  // 2:30 PM PDT
  when: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' },  // Oct 22, 2026, 2:30 PM PDT
  whenShort: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },   // Oct 22, 2:30 PM
  long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },          // Thursday, October 22, 2026
};
const digits = (s) => [...s].every((c) => c >= '0' && c <= '9');
const isDay = (v) => typeof v === 'string' && v.length === 10 && v[4] === '-' && v[7] === '-' && digits(v.slice(0, 4) + v.slice(5, 7) + v.slice(8));
const isMonth = (v) => typeof v === 'string' && v.length === 7 && v[4] === '-' && digits(v.slice(0, 4) + v.slice(5));

export function fmtDate(value, kind = 'day', fallback = '') {
  if (value === null || value === undefined || value === '') return fallback;
  const opts = KINDS[kind] ?? KINDS.day;
  let d, tz;
  if (isDay(value)) { d = new Date(value + 'T12:00:00Z'); tz = 'UTC'; }
  else if (isMonth(value)) { d = new Date(value + '-15T12:00:00Z'); tz = 'UTC'; }
  else { d = value instanceof Date ? value : new Date(value); tz = zone(); }
  if (Number.isNaN(d.getTime())) return fallback || String(value);
  try { return d.toLocaleString('en-US', { ...opts, timeZone: tz }); }
  catch (_) { return d.toLocaleString('en-US', opts); }
}

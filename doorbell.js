/* THE DOORBELL — one implementation, imported by every lens.
 *
 * A tick carries NOTHING about what changed: no mailbox, no subject, no sender, no
 * id. That is the point rather than a shortcoming. A page subscribing to content
 * directly would be a new retrieval path that never passed the gate, and
 * allowed_identities is presently written by two functions and read by zero
 * retrieval functions — a live channel over that would be a membrane claim with no
 * enforcement, pushed to a browser. So the bell rings, and the page re-asks through
 * the endpoint it already uses, which is gated.
 *
 * Ticks are pruned hourly. They are a signal, never a record: nothing here may read
 * one as history, and nothing here may treat a missed tick as data loss — the next
 * re-ask returns current state regardless of how many bells were missed.
 *
 * The publisher already debounces to at most one tick per two seconds. The guard
 * below is not a second opinion about that: it covers this page's own case, where a
 * handler can be slower than the interval or several bells can land while one
 * re-ask is still in flight.
 */

export function onBrainChange(sb, jwt, handler, opts = {}) {
  const label = opts.label ?? "lens";
  const gap = opts.gap ?? 2000;

  // Realtime authenticates separately from PostgREST. Without this the socket
  // connects as the publishable key and RLS refuses the rows, which looks
  // identical to "nothing ever changed" — a silence that would be indistinguishable
  // from working.
  if (jwt && sb.realtime?.setAuth) sb.realtime.setAuth(jwt);

  let timer = null;
  let running = false;
  let again = false;

  async function run() {
    if (running) { again = true; return; }   // a bell during a re-ask is not lost
    running = true;
    try { await handler(); }
    finally {
      running = false;
      if (again) { again = false; schedule(); }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, gap);
  }

  const channel = sb
    .channel(`doorbell:${label}`)
    .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_tick" },
        schedule)
    .subscribe((status) => { if (opts.onStatus) opts.onStatus(status); });

  // Returned so a page can stop listening; nothing depends on it today.
  return () => { clearTimeout(timer); sb.removeChannel(channel); };
}

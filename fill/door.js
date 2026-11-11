// THE ONE DOOR TO THE BRAIN (seat ready-never-spins 2026-11-11, decision 1145; moved to its own file by seat findable-fix so
// every page file can use the same one: ready.js, settings.js and brainpress.js import it from here, and there is no second copy).
// The database client's call object is not a promise: it has then, and no catch or finally. This wraps it in a real one that
// always answers { data, error } and never throws or rejects. No line of a page file calls the client's rpc directly.
export function brainDoor(sb, name, args) {
  return new Promise((res) => {
    const no = (e) => res({ data: null, error: { message: String(e?.message ?? e) } });
    try { sb.rpc(name, args).then(res, no); } catch (e) { no(e); }
  });
}

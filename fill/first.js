// THE FIRST ANSWER ON THE BRAIN TAB (seat first-answer, 2026-10-27, decision 1024 item 1).
// The same lines the box gives to "what do you know, is it connected, is it working?": what is in it, what is up to date, what is
// only partly read and whether that is fine, what is not working right, who sees what, and ask me anything. Read from the brain's
// first_answer as the signed-in person (the one implementation; the box and the person's own AI read the same function), drawn on
// top of the Brain tab. The detail (the tree and What the Tool has read) stays below it, one step down. Nothing here composes
// words. A failure says so in one line and points at the detail; it never leaves an empty box.

export async function drawFirst({ sb, el, $ }) {
  const box = $('#first-answer');
  if (!box) return;
  box.setAttribute('aria-busy', 'true');
  const say = (text) => {
    const p = el('p', 'quiet');
    p.textContent = text;
    box.replaceChildren(p);
    box.removeAttribute('aria-busy');
  };
  let fa = null;
  try {
    const { data, error } = await sb.rpc('first_answer');
    if (error) throw error;
    fa = data;
  } catch (e) {
    say('The short answer could not be read just now (' + String(e?.message ?? e) + '). The detail below is still current.');
    return;
  }
  if (!fa || fa.ok !== true || !Array.isArray(fa.lines) || !fa.lines.length) {
    say(fa?.note || 'The short answer could not be read just now. The detail below is still current.');
    return;
  }
  const list = el('ul', 'first-lines');
  for (const line of fa.lines) {
    const li = el('li');
    const text = String(line);
    const cut = text.indexOf(': ');
    if (cut > 0 && cut < 24) {
      const b = el('b');
      b.textContent = text.slice(0, cut + 1);
      li.append(b, ' ' + text.slice(cut + 2));
    } else {
      li.textContent = text;
    }
    list.appendChild(li);
  }
  box.replaceChildren(list);
  box.dataset.state = String(fa.state || '');
  box.removeAttribute('aria-busy');
}

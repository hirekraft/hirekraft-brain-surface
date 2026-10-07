# Archived screens

Archived means both halves (Alex, 2026-10-01): out of the running site, and kept whole where it can be found.

## The July mail page (`/mail/`)

- **What it was:** the first mail view, headed "Your consultant / MAIL LENS". It read a mailbox live from Gmail (worklens-live), showed "What you didn't know", "Where this stands", and Answer / Forward / Just register, plus an identity shield panel, its own open ask box, and a note when sources could not be reached.
- **When:** built July 2026; identity proven from the session from 2026-07-31; archived 2026-10-07.
- **Capability and mechanism:** READ AND UNDERSTAND WHAT COMES IN, its SHOW step for mail.
- **Why archived:** Alex, 2026-10-06: wasted space, a second ask box inconsistent with the one Ask bar, and an unreachable-sources note in the wrong place. Replaced by the Tool screen's Mail tab (`fill/mail.js`), which kept its live read, what-you-didn't-know, where-this-stands, Answer and Forward.
- **Where it is kept:** branch `archive/mail-2026-07` (commit aa8dacd), files `mail/index.html` and `mail/mail.js`.
- **Enforced:** on `main`, `mail/mail.js` is deleted and `mail/index.html` only forwards to `fill/#mail`, carrying `?mailbox=`. It reads nothing.
- **Left with it:** "Just register" wrote into the July case tracker (`sol_case_*` functions on the brain), which is on the archive list too; those functions still exist on the brain and are not retired by this.

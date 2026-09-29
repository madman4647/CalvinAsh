# Calvin 2.0 — UI and UX spec

> This file governs look, tone, layout and wording. **`docs/PLAN.md` wins on behaviour.** If anything here would show a mark, rename a critical action, skip a step or weaken a rule, follow PLAN.md and flag the conflict.

## 1. Direction

Calvin looks like a comic strip drawn in a notebook: warm paper, ink outlines, watercolour accents and slightly hand-drawn shapes. Selection should feel like an adventure for students. For the people who evaluate and audit it, the same look stays calm and precise.

| Area | Who uses it | How much theme |
| --- | --- | --- |
| Student screens | Applicants (juniors) | Full: playful headings, doodles, small celebrations |
| CCA screens | The CCA account configuring its process | Medium: themed headers, plain forms and controls |
| Panelist workspace | Seniors evaluating | Light: paper and ink only; no tilts or jokes near marks |
| Senate control centre | Senate | Minimal: clean tables, status colours, dense data |

### Original art only

Calvin's name nods to the comic strip, but the app uses nothing from the strip itself.

- No Calvin and Hobbes characters, strip panels, quotes, or drawings made to look like them.
- No names invented by the strip, such as Spaceman Spiff, Tracer Bullet, Transmogrifier or G.R.O.S.S.
- Original doodles in the same spirit are welcome: a red wagon, a cardboard box, paper rockets, stars and planets, notebook paper, a detective's notepad.
- This is an official Senate portal. No in-jokes that single out any group, including in easter eggs.

## 2. Tokens

Define colours once in `tailwind.config.js` and as CSS variables in `index.css`.

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | #F9F6EE | Page background, with a faint dot grid |
| `paper-light` | #FDFBF7 | Cards, inputs |
| `ink` | #1F1F1F | Text, outlines, hard shadows (no pure black) |
| `red` | #D9382E | Primary action on student and CCA screens |
| `red-deep` | #C4251D | Hover and pressed state of `red` |
| `pine` | #2C5545 | Secondary action; primary action on panelist and Senate screens |
| `mustard` | #E5A93B | Highlights and badges, always with ink text |

Status colours follow PRD §53. They mark state, never decoration, and always come with a word and an icon.

| Status | Meaning | Hex | Text on it |
| --- | --- | --- | --- |
| Normal / Completed | Done, locked | #2E7D4F | White |
| Active | Happening now | #2F6FB5 | White |
| Pending | Waiting | #E5A93B | Ink |
| Attention | Needs action soon | #D9731E | Ink |
| Exception / Critical | Blocked or alert | #B3261E | White |

On panelist and Senate screens, red means critical only, so buttons there use `pine` or `ink`, never `red`.

Every text-and-background pair above meets WCAG AA contrast (4.5:1). White text never goes on `mustard` or orange.

### Type

- **Headings and logo:** Comic Neue 700.
- **Body, forms, tables:** Nunito 400/600/700. Numbers, times and counts use tabular figures.
- **Optional:** Special Elite (typewriter), only for small labels on the student "Case Files" pages.
- No other families. Body text is at least 16px on phones.

### Shape and depth

- Cards, hero panels and buttons: a 3px ink border, an irregular hand-drawn radius, and a hard offset shadow (4–6px, no blur).
- Dense elements (tables, form fields, the marks form, Senate views): straight 2px borders and an 8px radius.
- Dividers: a squiggly ink line instead of a straight rule.

## 3. Components

Build these once in `client/src/components/ui/` during Loop 0, and reuse them everywhere.

| Component | Notes |
| --- | --- |
| `ComicPanel` | Card. Variants: `default`, `highlight` (mustard tint), `quiet` (no hover motion) |
| `Button` | Variants: `primary` (red), `accent` (pine), `secondary` (mustard, ink text), `plain` (paper, ink border), `danger` (critical red). Sizes `sm`, `md`, `lg`. The `quiet` prop removes all motion |
| `StatusBadge` | Colour + word + icon; never colour alone |
| `StateBanner` | Full-width banner for round and interview state (see §5) |
| `ProgressMap` | Dotted trail of a student's stages |
| `Field`, `Select`, `FileDrop` | Labelled inputs with plain-language error text |
| `ConfirmDialog` | Required before every irreversible action; restates exactly what will happen |
| `Toast`, `EmptyState`, `Loader` | Loader is a small original doodle, still announced as "Loading" to screen readers |

Icons come from `react-icons` (Feather set), which the project already uses. Don't add a second icon library.

Reference CSS for `index.css` (`@layer components`):

```css
:root {
  --paper: #F9F6EE; --paper-light: #FDFBF7; --ink: #1F1F1F;
  --red: #D9382E; --red-deep: #C4251D; --pine: #2C5545; --mustard: #E5A93B;
}
body {
  background-color: var(--paper);
  background-image: radial-gradient(#e5e1d8 1px, transparent 1px);
  background-size: 20px 20px;
  color: var(--ink);
  font-family: 'Nunito', sans-serif;
}
.comic-panel {
  background: var(--paper-light);
  border: 3px solid var(--ink);
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
  box-shadow: 6px 6px 0 var(--ink);
}
.comic-button {
  border: 3px solid var(--ink);
  border-radius: 15px 225px 15px 255px / 255px 15px 225px 15px;
  box-shadow: 4px 4px 0 var(--ink);
  font-family: 'Comic Neue', cursive;
  font-weight: 700;
  transition: transform .15s ease, box-shadow .15s ease;
}
.comic-button:hover { transform: rotate(-2deg) scale(1.03); box-shadow: 6px 6px 0 var(--ink); }
.comic-button:active { transform: translate(2px, 2px); box-shadow: 0 0 0 var(--ink); }
.squiggle {
  height: 10px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10' preserveAspectRatio='none'%3E%3Cpath d='M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5' fill='none' stroke='%231F1F1F' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") repeat-x;
  background-size: 50px 100%;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .comic-button:hover, .comic-button:active { transform: none; }
}
```

## 4. Motion

- **Hover:** rotate at most 2°, scale at most 1.03. **Press:** a 2px shift and the shadow collapses.
- **Success (student screens):** a short spring, at most 400ms. When a final result says Selected, play a one-time celebration made of original doodles.
- **Error:** a gentle shake (at most 300ms) plus the error text.
- **Reduced motion:** when the device asks for it, all of the above is off and state changes are instant.
- **Never animated or tilted:** SUBMIT & LOCK MARKS, the marks form, interview controls, and anything on Senate screens.

## 5. Screen by screen

Section names below are ours. Each loop styles its own screens with these components; the loop is noted in brackets.

### Student (designed for phones first; students enter and exit interviews from their phones)

- **Login, "The Wagon Ride":** a red-wagon doodle and "Hop in" copy. The page shows nothing about admin areas. [Loop 1]
- **Browse CCAs, "The Galaxy":** each CCA is a planet card with its name, type, verticals and seats, rounds and key dates, over faint space doodles. [Loop 3]
- **Apply, "The Box":** a cardboard-box styled form (CCA, then vertical). The button must still say Apply; a flourish like "Zap! Apply" is fine. [Loop 3]
- **My applications and ranking:** a drag-and-drop list styled as sticky notes. The application close date sits at the top in plain words. After the close, show a lock icon and "Frozen". [Loop 3]
- **Rounds, "Case Files":** each round is a notepad page with instructions, due time, hard close, and an upload box that shows the exact submission receipt (§15). For interview rounds, it shows the slot and the live queue position ("You are 3rd in line", "You're next"). [Loops 6–7]
- **Interview:** a full-screen `StateBanner` with three states: waiting, "You are currently in an interview" (§18), and "Interview completed". There is one very large button per state (ENTER INTERVIEW, then EXIT INTERVIEW), plus a reminder to press EXIT when the interview ends. [Loop 7]
- **Progress map:** Applied → each round → Final result. It shows only Completed and Current, never marks, ranks or anything about other students.
- **Result:** Selected gets the celebration. Not Selected gets a warm, original message pointing to other opportunities; no quotes from anyone's comic. [Loop 10]

### CCA account ("CCA HQ", medium theme)

- **Structure builder:** step by step (verticals → rounds → panels) with a live summary card. FINALIZE SELECTION STRUCTURE shows the §8 confirmation text before it runs. [Loop 2]
- **Panels, groups and schedules:** drag-and-drop lanes per panel. Once a round opens, everything shows as locked. [Loop 4]
- **Round control:** Start evaluation, hard-close extension (later times only), progress counts ("32 of 40 evaluated"). The ranking view shows order and tie groups, never marks. The elimination picker offers only valid counts, with the minimum pool shown prominently. [Loops 6–8]

### Panelist workspace (desktop first, works on a tablet; calm)

- **Task queue:** one screen with no list. The file viewer is on the left; the marks form is on the right, with each parameter, its maximum and whole-number inputs. The top shows only a count ("Submission 14 · 26 left"). Buttons: Next (only when nothing is open), Park with reason, then Review → Confirm & Lock with the §21 warning. After locking, show the §23 message, then Next. [Loop 6]
- **Interview console:** the panel's queue with the head highlighted, and MOVE LATER and MARK NO-SHOW buttons. MARK NO-SHOW stays disabled with a visible 10-minute countdown. The state banner reads "Interview in Progress — {student}" (§18). The marks form appears only after the student exits. SUBMIT & LOCK MARKS comes next, and EXIT INTERVIEW is enabled only after the lock. A blocked action shows the §26 message. [Loop 7]

### Senate control centre (desktop, minimal theme)

- Dashboard tiles (§25), the CCA table (§36), the live interview table with timestamps (§28–29), the exception centre sorted by severity (§52), marks tables and the audit log viewer. [Loop 5 onward, brought together in Loop 9]
- Paper background and ink headings only. Data sits in plain tables with tabular numbers and the §53 status colours.

## 6. Words

- Themed words are for headings, navigation, empty states and celebrations.
- Instructions, deadlines, errors, confirmations and every action listed below use plain words.
- These labels are fixed and never themed: **ENTER INTERVIEW · START INTERVIEW · EXIT INTERVIEW · SUBMIT & LOCK MARKS · MOVE LATER · MARK NO-SHOW · RAISE EXCEPTION · Start evaluation · Next · Park with reason · Confirm & Lock · FINALIZE SELECTION STRUCTURE · Withdraw application.**
- These messages are used word for word:
  - §15, after an upload: "Your submission has been successfully recorded."
  - §21, before locking marks: "Once submitted, marks cannot be changed by the evaluator or CCA."
  - §23, after locking: "Evaluation submitted successfully. Marks have been locked and are no longer accessible."
  - §26, when a busy panel tries to open another student: "Panel unavailable. Please complete the current interview, submit and lock the evaluation, and exit the interview session before proceeding to the next interview."
  - §8, before finalizing: "Once finalized, round sequence, round types and maximum marks cannot be modified after the selection process begins."
- Deadlines always show the date, the time and IST, taken from the server.
- Errors say what happened and what to do next, and never blame the user.

## 7. Never on screen

The API already refuses these; the UI must not try to show them or leave space for them.

- **Students:** marks, scores, totals, ranks, other students' progress, panel comments.
- **CCA account and panelists:** any locked mark, including their own once locked.
- **Anyone except Senate:** other users' audit details and exception internals.

## 8. Layout and accessibility

- Breakpoints: phone 360px, tablet 768px, laptop 1280px. Student screens are designed at phone width first.
- WCAG 2.2 AA: text contrast at least 4.5:1 (the token pairs above pass), a visible 3px ink focus ring, full keyboard use, labels on every input and icon button, and status never shown by colour alone.
- Touch targets at least 44px. ENTER INTERVIEW and EXIT INTERVIEW are at least 56px tall.

## 9. Build order

- **Loop 0:** tokens, fonts, the base components, and a component gallery page covered by a Playwright screenshot test.
- **Every later loop:** styles its own screens with these components. No one-off styles for anything a component already covers.

# Prompt Gemini — Xam-Xam UI (v2)

---

Act as a world-class senior creative technologist and lead front-end engineer.

You have access to a project at `/home/claudeuser/xam-xam/` (or the path provided locally).

## What this project is

**Xam-Xam** is a mobile-first web app to learn Wolof (a West African language) through audio flashcards, inspired by Pimsleur and Anki. The app plays native audio recordings (Assimil), and the user repeats/listens, then flips the card to check the French translation.

## What already exists — DO NOT change

- `src/core/srs.js` — SM-2 spaced repetition algorithm, complete, working
- `src/data/mock.js` — mock data (lessons + cards), complete
- `src/App.jsx` — routing logic (home → lesson → session), complete

## What you must build — replace the stubs

Replace the UI in these **5 components**:

---

### 1. `src/components/LessonList.jsx`

Home screen. Replace the stub entirely.

**Elements to include:**
- App name "Xam‑Xam" in the header (left), with a **streak badge** on the right showing a flame icon + number (hardcode `7` for now — visual only)
- Subtitle: `Wolof · apprentissage par l'audio`
- **Global progress card**: a progress bar showing `mastered / total` cards across all lessons (use `srs.getStats()`)
- If `due > 0`, show a green line below the bar: `X carte(s) à réviser aujourd'hui`
- Section label `LEÇONS` (muted, small caps)
- Scrollable list of lesson cards. Each card:
  - **Icon**: headphones (emerald) if the lesson has at least one audio card, book (muted) otherwise — check `lesson.cards.some(c => c.audioWo)`
  - **Title** + **due badge** (emerald pill with count) if due > 0
  - **Description** (muted)
  - **Mini progress bar** (mastered / total for this lesson)
  - Card count (muted, right)
  - Chevron right (muted)
- Tap on a lesson → `onSelect(lessonId)`

**Per-lesson stats** — compute like this:
```js
const due = lesson.cards.filter(c => { const r = srs.get(c.id); return !r.mastered && r.nextDue <= Date.now() }).length
const mastered = lesson.cards.filter(c => srs.get(c.id).mastered).length
```

---

### 2. `src/components/LessonDetail.jsx`

Lesson detail screen. Replace the stub entirely.

**Elements to include:**
- Back arrow button (top left) → `onBack()`
- Icon (headphones emerald or book muted, same logic as above)
- Large lesson title + description
- **3-column stat grid**:
  - Total cards (white)
  - Maîtrisées (emerald, `srs.get(c.id).mastered`)
  - À réviser (orange if > 0, muted if 0)
- **Progress bar** for this lesson with percentage label
- **"Commencer" button** (full-width, emerald, black text). If `due > 0`, label becomes `Réviser · X carte(s)`.
- Button → `onStart()`

---

### 3. `src/components/FlipCard.jsx`

The core flashcard component.

**Front face:**
- Label `WOLOF` (small, emerald, uppercase tracking) with a pulsing dot
- **Audio waveform** — a row of 15 vertical bars with varying heights, emerald color, static (no real animation needed — just a visual representation)
- Large Wolof text (emerald, centered, bold)
- Hint at the bottom: `Appuie pour révéler` (very muted)
- Cursor pointer, clicking calls `onFlip()`

**Back face:**
- Wolof text at the top (small, emerald, muted opacity)
- Separator line
- Label `TRADUCTION` (small, muted)
- Large French text (white, centered, bold)
- 3 small dots at the bottom (emerald, as a "done" indicator)
- Border: `border-[#4ade80]/20` (subtle emerald tint)

**Animation:**
- CSS 3D flip: `rotateY(180deg)` on flip, `perspective: 1200px`, `transformStyle: preserve-3d`
- Transition: `0.55s cubic-bezier(0.4, 0, 0.2, 1)`
- Both faces: `backfaceVisibility: hidden`
- Card height: `300px`

Note: audio playback is handled by `Session.jsx` — FlipCard only handles the visual.

---

### 4. `src/components/GradeBar.jsx`

Grading bar that appears after the card is flipped.

**Elements:**
- Label above: `Comment tu t'en es sorti ?` (muted, centered, xs)
- 6 buttons in a `grid-cols-6`:
  - 0 Raté / 1 Vague → `bg-red-950`, `border-red-900/60`, `text-red-400`
  - 2 Hésitant / 3 OK → `bg-amber-950`, `border-amber-900/60`, `text-amber-400`
  - 4 Bien / 5 Parfait → `bg-emerald-950`, `border-emerald-900/60`, `text-emerald-400`
- Each button: number (large, bold) + label (tiny, below)
- Touch-friendly: `py-3`, `rounded-xl`, `active:scale-95`

---

### 5. `src/components/Session.jsx`

The session screen that wraps FlipCard and GradeBar. **Keep all existing logic exactly as-is** — only replace the visual wrapper (the `return` block with the TODO comment).

**What to build:**
- Dark background, `maxWidth: 420px`, `margin: 0 auto`
- **Top bar**: back arrow (→ `onDone()`) on the left, progress counter `X / N` centered, lesson title muted on the right
- **Progress bar**: thin bar below the top bar showing session progress (`idx / cards.length`)
- **Card area**: centered FlipCard with padding
- **Grade bar**: slides up from the bottom when `flipped === true` (CSS `translate-y` transition)
- **Session complete screen**: when `idx + 1 >= cards.length` after grading, instead of calling `onDone()` immediately, show a "Terminé !" screen for 1.5s then call `onDone()`. Show:
  - Large checkmark or star (lucide icon)
  - `Leçon terminée !`
  - Summary: number of cards, average grade (compute from `grades` array), emoji based on performance
  - Button "Retour" → `onDone()`

**Important**: do NOT change `handleFlip`, `handleGrade`, `useEffect`, or any other logic. Only replace the `return` block and adjust imports if needed.

---

## Important notes

- **Audio will NOT work** — there are no real MP3 files. The UI must handle this gracefully. Error handling is already in place in `Session.jsx` with `.catch(() => {})`.
- **Fake/mock data** — `src/data/mock.js` has placeholder cards. Some have `audioWo: null` and `audioFr: null`. This is expected.
- **Streak counter** — hardcode `7` on the home screen (no backend yet)
- Do NOT modify `src/core/srs.js`, `src/data/mock.js`, or `src/App.jsx`

---

## Visual direction

| Token | Value |
|---|---|
| Background | `#0a0a0a` |
| Surface | `#111111` |
| Border | `#1e1e1e` |
| Wolof accent | `#4ade80` (emerald green) |
| French text | `#f5f5f5` (white) |
| Muted | `#6b7280` |
| CTA button | `bg-[#4ade80]` text-black |
| Orange (due) | `text-orange-400` |

- **Mobile-first**: `maxWidth: 420px`, centered on desktop, designed for thumb navigation
- **Animations**: `active:scale-[0.98]` on lesson cards, `active:scale-95` on grade buttons, `active:scale-[0.97]` on CTA
- **Feel**: premium, minimal, calm — like a luxury language app. No gradients, no glow effects. Pure dark + emerald.

---

## Tech constraints

- React 18 + Tailwind CSS (already configured)
- `lucide-react` available for icons
- No external UI libraries (no shadcn, no MUI, etc.)
- No TypeScript — plain JSX only
- SPA — no React Router (routing handled in `App.jsx` via state)
- Inline styles for 3D transforms (Tailwind doesn't support `transformStyle` / `backfaceVisibility` natively)

---

## Deliverable

Replace the 5 stub components. The app must feel complete, polished, and real — even though audio files and real data don't exist yet.

# Prompt Gemini — Xam-Xam UI

---

Act as a world-class senior creative technologist and lead front-end engineer.

You have access to a project at `/home/claudeuser/xam-xam/` (or the path provided locally).

## What this project is

**Xam-Xam** is a mobile-first web app to learn Wolof (a West African language) through audio flashcards, inspired by Pimsleur and Anki. The app plays native audio recordings (Assimil), and the user repeats/listens, then flips the card to check the French translation.

## What already exists — DO NOT change

- `src/core/srs.js` — SM-2 spaced repetition algorithm, complete, working
- `src/data/mock.js` — mock data (lessons + cards), complete
- `src/App.jsx` — routing logic (home → lesson → session), complete
- `src/components/Session.jsx` — session logic (audio, flipping, grading, SRS), complete

## What you must build — replace the stubs

Replace the UI in these 4 components:

### 1. `src/components/LessonList.jsx`
Home screen. Shows a scrollable list of lessons. Each lesson card shows:
- Title (prominent)
- Description (muted)
- Number of cards
- A small badge if there are cards due for review

### 2. `src/components/LessonDetail.jsx`
Lesson detail screen. Shows:
- Lesson title (large)
- Description
- Stats: total cards / mastered / due today
- A prominent "Commencer" (Start) button
- A back arrow to return to the list

### 3. `src/components/FlipCard.jsx`
The core flashcard component:
- **Front**: large Wolof text, centered. A subtle "tap to reveal" hint.
- **Back**: French translation revealed. Wolof text stays visible above it.
- **Animation**: smooth 3D CSS flip (rotateY 180°) on tap
- Note: audio playback is handled by Session.jsx — FlipCard only handles the visual flip

### 4. `src/components/GradeBar.jsx`
Grading bar that appears after the card is flipped:
- 6 buttons: 0 Raté / 1 Vague / 2 Hésitant / 3 OK / 4 Bien / 5 Parfait
- Color-coded: red (0-1), amber (2-3), green (4-5)
- Full-width row, touch-friendly

## Important notes

- **Audio will NOT work** — there are no real MP3 files. The UI must handle missing audio gracefully (no errors, no broken states). The audio logic is already in Session.jsx with `.catch(() => {})` error handling.
- **Fake data only** — `src/data/mock.js` has placeholder cards. Some have `audioWo: null` and `audioFr: null`. This is expected.
- Do NOT modify `src/core/srs.js`, `src/data/mock.js`, `src/App.jsx`, or `src/components/Session.jsx`

## Visual direction

- **Background**: deep black `#0a0a0a`
- **Surface cards**: `#111111` with a subtle border `#1e1e1e`
- **Wolof text**: large, elegant, accented in emerald green `#4ade80`
- **French text**: white `#f5f5f5`
- **Muted text**: `#6b7280`
- **Accent/CTA**: emerald `#4ade80` buttons with black text
- **Typography**: system-ui sans-serif for UI, slightly larger weight for Wolof text
- **Mobile-first**: max-width 420px, centered on desktop, designed for thumb navigation
- **Subtle animations**: fade+slide on screen transitions, scale on button press
- **Overall feel**: premium, minimal, calm — like a luxury language app

## Tech constraints

- React 18 + Tailwind CSS (already configured)
- lucide-react available for icons
- No external UI libraries (no shadcn, no MUI, etc.)
- No TypeScript — plain JSX only
- Keep it as a SPA (no React Router needed — routing is already handled in App.jsx via state)

## Deliverable

Replace the 4 stub components with pixel-perfect implementations. The app should feel complete and polished even though the audio files don't exist yet.

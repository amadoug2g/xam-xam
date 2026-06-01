# xam-xam

Wolof flashcards built from the Assimil conversation guide. Audio-first, offline-capable, spaced repetition.

**Live** — https://amadoug2g.github.io/xam-xam/

## Why

No decent app existed to learn Wolof. Built one using the Assimil audio recordings as the source of truth — each card has real audio, not TTS.

## Stack

React 18 · Vite · Tailwind CSS · SM-2 SRS · localStorage

## Run locally

```bash
npm install
npm run dev
```

## Structure

```
src/
  components/   FlipCard, LessonList, Session, AdminEditor
  core/         SM-2 algorithm, card normalization
  data/         lessons and cards (mock.js)
public/
  audio/        split MP3/WAV files per lesson (FR + Wolof)
scripts/
  extract_audio.py   split Assimil MP3s into individual segments
  merge_to_mock.py   inject lesson JSONs into mock.js
tools/matcher/       browser UI for manually pairing audio segments
```

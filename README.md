# Xam-Xam -- Apprendre le Wolof

**Xam-Xam** (la vraie connaissance en Wolof) est une application web de flashcards pour apprendre le Wolof, construite a partir du guide de conversation Wolof d'Assimil. Elle utilise l'algorithme de repetition espacee SM-2 avec une approche audio-first et mobile-first.

**Demo en ligne :** [https://amadoug2g.github.io/xam-xam/](https://amadoug2g.github.io/xam-xam/)

---

## Fonctionnalites

- 50 lecons Assimil (5 actives avec audio : compter, temps, espace, questions, mots quotidiens)
- Algorithme SRS SM-2 pour la planification des revisions
- Audio Wolof et Francais pour chaque carte
- Suivi du streak quotidien
- Session de revision globale (toutes lecons confondues)
- Fonctionne hors-ligne (donnees en localStorage, pas de backend)
- Edition inline des cartes

---

## Stack technique

- React 18
- Vite
- Tailwind CSS
- Lucide icons
- Algorithme SM-2 (repetition espacee)
- localStorage (persistance locale)

---

## Demarrage rapide

```bash
npm install
npm run dev
```

---

## Structure du projet

```
src/
  components/    <- composants React (LessonList, Session, FlipCard, etc.)
  core/          <- algorithme SRS SM-2, logique metier
  data/          <- donnees des lecons et cartes
public/
  audio/         <- fichiers MP3 Assimil decoupes (Wolof + Francais)
```

---

<!-- TODO: Ajouter des captures d'ecran quand disponibles -->

## Licence

Projet personnel d'apprentissage.

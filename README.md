# Xam-Xam

**Xam-Xam** (« la vraie connaissance » en Wolof) est une application web mobile-first d'apprentissage du Wolof par l'audio, inspirée de Pimsleur et Anki.

---

## Stack

- Vite + React 18
- Tailwind CSS
- lucide-react (icônes)
- localStorage (SRS, pas de backend)

---

## Lancer en local

```bash
npm install
npm run dev
```

---

## Architecture

```
src/
  App.jsx                    ← routeur (home → lesson → session)
  index.css                  ← Tailwind
  components/
    LessonList.jsx            ← liste des leçons
    LessonDetail.jsx          ← détail + bouton Commencer
    Session.jsx               ← déroulement session (flip cards)
    FlipCard.jsx              ← la carte (recto WO / verso FR)
    GradeBar.jsx              ← notation 0-5 Anki
  core/
    srs.js                    ← algorithme SM-2, localStorage
  data/
    mock.js                   ← données (3 vraies leçons + 2 mocks)
public/
  audio/
    espace/                   ← MP3 Assimil découpés (FR + WO)
```

---

## Flow utilisateur

### Écran 1 — Liste des leçons
- Liste verticale scrollable
- Chaque leçon : titre, description, nb de cartes, badge « X à réviser »
- Tap → Écran 2

### Écran 2 — Détail leçon
- Titre, description, stats (total / maîtrisées / dues)
- Bouton « Commencer »
- Bouton retour

### Écran 3 — Session (cœur de l'app)
1. Audio Wolof joue **automatiquement** à l'arrivée sur la carte
2. Texte Wolof affiché (grande police, centré)
3. Tap sur la carte → **animation flip** → révèle la traduction française + joue audio FR
4. Barre de notation apparaît : 0 Raté / 1 Vague / 2 Hésitant / 3 OK / 4 Bien / 5 Parfait
5. L'algorithme SRS (SM-2) planifie la prochaine révision
6. Carte suivante automatiquement

---

## Modèle de données

```js
Lesson {
  id: string           // "espace"
  title: string        // "Pour se repérer dans l'espace"
  description: string
  cards: Card[]
}

Card {
  id: string           // "espace_01"
  lessonId: string
  position: number
  wo: string           // texte Wolof
  fr: string           // traduction française
  audioWo: string      // "/audio/espace/01_wo.mp3"
  audioFr: string      // "/audio/espace/00_fr.mp3"
}

SRSRecord {            // localStorage, clé "xam-xam-srs"
  attempts: number
  ease: number         // SM-2 ease factor (défaut 2.5)
  interval: number     // jours
  nextDue: timestamp
  lastGrade: 0-5
  mastered: boolean    // true si interval >= 21j
}
```

---

## Direction visuelle (brief pour Gemini)

- **Fond** : noir profond `#0a0a0a`
- **Accents** : vert émeraude (`#4ade80`) pour le Wolof / blanc pour le français
- **Typographie** : serif élégant pour le texte Wolof, sans-serif system pour l'UI
- **Mobile-first** : max-width 420px, centré, conçu pour le pouce
- **Carte** : animation flip 3D CSS (rotateY 180°), grande, avec légère ombre
- **Ambiance** : premium, épuré, sombre — comme une app de méditation ou de luxe
- **Pas d'images** — texte et audio seulement
- **Animations subtiles** : entrée des cartes (fade+slide), transition entre leçons

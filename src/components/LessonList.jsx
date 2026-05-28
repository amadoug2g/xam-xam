/**
 * LessonList — Écran d'accueil
 * Affiche la liste des leçons disponibles avec titre, description, nb de cartes
 * Tap sur une leçon → onSelect(lessonId)
 */

import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'

export default function LessonList({ onSelect }) {
  // TODO: Gemini remplace ce composant avec l'UI finale
  return (
    <div>
      <h1>Xam-Xam</h1>
      {LESSONS.map(lesson => (
        <div key={lesson.id} onClick={() => onSelect(lesson.id)}>
          <h2>{lesson.title}</h2>
          <p>{lesson.description}</p>
          <span>{lesson.cards.length} cartes</span>
        </div>
      ))}
    </div>
  )
}

/**
 * LessonDetail — Détail d'une leçon
 * Affiche : titre, description, nombre de cartes, nb dues aujourd'hui
 * Bouton "Commencer" → onStart()
 * Bouton retour → onBack()
 */

import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'

export default function LessonDetail({ lessonId, onStart, onBack }) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) return null

  const stats = srs.getStats()

  // TODO: Gemini remplace ce composant avec l'UI finale
  return (
    <div>
      <button onClick={onBack}>← Retour</button>
      <h1>{lesson.title}</h1>
      <p>{lesson.description}</p>
      <p>{lesson.cards.length} cartes · {stats.due} à réviser</p>
      <button onClick={onStart}>Commencer</button>
    </div>
  )
}

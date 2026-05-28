/**
 * Session — Déroulement d'une session de révision
 *
 * Flow par carte :
 *   1. Audio WO joue automatiquement
 *   2. Texte WO affiché
 *   3. Tap → révèle texte FR + joue audio FR
 *   4. Grading 0-5 → SRS calcule next_due
 *   5. Carte suivante (ou écran "done")
 *
 * Props : lessonId, onDone()
 */

import { useState, useEffect, useRef } from 'react'
import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import FlipCard from './FlipCard'
import GradeBar from './GradeBar'

export default function Session({ lessonId, onDone }) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [grades, setGrades] = useState([])

  const cards = lesson?.cards || []
  const card = cards[idx]

  useEffect(() => {
    setFlipped(false)
    if (card?.audioWo) new Audio(card.audioWo).play().catch(() => {})
  }, [idx])

  function handleFlip() {
    if (flipped) return
    setFlipped(true)
    if (card?.audioFr) new Audio(card.audioFr).play().catch(() => {})
  }

  function handleGrade(g) {
    srs.update(card.id, g)
    setGrades(prev => [...prev, g])
    if (idx + 1 >= cards.length) onDone()
    else setIdx(i => i + 1)
  }

  if (!card) return null

  // TODO: Gemini remplace ce composant avec l'UI finale
  return (
    <div>
      <p>{idx + 1} / {cards.length}</p>
      <FlipCard card={card} flipped={flipped} onFlip={handleFlip} />
      {flipped && <GradeBar onGrade={handleGrade} />}
    </div>
  )
}

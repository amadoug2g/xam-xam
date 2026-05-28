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

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { applyOverrides } from '../core/cardOverrides'
import FlipCard from './FlipCard'
import GradeBar from './GradeBar'

export default function Session({ lessonId, onDone }) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [grades, setGrades] = useState([])

  const cards = applyOverrides(lesson?.cards || [])
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

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] px-5 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onDone} className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] active:scale-95 transition-transform">
          <X className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-card)] px-3 py-1 rounded-full">
          {idx + 1} / {cards.length}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--border-card)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-[var(--text-wolof)] rounded-full transition-all duration-500"
          style={{ width: `${((idx) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        <FlipCard card={card} flipped={flipped} onFlip={handleFlip} />
      </div>

      {/* Grade bar */}
      {flipped && <GradeBar onGrade={handleGrade} />}
    </div>
  )
}

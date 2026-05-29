import { useState, useEffect, useRef, useMemo } from 'react'
import { X, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { applyOverrides } from '../core/cardOverrides'
import { streak } from '../core/streak'
import FlipCard from './FlipCard'
import GradeBar from './GradeBar'

export default function Session({ lessonId, cards: cardsProp, onDone }) {
  const lesson = lessonId ? LESSONS.find(l => l.id === lessonId) : null
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [grades, setGrades] = useState([])
  const [done, setDone] = useState(false)
  const [swipeHint, setSwipeHint] = useState(null) // 'left' | 'right' | null
  const touchStart = useRef(null)

  const cards = useMemo(() => {
    const base = applyOverrides(cardsProp || lesson?.cards || [])
    const arr = [...base]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const card = cards[idx]

  useEffect(() => {
    setFlipped(false)
    setSwipeHint(null)
    if (card?.audioWo) new Audio(card.audioWo).play().catch(() => {})
  }, [idx])

  function handleFlip() {
    if (flipped) return
    setFlipped(true)
    if (card?.audioFr) new Audio(card.audioFr).play().catch(() => {})
  }

  function handleGrade(g) {
    srs.update(card.id, g)
    streak.touch()
    const next = [...grades, g]
    setGrades(next)
    if (idx + 1 >= cards.length) setDone(true)
    else setIdx(i => i + 1)
  }

  // Swipe handling
  function onTouchStart(e) {
    touchStart.current = e.touches[0].clientX
  }

  function onTouchMove(e) {
    if (!flipped || touchStart.current === null) return
    const dx = e.touches[0].clientX - touchStart.current
    if (Math.abs(dx) > 30) setSwipeHint(dx < 0 ? 'left' : 'right')
    else setSwipeHint(null)
  }

  function onTouchEnd(e) {
    if (!flipped || touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    setSwipeHint(null)
    if (Math.abs(dx) > 80) handleGrade(dx < 0 ? 1 : 5)
  }

  // Summary screen
  if (done) {
    const correct = grades.filter(g => g >= 4).length
    const total = grades.length
    const pct = Math.round((correct / total) * 100)
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg-app)] px-5 py-10 items-center justify-center gap-8 animate-fade-in-up">
        <div className="text-center">
          <div className="text-5xl mb-3">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Session terminée</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{total} cartes révisées</p>
        </div>

        <div className="w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border-card)] rounded-3xl p-6 flex flex-col gap-4">
          {/* Score ring */}
          <div className="flex items-center justify-center">
            <div className={`text-4xl font-extrabold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {pct}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
              <span className="text-xl font-bold text-emerald-400">{correct}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Je savais</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <XCircle className="w-5 h-5 text-red-400 mb-1" />
              <span className="text-xl font-bold text-red-400">{total - correct}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">À revoir</span>
            </div>
          </div>
        </div>

        <button
          onClick={onDone}
          className="w-full max-w-xs py-4 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
        >
          <Zap className="w-5 h-5 fill-current" />
          Retour à l'accueil
        </button>
      </div>
    )
  }

  if (!card) return null

  return (
    <div
      className="flex flex-col min-h-screen bg-[var(--bg-app)] px-5 py-6 select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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
          style={{ width: `${(idx / cards.length) * 100}%` }}
        />
      </div>

      {/* Swipe hint overlay */}
      {flipped && swipeHint && (
        <div className={`fixed inset-0 pointer-events-none z-20 flex items-center ${swipeHint === 'left' ? 'justify-start pl-8' : 'justify-end pr-8'}`}>
          <div className={`text-5xl font-black opacity-60 ${swipeHint === 'left' ? 'text-red-400' : 'text-emerald-400'}`}>
            {swipeHint === 'left' ? '✗' : '✓'}
          </div>
        </div>
      )}

      {/* Swipe hint text (only when flipped) */}
      {flipped && !swipeHint && (
        <p className="text-center text-[10px] text-[var(--text-muted)]/50 mb-1 font-mono">
          ← swipe ou utilise les boutons →
        </p>
      )}

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        <FlipCard card={card} flipped={flipped} onFlip={handleFlip} />
      </div>

      {/* Grade bar */}
      {flipped && <GradeBar onGrade={handleGrade} />}
    </div>
  )
}

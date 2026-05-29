import { useState, useEffect, useRef, useMemo } from 'react'
import { X, CheckCircle2, XCircle, Zap, Sun, Moon, Languages, Headphones } from 'lucide-react'
import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { applyOverrides } from '../core/cardOverrides'
import { streak } from '../core/streak'
import { useTheme } from '../core/useTheme'
import FlipCard from './FlipCard'
import GradeBar from './GradeBar'

export default function Session({ lessonId, cards: cardsProp, onDone, onRepeat }) {
  const lesson = lessonId ? LESSONS.find(l => l.id === lessonId) : null
  const [flipped, setFlipped] = useState(false)
  const [grades, setGrades] = useState([])
  const [done, setDone] = useState(false)
  const [failedCards, setFailedCards] = useState([])
  const [reversed, setReversed] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)
  const [queue, setQueue] = useState([])
  const audioRef = useRef(null)
  const { theme, toggleTheme } = useTheme()

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

  // Initialize queue from shuffled cards (once, on mount)
  useEffect(() => {
    setQueue([...cards])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset flip + play audio whenever the front card changes or mode switches
  const currentCardId = queue[0]?.id
  useEffect(() => {
    if (!currentCardId) return
    setFlipped(false)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    const frontCard = queue[0]
    const src = reversed ? frontCard?.audioFr : frontCard?.audioWo
    if (src) {
      const a = new Audio(src)
      audioRef.current = a
      a.play().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCardId, reversed])

  // Fix 4: early return for empty cards
  if (cards.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg-app)] items-center justify-center gap-4">
        <p className="text-[var(--text-muted)] text-sm">Aucune carte à réviser</p>
        <button
          onClick={onDone}
          className="px-6 py-3 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold active:scale-95 transition-transform"
        >
          Retour
        </button>
      </div>
    )
  }

  const card = queue[0]

  function handleFlip() {
    if (flipped) return
    setFlipped(true)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    const src = reversed ? card?.audioWo : card?.audioFr
    if (src) {
      const a = new Audio(src)
      audioRef.current = a
      a.play().catch(() => {})
    }
  }

  function handleGrade(g) {
    srs.update(card.id, g)
    streak.touch()
    setGrades(prev => [...prev, g])
    if (g < 3) setFailedCards(fc => [...fc, card])
    setQueue(q => {
      const [current, ...rest] = q
      if (g < 3) {
        // Failed — re-queue at the end
        const next = [...rest, current]
        if (next.length === 0) setDone(true)
        return next
      } else {
        // Passed — remove from queue
        if (rest.length === 0) setDone(true)
        return rest
      }
    })
    setFlipped(false)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
  }

  // Summary screen
  if (done) {
    const correct = grades.filter(g => g >= 4).length
    const total = grades.length
    const pct = Math.round((correct / total) * 100)
    const uniqueFailedCards = [...new Map(failedCards.map(c => [c.id, c])).values()]
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

        {uniqueFailedCards.length > 0 && (
          <div className="w-full max-w-xs">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              À revoir ({uniqueFailedCards.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {uniqueFailedCards.map(c => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-sm font-semibold text-[var(--text-wolof)]">{c.wo}</span>
                  <span className="text-xs text-[var(--text-muted)]">{c.fr}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {onRepeat && (
          <button
            onClick={onRepeat}
            className={`w-full max-w-xs py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg ${uniqueFailedCards.length > 0 ? 'bg-[var(--text-wolof)] text-[var(--accent-btn-text)]' : 'bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-primary)]'}`}
          >
            <Zap className="w-5 h-5 fill-current" />
            Répéter la session
          </button>
        )}

        <button
          onClick={onDone}
          className={`w-full max-w-xs py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg ${uniqueFailedCards.length > 0 || !onRepeat ? 'bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-primary)]' : 'bg-[var(--text-wolof)] text-[var(--accent-btn-text)]'}`}
        >
          Terminer
        </button>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] px-5 py-6 select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onDone} className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] active:scale-95 transition-transform">
          <X className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-card)] px-3 py-1 rounded-full">
          {grades.length + 1} / {grades.length + queue.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAudioOnly(a => !a); setFlipped(false); setQueue([...cards]) }}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${audioOnly ? 'bg-[var(--text-wolof)]/20 border-[var(--text-wolof)]/40 text-[var(--text-wolof)]' : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)]'}`}
            title={audioOnly ? 'Mode audio uniquement (actif)' : 'Activer le mode audio uniquement'}
          >
            <Headphones className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setReversed(r => !r); setFlipped(false); setQueue([...cards]) }}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${reversed ? 'bg-[var(--text-wolof)]/20 border-[var(--text-wolof)]/40 text-[var(--text-wolof)]' : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)]'}`}
            title={reversed ? 'Mode FR→Wolof (actif)' : 'Mode Wolof→FR (actif)'}
          >
            <Languages className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-wolof)] active:scale-95 transition-transform"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#fbbf24]" /> : <Moon className="w-4 h-4 text-[#0f766e]" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--border-card)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-[var(--text-wolof)] rounded-full transition-all duration-500"
          style={{ width: `${(grades.length / (grades.length + queue.length)) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col justify-center">
        <FlipCard card={card} flipped={flipped} onFlip={handleFlip} reversed={reversed} audioOnly={audioOnly} />
      </div>

      {/* Grade bar */}
      {flipped && <GradeBar onGrade={handleGrade} />}
    </div>
  )
}

import { useState } from 'react'
import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { applyOverrides } from '../core/cardOverrides'
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react'

export default function LessonSelector({ onStart, onBack }) {
  const activeLessons = LESSONS.filter(l => l.cards.length > 0 && l.cards.some(c => c.wo !== '...'))

  const dueByLesson = Object.fromEntries(
    activeLessons.map(l => [
      l.id,
      l.cards.filter(c => { const s = srs.get(c.id); return !s.mastered && s.nextDue <= Date.now() }).length
    ])
  )

  const hasAnyDue = activeLessons.some(l => dueByLesson[l.id] > 0)

  const [selected, setSelected] = useState(() => {
    const withDue = activeLessons.filter(l => dueByLesson[l.id] > 0).map(l => l.id)
    return new Set(withDue.length > 0 ? withDue : [])
  })

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAllDue() {
    setSelected(new Set(activeLessons.filter(l => dueByLesson[l.id] > 0).map(l => l.id)))
  }

  function selectAll() {
    setSelected(new Set(activeLessons.map(l => l.id)))
  }

  function handleStart() {
    const selectedLessons = activeLessons.filter(l => selected.has(l.id))
    const merged = selectedLessons.flatMap(l => applyOverrides(l.cards).filter(c => c.wo !== '...'))
    onStart(merged)
  }

  const totalSelected = activeLessons
    .filter(l => selected.has(l.id))
    .reduce((acc, l) => acc + l.cards.filter(c => c.wo !== '...').length, 0)

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] px-5 py-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2.5 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] rounded-full text-[var(--text-muted)] active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] font-semibold">
          Choisir les leçons
        </span>
        <div className="w-10" />
      </div>

      {/* Shortcuts */}
      <div className="flex gap-2 mb-4">
        {hasAnyDue && (
          <button
            onClick={selectAllDue}
            className="flex-1 py-2 text-xs font-semibold bg-[var(--text-wolof)]/10 border border-[var(--text-wolof)]/30 text-[var(--text-wolof)] rounded-xl active:scale-[0.98] transition-all"
          >
            Sélectionner les dûs
          </button>
        )}
        <button
          onClick={selectAll}
          className="flex-1 py-2 text-xs font-semibold bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-muted)] rounded-xl active:scale-[0.98] transition-all"
        >
          Tout sélectionner
        </button>
      </div>

      {/* Lesson list */}
      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pb-4">
        {activeLessons.map(lesson => {
          const isSelected = selected.has(lesson.id)
          const due = dueByLesson[lesson.id]
          const total = lesson.cards.filter(c => c.wo !== '...').length

          return (
            <button
              key={lesson.id}
              onClick={() => toggle(lesson.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 text-left active:scale-[0.98] ${
                isSelected
                  ? 'bg-[var(--text-wolof)]/10 border-[var(--text-wolof)]/40'
                  : 'bg-[var(--bg-card)] border-[var(--border-card)]'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                isSelected ? 'border-[var(--text-wolof)] bg-[var(--text-wolof)]' : 'border-[var(--text-muted)]'
              }`}>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-[var(--text-wolof)]' : 'text-[var(--text-primary)]'}`}>
                  {lesson.title}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {total} cartes{due > 0 ? ` · ${due} dûes` : ''}
                </p>
              </div>

              {/* Due badge */}
              {due > 0 && (
                <span className="text-xs font-bold text-[var(--text-wolof)] bg-[var(--text-wolof)]/10 px-2 py-0.5 rounded-full shrink-0">
                  {due}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <div className="pt-4 border-t border-[var(--border-divider)]">
        <button
          onClick={handleStart}
          disabled={selected.size === 0}
          className="w-full py-4 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Zap className="w-5 h-5 fill-current" />
          {selected.size === 0
            ? 'Sélectionne des leçons'
            : `Lancer la session (${totalSelected} cartes)`}
        </button>
      </div>
    </div>
  )
}

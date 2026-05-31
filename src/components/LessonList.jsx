import { useState } from 'react'
import { lessonStore } from '../core/lessonStore'
import { srs } from '../core/srs'
import { streak as streakStore } from '../core/streak'
import { lessonVerified } from '../core/lessonVerified'
import { failedStore } from '../core/failedStore'
import { useTheme } from '../core/useTheme'
import { BookOpen, Sparkles, Clock, CheckCircle2, ChevronRight, Sun, Moon, Flame, Zap, Settings, ShieldCheck, Search, X, ListChecks, Headphones, RefreshCw } from 'lucide-react'

export default function LessonList({ onSelect, onReviewAll, onAdmin, onSelectLessons, onRetryFailed }) {
  const LESSONS = lessonStore.getLessons()
  const lastFailed = failedStore.get()
  const { theme, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // Streak
  const streakData = streakStore.get()
  const hasFreeze = streakStore.hasFreeze()
  const verifiedMap = lessonVerified.getAll()

  // Aggregate global statistics across all lessons
  const allCards = LESSONS.flatMap(l => l.cards || []).filter(c => c.wo !== '...')
  const totalCards = allCards.length

  const srsStates = allCards.map(c => srs.get(c.id))
  const masteredCount = srsStates.filter(s => s.mastered).length
  const dueCount = srsStates.filter(s => !s.mastered && s.nextDue <= Date.now()).length
  const dueCards = allCards.filter(c => { const s = srs.get(c.id); return !s.mastered && s.nextDue <= Date.now() })
  const progressPercent = totalCards > 0 ? Math.round(((masteredCount + (srsStates.filter(s => s.attempts > 0 && !s.mastered).length * 0.5)) / totalCards) * 100) : 0

  const lessonMap = Object.fromEntries(LESSONS.map(l => [l.id, l.title]))
  const searchResults = search.trim().length > 0
    ? allCards.filter(c =>
        c.wo !== '...' &&
        (c.wo.toLowerCase().includes(search.toLowerCase()) ||
         c.fr.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 30)
    : []

  return (
    <div className="flex flex-col min-h-screen px-5 py-6 bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300 animate-fade-in-up">
      {/* Premium Header with Theme Toggle */}
      <header className="mb-6 flex flex-col relative">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent">
            Xam-Xam<span className="text-[var(--text-wolof)]">.</span>
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold text-sm transition-colors duration-300 ${streakData.count > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-[var(--btn-secondary-bg)] border-[var(--btn-secondary-border)] text-[var(--text-muted)]'}`}>
              <Flame className={`w-4 h-4 ${streakData.count > 0 ? 'text-orange-400' : 'text-[var(--text-muted)]'}`} />
              <span>{streakData.count}</span>
              {hasFreeze && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" title="Freeze disponible" />
              )}
            </div>

            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              className="p-2 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-muted)] rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
              title="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onAdmin}
              className="p-2 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-muted)] rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
              title="Éditeur de cartes"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-wolof)] rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
              title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#fbbf24]" />
              ) : (
                <Moon className="w-4 h-4 text-[#0f766e]" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-mono uppercase tracking-widest transition-colors duration-300">
          Salaam aleekum 👋
        </p>
      </header>

      {/* Search bar — shown only when toggled open */}
      {searchOpen && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un mot..."
            className="w-full pl-9 pr-9 py-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--text-wolof)]/50 transition-colors"
          />
          <button
            onClick={() => { setSearch(''); setSearchOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search results */}
      {search.trim().length > 0 ? (
        <div className="flex flex-col gap-2 pb-8">
          {searchResults.length > 0 ? searchResults.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c.lessonId)}
              className="w-full text-left p-3.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl flex flex-col gap-0.5 active:scale-[0.98] transition-all hover:border-[var(--text-wolof)]/30"
            >
              <span className="text-sm font-semibold text-[var(--text-wolof)]">{c.wo}</span>
              <span className="text-xs text-[var(--text-muted)]">{c.fr}</span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono uppercase tracking-wide">{lessonMap[c.lessonId]}</span>
            </button>
          )) : (
            <p className="text-center text-sm text-[var(--text-muted)] py-8">Aucun résultat pour « {search} »</p>
          )}
        </div>
      ) : (
        <>

      {/* Global Progress Dashboard Card */}
      <div className="mb-8 p-5 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] rounded-2xl border border-[var(--border-card)] shadow-xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--text-wolof)]/5 rounded-full blur-2xl -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center gap-1.5 transition-colors duration-300">
          <Sparkles className="w-4 h-4 text-[var(--text-wolof)]" /> Votre Progression
        </h3>
        
        {/* Progress bar */}
        <div className="w-full bg-[var(--stats-bg)] h-2 rounded-full mb-5 overflow-hidden transition-colors duration-300">
          <div 
            className="bg-[var(--text-wolof)] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_var(--text-wolof)]"
            style={{ width: `${Math.max(4, progressPercent)}%` }}
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="flex flex-col p-2 bg-[var(--stats-bg)] rounded-xl border border-[var(--border-card)] transition-colors duration-300">
            <span className="text-xs text-[var(--text-muted)] font-medium flex justify-center items-center gap-1 transition-colors duration-300">
              <BookOpen className="w-3.5 h-3.5" /> Total
            </span>
            <span className="text-lg font-bold mt-0.5 text-[var(--text-primary)] transition-colors duration-300">{totalCards}</span>
          </div>
          <div className="flex flex-col p-2 bg-[var(--stats-bg)] rounded-xl border border-[var(--border-card)] transition-colors duration-300">
            <span className="text-xs text-[var(--text-muted)] font-medium flex justify-center items-center gap-1 transition-colors duration-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-wolof)]" /> Acquis
            </span>
            <span className="text-lg font-bold mt-0.5 text-[var(--text-wolof)] transition-colors duration-300">{masteredCount}</span>
          </div>
          <div className="flex flex-col p-2 bg-[var(--stats-bg)] rounded-xl border border-[var(--border-card)] transition-colors duration-300">
            <span className="text-xs text-[var(--text-muted)] font-medium flex justify-center items-center gap-1 transition-colors duration-300">
              <Clock className="w-3.5 h-3.5 text-[#ef4444]" /> Dûs
            </span>
            <span className="text-lg font-bold mt-0.5 text-[#ef4444]">{dueCount}</span>
          </div>
        </div>
      </div>

      {/* Global review CTA */}
      {dueCards.length > 0 && (
        <button
          onClick={() => onReviewAll(dueCards)}
          className="w-full py-4 px-5 mb-2 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 shadow-lg hover:opacity-90 relative overflow-hidden group"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>Réviser maintenant</span>
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm font-mono">{dueCards.length}</span>
          <span className="absolute right-4 w-8 h-8 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 opacity-20" />
        </button>
      )}

      {/* Multi-lesson selector */}
      <button
        onClick={onSelectLessons}
        className="w-full py-3 px-5 mb-2 rounded-2xl bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-muted)] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150"
      >
        <ListChecks className="w-4 h-4" />
        <span>Choisir les leçons</span>
      </button>

      {/* Last failed cards — persistent review */}
      {lastFailed.length > 0 && (
        <div className="mb-2 p-4 bg-amber-400/5 border border-amber-400/20 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">À retravailler</span>
              <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-full">{lastFailed.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onRetryFailed(lastFailed, false)}
              className="flex-1 py-2 rounded-xl bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-muted)] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Avec texte
            </button>
            <button
              onClick={() => onRetryFailed(lastFailed, true)}
              className="flex-1 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <Headphones className="w-3.5 h-3.5" />
              Sans texte
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Lesson List */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase px-1 transition-colors duration-300 flex items-center justify-between">
          <span>Vos Leçons</span>
          <span className="text-xs font-mono normal-case bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] px-2 py-0.5 rounded-full">{LESSONS.length} leçons</span>
        </h2>
        
        <div className="flex flex-col gap-3.5 pb-8">
          {LESSONS.map((lesson, index) => {
            const available = lesson.cards.length > 0 && lesson.cards.some(c => c.wo !== '...')
            const isVerified = !!verifiedMap[lesson.id]
            const lessonDueCount = available ? lesson.cards.filter(c => {
              const s = srs.get(c.id)
              return !s.mastered && s.nextDue <= Date.now()
            }).length : 0

            return (
              <button
                key={lesson.id}
                onClick={() => available && onSelect(lesson.id)}
                disabled={!available}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left group relative overflow-hidden shadow-md
                  ${available
                    ? 'bg-[var(--bg-card)] border-[var(--border-card)] hover:border-[var(--text-wolof)]/40 active:scale-[0.98] active:opacity-95 cursor-pointer'
                    : 'bg-[var(--bg-card)]/40 border-[var(--border-card)]/30 cursor-not-allowed opacity-40'
                  }`}
                style={{
                  animationDelay: `${index * 40}ms`,
                  animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
                }}
              >
                {/* Position number */}
                <span className="text-[11px] font-mono text-[var(--text-muted)] w-6 shrink-0 text-right mr-3 opacity-60">
                  {lesson.position}
                </span>

                <div className="flex-1 pr-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-base truncate transition-colors duration-150 ${available ? 'text-[var(--text-primary)] group-hover:text-[var(--text-wolof)]' : 'text-[var(--text-muted)]'}`}>
                      {lesson.title}
                    </h3>
                    {isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Leçon vérifiée" />
                    )}
                    {lessonDueCount > 0 && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--text-wolof)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--text-wolof)]"></span>
                      </span>
                    )}
                  </div>

                  {available && (
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] tracking-wider px-2 py-0.5 bg-[var(--btn-secondary-bg)] text-[var(--text-muted)] rounded-md font-medium border border-[var(--btn-secondary-border)] transition-colors duration-300">
                        {lesson.cards.length} cartes
                      </span>
                    </div>
                  )}
                </div>

                {available && (
                  <div className="p-2 bg-[var(--btn-secondary-bg)] rounded-xl border border-[var(--btn-secondary-border)] group-hover:bg-[var(--text-wolof)]/10 group-hover:border-[var(--text-wolof)]/30 transition-all duration-200 shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[var(--text-wolof)] transition-colors duration-150" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Version badge */}
      <div className="text-center py-4 pb-8">
        <span className="text-[10px] font-mono text-[var(--text-muted)]/50 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] px-2.5 py-1 rounded-full">
          v{__APP_VERSION__}
        </span>
      </div>
        </>
      )}
    </div>
  )
}

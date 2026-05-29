import { useState } from 'react'
import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { cardOverrides } from '../core/cardOverrides'
import { ArrowLeft, Play, BookOpen, CheckCircle2, Clock, Volume2, Sun, Moon, Pencil, Check, X, Eye, EyeOff } from 'lucide-react'

export default function LessonDetail({ lessonId, onStart, onBack }) {
  // Local state theme sync
  const [theme, setTheme] = useState(() => {
    const t = localStorage.getItem('xam-xam-theme') || 'dark'
    if (t === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    return t
  })

  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) return null

  const [overrides, setOverrides] = useState(() => cardOverrides.getAll())
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ wo: '', fr: '' })
  const [showTranslation, setShowTranslation] = useState(false)

  const cards = (lesson.cards || []).map(c => overrides[c.id] ? { ...c, ...overrides[c.id] } : c)
  const total = cards.length

  function startEdit(card) {
    setEditing(card.id)
    setEditForm({ wo: card.wo, fr: card.fr })
  }

  function saveEdit(cardId) {
    cardOverrides.set(cardId, editForm)
    setOverrides(cardOverrides.getAll())
    setEditing(null)
  }

  // Calculate precise stats specifically for this lesson's card set
  const cardSrsStates = cards.map(c => srs.get(c.id))
  const mastered = cardSrsStates.filter(s => s.mastered).length
  const due = cardSrsStates.filter(s => !s.mastered && s.nextDue <= Date.now()).length
  const studied = cardSrsStates.filter(s => s.attempts > 0).length

  // Function to simulate listening to pronunciation on word preview
  const playPreviewAudio = (card, e) => {
    e.stopPropagation()
    if (card?.audioWo) {
      new Audio(card.audioWo).play().catch(() => {})
    }
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('xam-xam-theme', nextTheme)
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    setTheme(nextTheme)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] px-5 py-6 animate-fade-in-up justify-between transition-colors duration-300">
      <div>
        {/* Navigation Header */}
        <div className="mb-5 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] active:scale-90 border border-[var(--btn-secondary-border)] rounded-full transition-all duration-150 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-sm"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <span className="text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] font-semibold transition-colors duration-300">
            Détail de la leçon
          </span>

          {/* Theme Toggler in details screen */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-wolof)] rounded-full transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
            title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#fbbf24]" />
            ) : (
              <Moon className="w-4 h-4 text-[#0f766e]" />
            )}
          </button>
        </div>

        {/* Hero Card */}
        <div className="mb-6 p-5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl relative overflow-hidden shadow-lg transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--text-wolof)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 leading-snug pl-1.5 transition-colors duration-300">
            {lesson.title}
          </h1>
          <p className="text-sm text-[var(--text-muted)] pl-1.5 leading-relaxed transition-colors duration-300">
            {lesson.description}
          </p>
        </div>

        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-3 px-1 transition-colors duration-300">
            Statistiques de Révision
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Total cards */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-3.5 flex flex-col text-center transition-all duration-300">
              <span className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-center gap-1 mb-1 transition-colors duration-300">
                <BookOpen className="w-3.5 h-3.5" /> Cartes
              </span>
              <span className="text-xl font-bold text-[var(--text-primary)] mt-1 transition-colors duration-300">{total}</span>
            </div>

            {/* Mastered cards */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-3.5 flex flex-col text-center transition-all duration-300">
              <span className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-center gap-1 mb-1 transition-colors duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-wolof)]" /> Acquis
              </span>
              <span className="text-xl font-bold text-[var(--text-wolof)] mt-1 transition-colors duration-300">{mastered}</span>
            </div>

            {/* Due today */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-3.5 flex flex-col text-center transition-all duration-300">
              <span className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-center gap-1 mb-1 transition-colors duration-300">
                <Clock className="w-3.5 h-3.5 text-[#ef4444]" /> Dûs
              </span>
              <span className="text-xl font-bold text-[#ef4444] mt-1 transition-colors duration-300">{due}</span>
            </div>
          </div>
        </section>

        {/* Top Start Button */}
        <button
          onClick={onStart}
          className="w-full mb-8 py-4 px-6 bg-[var(--text-wolof)] text-[var(--accent-btn-text)] rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 shadow-md hover:opacity-90 relative overflow-hidden group"
        >
          <Play className="w-5 h-5 fill-current text-[var(--accent-btn-text)]" />
          <span>
            {due > 0 ? 'Réviser maintenant' : studied > 0 ? 'Reprendre la session' : 'Commencer la leçon'}
          </span>
          <span className="absolute right-4 w-8 h-8 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 opacity-20" />
        </button>

        {/* Vocab preview list */}
        <section className="mb-6 flex-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase transition-colors duration-300">
              Cartes ({total})
            </h2>
            <button
              onClick={() => setShowTranslation(v => !v)}
              className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] px-2.5 py-1 rounded-full hover:text-[var(--text-wolof)] transition-colors duration-150"
            >
              {showTranslation ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showTranslation ? 'Masquer trad.' : 'Voir trad.'}
            </button>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
            {cards.map((c) => {
              const isEditing = editing === c.id
              return (
                <div
                  key={c.id}
                  className="p-3 bg-[var(--preview-bg)] rounded-xl border border-[var(--border-card)] transition-all duration-150 shadow-sm"
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        className="w-full text-sm font-semibold bg-[var(--bg-app)] border border-[var(--text-wolof)]/40 rounded-lg px-2 py-1 text-[var(--text-wolof)] focus:outline-none focus:border-[var(--text-wolof)]"
                        placeholder="Wolof"
                        value={editForm.wo}
                        onChange={e => setEditForm(f => ({ ...f, wo: e.target.value }))}
                      />
                      <input
                        className="w-full text-sm bg-[var(--bg-app)] border border-[var(--border-card)] rounded-lg px-2 py-1 text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-wolof)]"
                        placeholder="Français"
                        value={editForm.fr}
                        onChange={e => setEditForm(f => ({ ...f, fr: e.target.value }))}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditing(null)}
                          className="p-1.5 rounded-lg bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-muted)] active:scale-90 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => saveEdit(c.id)}
                          className="p-1.5 rounded-lg bg-[var(--text-wolof)]/20 border border-[var(--text-wolof)]/40 text-[var(--text-wolof)] active:scale-90 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-wolof)] tracking-wide transition-colors duration-300 truncate">
                            {c.wo}
                          </p>
                          {overrides[c.id] && (
                            <span className="text-[9px] text-[var(--text-muted)] bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] px-1.5 rounded shrink-0">modifié</span>
                          )}
                        </div>
                        {showTranslation && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 transition-colors duration-300">
                            {c.fr}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.audioWo && (
                          <button
                            onClick={(e) => playPreviewAudio(c, e)}
                            className="p-1.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] border border-[var(--btn-secondary-border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-wolof)] transition-all duration-150 active:scale-90"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] border border-[var(--btn-secondary-border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-wolof)] transition-all duration-150 active:scale-90"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Footer Start Button */}
      <div className="mt-4 pt-4 border-t border-[var(--border-divider)] transition-colors duration-300">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 bg-[var(--text-wolof)] text-[var(--accent-btn-text)] rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 shadow-md hover:opacity-90 relative overflow-hidden group"
        >
          <Play className="w-5 h-5 fill-current text-[var(--accent-btn-text)]" />
          <span>
            {due > 0 ? 'Réviser maintenant' : studied > 0 ? 'Reprendre la session' : 'Commencer la leçon'}
          </span>
          <span className="absolute right-4 w-8 h-8 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 opacity-20" />
        </button>
      </div>
    </div>
  )
}

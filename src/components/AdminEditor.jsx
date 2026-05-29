import { useState, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, Check } from 'lucide-react'
import { LESSONS } from '../data/mock'
import { cardOverrides } from '../core/cardOverrides'

const BASE = import.meta.env.BASE_URL

const AUDIO_FILES = {
  temps:            [...Array(14)].flatMap((_, i) => [`${i * 2 + 2}_fr.mp3`, `${i * 2 + 3}_wo.mp3`]),
  espace:           [...Array(11)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
  questions:        [...Array(17)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
  'mots-quotidiens':[...Array(19)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
  compter:          [...Array(32)].map((_, i) => `${String(i).padStart(2, '0')}_wo.mp3`),
}

export default function AdminEditor({ onBack }) {
  const activeLessons = LESSONS.filter(l => l.cards.length > 0 && AUDIO_FILES[l.id])

  const [lessonId, setLessonId] = useState(activeLessons[0]?.id || 'compter')
  const [cardIdx, setCardIdx] = useState(0)
  const [overrides, setOverrides] = useState(() => cardOverrides.getAll())
  const [sheet, setSheet] = useState(null) // 'audioFr' | 'audioWo' | null
  const [sheetPick, setSheetPick] = useState(null)
  const audioRef = useRef(null)

  const lesson = LESSONS.find(l => l.id === lessonId)
  const cards = lesson?.cards || []
  const card = cards[cardIdx]
  const audioFiles = AUDIO_FILES[lessonId] || []
  const ov = overrides[card?.id] || {}
  const current = card ? { ...card, ...ov } : null

  function save(cardId, patch) {
    const all = cardOverrides.getAll()
    all[cardId] = { ...(all[cardId] || {}), ...patch }
    localStorage.setItem('xam-xam-card-overrides', JSON.stringify(all))
    setOverrides({ ...all })
  }

  function openSheet(field) {
    const currentVal = field === 'audioFr' ? current?.audioFr : current?.audioWo
    setSheetPick(currentVal ? currentVal.split('/').pop() : null)
    setSheet(field)
  }

  function confirmSheet() {
    if (!card || !sheet) return
    const fullUrl = sheetPick ? `${BASE}audio/${lessonId}/${sheetPick}` : null
    save(card.id, { [sheet]: fullUrl })
    setSheet(null)
  }

  function playAudio(url) {
    if (audioRef.current) audioRef.current.pause()
    const a = new Audio(url)
    audioRef.current = a
    a.play().catch(() => {})
  }

  function changeLesson(id) {
    setLessonId(id)
    setCardIdx(0)
    setSheet(null)
  }

  if (!card || !current) return null

  const hasOverride = !!overrides[card.id]

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">

      {/* Sticky header */}
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-card)] sticky top-0 bg-[var(--bg-app)] z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] active:scale-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
        <select
          value={lessonId}
          onChange={e => changeLesson(e.target.value)}
          className="flex-1 bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm font-medium outline-none"
        >
          {activeLessons.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--border-card)] flex-shrink-0">
        <div
          className="h-full bg-[var(--text-wolof)] transition-all duration-300"
          style={{ width: `${((cardIdx + 1) / cards.length) * 100}%` }}
        />
      </div>

      <main className="flex-1 px-4 py-5 flex flex-col gap-3.5 max-w-lg mx-auto w-full pb-8">

        {/* Counter + badge */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Carte {cardIdx + 1} / {cards.length}
          </span>
          {hasOverride && (
            <span className="text-[10px] font-bold text-[var(--text-wolof)] bg-[var(--text-wolof)]/10 border border-[var(--text-wolof)]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> modifié
            </span>
          )}
        </div>

        {/* Audio FR — hidden for compter */}
        {lessonId !== 'compter' && (
          <AudioField
            label="Audio Français"
            value={current.audioFr}
            onPick={() => openSheet('audioFr')}
            onPlay={current.audioFr ? () => playAudio(current.audioFr) : null}
          />
        )}

        {/* Audio WO */}
        <AudioField
          label="Audio Wolof"
          value={current.audioWo}
          onPick={() => openSheet('audioWo')}
          onPlay={current.audioWo ? () => playAudio(current.audioWo) : null}
        />

        {/* Texte FR */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Texte Français
          </div>
          <input
            className="w-full bg-transparent px-4 pt-1 pb-4 text-sm text-[var(--text-primary)] outline-none"
            placeholder="Traduction française…"
            value={ov.fr ?? current.fr ?? ''}
            onChange={e => save(card.id, { fr: e.target.value })}
          />
        </div>

        {/* Texte WO */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Texte Wolof
          </div>
          <input
            className="w-full bg-transparent px-4 pt-1 pb-4 text-sm text-[var(--text-wolof)] font-medium outline-none"
            placeholder="Mot / phrase en Wolof…"
            value={ov.wo ?? current.wo ?? ''}
            onChange={e => save(card.id, { wo: e.target.value })}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => { setSheet(null); setCardIdx(i => Math.max(0, i - 1)) }}
            disabled={cardIdx === 0}
            className="flex-1 py-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] font-semibold text-sm disabled:opacity-30 active:scale-[0.97] transition-all flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Préc.
          </button>
          <button
            onClick={() => { setSheet(null); setCardIdx(i => Math.min(cards.length - 1, i + 1)) }}
            disabled={cardIdx === cards.length - 1}
            className="flex-1 py-3.5 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold text-sm disabled:opacity-30 active:scale-[0.97] transition-all flex items-center justify-center gap-1"
          >
            Suiv. <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Bottom sheet */}
      {sheet && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSheet(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] rounded-t-3xl z-50 flex flex-col max-h-[75dvh]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="w-10 h-1 bg-[var(--border-card)] rounded-full mx-auto mt-3 flex-shrink-0" />
            <div className="px-5 py-3 text-sm font-bold text-[var(--text-muted)] border-b border-[var(--border-card)] flex-shrink-0">
              {sheet === 'audioFr' ? 'Choisir Audio Français' : 'Choisir Audio Wolof'}
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              {/* None option */}
              <div
                onClick={() => setSheetPick(null)}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors active:bg-[var(--btn-secondary-bg)] ${sheetPick === null ? 'bg-[var(--text-wolof)]/10' : ''}`}
              >
                <div className="w-8 h-8 flex-shrink-0" />
                <span className={`flex-1 text-sm italic ${sheetPick === null ? 'text-[var(--text-wolof)] font-bold' : 'text-[var(--text-muted)]'}`}>
                  — Aucun —
                </span>
                {sheetPick === null && <Check className="w-4 h-4 text-[var(--text-wolof)] flex-shrink-0" />}
              </div>

              {audioFiles.map(f => (
                <div
                  key={f}
                  onClick={() => setSheetPick(f)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors active:bg-[var(--btn-secondary-bg)] ${sheetPick === f ? 'bg-[var(--text-wolof)]/10' : ''}`}
                >
                  <button
                    onClick={e => { e.stopPropagation(); playAudio(`${BASE}audio/${lessonId}/${f}`) }}
                    className="w-8 h-8 rounded-lg bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-wolof)] flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <span className={`flex-1 text-sm font-mono truncate ${sheetPick === f ? 'text-[var(--text-wolof)] font-bold' : 'text-[var(--text-primary)]'}`}>
                    {f}
                  </span>
                  {sheetPick === f && <Check className="w-4 h-4 text-[var(--text-wolof)] flex-shrink-0" />}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-[var(--border-card)] flex-shrink-0">
              <button
                onClick={confirmSheet}
                className="w-full py-3.5 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold text-sm active:scale-[0.98] transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function AudioField({ label, value, onPick, onPlay }) {
  const filename = value ? value.split('/').pop() : null
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
      <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </div>
      <div className="flex items-center gap-2 px-4 pb-4">
        <div className={`flex-1 text-sm font-mono px-3 py-2 rounded-xl border truncate ${filename ? 'text-[var(--text-wolof)] border-[var(--text-wolof)]/30 bg-[var(--text-wolof)]/5' : 'text-[var(--text-muted)] border-[var(--border-card)] italic'}`}>
          {filename || '— aucun —'}
        </div>
        {onPlay && (
          <button
            onClick={onPlay}
            className="w-9 h-9 rounded-xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onPick}
          className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex-shrink-0 active:scale-90 transition-all whitespace-nowrap"
        >
          Choisir
        </button>
      </div>
    </div>
  )
}

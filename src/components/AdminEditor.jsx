import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2, Check, ShieldCheck, Plus, Trash2, Download } from 'lucide-react'
import { lessonStore } from '../core/lessonStore'
import { lessonVerified } from '../core/lessonVerified'

const BASE = import.meta.env.BASE_URL

const AUDIO_FILES = {
  temps:             [...Array(14)].flatMap((_, i) => [`${i * 2 + 2}_fr.mp3`, `${i * 2 + 3}_wo.mp3`]),
  espace:            [...Array(11)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
  questions:         [...Array(17)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
  'mots-quotidiens': [...Array(19)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
  compter:           [...Array(32)].map((_, i) => `${String(i).padStart(2, '0')}_wo.mp3`),
  langues:           [...Array(10)].flatMap((_, i) => [`${String(i).padStart(2, '0')}_fr.mp3`, `${String(i).padStart(2, '0')}_wo.mp3`]),
}

export default function AdminEditor({ onBack }) {
  const [lessons, setLessons] = useState(() => lessonStore.getLessons())
  const [lessonId, setLessonId] = useState(() => lessonStore.getLessons()[0]?.id || '')
  const [cardIdx, setCardIdx] = useState(0)
  const [verified, setVerified] = useState(() => lessonVerified.getAll())
  const [sheet, setSheet] = useState(null)
  const [sheetPick, setSheetPick] = useState(null)
  const [sheetText, setSheetText] = useState('')
  const [exported, setExported] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const audioRef = useRef(null)

  const lesson = lessons.find(l => l.id === lessonId)
  const cards = lesson?.cards || []
  const card = cards[cardIdx] || null
  const audioFiles = AUDIO_FILES[lessonId] || []
  const isVerified = !!verified[lessonId]

  useEffect(() => { setDeleteConfirm(false) }, [cardIdx, lessonId])

  function refresh() {
    setLessons(lessonStore.getLessons())
  }

  function changeLesson(id) {
    setLessonId(id)
    setCardIdx(0)
    setSheet(null)
    setDeleteConfirm(false)
  }

  function openSheet(field) {
    const currentVal = field === 'audioFr' ? card?.audioFr : card?.audioWo
    const filename = currentVal ? currentVal.split('/').pop() : null
    setSheetPick(filename || null)
    setSheetText(filename || '')
    setSheet(field)
  }

  function confirmSheet() {
    if (!card || !sheet) return
    const filename = sheetText.trim() || sheetPick
    const fullUrl = filename ? `${BASE}audio/${lessonId}/${filename}` : null
    lessonStore.updateCard(card.id, { [sheet]: fullUrl })
    refresh()
    setSheet(null)
  }

  function playAudio(url) {
    if (audioRef.current) audioRef.current.pause()
    const a = new Audio(url)
    audioRef.current = a
    a.play().catch(() => {})
  }

  function handleTextChange(field, value) {
    if (!card) return
    lessonStore.updateCard(card.id, { [field]: value })
    refresh()
  }

  function addCard() {
    lessonStore.addCard(lessonId)
    const updated = lessonStore.getLessons()
    setLessons(updated)
    const newCards = updated.find(l => l.id === lessonId)?.cards || []
    setCardIdx(newCards.length - 1)
    setDeleteConfirm(false)
  }

  function deleteCard() {
    if (!card) return
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    lessonStore.deleteCard(card.id)
    refresh()
    setCardIdx(i => Math.max(0, i - 1))
    setSheet(null)
    setDeleteConfirm(false)
  }

  function handleExport() {
    const json = lessonStore.exportToJSON()
    navigator.clipboard.writeText(json).catch(() => {})
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  function toggleVerified() {
    lessonVerified.setVerified(lessonId, !isVerified)
    setVerified(lessonVerified.getAll())
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">

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
          {lessons.map(l => (
            <option key={l.id} value={l.id}>{l.position}. {l.title}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          title="Exporter JSON (presse-papier)"
          className={`p-2 rounded-full border active:scale-90 transition-all ${exported ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-[var(--btn-secondary-bg)] border-[var(--btn-secondary-border)] text-[var(--text-muted)]'}`}
        >
          <Download className="w-4 h-4" />
        </button>
      </header>

      {cards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-[var(--text-muted)] text-sm text-center">Cette leçon n'a pas encore de cartes.</p>
          <button
            onClick={addCard}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[var(--text-wolof)] text-[var(--accent-btn-text)] font-bold text-sm active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" /> Nouvelle carte
          </button>
        </div>
      ) : (
        <>
          <div className="h-1 bg-[var(--border-card)] flex-shrink-0">
            <div
              className="h-full bg-[var(--text-wolof)] transition-all duration-300"
              style={{ width: `${((cardIdx + 1) / cards.length) * 100}%` }}
            />
          </div>

          <main className="flex-1 px-4 py-5 flex flex-col gap-3.5 max-w-lg mx-auto w-full pb-8">

            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Carte {cardIdx + 1} / {cards.length}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">{card.id}</span>
            </div>

            <AudioField
              label="Audio Français"
              value={card.audioFr}
              onPick={() => openSheet('audioFr')}
              onPlay={card.audioFr ? () => playAudio(card.audioFr) : null}
            />

            <AudioField
              label="Audio Wolof"
              value={card.audioWo}
              onPick={() => openSheet('audioWo')}
              onPlay={card.audioWo ? () => playAudio(card.audioWo) : null}
            />

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Texte Français
              </div>
              <input
                className="w-full bg-transparent px-4 pt-1 pb-4 text-sm text-[var(--text-primary)] outline-none"
                placeholder="Traduction française…"
                value={card.fr ?? ''}
                onChange={e => handleTextChange('fr', e.target.value)}
              />
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Texte Wolof
              </div>
              <input
                className="w-full bg-transparent px-4 pt-1 pb-4 text-sm text-[var(--text-wolof)] font-medium outline-none"
                placeholder="Mot / phrase en Wolof…"
                value={card.wo ?? ''}
                onChange={e => handleTextChange('wo', e.target.value)}
              />
            </div>

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

            <button
              onClick={addCard}
              className="w-full py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-muted)] font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Nouvelle carte
            </button>

            <button
              onClick={deleteCard}
              className={`w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border ${
                deleteConfirm
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {deleteConfirm ? 'Confirmer la suppression ?' : 'Supprimer cette carte'}
            </button>

            <button
              onClick={toggleVerified}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all border ${
                isVerified
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-muted)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {isVerified ? 'Leçon vérifiée ✓' : 'Marquer comme vérifié'}
            </button>
          </main>
        </>
      )}

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

            <div className="px-4 py-3 border-b border-[var(--border-card)] flex-shrink-0">
              <input
                className="w-full bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm font-mono outline-none placeholder:text-[var(--text-muted)]"
                placeholder="ex: 01_fr.mp3  (ou saisir manuellement)"
                value={sheetText}
                onChange={e => { setSheetText(e.target.value); setSheetPick(null) }}
              />
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              <div
                onClick={() => { setSheetPick(null); setSheetText('') }}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors active:bg-[var(--btn-secondary-bg)] ${!sheetPick && !sheetText ? 'bg-[var(--text-wolof)]/10' : ''}`}
              >
                <div className="w-8 h-8 flex-shrink-0" />
                <span className={`flex-1 text-sm italic ${!sheetPick && !sheetText ? 'text-[var(--text-wolof)] font-bold' : 'text-[var(--text-muted)]'}`}>
                  — Aucun —
                </span>
                {!sheetPick && !sheetText && <Check className="w-4 h-4 text-[var(--text-wolof)] flex-shrink-0" />}
              </div>

              {audioFiles.map(f => (
                <div
                  key={f}
                  onClick={() => { setSheetPick(f); setSheetText(f) }}
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

              {audioFiles.length === 0 && (
                <p className="text-center text-xs text-[var(--text-muted)] py-6 italic">
                  Pas de liste prédéfinie — saisir le nom du fichier ci-dessus.
                </p>
              )}
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

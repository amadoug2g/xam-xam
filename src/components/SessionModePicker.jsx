import { Headphones, BookOpen, ArrowLeft } from 'lucide-react'

export default function SessionModePicker({ onSelect, onBack }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] px-5 py-8 animate-fade-in-up">
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="p-2.5 bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] rounded-full text-[var(--text-muted)] active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mode de révision</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Comment veux-tu réviser ?</p>
        </div>

        <button
          onClick={() => onSelect(false)}
          className="w-full p-6 bg-[var(--bg-card)] border-2 border-[var(--border-card)] hover:border-[var(--text-wolof)]/40 rounded-3xl flex flex-col items-center gap-3 active:scale-[0.98] transition-all shadow-md"
        >
          <div className="p-4 bg-[var(--text-wolof)]/10 rounded-2xl">
            <BookOpen className="w-8 h-8 text-[var(--text-wolof)]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-[var(--text-primary)]">Avec le texte</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Vois les mots écrits — idéal pour apprendre</p>
          </div>
        </button>

        <button
          onClick={() => onSelect(true)}
          className="w-full p-6 bg-[var(--bg-card)] border-2 border-[var(--border-card)] hover:border-amber-400/40 rounded-3xl flex flex-col items-center gap-3 active:scale-[0.98] transition-all shadow-md"
        >
          <div className="p-4 bg-amber-400/10 rounded-2xl">
            <Headphones className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-[var(--text-primary)]">Sans texte</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Entraîne l'oreille — plus difficile, plus efficace</p>
          </div>
        </button>
      </div>
    </div>
  )
}

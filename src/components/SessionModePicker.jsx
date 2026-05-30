import { useState } from 'react'
import { Headphones, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react'

export default function SessionModePicker({ onSelect, onBack }) {
  const [reversed, setReversed] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)

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

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paramètres de session</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Choisis comment tu veux réviser</p>
        </div>

        {/* Direction */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-1">Direction</p>
          <div className="flex gap-3">
            <button
              onClick={() => setReversed(false)}
              className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 active:scale-[0.97] transition-all ${!reversed ? 'border-[var(--text-wolof)] bg-[var(--text-wolof)]/10 text-[var(--text-wolof)]' : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)]'}`}
            >
              <span className="text-sm font-semibold">Wolof → FR</span>
            </button>
            <button
              onClick={() => setReversed(true)}
              className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 active:scale-[0.97] transition-all ${reversed ? 'border-[var(--text-wolof)] bg-[var(--text-wolof)]/10 text-[var(--text-wolof)]' : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)]'}`}
            >
              <span className="text-sm font-semibold">FR → Wolof</span>
            </button>
          </div>
        </div>

        {/* Mode */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-1">Mode</p>
          <div className="flex gap-3">
            <button
              onClick={() => setAudioOnly(false)}
              className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 active:scale-[0.97] transition-all ${!audioOnly ? 'border-[var(--text-wolof)] bg-[var(--text-wolof)]/10 text-[var(--text-wolof)]' : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)]'}`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-semibold">Avec texte</span>
            </button>
            <button
              onClick={() => setAudioOnly(true)}
              className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 active:scale-[0.97] transition-all ${audioOnly ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)]'}`}
            >
              <Headphones className="w-5 h-5" />
              <span className="text-sm font-semibold">Sans texte</span>
            </button>
          </div>
        </div>

        {/* Start */}
        <button
          onClick={() => onSelect({ audioOnly, reversed })}
          className="w-full py-4 bg-[var(--text-wolof)] text-white font-bold text-lg rounded-2xl active:scale-[0.98] transition-all shadow-md mt-2"
        >
          Commencer
        </button>
      </div>
    </div>
  )
}

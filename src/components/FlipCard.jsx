import { Volume2, Sparkles, Languages, Eye } from 'lucide-react'

export default function FlipCard({ card, flipped, onFlip }) {
  // Simple helper to manually replay the audio if the user wants
  const replayAudio = (e) => {
    e.stopPropagation() // Don't trigger card flip when clicking audio button
    if (card?.audioWo) {
      new Audio(card.audioWo).play().catch(() => {})
    }
  }

  return (
    <div 
      onClick={onFlip} 
      className="w-full h-[380px] perspective-1000 cursor-pointer select-none group my-6"
    >
      <div 
        className={`relative w-full h-full duration-500 preserve-3d transition-transform ease-out-back ${
          flipped ? 'rotate-y-180' : 'group-hover:scale-[1.01]'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        {/* FRONT FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] flex flex-col justify-between p-6 shadow-2xl overflow-hidden transition-all duration-300">
          {/* Subtle green ambient glow on top */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-[var(--text-wolof)]/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-mono flex items-center gap-1.5 bg-[var(--btn-secondary-bg)] px-2.5 py-1 rounded-full border border-[var(--btn-secondary-border)] transition-colors duration-300">
              <Sparkles className="w-3 h-3 text-[var(--text-wolof)]" /> Écoutez & Répétez
            </span>
            {card.audioWo && (
              <button 
                onClick={replayAudio}
                className="p-2 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-wolof)] active:scale-95 transition-all duration-150 flex items-center justify-center rounded-full shadow-sm"
                title="Réécouter le Wolof"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center Wolof Text */}
          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            <h2 className="text-3xl font-bold text-[var(--text-wolof)] tracking-wide leading-snug drop-shadow-md select-text selection:bg-[var(--text-wolof)]/20 transition-colors duration-300">
              {card.wo}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-3 uppercase tracking-widest font-mono transition-colors duration-300">
              Wolof
            </p>
          </div>

          {/* Bottom Prompt */}
          <div className="flex justify-center items-center gap-2 text-xs text-[var(--text-muted)] font-medium z-10 py-1 bg-[var(--btn-secondary-bg)]/30 rounded-xl border border-[var(--btn-secondary-border)]/20 backdrop-blur-sm transition-colors duration-300">
            <Eye className="w-4 h-4 text-[var(--text-wolof)] animate-pulse" />
            <span className="animate-pulse-subtle">Appuyez pour révéler la traduction</span>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] rotate-y-180 flex flex-col justify-between p-6 shadow-2xl overflow-hidden transition-all duration-300">
          {/* Subtle gold/green ambient glow on top */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[var(--text-wolof)]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-mono flex items-center gap-1.5 bg-[var(--btn-secondary-bg)] px-2.5 py-1 rounded-full border border-[var(--btn-secondary-border)] transition-colors duration-300">
              <Languages className="w-3 h-3 text-[#f59e0b]" /> Traduction Révélée
            </span>
            {card.audioFr && (
              <span className="text-[9px] text-[var(--text-muted)] bg-[var(--btn-secondary-bg)] px-2 py-0.5 rounded border border-[var(--btn-secondary-border)] transition-colors duration-300">
                Audio FR joué
              </span>
            )}
          </div>

          {/* Center Translation Text */}
          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            {/* Wolof Reference above */}
            <span className="text-sm font-semibold text-[var(--text-wolof)]/60 mb-3 select-text selection:bg-[var(--text-wolof)]/10 transition-colors duration-300">
              {card.wo}
            </span>
            
            {/* French translation */}
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-wide leading-snug drop-shadow-md select-text selection:bg-white/10 transition-colors duration-300">
              {card.fr}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-3 uppercase tracking-widest font-mono transition-colors duration-300">
              Français
            </p>
          </div>

          {/* Bottom Prompt */}
          <div className="flex justify-center items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-semibold py-1 bg-[var(--btn-secondary-bg)]/40 rounded-xl border border-[var(--btn-secondary-border)]/20 z-10 transition-colors duration-300">
            <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-ping" />
            <span>Notez votre niveau de mémorisation ci-dessous</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Volume2, Sparkles, Languages, Eye } from 'lucide-react'

export default function FlipCard({ card, flipped, onFlip }) {
  const replayAudio = (e) => {
    e.stopPropagation()
    if (card?.audioWo) new Audio(card.audioWo).play().catch(() => {})
  }

  return (
    <div
      onClick={onFlip}
      className="w-full cursor-pointer select-none my-6"
      style={{ perspective: '1000px', height: '380px', isolation: 'isolate' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          willChange: 'transform',
        }}
      >
        {/* FRONT FACE */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            opacity: flipped ? 0 : 1,
            transition: 'opacity 0s linear 0.25s',
          }}
          className="absolute inset-0 rounded-3xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] flex flex-col justify-between p-6 shadow-2xl overflow-hidden"
        >
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-[var(--text-wolof)]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-mono flex items-center gap-1.5 bg-[var(--btn-secondary-bg)] px-2.5 py-1 rounded-full border border-[var(--btn-secondary-border)]">
              <Sparkles className="w-3 h-3 text-[var(--text-wolof)]" /> Écoutez & Répétez
            </span>
            {card.audioWo && (
              <button
                onClick={replayAudio}
                className="p-2 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] border border-[var(--btn-secondary-border)] text-[var(--text-wolof)] active:scale-95 transition-all duration-150 flex items-center justify-center rounded-full shadow-sm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            <h2 className="text-3xl font-bold text-[var(--text-wolof)] tracking-wide leading-snug drop-shadow-md">
              {card.wo}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-3 uppercase tracking-widest font-mono">
              Wolof
            </p>
          </div>

          <div className="flex justify-center items-center gap-2 text-xs text-[var(--text-muted)] font-medium z-10 py-1 bg-[var(--btn-secondary-bg)]/30 rounded-xl border border-[var(--btn-secondary-border)]/20">
            <Eye className="w-4 h-4 text-[var(--text-wolof)] animate-pulse" />
            <span>Appuyez pour révéler la traduction</span>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(1px)',
            opacity: flipped ? 1 : 0,
            transition: 'opacity 0s linear 0.25s',
          }}
          className="absolute inset-0 rounded-3xl border border-[var(--border-card)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-app)] flex flex-col justify-between p-6 shadow-2xl overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[var(--text-wolof)]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] tracking-wider uppercase text-[var(--text-muted)] font-mono flex items-center gap-1.5 bg-[var(--btn-secondary-bg)] px-2.5 py-1 rounded-full border border-[var(--btn-secondary-border)]">
              <Languages className="w-3 h-3 text-[#f59e0b]" /> Traduction Révélée
            </span>
            {card.audioFr && (
              <span className="text-[9px] text-[var(--text-muted)] bg-[var(--btn-secondary-bg)] px-2 py-0.5 rounded border border-[var(--btn-secondary-border)]">
                Audio FR joué
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            <span className="text-sm font-semibold text-[var(--text-wolof)]/60 mb-3">
              {card.wo}
            </span>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-wide leading-snug drop-shadow-md">
              {card.fr}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-3 uppercase tracking-widest font-mono">
              Français
            </p>
          </div>

          <div className="flex justify-center items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-semibold py-1 bg-[var(--btn-secondary-bg)]/40 rounded-xl border border-[var(--btn-secondary-border)]/20 z-10">
            <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-ping" />
            <span>Notez votre niveau de mémorisation ci-dessous</span>
          </div>
        </div>
      </div>
    </div>
  )
}

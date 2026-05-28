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
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#121212] to-[#0a0a0a] flex flex-col justify-between p-6 shadow-2xl overflow-hidden">
          {/* Subtle green ambient glow on top */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#4ade80]/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] tracking-wider uppercase text-[#6b7280] font-mono flex items-center gap-1.5 bg-[#161616] px-2.5 py-1 rounded-full border border-[#222222]">
              <Sparkles className="w-3 h-3 text-[#4ade80]" /> Écoutez & Répétez
            </span>
            {card.audioWo && (
              <button 
                onClick={replayAudio}
                className="p-2 bg-[#161616] hover:bg-[#222222] border border-[#222222] rounded-full text-[#4ade80] active:scale-95 transition-all duration-150 flex items-center justify-center"
                title="Réécouter le Wolof"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center Wolof Text */}
          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            <h2 className="text-3xl font-bold text-[#4ade80] tracking-wide leading-snug drop-shadow-md select-text selection:bg-[#4ade80]/20">
              {card.wo}
            </h2>
            <p className="text-xs text-[#6b7280] mt-3 uppercase tracking-widest font-mono">
              Wolof
            </p>
          </div>

          {/* Bottom Prompt */}
          <div className="flex justify-center items-center gap-2 text-xs text-[#6b7280] font-medium z-10 py-1 bg-[#111111]/30 rounded-xl border border-[#1e1e1e]/20 backdrop-blur-sm">
            <Eye className="w-4 h-4 text-[#4ade80] animate-pulse" />
            <span className="animate-pulse-subtle">Appuyez pour révéler la traduction</span>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border border-[#1e1e1e] bg-gradient-to-br from-[#141414] to-[#0e0e0e] rotate-y-180 flex flex-col justify-between p-6 shadow-2xl overflow-hidden">
          {/* Subtle gold ambient glow on top */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#f59e0b]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] tracking-wider uppercase text-[#6b7280] font-mono flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-full border border-[#262626]">
              <Languages className="w-3 h-3 text-[#f59e0b]" /> Traduction Révélée
            </span>
            {card.audioFr && (
              <span className="text-[9px] text-[#6b7280] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#262626]">
                Audio FR joué
              </span>
            )}
          </div>

          {/* Center Translation Text */}
          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            {/* Wolof Reference above */}
            <span className="text-sm font-semibold text-[#4ade80]/60 mb-3 select-text selection:bg-[#4ade80]/10">
              {card.wo}
            </span>
            
            {/* French translation */}
            <h2 className="text-2xl font-bold text-[#f5f5f5] tracking-wide leading-snug drop-shadow-md select-text selection:bg-white/10">
              {card.fr}
            </h2>
            <p className="text-xs text-[#6b7280] mt-3 uppercase tracking-widest font-mono">
              Français
            </p>
          </div>

          {/* Bottom Prompt */}
          <div className="flex justify-center items-center gap-1.5 text-[10px] text-[#6b7280] font-semibold py-1 bg-[#1a1a1a]/40 rounded-xl border border-[#262626]/20 z-10">
            <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-ping" />
            <span>Notez votre niveau de mémorisation ci-dessous</span>
          </div>
        </div>
      </div>
    </div>
  )
}

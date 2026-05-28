import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { ArrowLeft, Play, BookOpen, CheckCircle2, Clock, Sparkles, Volume2 } from 'lucide-react'

export default function LessonDetail({ lessonId, onStart, onBack }) {
  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) return null

  const cards = lesson.cards || []
  const total = cards.length

  // Calculate precise stats specifically for this lesson's card set
  const cardSrsStates = cards.map(c => srs.get(c.id))
  const mastered = cardSrsStates.filter(s => s.mastered).length
  const due = cardSrsStates.filter(s => !s.mastered && s.nextDue <= Date.now()).length
  const studied = cardSrsStates.filter(s => s.attempts > 0).length
  const isComplete = studied === total && due === 0 && mastered === total

  // Function to simulate listening to pronunciation on word preview
  const playPreviewAudio = (card, e) => {
    e.stopPropagation()
    if (card?.audioWo) {
      new Audio(card.audioWo).play().catch(() => {})
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#f5f5f5] px-5 py-6 animate-fade-in-up justify-between">
      <div>
        {/* Navigation Header */}
        <div className="mb-5 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2.5 bg-[#111111] hover:bg-[#161616] active:scale-90 border border-[#1e1e1e] rounded-full transition-all duration-150 flex items-center justify-center text-gray-400 hover:text-white"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <span className="text-xs uppercase tracking-widest font-mono text-[#6b7280] font-medium">
            Détail de la leçon
          </span>

          <div className="w-10 h-10" /> {/* Balancer */}
        </div>

        {/* Hero Card */}
        <div className="mb-6 p-5 bg-[#111111] border border-[#1e1e1e] rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#4ade80]" />
          <h1 className="text-2xl font-bold text-white mb-2 leading-snug pl-1.5">
            {lesson.title}
          </h1>
          <p className="text-sm text-gray-400 pl-1.5 leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold tracking-wider text-[#6b7280] uppercase mb-3 px-1">
            Statistiques de Révision
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Total cards */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-3.5 flex flex-col text-center">
              <span className="text-xs text-[#6b7280] font-medium flex items-center justify-center gap-1 mb-1">
                <BookOpen className="w-3.5 h-3.5" /> Cartes
              </span>
              <span className="text-xl font-bold text-white mt-1">{total}</span>
            </div>

            {/* Mastered cards */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-3.5 flex flex-col text-center">
              <span className="text-xs text-[#6b7280] font-medium flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" /> Acquis
              </span>
              <span className="text-xl font-bold text-[#4ade80] mt-1">{mastered}</span>
            </div>

            {/* Due today */}
            <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-3.5 flex flex-col text-center">
              <span className="text-xs text-[#6b7280] font-medium flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#ef4444]" /> Dûs
              </span>
              <span className="text-xl font-bold text-[#ef4444] mt-1">{due}</span>
            </div>
          </div>
        </section>

        {/* Vocab preview list */}
        <section className="mb-6 flex-1">
          <h2 className="text-xs font-semibold tracking-wider text-[#6b7280] uppercase mb-3 px-1">
            Aperçu du vocabulaire
          </h2>
          
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {cards.map((c, i) => {
              const cardSrs = srs.get(c.id)
              return (
                <div 
                  key={c.id} 
                  className="flex items-center justify-between p-3 bg-[#111111]/60 rounded-xl border border-[#1e1e1e] hover:bg-[#161616] transition-colors duration-150"
                >
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-semibold text-[#4ade80] tracking-wide">
                      {c.wo}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.fr}
                    </p>
                  </div>
                  
                  {c.audioWo && (
                    <button 
                      onClick={(e) => playPreviewAudio(c, e)}
                      className="p-2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2b2b2b] rounded-lg text-[#6b7280] hover:text-[#4ade80] transition-all duration-150 active:scale-90 flex items-center justify-center"
                      title="Écouter la prononciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {!c.audioWo && cardSrs.attempts > 0 && (
                    <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full" title="Déjà révisé" />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Footer Start Button */}
      <div className="mt-4 pt-4 border-t border-[#161616]">
        <button
          onClick={onStart}
          className="w-full py-4 px-6 bg-[#4ade80] text-[#0a0a0a] rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#5aee90] active:scale-[0.98] transition-all duration-150 shadow-[0_0_15px_rgba(74,222,128,0.2)] hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] relative overflow-hidden group"
        >
          <Play className="w-5 h-5 fill-current text-[#0a0a0a]" />
          <span>
            {due > 0 ? 'Réviser maintenant' : studied > 0 ? 'Reprendre la session' : 'Commencer la leçon'}
          </span>
          <span className="absolute right-4 w-8 h-8 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 opacity-20" />
        </button>
      </div>
    </div>
  )
}

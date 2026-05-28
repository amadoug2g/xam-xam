import { LESSONS } from '../data/mock'
import { srs } from '../core/srs'
import { BookOpen, Sparkles, Clock, CheckCircle2, ChevronRight } from 'lucide-react'

export default function LessonList({ onSelect }) {
  // Aggregate global statistics across all lessons
  const allCards = LESSONS.flatMap(l => l.cards || [])
  const totalCards = allCards.length
  
  const srsStates = allCards.map(c => srs.get(c.id))
  const masteredCount = srsStates.filter(s => s.mastered).length
  const dueCount = srsStates.filter(s => !s.mastered && s.nextDue <= Date.now()).length
  const progressPercent = totalCards > 0 ? Math.round(((masteredCount + (srsStates.filter(s => s.attempts > 0 && !s.mastered).length * 0.5)) / totalCards) * 100) : 0

  return (
    <div className="flex flex-col min-h-screen px-5 py-6 bg-[#0a0a0a] text-[#f5f5f5] animate-fade-in-up">
      {/* Premium Header */}
      <header className="mb-6 flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Xam-Xam<span className="text-[#4ade80]">.</span>
          </h1>
          <span className="text-xs px-2.5 py-1 bg-[#152d1d] text-[#4ade80] rounded-full border border-[#1e5c32]/30 font-medium">
            Wolof
          </span>
        </div>
        <p className="text-xs text-[#6b7280] mt-1 font-mono uppercase tracking-widest">
          Salaam aleekum 👋
        </p>
      </header>

      {/* Global Progress Dashboard Card */}
      <div className="mb-8 p-5 bg-gradient-to-br from-[#111111] to-[#0d0d0d] rounded-2xl border border-[#1e1e1e] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/5 rounded-full blur-2xl -mr-8 -mt-8" />
        <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#4ade80]" /> Votre Progression
        </h3>
        
        {/* Progress bar */}
        <div className="w-full bg-[#1c1c1c] h-2 rounded-full mb-5 overflow-hidden">
          <div 
            className="bg-[#4ade80] h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(74,222,128,0.5)]"
            style={{ width: `${Math.max(4, progressPercent)}%` }}
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="flex flex-col p-2 bg-[#161616]/50 rounded-xl border border-[#1f1f1f]">
            <span className="text-xs text-[#6b7280] font-medium flex justify-center items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Total
            </span>
            <span className="text-lg font-bold mt-0.5 text-white">{totalCards}</span>
          </div>
          <div className="flex flex-col p-2 bg-[#161616]/50 rounded-xl border border-[#1f1f1f]">
            <span className="text-xs text-[#6b7280] font-medium flex justify-center items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" /> Acquis
            </span>
            <span className="text-lg font-bold mt-0.5 text-[#4ade80]">{masteredCount}</span>
          </div>
          <div className="flex flex-col p-2 bg-[#161616]/50 rounded-xl border border-[#1f1f1f]">
            <span className="text-xs text-[#6b7280] font-medium flex justify-center items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#ef4444]" /> Dûs
            </span>
            <span className="text-lg font-bold mt-0.5 text-[#ef4444]">{dueCount}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Lesson List */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-sm font-semibold tracking-wider text-[#6b7280] uppercase px-1">
          Vos Leçons
        </h2>
        
        <div className="flex flex-col gap-3.5 pb-8">
          {LESSONS.map((lesson, index) => {
            const lessonDueCount = lesson.cards.filter(c => {
              const s = srs.get(c.id)
              return !s.mastered && s.nextDue <= Date.now()
            }).length

            return (
              <button
                key={lesson.id}
                onClick={() => onSelect(lesson.id)}
                className="w-full flex items-center justify-between p-4 bg-[#111111] rounded-2xl border border-[#1e1e1e] hover:border-[#4ade80]/40 active:scale-[0.98] active:bg-[#141414] transition-all duration-200 text-left group relative overflow-hidden shadow-md"
                style={{ 
                  animationDelay: `${index * 80}ms`,
                  animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both'
                }}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-white text-base group-hover:text-[#4ade80] transition-colors duration-150">
                      {lesson.title}
                    </h3>
                    {lessonDueCount > 0 && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]"></span>
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-[#6b7280] line-clamp-1 mb-2.5">
                    {lesson.description}
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] tracking-wider px-2 py-0.5 bg-[#1a1a1a] text-[#a3a3a3] rounded-md font-medium border border-[#262626]">
                      {lesson.cards.length} cartes
                    </span>
                    {lessonDueCount > 0 && (
                      <span className="text-[10px] font-bold text-[#4ade80] flex items-center gap-1 animate-pulse-subtle">
                        {lessonDueCount} à réviser
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#262626] group-hover:bg-[#4ade80]/10 group-hover:border-[#4ade80]/30 transition-all duration-200">
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#4ade80] transition-colors duration-150" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

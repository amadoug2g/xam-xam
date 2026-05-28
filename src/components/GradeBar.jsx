import { Sparkles } from 'lucide-react'

const GRADES = [
  { value: 0, label: 'Raté',     styleClass: 'grade-btn-red' },
  { value: 1, label: 'Vague',    styleClass: 'grade-btn-red' },
  { value: 2, label: 'Hésit.',   styleClass: 'grade-btn-amber' },
  { value: 3, label: 'OK',       styleClass: 'grade-btn-amber' },
  { value: 4, label: 'Bien',     styleClass: 'grade-btn-green' },
  { value: 5, label: 'Parfait',  styleClass: 'grade-btn-green' },
]

export default function GradeBar({ onGrade }) {
  return (
    <div className="w-full flex flex-col gap-3 py-4 border-t border-[var(--border-divider)] animate-fade-in-up mt-auto transition-colors duration-300">
      {/* Small instruction helper bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider font-mono transition-colors duration-300">
          Niveau de Rétention
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-medium flex items-center gap-1 transition-colors duration-300">
          <Sparkles className="w-2.5 h-2.5 text-[#f59e0b]" /> Spaced Repetition Active
        </span>
      </div>

      {/* Grid of 6 touch-friendly, color-coded buttons */}
      <div className="grid grid-cols-6 gap-1.5 w-full">
        {GRADES.map((g) => (
          <button
            key={g.value}
            onClick={() => onGrade(g.value)}
            className={`flex flex-col items-center justify-between py-3 rounded-xl border ${g.styleClass} active:scale-90 active:bg-opacity-80 shadow-md select-none group touch-none`}
            title={`Noter ${g.value}: ${g.label}`}
          >
            {/* Value (Number) */}
            <span className="text-lg font-extrabold tracking-tight group-hover:scale-105 transition-transform duration-100">
              {g.value}
            </span>
            
            {/* Label (Micro-text) */}
            <span className="text-[8px] font-mono tracking-tighter uppercase font-bold mt-1 text-center opacity-85 w-full truncate px-0.5">
              {g.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

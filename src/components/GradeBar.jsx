import { Sparkles } from 'lucide-react'

const GRADES = [
  { 
    value: 0, 
    label: 'Raté',     
    bg: 'bg-[#1c0d0d]', 
    border: 'border-[#4e1616]', 
    text: 'text-[#f87171]', 
    hoverBorder: 'hover:border-[#ef4444]',
    hoverBg: 'hover:bg-[#271212]'
  },
  { 
    value: 1, 
    label: 'Vague',    
    bg: 'bg-[#1c0d0d]', 
    border: 'border-[#4e1616]', 
    text: 'text-[#f87171]', 
    hoverBorder: 'hover:border-[#ef4444]',
    hoverBg: 'hover:bg-[#271212]'
  },
  { 
    value: 2, 
    label: 'Hésit.', 
    bg: 'bg-[#1c140d]', 
    border: 'border-[#4e3416]', 
    text: 'text-[#fbbf24]', 
    hoverBorder: 'hover:border-[#f59e0b]',
    hoverBg: 'hover:bg-[#271b12]'
  },
  { 
    value: 3, 
    label: 'OK',       
    bg: 'bg-[#1c140d]', 
    border: 'border-[#4e3416]', 
    text: 'text-[#fbbf24]', 
    hoverBorder: 'hover:border-[#f59e0b]',
    hoverBg: 'hover:bg-[#271b12]'
  },
  { 
    value: 4, 
    label: 'Bien',     
    bg: 'bg-[#0d1c12]', 
    border: 'border-[#164e26]', 
    text: 'text-[#34d399]', 
    hoverBorder: 'hover:border-[#10b981]',
    hoverBg: 'hover:bg-[#122718]'
  },
  { 
    value: 5, 
    label: 'Parfait',  
    bg: 'bg-[#0d1c12]', 
    border: 'border-[#164e26]', 
    text: 'text-[#34d399]', 
    hoverBorder: 'hover:border-[#10b981]',
    hoverBg: 'hover:bg-[#122718]'
  },
]

export default function GradeBar({ onGrade }) {
  return (
    <div className="w-full flex flex-col gap-3 py-4 border-t border-[#161616] animate-fade-in-up mt-auto">
      {/* Small instruction helper bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider font-mono">
          Niveau de Rétention
        </span>
        <span className="text-[9px] text-[#6b7280] font-medium flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-[#f59e0b]" /> Spaced Repetition Active
        </span>
      </div>

      {/* Grid of 6 touch-friendly, color-coded buttons */}
      <div className="grid grid-cols-6 gap-1.5 w-full">
        {GRADES.map((g) => (
          <button
            key={g.value}
            onClick={() => onGrade(g.value)}
            className={`flex flex-col items-center justify-between py-3 rounded-xl border ${g.bg} ${g.border} ${g.text} ${g.hoverBorder} ${g.hoverBg} active:scale-90 active:bg-opacity-80 transition-all duration-150 shadow-md select-none group touch-none`}
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

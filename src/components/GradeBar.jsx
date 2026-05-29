import { XCircle, MinusCircle, CheckCircle2 } from 'lucide-react'

export default function GradeBar({ onGrade }) {
  return (
    <div className="w-full flex gap-2 pt-4 pb-2 border-t border-[var(--border-divider)] animate-fade-in-up mt-auto transition-colors duration-300">
      <button
        onClick={() => onGrade(1)}
        className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold text-sm active:scale-[0.97] active:brightness-90 transition-all duration-150 shadow-md flex flex-col items-center justify-center gap-1.5"
      >
        <XCircle className="w-7 h-7" strokeWidth={1.5} />
        <span>Non</span>
      </button>
      <button
        onClick={() => onGrade(3)}
        className="flex-1 py-4 rounded-2xl bg-amber-400 text-white font-bold text-sm active:scale-[0.97] active:brightness-90 transition-all duration-150 shadow-md flex flex-col items-center justify-center gap-1.5"
      >
        <MinusCircle className="w-7 h-7" strokeWidth={1.5} />
        <span>Hésitation</span>
      </button>
      <button
        onClick={() => onGrade(5)}
        className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm active:scale-[0.97] active:brightness-90 transition-all duration-150 shadow-md flex flex-col items-center justify-center gap-1.5"
      >
        <CheckCircle2 className="w-7 h-7" strokeWidth={1.5} />
        <span>Je savais</span>
      </button>
    </div>
  )
}

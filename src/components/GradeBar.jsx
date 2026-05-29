export default function GradeBar({ onGrade }) {
  return (
    <div className="w-full flex gap-3 pt-4 pb-2 border-t border-[var(--border-divider)] animate-fade-in-up mt-auto transition-colors duration-300">
      <button
        onClick={() => onGrade(1)}
        className="flex-1 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-base active:scale-[0.97] active:bg-red-500/20 transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
      >
        <span className="text-xl">✗</span>
        <span>Je ne savais pas</span>
      </button>
      <button
        onClick={() => onGrade(4)}
        className="flex-1 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-base active:scale-[0.97] active:bg-emerald-500/20 transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
      >
        <span className="text-xl">✓</span>
        <span>Je savais</span>
      </button>
    </div>
  )
}

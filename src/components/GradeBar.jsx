/**
 * GradeBar — Barre de notation Anki 0-5
 *
 * 0 Raté  | 1 Vague | 2 Hésitant | 3 OK | 4 Bien | 5 Parfait
 * Couleurs : rouge (0-1), orange (2-3), vert (4-5)
 *
 * Props : onGrade(grade: 0-5)
 */

const GRADES = [
  { value: 0, label: 'Raté',     color: 'red' },
  { value: 1, label: 'Vague',    color: 'red' },
  { value: 2, label: 'Hésitant', color: 'orange' },
  { value: 3, label: 'OK',       color: 'orange' },
  { value: 4, label: 'Bien',     color: 'green' },
  { value: 5, label: 'Parfait',  color: 'green' },
]

export default function GradeBar({ onGrade }) {
  // TODO: Gemini remplace ce composant avec l'UI finale
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {GRADES.map(g => (
        <button key={g.value} onClick={() => onGrade(g.value)}>
          {g.value} {g.label}
        </button>
      ))}
    </div>
  )
}

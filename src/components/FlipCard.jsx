/**
 * FlipCard — La carte elle-même
 *
 * Recto : texte Wolof (toujours visible)
 * Verso  : texte Français (révélé au tap)
 * Animation flip au tap
 *
 * Props : card, flipped, onFlip()
 */

export default function FlipCard({ card, flipped, onFlip }) {
  // TODO: Gemini remplace ce composant avec l'UI finale + animation flip CSS
  return (
    <div onClick={onFlip} style={{ cursor: flipped ? 'default' : 'pointer' }}>
      <p>{card.wo}</p>
      {flipped && <p>{card.fr}</p>}
      {!flipped && <small>Appuie pour révéler</small>}
    </div>
  )
}

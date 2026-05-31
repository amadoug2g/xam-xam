/**
 * Normalise une carte au format variants (v2).
 * Compatible avec les cartes anciennes (fr/wo/audioFr/audioWo à la racine).
 */
export function normalizeCard(card) {
  if (card.variants && card.variants.length > 0) return card
  return {
    ...card,
    variants: [{
      fr: card.fr || '',
      wo: card.wo || '',
      audioFr: card.audioFr || null,
      audioWo: card.audioWo || null,
    }],
  }
}

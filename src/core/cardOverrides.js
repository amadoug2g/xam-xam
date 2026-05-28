const KEY = 'xam-xam-card-overrides'

export const cardOverrides = {
  getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
  },
  set(cardId, data) {
    try {
      const all = this.getAll()
      all[cardId] = data
      localStorage.setItem(KEY, JSON.stringify(all))
    } catch {}
  },
}

export function applyOverrides(cards) {
  const all = cardOverrides.getAll()
  return cards.map(c => all[c.id] ? { ...c, ...all[c.id] } : c)
}

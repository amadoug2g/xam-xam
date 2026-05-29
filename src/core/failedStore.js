const KEY = 'xam_last_failed'

export const failedStore = {
  save(cards) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cards))
    } catch {}
  },
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  },
  clear() {
    localStorage.removeItem(KEY)
  },
}

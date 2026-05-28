const KEY = 'xam-xam-streak'

export const streak = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{"count":0,"lastDate":null,"longest":0}')
    } catch {
      return { count: 0, lastDate: null, longest: 0 }
    }
  },

  touch() {
    const today = new Date().toDateString()
    const s = this.get()
    if (s.lastDate === today) return s

    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const newCount = s.lastDate === yesterday ? s.count + 1 : 1
    const updated = { count: newCount, lastDate: today, longest: Math.max(newCount, s.longest || 0) }
    localStorage.setItem(KEY, JSON.stringify(updated))
    return updated
  },
}

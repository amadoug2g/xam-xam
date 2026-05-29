const KEY = 'xam-xam-streak'
const FREEZE_KEY = 'xam-xam-streak-freeze'
const FREEZE_USED_KEY = 'xam-xam-streak-freeze-used'

export const streak = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{"count":0,"lastDate":null,"longest":0}')
    } catch {
      return { count: 0, lastDate: null, longest: 0 }
    }
  },

  hasFreeze() {
    return localStorage.getItem(FREEZE_KEY) === 'true'
  },

  freeze() {
    localStorage.setItem(FREEZE_KEY, 'true')
  },

  touch() {
    const today = new Date().toDateString()
    const s = this.get()
    if (s.lastDate === today) return s

    const yesterday = new Date(Date.now() - 86400000).toDateString()
    let newCount

    if (s.lastDate === yesterday) {
      // Consecutive day — increment
      newCount = s.count + 1
    } else if (s.lastDate !== null) {
      // Missed at least one day — check freeze
      const freezeUsedDate = localStorage.getItem(FREEZE_USED_KEY)
      if (this.hasFreeze() && freezeUsedDate !== today) {
        // Consume freeze, keep streak alive
        localStorage.removeItem(FREEZE_KEY)
        localStorage.setItem(FREEZE_USED_KEY, today)
        newCount = s.count + 1
      } else {
        newCount = 1
      }
    } else {
      newCount = 1
    }

    const updated = { count: newCount, lastDate: today, longest: Math.max(newCount, s.longest || 0) }
    localStorage.setItem(KEY, JSON.stringify(updated))

    // Grant a new freeze every 7 consecutive days
    if (newCount > 0 && newCount % 7 === 0 && !this.hasFreeze()) {
      this.freeze()
    }

    return updated
  },
}

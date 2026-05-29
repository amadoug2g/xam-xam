const KEY = 'xam-xam-lesson-verified'

export const lessonVerified = {
  getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
  },
  isVerified(lessonId) {
    return !!this.getAll()[lessonId]
  },
  setVerified(lessonId, value = true) {
    try {
      const all = this.getAll()
      all[lessonId] = value
      localStorage.setItem(KEY, JSON.stringify(all))
    } catch {}
  },
}

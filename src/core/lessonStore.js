import { LESSONS as SEED } from '../data/mock'

const KEY = 'xam-xam-lessons'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function persist(lessons) {
  try { localStorage.setItem(KEY, JSON.stringify(lessons)) } catch {}
}

export const lessonStore = {
  getLessons() {
    const stored = load()
    if (stored) return stored
    persist(SEED)
    return SEED.map(l => ({ ...l, cards: [] }))
  },

  addCard(lessonId, { wo = '', fr = '', audioWo = null, audioFr = null } = {}) {
    const lessons = this.getLessons()
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return null
    const n = lesson.cards.length + 1
    const id = `${lessonId}_${String(n).padStart(2, '0')}`
    lesson.cards.push({ id, lessonId, position: n, wo, fr, audioWo, audioFr })
    persist(lessons)
    return id
  },

  updateCard(cardId, patch) {
    const lessons = this.getLessons()
    for (const lesson of lessons) {
      const card = lesson.cards.find(c => c.id === cardId)
      if (card) { Object.assign(card, patch); break }
    }
    persist(lessons)
  },

  deleteCard(cardId) {
    const lessons = this.getLessons()
    for (const lesson of lessons) {
      const idx = lesson.cards.findIndex(c => c.id === cardId)
      if (idx !== -1) {
        lesson.cards.splice(idx, 1)
        lesson.cards.forEach((c, i) => { c.position = i + 1 })
        break
      }
    }
    persist(lessons)
  },

  exportToJSON() {
    return JSON.stringify(this.getLessons(), null, 2)
  },
}

/**
 * srs.js — Spaced Repetition System (SM-2 algorithm)
 * Stockage dans localStorage sous la clé "xam-xam-srs"
 */

const STORAGE_KEY = 'xam-xam-srs'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function defaultEntry() {
  return { attempts: 0, ease: 2.5, interval: 1, nextDue: 0, lastGrade: null, mastered: false }
}

export const srs = {
  get(cardId) {
    const data = load()
    return data[cardId] || defaultEntry()
  },

  update(cardId, grade) {
    const data = load()
    const e = data[cardId] || defaultEntry()

    e.attempts++
    e.lastGrade = grade

    if (grade < 3) {
      // Échec — reprendre depuis 1 jour
      e.interval = 1
    } else {
      // Succès — SM-2
      if (e.attempts === 1) e.interval = 1
      else if (e.attempts === 2) e.interval = 6
      else e.interval = Math.round(e.interval * e.ease)

      e.ease = Math.max(1.3, e.ease + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    }

    e.mastered = e.interval >= 21
    e.nextDue = Date.now() + e.interval * 86400000

    data[cardId] = e
    save(data)
    return e
  },

  getStats() {
    const data = load()
    const entries = Object.values(data)
    return {
      total: entries.length,
      mastered: entries.filter(e => e.mastered).length,
      due: entries.filter(e => !e.mastered && e.nextDue <= Date.now()).length,
    }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY)
  },
}

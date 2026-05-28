/**
 * mock.js — Données leçon "espace" + leçons mock
 * Audios extraits depuis Assimil "Guide de conversation Wolof"
 */

const BASE = import.meta.env.BASE_URL

export const LESSONS = [
  {
    id: 'espace',
    title: 'Pour se repérer dans l\'espace',
    description: 'Directions, distances, localisation',
    cards: [
      { id: 'espace_01', lessonId: 'espace', position: 1,  wo: 'Fan ? Fan la jóge ?',   fr: 'Où ? D\'où ?',         audioWo: null, audioFr: null },
      { id: 'espace_02', lessonId: 'espace', position: 2,  wo: 'Ñaata suuf la ?',       fr: 'À quelle distance ?',  audioWo: null, audioFr: null },
      { id: 'espace_03', lessonId: 'espace', position: 3,  wo: 'Ci kanam, ci ginnaaw',  fr: 'Devant, derrière',     audioWo: null, audioFr: null },
      { id: 'espace_04', lessonId: 'espace', position: 4,  wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
      { id: 'espace_05', lessonId: 'espace', position: 5,  wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
      { id: 'espace_06', lessonId: 'espace', position: 6,  wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
      { id: 'espace_07', lessonId: 'espace', position: 7,  wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
      { id: 'espace_08', lessonId: 'espace', position: 8,  wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
      { id: 'espace_09', lessonId: 'espace', position: 9,  wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
      { id: 'espace_10', lessonId: 'espace', position: 10, wo: '...',                   fr: '...',                  audioWo: null, audioFr: null },
    ],
  },
  {
    id: 'temps',
    title: 'Pour se repérer dans le temps',
    description: 'Jours, heures, dates, durées',
    cards: [
      { id: 'temps_01', lessonId: 'temps', position: 1,  wo: 'Belki démb',    fr: 'Avant-hier',            audioWo: `${BASE}audio/temps/03_wo.mp3`, audioFr: `${BASE}audio/temps/02_fr.mp3` },
      { id: 'temps_02', lessonId: 'temps', position: 2,  wo: 'Démb',          fr: 'Hier',                  audioWo: `${BASE}audio/temps/05_wo.mp3`, audioFr: `${BASE}audio/temps/04_fr.mp3` },
      { id: 'temps_03', lessonId: 'temps', position: 3,  wo: 'Tey',           fr: "Aujourd'hui",           audioWo: `${BASE}audio/temps/07_wo.mp3`, audioFr: `${BASE}audio/temps/06_fr.mp3` },
      { id: 'temps_04', lessonId: 'temps', position: 4,  wo: 'Ëllëg',         fr: 'Demain',                audioWo: `${BASE}audio/temps/09_wo.mp3`, audioFr: `${BASE}audio/temps/08_fr.mp3` },
      { id: 'temps_05', lessonId: 'temps', position: 5,  wo: 'Gannaaw ëllëg', fr: 'Après-demain',          audioWo: `${BASE}audio/temps/11_wo.mp3`, audioFr: `${BASE}audio/temps/10_fr.mp3` },
      { id: 'temps_06', lessonId: 'temps', position: 6,  wo: 'Ci suba ak suba', fr: 'Au petit matin',      audioWo: `${BASE}audio/temps/13_wo.mp3`, audioFr: `${BASE}audio/temps/12_fr.mp3` },
      { id: 'temps_07', lessonId: 'temps', position: 7,  wo: 'Suba',          fr: 'Le matin',              audioWo: `${BASE}audio/temps/15_wo.mp3`, audioFr: `${BASE}audio/temps/14_fr.mp3` },
      { id: 'temps_08', lessonId: 'temps', position: 8,  wo: 'Ci diggante',   fr: 'À la mi-journée',       audioWo: `${BASE}audio/temps/17_wo.mp3`, audioFr: `${BASE}audio/temps/16_fr.mp3` },
      { id: 'temps_09', lessonId: 'temps', position: 9,  wo: 'Ngoon',         fr: "L'après-midi, le soir", audioWo: `${BASE}audio/temps/19_wo.mp3`, audioFr: `${BASE}audio/temps/18_fr.mp3` },
      { id: 'temps_10', lessonId: 'temps', position: 10, wo: 'Guddi',         fr: 'La nuit',               audioWo: `${BASE}audio/temps/21_wo.mp3`, audioFr: `${BASE}audio/temps/20_fr.mp3` },
      { id: 'temps_11', lessonId: 'temps', position: 11, wo: 'Bala',          fr: 'Avant',                 audioWo: `${BASE}audio/temps/23_wo.mp3`, audioFr: `${BASE}audio/temps/22_fr.mp3` },
      { id: 'temps_12', lessonId: 'temps', position: 12, wo: 'Gannaaw',       fr: 'Après',                 audioWo: `${BASE}audio/temps/25_wo.mp3`, audioFr: `${BASE}audio/temps/24_fr.mp3` },
      { id: 'temps_13', lessonId: 'temps', position: 13, wo: 'Léegi',         fr: 'Bientôt',               audioWo: `${BASE}audio/temps/27_wo.mp3`, audioFr: `${BASE}audio/temps/26_fr.mp3` },
      { id: 'temps_14', lessonId: 'temps', position: 14, wo: 'Léegi léegi',   fr: 'Tout de suite',         audioWo: `${BASE}audio/temps/29_wo.mp3`, audioFr: `${BASE}audio/temps/28_fr.mp3` },
    ],
  },
  // --- MOCK LESSONS (à remplacer par vrais audios Assimil) ---
  {
    id: 'salutations',
    title: 'Salutations',
    description: 'Bonjour, au revoir, comment ça va',
    cards: [
      { id: 'sal_01', lessonId: 'salutations', position: 1, wo: 'Salaam aleekum', fr: 'Bonjour (salut)', audioWo: null, audioFr: null },
      { id: 'sal_02', lessonId: 'salutations', position: 2, wo: 'Maangi fi', fr: 'Je vais bien', audioWo: null, audioFr: null },
      { id: 'sal_03', lessonId: 'salutations', position: 3, wo: 'Jërejëf', fr: 'Merci', audioWo: null, audioFr: null },
    ],
  },
  {
    id: 'nombres',
    title: 'Les nombres',
    description: 'Compter de 1 à 10',
    cards: [
      { id: 'nb_01', lessonId: 'nombres', position: 1, wo: 'Benn', fr: 'Un', audioWo: null, audioFr: null },
      { id: 'nb_02', lessonId: 'nombres', position: 2, wo: 'Ñaar', fr: 'Deux', audioWo: null, audioFr: null },
      { id: 'nb_03', lessonId: 'nombres', position: 3, wo: 'Ñett', fr: 'Trois', audioWo: null, audioFr: null },
    ],
  },
]

/**
 * mock.js — Données fictives pour valider l'UI avant intégration des vrais audios Assimil
 *
 * Structure réelle attendue :
 *   Lesson { id, title, description, cards[] }
 *   Card   { id, lessonId, position, wo, fr, audioWo, audioFr }
 */

export const LESSONS = [
  {
    id: 'espace',
    title: 'Pour se repérer dans l\'espace',
    description: 'Directions, distances, localisation',
    cards: [
      {
        id: 'espace_01',
        lessonId: 'espace',
        position: 1,
        wo: 'Fan ? Fan la jóge ?',
        fr: 'Où ? D\'où ?',
        audioWo: `${import.meta.env.BASE_URL}audio/espace/01_wo.mp3`,
        audioFr: `${import.meta.env.BASE_URL}audio/espace/00_fr.mp3`,
      },
      {
        id: 'espace_02',
        lessonId: 'espace',
        position: 2,
        wo: 'Ñaata suuf la ?',
        fr: 'À quelle distance ?',
        audioWo: `${import.meta.env.BASE_URL}audio/espace/03_wo.mp3`,
        audioFr: `${import.meta.env.BASE_URL}audio/espace/02_fr.mp3`,
      },
      {
        id: 'espace_03',
        lessonId: 'espace',
        position: 3,
        wo: 'Ci kanam, ci ginnaaw',
        fr: 'À gauche, à droite',
        audioWo: `${import.meta.env.BASE_URL}audio/espace/05_wo.mp3`,
        audioFr: `${import.meta.env.BASE_URL}audio/espace/04_fr.mp3`,
      },
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

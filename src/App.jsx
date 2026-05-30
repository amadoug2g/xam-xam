/**
 * App.jsx — Routeur principal
 *
 * Routes :
 *   'home'    → LessonList
 *   'lesson'  → LessonDetail  (prop: lessonId)
 *   'session' → Session       (prop: lessonId)
 */

import { useState } from 'react'
import LessonList from './components/LessonList'
import LessonDetail from './components/LessonDetail'
import Session from './components/Session'
import AdminEditor from './components/AdminEditor'
import LessonSelector from './components/LessonSelector'
import SessionModePicker from './components/SessionModePicker'
import { failedStore } from './core/failedStore'

export default function App() {
  const [route, setRoute] = useState({ page: 'home', lessonId: null, cards: null, audioOnly: false, reversed: false })

  const go = (page, lessonId = null, cards = null, audioOnly = false, reversed = false) => setRoute({ page, lessonId, cards, audioOnly, reversed })

  // Before launching any session, go through mode picker
  const startSession = (lessonId, cards = null) => go('mode-pick', lessonId, cards)

  if (route.page === 'admin')       return <AdminEditor onBack={() => go('home')} />
  if (route.page === 'lesson')      return <LessonDetail lessonId={route.lessonId} onStart={() => startSession(route.lessonId)} onBack={() => go('home')} onAdmin={() => go('admin')} />

  if (route.page === 'mode-pick')   return (
    <SessionModePicker
      onSelect={({ audioOnly, reversed }) => {
        if (route.lessonId) go('session', route.lessonId, null, audioOnly, reversed)
        else go('multi', null, route.cards, audioOnly, reversed)
      }}
      onBack={() => route.lessonId ? go('lesson', route.lessonId) : go('home')}
    />
  )

  if (route.page === 'session')     return <Session lessonId={route.lessonId} initialAudioOnly={route.audioOnly} initialReversed={route.reversed} onDone={() => go('home')} onRepeat={() => startSession(route.lessonId)} onRepeatFailed={fc => go('multi', null, fc)} />
  if (route.page === 'review-all')  return <Session cards={route.cards} initialAudioOnly={route.audioOnly} initialReversed={route.reversed} onDone={() => go('home')} onRepeat={() => go('mode-pick', null, route.cards)} onRepeatFailed={fc => go('multi', null, fc)} />
  if (route.page === 'select')      return <LessonSelector onStart={cards => go('mode-pick', null, cards)} onBack={() => go('home')} />
  if (route.page === 'multi')       return <Session cards={route.cards} initialAudioOnly={route.audioOnly} initialReversed={route.reversed} onDone={() => go('home')} onRepeat={() => go('mode-pick', null, route.cards)} onRepeatFailed={fc => go('multi', null, fc)} />
  if (route.page === 'retry-failed') return <Session cards={route.cards} initialAudioOnly={route.audioOnly} initialReversed={route.reversed} onDone={() => go('home')} onRepeatFailed={fc => go('multi', null, fc)} />

  return <LessonList
    onSelect={id => go('lesson', id)}
    onReviewAll={cards => go('mode-pick', null, cards)}
    onAdmin={() => go('admin')}
    onSelectLessons={() => go('select')}
    onRetryFailed={(cards, ao) => go('retry-failed', null, cards, ao)}
  />
}

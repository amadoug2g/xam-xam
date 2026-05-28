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

export default function App() {
  const [route, setRoute] = useState({ page: 'home', lessonId: null })

  const go = (page, lessonId = null) => setRoute({ page, lessonId })

  if (route.page === 'lesson')   return <LessonDetail lessonId={route.lessonId} onStart={() => go('session', route.lessonId)} onBack={() => go('home')} />
  if (route.page === 'session')  return <Session lessonId={route.lessonId} onDone={() => go('home')} />
  return <LessonList onSelect={id => go('lesson', id)} />
}

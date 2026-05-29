import { useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const t = localStorage.getItem('xam-xam-theme') || 'dark'
    if (t === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
    return t
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('xam-xam-theme', next)
    if (next === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
    setTheme(next)
  }

  return { theme, toggleTheme }
}

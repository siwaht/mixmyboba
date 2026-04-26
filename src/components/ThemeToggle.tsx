'use client'

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
  return stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme)
  const mounted = useClientMounted()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('theme', next)
      return next
    })
  }, [])

  // Render a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
        🌙
      </button>
    )
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

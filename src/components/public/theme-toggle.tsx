'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ThemeToggle() {
  const t = useTranslations('ThemeToggle')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark')
    setDark(isDark)
    try { localStorage.setItem('ij-theme', isDark ? 'dark' : 'light') } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggleTheme')}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  )
}

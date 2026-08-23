'use client'

import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

type ModifierClick = { ctrlKey: boolean; metaKey: boolean }

/**
 * Matches normal link behavior for admin navigation: Ctrl-click on Windows/
 * Linux or Cmd-click on macOS opens the destination in a new tab.
 */
export function useAdminNavigation() {
  const locale = useLocale()
  const router = useRouter()

  return useCallback((href: string, event?: ModifierClick) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`/${locale}${href}`, '_blank', 'noopener,noreferrer')
      return
    }
    router.push(href)
  }, [locale, router])
}

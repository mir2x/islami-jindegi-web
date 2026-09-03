'use client'

import { useEffect } from 'react'

/**
 * Preserve the browser's expected Ctrl/Cmd-click behavior even when a client
 * navigation handler is attached to a link by Next.js or next-intl.
 */
export function CtrlClickNewTab() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || (!event.ctrlKey && !event.metaKey)) return

      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest<HTMLAnchorElement>('a[href]')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      event.preventDefault()
      event.stopPropagation()
      window.open(link.href, '_blank', 'noopener,noreferrer')
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { X, Bookmark, Trash2 } from 'lucide-react'
import { getBookmarks, removeBookmark, BOOKMARKS_CHANGED_EVENT, type QuranBookmark } from '@/lib/quran-bookmarks'
import { DEFAULT_ARABIC_FONT } from '@/lib/quran-fonts'
import { bn } from '@/lib/bengali-numerals'

interface Props {
  onClose: () => void
}

export function BookmarksModal({ onClose }: Props) {
  const t = useTranslations('BookmarksModal')
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([])

  useEffect(() => {
    const load = () => setBookmarks(getBookmarks().slice().reverse())
    load()
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, load)
    return () => window.removeEventListener(BOOKMARKS_CHANGED_EVENT, load)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function goTo(b: QuranBookmark) {
    router.push(`/quran/surah/${b.surahNumber}?ayah=${b.ayahNumber}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg sm:mx-4 max-h-[85vh] flex flex-col bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">{t('title')}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {bookmarks.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-16">{t('empty')}</p>
          )}

          {bookmarks.map(b => (
            <div
              key={`${b.surahNumber}-${b.ayahNumber}`}
              className="flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <button onClick={() => goTo(b)} className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">{b.surahName}</span>
                  <span className="text-xs text-muted-foreground">{t('ayah', { number: bn(b.ayahNumber) })}</span>
                </div>
                <p className="text-lg text-right text-foreground line-clamp-1" style={{ fontFamily: DEFAULT_ARABIC_FONT, direction: 'rtl' }}>
                  {b.arabic}
                </p>
              </button>
              <button
                onClick={() => removeBookmark(b.surahNumber, b.ayahNumber)}
                title={t('remove')}
                className="shrink-0 mt-1 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

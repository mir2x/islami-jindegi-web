'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { X, Search, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { PagedResult, QuranSearchHit } from '@/types'
import { DEFAULT_ARABIC_FONT } from '@/lib/quran-fonts'
import { bn } from '@/lib/bengali-numerals'

interface Props {
  onClose: () => void
}

const PAGE_SIZE = 20

export function QuranSearchModal({ onClose }: Props) {
  const t = useTranslations('QuranSearchModal')
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<PagedResult<QuranSearchHit> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const runSearch = useCallback((q: string, page: number) => {
    if (!q.trim()) { setResult(null); setLoading(false); return }
    setLoading(true)
    setError(false)
    api.get<PagedResult<QuranSearchHit>>(`/api/quran/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then(res => setResult(prev => page === 1 || !prev ? res : { ...res, data: [...prev.data, ...res.data] }))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  function onChange(v: string) {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(v, 1), 350)
  }

  function loadMore() {
    if (!result) return
    runSearch(query, result.page + 1)
  }

  function goToHit(hit: QuranSearchHit) {
    router.push(`/quran/surah/${hit.surahNumber}?ayah=${hit.ayahNumber}`)
    onClose()
  }

  function highlight(text: string) {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-foreground rounded px-0.5">{text.slice(idx, idx + query.trim().length)}</mark>
        {text.slice(idx + query.trim().length)}
      </>
    )
  }

  const hasMore = result ? result.page * result.pageSize < result.total : false

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl sm:mt-16 sm:mx-4 h-full sm:h-auto sm:max-h-[80vh] flex flex-col bg-background sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => onChange(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <p className="text-center text-sm text-destructive py-12">{t('searchError')}</p>
          )}

          {!error && !loading && query.trim() && result && result.data.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">{t('noResults')}</p>
          )}

          {!error && !query.trim() && (
            <p className="text-center text-sm text-muted-foreground py-12">{t('hint')}</p>
          )}

          {result && result.data.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-xs text-muted-foreground">{t('resultCount', { count: bn(result.total) })}</p>
              <div>
                {result.data.map(hit => (
                  <button
                    key={`${hit.surahNumber}-${hit.ayahNumber}`}
                    onClick={() => goToHit(hit)}
                    className="w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-primary">{hit.surahName}</span>
                      <span className="text-xs text-muted-foreground">{t('ayah', { number: bn(hit.ayahNumber) })}</span>
                    </div>
                    <p className="text-lg text-right text-foreground mb-1.5" style={{ fontFamily: DEFAULT_ARABIC_FONT, direction: 'rtl' }}>
                      {highlight(hit.arabic)}
                    </p>
                    {hit.translations[0] && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{highlight(hit.translations[0].text)}</p>
                    )}
                  </button>
                ))}
              </div>
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors disabled:opacity-50"
                  >
                    {loading ? t('loadingMore') : t('loadMore')}
                  </button>
                </div>
              )}
            </>
          )}

          {loading && (!result || result.page === 1) && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">{t('searching')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

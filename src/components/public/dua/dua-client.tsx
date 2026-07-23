'use client'

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  Heart, X,
  Play, Pause, Volume2, BookOpen,
  Printer, Download,
} from 'lucide-react'
import type { DuaListItem, DuaDetail, DuaCategoryOption, PagedResult } from '@/types'
import { cn } from '@/lib/utils'
import { SidebarOptionSection } from '@/components/public/filter-sidebar'
import { SearchInput } from '@/components/public/search-input'
import { MobileFilterTrigger, MobileFilterSheet } from '@/components/public/mobile-filter-sheet'
import { ShareActions, htmlToText } from '@/components/public/share-actions'
import { ZoomControl } from '@/components/public/zoom-control'
import { AdminEditButton } from '@/components/public/admin-edit-button'
import { fetchTitledOptions } from '@/lib/public-filter-options'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 20

type Tab = 'all' | 'text' | 'audio'

const DESKTOP_QUERY = '(min-width: 1024px)'
function subscribeDesktopQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_QUERY).matches
const getDesktopServerSnapshot = () => false

/** True on viewports with the 3-column layout. False during SSR/hydration to avoid a mismatch. */
function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktopQuery, getDesktopSnapshot, getDesktopServerSnapshot)
}

async function fetchDuas(opts: {
  search?: string; categoryId?: string; page?: number; hasAudio?: boolean
}): Promise<{ data: DuaListItem[]; total: number }> {
  const q = new URLSearchParams({ published: 'true', page: String(opts.page ?? 1), pageSize: String(PAGE_SIZE) })
  if (opts.search) q.set('search', opts.search)
  if (opts.categoryId) q.set('categoryId', opts.categoryId)
  if (opts.hasAudio !== undefined) q.set('hasAudio', String(opts.hasAudio))
  try {
    const res = await fetch(`${BASE}/api/dua?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<DuaListItem> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
}

async function fetchDuaDetail(id: string): Promise<DuaDetail | null> {
  try {
    const res = await fetch(`${BASE}/api/dua/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
function toLocaleDigits(value: string, locale: string) {
  return locale === 'bn' ? value.replace(/[0-9]/g, d => BN_DIGITS[Number(d)]) : value
}

function formatTime(s: number, locale: string) {
  const clamped = Number.isFinite(s) ? s : 0
  const raw = `${Math.floor(clamped / 60)}:${String(Math.floor(clamped % 60)).padStart(2, '0')}`
  return toLocaleDigits(raw, locale)
}

interface Props {
  initialItems: DuaListItem[]
  initialTotal: number
  categories: DuaCategoryOption[]
  initialSearch: string
  initialCategory: string
  initialTab: Tab
}

export function DuaClient({
  initialItems, initialTotal, categories,
  initialSearch, initialCategory, initialTab,
}: Props) {
  const router = useRouter()
  const t = useTranslations('DuaPage')
  const tCommon = useTranslations('Common')

  const [items, setItems] = useState(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [categorySearch, setCategorySearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fetchedDetail, setFetchedDetail] = useState<{ id: string; data: DuaDetail | null } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isDesktop = useIsDesktop()

  const hasMore = items.length < total
  const hasFilters = !!(search || selectedCategory)
  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.title

  // Nothing explicitly selected yet → default to the first row on desktop, where
  // there's a detail panel to fill; leave it empty on mobile, which navigates instead.
  const effectiveSelectedId = selectedId ?? (isDesktop ? items[0]?.id ?? null : null)
  const detail = fetchedDetail && fetchedDetail.id === effectiveSelectedId ? fetchedDetail.data : null
  const detailLoading = effectiveSelectedId !== null && fetchedDetail?.id !== effectiveSelectedId

  const tabToHasAudio = (t: Tab): boolean | undefined =>
    t === 'audio' ? true : t === 'text' ? false : undefined

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (tab !== 'all') params.set('tab', tab)
    if (search) params.set('q', search)
    if (selectedCategory) params.set('category', selectedCategory)
    const qs = params.toString()
    router.replace(qs ? `/dua?${qs}` : '/dua', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setSelectedId(null)
      const result = await fetchDuas({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        page: 1,
        hasAudio: tabToHasAudio(tab),
      })
      setItems(result.data)
      setTotal(result.total)
      setPage(1)
      setLoading(false)
      scrollRef.current?.scrollTo({ top: 0 })
    }, search !== initialSearch ? 350 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, selectedCategory])

  // Next page requested by the scroll sentinel → append
  useEffect(() => {
    if (page === 1) return
    let cancelled = false
    fetchDuas({
      search: search || undefined,
      categoryId: selectedCategory || undefined,
      page,
      hasAudio: tabToHasAudio(tab),
    }).then(result => {
      if (cancelled) return
      // De-dupe defensively: a filter reset racing an append could re-send page 1 rows.
      setItems(prev => {
        const seen = new Set(prev.map(i => i.id))
        return [...prev, ...result.data.filter(i => !seen.has(i.id))]
      })
      setTotal(result.total)
      setLoadingMore(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Load more when the sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || loading || loadingMore) return
    const io = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return
        setLoadingMore(true)
        setPage(p => p + 1)
      },
      { rootMargin: '400px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, loadingMore])

  // Load the detail for whichever row is selected (desktop panel only)
  useEffect(() => {
    if (!effectiveSelectedId) return
    let cancelled = false
    fetchDuaDetail(effectiveSelectedId).then(d => {
      if (cancelled) return
      setFetchedDetail({ id: effectiveSelectedId, data: d })
    })
    return () => { cancelled = true }
  }, [effectiveSelectedId])

  const switchTab = (t: Tab) => { setTab(t); setSelectedId(null) }
  const setCategory = (id: string) => { setSelectedCategory(id === selectedCategory ? '' : id) }
  const clearAll = () => { setSearch(''); setSelectedCategory('') }

  const selectItem = (id: string) => {
    setSelectedId(id)
    if (!isDesktop) router.push(`/dua/${id}`)
  }

  const filteredCategories = categorySearch.trim()
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearch.toLowerCase()))
    : categories

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: tCommon('all'), icon: null },
    { key: 'text', label: t('tabText'), icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: 'audio', label: t('tabAudio'), icon: <Volume2 className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:flex-1 lg:min-h-0">

      {/* ── Column 1 — category ────────────────────────────────────────── */}
      <aside className="hidden lg:flex print:hidden lg:w-[17.5rem] lg:shrink-0 lg:min-h-0">
        <div className="flex flex-col gap-12 w-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden">
          {categories.length > 0 && (
            <SidebarOptionSection
              title={t('category')}
              items={filteredCategories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
              search={categorySearch}
              onSearch={setCategorySearch}
              selected={selectedCategory}
              onSelect={setCategory}
              emptyText={t('categoryEmpty')}
              fill
              inlineSearch
            />
          )}
        </div>
      </aside>

      {/* ── Column 2 — search, tabs, list ─────────────────────────────── */}
      <div className="min-w-0 flex flex-col lg:w-[24rem] lg:shrink-0 lg:min-h-0 print:hidden">
        <div className="flex flex-col min-h-0 lg:flex-1 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 p-4">
        {/* Tabs */}
        <div className="inline-flex items-center bg-muted rounded-full p-1 mb-4 gap-0.5">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-base font-medium transition-all',
                tab === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Mobile filter row (category select) */}
        {categories.length > 0 && (
          <div className="flex lg:hidden gap-2 mb-2.5">
            <MobileFilterTrigger label={t('category')} activeLabel={activeCategoryName} onClick={() => setCategorySheetOpen(true)} />
          </div>
        )}

        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('searchPlaceholder')}
        />

        {categories.length > 0 && (
          <MobileFilterSheet
            open={categorySheetOpen}
            onClose={() => setCategorySheetOpen(false)}
            title={t('category')}
            options={categories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
            fetchOptions={q => fetchTitledOptions('/api/dua/categories', q)}
            selected={selectedCategory}
            onSelect={setCategory}
            emptyText={t('categoryEmpty')}
          />
        )}

        {/* Active chip */}
        {activeCategoryName && (
          <div className="flex items-center gap-1.5 flex-wrap mt-4">
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {activeCategoryName}
              <button onClick={() => setCategory('')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
            <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground hover:underline ml-1">{t('clearAll')}</button>
          </div>
        )}

        <p className="text-base text-muted-foreground mt-4">
          {loading ? tCommon('loading') : t('resultCount', { count: total })}
        </p>
        </div>

        {/* List — scrolls inside the card */}
        <div ref={scrollRef} className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart className="w-14 h-14 text-muted-foreground/25 mb-4" />
            <p className="text-xl font-medium text-foreground">{t('emptyTitle')}</p>
            <p className="text-base text-muted-foreground mt-1">{t('emptyHint')}</p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 text-base text-primary hover:underline">{t('clearFilters')}</button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <DuaRow
                key={item.id}
                item={item}
                selected={effectiveSelectedId === item.id}
                onSelect={() => selectItem(item.id)}
              />
            ))}
          </div>
        )}

        {/* Scroll sentinel — pulls in the next page */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="py-6 text-center text-base text-muted-foreground">
            {loadingMore ? tCommon('loading') : ''}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* ── Column 3 — detail panel (desktop only) ────────────────────── */}
      <div className="hidden lg:flex print:flex lg:flex-1 lg:min-h-0 print:w-full print:h-auto">
        <DuaDetailPanel detail={detail} loading={detailLoading} hasSelection={!!effectiveSelectedId} />
      </div>
    </div>
  )
}

// ── Single list row ──────────────────────────────────────────────────────────

function DuaRow({ item, selected, onSelect }: {
  item: DuaListItem
  selected: boolean
  onSelect: () => void
}) {
  const isAudio = !!item.audioUrl

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group w-full flex items-center gap-4 p-4 text-left rounded-xl border transition-colors',
        selected ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-primary/5'
      )}
    >
      <div className={cn(
        'w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors',
        selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
      )}>
        {isAudio ? <Volume2 className="w-4.5 h-4.5" /> : <Heart className="w-4.5 h-4.5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-base font-semibold leading-snug transition-colors line-clamp-1',
          selected ? 'text-primary' : 'text-foreground group-hover:text-primary'
        )}>
          {item.title}
        </p>
        {item.excerpt && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{item.excerpt}</p>
        )}
      </div>
    </button>
  )
}

// ── Detail panel (column 3) ─────────────────────────────────────────────────

function DuaDetailPanel({ detail, loading, hasSelection }: {
  detail: DuaDetail | null
  loading: boolean
  hasSelection: boolean
}) {
  const t = useTranslations('DuaPage')
  const [zoom, setZoom] = useState(100)

  const handlePrint = () => window.print()

  const shareContent = detail
    ? [detail.title, htmlToText(detail.body ?? detail.excerpt ?? '')].filter(Boolean).join('\n\n')
    : ''

  return (
    <div className="flex flex-col w-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden print:overflow-visible print:border-none print:rounded-none">
      {!hasSelection ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 print:hidden">
          <Heart className="w-14 h-14 text-muted-foreground/25 mb-4" />
          <p className="text-base text-muted-foreground">{t('selectPrompt')}</p>
        </div>
      ) : loading || !detail ? (
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-2/3" />
          <div className="space-y-2 pt-4">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
            <div className="h-3 bg-muted rounded w-4/5" />
          </div>
        </div>
      ) : (
        <>
          <AdminEditButton entity="dua" id={detail.id} />
          <div className="shrink-0 flex items-start justify-between gap-4 p-6 pb-4 border-b border-border/60">
            <h2 className="text-2xl font-bold text-foreground leading-snug min-w-0">{detail.title}</h2>
            <div className="flex items-center gap-1 shrink-0 print:hidden">
              <ZoomControl zoom={zoom} onZoomChange={setZoom} />
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={handlePrint}
                title={t('print')}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Printer className="w-4.5 h-4.5" />
              </button>
              <ShareActions
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/dua/${detail.id}`}
                title={detail.title}
                content={shareContent}
              />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto p-6 print:overflow-visible print:h-auto"
            style={{ zoom: `${zoom}%` }}
          >
            {detail.audioUrl
              ? <AudioDetail detail={detail} audioUrl={detail.audioUrl} />
              : <TextDetail detail={detail} />
            }
          </div>
        </>
      )}
    </div>
  )
}

function AudioDetail({ detail, audioUrl }: { detail: DuaDetail; audioUrl: string }) {
  const t = useTranslations('DuaPage')
  const locale = useLocale()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play().catch(() => setAudioError(true))
  }

  const seek = useCallback((clientX: number) => {
    const el = progressRef.current
    const audio = audioRef.current
    if (!el || !audio || !duration) return
    const rect = el.getBoundingClientRect()
    audio.currentTime = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * duration
    setCurrentTime(audio.currentTime)
  }, [duration])

  const pct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div>
      {detail.body ? (
        <div
          className="prose-content text-base text-muted-foreground mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: detail.body }}
        />
      ) : detail.excerpt ? (
        <p className="text-base text-muted-foreground mb-6 leading-relaxed">{detail.excerpt}</p>
      ) : null}

      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onError={() => setAudioError(true)}
      />

      <div className="flex items-center gap-4 print:hidden">
        <button
          onClick={togglePlay}
          className="w-14 h-14 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
        >
          {isPlaying ? <Pause className="w-5.5 h-5.5" /> : <Play className="w-5.5 h-5.5 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            ref={progressRef}
            onClick={e => seek(e.clientX)}
            className="relative h-2 rounded-full bg-muted cursor-pointer group"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-primary shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-sm text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime, locale)}</span>
            <span>{formatTime(duration, locale)}</span>
          </div>
        </div>
      </div>

      {audioError && <p className="text-sm text-destructive mt-3">{t('audioError')}</p>}

      {duration > 0 && (
        <div className="flex items-center gap-2 mt-6 text-base">
          <span className="text-muted-foreground">{t('audioDuration')}:</span>
          <span className="font-medium text-foreground">
            {t('audioDurationValue', { minutes: Math.max(1, Math.round(duration / 60)) })}
          </span>
        </div>
      )}

      <a
        href={audioUrl}
        download
        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-base font-medium text-foreground hover:bg-muted transition-colors print:hidden"
      >
        <Download className="w-4 h-4" /> {t('download')}
      </a>

      {detail.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-border/60">
          {detail.categories.map(c => (
            <span key={c.id} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{c.title}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function TextDetail({ detail }: { detail: DuaDetail }) {
  const t = useTranslations('DuaPage')
  return detail.body ? (
    <>
      <div
        className="prose-content text-base text-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: detail.body }}
      />
      {detail.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-border/60">
          {detail.categories.map(c => (
            <span key={c.id} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{c.title}</span>
          ))}
        </div>
      )}
    </>
  ) : (
    <p className="text-base text-muted-foreground">{detail.excerpt ?? t('noDetail')}</p>
  )
}

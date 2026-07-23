'use client'

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import {
  Mic, X, MapPin, Calendar,
  Play, Pause, Printer, Download,
} from 'lucide-react'
import type { BayanListItem, BayanAuthorOption, BayanCategoryOption, PagedResult } from '@/types'
import { cn } from '@/lib/utils'
import { SidebarOptionSection } from '@/components/public/filter-sidebar'
import { SearchInput } from '@/components/public/search-input'
import { MobileFilterTrigger, MobileFilterSheet } from '@/components/public/mobile-filter-sheet'
import { ShareActions } from '@/components/public/share-actions'
import { ZoomControl } from '@/components/public/zoom-control'
import { AdminEditButton } from '@/components/public/admin-edit-button'
import { fetchNamedOptions, fetchTitledOptions } from '@/lib/public-filter-options'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 20

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

async function fetchBayans(opts: {
  search?: string; categoryId?: string; authorId?: string; page?: number
}): Promise<{ data: BayanListItem[]; total: number }> {
  const q = new URLSearchParams({ published: 'true', sort: 'date', page: String(opts.page ?? 1), pageSize: String(PAGE_SIZE) })
  if (opts.search) q.set('search', opts.search)
  if (opts.categoryId) q.set('categoryId', opts.categoryId)
  if (opts.authorId) q.set('authorId', opts.authorId)
  try {
    const res = await fetch(`${BASE}/api/bayan?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<BayanListItem> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
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

function formatDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  initialBayans: BayanListItem[]
  initialTotal: number
  categories: BayanCategoryOption[]
  authors: BayanAuthorOption[]
  initialSearch: string
  initialCategory: string
  initialAuthor: string
}

export function BayanClient({
  initialBayans, initialTotal, categories, authors,
  initialSearch, initialCategory, initialAuthor,
}: Props) {
  const router = useRouter()
  const t = useTranslations('BayanPage')

  const [bayans, setBayans] = useState(initialBayans)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedAuthor, setSelectedAuthor] = useState(initialAuthor)
  const [authorSearch, setAuthorSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [authorSheetOpen, setAuthorSheetOpen] = useState(false)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isDesktop = useIsDesktop()

  const hasMore = bayans.length < total
  const hasFilters = !!(search || selectedCategory || selectedAuthor)
  const activeAuthorName = authors.find(a => a.id === selectedAuthor)?.name
  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.title

  // Nothing explicitly selected yet → default to the first row on desktop, where
  // there's a detail panel to fill; leave it empty on mobile, which navigates instead.
  const effectiveSelectedId = selectedId ?? (isDesktop ? bayans[0]?.id ?? null : null)
  // BayanDetail is the same shape as BayanListItem, so the selected row already has everything.
  const detail = bayans.find(b => b.id === effectiveSelectedId) ?? null

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedAuthor) params.set('author', selectedAuthor)
    const qs = params.toString()
    router.replace(qs ? `/bayan?${qs}` : '/bayan', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setSelectedId(null)
      const result = await fetchBayans({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        authorId: selectedAuthor || undefined,
        page: 1,
      })
      setBayans(result.data)
      setTotal(result.total)
      setPage(1)
      setLoading(false)
      scrollRef.current?.scrollTo({ top: 0 })
    }, search !== initialSearch ? 350 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedAuthor])

  // Next page requested by the scroll sentinel → append
  useEffect(() => {
    if (page === 1) return
    let cancelled = false
    fetchBayans({
      search: search || undefined,
      categoryId: selectedCategory || undefined,
      authorId: selectedAuthor || undefined,
      page,
    }).then(result => {
      if (cancelled) return
      // De-dupe defensively: a filter reset racing an append could re-send page 1 rows.
      setBayans(prev => {
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

  const setCategory = (id: string) => { setSelectedCategory(id === selectedCategory ? '' : id) }
  const setAuthor = (id: string) => { setSelectedAuthor(id === selectedAuthor ? '' : id) }
  const clearAll = () => { setSearch(''); setSelectedCategory(''); setSelectedAuthor('') }

  const selectItem = (id: string) => {
    setSelectedId(id)
    if (!isDesktop) router.push(`/bayan/${id}`)
  }

  const filteredAuthors = authorSearch.trim()
    ? authors.filter(a => a.name.toLowerCase().includes(authorSearch.toLowerCase()))
    : authors

  const filteredCategories = categorySearch.trim()
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearch.toLowerCase()))
    : categories

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:flex-1 lg:min-h-0">

      {/* ── Column 1 — author & category share one card ──────────────── */}
      <aside className="hidden lg:flex print:hidden lg:w-[17.5rem] lg:shrink-0 lg:min-h-0">
        <div className="flex flex-col gap-12 w-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden">
          <SidebarOptionSection
            title={t('speaker')}
            items={filteredAuthors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
            search={authorSearch}
            onSearch={setAuthorSearch}
            selected={selectedAuthor}
            onSelect={setAuthor}
            emptyText={t('speakerEmpty')}
            fill
            inlineSearch
          />
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

      {/* ── Column 2 — search, list ────────────────────────────────────── */}
      <div className="min-w-0 flex flex-col lg:w-[24rem] lg:shrink-0 lg:min-h-0 print:hidden">
        <div className="flex flex-col min-h-0 lg:flex-1 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 p-4">
        {/* Mobile filter row (author / category selects) */}
        <div className="flex lg:hidden gap-2 mb-2.5">
          <MobileFilterTrigger label={t('speaker')} activeLabel={activeAuthorName} onClick={() => setAuthorSheetOpen(true)} />
          {categories.length > 0 && (
            <MobileFilterTrigger label={t('category')} activeLabel={activeCategoryName} onClick={() => setCategorySheetOpen(true)} />
          )}
        </div>

        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('searchPlaceholder')}
        />

        <MobileFilterSheet
          open={authorSheetOpen}
          onClose={() => setAuthorSheetOpen(false)}
          title={t('speaker')}
          options={authors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
          fetchOptions={q => fetchNamedOptions('/api/bayan/authors', q)}
          selected={selectedAuthor}
          onSelect={setAuthor}
          emptyText={t('speakerEmpty')}
        />
        <MobileFilterSheet
          open={categorySheetOpen}
          onClose={() => setCategorySheetOpen(false)}
          title={t('category')}
          options={categories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
          fetchOptions={q => fetchTitledOptions('/api/bayan/categories', q)}
          selected={selectedCategory}
          onSelect={setCategory}
          emptyText={t('categoryEmpty')}
        />

        {/* Active filter chips */}
        {(activeCategoryName || activeAuthorName) && (
          <div className="flex items-center gap-1.5 flex-wrap mt-4">
            {activeCategoryName && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {activeCategoryName}
                <button onClick={() => setCategory('')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeAuthorName && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {activeAuthorName}
                <button onClick={() => setAuthor('')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground hover:underline ml-1">
              {t('clearAll')}
            </button>
          </div>
        )}

        <p className="text-base text-muted-foreground mt-4">
          {loading ? t('loading') : t('resultCount', { count: total })}
        </p>
        </div>

        {/* List — scrolls inside the card */}
        <div ref={scrollRef} className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-border">
                <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : bayans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Mic className="w-14 h-14 text-muted-foreground/25 mb-4" />
            <p className="text-xl font-medium text-foreground">{t('emptyTitle')}</p>
            <p className="text-base text-muted-foreground mt-1">{t('emptyHint')}</p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 text-base text-primary hover:underline">
                {t('clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {bayans.map(bayan => (
              <BayanRow
                key={bayan.id}
                bayan={bayan}
                selected={effectiveSelectedId === bayan.id}
                onSelect={() => selectItem(bayan.id)}
              />
            ))}
          </div>
        )}

        {/* Scroll sentinel — pulls in the next page */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="py-6 text-center text-base text-muted-foreground">
            {loadingMore ? t('loading') : ''}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* ── Column 3 — detail panel (desktop only) ────────────────────── */}
      <div className="hidden lg:flex print:flex lg:flex-1 lg:min-h-0 print:w-full print:h-auto">
        <BayanDetailPanel bayan={detail} />
      </div>
    </div>
  )
}

// ─── Single list row ────────────────────────────────────────────────────────

function BayanRow({ bayan, selected, onSelect }: {
  bayan: BayanListItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group w-full flex items-center gap-4 p-4 text-left rounded-xl border transition-colors',
        selected ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-primary/5'
      )}
    >
      <div className={cn(
        'w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors',
        selected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
      )}>
        <Mic className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-base font-semibold leading-snug transition-colors line-clamp-1',
          selected ? 'text-primary' : 'text-foreground group-hover:text-primary'
        )}>
          {bayan.title}
        </p>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
          <span className="truncate">{bayan.author.name}</span>
          {bayan.location && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {bayan.location}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Detail panel (column 3) ─────────────────────────────────────────────────

function BayanDetailPanel({ bayan }: { bayan: BayanListItem | null }) {
  const t = useTranslations('BayanPage')
  const locale = useLocale()
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)

  const handlePrint = () => window.print()

  const shareContent = bayan
    ? [bayan.title, bayan.author.name, bayan.excerpt].filter(Boolean).join('\n\n')
    : ''

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
    <div className="flex flex-col w-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden print:overflow-visible print:border-none print:rounded-none">
      {!bayan ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 print:hidden">
          <Mic className="w-14 h-14 text-muted-foreground/25 mb-4" />
          <p className="text-base text-muted-foreground">{t('selectPrompt')}</p>
        </div>
      ) : (
        <>
          <AdminEditButton entity="bayan" id={bayan.id} />
          <div className="shrink-0 flex items-start justify-between gap-4 p-6 pb-4 border-b border-border/60">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-foreground leading-snug">{bayan.title}</h2>
              <p className="text-base text-muted-foreground mt-1">{bayan.author.name}</p>
            </div>
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
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/bayan/${bayan.id}`}
                title={bayan.title}
                content={shareContent}
              />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto p-6 print:overflow-visible print:h-auto"
            style={{ zoom: `${zoom}%` }}
          >
            {bayan.excerpt && (
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">{bayan.excerpt}</p>
            )}

            {bayan.audioUrl && (
              <>
                <audio
                  ref={audioRef}
                  src={bayan.audioUrl}
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

                {audioError && (
                  <p className="text-sm text-destructive mt-3">{t('audioError')}</p>
                )}

                {duration > 0 && (
                  <div className="flex items-center gap-2 mt-6 text-base">
                    <span className="text-muted-foreground">{t('audioDuration')}:</span>
                    <span className="font-medium text-foreground">
                      {t('audioDurationValue', { minutes: Math.max(1, Math.round(duration / 60)) })}
                    </span>
                  </div>
                )}

                <a
                  href={bayan.audioUrl}
                  download
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-base font-medium text-foreground hover:bg-muted transition-colors print:hidden"
                >
                  <Download className="w-4 h-4" /> {t('download')}
                </a>
              </>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-border/60 text-sm text-muted-foreground">
              {bayan.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {bayan.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(bayan.publishedAt, locale)}
              </span>
            </div>

            {bayan.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {bayan.categories.map(c => (
                  <span key={c.id} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{c.title}</span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

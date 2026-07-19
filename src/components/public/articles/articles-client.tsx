'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  FileText, X,
  ChevronDown,
} from 'lucide-react'
import type { ArticleListItem, ArticleDetail, ArticleAuthorOption, ArticleCategoryOption, PagedResult } from '@/types'
import { cn } from '@/lib/utils'
import { SidebarOptionSection } from '@/components/public/filter-sidebar'
import { SearchInput } from '@/components/public/search-input'
import { MobileFilterTrigger, MobileFilterSheet } from '@/components/public/mobile-filter-sheet'
import { fetchNamedOptions, fetchTitledOptions } from '@/lib/public-filter-options'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 20

async function fetchArticles(opts: {
  search?: string; categoryId?: string; authorId?: string; page?: number
}): Promise<{ data: ArticleListItem[]; total: number }> {
  const q = new URLSearchParams({ published: 'true', page: String(opts.page ?? 1), pageSize: String(PAGE_SIZE) })
  if (opts.search) q.set('search', opts.search)
  if (opts.categoryId) q.set('categoryId', opts.categoryId)
  if (opts.authorId) q.set('authorId', opts.authorId)
  try {
    const res = await fetch(`${BASE}/api/articles?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<ArticleListItem> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
}

async function fetchArticleDetail(id: string): Promise<ArticleDetail | null> {
  try {
    const res = await fetch(`${BASE}/api/articles/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

interface Props {
  initialItems: ArticleListItem[]
  initialTotal: number
  categories: ArticleCategoryOption[]
  authors: ArticleAuthorOption[]
  initialSearch: string
  initialCategory: string
  initialAuthor: string
}

export function ArticlesClient({
  initialItems, initialTotal, categories, authors,
  initialSearch, initialCategory, initialAuthor,
}: Props) {
  const router = useRouter()
  const t = useTranslations('ArticlesPage')
  const locale = useLocale()

  const [items, setItems] = useState(initialItems)
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasMore = items.length < total
  const hasFilters = !!(search || selectedCategory || selectedAuthor)
  const activeAuthorName = authors.find(a => a.id === selectedAuthor)?.name
  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.title

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedAuthor) params.set('author', selectedAuthor)
    const qs = params.toString()
    router.replace(qs ? `/articles?${qs}` : '/articles', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setExpandedId(null)
      const result = await fetchArticles({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        authorId: selectedAuthor || undefined,
        page: 1,
      })
      setItems(result.data)
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
    fetchArticles({
      search: search || undefined,
      categoryId: selectedCategory || undefined,
      authorId: selectedAuthor || undefined,
      page,
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

  const setCategory = (id: string) => { setSelectedCategory(id === selectedCategory ? '' : id) }
  const setAuthor = (id: string) => { setSelectedAuthor(id === selectedAuthor ? '' : id) }
  const clearAll = () => { setSearch(''); setSelectedCategory(''); setSelectedAuthor('') }

  const filteredAuthors = authorSearch.trim()
    ? authors.filter(a => a.name.toLowerCase().includes(authorSearch.toLowerCase()))
    : authors
  const filteredCategories = categorySearch.trim()
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearch.toLowerCase()))
    : categories

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:flex-1 lg:min-h-0">

      {/* ── Sidebar — both filters share one card ───────────────────── */}
      <aside className="hidden lg:flex lg:w-[320px] lg:shrink-0 lg:min-h-0">
        <div className="flex flex-col gap-12 w-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden">
          {authors.length > 0 && (
            <SidebarOptionSection
              title={t('author')}
              items={filteredAuthors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
              search={authorSearch}
              onSearch={setAuthorSearch}
              selected={selectedAuthor}
              onSelect={setAuthor}
              emptyText={t('authorEmpty')}
              fill
              inlineSearch
            />
          )}
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

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex flex-col lg:flex-1 lg:min-h-0">
        {/* Mobile filter row (author / category selects) */}
        <div className="flex lg:hidden gap-2 mb-2.5">
          {authors.length > 0 && (
            <MobileFilterTrigger label={t('author')} activeLabel={activeAuthorName} onClick={() => setAuthorSheetOpen(true)} />
          )}
          {categories.length > 0 && (
            <MobileFilterTrigger label={t('category')} activeLabel={activeCategoryName} onClick={() => setCategorySheetOpen(true)} />
          )}
        </div>

        {/* Everything below lives in one card, same height as the sidebar card */}
        <div className="flex flex-col min-h-0 lg:flex-1 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 p-4">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('searchPlaceholder')}
        />

        {authors.length > 0 && (
          <MobileFilterSheet
            open={authorSheetOpen}
            onClose={() => setAuthorSheetOpen(false)}
            title={t('author')}
            options={authors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
            fetchOptions={q => fetchNamedOptions('/api/articles/authors', q)}
            selected={selectedAuthor}
            onSelect={setAuthor}
            emptyText={t('authorEmpty')}
          />
        )}
        {categories.length > 0 && (
          <MobileFilterSheet
            open={categorySheetOpen}
            onClose={() => setCategorySheetOpen(false)}
            title={t('category')}
            options={categories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
            fetchOptions={q => fetchTitledOptions('/api/articles/categories', q)}
            selected={selectedCategory}
            onSelect={setCategory}
            emptyText={t('categoryEmpty')}
          />
        )}

        {/* Active chips */}
        {(activeCategoryName || activeAuthorName) && (
          <div className="flex items-center gap-1.5 flex-wrap mt-4">
            {activeCategoryName && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {activeCategoryName}
                <button onClick={() => setCategory('')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeAuthorName && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {activeAuthorName}
                <button onClick={() => setAuthor('')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-1">{t('clearAll')}</button>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          {loading ? t('loading') : t('resultCount', { count: total })}
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
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="w-14 h-14 text-muted-foreground/25 mb-4" />
            <p className="text-lg font-medium text-foreground">{t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('emptyHint')}</p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 text-sm text-primary hover:underline">{t('clearFilters')}</button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <ArticleRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(id => id === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}

        {/* Scroll sentinel — pulls in the next page */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="py-6 text-center text-sm text-muted-foreground">
            {loadingMore ? t('loading') : ''}
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────

function ArticleRow({ item, expanded, onToggle }: {
  item: ArticleListItem
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('ArticlesPage')
  const locale = useLocale()
  const [detail, setDetail] = useState<ArticleDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!expanded || detail) return
    setLoadingDetail(true)
    fetchArticleDetail(item.id).then(d => {
      setDetail(d)
      setLoadingDetail(false)
    })
  }, [expanded, item.id, detail])

  return (
    <div className={cn(
      'rounded-xl border bg-card overflow-hidden transition-colors',
      expanded ? 'border-primary/50' : 'border-border'
    )}>
      <button
        onClick={onToggle}
        className="group w-full flex items-center gap-4 p-4 text-left hover:bg-primary/5 transition-colors"
      >
        <div className={cn(
          'w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors',
          expanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
        )}>
          <FileText className="w-4.5 h-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {item.author && <span className="truncate">{item.author.name}</span>}
            {item.publishedAt && (
              <span className="tabular-nums shrink-0">
                {new Date(item.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {item.categories.length > 0 && (
          <span className="hidden sm:block shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[120px]">
            {item.categories[0].title}
          </span>
        )}

        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
          expanded ? 'rotate-180 text-primary' : 'group-hover:text-foreground'
        )} />
      </button>

      {expanded && (
        <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-6">
          {loadingDetail ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded" style={{ width: `${85 - i * 8}%` }} />
              ))}
            </div>
          ) : detail ? (
            <>
              <div
                className="prose-content text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: detail.body }}
              />
              {detail.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/60">
                  {detail.categories.map(c => (
                    <span key={c.id} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{c.title}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{item.excerpt ?? t('noDetail')}</p>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  Newspaper,
  ChevronDown,
} from 'lucide-react'
import type { NewsListItem, NewsDetail, PagedResult } from '@/types'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/public/search-input'
import { Pagination } from '@/components/public/pagination'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 20

async function fetchNews(opts: { search?: string; page?: number }): Promise<{ data: NewsListItem[]; total: number }> {
  const q = new URLSearchParams({ published: 'true', page: String(opts.page ?? 1), pageSize: String(PAGE_SIZE) })
  if (opts.search) q.set('search', opts.search)
  try {
    const res = await fetch(`${BASE}/api/news?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<NewsListItem> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
}

async function fetchNewsDetail(id: string): Promise<NewsDetail | null> {
  try {
    const res = await fetch(`${BASE}/api/news/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

interface Props {
  initialItems: NewsListItem[]
  initialTotal: number
  initialSearch: string
}

export function NewsClient({ initialItems, initialTotal, initialSearch }: Props) {
  const router = useRouter()
  const t = useTranslations('NewsPage')
  const tCommon = useTranslations('Common')

  const [items, setItems] = useState(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `/news?${qs}` : '/news', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setExpandedId(null)
      const result = await fetchNews({ search: search || undefined, page })
      setItems(result.data)
      setTotal(result.total)
      setLoading(false)
    }, search !== initialSearch ? 350 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page])

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(1) }}
          placeholder={t('searchPlaceholder')}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {loading ? tCommon('loading') : t('resultCount', { count: total })}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Newspaper className="w-14 h-14 text-muted-foreground/25 mb-4" />
          <p className="text-lg font-medium text-foreground">{t('emptyTitle')}</p>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="mt-4 text-sm text-primary hover:underline">
              {t('clearSearch')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <NewsRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(id => id === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────

function NewsRow({ item, expanded, onToggle }: {
  item: NewsListItem
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('NewsPage')
  const locale = useLocale()
  const [detail, setDetail] = useState<NewsDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!expanded || detail) return
    setLoadingDetail(true)
    fetchNewsDetail(item.id).then(d => {
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
          <Newspaper className="w-4.5 h-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </p>
          {item.publishedAt && (
            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
              {new Date(item.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

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
            <div
              className="prose-content text-sm text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: detail.body }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{item.excerpt ?? t('noDetail')}</p>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Newspaper } from 'lucide-react'
import type { NewsListItem, PagedResult } from '@/types'
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

      <p className="text-base text-muted-foreground mb-4">
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
          <p className="text-xl font-medium text-foreground">{t('emptyTitle')}</p>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="mt-4 text-base text-primary hover:underline">
              {t('clearSearch')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <NewsRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────

function NewsRow({ item }: { item: NewsListItem }) {
  const locale = useLocale()

  return (
    <Link
      href={`/news/${item.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/3 transition-colors"
    >
      <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Newspaper className="w-4.5 h-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </p>
        {item.publishedAt && (
          <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
            {new Date(item.publishedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </Link>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, School, X, ChevronDown,
  ChevronLeft, ChevronRight, BookOpen, ArrowRight,
} from 'lucide-react'
import type { MadrasahListItem, MadrasahDetail, PagedResult } from '@/types'
import { cn } from '@/lib/utils'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 20

async function fetchMadrasahs(opts: { search?: string; page?: number }): Promise<{ data: MadrasahListItem[]; total: number }> {
  const q = new URLSearchParams({ page: String(opts.page ?? 1), pageSize: String(PAGE_SIZE) })
  if (opts.search) q.set('search', opts.search)
  try {
    const res = await fetch(`${BASE}/api/madrasahs?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<MadrasahListItem> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
}

async function fetchMadrasahDetail(id: string): Promise<MadrasahDetail | null> {
  try {
    const res = await fetch(`${BASE}/api/madrasahs/${id}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

interface Props {
  initialItems: MadrasahListItem[]
  initialTotal: number
  initialSearch: string
}

export function MadrasahClient({ initialItems, initialTotal, initialSearch }: Props) {
  const router = useRouter()

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
    router.replace(qs ? `/madrasah?${qs}` : '/madrasah', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setExpandedId(null)
      const result = await fetchMadrasahs({ search: search || undefined, page })
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
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="মাদ্রাসা খুঁজুন..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {loading ? 'লোড হচ্ছে...' : `${total.toLocaleString('bn-BD')} টি মাদ্রাসা`}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <School className="w-14 h-14 text-muted-foreground/25 mb-4" />
          <p className="text-lg font-medium text-foreground">কোনো মাদ্রাসা পাওয়া যায়নি</p>
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="mt-4 text-sm text-primary hover:underline">
              অনুসন্ধান মুছুন
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <MadrasahRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(id => id === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> আগের
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= totalPages - 3 ? totalPages - 6 + i
                : page - 3 + i
              return p >= 1 && p <= totalPages ? (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {p}
                </button>
              ) : null
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            পরের <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────

function MadrasahRow({ item, expanded, onToggle }: {
  item: MadrasahListItem
  expanded: boolean
  onToggle: () => void
}) {
  const [detail, setDetail] = useState<MadrasahDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!expanded || detail) return
    setLoadingDetail(true)
    fetchMadrasahDetail(item.id).then(d => {
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
          <School className="w-4.5 h-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </p>
          {item.infoCount > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.infoCount.toLocaleString('bn-BD')} টি অধ্যায়
            </p>
          )}
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
          expanded ? 'rotate-180 text-primary' : 'group-hover:text-foreground'
        )} />
      </button>

      {expanded && (
        <div className="border-t border-border/60 bg-muted/20">
          {loadingDetail ? (
            <div className="p-4 space-y-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg" />
              ))}
            </div>
          ) : detail && detail.infos.length > 0 ? (
            <ul className="divide-y divide-border/40">
              {detail.infos.map((info, idx) => (
                <li key={info.id ?? idx}>
                  <Link
                    href={info.id ? `/madrasah/${item.id}/chapter/${info.id}` : `/madrasah/${item.id}`}
                    className="group flex items-center gap-3 px-5 py-3.5 hover:bg-primary/5 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                      {info.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">{item.excerpt ?? 'কোনো অধ্যায় পাওয়া যায়নি।'}</p>
          )}
        </div>
      )}
    </div>
  )
}

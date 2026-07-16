'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic, X, MapPin, ChevronDown,
} from 'lucide-react'
import type { BayanListItem, BayanAuthorOption, BayanCategoryOption, PagedResult } from '@/types'
import { cn } from '@/lib/utils'
import { SidebarOptionList } from '@/components/public/filter-sidebar'
import { SearchInput } from '@/components/public/search-input'
import { MobileFilterTrigger, MobileFilterSheet } from '@/components/public/mobile-filter-sheet'
import { Pagination } from '@/components/public/pagination'
import { fetchNamedOptions, fetchTitledOptions } from '@/lib/public-filter-options'
import { BayanPlayerCard } from './bayan-player-card'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 20

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
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

  const [bayans, setBayans] = useState(initialBayans)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedAuthor, setSelectedAuthor] = useState(initialAuthor)
  const [authorSearch, setAuthorSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [authorSheetOpen, setAuthorSheetOpen] = useState(false)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = !!(search || selectedCategory || selectedAuthor)
  const activeAuthorName = authors.find(a => a.id === selectedAuthor)?.name
  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.title

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedAuthor) params.set('author', selectedAuthor)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `/bayan?${qs}` : '/bayan', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setExpandedId(null)
      const result = await fetchBayans({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        authorId: selectedAuthor || undefined,
        page,
      })
      setBayans(result.data)
      setTotal(result.total)
      setLoading(false)
    }, search !== initialSearch ? 350 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedAuthor, page])

  const setCategory = (id: string) => { setSelectedCategory(id === selectedCategory ? '' : id); setPage(1) }
  const setAuthor = (id: string) => { setSelectedAuthor(id === selectedAuthor ? '' : id); setPage(1) }
  const clearAll = () => { setSearch(''); setSelectedCategory(''); setSelectedAuthor(''); setPage(1) }

  const filteredAuthors = authorSearch.trim()
    ? authors.filter(a => a.name.toLowerCase().includes(authorSearch.toLowerCase()))
    : authors

  const filteredCategories = categorySearch.trim()
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearch.toLowerCase()))
    : categories

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

      {/* ── Sidebar (desktop) ───────────────────────────────────── */}
      <aside className="hidden lg:block">
        <div className="sticky top-[88px] space-y-5">
          <SidebarOptionList
            title="বক্তা"
            items={filteredAuthors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
            search={authorSearch}
            onSearch={setAuthorSearch}
            selected={selectedAuthor}
            onSelect={setAuthor}
            emptyText="কোনো বক্তা পাওয়া যায়নি"
          />
          {categories.length > 0 && (
            <SidebarOptionList
              title="শ্রেণীবিভাগ"
              items={filteredCategories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
              search={categorySearch}
              onSearch={setCategorySearch}
              selected={selectedCategory}
              onSelect={setCategory}
              emptyText="কোনো বিষয় পাওয়া যায়নি"
            />
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="min-w-0">
        {/* Mobile filter row (author / category selects) */}
        <div className="flex lg:hidden gap-2 mb-2.5">
          <MobileFilterTrigger label="বক্তা" activeLabel={activeAuthorName} onClick={() => setAuthorSheetOpen(true)} />
          {categories.length > 0 && (
            <MobileFilterTrigger label="শ্রেণীবিভাগ" activeLabel={activeCategoryName} onClick={() => setCategorySheetOpen(true)} />
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="বয়ান খুঁজুন..."
          />
        </div>

        <MobileFilterSheet
          open={authorSheetOpen}
          onClose={() => setAuthorSheetOpen(false)}
          title="বক্তা"
          options={authors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
          fetchOptions={q => fetchNamedOptions('/api/bayan/authors', q)}
          selected={selectedAuthor}
          onSelect={setAuthor}
          emptyText="কোনো বক্তা পাওয়া যায়নি"
        />
        <MobileFilterSheet
          open={categorySheetOpen}
          onClose={() => setCategorySheetOpen(false)}
          title="শ্রেণীবিভাগ"
          options={categories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
          fetchOptions={q => fetchTitledOptions('/api/bayan/categories', q)}
          selected={selectedCategory}
          onSelect={setCategory}
          emptyText="কোনো বিষয় পাওয়া যায়নি"
        />

        {/* Active filter chips */}
        {(activeCategoryName || activeAuthorName) && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {activeCategoryName && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {activeCategoryName}
                <button onClick={() => setCategory('')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeAuthorName && (
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {activeAuthorName}
                <button onClick={() => setAuthor('')} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-1">
              সব মুছুন
            </button>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          {loading ? 'লোড হচ্ছে...' : `${total.toLocaleString('bn-BD')} টি বয়ান`}
        </p>

        {/* List */}
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
            <p className="text-lg font-medium text-foreground">কোনো বয়ান পাওয়া যায়নি</p>
            <p className="text-sm text-muted-foreground mt-1">ভিন্ন শব্দ বা ফিল্টার দিয়ে চেষ্টা করুন</p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 text-sm text-primary hover:underline">
                সব ফিল্টার মুছুন
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {bayans.map(bayan => (
              <BayanRow
                key={bayan.id}
                bayan={bayan}
                expanded={expandedId === bayan.id}
                onToggle={() => setExpandedId(id => id === bayan.id ? null : bayan.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
      </div>
    </div>
  )
}

// ─── Bayan row (toggles inline player) ─────────────────────────────────────

function BayanRow({ bayan, expanded, onToggle }: {
  bayan: BayanListItem
  expanded: boolean
  onToggle: () => void
}) {
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
          'w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors',
          expanded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
        )}>
          <Mic className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {bayan.title}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="truncate">{bayan.author.name}</span>
            {bayan.location && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" /> {bayan.location}
              </span>
            )}
          </div>
        </div>

        <div className="hidden sm:block text-xs text-muted-foreground shrink-0 tabular-nums">
          {formatDate(bayan.publishedAt)}
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
          expanded ? 'rotate-180 text-primary' : 'group-hover:text-foreground'
        )} />
      </button>

      {expanded && (
        <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-6">
          <BayanPlayerCard bayan={bayan} />
        </div>
      )}
    </div>
  )
}

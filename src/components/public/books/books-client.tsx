'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Search, BookOpen, X, SlidersHorizontal,
  ChevronLeft, ChevronRight, FileText,
} from 'lucide-react'
import type { Book, BookAuthorOption, BookCategoryOption, PagedResult } from '@/types'
import { cn } from '@/lib/utils'
import { SidebarOptionList } from '@/components/public/filter-sidebar'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const PAGE_SIZE = 24

async function fetchBooks(opts: {
  search?: string; categoryId?: string; authorId?: string; page?: number
}): Promise<{ data: Book[]; total: number }> {
  const q = new URLSearchParams({ published: 'true', page: String(opts.page ?? 1), pageSize: String(PAGE_SIZE) })
  if (opts.search) q.set('search', opts.search)
  if (opts.categoryId) q.set('categoryId', opts.categoryId)
  if (opts.authorId) q.set('authorId', opts.authorId)
  try {
    const res = await fetch(`${BASE}/api/books?${q}`)
    if (!res.ok) return { data: [], total: 0 }
    const r: PagedResult<Book> = await res.json()
    return { data: r.data, total: r.total }
  } catch { return { data: [], total: 0 } }
}

interface Props {
  initialBooks: Book[]
  initialTotal: number
  categories: BookCategoryOption[]
  authors: BookAuthorOption[]
  initialSearch: string
  initialCategory: string
  initialAuthor: string
}

export function BooksClient({
  initialBooks, initialTotal, categories, authors,
  initialSearch, initialCategory, initialAuthor,
}: Props) {
  const router = useRouter()

  const [books, setBooks] = useState(initialBooks)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedAuthor, setSelectedAuthor] = useState(initialAuthor)
  const [authorSearch, setAuthorSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasFilters = !!(search || selectedCategory || selectedAuthor)
  const activeAuthorName = authors.find(a => a.id === selectedAuthor)?.name
  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.title

  // Fetch when filters change (skip initial render — server already sent data)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedAuthor) params.set('author', selectedAuthor)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `/books?${qs}` : '/books', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const result = await fetchBooks({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        authorId: selectedAuthor || undefined,
        page,
      })
      setBooks(result.data)
      setTotal(result.total)
      setLoading(false)
    }, search !== initialSearch ? 350 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, selectedAuthor, page])

  const setCategory = (id: string) => { setSelectedCategory(id === selectedCategory ? '' : id); setPage(1) }
  const setAuthor = (id: string) => { setSelectedAuthor(id === selectedAuthor ? '' : id); setPage(1) }
  const clearAll = () => { setSearch(''); setSelectedCategory(''); setSelectedAuthor(''); setPage(1); setMobileFiltersOpen(false) }

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
            title="লেখক"
            items={filteredAuthors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
            search={authorSearch}
            onSearch={setAuthorSearch}
            selected={selectedAuthor}
            onSelect={setAuthor}
            emptyText="কোনো লেখক পাওয়া যায়নি"
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
        {/* Toolbar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="কিতাব খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileFiltersOpen(o => !o)}
            className={cn(
              'lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0',
              mobileFiltersOpen || selectedAuthor || selectedCategory
                ? 'border-primary bg-primary/8 text-primary'
                : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:border-border/80'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">ফিল্টার</span>
          </button>
        </div>

        {/* Mobile filter panel */}
        {mobileFiltersOpen && (
          <div className="lg:hidden mb-5 space-y-4">
            <SidebarOptionList
              title="লেখক"
              items={filteredAuthors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
              search={authorSearch}
              onSearch={setAuthorSearch}
              selected={selectedAuthor}
              onSelect={setAuthor}
              emptyText="কোনো লেখক পাওয়া যায়নি"
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
        )}

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

        {/* ── Count row ────────────────────────────────────────── */}
        <p className="text-sm text-muted-foreground mb-5">
          {loading ? 'লোড হচ্ছে...' : `${total.toLocaleString('bn-BD')} টি কিতাব`}
        </p>

        {/* ── Book grid ────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-xl bg-muted mb-3" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-14 h-14 text-muted-foreground/25 mb-4" />
            <p className="text-lg font-medium text-foreground">কোনো কিতাব পাওয়া যায়নি</p>
            <p className="text-sm text-muted-foreground mt-1">ভিন্ন শব্দ বা ফিল্টার দিয়ে চেষ্টা করুন</p>
            {hasFilters && (
              <button onClick={clearAll} className="mt-4 text-sm text-primary hover:underline">
                সব ফিল্টার মুছুন
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
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
                      p === page
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.id}`} className="group">
      <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-muted mb-3 shadow-sm group-hover:shadow-md transition-all duration-200">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15 text-primary/30">
            <BookOpen className="w-10 h-10" />
          </div>
        )}
        {book.documentUrl && book.chapterCount === 0 && (
          <div className="absolute top-2 right-2 bg-black/55 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-sm">
            <FileText className="w-2.5 h-2.5" /> PDF
          </div>
        )}
      </div>
      <p className="text-[14px] font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
        {book.title}
      </p>
      {book.authors[0] && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{book.authors[0].name}</p>
      )}
    </Link>
  )
}

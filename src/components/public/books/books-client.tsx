'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  BookOpen, X, FileText,
} from 'lucide-react'
import type { Book, BookAuthorOption, BookCategoryOption, PagedResult } from '@/types'
import { SidebarOptionSection } from '@/components/public/filter-sidebar'
import { SearchInput } from '@/components/public/search-input'
import { MobileFilterTrigger, MobileFilterSheet } from '@/components/public/mobile-filter-sheet'
import { fetchNamedOptions, fetchTitledOptions } from '@/lib/public-filter-options'

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [authorSheetOpen, setAuthorSheetOpen] = useState(false)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasMore = books.length < total
  const hasFilters = !!(search || selectedCategory || selectedAuthor)
  const activeAuthorName = authors.find(a => a.id === selectedAuthor)?.name
  const activeCategoryName = categories.find(c => c.id === selectedCategory)?.title

  // Filters changed → reset to the first page and replace the list
  // (skip initial render — server already sent data)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }

    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedAuthor) params.set('author', selectedAuthor)
    const qs = params.toString()
    router.replace(qs ? `/books?${qs}` : '/books', { scroll: false })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const result = await fetchBooks({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        authorId: selectedAuthor || undefined,
        page: 1,
      })
      setBooks(result.data)
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
    fetchBooks({
      search: search || undefined,
      categoryId: selectedCategory || undefined,
      authorId: selectedAuthor || undefined,
      page,
    }).then(result => {
      if (cancelled) return
      // De-dupe defensively: a filter reset racing an append could re-send page 1 rows.
      setBooks(prev => {
        const seen = new Set(prev.map(b => b.id))
        return [...prev, ...result.data.filter(b => !seen.has(b.id))]
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

  const setCategory = (id: string) => setSelectedCategory(id === selectedCategory ? '' : id)
  const setAuthor = (id: string) => setSelectedAuthor(id === selectedAuthor ? '' : id)
  const clearAll = () => { setSearch(''); setSelectedCategory(''); setSelectedAuthor('') }

  const filteredAuthors = authorSearch.trim()
    ? authors.filter(a => a.name.toLowerCase().includes(authorSearch.toLowerCase()))
    : authors

  const filteredCategories = categorySearch.trim()
    ? categories.filter(c => c.title.toLowerCase().includes(categorySearch.toLowerCase()))
    : categories

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:flex-1 lg:min-h-0">

      {/* ── Sidebar (desktop) — both filters share one card ─────── */}
      <aside className="hidden lg:flex lg:w-[320px] lg:shrink-0 lg:min-h-0">
        <div className="flex flex-col gap-12 w-full min-h-0 rounded-2xl border border-border bg-card overflow-hidden">
          <SidebarOptionSection
            title="লেখক"
            items={filteredAuthors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
            search={authorSearch}
            onSearch={setAuthorSearch}
            selected={selectedAuthor}
            onSelect={setAuthor}
            emptyText="কোনো লেখক পাওয়া যায়নি"
            fill
            inlineSearch
          />
          {categories.length > 0 && (
            <SidebarOptionSection
              title="শ্রেণীবিভাগ"
              items={filteredCategories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
              search={categorySearch}
              onSearch={setCategorySearch}
              selected={selectedCategory}
              onSelect={setCategory}
              emptyText="কোনো বিষয় পাওয়া যায়নি"
              fill
              inlineSearch
            />
          )}
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="min-w-0 flex flex-col lg:flex-1 lg:min-h-0">
        {/* Mobile filter row (author / category selects) */}
        <div className="flex lg:hidden gap-2 mb-2.5">
          <MobileFilterTrigger label="লেখক" activeLabel={activeAuthorName} onClick={() => setAuthorSheetOpen(true)} />
          {categories.length > 0 && (
            <MobileFilterTrigger label="শ্রেণীবিভাগ" activeLabel={activeCategoryName} onClick={() => setCategorySheetOpen(true)} />
          )}
        </div>

        {/* Everything below lives in one card, same height as the sidebar card */}
        <div className="flex flex-col min-h-0 lg:flex-1 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="shrink-0 p-4">
            {/* Search */}
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="কিতাব খুঁজুন..."
            />

          <MobileFilterSheet
            open={authorSheetOpen}
            onClose={() => setAuthorSheetOpen(false)}
            title="লেখক"
            options={authors.map(a => ({ id: a.id, label: a.name, count: a.count }))}
            fetchOptions={q => fetchNamedOptions('/api/books/authors', q)}
            selected={selectedAuthor}
            onSelect={setAuthor}
            emptyText="কোনো লেখক পাওয়া যায়নি"
          />
          <MobileFilterSheet
            open={categorySheetOpen}
            onClose={() => setCategorySheetOpen(false)}
            title="শ্রেণীবিভাগ"
            options={categories.map(c => ({ id: c.id, label: c.title, count: c.count }))}
            fetchOptions={q => fetchTitledOptions('/api/books/categories', q)}
            selected={selectedCategory}
            onSelect={setCategory}
            emptyText="কোনো বিষয় পাওয়া যায়নি"
          />

          {/* Active filter chips */}
          {(activeCategoryName || activeAuthorName) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-4">
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

            {/* ── Count row ──────────────────────────────────────── */}
            <p className="text-sm text-muted-foreground mt-4">
              {loading ? 'লোড হচ্ছে...' : `${total.toLocaleString('bn-BD')} টি কিতাব`}
            </p>
          </div>

          {/* ── Book grid — scrolls inside the card, loads more at the end ── */}
          <div ref={scrollRef} className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))] gap-4 sm:gap-5">
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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))] gap-4 sm:gap-5">
                {books.map(book => <BookCard key={book.id} book={book} />)}
              </div>

              {/* Scroll sentinel — pulls in the next page */}
              {hasMore && (
                <div ref={sentinelRef} className="py-6 text-center text-sm text-muted-foreground">
                  {loadingMore ? 'লোড হচ্ছে...' : ''}
                </div>
              )}
            </>
          )}
          </div>
        </div>
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

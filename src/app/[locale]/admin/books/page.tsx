'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Plus, Search, Pencil, Trash2, BookOpen, Check, ChevronsUpDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { useBookStore } from '@/store/book-store'
import { useAuthorStore } from '@/store/author-store'
import { useCategoryStore } from '@/store/category-store'
import { useChapterStore } from '@/store/chapter-store'
import { useSubChapterStore } from '@/store/subchapter-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { SortableHeader, useTableSort } from '@/components/ui/sortable-header'
import { cn } from '@/lib/utils'
import type { Book, ChapterListItem, SubChapterListItem } from '@/types'

type Tab = 'books' | 'chapters' | 'subchapters'

const BOOKS_PAGE_SIZE = 10
const NESTED_PAGE_SIZE = 20

/** Sortable columns per tab. Values match the API's `sort` keys (`<key>_asc` / `<key>_desc`). */
type SortKey = 'position' | 'title' | 'authors' | 'updated' | 'published'
type ChapterSortKey = 'position' | 'title' | 'book' | 'subs'
type SubChapterSortKey = 'position' | 'title' | 'chapter' | 'book'

export default function BooksPage() {
  const t = useTranslations('BooksAdmin')
  const tc = useTranslations('Common')
  const { result, all: allBooks, loading, fetch, fetchAll: fetchAllBooks, remove, lastParams, setLastParams } = useBookStore()
  const { fetchAll: fetchAuthors, all: authors } = useAuthorStore()
  const { fetch: fetchCategories, categories } = useCategoryStore()
  const { result: chapterResult, loading: chapterLoading, fetch: fetchChapters, remove: removeChapter } = useChapterStore()
  const { result: subResult, loading: subLoading, fetch: fetchSubs, remove: removeSub } = useSubChapterStore()

  const router = useRouter()

  const [tab, setTab] = useState<Tab>('books')
  const [search, setSearch] = useState(lastParams.search || '')
  const [authorId, setAuthorId] = useState(lastParams.authorId || '')
  const [categoryId, setCategoryId] = useState(lastParams.categoryId || '')
  const [bookFilter, setBookFilter] = useState('')
  const [page, setPage] = useState(Number(lastParams.page) || 1)
  
  // Extract initial sort state from lastParams (e.g. 'position_desc' -> { key: 'position', dir: 'desc' })
  const initialSort = (lastParams.sort || 'position_asc').split('_')
  const { sort, toggle: toggleSort, reset: resetSort, param: sortParam } = useTableSort<SortKey>(
    initialSort[0] as SortKey,
    initialSort[1] as 'asc' | 'desc'
  )
  const { sort: chSort, toggle: toggleChSort, reset: resetChSort, param: chSortParam } = useTableSort<ChapterSortKey>('position')
  const { sort: subSort, toggle: toggleSubSort, reset: resetSubSort, param: subSortParam } = useTableSort<SubChapterSortKey>('position')
  const [authorOpen, setAuthorOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [bookFilterOpen, setBookFilterOpen] = useState(false)
  const [deleting, setDeleting] = useState<{ id: string; title: string; type: Tab } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'books') {
      setLastParams({
        search, authorId, categoryId,
        page: String(page),
        sort: sortParam,
      })
    }
  }, [tab, search, authorId, categoryId, page, sortParam, setLastParams])

  const flatCategories = categories.flatMap(c => [c, ...c.children])

  const loadBooks = useCallback(() => {
    fetch({ page, pageSize: BOOKS_PAGE_SIZE, search: search || undefined, authorId: authorId || undefined, categoryId: categoryId || undefined, sort: sortParam })
  }, [fetch, page, search, authorId, categoryId, sortParam])

  const loadChapters = useCallback(() => {
    fetchChapters({ page, pageSize: NESTED_PAGE_SIZE, search: search || undefined, bookId: bookFilter || undefined, sort: chSortParam })
  }, [fetchChapters, page, search, bookFilter, chSortParam])

  const loadSubs = useCallback(() => {
    fetchSubs({ page, pageSize: NESTED_PAGE_SIZE, search: search || undefined, bookId: bookFilter || undefined, sort: subSortParam })
  }, [fetchSubs, page, search, bookFilter, subSortParam])

  useEffect(() => { fetchAuthors(); fetchCategories(); fetchAllBooks() }, [fetchAuthors, fetchCategories, fetchAllBooks])

  useEffect(() => {
    if (tab === 'books') loadBooks()
    else if (tab === 'chapters') loadChapters()
    else loadSubs()
  }, [tab, loadBooks, loadChapters, loadSubs])

  // New rows replace the old ones in place, so without this the list stays mid-scroll
  // after a sort or page change and appears to jump. The admin <main> is the scroller.
  useEffect(() => { scrollRef.current?.closest('main')?.scrollTo({ top: 0 }) }, [sort, chSort, subSort, page, tab])

  function switchTab(newTab: Tab) {
    setTab(newTab); setSearch(''); setPage(1); setBookFilter('')
    resetSort(); resetChSort(); resetSubSort()
  }

  function handleSort(key: SortKey) { toggleSort(key); setPage(1) }
  function handleChSort(key: ChapterSortKey) { toggleChSort(key); setPage(1) }
  function handleSubSort(key: SubChapterSortKey) { toggleSubSort(key); setPage(1) }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      if (deleting.type === 'books') await remove(deleting.id)
      else if (deleting.type === 'chapters') await removeChapter(deleting.id)
      else await removeSub(deleting.id)
      const typeLabel = deleting.type === 'books' ? t('typeBook') : deleting.type === 'chapters' ? t('typeChapter') : t('typeSubchapter')
      toast.success(t('itemDeletedToast', { type: typeLabel }))
      setDeleting(null)
      if (deleting.type === 'books') loadBooks()
      else if (deleting.type === 'chapters') loadChapters()
      else loadSubs()
    } catch { toast.error(t('deleteFailedToast')) }
    finally { setDeleteLoading(false) }
  }

  const totalPages = tab === 'books' ? (result ? Math.ceil(result.total / result.pageSize) : 1)
    : tab === 'chapters' ? (chapterResult ? Math.ceil(chapterResult.total / chapterResult.pageSize) : 1)
    : (subResult ? Math.ceil(subResult.total / subResult.pageSize) : 1)
  const totalCount = tab === 'books' ? result?.total : tab === 'chapters' ? chapterResult?.total : subResult?.total
  const isLoading = tab === 'books' ? loading : tab === 'chapters' ? chapterLoading : subLoading

  return (
    // No inner scroll container: the admin <main> is the only scroller, so the page
    // never shows a nested scrollbar. The pagination sticks to the viewport bottom instead.
    <div ref={scrollRef} className="min-h-full flex flex-col">

      {/* ── Top section ── */}
      <div className="shrink-0 px-4 sm:px-8 pt-8 bg-background">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('title')}
            {totalCount !== undefined && <span className="ml-2 font-semibold text-muted-foreground">({totalCount.toLocaleString()})</span>}
          </h1>
          {tab === 'books' && <Button render={<Link href="/admin/books/new" />} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> {t('addBook')}</Button>}
          {tab === 'chapters' && <Button render={<Link href="/admin/chapters/new" />} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> {t('addChapter')}</Button>}
          {tab === 'subchapters' && <Button render={<Link href="/admin/subchapters/new" />} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> {t('addSubchapter')}</Button>}
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {(['books', 'chapters', 'subchapters'] as Tab[]).map(tb => (
            <button key={tb} onClick={() => switchTab(tb)} className={cn('px-4 py-2 text-sm font-medium transition-colors capitalize border-b-2 -mb-px', tab === tb ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {tb === 'books' ? t('tabBooks') : tb === 'chapters' ? t('tabChapters') : t('tabSubchapters')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={tab === 'books' ? t('searchBooksPlaceholder') : tab === 'chapters' ? t('searchChaptersPlaceholder') : t('searchSubchaptersPlaceholder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-card" />
          </div>

          {tab === 'books' && (
            <div className="flex items-center gap-2">
              <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                <PopoverTrigger className={cn('flex h-9 w-48 items-center justify-between rounded-md border bg-card px-3 text-sm', authorId ? 'border-primary text-foreground' : 'text-muted-foreground')}>
                  <span className="truncate">{authorId ? (authors.find(a => a.id === authorId)?.name ?? t('authorFallback')) : t('allAuthorsOption')}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {authorId && <button type="button" onClick={e => { e.stopPropagation(); setAuthorId(''); setPage(1) }}><X className="w-3.5 h-3.5" /></button>}
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command><CommandInput placeholder={t('searchAuthorsPlaceholder')} /><CommandList>
                    <CommandEmpty>{t('noAuthorsFound')}</CommandEmpty>
                    <CommandGroup>{authors.map(a => (
                      <CommandItem key={a.id} value={a.name} onSelect={() => { setAuthorId(a.id === authorId ? '' : a.id); setPage(1); setAuthorOpen(false) }}>
                        <Check className={cn('mr-2 w-4 h-4', authorId === a.id ? 'opacity-100' : 'opacity-0')} />{a.name}
                      </CommandItem>
                    ))}</CommandGroup>
                  </CommandList></Command>
                </PopoverContent>
              </Popover>

              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger className={cn('flex h-9 w-48 items-center justify-between rounded-md border bg-card px-3 text-sm', categoryId ? 'border-primary text-foreground' : 'text-muted-foreground')}>
                  <span className="truncate">{categoryId ? (flatCategories.find(c => c.id === categoryId)?.title ?? t('categoryFallback')) : t('allCategoriesOption')}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {categoryId && <button type="button" onClick={e => { e.stopPropagation(); setCategoryId(''); setPage(1) }}><X className="w-3.5 h-3.5" /></button>}
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command><CommandInput placeholder={t('searchCategoriesPlaceholder')} /><CommandList>
                    <CommandEmpty>{t('noCategoriesFound')}</CommandEmpty>
                    <CommandGroup>{flatCategories.map(c => (
                      <CommandItem key={c.id} value={c.title} onSelect={() => { setCategoryId(c.id === categoryId ? '' : c.id); setPage(1); setCategoryOpen(false) }}>
                        <Check className={cn('mr-2 w-4 h-4', categoryId === c.id ? 'opacity-100' : 'opacity-0')} />
                        <span className={c.parentId ? 'pl-3 text-muted-foreground' : 'font-medium'}>{c.title}</span>
                      </CommandItem>
                    ))}</CommandGroup>
                  </CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {(tab === 'chapters' || tab === 'subchapters') && (
            <Popover open={bookFilterOpen} onOpenChange={setBookFilterOpen}>
              <PopoverTrigger className={cn('flex h-9 w-56 items-center justify-between rounded-md border bg-card px-3 text-sm', bookFilter ? 'border-primary text-foreground' : 'text-muted-foreground')}>
                <span className="truncate">{allBooks.find(b => b.id === bookFilter)?.title ?? t('allBooksOption')}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {bookFilter && <button type="button" onClick={e => { e.stopPropagation(); setBookFilter(''); setPage(1) }}><X className="w-3.5 h-3.5" /></button>}
                  <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command><CommandInput placeholder={t('searchBooksFilterPlaceholder')} /><CommandList>
                  <CommandEmpty>{t('noBooksFoundOption')}</CommandEmpty>
                  <CommandGroup>{allBooks.map(b => (
                    <CommandItem key={b.id} value={b.title} onSelect={() => { setBookFilter(b.id === bookFilter ? '' : b.id); setPage(1); setBookFilterOpen(false) }}>
                      <Check className={cn('mr-2 w-4 h-4', bookFilter === b.id ? 'opacity-100' : 'opacity-0')} />{b.title}
                    </CommandItem>
                  ))}</CommandGroup>
                </CommandList></Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* ── Table area ── */}
      <div className="flex-1 px-4 sm:px-8 pb-4">

        {tab === 'books' && (
          <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
            {/* table-fixed + colgroup: keeps column widths identical across sorts, so
                re-sorting can't re-measure columns and shift the layout. */}
            <table className="w-full min-w-[960px] table-fixed">
              <colgroup>
                <col className="w-32" />
                <col />
                <col className="w-56" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-28" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <SortableHeader label={t('colPosition')} sortKey="position" sort={sort} onSort={handleSort} />
                  <SortableHeader label={t('colBook')} sortKey="title" sort={sort} onSort={handleSort} />
                  <SortableHeader label={t('colAuthors')} sortKey="authors" sort={sort} onSort={handleSort} />
                  <SortableHeader label={t('colUpdatedAt')} sortKey="updated" sort={sort} onSort={handleSort} />
                  <SortableHeader label={t('colStatus')} sortKey="published" sort={sort} onSort={handleSort} />
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading && Array.from({ length: BOOKS_PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-14 rounded-lg shrink-0" /><div className="space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-32" /></div></div></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16 rounded-lg" /></td>
                  </tr>
                ))}
                {!loading && result?.data.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-20 text-center">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-4"><BookOpen className="w-6 h-6 text-muted-foreground/60" /></div>
                    <p className="font-medium text-foreground">{t('emptyBooksTitle')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('emptyBooksSubtitle')}</p>
                  </td></tr>
                )}
                {!loading && result?.data.map((book: Book) => (
                  <tr key={book.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/books/${book.id}`)}>
                    <td className="px-5 py-4"><span className="text-sm font-mono text-muted-foreground">{book.position}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={book.coverUrl || '/images/default-book.png'} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0 border bg-muted" />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground leading-snug truncate">{book.title}</p>
                          {book.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{book.excerpt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><p className="text-sm text-muted-foreground line-clamp-2">{book.authors.length ? book.authors.map(a => a.name).join(', ') : '—'}</p></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground whitespace-nowrap">{new Date(book.updatedAt).toLocaleDateString()}</span></td>
                    <td className="px-5 py-4">
                      {book.published
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{t('published')}</span>
                        : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t('draft')}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); router.push(`/admin/books/${book.id}/edit`) }} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setDeleting({ id: book.id, title: book.title, type: 'books' }) }} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {tab === 'chapters' && (
          <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
            {/* table-fixed + colgroup: keeps column widths identical across sorts, so
                re-sorting can't re-measure columns and shift the layout. */}
            <table className="w-full min-w-[840px] table-fixed">
              <colgroup>
                <col className="w-32" />
                <col />
                <col className="w-72" />
                <col className="w-28" />
                <col className="w-28" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <SortableHeader label={t('colPosition')} sortKey="position" sort={chSort} onSort={handleChSort} />
                  <SortableHeader label={t('colChapter')} sortKey="title" sort={chSort} onSort={handleChSort} />
                  <SortableHeader label={t('colBook')} sortKey="book" sort={chSort} onSort={handleChSort} />
                  <SortableHeader label={t('colSubs')} sortKey="subs" sort={chSort} onSort={handleChSort} />
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {chapterLoading && Array.from({ length: NESTED_PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-8" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))}
                {!chapterLoading && chapterResult?.data.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-20 text-center"><p className="font-medium">{t('emptyChaptersTitle')}</p></td></tr>
                )}
                {!chapterLoading && chapterResult?.data.map((c: ChapterListItem) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4"><span className="text-sm font-mono text-muted-foreground">{c.position}</span></td>
                    <td className="px-5 py-4"><p className="font-semibold truncate">{c.title}</p></td>
                    <td className="px-5 py-4"><p className="text-sm text-muted-foreground line-clamp-1">{c.bookTitle}</p></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{c.subChapterCount || '—'}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/chapters/${c.id}/edit`)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting({ id: c.id, title: c.title, type: 'chapters' })} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {tab === 'subchapters' && (
          <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
            {/* table-fixed + colgroup: keeps column widths identical across sorts, so
                re-sorting can't re-measure columns and shift the layout. */}
            <table className="w-full min-w-[960px] table-fixed">
              <colgroup>
                <col className="w-32" />
                <col />
                <col className="w-64" />
                <col className="w-64" />
                <col className="w-28" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <SortableHeader label={t('colPosition')} sortKey="position" sort={subSort} onSort={handleSubSort} />
                  <SortableHeader label={t('colSubchapter')} sortKey="title" sort={subSort} onSort={handleSubSort} />
                  <SortableHeader label={t('colChapter')} sortKey="chapter" sort={subSort} onSort={handleSubSort} />
                  <SortableHeader label={t('colBook')} sortKey="book" sort={subSort} onSort={handleSubSort} />
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subLoading && Array.from({ length: NESTED_PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))}
                {!subLoading && subResult?.data.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-20 text-center"><p className="font-medium">{t('emptySubchaptersTitle')}</p></td></tr>
                )}
                {!subLoading && subResult?.data.map((s: SubChapterListItem) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4"><span className="text-sm font-mono text-muted-foreground">{s.position}</span></td>
                    <td className="px-5 py-4"><p className="font-semibold truncate">{s.title}</p></td>
                    <td className="px-5 py-4"><p className="text-sm text-muted-foreground line-clamp-1">{s.chapterTitle}</p></td>
                    <td className="px-5 py-4"><p className="text-sm text-muted-foreground line-clamp-1">{s.bookTitle}</p></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/subchapters/${s.id}/edit`)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting({ id: s.id, title: s.title, type: 'subchapters' })} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

      </div>

      {/* ── Pagination: sticks to the viewport bottom while <main> scrolls ── */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 z-20 mt-auto shrink-0 border-t border-border bg-background/95 px-4 sm:px-8 py-2.5 backdrop-blur-sm">
          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} inline />
        </div>
      )}

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle', { type: deleting?.type === 'books' ? t('typeBook') : deleting?.type === 'chapters' ? t('typeChapter') : t('typeSubchapter') })}</DialogTitle>
            <DialogDescription>{t.rich('deleteDescription', { name: deleting?.title ?? '', strong: chunks => <strong>{chunks}</strong> })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? t('deleting') : tc('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

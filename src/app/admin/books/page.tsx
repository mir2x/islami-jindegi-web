'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, BookOpen, Check, ChevronsUpDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { useBookStore } from '@/store/book-store'
import { useAuthorStore } from '@/store/author-store'
import { useCategoryStore } from '@/store/category-store'
import { useChapterStore } from '@/store/chapter-store'
import { useSubChapterStore } from '@/store/subchapter-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Book, ChapterListItem, SubChapterListItem } from '@/types'

type Tab = 'books' | 'chapters' | 'subchapters'

export default function BooksPage() {
  const { result, loading, fetch, remove } = useBookStore()
  const { fetchAll: fetchAuthors, all: authors } = useAuthorStore()
  const { fetch: fetchCategories, categories } = useCategoryStore()
  const { result: chapterResult, loading: chapterLoading, fetch: fetchChapters, remove: removeChapter } = useChapterStore()
  const { result: subResult, loading: subLoading, fetch: fetchSubs, remove: removeSub } = useSubChapterStore()

  const router = useRouter()

  const [tab, setTab] = useState<Tab>('books')
  const [search, setSearch] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [bookFilter, setBookFilter] = useState('')
  const [page, setPage] = useState(1)
  const [authorOpen, setAuthorOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [bookFilterOpen, setBookFilterOpen] = useState(false)
  const [deleting, setDeleting] = useState<{ id: string; title: string; type: Tab } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const flatCategories = categories.flatMap(c => [c, ...c.children])

  const loadBooks = useCallback(() => {
    fetch({ page, pageSize: 10, search: search || undefined, authorId: authorId || undefined, categoryId: categoryId || undefined })
  }, [fetch, page, search, authorId, categoryId])

  const loadChapters = useCallback(() => {
    fetchChapters({ page, pageSize: 20, search: search || undefined, bookId: bookFilter || undefined })
  }, [fetchChapters, page, search, bookFilter])

  const loadSubs = useCallback(() => {
    fetchSubs({ page, pageSize: 20, search: search || undefined, bookId: bookFilter || undefined })
  }, [fetchSubs, page, search, bookFilter])

  useEffect(() => { fetchAuthors(); fetchCategories() }, [fetchAuthors, fetchCategories])
  useEffect(() => { fetch({ pageSize: 500 }) }, [])

  useEffect(() => {
    if (tab === 'books') loadBooks()
    else if (tab === 'chapters') loadChapters()
    else loadSubs()
  }, [tab, loadBooks, loadChapters, loadSubs])

  function switchTab(t: Tab) { setTab(t); setSearch(''); setPage(1); setBookFilter('') }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      if (deleting.type === 'books') await remove(deleting.id)
      else if (deleting.type === 'chapters') await removeChapter(deleting.id)
      else await removeSub(deleting.id)
      toast.success(`${deleting.type === 'books' ? 'Book' : deleting.type === 'chapters' ? 'Chapter' : 'Subchapter'} deleted`)
      setDeleting(null)
      if (deleting.type === 'books') loadBooks()
      else if (deleting.type === 'chapters') loadChapters()
      else loadSubs()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const allBooks = result?.data ?? []
  const totalPages = tab === 'books' ? (result ? Math.ceil(result.total / result.pageSize) : 1)
    : tab === 'chapters' ? (chapterResult ? Math.ceil(chapterResult.total / chapterResult.pageSize) : 1)
    : (subResult ? Math.ceil(subResult.total / subResult.pageSize) : 1)
  const totalCount = tab === 'books' ? result?.total : tab === 'chapters' ? chapterResult?.total : subResult?.total
  const isLoading = tab === 'books' ? loading : tab === 'chapters' ? chapterLoading : subLoading

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Fixed top section ── */}
      <div className="shrink-0 px-8 pt-8 bg-background">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Books</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount !== undefined ? <><span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> {tab}</> : 'Loading...'}
            </p>
          </div>
          {tab === 'books' && <Button onClick={() => router.push('/admin/books/new')} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Add Book</Button>}
          {tab === 'chapters' && <Button onClick={() => router.push('/admin/chapters/new')} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Add Chapter</Button>}
          {tab === 'subchapters' && <Button onClick={() => router.push('/admin/subchapters/new')} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Add Subchapter</Button>}
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {(['books', 'chapters', 'subchapters'] as Tab[]).map(t => (
            <button key={t} onClick={() => switchTab(t)} className={cn('px-4 py-2 text-sm font-medium transition-colors capitalize border-b-2 -mb-px', tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 py-4">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={`Search ${tab}...`} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-card" />
          </div>

          {tab === 'books' && (
            <div className="flex items-center gap-2">
              <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                <PopoverTrigger className={cn('flex h-9 w-48 items-center justify-between rounded-md border bg-card px-3 text-sm', authorId ? 'border-primary text-foreground' : 'text-muted-foreground')}>
                  <span className="truncate">{authorId ? (authors.find(a => a.id === authorId)?.name ?? 'Author') : 'All authors'}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {authorId && <button type="button" onClick={e => { e.stopPropagation(); setAuthorId(''); setPage(1) }}><X className="w-3.5 h-3.5" /></button>}
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command><CommandInput placeholder="Search authors..." /><CommandList>
                    <CommandEmpty>No authors found.</CommandEmpty>
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
                  <span className="truncate">{categoryId ? (flatCategories.find(c => c.id === categoryId)?.title ?? 'Category') : 'All categories'}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {categoryId && <button type="button" onClick={e => { e.stopPropagation(); setCategoryId(''); setPage(1) }}><X className="w-3.5 h-3.5" /></button>}
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <Command><CommandInput placeholder="Search categories..." /><CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
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
                <span className="truncate">{allBooks.find(b => b.id === bookFilter)?.title ?? 'All books'}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {bookFilter && <button type="button" onClick={e => { e.stopPropagation(); setBookFilter(''); setPage(1) }}><X className="w-3.5 h-3.5" /></button>}
                  <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command><CommandInput placeholder="Search books..." /><CommandList>
                  <CommandEmpty>No books found.</CommandEmpty>
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

      {/* ── Scrollable table area ── */}
      <div className="flex-1 overflow-y-auto px-8 pb-6">

        {tab === 'books' && (
          <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Book</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Authors</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">Pos.</th>
                  <th className="px-5 py-3.5 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-14 rounded-lg shrink-0" /><div className="space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-32" /></div></div></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16 rounded-lg" /></td>
                  </tr>
                ))}
                {!loading && result?.data.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-20 text-center">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-4"><BookOpen className="w-6 h-6 text-muted-foreground/60" /></div>
                    <p className="font-medium text-foreground">No books found</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first book to get started</p>
                  </td></tr>
                )}
                {!loading && result?.data.map((book: Book) => (
                  <tr key={book.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/books/${book.id}`)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {book.coverUrl ? <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0 border" /> : <div className="w-10 h-14 bg-muted rounded-lg flex items-center justify-center shrink-0 border"><BookOpen className="w-4 h-4 text-muted-foreground/60" /></div>}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground leading-snug">{book.title}</p>
                          {book.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{book.excerpt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{book.authors.length ? book.authors.map(a => a.name).join(', ') : '—'}</span></td>
                    <td className="px-5 py-4"><Badge variant="outline" className="text-xs font-medium">{book.language}</Badge></td>
                    <td className="px-5 py-4">
                      {book.published
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Published</span>
                        : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Draft</span>}
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{book.position}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); router.push(`/admin/books/${book.id}/edit`) }} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setDeleting({ id: book.id, title: book.title, type: 'books' }) }} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'chapters' && (
          <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapter</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Book</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">Subs</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">Pos.</th>
                  <th className="px-5 py-3.5 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {chapterLoading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-8" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))}
                {!chapterLoading && chapterResult?.data.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-20 text-center"><p className="font-medium">No chapters found</p></td></tr>
                )}
                {!chapterLoading && chapterResult?.data.map((c: ChapterListItem) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4"><p className="font-semibold">{c.title}</p></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground line-clamp-1">{c.bookTitle}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{c.subChapterCount || '—'}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{c.position}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/chapters/${c.id}/edit`)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting({ id: c.id, title: c.title, type: 'chapters' })} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'subchapters' && (
          <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subchapter</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapter</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Book</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">Pos.</th>
                  <th className="px-5 py-3.5 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subLoading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-36" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))}
                {!subLoading && subResult?.data.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-20 text-center"><p className="font-medium">No subchapters found</p></td></tr>
                )}
                {!subLoading && subResult?.data.map((s: SubChapterListItem) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4"><p className="font-semibold">{s.title}</p></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground line-clamp-1">{s.chapterTitle}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground line-clamp-1">{s.bookTitle}</span></td>
                    <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{s.position}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/subchapters/${s.id}/edit`)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting({ id: s.id, title: s.title, type: 'subchapters' })} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-muted-foreground">Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span></p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="bg-card">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="bg-card">Next</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.type === 'books' ? 'book' : deleting?.type === 'chapters' ? 'chapter' : 'subchapter'}?</DialogTitle>
            <DialogDescription><strong>{deleting?.title}</strong> will be permanently deleted. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Mic, Check, ChevronsUpDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { useBayanStore } from '@/store/bayan-store'
import { useAuthorStore } from '@/store/author-store'
import { useCategoryStore } from '@/store/category-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { SortableHeader, useTableSort } from '@/components/ui/sortable-header'
import { cn } from '@/lib/utils'

/** Sortable columns. Values match the API's `sort` keys (`<key>_asc` / `<key>_desc`). */
type SortKey = 'position' | 'title' | 'author' | 'language' | 'location' | 'date' | 'published'
import type { BayanListItem } from '@/types'

const PAGE_SIZE = 20

export default function BayanPage() {
  const router = useRouter()
  const { result, loading, fetch, remove } = useBayanStore()
  const { fetchAll, all: authors } = useAuthorStore()
  const { fetch: fetchCategories, categories } = useCategoryStore()

  const [search, setSearch] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [published, setPublished] = useState('')
  const [page, setPage] = useState(1)
  const { sort, toggle: toggleSort, param: sortParam } = useTableSort<SortKey>('position')
  const [authorOpen, setAuthorOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [deleting, setDeleting] = useState<BayanListItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const flatCategories = categories.flatMap(c => [c, ...c.children])

  const load = useCallback(() => {
    fetch({
      page, pageSize: PAGE_SIZE, search: search || undefined,
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      published: published === '' ? undefined : published === 'true',
      sort: sortParam,
    })
  }, [fetch, page, search, authorId, categoryId, published, sortParam])

  useEffect(() => { fetchAll(); fetchCategories() }, [fetchAll, fetchCategories])
  useEffect(() => { load() }, [load])

  function handleSort(key: SortKey) { toggleSort(key); setPage(1) }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Deleted')
      setDeleting(null)
      load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1

  return (
    // No inner scroll container: the admin <main> is the only scroller, so the page
    // never shows a nested scrollbar. The pagination sticks to the viewport bottom instead.
    <div className="min-h-full flex flex-col">
      <div className="shrink-0 px-4 sm:px-8 pt-8 pb-4 bg-background">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bayan</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> entries</> : 'Loading...'}
            </p>
          </div>
          <Button render={<Link href="/admin/bayan/new" />} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Bayan
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search bayan..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-card" />
          </div>

          <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
            <PopoverTrigger className={cn('flex h-9 w-44 items-center justify-between rounded-md border bg-card px-3 text-sm', authorId ? 'border-primary text-foreground' : 'text-muted-foreground')}>
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
            <PopoverTrigger className={cn('flex h-9 w-44 items-center justify-between rounded-md border bg-card px-3 text-sm', categoryId ? 'border-primary text-foreground' : 'text-muted-foreground')}>
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

          <Select value={published} onValueChange={v => { setPublished(v ?? ''); setPage(1) }}>
            <SelectTrigger className={cn('w-36 bg-card', published && 'border-primary text-foreground')}><SelectValue placeholder="All status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All status</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 pb-4">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
          {/* table-fixed + colgroup: keeps column widths identical across sorts, so
              re-sorting can't re-measure columns and shift the layout. */}
          <table className="w-full min-w-[1240px] table-fixed">
            <colgroup>
              <col className="w-32" />
              <col />
              <col className="w-56" />
              <col className="w-32" />
              <col className="w-40" />
              <col className="w-36" />
              <col className="w-36" />
              <col className="w-28" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
              <tr className="border-b">
                <SortableHeader label="Position" sortKey="position" sort={sort} onSort={handleSort} />
                <SortableHeader label="Title" sortKey="title" sort={sort} onSort={handleSort} />
                <SortableHeader label="Author" sortKey="author" sort={sort} onSort={handleSort} />
                <SortableHeader label="Language" sortKey="language" sort={sort} onSort={handleSort} />
                <SortableHeader label="Location" sortKey="location" sort={sort} onSort={handleSort} />
                <SortableHeader label="Date" sortKey="date" sort={sort} onSort={handleSort} />
                <SortableHeader label="Status" sortKey="published" sort={sort} onSort={handleSort} />
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-8" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-32" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-20" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                </tr>
              ))}
              {!loading && result?.data.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-20 text-center">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-4"><Mic className="w-6 h-6 text-muted-foreground/60" /></div>
                  <p className="font-medium">No bayan found</p>
                  <p className="text-sm text-muted-foreground mt-1">{search ? 'Try a different search' : 'Add your first entry'}</p>
                </td></tr>
              )}
              {!loading && result?.data.map((item: BayanListItem) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/bayan/${item.id}/edit`)}>
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono text-muted-foreground">{item.position}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold leading-snug truncate">{item.title}</p>
                    {item.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{item.excerpt}</p>}
                  </td>
                  <td className="px-5 py-4"><p className="text-sm text-muted-foreground line-clamp-2">{item.author?.name ?? '—'}</p></td>
                  <td className="px-5 py-4"><Badge variant="outline" className="text-xs">{item.language}</Badge></td>
                  <td className="px-5 py-4"><p className="text-sm text-muted-foreground line-clamp-2">{item.location ?? '—'}</p></td>
                  <td className="px-5 py-4"><span className="text-sm text-muted-foreground whitespace-nowrap">{new Date(item.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                  <td className="px-5 py-4">
                    {item.published
                      ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Published</span>
                      : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Draft</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); router.push(`/admin/bayan/${item.id}/edit`) }} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setDeleting(item) }} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

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
            <DialogTitle>Delete bayan?</DialogTitle>
            <DialogDescription><strong>{deleting?.title}</strong> will be permanently deleted.</DialogDescription>
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

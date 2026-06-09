'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, HelpCircle, Check, ChevronsUpDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { useMasailStore } from '@/store/masail-store'
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
import { cn } from '@/lib/utils'
import type { MasailListItem } from '@/types'

export default function MasailPage() {
  const router = useRouter()
  const { result, loading, fetch, remove } = useMasailStore()
  const { fetchAll, all: authors } = useAuthorStore()
  const { fetch: fetchCategories, categories } = useCategoryStore()

  const [search, setSearch] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [published, setPublished] = useState('')
  const [page, setPage] = useState(1)
  const [authorOpen, setAuthorOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [deleting, setDeleting] = useState<MasailListItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const flatCategories = categories.flatMap(c => [c, ...c.children])

  const load = useCallback(() => {
    fetch({
      page, pageSize: 20, search: search || undefined,
      authorId: authorId || undefined,
      categoryId: categoryId || undefined,
      published: published === '' ? undefined : published === 'true',
    })
  }, [fetch, page, search, authorId, categoryId, published])

  useEffect(() => { fetchAll(); fetchCategories() }, [fetchAll, fetchCategories])
  useEffect(() => { load() }, [load])

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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-8 pt-8 pb-4 bg-background">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Masail</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> entries</> : 'Loading...'}
            </p>
          </div>
          <Button onClick={() => router.push('/admin/masail/new')} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Masail
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search masail..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-card" />
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

      <div className="flex-1 overflow-y-auto px-8 pb-6">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
              <tr className="border-b">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Pos.</th>
                <th className="px-5 py-3.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-56" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-32" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                </tr>
              ))}
              {!loading && result?.data.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-20 text-center">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-4"><HelpCircle className="w-6 h-6 text-muted-foreground/60" /></div>
                  <p className="font-medium">No masail found</p>
                  <p className="text-sm text-muted-foreground mt-1">{search ? 'Try a different search' : 'Add your first entry'}</p>
                </td></tr>
              )}
              {!loading && result?.data.map((item: MasailListItem) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/masail/${item.id}/edit`)}>
                  <td className="px-5 py-4"><p className="font-semibold leading-snug">{item.title}</p></td>
                  <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{item.author?.name ?? '—'}</span></td>
                  <td className="px-5 py-4"><Badge variant="outline" className="text-xs">{item.language}</Badge></td>
                  <td className="px-5 py-4">
                    {item.published
                      ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Published</span>
                      : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Draft</span>}
                  </td>
                  <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{item.position}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); router.push(`/admin/masail/${item.id}/edit`) }} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setDeleting(item) }} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete masail?</DialogTitle>
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

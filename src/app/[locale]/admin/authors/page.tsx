'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthorStore } from '@/store/author-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { SortableHeader, useTableSort } from '@/components/ui/sortable-header'
import type { Author } from '@/types'

/** Sortable columns. Values match the API's `sort` keys (`<key>_asc` / `<key>_desc`). */
type SortKey = 'name' | 'position'

const PAGE_SIZE = 20

export default function AuthorsPage() {
  const router = useRouter()
  const { result, loading, fetch, remove } = useAuthorStore()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { sort, toggle: toggleSort, param: sortParam } = useTableSort<SortKey>('position')
  const [deleting, setDeleting] = useState<Author | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    fetch({ page, pageSize: PAGE_SIZE, search: search || undefined, sort: sortParam })
  }, [fetch, page, search, sortParam])

  useEffect(() => { load() }, [load])

  function handleSort(key: SortKey) { toggleSort(key); setPage(1) }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Author deleted')
      setDeleting(null)
      load()
    } catch {
      toast.error('Failed to delete author')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1

  return (
    // No inner scroll container: the admin <main> is the only scroller, so the page
    // never shows a nested scrollbar. The pagination sticks to the viewport bottom instead.
    <div className="min-h-full flex flex-col">

      {/* ── Fixed top section ── */}
      <div className="shrink-0 px-4 sm:px-8 pt-8 pb-4 bg-background">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result
                ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> authors</>
                : 'Loading...'}
            </p>
          </div>
          <Button render={<Link href="/admin/authors/new" />} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Author
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search authors..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* ── Scrollable table area ── */}
      <div className="flex-1 px-4 sm:px-8 pb-4">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
          {/* table-fixed + colgroup: keeps column widths identical across sorts, so
              re-sorting can't re-measure columns and shift the layout. */}
          <table className="w-full min-w-[560px] table-fixed">
            <colgroup>
              <col />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
              <tr className="border-b">
                <SortableHeader label="Author" sortKey="name" sort={sort} onSort={handleSort} />
                <SortableHeader label="Pos." sortKey="position" sort={sort} onSort={handleSort} />
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                </tr>
              ))}

              {!loading && result?.data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-20 text-center">
                    <div className="inline-flex w-12 h-12 rounded-2xl bg-muted items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">No authors found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {search ? 'Try a different search' : 'Add your first author'}
                    </p>
                  </td>
                </tr>
              )}

              {!loading && result?.data.map(author => (
                <tr key={author.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-semibold truncate">{author.name}</p>
                    {author.info && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {author.info.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{author.position}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/authors/${author.id}/edit`)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(author)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
            <DialogTitle>Delete author?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.name}</strong> will be permanently deleted. Books linked to this author will lose this association.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminNavigation } from '@/lib/use-admin-navigation'
import { Link } from '@/i18n/navigation'
import { Plus, Search, Pencil, Trash2, Users, Merge, ListOrdered } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthorStore } from '@/store/author-store'
import { ApiError } from '@/lib/api'
import { moduleLabel } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { SortableHeader, useTableSort } from '@/components/ui/sortable-header'
import type { Author, AuthorUsage } from '@/types'

/** Sortable columns. Values match the API's `sort` keys (`<key>_asc` / `<key>_desc`). */
type SortKey = 'name' | 'position' | 'modules'

const PAGE_SIZE = 20

export default function AuthorsPage() {
  const navigate = useAdminNavigation()
  const { result, all, loading, fetch, fetchAll, remove, usage, merge } = useAuthorStore()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { sort, toggle: toggleSort, param: sortParam } = useTableSort<SortKey>('position')
  const [deleting, setDeleting] = useState<Author | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [merging, setMerging] = useState<Author | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeLoading, setMergeLoading] = useState(false)
  // Content counts for whichever author is about to be deleted or merged. Fetched on open
  // rather than listed for every row, so the table stays one request.
  const [usageCounts, setUsageCounts] = useState<AuthorUsage[] | null>(null)

  const load = useCallback(() => {
    fetch({ page, pageSize: PAGE_SIZE, search: search || undefined, sort: sortParam })
  }, [fetch, page, search, sortParam])

  useEffect(() => { load() }, [load])
  // The merge dialog picks its target from every author, not just the current page.
  useEffect(() => { fetchAll() }, [fetchAll])

  function handleSort(key: SortKey) { toggleSort(key); setPage(1) }

  async function loadUsage(id: string) {
    setUsageCounts(null)
    try { setUsageCounts(await usage(id)) } catch { setUsageCounts([]) }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Author deleted')
      setDeleting(null)
      load()
      fetchAll()
    } catch (err) {
      // The API refuses while the author still owns content — a delete used to cascade and
      // take their bayan and malfuzat with it.
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete author')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleMerge() {
    if (!merging || !mergeTargetId) return
    setMergeLoading(true)
    try {
      await merge(merging.id, mergeTargetId)
      const target = all.find(a => a.id === mergeTargetId)
      toast.success(`Merged into "${target?.name ?? 'author'}"`)
      setMerging(null)
      setMergeTargetId('')
      load()
      fetchAll()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Merge failed')
    } finally {
      setMergeLoading(false)
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
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/authors/reorder" />} className="gap-2">
              <ListOrdered className="w-4 h-4" /> Reorder
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/authors/new" />} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Add Author
            </Button>
          </div>
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
          <table className="w-full min-w-[680px] table-fixed">
            <colgroup>
              <col />
              <col className="w-56" />
              <col className="w-20" />
              <col className="w-32" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
              <tr className="border-b">
                <SortableHeader label="Author" sortKey="name" sort={sort} onSort={handleSort} />
                <SortableHeader label="Appears in" sortKey="modules" sort={sort} onSort={handleSort} />
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
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16" /></td>
                </tr>
              ))}

              {!loading && result?.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-20 text-center">
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
                  <td className="px-5 py-4">
                    {author.modules?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {author.modules.map(m => (
                          <span
                            key={m.module}
                            title={`Position ${m.position} in ${moduleLabel(m.module)}`}
                            className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            {moduleLabel(m.module)} <span className="tabular-nums opacity-70">#{m.position}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{author.position}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={e => navigate(`/admin/authors/${author.id}/edit`, e)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" title="Merge into another author"
                        onClick={() => { setMerging(author); setMergeTargetId(''); loadUsage(author.id) }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      ><Merge className="w-3.5 h-3.5" /></Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setDeleting(author); loadUsage(author.id) }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      ><Trash2 className="w-3.5 h-3.5" /></Button>
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
              <strong>{deleting?.name}</strong> will be permanently deleted, along with their
              place in every module list.
              {usageCounts === null ? (
                <span className="block mt-2 text-xs">Checking what is attributed to them…</span>
              ) : usageCounts.length > 0 ? (
                <span className="block mt-2 text-destructive">
                  Still has{' '}
                  {usageCounts.map(u => `${u.items} ${moduleLabel(u.module).toLowerCase()}`).join(', ')}.
                  Deleting is blocked until that content is moved — merge instead.
                </span>
              ) : (
                <span className="block mt-2 text-xs text-muted-foreground">No content is attributed to them.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading || usageCounts === null || usageCounts.length > 0}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge is the safe counterpart to delete: content moves instead of being destroyed.
          Without it, staff consolidate authors by renaming one onto another, which moves no
          content and is what produced two identical "মুফতী মনসূরুল হক সাহেব" rows. */}
      <Dialog open={!!merging} onOpenChange={o => { if (!o) { setMerging(null); setMergeTargetId('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge author</DialogTitle>
            <DialogDescription>
              All content and module positions move from <strong>{merging?.name}</strong> to the
              author you pick, and <strong>{merging?.name}</strong> is then deleted.
              {usageCounts === null ? (
                <span className="block mt-2 text-xs">Checking what will move…</span>
              ) : usageCounts.length > 0 ? (
                <span className="block mt-2">
                  Moving{' '}
                  {usageCounts.map(u => `${u.items} ${moduleLabel(u.module).toLowerCase()}`).join(', ')}.
                </span>
              ) : (
                <span className="block mt-2 text-xs text-muted-foreground">This author has no content.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Merge into</Label>
            <Select value={mergeTargetId} onValueChange={v => setMergeTargetId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an author" />
              </SelectTrigger>
              <SelectContent>
                {all
                  .filter(a => a.id !== merging?.id)
                  .map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setMerging(null); setMergeTargetId('') }}>Cancel</Button>
            <Button onClick={handleMerge} disabled={!mergeTargetId || mergeLoading}>
              {mergeLoading ? 'Merging...' : 'Merge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { useAdminNavigation } from '@/lib/use-admin-navigation'
import { Link } from '@/i18n/navigation'
import { Plus, Search, Pencil, Trash2, Tag, ChevronRight, FolderOpen, Merge, ListOrdered } from 'lucide-react'
import { toast } from 'sonner'
import { useCategoryStore } from '@/store/category-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { SortableHeader, useTableSort } from '@/components/ui/sortable-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import { moduleLabel } from '@/lib/modules'
import { cn } from '@/lib/utils'
import type { Category, CategoryUsage } from '@/types'

const PAGE_SIZE = 20

/** Sortable columns. Values match the API's `sort` keys (`<key>_asc` / `<key>_desc`). */
type SortKey = 'title' | 'subs' | 'position' | 'modules'

export default function CategoriesPage() {
  const navigate = useAdminNavigation()
  const { categories, result, pagedLoading: loading, fetchPaged, fetch, remove, usage, merge } = useCategoryStore()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { sort, toggle: toggleSort, param: sortParam } = useTableSort<SortKey>('position')
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [merging, setMerging] = useState<Category | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeLoading, setMergeLoading] = useState(false)
  // Content counts for whichever category is about to be deleted or merged. Fetched on open
  // rather than with the list, so a destructive confirmation never shows a stale number.
  const [usageCounts, setUsageCounts] = useState<CategoryUsage[] | null>(null)
  // Track what's been collapsed rather than what's expanded: parents are expanded by
  // default, so newly loaded rows need no state sync when the page or sort changes.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    fetchPaged({ page, pageSize: PAGE_SIZE, search: search || undefined, sort: sortParam })
  }, [fetchPaged, page, search, sortParam])

  useEffect(() => { load() }, [load])
  // The merge dialog picks its target from the full tree, not just the current page.
  useEffect(() => { fetch() }, [fetch])

  // Both destructive dialogs want the same counts, fetched when one opens.
  async function loadUsage(id: string) {
    setUsageCounts(null)
    try { setUsageCounts(await usage(id)) } catch { setUsageCounts([]) }
  }

  async function handleMerge() {
    if (!merging || !mergeTargetId) return
    setMergeLoading(true)
    try {
      await merge(merging.id, mergeTargetId)
      const target = categories.find(c => c.id === mergeTargetId)
      toast.success(`Merged into "${target?.title ?? 'category'}"`)
      setMerging(null)
      setMergeTargetId('')
      load()
      fetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Merge failed')
    } finally {
      setMergeLoading(false)
    }
  }

  function handleSort(key: SortKey) { toggleSort(key); setPage(1) }

  const isExpanded = (id: string) => !collapsed.has(id)

  function toggleExpand(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Category deleted')
      setDeleting(null)
      load()
      fetch() // keep the shared dropdown tree in sync
    } catch {
      toast.error('Failed to delete — category may have books or subcategories linked to it')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1

  return (
    // No inner scroll container: the admin <main> is the only scroller, so the page
    // never shows a nested scrollbar. The pagination sticks to the viewport bottom instead.
    <div className="min-h-full flex flex-col">

      {/* ── Top section ── */}
      <div className="shrink-0 px-4 sm:px-8 pt-8 pb-4 bg-background">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Categories
            {result && <span className="ml-2 font-semibold text-muted-foreground">({result.total.toLocaleString()})</span>}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/categories/reorder" />} className="gap-2">
              <ListOrdered className="w-4 h-4" /> Reorder
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/categories/new" />} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* ── Table area ── */}
      <div className="flex-1 px-4 sm:px-8 pb-4">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
          {/* table-fixed + colgroup: keeps column widths identical across sorts, so
              re-sorting can't re-measure columns and shift the layout. */}
          <table className="w-full min-w-[760px] table-fixed">
            <colgroup>
              <col />
              <col className="w-20" />
              <col className="w-56" />
              <col className="w-24" />
              <col className="w-36" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
              <tr className="border-b">
                <SortableHeader label="Title" sortKey="title" sort={sort} onSort={handleSort} />
                <SortableHeader label="Subs" sortKey="subs" sort={sort} onSort={handleSort} />
                <SortableHeader label="Modules" sortKey="modules" sort={sort} onSort={handleSort} />
                <SortableHeader label="Position" sortKey="position" sort={sort} onSort={handleSort} />
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-56" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-8" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-40" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16 rounded-lg" /></td>
                </tr>
              ))}

              {!loading && result?.data.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-20 text-center">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-4">
                    <Tag className="w-6 h-6 text-muted-foreground/60" />
                  </div>
                  <p className="font-medium text-foreground">No categories found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search ? 'Try a different search' : 'Add your first category to get started'}
                  </p>
                </td></tr>
              )}

              {!loading && result?.data.map(parent => (
                <Fragment key={parent.id}>
                  <tr className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleExpand(parent.id)}
                          disabled={parent.children.length === 0}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-default"
                          aria-label={isExpanded(parent.id) ? 'Collapse' : 'Expand'}
                        >
                          <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded(parent.id) && parent.children.length > 0 && 'rotate-90')} />
                        </button>
                        <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold truncate">{parent.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">{parent.children.length || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      {parent.modules?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {parent.modules.map(m => (
                            <span
                              key={m.module}
                              title={`Position ${m.position} in ${moduleLabel(m.module)}`}
                              className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >{moduleLabel(m.module)}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">— not in any module</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono text-muted-foreground">{parent.position}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" title="Add subcategory"
                          nativeButton={false} render={<Link href={`/admin/categories/new?parentId=${parent.id}`} />}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        ><Plus className="w-3.5 h-3.5" /></Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={e => navigate(`/admin/categories/${parent.id}/edit`, e)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        ><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button
                          variant="ghost" size="icon" title="Merge into another category"
                          onClick={() => { setMerging(parent); setMergeTargetId(''); loadUsage(parent.id) }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        ><Merge className="w-3.5 h-3.5" /></Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => { setDeleting(parent); loadUsage(parent.id) }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        ><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded(parent.id) && parent.children.map(child => (
                    <tr key={child.id} className="bg-muted/20 hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 min-w-0 pl-8">
                          <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground/80 truncate">{child.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3" />
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono text-muted-foreground">{child.position}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            onClick={e => navigate(`/admin/categories/${child.id}/edit`, e)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          ><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { setDeleting(child); loadUsage(child.id) }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          ><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
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
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.title}</strong> will be permanently deleted, along with its
              place in every module list.
              {deleting && !deleting.parentId && deleting.children?.length > 0 && (
                <span className="block mt-1 text-destructive">
                  This category has {deleting.children.length} subcategories — delete them first.
                </span>
              )}
              {usageCounts === null ? (
                <span className="block mt-2 text-xs">Checking what is attached…</span>
              ) : usageCounts.length > 0 ? (
                <span className="block mt-2 text-destructive">
                  Still attached to{' '}
                  {usageCounts.map(u => `${u.items} ${moduleLabel(u.module).toLowerCase()}`).join(', ')}.
                  Merging keeps that content; deleting does not.
                </span>
              ) : (
                <span className="block mt-2 text-xs text-muted-foreground">No content is attached.</span>
              )}
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

      {/* Merge is the safe counterpart to delete: content moves instead of being orphaned.
          Without it, staff consolidate categories by renaming one onto another, which moves
          no content and is what produced the duplicate titles. */}
      <Dialog open={!!merging} onOpenChange={o => { if (!o) { setMerging(null); setMergeTargetId('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge category</DialogTitle>
            <DialogDescription>
              All content and module positions move from <strong>{merging?.title}</strong> to the
              category you pick, and <strong>{merging?.title}</strong> is then deleted.
              {usageCounts === null ? (
                <span className="block mt-2 text-xs">Checking what will move…</span>
              ) : usageCounts.length > 0 ? (
                <span className="block mt-2">
                  Moving{' '}
                  {usageCounts.map(u => `${u.items} ${moduleLabel(u.module).toLowerCase()}`).join(', ')}.
                </span>
              ) : (
                <span className="block mt-2 text-xs text-muted-foreground">This category has no content.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Merge into</Label>
            <Select value={mergeTargetId} onValueChange={v => setMergeTargetId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(c => c.id !== merging?.id)
                  .map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Tag, ChevronRight, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { useCategoryStore } from '@/store/category-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const router = useRouter()
  const { categories, loading, fetch, remove } = useCategoryStore()

  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (categories.length > 0) {
      setExpanded(new Set(categories.map(c => c.id)))
    }
  }, [categories])

  const parentCategories = categories.filter(c => !c.parentId)

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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
      fetch()
    } catch {
      toast.error('Failed to delete — category may have books or subcategories linked to it')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalCategories = categories.reduce((sum, c) => sum + 1 + c.children.length, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Loading...' : (
              <><span className="font-semibold text-foreground">{parentCategories.length}</span> categories · <span className="font-semibold text-foreground">{totalCategories - parentCategories.length}</span> subcategories</>
            )}
          </p>
        </div>
        <Button onClick={() => router.push('/admin/categories/new')} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Tag className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="font-medium">No categories yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first category to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(parent => (
            <div key={parent.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
              {/* Parent row */}
              <div className="flex items-center gap-3 px-4 py-3.5 group">
                <button
                  onClick={() => toggleExpand(parent.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${expanded.has(parent.id) ? 'rotate-90' : ''}`} />
                </button>
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 font-semibold">{parent.title}</span>
                <span className="text-xs text-muted-foreground mr-2">
                  {parent.children.length > 0 && `${parent.children.length} sub`}
                </span>
                <span className="text-xs text-muted-foreground w-8 text-right">{parent.position}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => router.push(`/admin/categories/new?parentId=${parent.id}`)}
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    title="Add subcategory"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => router.push(`/admin/categories/${parent.id}/edit`)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setDeleting(parent)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Children */}
              {expanded.has(parent.id) && parent.children.length > 0 && (
                <div className="border-t divide-y divide-border/60">
                  {parent.children.map(child => (
                    <div key={child.id} className="flex items-center gap-3 px-4 py-3 pl-11 bg-muted/20 group">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm text-foreground/80">{child.title}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{child.position}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => router.push(`/admin/categories/${child.id}/edit`)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setDeleting(child)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.title}</strong> will be permanently deleted.
              {deleting && !deleting.parentId && deleting.children?.length > 0 && (
                <span className="block mt-1 text-destructive">
                  This category has {deleting.children.length} subcategories — delete them first.
                </span>
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
    </div>
  )
}

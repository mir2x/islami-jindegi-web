'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthorStore } from '@/store/author-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Author } from '@/types'

export default function AuthorsPage() {
  const router = useRouter()
  const { result, loading, fetch, remove } = useAuthorStore()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<Author | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    fetch({ page, pageSize: 20, search: search || undefined })
  }, [fetch, page, search])

  useEffect(() => { load() }, [load])

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
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Fixed top section ── */}
      <div className="shrink-0 px-8 pt-8 pb-4 bg-background">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result
                ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> authors</>
                : 'Loading...'}
            </p>
          </div>
          <Button onClick={() => router.push('/admin/authors/new')} className="gap-2 shadow-sm">
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
      <div className="flex-1 overflow-y-auto px-8 pb-6">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
              <tr className="border-b">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">Pos.</th>
                <th className="px-5 py-3.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: 6 }).map((_, i) => (
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
                    <p className="font-semibold">{author.name}</p>
                    {author.info && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {author.info.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{author.position}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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

        {result && totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span>
            </p>
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

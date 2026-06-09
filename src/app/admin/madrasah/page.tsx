'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, School } from 'lucide-react'
import { toast } from 'sonner'
import { useMadrasahStore } from '@/store/madrasah-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import type { MadrasahListItem } from '@/types'

export default function MadrasahPage() {
  const router = useRouter()
  const { result, loading, fetch, remove } = useMadrasahStore()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<MadrasahListItem | null>(null)
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
            <h1 className="text-2xl font-bold tracking-tight">Madrasah</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> madrasahs</> : 'Loading...'}
            </p>
          </div>
          <Button onClick={() => router.push('/admin/madrasah/new')} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Madrasah
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search madrasahs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9 bg-card" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-6">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <tr className="border-b">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Pos.</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">Info Fields</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">Photos</th>
                <th className="px-5 py-3.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-6" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-56" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-8" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-3.5 w-8" /></td>
                  <td className="px-5 py-4" />
                </tr>
              ))}
              {!loading && result?.data.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-20 text-center">
                  <div className="inline-flex w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-4"><School className="w-6 h-6 text-muted-foreground/60" /></div>
                  <p className="font-medium">No madrasahs found</p>
                  <p className="text-sm text-muted-foreground mt-1">{search ? 'Try a different search' : 'Add your first madrasah'}</p>
                </td></tr>
              )}
              {!loading && result?.data.map(item => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/madrasah/${item.id}/edit`)}>
                  <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{item.position}</span></td>
                  <td className="px-5 py-4">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    {item.excerpt && <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{item.excerpt}</p>}
                  </td>
                  <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{item.infoCount}</span></td>
                  <td className="px-5 py-4"><span className="text-sm text-muted-foreground">{item.photoCount}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); router.push(`/admin/madrasah/${item.id}/edit`) }} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></Button>
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
            <DialogTitle>Delete madrasah?</DialogTitle>
            <DialogDescription><strong>{deleting?.title}</strong> and all its info fields and photos will be permanently deleted.</DialogDescription>
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

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminStore } from '@/store/admin-store'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Admin } from '@/types'

export default function AdminsPage() {
  const { admins, loading, fetch, create, remove } = useAdminStore()
  const currentEmail = useAuthStore((s) => s.email)

  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Admin | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => { fetch() }, [fetch])
  useEffect(() => { load() }, [load])

  async function handleAdd() {
    const trimmed = email.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      await create({ email: trimmed })
      toast.success('Admin added')
      setEmail('')
      load()
    } catch {
      toast.error('Failed to add admin')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Admin removed')
      setDeleting(null)
      load()
    } catch {
      toast.error('Failed to remove admin')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="shrink-0 px-4 sm:px-8 pt-8 pb-4 bg-background">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gmail accounts allowed to sign in to this dashboard.
          </p>
        </div>

        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="name@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            className="bg-card"
          />
          <Button onClick={handleAdd} disabled={adding || !email.trim()} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-8 pb-4">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] table-fixed">
              <colgroup>
                <col />
                <col className="w-40" />
                <col className="w-16" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm rounded-t-xl">
                <tr className="border-b">
                  <th className="px-5 py-3.5 text-left text-sm font-semibold text-muted-foreground">Email</th>
                  <th className="px-5 py-3.5 text-left text-sm font-semibold text-muted-foreground">Added</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))}

                {!loading && admins.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-20 text-center">
                      <div className="inline-flex w-12 h-12 rounded-2xl bg-muted items-center justify-center mb-3">
                        <ShieldCheck className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">No admins found</p>
                    </td>
                  </tr>
                )}

                {!loading && admins.map(admin => {
                  const isSelf = admin.email === currentEmail
                  return (
                    <tr key={admin.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="font-semibold truncate">{admin.email}</p>
                        {isSelf && <p className="text-xs text-muted-foreground mt-0.5">You</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf}
                            title={isSelf ? "You can't remove your own access" : 'Remove admin'}
                            onClick={() => setDeleting(admin)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove admin?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.email}</strong> will no longer be able to sign in to this dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

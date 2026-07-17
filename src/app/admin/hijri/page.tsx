'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Moon, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useHijriStore } from '@/store/hijri-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { HijriMonthSighting } from '@/types'

const HIJRI_MONTHS: Record<number, string> = {
  1: 'Muharram', 2: 'Safar', 3: "Rabi' al-Awwal", 4: "Rabi' al-Thani",
  5: 'Jumada al-Ula', 6: 'Jumada al-Thani', 7: 'Rajab', 8: "Sha'ban",
  9: 'Ramadan', 10: 'Shawwal', 11: "Dhu al-Qi'dah", 12: 'Dhu al-Hijjah',
}

export default function HijriSightingsPage() {
  const router = useRouter()
  const { result, loading, fetch, remove } = useHijriStore()

  const [countryCode, setCountryCode] = useState('')
  const [hijriYear, setHijriYear] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<HijriMonthSighting | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    fetch({
      page,
      pageSize: 20,
      countryCode: countryCode || undefined,
      hijriYear: hijriYear ? parseInt(hijriYear) : undefined,
    })
  }, [fetch, page, countryCode, hijriYear])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Sighting deleted')
      setDeleting(null)
      load()
    } catch {
      toast.error('Failed to delete sighting')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Fixed top ── */}
      <div className="shrink-0 px-4 sm:px-8 pt-8 pb-4 bg-background">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hijri Sightings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result
                ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> sighting overrides</>
                : 'Loading...'}
            </p>
          </div>
          <Button render={<Link href="/admin/hijri/new" />} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Sighting
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={countryCode || 'all'} onValueChange={v => { setCountryCode(!v || v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-36 bg-card">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {['BD', 'SA', 'PK', 'IN', 'AU', 'GB', 'US', 'MY', 'ID'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Hijri year (e.g. 1447)"
            value={hijriYear}
            onChange={e => { setHijriYear(e.target.value); setPage(1) }}
            className="w-52 bg-card"
            type="number"
          />
          {(countryCode || hijriYear) && (
            <button
              onClick={() => { setCountryCode(''); setHijriYear(''); setPage(1) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6">
        <div className="bg-card border rounded-xl shadow-sm" style={{ overflow: 'clip' }}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <tr className="border-b">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hijri Month</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gregorian Start</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</th>
                <th className="px-5 py-3.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))}

              {!loading && result?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-20 text-center">
                    <div className="inline-flex w-12 h-12 rounded-2xl bg-muted items-center justify-center mb-3">
                      <Moon className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium">No sightings found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {countryCode || hijriYear ? 'Try different filters' : 'Add your first sighting override'}
                    </p>
                  </td>
                </tr>
              )}

              {!loading && result?.data.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded">{s.countryCode}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{s.hijriYear} — {s.hijriMonth}. {HIJRI_MONTHS[s.hijriMonth]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.monthNameBn}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono">{s.gregorianStartDate}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => router.push(`/admin/hijri/${s.id}/edit`)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setDeleting(s)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
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
            <DialogTitle>Delete sighting?</DialogTitle>
            <DialogDescription>
              The override for <strong>{deleting?.countryCode} — {deleting?.hijriYear}/{deleting?.hijriMonth} {deleting ? HIJRI_MONTHS[deleting.hijriMonth] : ''}</strong> will be permanently deleted.
              The system will fall back to the default country offset.
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

'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft, GripVertical, ChevronUp, ChevronDown, Save } from 'lucide-react'
import { useAuthorStore } from '@/store/author-store'
import { ApiError } from '@/lib/api'
import { AUTHOR_MODULES, moduleLabel } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Author } from '@/types'

function ReorderAuthors() {
  const router = useRouter()
  const { all, fetchAll, reorder } = useAuthorStore()
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  const requested = searchParams.get('module')
  const [module, setModule] = useState<string>(
    AUTHOR_MODULES.some(m => m.key === requested) ? requested! : AUTHOR_MODULES[0].key,
  )
  // Draft order per module, as ids. Keyed by module so switching modules simply reads a
  // different entry — no effect syncing a copy of the server data into state.
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [dragging, setDragging] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll().finally(() => setLoading(false)) }, [fetchAll])

  const inModule = useMemo(
    () =>
      all
        .filter(a => a.modules?.some(m => m.module === module))
        .sort(
          (a, b) =>
            (a.modules!.find(m => m.module === module)!.position) -
            (b.modules!.find(m => m.module === module)!.position),
        ),
    [all, module],
  )

  const draft = drafts[module]
  const dirty = !!draft

  // The draft holds ids; resolve them against the live data so a refetch cannot desync them.
  const items = useMemo(() => {
    if (!draft) return inModule
    const byId = new Map(inModule.map(a => [a.id, a]))
    return draft.map(id => byId.get(id)).filter((a): a is Author => !!a)
  }, [draft, inModule])

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = items.map(a => a.id)
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDrafts(prev => ({ ...prev, [module]: next }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await reorder(module, items.map(a => a.id))
      toast.success(`${moduleLabel(module)} order saved`)
      setDrafts(prev => { const next = { ...prev }; delete next[module]; return next })
      await fetchAll()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-5">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold">Reorder Authors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each module has its own order. Changing it here affects only the selected module.
        </p>
      </div>

      <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1 max-w-56">
            <Label>Module</Label>
            <Select value={module} onValueChange={v => setModule(v ?? AUTHOR_MODULES[0].key)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTHOR_MODULES.map(m => (
                  <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={!dirty || saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save order'}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No authors are assigned to {moduleLabel(module)} yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((a, i) => (
              <li
                key={a.id}
                draggable
                onDragStart={() => setDragging(i)}
                onDragEnd={() => setDragging(null)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  if (dragging !== null) move(dragging, i)
                  setDragging(null)
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors',
                  dragging === i && 'opacity-40',
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                <span className="w-9 text-xs text-muted-foreground tabular-nums shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm truncate">{a.name}</span>
                {/* Arrows because HTML5 drag-and-drop does not work on touch devices. */}
                <div className="flex shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                    disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                    disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {dirty && (
          <p className="text-xs text-muted-foreground">
            Unsaved changes — positions are written as 1 to {items.length} when you save.
          </p>
        )}
      </div>
    </div>
  )
}

export default function ReorderAuthorsPage() {
  return (
    <Suspense>
      <ReorderAuthors />
    </Suspense>
  )
}

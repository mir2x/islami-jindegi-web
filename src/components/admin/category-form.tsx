'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Merge, AlertTriangle } from 'lucide-react'
import { useCategoryStore } from '@/store/category-store'
import { ApiError } from '@/lib/api'
import { CONTENT_MODULES } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/types'

interface Props {
  category?: Category | null
  defaultParentId?: string
}

/** Mirrors the API's unique index, which is on the normalised title. */
const norm = (s: string) => s.trim().replace(/[‘’]/g, "'").normalize('NFC')

export function CategoryForm({ category, defaultParentId }: Props) {
  const router = useRouter()
  const { categories, fetch: fetchCategories, create, update, merge } = useCategoryStore()
  const isEdit = !!category

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(category?.title ?? '')
  const [parentId, setParentId] = useState(category?.parentId ?? defaultParentId ?? '')
  const [modules, setModules] = useState<string[]>(category?.modules?.map(m => m.module) ?? [])
  const [conflict, setConflict] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const parentCategories = categories.filter(c => !c.parentId)

  /** The existing category a rejected rename collided with, so we can offer to merge into it. */
  const conflictTarget = useMemo(() => {
    if (!conflict) return null
    const all = categories.flatMap(c => [c, ...c.children])
    return all.find(c => norm(c.title) === norm(title) && c.id !== category?.id) ?? null
  }, [conflict, categories, title, category?.id])

  const positionIn = (key: string) => category?.modules?.find(m => m.module === key)?.position

  function toggleModule(key: string, checked: boolean) {
    setModules(prev => (checked ? [...prev, key] : prev.filter(m => m !== key)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    setLoading(true)
    setConflict(null)
    try {
      const payload = { title: title.trim(), parentId: parentId || null, modules }
      if (isEdit) {
        await update(category.id, payload)
        toast.success('Category updated')
      } else {
        await create(payload)
        toast.success('Category created')
      }
      router.back()
    } catch (err) {
      // A duplicate title is the common case here: staff used to consolidate categories by
      // renaming one onto another, which is what created the duplicates in the first place.
      if (err instanceof ApiError && err.status === 409) setConflict(err.message)
      else toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleMerge() {
    if (!category || !conflictTarget) return
    setLoading(true)
    try {
      await merge(category.id, conflictTarget.id)
      toast.success(`Merged into "${conflictTarget.title}"`)
      router.back()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Merge failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-5">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Category' : 'Add New Category'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit ? `Editing "${category.title}"` : 'Fill in the details to add a new category'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h2>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Category title" maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select value={parentId || 'none'} onValueChange={v => setParentId(!v || v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Top-level category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Top-level category</SelectItem>
                  {parentCategories
                    .filter(p => !isEdit || p.id !== category.id)
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appears in</h2>
              <p className="text-xs text-muted-foreground mt-1">
                A new category is added to the end of each list.{' '}
                <Link
                  href={modules.length ? `/admin/categories/reorder?module=${modules[0]}` : '/admin/categories/reorder'}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Reorder
                </Link>{' '}
                to arrange it.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {CONTENT_MODULES.map(m => {
                const checked = modules.includes(m.key)
                const pos = positionIn(m.key)
                return (
                  <label key={m.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <Checkbox checked={checked} onCheckedChange={v => toggleModule(m.key, !!v)} />
                    <span className="text-sm">{m.label}</span>
                    {checked && pos !== undefined && (
                      <span className="text-xs text-muted-foreground">#{pos}</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {conflict && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
              <div className="flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Duplicate title</p>
                  <p className="text-muted-foreground mt-1">{conflict}</p>
                </div>
              </div>
              {isEdit && conflictTarget && (
                <Button type="button" variant="outline" size="sm" onClick={handleMerge} disabled={loading}>
                  <Merge className="w-4 h-4" />
                  Merge into &quot;{conflictTarget.title}&quot;
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="sm:px-8">
              {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

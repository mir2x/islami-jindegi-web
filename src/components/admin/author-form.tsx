'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Merge, AlertTriangle } from 'lucide-react'
import { useAuthorStore } from '@/store/author-store'
import { ApiError } from '@/lib/api'
import { AUTHOR_MODULES } from '@/lib/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RichEditor } from '@/components/admin/rich-editor'
import type { Author } from '@/types'

interface Props {
  author?: Author | null
}

/** Mirrors the API's unique index, which is on the normalised name. */
const norm = (s: string) =>
  s.trim().replace(/[​‌‍﻿]/g, '').replace(/[‘’]/g, "'").normalize('NFC')

export function AuthorForm({ author }: Props) {
  const router = useRouter()
  const { all, fetchAll, create, update, merge } = useAuthorStore()
  const isEdit = !!author

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(author?.name ?? '')
  const [info, setInfo] = useState(author?.info ?? '')
  const [position, setPosition] = useState(author ? String(author.position) : '')
  const [modules, setModules] = useState<string[]>(author?.modules?.map(m => m.module) ?? [])
  const [conflict, setConflict] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [fetchAll])

  /** The existing author a rejected rename collided with, so we can offer to merge into them. */
  const conflictTarget = useMemo(() => {
    if (!conflict) return null
    return all.find(a => norm(a.name) === norm(name) && a.id !== author?.id) ?? null
  }, [conflict, all, name, author?.id])

  const positionIn = (key: string) => author?.modules?.find(m => m.module === key)?.position

  function toggleModule(key: string, checked: boolean) {
    setModules(prev => (checked ? [...prev, key] : prev.filter(m => m !== key)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required'); return }
    setLoading(true)
    setConflict(null)
    try {
      const payload = {
        name: name.trim(),
        info: info || null,
        position: position ? parseInt(position) : undefined,
        modules,
      }
      if (isEdit) {
        await update(author.id, payload)
        toast.success('Author updated')
      } else {
        await create(payload)
        toast.success('Author created')
      }
      router.back()
    } catch (err) {
      // A duplicate name is the common case here: staff used to consolidate authors by renaming
      // one onto another, which moves no content and is what created the duplicates.
      if (err instanceof ApiError && err.status === 409) setConflict(err.message)
      else toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleMerge() {
    if (!author || !conflictTarget) return
    setLoading(true)
    try {
      await merge(author.id, conflictTarget.id)
      toast.success(`Merged into "${conflictTarget.name}"`)
      router.back()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Merge failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-5">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Author' : 'Add New Author'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit ? `Editing "${author.name}"` : 'Fill in the details to add a new author'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Author name" maxLength={150} />
            </div>

            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input
                type="number"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Auto"
                min={1}
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Only orders this admin list. What readers see is the per-module order below.
              </p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appears in</h2>
              <p className="text-xs text-muted-foreground mt-1">
                A new author is added to the end of each list.{' '}
                <Link
                  href={modules.length ? `/admin/authors/reorder?module=${modules[0]}` : '/admin/authors/reorder'}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Reorder
                </Link>{' '}
                to arrange them.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {AUTHOR_MODULES.map(m => {
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

          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bio</h2>
            <RichEditor
              value={info}
              onChange={setInfo}
              placeholder="Short bio or description..."
              editorKey={author?.id ?? 'new'}
            />
          </div>

          {conflict && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
              <div className="flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Duplicate name</p>
                  <p className="text-muted-foreground mt-1">{conflict}</p>
                </div>
              </div>
              {isEdit && conflictTarget && (
                <Button type="button" variant="outline" size="sm" onClick={handleMerge} disabled={loading}>
                  <Merge className="w-4 h-4" />
                  Merge into &quot;{conflictTarget.name}&quot;
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="sm:px-8">
              {loading ? 'Saving...' : isEdit ? 'Update Author' : 'Create Author'}
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

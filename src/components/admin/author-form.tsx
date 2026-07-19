'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useAuthorStore } from '@/store/author-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichEditor } from '@/components/admin/rich-editor'
import type { Author } from '@/types'

interface Props {
  author?: Author | null
}

export function AuthorForm({ author }: Props) {
  const router = useRouter()
  const { create, update } = useAuthorStore()
  const isEdit = !!author

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(author?.name ?? '')
  const [info, setInfo] = useState(author?.info ?? '')
  const [position, setPosition] = useState(author ? String(author.position) : '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required'); return }
    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        info: info || null,
        position: position ? parseInt(position) : undefined,
      }
      if (isEdit) {
        await update(author.id, payload)
        toast.success('Author updated')
      } else {
        await create(payload)
        toast.success('Author created')
      }
      router.back()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
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
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-5">
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
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bio</h2>
            <RichEditor
              value={info}
              onChange={setInfo}
              placeholder="Short bio or description..."
              editorKey={author?.id ?? 'new'}
            />
          </div>

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

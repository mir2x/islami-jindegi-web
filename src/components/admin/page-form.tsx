'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { usePageStore } from '@/store/page-store'
import { RichEditor } from '@/components/admin/rich-editor'
import { MediaField } from '@/components/admin/media-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PageDetail } from '@/types'

interface Props {
  page?: PageDetail | null
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function PageForm({ page }: Props) {
  const router = useRouter()
  const { create, update } = usePageStore()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const isEdit = !!page

  useEffect(() => {
    if (page) {
      setTitle(page.title)
      setSlug(page.slug)
      setSlugTouched(true)
      setBody(page.body)
      setImageUrl(page.imageUrl ?? '')
    }
  }, [page])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!slug.trim()) { toast.error('Slug is required'); return }
    if (!body.trim()) { toast.error('Body is required'); return }

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        body: body.trim(),
        imageUrl: imageUrl || null,
      }
      if (isEdit) {
        await update(page.id, payload)
        toast.success('Page updated')
        router.push('/admin/pages')
      } else {
        await create(payload)
        toast.success('Page created')
        router.push('/admin/pages')
      }
    } catch {
      toast.error('Something went wrong — the slug may already be in use')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pages
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Page' : 'Add Page'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</h2>

          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
              placeholder="About Us"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Slug <span className="text-destructive">*</span>
              <span className="ml-2 text-xs text-muted-foreground font-normal">used by the app to look up this page, must be unique</span>
            </Label>
            <Input
              value={slug}
              onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true) }}
              placeholder="about"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Body <span className="text-destructive">*</span></Label>
            <RichEditor value={body} onChange={setBody} placeholder="Page content..." editorKey={page?.id} />
          </div>

          <div className="space-y-1.5">
            <Label>Image</Label>
            <MediaField accept="image" value={imageUrl} onChange={setImageUrl} placeholder="No image" compact />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="sm:px-8">
            {loading ? 'Saving...' : isEdit ? 'Update Page' : 'Create Page'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}

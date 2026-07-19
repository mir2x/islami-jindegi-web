'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useNewsStore } from '@/store/news-store'
import { RichEditor } from '@/components/admin/rich-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { NewsDetail } from '@/types'

interface Props {
  news?: NewsDetail | null
}

const LANGUAGES = ['Bangla', 'English']

export function NewsForm({ news }: Props) {
  const router = useRouter()
  const { create, update } = useNewsStore()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [language, setLanguage] = useState('Bangla')
  const [published, setPublished] = useState(true)
  const [publishedAt, setPublishedAt] = useState('')
  const [position, setPosition] = useState('')

  const isEdit = !!news

  useEffect(() => {
    if (news) {
      setTitle(news.title)
      setExcerpt(news.excerpt ?? '')
      setBody(news.body)
      setLanguage(news.language)
      setPublished(news.published)
      setPublishedAt(news.publishedAt ? news.publishedAt.split('T')[0] : '')
      setPosition(String(news.position))
    }
  }, [news])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!body.trim()) { toast.error('Body is required'); return }

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt || null,
        body: body.trim(),
        language,
        published,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        position: position ? parseInt(position) : undefined,
      }
      if (isEdit) {
        await update(news.id, payload)
        toast.success('News updated')
        router.push('/admin/news')
      } else {
        await create(payload)
        toast.success('News created')
        router.push('/admin/news')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to news
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit News' : 'Add News'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</h2>

          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="News title" maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Excerpt
              <span className="ml-2 text-xs text-muted-foreground font-normal">for SEO & social media</span>
            </Label>
            <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary..." rows={2} maxLength={300} />
          </div>

          <div className="space-y-1.5">
            <Label>Body <span className="text-destructive">*</span></Label>
            <RichEditor value={body} onChange={setBody} placeholder="Full news content..." editorKey={news?.id} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Language <span className="text-destructive">*</span></Label>
              <Select value={language} onValueChange={v => setLanguage(v ?? 'Bangla')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Published At</Label>
              <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder="Auto" min={1} />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Checkbox id="published" checked={published} onCheckedChange={v => setPublished(!!v)} />
            <Label htmlFor="published" className="cursor-pointer">Published</Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="sm:px-8">
            {loading ? 'Saving...' : isEdit ? 'Update News' : 'Create News'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}

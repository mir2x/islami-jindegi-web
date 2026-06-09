'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, X, ArrowLeft } from 'lucide-react'
import { useArticleStore } from '@/store/article-store'
import { useAuthorStore } from '@/store/author-store'
import { useCategoryStore } from '@/store/category-store'
import { RichEditor } from '@/components/admin/rich-editor'
import { MediaField } from '@/components/admin/media-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { ArticleDetail, Category } from '@/types'

interface Props { item?: ArticleDetail | null }

const LANGUAGES = ['Bangla', 'English', 'Arabic', 'Urdu']

export function ArticleForm({ item }: Props) {
  const router = useRouter()
  const { create, update } = useArticleStore()
  const { all: authors, fetchAll } = useAuthorStore()
  const { categories, fetch: fetchCategories } = useCategoryStore()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [language, setLanguage] = useState('Bangla')
  const [documentUrl, setDocumentUrl] = useState('')
  const [published, setPublished] = useState(true)
  const [publishedAt, setPublishedAt] = useState('')
  const [position, setPosition] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [authorOpen, setAuthorOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const flatCategories = categories.flatMap(c => [c, ...c.children])
  const isEdit = !!item

  useEffect(() => {
    fetchAll()
    fetchCategories()
    if (item) {
      setTitle(item.title)
      setBody(item.body)
      setExcerpt(item.excerpt ?? '')
      setLanguage(item.language)
      setDocumentUrl(item.documentUrl ?? '')
      setPublished(item.published)
      setPublishedAt(item.publishedAt ? item.publishedAt.split('T')[0] : '')
      setPosition(item.position != null ? String(item.position) : '')
      setAuthorId(item.author?.id ?? '')
      setSelectedCategories(item.categories)
    }
  }, [item, fetchAll, fetchCategories])

  function toggleCategory(cat: Category) {
    setSelectedCategories(prev =>
      prev.find(c => c.id === cat.id) ? prev.filter(c => c.id !== cat.id) : [...prev, cat]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!body.trim()) { toast.error('Body is required'); return }
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        body,
        excerpt: excerpt || null,
        language,
        documentUrl: documentUrl || null,
        published,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        position: position ? parseInt(position) : undefined,
        authorId: authorId || null,
        categoryIds: selectedCategories.map(c => c.id),
      }
      if (isEdit) {
        await update(item.id, payload)
        toast.success('Article updated')
      } else {
        await create(payload)
        toast.success('Article created')
      }
      router.push('/admin/articles')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Article' : 'Add New Article'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title" />
            </div>

            <div className="space-y-1.5">
              <Label>Excerpt <span className="ml-2 text-xs text-muted-foreground font-normal">for SEO & social media</span></Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description..." rows={3} maxLength={160} />
              <p className="text-xs text-muted-foreground text-right">{excerpt.length}/160</p>
            </div>

            <div className="space-y-1.5">
              <Label>Language <span className="text-destructive">*</span></Label>
              <Select value={language} onValueChange={v => setLanguage(v ?? 'Bangla')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Body */}
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Article Body <span className="text-destructive">*</span></h2>
            <RichEditor value={body} onChange={setBody} placeholder="Write article content..." editorKey={item?.id} />
          </div>

          {/* Author & Categories */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Author & Categories</h2>

            <div className="space-y-1.5">
              <Label>Author</Label>
              <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                <PopoverTrigger className={cn('flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm', !authorId && 'text-muted-foreground')}>
                  <span className="truncate">{authorId ? (authors.find(a => a.id === authorId)?.name ?? '...') : 'Select author...'}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {authorId && <button type="button" onClick={e => { e.stopPropagation(); setAuthorId('') }}><X className="w-3.5 h-3.5" /></button>}
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command><CommandInput placeholder="Search authors..." /><CommandList>
                    <CommandEmpty>No authors found.</CommandEmpty>
                    <CommandGroup>{authors.map(a => (
                      <CommandItem key={a.id} value={a.name} onSelect={() => { setAuthorId(a.id); setAuthorOpen(false) }}>
                        <Check className={cn('mr-2 w-4 h-4', authorId === a.id ? 'opacity-100' : 'opacity-0')} />{a.name}
                      </CommandItem>
                    ))}</CommandGroup>
                  </CommandList></Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>Categories</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {selectedCategories.length ? `${selectedCategories.length} selected` : <span className="text-muted-foreground">Select categories...</span>}
                  <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command><CommandInput placeholder="Search categories..." /><CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>{flatCategories.map(c => (
                      <CommandItem key={c.id} value={c.title} onSelect={() => toggleCategory(c)}>
                        <Check className={cn('mr-2 w-4 h-4', selectedCategories.find(x => x.id === c.id) ? 'opacity-100' : 'opacity-0')} />
                        <span className={c.parentId ? 'pl-3 text-muted-foreground' : 'font-medium'}>{c.title}</span>
                      </CommandItem>
                    ))}</CommandGroup>
                  </CommandList></Command>
                </PopoverContent>
              </Popover>
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedCategories.map(c => (
                    <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                      {c.title}
                      <button type="button" onClick={() => toggleCategory(c)} className="rounded-full hover:bg-black/10 p-0.5"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Document */}
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Document</h2>
            <MediaField accept="document" value={documentUrl} onChange={setDocumentUrl} placeholder="No document" />
          </div>

          {/* Settings */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder="Auto" min={1} />
              </div>
              <div className="space-y-1.5">
                <Label>Published At</Label>
                <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Checkbox id="published" checked={published} onCheckedChange={v => setPublished(!!v)} />
              <Label htmlFor="published" className="cursor-pointer">Published</Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1 sm:flex-none sm:px-8">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  )
}

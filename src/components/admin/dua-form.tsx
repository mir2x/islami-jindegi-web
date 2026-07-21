'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, X, ArrowLeft } from 'lucide-react'
import { useDuaStore } from '@/store/dua-store'
import { useCategoryStore } from '@/store/category-store'
import { RichEditor } from '@/components/admin/rich-editor'
import { MediaField } from '@/components/admin/media-field'
import { PublicViewButton } from '@/components/admin/public-view-button'
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
import type { Category, DuaDetail } from '@/types'

interface Props { item?: DuaDetail | null }

const LANGUAGES = ['Bangla', 'English', 'Arabic', 'Urdu']

export function DuaForm({ item }: Props) {
  const router = useRouter()
  const { create, update } = useDuaStore()
  const { categories, fetch: fetchCategories } = useCategoryStore()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [language, setLanguage] = useState('Arabic')
  const [audioUrl, setAudioUrl] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [published, setPublished] = useState(true)
  const [position, setPosition] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)

  const flatCategories = categories.flatMap(c => [c, ...c.children])
  const isEdit = !!item

  useEffect(() => {
    fetchCategories()
    if (item) {
      setTitle(item.title)
      setBody(item.body)
      setExcerpt(item.excerpt ?? '')
      setLanguage(item.language)
      setAudioUrl(item.audioUrl ?? '')
      setDocumentUrl(item.documentUrl ?? '')
      setPublished(item.published)
      setPosition(String(item.position))
      setSelectedCategories(item.categories)
    }
  }, [item, fetchCategories])

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
        audioUrl: audioUrl || null,
        documentUrl: documentUrl || null,
        published,
        position: position ? parseInt(position) : undefined,
        categoryIds: selectedCategories.map(c => c.id),
      }
      if (isEdit) {
        await update(item.id, payload)
        toast.success('Dua updated')
      } else {
        await create(payload)
        toast.success('Dua created')
      }
      router.push('/admin/dua')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dua
          </button>
          {item && <PublicViewButton href={`/dua/${item.id}`} />}
        </div>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Dua' : 'Add New Dua'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Dua title" />
            </div>

            <div className="space-y-1.5">
              <Label>Excerpt</Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description..." rows={3} maxLength={160} />
              <p className="text-xs text-muted-foreground text-right">{excerpt.length}/160</p>
            </div>

            <div className="space-y-1.5">
              <Label>Language <span className="text-destructive">*</span></Label>
              <Select value={language} onValueChange={v => setLanguage(v ?? 'Arabic')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Body */}
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dua Text <span className="text-destructive">*</span></h2>
            <RichEditor value={body} onChange={setBody} placeholder="Write dua text..." editorKey={item?.id} />
          </div>

          {/* Categories */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categories</h2>
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

          {/* Media */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Media</h2>
            <div className="space-y-1.5">
              <Label>Audio File</Label>
              <MediaField accept="audio" value={audioUrl} onChange={setAudioUrl} placeholder="No audio selected" />
            </div>
            <div className="space-y-1.5">
              <Label>Document (PDF)</Label>
              <MediaField accept="document" value={documentUrl} onChange={setDocumentUrl} placeholder="No document" />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Settings</h2>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder="Auto" min={1} className="max-w-[160px]" />
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

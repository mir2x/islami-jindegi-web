'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, X, ChevronDown } from 'lucide-react'
import { useBookStore } from '@/store/book-store'
import { useAuthorStore } from '@/store/author-store'
import { useCategoryStore } from '@/store/category-store'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
import type { Author, Book, BookDetail, Category } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  book: Book | BookDetail | null
  onSuccess: () => void
}

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultOpen)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

const LANGUAGES = ['Bangla', 'English']

export function BookSheet({ open, onOpenChange, book, onSuccess }: Props) {
  const { create, update } = useBookStore()
  const { all: authors, fetchAll } = useAuthorStore()
  const { categories, fetch: fetchCategories } = useCategoryStore()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [publisher, setPublisher] = useState('')
  const [price, setPrice] = useState('')
  const [language, setLanguage] = useState('Bangla')
  const [coverUrl, setCoverUrl] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [position, setPosition] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [published, setPublished] = useState(true)
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [authorOpen, setAuthorOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const flatCategories = categories.flatMap(c => [c, ...c.children])

  useEffect(() => {
    if (open) {
      fetchAll()
      fetchCategories()
      if (book) {
        setTitle(book.title)
        setExcerpt(book.excerpt ?? '')
        setPublisher(book.publisher ?? '')
        setPrice(book.price ?? '')
        setLanguage(book.language)
        setCoverUrl(book.coverUrl ?? '')
        setDocumentUrl(book.documentUrl ?? '')
        setPosition(String(book.position))
        setPublishedAt(book.publishedAt ? book.publishedAt.split('T')[0] : '')
        setPublished(book.published)
        setSelectedAuthors(book.authors)
        setSelectedCategories(book.categories)
      } else {
        setTitle(''); setExcerpt(''); setPublisher(''); setPrice('')
        setLanguage('Bangla'); setCoverUrl(''); setDocumentUrl('')
        setPosition(''); setPublishedAt(''); setPublished(true)
        setSelectedAuthors([]); setSelectedCategories([])
      }
    }
  }, [open, book, fetchAll, fetchCategories])

  function toggleAuthor(author: Author) {
    setSelectedAuthors(prev =>
      prev.find(a => a.id === author.id)
        ? prev.filter(a => a.id !== author.id)
        : [...prev, author]
    )
  }

  function toggleCategory(cat: Category) {
    setSelectedCategories(prev =>
      prev.find(c => c.id === cat.id)
        ? prev.filter(c => c.id !== cat.id)
        : [...prev, cat]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!language) { toast.error('Language is required'); return }

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt || null,
        publisher: publisher || null,
        price: price || null,
        language,
        coverUrl: coverUrl || null,
        documentUrl: documentUrl || null,
        position: position ? parseInt(position) : undefined,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        published,
        authorIds: selectedAuthors.map(a => a.id),
        categoryIds: selectedCategories.map(c => c.id),
      }
      if (book) {
        await update(book.id, payload)
        toast.success('Book updated')
      } else {
        await create(payload)
        toast.success('Book created')
      }
      onSuccess()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{book ? 'Edit Book' : 'Add New Book'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Basic Info */}
          <Section title="Basic Information">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Book title" maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label>Excerpt <span className="text-xs text-muted-foreground">(for SEO & social media)</span></Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="Short description..." rows={2} maxLength={160} />
              <p className="text-xs text-muted-foreground text-right">{excerpt.length}/160</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Label>Publisher</Label>
                <Input value={publisher} onChange={e => setPublisher(e.target.value)} placeholder="Publisher name" maxLength={100} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 250 BDT" maxLength={50} />
              </div>
              <div className="space-y-1.5">
                <Label>Published At</Label>
                <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Authors & Categories */}
          <Section title="Authors & Categories">
            <div className="space-y-1.5">
              <Label>Authors</Label>
              <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                <PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {selectedAuthors.length ? `${selectedAuthors.length} selected` : 'Select authors...'}
                  <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search authors..." />
                    <CommandList>
                      <CommandEmpty>No authors found.</CommandEmpty>
                      <CommandGroup>
                        {authors.map(a => (
                          <CommandItem key={a.id} value={a.name} onSelect={() => toggleAuthor(a)}>
                            <Check className={cn('mr-2 w-4 h-4', selectedAuthors.find(x => x.id === a.id) ? 'opacity-100' : 'opacity-0')} />
                            {a.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedAuthors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedAuthors.map(a => (
                    <Badge key={a.id} variant="secondary" className="gap-1">
                      {a.name}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleAuthor(a)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Categories</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                  {selectedCategories.length ? `${selectedCategories.length} selected` : 'Select categories...'}
                  <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {flatCategories.map(c => (
                          <CommandItem key={c.id} value={c.title} onSelect={() => toggleCategory(c)}>
                            <Check className={cn('mr-2 w-4 h-4', selectedCategories.find(x => x.id === c.id) ? 'opacity-100' : 'opacity-0')} />
                            <span className={c.parentId ? 'pl-3 text-muted-foreground' : 'font-medium'}>{c.title}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedCategories.map(c => (
                    <Badge key={c.id} variant="secondary" className="gap-1">
                      {c.title}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleCategory(c)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Media */}
          <Section title="Media" defaultOpen={false}>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://static.islamijindegi.com/..." />
              {coverUrl && <img src={coverUrl} alt="cover preview" className="mt-2 h-24 object-contain rounded border" />}
            </div>
            <div className="space-y-1.5">
              <Label>Document URL</Label>
              <Input value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} placeholder="https://static.islamijindegi.com/..." />
            </div>
          </Section>

          {/* Settings */}
          <Section title="Settings" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Published At</Label>
                <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder="Auto" min={1} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="published-sheet" checked={published} onCheckedChange={v => setPublished(!!v)} />
              <Label htmlFor="published-sheet">Published</Label>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : book ? 'Update Book' : 'Create Book'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, X, ArrowLeft } from 'lucide-react'
import { useBookStore } from '@/store/book-store'
import { useAuthorStore } from '@/store/author-store'
import { useCategoryStore } from '@/store/category-store'
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
import type { Author, Book, BookDetail, Category } from '@/types'

interface Props {
  book?: Book | BookDetail | null
}

const LANGUAGES = ['Bangla', 'English']

export function BookForm({ book }: Props) {
  const t = useTranslations('BookForm')
  const tc = useTranslations('Common')
  const router = useRouter()
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
  const isEdit = !!book

  useEffect(() => {
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
    }
  }, [book, fetchAll, fetchCategories])

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
    if (!title.trim()) { toast.error(t('titleRequired')); return }

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

      if (isEdit) {
        await update(book.id, payload)
        toast.success(t('bookUpdated'))
        router.push(`/admin/books/${book.id}`)
      } else {
        await create(payload)
        toast.success(t('bookCreated'))
        router.push('/admin/books')
      }
    } catch {
      toast.error(tc('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEdit ? t('backToBook') : t('backToBooks')}
        </button>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isEdit ? t('editBook') : t('addNewBook')}
        </p>
        {isEdit && book && (
          <p className="text-sm font-medium mt-0.5 text-foreground/80">{book.title}</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

          {/* LEFT COLUMN */}
          <div className="space-y-4">

            {/* Basic Information */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('basicInformation')}</h2>

              <div className="space-y-1.5">
                <Label>{t('titleLabel')} <span className="text-destructive">*</span></Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('bookTitlePlaceholder')} maxLength={100} />
              </div>

              <div className="space-y-1.5">
                <Label>
                  {t('excerptLabel')}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">{t('excerptHint')}</span>
                </Label>
                <Textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder={t('shortDescriptionPlaceholder')}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground text-right">{excerpt.length}/160</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('languageLabel')} <span className="text-destructive">*</span></Label>
                  <Select value={language} onValueChange={v => setLanguage(v ?? 'Bangla')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('publisherLabel')}</Label>
                  <Input value={publisher} onChange={e => setPublisher(e.target.value)} placeholder={t('publisherPlaceholder')} maxLength={100} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('priceLabel')}</Label>
                  <Input value={price} onChange={e => setPrice(e.target.value)} placeholder={t('pricePlaceholder')} maxLength={50} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('publishedAtLabel')}</Label>
                  <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Authors & Categories — stacked full-width */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('authorsAndCategories')}</h2>

              {/* Authors */}
              <div className="space-y-1.5">
                <Label>{t('authorsLabel')}</Label>
                <Popover open={authorOpen} onOpenChange={setAuthorOpen}>
                  <PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {selectedAuthors.length ? t('selectedCount', { count: selectedAuthors.length }) : t('selectAuthorsPlaceholder')}
                    <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('searchAuthorsPlaceholder')} />
                      <CommandList>
                        <CommandEmpty>{t('noAuthorsFound')}</CommandEmpty>
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
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedAuthors.map(a => (
                      <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
                        {a.name}
                        <button type="button" onClick={e => { e.stopPropagation(); toggleAuthor(a) }} className="rounded-full hover:bg-black/10 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="space-y-1.5">
                <Label>{t('categoriesLabel')}</Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {selectedCategories.length ? t('selectedCount', { count: selectedCategories.length }) : t('selectCategoriesPlaceholder')}
                    <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('searchCategoriesPlaceholder')} />
                      <CommandList>
                        <CommandEmpty>{t('noCategoriesFound')}</CommandEmpty>
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
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedCategories.map(c => (
                      <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                        {c.title}
                        <button type="button" onClick={e => { e.stopPropagation(); toggleCategory(c) }} className="rounded-full hover:bg-black/10 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1 sm:flex-none sm:px-8">
                {loading ? t('saving') : isEdit ? t('updateBook') : t('createBook')}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tc('cancel')}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN — Media + Settings */}
          <div className="space-y-4">

            {/* Media */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('media')}</h2>
              <div className="space-y-1.5">
                <Label>{t('coverImage')}</Label>
                <MediaField accept="image" value={coverUrl} onChange={setCoverUrl} placeholder={t('noCoverImage')} compact />
              </div>
              <div className="space-y-1.5">
                <Label>{t('documentPdf')}</Label>
                <MediaField accept="document" value={documentUrl} onChange={setDocumentUrl} placeholder={t('noDocument')} compact />
              </div>
            </div>

            {/* Settings */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('settings')}</h2>
              <div className="space-y-1.5">
                <Label>{t('positionLabel')}</Label>
                <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder={t('autoPlaceholder')} min={1} />
              </div>
              <div className="flex items-center gap-2.5">
                <Checkbox id="published" checked={published} onCheckedChange={v => setPublished(!!v)} />
                <Label htmlFor="published" className="cursor-pointer">{t('publishedLabel')}</Label>
              </div>
            </div>

          </div>

        </div>
      </form>
    </div>
  )
}

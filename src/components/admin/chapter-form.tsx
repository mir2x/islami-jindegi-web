'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react'
import { useChapterStore } from '@/store/chapter-store'
import { useBookStore } from '@/store/book-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PublicViewButton } from '@/components/admin/public-view-button'
import { RichEditor } from '@/components/admin/rich-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { ChapterDetail } from '@/types'

interface Props {
  chapter?: ChapterDetail | null
  defaultBookId?: string
}

export function ChapterForm({ chapter, defaultBookId }: Props) {
  const t = useTranslations('ChapterForm')
  const tc = useTranslations('Common')
  const router = useRouter()
  const { create, update } = useChapterStore()
  const { result, fetch: fetchBooks } = useBookStore()

  const [loading, setLoading] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [editorKey] = useState(chapter?.id ?? 'new')
  const [form, setForm] = useState({
    title: chapter?.title ?? '',
    body: chapter?.body ?? '',
    position: chapter ? String(chapter.position) : '',
    bookId: chapter?.bookId ?? defaultBookId ?? '',
  })

  const isEdit = !!chapter

  useEffect(() => {
    fetchBooks({ pageSize: 500 })
  }, [fetchBooks])

  const allBooks = result?.data ?? []
  const selectedBook = allBooks.find(b => b.id === form.bookId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error(t('titleRequired')); return }
    if (!isEdit && !form.bookId) { toast.error(t('bookRequired')); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body || null,
        position: form.position ? parseInt(form.position) : undefined,
      }
      if (isEdit) {
        await update(chapter.id, payload)
        toast.success(t('chapterUpdated'))
      } else {
        await create(form.bookId, payload)
        toast.success(t('chapterCreated'))
      }
      router.back()
    } catch {
      toast.error(tc('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {tc('back')}
        </button>
        {isEdit && chapter && (
          <div className="flex items-center gap-2">
            <PublicViewButton href={`/books/${chapter.bookId}?chapter=${chapter.id}`} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4 bg-card border">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('basicInformation')}</h2>

            {isEdit ? (
              <div className="space-y-1.5">
                <Label>{t('bookLabel')}</Label>
                <p className="text-sm font-medium text-foreground">{chapter.bookTitle}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t('bookLabel')} <span className="text-destructive">*</span></Label>
                <Popover open={bookOpen} onOpenChange={setBookOpen}>
                  <PopoverTrigger className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm',
                    form.bookId ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    <span className="truncate">{selectedBook?.title ?? t('selectBookPlaceholder')}</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('searchBooksPlaceholder')} />
                      <CommandList>
                        <CommandEmpty>{t('noBooksFound')}</CommandEmpty>
                        <CommandGroup>
                          {allBooks.map(b => (
                            <CommandItem key={b.id} value={b.title} onSelect={() => { setForm(f => ({ ...f, bookId: b.id })); setBookOpen(false) }}>
                              <Check className={cn('mr-2 w-4 h-4', form.bookId === b.id ? 'opacity-100' : 'opacity-0')} />
                              {b.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t('titleLabel')} <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t('chapterTitlePlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('positionLabel')}</Label>
              <Input
                type="number"
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                placeholder={t('autoPlaceholder')}
                min={1}
                className="w-40"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('content')}</h2>
            <RichEditor
              value={form.body}
              onChange={body => setForm(f => ({ ...f, body }))}
              placeholder={t('chapterContentPlaceholder')}
              editorKey={editorKey}
              className="h-[500px]"
            />
          </div>
        </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={loading} className="flex-1 sm:flex-none sm:px-8">
            {loading ? t('saving') : isEdit ? t('updateChapter') : t('createChapter')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {tc('cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}

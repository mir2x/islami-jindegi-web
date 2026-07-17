'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react'
import { useSubChapterStore } from '@/store/subchapter-store'
import { useChapterStore } from '@/store/chapter-store'
import { useBookStore } from '@/store/book-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RichEditor } from '@/components/admin/rich-editor'
import { cn } from '@/lib/utils'
import type { Chapter, SubChapterDetail } from '@/types'

interface Props {
  subChapter?: SubChapterDetail | null
  defaultBookId?: string
}

export function SubChapterForm({ subChapter, defaultBookId }: Props) {
  const router = useRouter()
  const { create, update } = useSubChapterStore()
  const { fetchByBook } = useChapterStore()
  const { result, fetch: fetchBooks } = useBookStore()

  const [loading, setLoading] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [parentOpen, setParentOpen] = useState(false)
  const [bookChapters, setBookChapters] = useState<Chapter[]>([])
  const [editorKey] = useState(subChapter?.id ?? 'new')
  const [form, setForm] = useState({
    title: subChapter?.title ?? '',
    body: subChapter?.body ?? '',
    position: subChapter ? String(subChapter.position) : '',
    bookId: subChapter?.bookId ?? defaultBookId ?? '',
    chapterId: subChapter?.chapterId ?? '',
    parentSubChapterId: subChapter?.parentSubChapterId ?? '',
  })

  const isEdit = !!subChapter
  const allBooks = result?.data ?? []
  const allSubChapters = bookChapters.flatMap(c => c.subChapters.map(s => ({ ...s, chapterId: c.id })))

  useEffect(() => {
    fetchBooks({ pageSize: 500 })
  }, [fetchBooks])

  useEffect(() => {
    if (form.bookId) {
      fetchByBook(form.bookId).then(setBookChapters)
    } else {
      setBookChapters([])
    }
  }, [form.bookId, fetchByBook])

  const parentLabel = (() => {
    if (form.parentSubChapterId) return allSubChapters.find(s => s.id === form.parentSubChapterId)?.title ?? 'Select parent...'
    if (form.chapterId) return bookChapters.find(c => c.id === form.chapterId)?.title ?? (isEdit ? subChapter.chapterTitle : 'Select parent...')
    return 'Select parent...'
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.chapterId) { toast.error('Parent chapter is required'); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body || null,
        position: form.position ? parseInt(form.position) : undefined,
        chapterId: form.chapterId || undefined,
        parentSubChapterId: form.parentSubChapterId || null,
      }
      if (isEdit) {
        await update(subChapter.id, payload)
        toast.success('Subchapter updated')
      } else {
        await create({ ...payload, chapterId: form.chapterId })
        toast.success('Subchapter created')
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
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Subchapter' : 'Add New Subchapter'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit ? `Editing "${subChapter.title}"` : 'Fill in the details to add a new subchapter'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

            {/* Book selector */}
            <div className="space-y-1.5">
              <Label>Book <span className="text-destructive">*</span></Label>
              <Popover open={bookOpen} onOpenChange={setBookOpen}>
                <PopoverTrigger className={cn(
                  'flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm',
                  form.bookId ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  <span className="truncate">{allBooks.find(b => b.id === form.bookId)?.title ?? 'Select book...'}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search books..." />
                    <CommandList>
                      <CommandEmpty>No books found.</CommandEmpty>
                      <CommandGroup>
                        {allBooks.map(b => (
                          <CommandItem key={b.id} value={b.title} onSelect={() => {
                            setForm(f => ({ ...f, bookId: b.id, chapterId: '', parentSubChapterId: '' }))
                            setBookOpen(false)
                          }}>
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

            {/* Parent picker — always editable */}
            <div className="space-y-1.5">
              <Label>Parent <span className="text-destructive">*</span></Label>
              <Popover open={parentOpen} onOpenChange={setParentOpen}>
                <PopoverTrigger disabled={!form.bookId} className={cn(
                  'flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm disabled:opacity-50',
                  (form.chapterId || form.parentSubChapterId) ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  <span className="truncate">{parentLabel}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                      <CommandEmpty>No results.</CommandEmpty>
                      {bookChapters.length > 0 && (
                        <CommandGroup heading="Chapter">
                          {bookChapters.map(c => (
                            <CommandItem key={c.id} value={c.title} onSelect={() => {
                              setForm(f => ({ ...f, chapterId: c.id, parentSubChapterId: '' }))
                              setParentOpen(false)
                            }}>
                              <Check className={cn('mr-2 w-4 h-4', form.chapterId === c.id && !form.parentSubChapterId ? 'opacity-100' : 'opacity-0')} />
                              {c.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {allSubChapters.length > 0 && (
                        <CommandGroup heading="Subchapter">
                          {allSubChapters.filter(s => s.id !== subChapter?.id).map(s => (
                            <CommandItem key={s.id} value={s.title} onSelect={() => {
                              setForm(f => ({ ...f, chapterId: s.chapterId, parentSubChapterId: s.id }))
                              setParentOpen(false)
                            }}>
                              <Check className={cn('mr-2 w-4 h-4', form.parentSubChapterId === s.id ? 'opacity-100' : 'opacity-0')} />
                              <span className="pl-2">{s.title}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Subchapter title"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input
                type="number"
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                placeholder="Auto"
                min={1}
                className="w-40"
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Content</h2>
            <RichEditor
              value={form.body}
              onChange={body => setForm(f => ({ ...f, body }))}
              placeholder="Subchapter content..."
              editorKey={editorKey}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="sm:px-8">
              {loading ? 'Saving...' : isEdit ? 'Update Subchapter' : 'Create Subchapter'}
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Check, ChevronsUpDown } from 'lucide-react'
import { useChapterStore } from '@/store/chapter-store'
import { useBookStore } from '@/store/book-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RichEditor } from '@/components/admin/rich-editor'
import { cn } from '@/lib/utils'
import type { ChapterDetail } from '@/types'

interface Props {
  chapter?: ChapterDetail | null
  defaultBookId?: string
}

export function ChapterForm({ chapter, defaultBookId }: Props) {
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
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!isEdit && !form.bookId) { toast.error('Book is required'); return }
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body || null,
        position: form.position ? parseInt(form.position) : undefined,
      }
      if (isEdit) {
        await update(chapter.id, payload)
        toast.success('Chapter updated')
      } else {
        await create(form.bookId, payload)
        toast.success('Chapter created')
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
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Chapter' : 'Add New Chapter'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit ? `Editing "${chapter.title}"` : 'Fill in the details to add a new chapter'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

            {isEdit ? (
              <div className="space-y-1.5">
                <Label>Book</Label>
                <p className="text-sm font-medium text-foreground">{chapter.bookTitle}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Book <span className="text-destructive">*</span></Label>
                <Popover open={bookOpen} onOpenChange={setBookOpen}>
                  <PopoverTrigger className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 text-sm',
                    form.bookId ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    <span className="truncate">{selectedBook?.title ?? 'Select book...'}</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search books..." />
                      <CommandList>
                        <CommandEmpty>No books found.</CommandEmpty>
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
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Chapter title"
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
              placeholder="Chapter content..."
              editorKey={editorKey}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="sm:px-8">
              {loading ? 'Saving...' : isEdit ? 'Update Chapter' : 'Create Chapter'}
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

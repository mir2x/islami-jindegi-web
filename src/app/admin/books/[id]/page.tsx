'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, BookOpen, ChevronDown, ChevronRight,
  ExternalLink, Pencil, Globe, BookMarked, Tag, Users, Plus, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useChapterStore } from '@/store/chapter-store'
import { useSubChapterStore } from '@/store/subchapter-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { BookDetail, Chapter, SubChapter } from '@/types'

type Deleting = { id: string; title: string; type: 'chapter' | 'subchapter' }

function SubChapterRow({
  sub,
  childSubs,
  onDelete,
  depth = 0,
}: {
  sub: SubChapter
  childSubs?: SubChapter[]
  onDelete: (item: Deleting) => void
  depth?: number
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const hasChildren = childSubs && childSubs.length > 0

  return (
    <div className={depth > 0 ? 'border-l-2 border-border/50 ml-4 pl-3' : 'border-l-2 border-border ml-6 pl-4'}>
      <div className="flex items-start gap-2 group">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 flex items-start gap-2.5 py-2.5 text-left min-w-0"
        >
          <span className="mt-0.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-snug">
            {sub.title}
            {hasChildren && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({childSubs.length})</span>
            )}
          </span>
        </button>
        <div className="shrink-0 mt-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => router.push(`/admin/subchapters/${sub.id}/edit`)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Edit subchapter"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete({ id: sub.id, title: sub.title, type: 'subchapter' })}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Delete subchapter"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {expanded && (
        <>
          {sub.body && (
            <div className="pb-3 pr-2">
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: sub.body }} />
            </div>
          )}
          {hasChildren && (
            <div className="space-y-0.5">
              {childSubs.map(child => (
                <SubChapterRow key={child.id} sub={child} onDelete={onDelete} depth={depth + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChapterRowControlled({
  chapter,
  index,
  forceExpanded,
  onDelete,
}: {
  chapter: Chapter
  index: number
  forceExpanded: boolean
  onDelete: (item: Deleting) => void
}) {
  const router = useRouter()
  const [localExpanded, setLocalExpanded] = useState(false)
  const expanded = forceExpanded || localExpanded

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-card hover:bg-muted/30 transition-colors group">
        <button
          onClick={() => setLocalExpanded(v => !v)}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {index}
          </span>
          <span className="flex-1 font-semibold text-foreground leading-snug">{chapter.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            {chapter.subChapters.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {chapter.subChapters.length} sub{chapter.subChapters.length === 1 ? '' : 's'}
              </span>
            )}
            {expanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => router.push(`/admin/chapters/${chapter.id}/edit`)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Edit chapter"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete({ id: chapter.id, title: chapter.title, type: 'chapter' })}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Delete chapter"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-3 border-t border-border bg-card">
          {chapter.body && (
            <div className="prose-content mb-4" dangerouslySetInnerHTML={{ __html: chapter.body }} />
          )}
          {chapter.subChapters.length > 0 && (
            <div className="space-y-0.5">
              {(() => {
                const topLevel = chapter.subChapters.filter(s => !s.parentSubChapterId)
                const childMap = new Map<string, SubChapter[]>()
                for (const s of chapter.subChapters) {
                  if (s.parentSubChapterId) {
                    const arr = childMap.get(s.parentSubChapterId) ?? []
                    arr.push(s)
                    childMap.set(s.parentSubChapterId, arr)
                  }
                }
                const rows = topLevel.length > 0 ? topLevel : chapter.subChapters
                return rows.map(sub => (
                  <SubChapterRow key={sub.id} sub={sub} childSubs={childMap.get(sub.id) ?? []} onDelete={onDelete} />
                ))
              })()}
            </div>
          )}
          {!chapter.body && chapter.subChapters.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No content</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { remove: removeChapter } = useChapterStore()
  const { remove: removeSubChapter } = useSubChapterStore()

  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandAll, setExpandAll] = useState(false)
  const [deleting, setDeleting] = useState<Deleting | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadBook = useCallback(() => {
    api.get<BookDetail>(`/api/books/${id}`).then(setBook).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadBook() }, [loadBook])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      if (deleting.type === 'chapter') await removeChapter(deleting.id)
      else await removeSubChapter(deleting.id)
      toast.success(`${deleting.type === 'chapter' ? 'Chapter' : 'Subchapter'} deleted`)
      setDeleting(null)
      loadBook()
    } catch {
      toast.error('Failed to delete — it may have linked content')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalSubChapters = book?.chapters.reduce((sum, c) => sum + c.subChapters.length, 0) ?? 0

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-6">
          <Skeleton className="w-40 h-56 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Book not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/admin/books')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Books
        </button>
        <Button onClick={() => router.push(`/admin/books/${id}/edit`)} variant="outline" className="gap-2">
          <Pencil className="w-3.5 h-3.5" />
          Edit Book
        </Button>
      </div>

      {/* Book header */}
      <div className="flex gap-8 mb-8">
        <div className="shrink-0">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-40 rounded-xl shadow-md border object-cover" />
          ) : (
            <div className="w-40 h-56 rounded-xl border bg-muted flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="text-2xl font-bold leading-tight">{book.title}</h1>
            {book.published ? (
              <span className="mt-1 shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Published
              </span>
            ) : (
              <span className="mt-1 shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Draft
              </span>
            )}
          </div>

          {book.excerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-lg">{book.excerpt}</p>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-foreground">{book.language}</span>
            </div>
            {book.publisher && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookMarked className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-foreground">{book.publisher}</span>
              </div>
            )}
            {book.price && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Price:</span>
                <span className="font-medium text-foreground">{book.price}</span>
              </div>
            )}
            {book.publishedAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Published:</span>
                <span className="font-medium text-foreground">
                  {new Date(book.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">Position:</span>
              <span className="font-medium text-foreground">{book.position}</span>
            </div>
          </div>

          {book.authors.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {book.authors.map(a => (
                  <Badge key={a.id} variant="secondary" className="text-xs">{a.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {book.categories.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {book.categories.map(c => (
                  <Badge key={c.id} variant="outline" className="text-xs">{c.title}</Badge>
                ))}
              </div>
            </div>
          )}

          {book.documentUrl && (
            <a
              href={book.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open document
            </a>
          )}
        </div>
      </div>

      {/* Chapters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Chapters</h2>
            <p className="text-sm text-muted-foreground">
              {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
              {totalSubChapters > 0 && ` · ${totalSubChapters} subchapter${totalSubChapters !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/subchapters/new?bookId=${id}`)} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Subchapter
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/chapters/new?bookId=${id}`)} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Chapter
            </Button>
            {book.chapters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setExpandAll(v => !v)} className="text-muted-foreground text-xs">
                {expandAll ? 'Collapse all' : 'Expand all'}
              </Button>
            )}
          </div>
        </div>

        {book.chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-foreground">No chapters yet</p>
            <p className="text-sm text-muted-foreground mt-1">This book has no chapters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {book.chapters.map((chapter, i) => (
              <ChapterRowControlled
                key={chapter.id}
                chapter={chapter}
                index={i + 1}
                forceExpanded={expandAll}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.type}?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.title}</strong> will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import {
  ArrowLeft, BookOpen, ChevronDown, ChevronRight,
  ExternalLink, Pencil, Globe, BookMarked, Tag, Users, Plus, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useChapterStore } from '@/store/chapter-store'
import { useSubChapterStore } from '@/store/subchapter-store'
import { PublicViewButton } from '@/components/admin/public-view-button'
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
  bookId,
  chapterId,
}: {
  sub: SubChapter
  childSubs?: SubChapter[]
  onDelete: (item: Deleting) => void
  depth?: number
  bookId: string
  chapterId: string
}) {
  const t = useTranslations('BooksAdmin')
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
        <div className="shrink-0 mt-2 flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => router.push(`/admin/subchapters/${sub.id}/edit`)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={t('editSubchapterTooltip')}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <a
            href={`/books/${bookId}?chapter=${chapterId}&sub=${sub.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Public View"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => onDelete({ id: sub.id, title: sub.title, type: 'subchapter' })}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title={t('deleteSubchapterTooltip')}
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
                <SubChapterRow key={child.id} sub={child} childSubs={undefined} onDelete={onDelete} depth={depth + 1} bookId={bookId} chapterId={chapterId} />
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
  bookId,
}: {
  chapter: Chapter
  index: number
  forceExpanded: boolean
  onDelete: (item: Deleting) => void
  bookId: string
}) {
  const t = useTranslations('BooksAdmin')
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
                {t('subCount', { count: chapter.subChapters.length })}
              </span>
            )}
            {expanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
        <div className="shrink-0 flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => router.push(`/admin/chapters/${chapter.id}/edit`)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={t('editChapterTooltip')}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <a
            href={`/books/${bookId}?chapter=${chapter.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Public View"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onDelete({ id: chapter.id, title: chapter.title, type: 'chapter' })}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title={t('deleteChapterTooltip')}
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
                  <SubChapterRow key={sub.id} sub={sub} childSubs={childMap.get(sub.id) ?? []} onDelete={onDelete} bookId={bookId} chapterId={chapter.id} />
                ))
              })()}
            </div>
          )}
          {!chapter.body && chapter.subChapters.length === 0 && (
            <p className="text-sm text-muted-foreground italic">{t('noContent')}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function BookDetailPage() {
  const t = useTranslations('BooksAdmin')
  const tc = useTranslations('Common')
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
      toast.success(t('itemDeletedToast', { type: deleting.type === 'chapter' ? t('typeChapter') : t('typeSubchapter') }))
      setDeleting(null)
      loadBook()
    } catch {
      toast.error(t('deleteFailedLinked'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalSubChapters = book?.chapters.reduce((sum, c) => sum + c.subChapters.length, 0) ?? 0

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-5 w-32" />
        
        <div className="p-4 sm:p-5 border border-border rounded-xl space-y-4 bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-5 w-40 rounded-full" />
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
      <div className="p-4 sm:p-8 text-center">
        <p className="text-muted-foreground">{t('bookNotFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>{t('goBack')}</Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/admin/books')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('title')}
        </button>
        <div className="flex items-center gap-2">
          <PublicViewButton href={`/books/${id}`} />
          <Button onClick={() => router.push(`/admin/books/${id}/edit`)} variant="outline" className="gap-2">
            <Pencil className="w-3.5 h-3.5" />
            {t('editBook')}
          </Button>
        </div>
      </div>

      {/* Book header */}
      <div className="mb-6 p-4 sm:p-5 bg-card border border-border rounded-xl shadow-sm">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{book.title}</h1>
              {book.published ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{t('published')}
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{t('draft')}
                </span>
              )}
            </div>
            {book.documentUrl && (
              <a
                href={book.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/10 px-2.5 py-1.5 rounded-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('openDocument')}
              </a>
            )}
          </div>

          {book.excerpt && (
            <p className="text-muted-foreground text-sm leading-relaxed">{book.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="text-foreground">{book.language}</span>
            </div>
            {book.publisher && (
              <div className="flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 shrink-0" />
                <span className="text-foreground">{book.publisher}</span>
              </div>
            )}
            {book.price && (
              <div className="flex items-center gap-1.5">
                <span>{t('priceLabelShort')} <span className="text-foreground">{book.price}</span></span>
              </div>
            )}
            {book.publishedAt && (
              <div className="flex items-center gap-1.5">
                <span>{t('publishedLabelShort')} <span className="text-foreground">{new Date(book.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span>{t('positionLabelShort')} <span className="text-foreground">{book.position}</span></span>
            </div>

            {book.authors.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {book.authors.map(a => (
                    <Badge key={a.id} variant="secondary" className="text-[11px] px-2 py-0 h-5">{a.name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {book.categories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {book.categories.map(c => (
                    <Badge key={c.id} variant="outline" className="text-[11px] px-2 py-0 h-5">{c.title}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{t('chaptersHeading')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('chapterCount', { count: book.chapters.length })}
              {totalSubChapters > 0 && ` · ${t('subchapterCount', { count: totalSubChapters })}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href={`/admin/subchapters/new?bookId=${id}`} />} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> {t('addSubchapter')}
            </Button>
            <Button variant="outline" size="sm" render={<Link href={`/admin/chapters/new?bookId=${id}`} />} className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> {t('addChapter')}
            </Button>
            {book.chapters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setExpandAll(v => !v)} className="text-muted-foreground text-xs">
                {expandAll ? t('collapseAll') : t('expandAll')}
              </Button>
            )}
          </div>
        </div>

        {book.chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="font-medium text-foreground">{t('noChaptersTitle')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noChaptersSubtitle')}</p>
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
                bookId={id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle', { type: deleting?.type === 'chapter' ? t('typeChapter') : t('typeSubchapter') })}</DialogTitle>
            <DialogDescription>
              {t.rich('deleteDescriptionShort', { name: deleting?.title ?? '', strong: chunks => <strong>{chunks}</strong> })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? t('deleting') : tc('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

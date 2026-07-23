'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import {
  ArrowLeft, Menu, X, ChevronRight, ChevronDown,
  BookOpen, Minus, Plus, Tag, User, FileText,
} from 'lucide-react'
import type { BookDetail, Chapter, SubChapter } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  book: BookDetail
  onSwitchToPdf?: () => void
}

type ActiveContent =
  | { kind: 'intro' }
  | { kind: 'chapter'; chapter: Chapter }
  | { kind: 'sub'; chapter: Chapter; sub: SubChapter }

// ─── Tree helpers ───────────────────────────────────────────────────────────
// Chapter.subChapters arrives as a flat list (all nesting levels mixed
// together), grouped only by parentSubChapterId. Reconstruct the tree.

function topLevelSubs(chapter: Chapter): SubChapter[] {
  return chapter.subChapters.filter(s => !s.parentSubChapterId)
}

function childrenOf(chapter: Chapter, parentId: string): SubChapter[] {
  return chapter.subChapters.filter(s => s.parentSubChapterId === parentId)
}

// Depth-first flattening (parent immediately followed by its own children) —
// used for prev/next navigation and for picking a sensible default chapter.
function flattenSubs(chapter: Chapter, subs: SubChapter[]): SubChapter[] {
  return subs.flatMap(s => [s, ...flattenSubs(chapter, childrenOf(chapter, s.id))])
}

export function ChapterReader({ book, onSwitchToPdf }: Props) {
  const t = useTranslations('BookReader')
  const firstReadable = book.chapters.find(c => c.body || c.subChapters.some(s => s.body))

  const [active, setActive] = useState<ActiveContent>(
    firstReadable ? { kind: 'chapter', chapter: firstReadable } : { kind: 'intro' }
  )
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(firstReadable ? [firstReadable.id] : [])
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const contentRef = useRef<HTMLDivElement>(null)

  // Scroll content to top when chapter changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pickChapter = (chapter: Chapter) => {
    setActive({ kind: 'chapter', chapter })
    if (!expanded.has(chapter.id)) toggleExpand(chapter.id)
    setDrawerOpen(false)
  }

  const pickSub = (chapter: Chapter, sub: SubChapter) => {
    setActive({ kind: 'sub', chapter, sub })
    if (childrenOf(chapter, sub.id).length > 0 && !expanded.has(sub.id)) toggleExpand(sub.id)
    setDrawerOpen(false)
  }

  const isChapterActive = (id: string) =>
    (active.kind === 'chapter' && active.chapter.id === id) ||
    (active.kind === 'sub' && active.chapter.id === id)

  const isSubActive = (id: string) =>
    active.kind === 'sub' && active.sub.id === id

  const content: { title: string; body: string | null } =
    active.kind === 'intro'
      ? { title: book.title, body: book.excerpt }
      : active.kind === 'chapter'
        ? { title: active.chapter.title, body: active.chapter.body }
        : { title: active.sub.title, body: active.sub.body }

  // When the current page has no body of its own, it's likely just a
  // container — show its direct children as an index instead of "no content".
  const childIndexItems: { id: string; title: string; onClick: () => void }[] =
    active.kind === 'chapter'
      ? topLevelSubs(active.chapter).map(s => ({ id: s.id, title: s.title, onClick: () => pickSub(active.chapter, s) }))
      : active.kind === 'sub'
        ? childrenOf(active.chapter, active.sub.id).map(s => ({ id: s.id, title: s.title, onClick: () => pickSub(active.chapter, s) }))
        : []

  // Prev / next chapter navigation (depth-first across chapters + nested subchapters)
  const flatItems: ActiveContent[] = [
    ...(book.excerpt ? [{ kind: 'intro' } as ActiveContent] : []),
    ...book.chapters.flatMap(c => [
      { kind: 'chapter', chapter: c } as ActiveContent,
      ...flattenSubs(c, topLevelSubs(c)).map(s => ({ kind: 'sub', chapter: c, sub: s } as ActiveContent)),
    ]),
  ]
  const currentIdx = flatItems.findIndex(item => {
    if (item.kind !== active.kind) return false
    if (active.kind === 'chapter' && item.kind === 'chapter') return item.chapter.id === active.chapter.id
    if (active.kind === 'sub' && item.kind === 'sub') return item.sub.id === active.sub.id
    return active.kind === 'intro'
  })
  const prevItem = currentIdx > 0 ? flatItems[currentIdx - 1] : null
  const nextItem = currentIdx < flatItems.length - 1 ? flatItems[currentIdx + 1] : null

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* ── Mobile overlay ────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className={cn(
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-72 flex flex-col bg-card border-r border-border transition-transform duration-300 ease-in-out shrink-0',
        drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Back + close */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <Link
            href="/books"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('booksLabel')}
          </Link>
          <button onClick={() => setDrawerOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Book thumb */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex gap-3 items-start">
            <div className="w-11 h-14 relative shrink-0 rounded-md overflow-hidden shadow-sm bg-muted">
              <Image src={book.coverUrl || '/images/default-book.png'} alt={book.title} fill className="object-cover" sizes="44px" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{book.title}</p>
              {book.authors[0] && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.authors[0].name}</p>
              )}
              {book.categories[0] && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                  {book.categories[0].title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto py-2 text-sm">
          {book.excerpt && (
            <SidebarItem
              label={t('introduction')}
              active={active.kind === 'intro'}
              onClick={() => { setActive({ kind: 'intro' }); setDrawerOpen(false) }}
            />
          )}

          {book.chapters.map(chapter => (
            <div key={chapter.id}>
              <button
                onClick={() => pickChapter(chapter)}
                className={cn(
                  'w-full text-left px-4 py-2.5 flex items-start justify-between gap-2 transition-colors',
                  isChapterActive(chapter.id)
                    ? 'text-primary font-semibold bg-primary/8'
                    : 'text-foreground hover:bg-muted/50'
                )}
              >
                <span className="leading-snug">{chapter.title}</span>
                {chapter.subChapters.length > 0 && (
                  <span
                    className="shrink-0 mt-0.5 text-muted-foreground"
                    onClick={e => { e.stopPropagation(); toggleExpand(chapter.id) }}
                  >
                    {expanded.has(chapter.id)
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />
                    }
                  </span>
                )}
              </button>

              {expanded.has(chapter.id) && (
                <SidebarSubTree
                  chapter={chapter}
                  subs={topLevelSubs(chapter)}
                  depth={0}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  isSubActive={isSubActive}
                  pickSub={pickSub}
                />
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t('openNavigation')}
          >
            <Menu className="w-5 h-5" />
          </button>

          <p className="hidden sm:block flex-1 text-sm font-semibold text-foreground truncate min-w-0">
            {book.title}
          </p>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* Font size */}
            <div className="flex items-center gap-0.5 border border-border rounded-lg px-1 py-0.5">
              <button
                onClick={() => setFontSize(f => Math.max(14, f - 2))}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-muted-foreground w-7 text-center tabular-nums">{fontSize}</span>
              <button
                onClick={() => setFontSize(f => Math.min(28, f + 2))}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* PDF mode switcher / download */}
            {book.documentUrl && (
              onSwitchToPdf ? (
                <button
                  onClick={onSwitchToPdf}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> {t('readPdf')}
                </button>
              ) : (
                <a
                  href={book.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  PDF
                </a>
              )
            )}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 leading-tight">
              {content.title}
            </h1>

            {/* Book meta shown on intro */}
            {active.kind === 'intro' && (book.authors.length > 0 || book.categories.length > 0) && (
              <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border/60">
                {book.authors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {book.authors.map(a => a.name).join(', ')}
                  </div>
                )}
                {book.categories.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {book.categories.map(c => (
                      <span key={c.id} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {c.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {content.body ? (
              <div
                className="prose-content"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.9 }}
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            ) : childIndexItems.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">{t('chapterIndexHint')}</p>
                <div className="space-y-2">
                  {childIndexItems.map(item => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic text-base">{t('noChapterContent')}</p>
            )}

            {/* Prev / Next navigation */}
            {(prevItem || nextItem) && (
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border/60 gap-4">
                {prevItem ? (
                  <button
                    onClick={() => setActive(prevItem)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-[45%] text-left"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-1">
                      {prevItem.kind === 'intro' ? t('introduction') :
                        prevItem.kind === 'chapter' ? prevItem.chapter.title : prevItem.sub.title}
                    </span>
                  </button>
                ) : <div />}

                {nextItem ? (
                  <button
                    onClick={() => setActive(nextItem)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-[45%] text-right ml-auto"
                  >
                    <span className="line-clamp-1">
                      {nextItem.kind === 'intro' ? t('introduction') :
                        nextItem.kind === 'chapter' ? nextItem.chapter.title : nextItem.sub.title}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                ) : <div />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarItem({
  label, active, onClick, indent = false,
}: {
  label: string; active: boolean; onClick: () => void; indent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left py-2.5 text-sm transition-colors leading-snug',
        indent ? 'pl-8 pr-4' : 'px-4',
        active
          ? 'text-primary font-semibold bg-primary/8'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      {label}
    </button>
  )
}

// Recursively renders a level of the subchapter tree, indenting deeper levels.
function SidebarSubTree({
  chapter, subs, depth, expanded, toggleExpand, isSubActive, pickSub,
}: {
  chapter: Chapter
  subs: SubChapter[]
  depth: number
  expanded: Set<string>
  toggleExpand: (id: string) => void
  isSubActive: (id: string) => boolean
  pickSub: (chapter: Chapter, sub: SubChapter) => void
}) {
  return (
    <>
      {subs.map(sub => {
        const children = childrenOf(chapter, sub.id)
        const hasChildren = children.length > 0
        return (
          <div key={sub.id}>
            <button
              onClick={() => pickSub(chapter, sub)}
              className={cn(
                'w-full text-left py-2.5 flex items-start justify-between gap-2 text-sm leading-snug transition-colors',
                depth === 0 ? 'pl-8 pr-4' : 'pl-12 pr-4',
                isSubActive(sub.id)
                  ? 'text-primary font-semibold bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span>{sub.title}</span>
              {hasChildren && (
                <span
                  className="shrink-0 mt-0.5 text-muted-foreground/70"
                  onClick={e => { e.stopPropagation(); toggleExpand(sub.id) }}
                >
                  {expanded.has(sub.id)
                    ? <ChevronDown className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />
                  }
                </span>
              )}
            </button>

            {hasChildren && expanded.has(sub.id) && (
              <SidebarSubTree
                chapter={chapter}
                subs={children}
                depth={depth + 1}
                expanded={expanded}
                toggleExpand={toggleExpand}
                isSubActive={isSubActive}
                pickSub={pickSub}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Search, Loader2, ChevronRight, ChevronDown, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChapterListItem, SubChapterListItem, PagedResult } from '@/types'

interface Props {
  bookId: string
  currentId?: string
  currentType?: 'chapter' | 'subchapter'
}

export function BookHierarchySideList({ bookId, currentId, currentType }: Props) {
  const [chapters, setChapters] = useState<ChapterListItem[]>([])
  const [subs, setSubs] = useState<SubChapterListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Track expanded state for chapters and subchapters
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const fetchHierarchy = useCallback(async () => {
    setLoading(true)
    try {
      const [chRes, subRes] = await Promise.all([
        api.get<PagedResult<ChapterListItem>>(`/api/chapters?bookId=${bookId}&pageSize=5000&sort=position_asc`),
        api.get<PagedResult<SubChapterListItem>>(`/api/subchapters?bookId=${bookId}&pageSize=5000&sort=position_asc`)
      ])
      
      const chaptersData = chRes.data || []
      const subsData = subRes.data || []
      
      setChapters(chaptersData)
      setSubs(subsData)

      // Auto-expand the path to the current item
      if (currentId) {
        const newExpanded: Record<string, boolean> = {}
        
        if (currentType === 'chapter') {
          newExpanded[currentId] = true
        } else if (currentType === 'subchapter') {
          // Find path up to root
          let currentSub = subsData.find((s: SubChapterListItem) => s.id === currentId)
          while (currentSub) {
            newExpanded[currentSub.id] = true
            if (currentSub.parentSubChapterId) {
              currentSub = subsData.find((s: SubChapterListItem) => s.id === currentSub!.parentSubChapterId)
            } else {
              newExpanded[currentSub.chapterId] = true
              break
            }
          }
        }
        setExpanded(prev => ({ ...prev, ...newExpanded }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [bookId, currentId, currentType])

  useEffect(() => {
    if (bookId) {
      fetchHierarchy()
    }
  }, [fetchHierarchy, bookId])

  // Scroll to active item on mount or when ID changes
  const activeItemRef = useRef<HTMLAnchorElement>(null)
  const lastScrolledIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (activeItemRef.current && lastScrolledIdRef.current !== currentId) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      lastScrolledIdRef.current = currentId || null
    }
  }, [currentId, chapters.length, subs.length])

  // Filtering logic
  const searchLower = search.toLowerCase()
  const isMatch = (title: string, pos: number) => 
    title.toLowerCase().includes(searchLower) || String(pos).includes(search)

  // SubChapter Recursive Renderer
  const SubChapterTree = ({ parentId, chapterId, depth = 1 }: { parentId: string | null, chapterId: string, depth?: number }) => {
    const children = subs.filter(s => parentId ? s.parentSubChapterId === parentId : (s.chapterId === chapterId && s.parentSubChapterId === null))
    if (!children.length) return null

    return (
      <div className="space-y-0.5">
        {children.map(sub => {
          const isActive = currentType === 'subchapter' && currentId === sub.id
          const hasChildren = subs.some(s => s.parentSubChapterId === sub.id)
          const isExpanded = !!expanded[sub.id] || searchLower !== '' // auto expand if searching

          const matchesSearch = searchLower === '' || isMatch(sub.title, sub.position)
          const childMatchesSearch = hasChildren && subs.some(s => s.parentSubChapterId === sub.id && (isMatch(s.title, s.position) || subs.some(ss => ss.parentSubChapterId === s.id && isMatch(ss.title, ss.position)))) // rudimentary deep search match
          
          if (!matchesSearch && !childMatchesSearch && searchLower !== '') return null

          return (
            <div key={sub.id} className="w-full">
              <Link 
                href={`/admin/subchapters/${sub.id}/edit`}
                replace
                ref={isActive ? activeItemRef : null}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors w-full group",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                {hasChildren ? (
                  <button onClick={(e) => toggleExpand(sub.id, e)} className="shrink-0 p-0.5 rounded-sm hover:bg-black/5 opacity-50 group-hover:opacity-100">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <div className="w-4.5" /> // spacer for alignment
                )}
                <span className={cn("text-xs font-mono shrink-0 opacity-70", isActive ? "text-primary" : "text-muted-foreground")}>
                  {sub.position}.
                </span>
                <span className="line-clamp-2 leading-tight flex-1">
                  {sub.title}
                </span>
              </Link>
              
              {(isExpanded || searchLower !== '') && (
                <SubChapterTree parentId={sub.id} chapterId={chapterId} depth={depth + 1} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-80 shrink-0">
      <div className="p-4 border-b border-sidebar-border sticky top-0 bg-sidebar z-10 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
          <BookOpen className="w-4 h-4" />
          <span>Book Hierarchy</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search title or position..." 
            className="pl-8 bg-background border-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          chapters.map(chapter => {
            const isActive = currentType === 'chapter' && currentId === chapter.id
            const hasChildren = subs.some(s => s.chapterId === chapter.id && s.parentSubChapterId === null)
            const isExpanded = !!expanded[chapter.id] || searchLower !== ''

            const matchesSearch = searchLower === '' || isMatch(chapter.title, chapter.position)
            const childMatchesSearch = hasChildren && subs.some(s => s.chapterId === chapter.id && isMatch(s.title, s.position)) // simplify depth match for parent

            if (!matchesSearch && !childMatchesSearch && searchLower !== '') return null

            return (
              <div key={chapter.id} className="w-full">
                <Link 
                  href={`/admin/chapters/${chapter.id}/edit`}
                  replace
                  ref={isActive ? activeItemRef : null}
                  className={cn(
                    "flex items-center gap-1 px-2 py-2 rounded-md text-sm transition-colors group",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {hasChildren ? (
                    <button onClick={(e) => toggleExpand(chapter.id, e)} className="shrink-0 p-0.5 rounded-sm hover:bg-black/10 opacity-70 group-hover:opacity-100">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-5" /> // spacer
                  )}
                  <span className={cn(
                    "text-xs font-bold shrink-0 opacity-80",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {chapter.position}.
                  </span>
                  <span className="line-clamp-2 leading-tight flex-1">
                    {chapter.title}
                  </span>
                </Link>
                
                {(isExpanded || searchLower !== '') && (
                  <div className="mt-0.5">
                    <SubChapterTree parentId={null} chapterId={chapter.id} />
                  </div>
                )}
              </div>
            )
          })
        )}

        {!loading && chapters.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No hierarchy found.
          </div>
        )}
      </div>
    </div>
  )
}

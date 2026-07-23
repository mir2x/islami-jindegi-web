'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronRight, ChevronDown, Folder, FileText, ChevronsUpDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Chapter, SubChapter } from '@/types'

interface Props {
  bookChapters: Chapter[]
  selectedChapterId: string
  selectedParentSubChapterId: string | null
  onSelect: (chapterId: string, parentSubChapterId: string | null) => void
  disabled?: boolean
  triggerLabel: string
  subChapterIdToExclude?: string
  title: string
}

function SubChapterNode({
  sub,
  chapterId,
  childMap,
  selectedParentSubChapterId,
  onSelect,
  isExcluded,
  subChapterIdToExclude,
  depth = 0
}: {
  sub: SubChapter
  chapterId: string
  childMap: Map<string, SubChapter[]>
  selectedParentSubChapterId: string | null
  onSelect: (chapterId: string, parentSubChapterId: string | null) => void
  isExcluded: boolean
  subChapterIdToExclude?: string
  depth?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const children = childMap.get(sub.id) ?? []
  const hasChildren = children.length > 0
  const isSelected = selectedParentSubChapterId === sub.id
  
  const actuallyExcluded = isExcluded || sub.id === subChapterIdToExclude

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-md transition-colors group",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
          actuallyExcluded && "opacity-50 pointer-events-none"
        )}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <button
          type="button"
          className={cn("p-0.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/10", !hasChildren && "invisible")}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        </button>
        <button
          type="button"
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => {
            if (!actuallyExcluded) {
              onSelect(chapterId, sub.id)
            }
          }}
        >
          <FileText className="w-4 h-4 shrink-0 opacity-70" />
          <span className="text-sm font-medium leading-tight">{sub.title}</span>
          {isSelected && <Check className="w-4 h-4 ml-auto" />}
        </button>
      </div>
      {expanded && hasChildren && (
        <div className="flex flex-col mt-0.5">
          {children.map(child => (
            <SubChapterNode
              key={child.id}
              sub={child}
              chapterId={chapterId}
              childMap={childMap}
              selectedParentSubChapterId={selectedParentSubChapterId}
              onSelect={onSelect}
              isExcluded={actuallyExcluded}
              subChapterIdToExclude={subChapterIdToExclude}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ChapterNode({
  chapter,
  childMap,
  selectedChapterId,
  selectedParentSubChapterId,
  onSelect,
  subChapterIdToExclude
}: {
  chapter: Chapter
  childMap: Map<string, SubChapter[]>
  selectedChapterId: string
  selectedParentSubChapterId: string | null
  onSelect: (chapterId: string, parentSubChapterId: string | null) => void
  subChapterIdToExclude?: string
}) {
  const [expanded, setExpanded] = useState(false)
  
  // top-level subchapters for this chapter
  const topLevel = chapter.subChapters.filter(s => !s.parentSubChapterId)
  const hasChildren = topLevel.length > 0
  const isSelected = selectedChapterId === chapter.id && !selectedParentSubChapterId

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-md transition-colors group",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
      >
        <button
          type="button"
          className={cn("p-0.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/10", !hasChildren && "invisible")}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        </button>
        <button
          type="button"
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => onSelect(chapter.id, null)}
        >
          <Folder className="w-4 h-4 shrink-0 opacity-70" />
          <span className="text-sm font-semibold leading-tight">{chapter.title}</span>
          {isSelected && <Check className="w-4 h-4 ml-auto" />}
        </button>
      </div>
      {expanded && hasChildren && (
        <div className="flex flex-col mt-0.5">
          {topLevel.map(sub => (
            <SubChapterNode
              key={sub.id}
              sub={sub}
              chapterId={chapter.id}
              childMap={childMap}
              selectedParentSubChapterId={selectedParentSubChapterId}
              onSelect={onSelect}
              isExcluded={sub.id === subChapterIdToExclude}
              subChapterIdToExclude={subChapterIdToExclude}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ChapterTreePicker({
  bookChapters,
  selectedChapterId,
  selectedParentSubChapterId,
  onSelect,
  disabled,
  triggerLabel,
  subChapterIdToExclude,
  title
}: Props) {
  const [open, setOpen] = useState(false)
  
  // Build parent -> children map for O(1) lookups
  const childMap = useMemo(() => {
    const map = new Map<string, SubChapter[]>()
    for (const chapter of bookChapters) {
      for (const s of chapter.subChapters) {
        if (s.parentSubChapterId) {
          const arr = map.get(s.parentSubChapterId) ?? []
          arr.push(s)
          map.set(s.parentSubChapterId, arr)
        }
      }
    }
    return map
  }, [bookChapters])

  const handleSelect = (chapterId: string, parentSubChapterId: string | null) => {
    onSelect(chapterId, parentSubChapterId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between px-3 font-normal",
            (selectedChapterId || selectedParentSubChapterId) ? "text-foreground" : "text-muted-foreground"
          )}
        />
      }>
        <span className="truncate">{triggerLabel}</span>
        <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 mt-2">
          {bookChapters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No chapters available</p>
          ) : (
            <div className="space-y-1">
              {bookChapters.map(chapter => (
                <ChapterNode
                  key={chapter.id}
                  chapter={chapter}
                  childMap={childMap}
                  selectedChapterId={selectedChapterId}
                  selectedParentSubChapterId={selectedParentSubChapterId}
                  onSelect={handleSelect}
                  subChapterIdToExclude={subChapterIdToExclude}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

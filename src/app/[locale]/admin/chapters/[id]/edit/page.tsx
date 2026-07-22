'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { ChapterForm } from '@/components/admin/chapter-form'
import { BookHierarchySideList } from '@/components/admin/book-hierarchy-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChapterDetail } from '@/types'

export default function EditChapterPage() {
  const t = useTranslations('ChapterForm')
  const { id } = useParams<{ id: string }>()
  const [chapter, setChapter] = useState<ChapterDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ChapterDetail>(`/api/chapters/${id}`)
      .then(setChapter)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      {chapter?.bookId ? (
        <BookHierarchySideList bookId={chapter.bookId} currentId={id} currentType="chapter" />
      ) : (
        <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-80 shrink-0 p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="w-full p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !chapter ? (
          <div className="p-8 text-center text-muted-foreground">{t('notFound')}</div>
        ) : (
          <ChapterForm chapter={chapter} />
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { SubChapterForm } from '@/components/admin/subchapter-form'
import { BookHierarchySideList } from '@/components/admin/book-hierarchy-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { SubChapterDetail } from '@/types'

export default function EditSubChapterPage() {
  const t = useTranslations('SubChapterForm')
  const { id } = useParams<{ id: string }>()
  const [subChapter, setSubChapter] = useState<SubChapterDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<SubChapterDetail>(`/api/subchapters/${id}`)
      .then(setSubChapter)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      {subChapter?.bookId ? (
        <BookHierarchySideList bookId={subChapter.bookId} currentId={id} currentType="subchapter" />
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
        ) : !subChapter ? (
          <div className="p-8 text-center text-muted-foreground">{t('notFound')}</div>
        ) : (
          <SubChapterForm subChapter={subChapter} />
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { ChapterForm } from '@/components/admin/chapter-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChapterDetail } from '@/types'

export default function EditChapterPage() {
  const { id } = useParams<{ id: string }>()
  const [chapter, setChapter] = useState<ChapterDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ChapterDetail>(`/api/chapters/${id}`)
      .then(setChapter)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!chapter) {
    return <div className="p-8 text-center text-muted-foreground">Chapter not found.</div>
  }

  return <ChapterForm chapter={chapter} />
}

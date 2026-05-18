'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { SubChapterForm } from '@/components/admin/subchapter-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { SubChapterDetail } from '@/types'

export default function EditSubChapterPage() {
  const { id } = useParams<{ id: string }>()
  const [subChapter, setSubChapter] = useState<SubChapterDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<SubChapterDetail>(`/api/subchapters/${id}`)
      .then(setSubChapter)
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

  if (!subChapter) {
    return <div className="p-8 text-center text-muted-foreground">Subchapter not found.</div>
  }

  return <SubChapterForm subChapter={subChapter} />
}

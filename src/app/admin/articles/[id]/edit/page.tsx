'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { ArticleForm } from '@/components/admin/article-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticleDetail } from '@/types'

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ArticleDetail>(`/api/articles/${id}`).then(setItem).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="max-w-3xl mx-auto p-8 space-y-4">
      <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
  if (!item) return <div className="p-8 text-center text-muted-foreground">Not found.</div>
  return <ArticleForm item={item} />
}

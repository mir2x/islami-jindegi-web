'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { ArticleForm } from '@/components/admin/article-form'
import { ArticleSideList } from '@/components/admin/article-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticleDetail } from '@/types'

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ArticleDetail>(`/api/articles/${id}`).then(setItem).finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      <ArticleSideList currentId={id} />
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="w-full p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !item ? (
          <div className="p-8 text-center text-muted-foreground">Not found.</div>
        ) : (
          <ArticleForm item={item} />
        )}
      </div>
    </div>
  )
}

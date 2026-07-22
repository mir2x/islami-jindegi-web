'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNewsStore } from '@/store/news-store'
import { NewsForm } from '@/components/admin/news-form'
import { NewsSideList } from '@/components/admin/news-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { NewsDetail } from '@/types'

export default function EditNewsPage() {
  const { id } = useParams<{ id: string }>()
  const { getById } = useNewsStore()
  const [news, setNews] = useState<NewsDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getById(id).then(setNews).finally(() => setLoading(false))
  }, [id, getById])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      <NewsSideList currentId={id} />
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="w-full p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !news ? (
          <div className="p-8 text-center text-muted-foreground">Not found.</div>
        ) : (
          <NewsForm news={news} />
        )}
      </div>
    </div>
  )
}

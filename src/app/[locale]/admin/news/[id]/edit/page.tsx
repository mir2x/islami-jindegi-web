'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNewsStore } from '@/store/news-store'
import { NewsForm } from '@/components/admin/news-form'
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

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  return <NewsForm news={news} />
}

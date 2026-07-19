'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { usePageStore } from '@/store/page-store'
import { PageForm } from '@/components/admin/page-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { PageDetail } from '@/types'

export default function EditPagePage() {
  const { id } = useParams<{ id: string }>()
  const { getById } = usePageStore()
  const [page, setPage] = useState<PageDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getById(id).then(setPage).finally(() => setLoading(false))
  }, [id, getById])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  return <PageForm page={page} />
}

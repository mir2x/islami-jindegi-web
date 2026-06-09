'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { BayanForm } from '@/components/admin/bayan-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { BayanDetail } from '@/types'

export default function EditBayanPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<BayanDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<BayanDetail>(`/api/bayan/${id}`).then(setItem).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="max-w-3xl mx-auto p-8 space-y-4">
      <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
  if (!item) return <div className="p-8 text-center text-muted-foreground">Not found.</div>
  return <BayanForm item={item} />
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { BayanForm } from '@/components/admin/bayan-form'
import { BayanSideList } from '@/components/admin/bayan-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { BayanDetail } from '@/types'

export default function EditBayanPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<BayanDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<BayanDetail>(`/api/bayan/${id}`).then(setItem).finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      <BayanSideList currentId={id} />
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="w-full p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !item ? (
          <div className="p-8 text-center text-muted-foreground">Not found.</div>
        ) : (
          <BayanForm item={item} />
        )}
      </div>
    </div>
  )
}

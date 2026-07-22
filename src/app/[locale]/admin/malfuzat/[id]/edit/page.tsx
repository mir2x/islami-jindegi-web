'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { MalfuzatForm } from '@/components/admin/malfuzat-form'
import { MalfuzatSideList } from '@/components/admin/malfuzat-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { MalfuzatDetail } from '@/types'

export default function EditMalfuzatPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<MalfuzatDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<MalfuzatDetail>(`/api/malfuzat/${id}`).then(setItem).finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-full min-h-[calc(100vh-74px)]">
      <MalfuzatSideList currentId={id} />
      <div className="flex-1 w-full min-w-0">
        {loading ? (
          <div className="w-full p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !item ? (
          <div className="p-8 text-center text-muted-foreground">Not found.</div>
        ) : (
          <MalfuzatForm item={item} />
        )}
      </div>
    </div>
  )
}

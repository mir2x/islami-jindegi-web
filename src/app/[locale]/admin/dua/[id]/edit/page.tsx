'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { DuaForm } from '@/components/admin/dua-form'
import { DuaSideList } from '@/components/admin/dua-side-list'
import { Skeleton } from '@/components/ui/skeleton'
import type { DuaDetail } from '@/types'

export default function EditDuaPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<DuaDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<DuaDetail>(`/api/dua/${id}`).then(setItem).finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      <DuaSideList currentId={id} />
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="w-full p-6 lg:p-8 space-y-4">
            <Skeleton className="h-5 w-24" /><Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !item ? (
          <div className="p-8 text-center text-muted-foreground">Not found.</div>
        ) : (
          <DuaForm item={item} />
        )}
      </div>
    </div>
  )
}

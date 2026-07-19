'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useNamazTimeStore } from '@/store/namaz-time-store'
import { NamazTimeForm } from '@/components/admin/namaz-time-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { NamazTimeDetail } from '@/types'

export default function EditNamazTimePage() {
  const { id } = useParams<{ id: string }>()
  const { getById } = useNamazTimeStore()
  const [namazTime, setNamazTime] = useState<NamazTimeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getById(id).then(setNamazTime).finally(() => setLoading(false))
  }, [id, getById])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  return <NamazTimeForm namazTime={namazTime} />
}

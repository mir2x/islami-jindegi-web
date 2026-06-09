'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMadrasahStore } from '@/store/madrasah-store'
import { MadrasahForm } from '@/components/admin/madrasah-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { MadrasahDetail } from '@/types'

export default function EditMadrasahPage() {
  const { id } = useParams<{ id: string }>()
  const { getById } = useMadrasahStore()
  const [madrasah, setMadrasah] = useState<MadrasahDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getById(id).then(setMadrasah).finally(() => setLoading(false))
  }, [id, getById])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )

  return <MadrasahForm madrasah={madrasah} />
}

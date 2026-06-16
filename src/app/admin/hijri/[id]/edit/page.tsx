'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { HijriForm } from '@/components/admin/hijri-form'
import { api } from '@/lib/api'
import type { HijriMonthSighting } from '@/types'

export default function EditHijriSightingPage() {
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<HijriMonthSighting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<HijriMonthSighting>(`/api/hijri/sightings/${id}`)
      .then(setItem)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
        <div className="bg-card border rounded-xl p-6 space-y-5 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!item) {
    return <div className="p-8 text-center text-muted-foreground">Sighting not found.</div>
  }

  return <HijriForm item={item} />
}

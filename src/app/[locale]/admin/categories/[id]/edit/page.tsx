'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { CategoryForm } from '@/components/admin/category-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/types'

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Category>(`/api/categories/${id}`)
      .then(setCategory)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!category) {
    return <div className="p-8 text-center text-muted-foreground">Category not found.</div>
  }

  return <CategoryForm category={category} />
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { AuthorForm } from '@/components/admin/author-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { Author } from '@/types'

export default function EditAuthorPage() {
  const { id } = useParams<{ id: string }>()
  const [author, setAuthor] = useState<Author | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Author>(`/api/authors/${id}`)
      .then(setAuthor)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!author) {
    return <div className="p-8 text-center text-muted-foreground">Author not found.</div>
  }

  return <AuthorForm author={author} />
}

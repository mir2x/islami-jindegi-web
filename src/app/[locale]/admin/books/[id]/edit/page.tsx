'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import { BookForm } from '@/components/admin/book-form'
import { Skeleton } from '@/components/ui/skeleton'
import type { BookDetail } from '@/types'

export default function EditBookPage() {
  const t = useTranslations('BookForm')
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<BookDetail>(`/api/books/${id}`)
      .then(setBook)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="p-8 text-center text-muted-foreground">{t('notFound')}</div>
    )
  }

  return <BookForm book={book} />
}

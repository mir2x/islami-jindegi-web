'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChapterForm } from '@/components/admin/chapter-form'

function NewChapterContent() {
  const searchParams = useSearchParams()
  const bookId = searchParams.get('bookId') ?? undefined
  return <ChapterForm defaultBookId={bookId} />
}

export default function NewChapterPage() {
  return (
    <Suspense>
      <NewChapterContent />
    </Suspense>
  )
}

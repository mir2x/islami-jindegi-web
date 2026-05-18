'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SubChapterForm } from '@/components/admin/subchapter-form'

function NewSubChapterContent() {
  const searchParams = useSearchParams()
  const bookId = searchParams.get('bookId') ?? undefined
  return <SubChapterForm defaultBookId={bookId} />
}

export default function NewSubChapterPage() {
  return (
    <Suspense>
      <NewSubChapterContent />
    </Suspense>
  )
}

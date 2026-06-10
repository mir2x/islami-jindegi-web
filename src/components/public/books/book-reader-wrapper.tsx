'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChapterReader } from './chapter-reader'
import type { BookDetail } from '@/types'

const PdfReaderLoader = dynamic(
  () => import('./pdf-reader-loader').then(m => m.PdfReaderLoader),
  { ssr: false }
)

interface Props {
  book: BookDetail
  hasChapters: boolean
  hasPdf: boolean
}

export function BookReaderWrapper({ book, hasChapters, hasPdf }: Props) {
  const [mode, setMode] = useState<'text' | 'pdf'>(hasChapters ? 'text' : 'pdf')

  if (mode === 'text' && hasChapters) {
    return (
      <ChapterReader
        book={book}
        onSwitchToPdf={hasPdf ? () => setMode('pdf') : undefined}
      />
    )
  }

  return (
    <PdfReaderLoader
      book={book}
      pdfUrl={book.documentUrl!}
      onSwitchToText={hasChapters ? () => setMode('text') : undefined}
    />
  )
}

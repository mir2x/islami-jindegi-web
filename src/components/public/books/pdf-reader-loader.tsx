'use client'

import dynamic from 'next/dynamic'
import type { BookDetail } from '@/types'
import { AdminEditButton } from '@/components/public/admin-edit-button'

const PdfReader = dynamic(
  () => import('./pdf-reader').then(m => m.PdfReader),
  { ssr: false }
)

interface Props {
  book: BookDetail
  pdfUrl: string
  onSwitchToText?: () => void
}

export function PdfReaderLoader({ book, pdfUrl, onSwitchToText }: Props) {
  return (
    <>
      <AdminEditButton entity="books" id={book.id} />
      <PdfReader book={book} pdfUrl={pdfUrl} onSwitchToText={onSwitchToText} />
    </>
  )
}

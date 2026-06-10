'use client'

import dynamic from 'next/dynamic'
import type { BookDetail } from '@/types'

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
  return <PdfReader book={book} pdfUrl={pdfUrl} onSwitchToText={onSwitchToText} />
}

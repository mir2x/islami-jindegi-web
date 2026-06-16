import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getMushafs } from '@/lib/public-api'
import { MushafReader } from '@/components/public/quran/mushaf-reader'

interface Props {
  params: Promise<{ editionId: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { editionId } = await params
  const editions = await getMushafs()
  const edition = editions.find(e => e.id === editionId)
  if (!edition) return {}
  return {
    title: `${edition.title} | কুরআন মাজীদ`,
    description: `পবিত্র কুরআন মাজীদ — ${edition.title}`,
  }
}

export default async function MushafViewerPage({ params, searchParams }: Props) {
  const { editionId } = await params
  const sp = await searchParams
  const editions = await getMushafs()
  const edition = editions.find(e => e.id === editionId)
  if (!edition) notFound()

  const initialPage = Math.max(1, Math.min(edition.totalPages, Number(sp.page ?? 1) || 1))

  return <MushafReader edition={edition} initialPage={initialPage} />
}

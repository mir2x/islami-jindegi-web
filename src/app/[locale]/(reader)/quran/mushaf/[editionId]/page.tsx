import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getMushafs, getQuranReciters } from '@/lib/public-api'
import { MushafReader } from '@/components/public/quran/mushaf-reader'

interface Props {
  params: Promise<{ locale: string; editionId: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, editionId } = await params
  const editions = await getMushafs()
  const edition = editions.find(e => e.id === editionId)
  if (!edition) return {}
  const t = await getTranslations({ locale, namespace: 'MushafReader' })
  return {
    title: t('metaTitle', { title: edition.title }),
    description: t('metaDescription', { title: edition.title }),
  }
}

export default async function MushafViewerPage({ params, searchParams }: Props) {
  const { editionId } = await params
  const sp = await searchParams
  const [editions, reciters] = await Promise.all([getMushafs(), getQuranReciters()])
  const edition = editions.find(e => e.id === editionId)
  if (!edition) notFound()

  const initialPage = Math.max(1, Math.min(edition.totalPages, Number(sp.page ?? 1) || 1))

  return <MushafReader edition={edition} initialPage={initialPage} reciters={reciters} />
}

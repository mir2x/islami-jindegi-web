import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBayan, getBayans } from '@/lib/public-api'
import { BayanPlayer } from '@/components/public/bayan/bayan-player'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const bayan = await getBayan(id)
  if (!bayan) return {}
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })
  const t = await getTranslations({ locale, namespace: 'BayanDetail' })
  return {
    title: `${bayan.title} | ${tMeta('title')}`,
    description: bayan.excerpt ?? t('metaDescription', { name: bayan.author.name }),
  }
}

export default async function BayanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bayan = await getBayan(id)
  if (!bayan) notFound()

  const related = await getBayans({ authorId: bayan.author.id, pageSize: 6 })
  const moreBayans = (related?.data ?? []).filter(b => b.id !== bayan.id).slice(0, 5)

  return <BayanPlayer bayan={bayan} related={moreBayans} />
}

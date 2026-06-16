import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBayan, getBayans } from '@/lib/public-api'
import { BayanPlayer } from '@/components/public/bayan/bayan-player'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const bayan = await getBayan(id)
  if (!bayan) return {}
  return {
    title: `${bayan.title} | ইসলামী যিন্দেগী`,
    description: bayan.excerpt ?? `${bayan.author.name} কর্তৃক প্রদত্ত বয়ান`,
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

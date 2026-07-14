import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getQuranSurah, getQuranSurahs } from '@/lib/public-api'
import { TilawatReader } from '@/components/public/quran/tilawat-reader'

interface Props {
  params: Promise<{ number: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params
  const surahs = await getQuranSurahs()
  const surah = surahs.find(s => s.number === parseInt(number))
  if (!surah) return {}
  return {
    title: `তিলাওয়াত — ${surah.nameBengali} | কুরআন মাজীদ`,
    description: `সূরা ${surah.nameBengali} তিলাওয়াত মোড — ${surah.nameEnglish} (${surah.totalAyahs} আয়াত)`,
  }
}

export default async function TilawatPage({ params }: Props) {
  const { number } = await params
  const n = parseInt(number)
  if (isNaN(n) || n < 1 || n > 114) notFound()

  const [surahs, surah] = await Promise.all([
    getQuranSurahs(),
    getQuranSurah(n),
  ])
  if (!surah) notFound()

  return <TilawatReader surah={surah} allSurahs={surahs} />
}

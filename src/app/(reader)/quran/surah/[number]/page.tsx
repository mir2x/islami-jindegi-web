import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getQuranSurah, getQuranSurahs } from '@/lib/public-api'
import { SurahReader } from '@/components/public/quran/surah-reader'

interface Props {
  params: Promise<{ number: string }>
  searchParams: Promise<{ translator?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params
  const surahs = await getQuranSurahs()
  const surah = surahs.find(s => s.number === parseInt(number))
  if (!surah) return {}
  return {
    title: `${surah.nameBengali} | কুরআন মাজীদ`,
    description: `সূরা ${surah.nameBengali} — ${surah.nameEnglish} (${surah.totalAyahs} আয়াত)`,
  }
}

export default async function SurahPage({ params, searchParams }: Props) {
  const { number } = await params
  const { translator } = await searchParams
  const n = parseInt(number)
  if (isNaN(n) || n < 1 || n > 114) notFound()

  const [surahs, surah] = await Promise.all([
    getQuranSurahs(),
    getQuranSurah(n, translator),
  ])
  if (!surah) notFound()

  return <SurahReader surah={surah} allSurahs={surahs} />
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getQuranSurah, getQuranSurahs, getQuranReciters, getQuranTranslators } from '@/lib/public-api'
import { SurahReader } from '@/components/public/quran/surah-reader'

interface Props {
  params: Promise<{ number: string }>
  searchParams: Promise<{ ayah?: string }>
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
  const { ayah } = await searchParams
  const n = parseInt(number)
  if (isNaN(n) || n < 1 || n > 114) notFound()

  const [surahs, surah, reciters, translators] = await Promise.all([
    getQuranSurahs(),
    getQuranSurah(n),
    getQuranReciters(),
    getQuranTranslators(),
  ])
  if (!surah) notFound()

  const initialAyah = ayah ? parseInt(ayah) : null

  return (
    <SurahReader
      surah={surah}
      allSurahs={surahs}
      reciters={reciters}
      translators={translators}
      initialAyah={initialAyah && !isNaN(initialAyah) ? initialAyah : null}
    />
  )
}

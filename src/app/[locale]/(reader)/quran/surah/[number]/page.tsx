import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getQuranSurah, getQuranSurahs, getQuranReciters, getQuranTranslators } from '@/lib/public-api'
import { SurahReader } from '@/components/public/quran/surah-reader'

interface Props {
  params: Promise<{ locale: string; number: string }>
  searchParams: Promise<{ ayah?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, number } = await params
  const surahs = await getQuranSurahs()
  const surah = surahs.find(s => s.number === parseInt(number))
  if (!surah) return {}
  const t = await getTranslations({ locale, namespace: 'SurahReader' })
  return {
    title: t('metaTitle', { name: surah.nameBengali }),
    description: t('metaDescription', {
      name: surah.nameBengali,
      nameEnglish: surah.nameEnglish,
      totalAyahs: surah.totalAyahs,
    }),
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

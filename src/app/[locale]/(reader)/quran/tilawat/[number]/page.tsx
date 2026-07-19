import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getQuranSurah, getQuranSurahs } from '@/lib/public-api'
import { TilawatReader } from '@/components/public/quran/tilawat-reader'

interface Props {
  params: Promise<{ locale: string; number: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, number } = await params
  const surahs = await getQuranSurahs()
  const surah = surahs.find(s => s.number === parseInt(number))
  if (!surah) return {}
  const t = await getTranslations({ locale, namespace: 'TilawatReader' })
  return {
    title: t('metaTitle', { name: surah.nameBengali }),
    description: t('metaDescription', {
      name: surah.nameBengali,
      nameEnglish: surah.nameEnglish,
      totalAyahs: surah.totalAyahs,
    }),
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

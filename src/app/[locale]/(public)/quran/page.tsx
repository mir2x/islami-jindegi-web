import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getMushafs, getQuranSurahs } from '@/lib/public-api'
import { QuranLanding } from '@/components/public/quran/quran-landing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'QuranLanding' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function QuranPage() {
  const [editions, surahs] = await Promise.all([getMushafs(), getQuranSurahs()])
  return (
    <Suspense>
      <QuranLanding editions={editions} surahs={surahs} />
    </Suspense>
  )
}

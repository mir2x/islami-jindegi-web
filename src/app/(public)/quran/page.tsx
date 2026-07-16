import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getMushafs, getQuranSurahs } from '@/lib/public-api'
import { QuranLanding } from '@/components/public/quran/quran-landing'

export const metadata: Metadata = {
  title: 'কুরআন মাজীদ | ইসলামী যিন্দেগী',
  description: 'পবিত্র কুরআন মাজীদ — মুসহাফ ও পাঠ্য আকারে পড়ুন',
}

export default async function QuranPage() {
  const [editions, surahs] = await Promise.all([getMushafs(), getQuranSurahs()])
  return (
    <Suspense>
      <QuranLanding editions={editions} surahs={surahs} />
    </Suspense>
  )
}

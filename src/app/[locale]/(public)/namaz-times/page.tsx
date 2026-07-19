import { NamazTimesClient } from '@/components/public/namaz-times/namaz-times-client'
import { getNamazTimes } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'NamazTimesPage' })
  return { title: t('metaTitle') }
}

export default async function NamazTimesPage() {
  const namazTimes = await getNamazTimes()

  return (
    <div className="overflow-y-auto px-4 py-6" style={{ height: 'calc(100dvh - 68px)' }}>
      <div className="max-w-2xl mx-auto">
        <NamazTimesClient namazTimes={namazTimes} />
      </div>
    </div>
  )
}

import { MadrasahClient } from '@/components/public/madrasah/madrasah-client'
import { getMadrasahs } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'MadrasahPage' })
  return { title: t('metaTitle') }
}

export default async function MadrasahPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { locale } = await params
  const sp = await searchParams
  const search = sp.q ?? ''
  const page = Number(sp.page ?? 1)
  const t = await getTranslations({ locale, namespace: 'MadrasahPage' })

  const result = await getMadrasahs({ search: search || undefined, page })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('heading')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('subheading')}</p>
      </div>
      <MadrasahClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        initialSearch={search}
      />
    </div>
  )
}

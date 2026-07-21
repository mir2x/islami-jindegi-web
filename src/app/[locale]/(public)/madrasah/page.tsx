import { MadrasahClient } from '@/components/public/madrasah/madrasah-client'
import { getMadrasahs } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'MadrasahPage' })
  return { title: t('metaTitle') }
}

export default async function MadrasahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const search = sp.q ?? ''
  const page = Number(sp.page ?? 1)

  const result = await getMadrasahs({ search: search || undefined, page })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <MadrasahClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        initialSearch={search}
      />
    </div>
  )
}

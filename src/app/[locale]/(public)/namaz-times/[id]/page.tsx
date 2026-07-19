import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ChevronLeft } from 'lucide-react'
import { getNamazTimeDetail } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const item = await getNamazTimeDetail(id)
  if (!item) return {}
  return { title: item.titleBn ?? item.title }
}

export default async function NamazTimeDetailPage({ params }: Props) {
  const { id, locale } = await params
  const item = await getNamazTimeDetail(id)
  if (!item) notFound()

  const t = await getTranslations({ locale, namespace: 'NamazTimesDetail' })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/namaz-times"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {t('backToList')}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-8">
        {item.titleBn ?? item.title}
      </h1>

      {/* Masail */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">{t('masail')}</h2>
        <div
          className="prose-content text-[15px] leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: item.masail }}
        />
      </div>

      {/* Fazail */}
      {item.fazail && (
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">{t('fazail')}</h2>
          <div
            className="prose-content text-[15px] leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: item.fazail }}
          />
        </div>
      )}
    </div>
  )
}

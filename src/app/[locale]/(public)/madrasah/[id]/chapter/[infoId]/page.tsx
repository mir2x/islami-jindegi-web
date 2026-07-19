import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { getMadrasah } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string; infoId: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id, infoId } = await params
  const madrasah = await getMadrasah(id)
  if (!madrasah) return {}
  const info = madrasah.infos.find(i => i.id === infoId)
  return { title: info ? `${info.label} — ${madrasah.title}` : madrasah.title }
}

export default async function MadrasahChapterPage({ params }: Props) {
  const { id, infoId, locale } = await params
  const madrasah = await getMadrasah(id)
  if (!madrasah) notFound()

  const t = await getTranslations({ locale, namespace: 'MadrasahChapter' })

  const infoIndex = madrasah.infos.findIndex(i => i.id === infoId)
  if (infoIndex === -1) notFound()

  const info = madrasah.infos[infoIndex]
  const prev = infoIndex > 0 ? madrasah.infos[infoIndex - 1] : null
  const next = infoIndex < madrasah.infos.length - 1 ? madrasah.infos[infoIndex + 1] : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/madrasah"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        {t('backToList')}
      </Link>

      {/* Madrasah breadcrumb */}
      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
        {madrasah.title}
      </p>

      {/* Chapter title */}
      <div className="flex items-start gap-3 mb-8">
        <div className="mt-0.5 w-9 h-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground leading-snug">{info.label}</h1>
      </div>

      {/* Chapter content */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <div
          className="prose-content text-base leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: info.info }}
        />
      </div>

      {/* Prev / Next nav */}
      {(prev || next) && (
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
          {prev ? (
            <Link
              href={`/madrasah/${id}/chapter/${prev.id}`}
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors min-w-0"
            >
              <ChevronLeft className="w-4 h-4 shrink-0 group-hover:text-primary" />
              <span className="truncate">{prev.label}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link
              href={`/madrasah/${id}/chapter/${next.id}`}
              className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors min-w-0 text-right"
            >
              <span className="truncate">{next.label}</span>
              <ChevronLeft className="w-4 h-4 shrink-0 rotate-180 group-hover:text-primary" />
            </Link>
          ) : <span />}
        </div>
      )}

      {/* All chapters list */}
      {madrasah.infos.length > 1 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('allChapters')}
          </p>
          <ul className="space-y-1">
            {madrasah.infos.map((ch, idx) => (
              <li key={ch.id ?? idx}>
                <Link
                  href={ch.id ? `/madrasah/${id}/chapter/${ch.id}` : '#'}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    ch.id === infoId
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  {ch.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

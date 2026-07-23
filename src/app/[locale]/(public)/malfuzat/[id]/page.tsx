import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, User, Tag, Calendar } from 'lucide-react'
import { getMalfuzat, getMalfuzats } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'
import { AdminEditButton } from '@/components/public/admin-edit-button'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const item = await getMalfuzat(id)
  if (!item) return {}
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: `${item.title} | ${tMeta('title')}`,
    description: item.excerpt ?? undefined,
  }
}

export default async function MalfuzatDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const item = await getMalfuzat(id)
  if (!item) notFound()

  const related = await getMalfuzats({ authorId: item.author?.id, pageSize: 6 })
  const more = (related?.data ?? []).filter(m => m.id !== item.id).slice(0, 5)

  const date = item.publishedAt ?? item.createdAt
  const t = await getTranslations({ locale, namespace: 'MalfuzatDetail' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <AdminEditButton entity="malfuzat" id={item.id} />
      <Link href="/malfuzat" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> {tNav('malfuzat')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-foreground leading-snug mb-4">{item.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/50">
            {item.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {item.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {item.categories.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {item.categories.map(c => c.title).join(', ')}
              </span>
            )}
          </div>

          {/* Audio */}
          {item.audioUrl && (
            <div className="mb-6 p-4 bg-muted/40 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">{t('audioLabel')}</p>
              <audio controls className="w-full" src={item.audioUrl} />
            </div>
          )}

          {/* Body */}
          {item.body ? (
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: item.body }} />
          ) : item.excerpt ? (
            <p className="text-base text-foreground/80 leading-relaxed">{item.excerpt}</p>
          ) : null}
        </div>

        {/* Sidebar */}
        {more.length > 0 && (
          <aside>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('moreItems')}</h2>
            <div className="space-y-0.5">
              {more.map(m => (
                <Link
                  key={m.id}
                  href={`/malfuzat/${m.id}`}
                  className="block px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">{m.title}</p>
                  {m.author && <p className="text-xs text-muted-foreground mt-0.5">{m.author.name}</p>}
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

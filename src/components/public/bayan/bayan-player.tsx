'use client'

import { Link } from '@/i18n/navigation'
import { ArrowLeft, Mic } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { BayanPlayerCard, formatBayanDate } from './bayan-player-card'
import type { BayanDetail, BayanListItem } from '@/types'

interface Props {
  bayan: BayanDetail
  related: BayanListItem[]
}

export function BayanPlayer({ bayan, related }: Props) {
  const t = useTranslations('BayanDetail')
  const locale = useLocale()
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/bayan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> {t('bayanList')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        <BayanPlayerCard bayan={bayan} className="rounded-2xl border border-border bg-card p-6 sm:p-8" />

        {/* ── Sidebar: more from speaker ── */}
        {related.length > 0 && (
          <aside>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t('moreFrom', { name: bayan.author.name })}
            </p>
            <div className="space-y-2">
              {related.map(b => (
                <Link
                  key={b.id}
                  href={`/bayan/${b.id}`}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {b.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatBayanDate(b.publishedAt, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

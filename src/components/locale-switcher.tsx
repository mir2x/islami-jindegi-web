'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('Common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchTo(nextLocale: 'bn' | 'en') {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <div
      role="group"
      aria-label={t('languageSwitcherLabel')}
      className={cn(
        'flex items-center rounded-lg border border-border/60 p-0.5 text-[13px] font-medium',
        className
      )}
    >
      <button
        type="button"
        onClick={() => switchTo('bn')}
        aria-pressed={locale === 'bn'}
        className={cn(
          'px-2 py-1 rounded-md transition-colors',
          locale === 'bn'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        বাং
      </button>
      <button
        type="button"
        onClick={() => switchTo('en')}
        aria-pressed={locale === 'en'}
        className={cn(
          'px-2 py-1 rounded-md transition-colors',
          locale === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
    </div>
  )
}

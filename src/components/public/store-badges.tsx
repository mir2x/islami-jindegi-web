import { FaApple, FaWindows } from 'react-icons/fa6'
import { useTranslations } from 'next-intl'
import { GooglePlayIcon } from './google-play-icon'
import { cn } from '@/lib/utils'

const STORES = [
  {
    key: 'googlePlay',
    href: 'https://play.google.com/store/apps/details?id=com.islami_jindegi',
    icon: GooglePlayIcon,
    size: 'w-6 h-6',
    badgeSize: 'w-5 h-5',
    caption: 'GET IT ON',
    name: 'Google Play',
  },
  {
    key: 'appStore',
    href: 'https://apps.apple.com/us/app/islami-jindegi/id1271205014',
    icon: FaApple,
    size: 'w-7 h-7',
    badgeSize: 'w-6 h-6',
    caption: 'Download on the',
    name: 'App Store',
  },
  {
    key: 'microsoftStore',
    href: 'https://apps.microsoft.com/detail/9pfc3fbk5bn0?hl=en-US&gl=US',
    icon: FaWindows,
    size: 'w-5 h-5',
    badgeSize: 'w-6 h-6',
    caption: 'Available on',
    name: 'Microsoft Store',
  },
] as const

interface Props {
  className?: string
  iconClassName?: string
  variant?: 'compact' | 'badge' | 'list'
}

export function StoreBadges({ className, iconClassName, variant = 'compact' }: Props) {
  const t = useTranslations('Nav')

  if (variant === 'list') {
    return (
      <div className={cn('flex flex-col', className)}>
        {STORES.map(({ key, href, icon: Icon, badgeSize, name }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-lg font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Icon className={cn(badgeSize, 'shrink-0')} />
            {name}
          </a>
        ))}
      </div>
    )
  }

  if (variant === 'badge') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
        {STORES.map(({ key, href, icon: Icon, badgeSize, caption, name }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(key)}
            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
          >
            <Icon className={cn(badgeSize, 'shrink-0 text-foreground')} />
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] text-muted-foreground">{caption}</span>
              <span className="text-sm font-semibold text-foreground">{name}</span>
            </span>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STORES.map(({ key, href, icon: Icon, size }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(key)}
          title={t(key)}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Icon className={cn(size, iconClassName)} />
        </a>
      ))}
    </div>
  )
}

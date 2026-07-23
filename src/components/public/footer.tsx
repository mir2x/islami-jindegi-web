import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { StoreBadges } from '@/components/public/store-badges'

export function Footer() {
  const t = useTranslations('Nav')
  const tFooter = useTranslations('Footer')
  const tMeta = useTranslations('Metadata')

  const SECTIONS = [
    { label: t('books'), href: '/books' },
    { label: t('bayan'), href: '/bayan' },
    { label: t('malfuzat'), href: '/malfuzat' },
    { label: t('masail'), href: '/masail' },
    { label: t('dua'), href: '/dua' },
    { label: t('articles'), href: '/articles' },
    { label: t('news'), href: '/news' },
    { label: t('madrasah'), href: '/madrasah' },
    { label: t('namazTimes'), href: '/namaz-times' },
  ]

  return (
    <footer className="mt-20 border-t border-border/60 bg-muted/30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/logo-icon.png"
                alt={tMeta('title')}
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-bold text-foreground">{tMeta('title')}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {tFooter('tagline')}
            </p>
            <StoreBadges variant="badge" className="mt-4" />
          </div>

          {/* Links */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{tFooter('contentHeading')}</p>
              <ul className="space-y-2">
                {SECTIONS.slice(0, 5).map(s => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{s.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{tFooter('moreHeading')}</p>
              <ul className="space-y-2">
                {SECTIONS.slice(5).map(s => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{s.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{tFooter('siteHeading')}</p>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tFooter('about')}</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{tFooter('contact')}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {tFooter('copyright', { year: new Date().getFullYear(), brand: tMeta('title') })}
          </p>
          <div className="flex items-center gap-4">
            <a href="https://x.com/IJindegi" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
            <a href="https://www.facebook.com/islamijindegiii" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Facebook</a>
            <a href="https://www.youtube.com/@IslamiJindegi" className="text-xs text-muted-foreground hover:text-foreground transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

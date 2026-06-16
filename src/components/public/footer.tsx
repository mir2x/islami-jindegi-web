import Link from 'next/link'
import Image from 'next/image'

const SECTIONS = [
  { label: 'কিতাব', href: '/books' },
  { label: 'বয়ান', href: '/bayan' },
  { label: 'মালফুযাত', href: '/malfuzat' },
  { label: 'মাসাইল', href: '/masail' },
  { label: 'দু\'আ-দুরূদ', href: '/dua' },
  { label: 'প্রবন্ধ', href: '/articles' },
  { label: 'সংবাদ', href: '/news' },
  { label: 'মাদরাসা', href: '/madrasah' },
  { label: 'নামাযের সময়', href: '/namaz-times' },
]

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/logo-icon.png"
                alt="ইসলামী যিন্দেগী"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-bold text-foreground">ইসলামী যিন্দেগী</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              ইসলামী জীবনযাপনের আলোকবর্তিকা। কিতাব, বয়ান, মালফুযাত ও আরও অনেক কিছু এক জায়গায়।
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">বিষয়বস্তু</p>
              <ul className="space-y-2">
                {SECTIONS.slice(0, 5).map(s => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{s.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">আরও</p>
              <ul className="space-y-2">
                {SECTIONS.slice(5).map(s => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{s.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">সাইট</p>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">আমাদের সম্পর্কে</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">যোগাযোগ করুন</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ইসলামী যিন্দেগী। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
            <a href="https://facebook.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Facebook</a>
            <a href="https://youtube.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

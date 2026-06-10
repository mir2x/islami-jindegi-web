'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

const NAV = [
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

export function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md transition-shadow duration-200',
      scrolled && 'shadow-sm border-b border-border/60'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-[68px] gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <Image
              src="/logo-icon.png"
              alt="ইসলামী জিন্দেগী"
              width={36}
              height={36}
              className="rounded-xl shadow-sm"
            />
            <span className="text-[17px] font-bold text-foreground leading-tight hidden sm:block">
              ইসলামী জিন্দেগী
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {NAV.map(({ label, href }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-2 rounded-md text-[15px] font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-1">
            {NAV.map(({ label, href }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-3 rounded-lg text-base font-medium transition-colors',
                    active
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

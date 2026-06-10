'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { BookOpen, Users, Tag, LayoutDashboard, ScrollText, HelpCircle, Sparkles, Mic, Newspaper, Images, School, Clock, Rss } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Media', href: '/admin/media', icon: Images },
  { label: 'Books', href: '/admin/books', icon: BookOpen },
  { label: 'Authors', href: '/admin/authors', icon: Users },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'Malfuzat', href: '/admin/malfuzat', icon: ScrollText },
  { label: 'Masail', href: '/admin/masail', icon: HelpCircle },
  { label: 'Dua', href: '/admin/dua', icon: Sparkles },
  { label: 'Bayan', href: '/admin/bayan', icon: Mic },
  { label: 'Articles', href: '/admin/articles', icon: Newspaper },
  { label: 'News', href: '/admin/news', icon: Rss },
  { label: 'Madrasah', href: '/admin/madrasah', icon: School },
  { label: 'Namaz Times', href: '/admin/namaz-times', icon: Clock },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Admin always uses dark theme; restore user preference when leaving
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => {
      document.documentElement.classList.remove('dark')
      try {
        if (localStorage.getItem('ij-theme') === 'dark') {
          document.documentElement.classList.add('dark')
        }
      } catch { /* ignore */ }
    }
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[220px] flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-[11px] font-black tracking-wider shrink-0 shadow-lg shadow-sidebar-primary/30">
            IJ
          </div>
          <div>
            <p className="text-[14px] font-bold leading-tight text-sidebar-foreground">Islami Jindegi</p>
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-sidebar-foreground/45 mt-0.5">Admin</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 pb-4 flex flex-col gap-0.5">
          <p className="px-2 pt-1 pb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/35">
            Navigation
          </p>
          {nav.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25 font-semibold'
                    : 'text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-[11px] font-medium text-sidebar-foreground/30">v1.0.0</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}

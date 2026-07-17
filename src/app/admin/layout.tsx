'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookOpen, Users, Tag, LayoutDashboard, ScrollText, HelpCircle, Sparkles, Mic, Newspaper, Images, School, Clock, Rss, Moon, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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
  { label: 'Pages', href: '/admin/pages', icon: FileText },
  { label: 'Hijri Sightings', href: '/admin/hijri', icon: Moon },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Restore the sidebar collapsed/expanded preference
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('ij-admin-sidebar') === 'collapsed')
    } catch { /* ignore */ }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('ij-admin-sidebar', next ? 'collapsed' : 'expanded') } catch { /* ignore */ }
      return next
    })
  }

  // Admin is always dark, using the public site's dark teal palette (the `admin`
  // class only adds sidebar/chart tokens); restore user preference when leaving
  useEffect(() => {
    document.documentElement.classList.add('dark', 'admin')
    return () => {
      document.documentElement.classList.remove('admin')
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
      <aside className={cn(
        'flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}>

        {/* Brand + toggle */}
        <div className={cn(
          'flex items-center px-3 py-5 h-[74px]',
          collapsed ? 'justify-center' : 'gap-3 px-5'
        )}>
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-[11px] font-black tracking-wider shrink-0 shadow-lg shadow-sidebar-primary/30">
            IJ
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-tight text-sidebar-foreground truncate">Islami Jindegi</p>
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-sidebar-foreground/45 mt-0.5">Admin</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="shrink-0 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pb-2">
            <button
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mx-4 h-px bg-sidebar-border" />

        {/* Nav */}
        <nav className={cn('flex-1 pt-4 pb-4 flex flex-col gap-0.5 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed && (
            <p className="px-2 pt-1 pb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/35">
              Navigation
            </p>
          )}
          {nav.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150',
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25 font-semibold'
                    : 'text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={cn('py-4 border-t border-sidebar-border', collapsed ? 'px-3 text-center' : 'px-5')}>
          <p className="text-[11px] font-medium text-sidebar-foreground/30">{collapsed ? 'v1' : 'v1.0.0'}</p>
        </div>
      </aside>

      {/* Content */}
      {/* scrollbar-gutter:stable reserves the scrollbar's width even when no scrollbar is
          showing. Without it, a short loading state removes the scrollbar and the whole
          page shifts sideways, then shifts back once the rows land. */}
      <main className="flex-1 overflow-auto [scrollbar-gutter:stable]">
        {children}
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}

'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Users, Tag, LayoutDashboard, ScrollText, HelpCircle, Sparkles, Mic, Newspaper, Images, School, Clock, Rss, Moon, Sun, FileText, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('AdminNav')
  const nav = [
    { label: t('dashboard'), href: '/admin', icon: LayoutDashboard, exact: true },
    { label: t('media'), href: '/admin/media', icon: Images },
    { label: t('books'), href: '/admin/books', icon: BookOpen },
    { label: t('authors'), href: '/admin/authors', icon: Users },
    { label: t('categories'), href: '/admin/categories', icon: Tag },
    { label: t('malfuzat'), href: '/admin/malfuzat', icon: ScrollText },
    { label: t('masail'), href: '/admin/masail', icon: HelpCircle },
    { label: t('dua'), href: '/admin/dua', icon: Sparkles },
    { label: t('bayan'), href: '/admin/bayan', icon: Mic },
    { label: t('articles'), href: '/admin/articles', icon: Newspaper },
    { label: t('news'), href: '/admin/news', icon: Rss },
    { label: t('madrasah'), href: '/admin/madrasah', icon: School },
    { label: t('namazTimes'), href: '/admin/namaz-times', icon: Clock },
    { label: t('pages'), href: '/admin/pages', icon: FileText },
    { label: t('hijri'), href: '/admin/hijri', icon: Moon },
  ]

  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // Admin has its own light/dark preference (key `ij-admin-theme`), independent of
  // the public site's `ij-theme`. Defaults to dark to match the SSR markup and the
  // dashboard's original always-dark look.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Restore the sidebar collapsed/expanded preference and the admin theme preference
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('ij-admin-sidebar') === 'collapsed')
      if (localStorage.getItem('ij-admin-theme') === 'light') setTheme('light')
    } catch { /* ignore */ }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('ij-admin-sidebar', next ? 'collapsed' : 'expanded') } catch { /* ignore */ }
      return next
    })
  }

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('ij-admin-theme', next) } catch { /* ignore */ }
      return next
    })
  }

  // Mark the document as admin on mount; restore the public site's own theme
  // preference on unmount. The `admin` class scopes the dashboard-only tokens
  // (sidebar/charts) and stays on for both light and dark admin modes.
  useEffect(() => {
    document.documentElement.classList.add('admin')
    return () => {
      document.documentElement.classList.remove('admin', 'dark')
      try {
        if (localStorage.getItem('ij-theme') === 'dark') {
          document.documentElement.classList.add('dark')
        }
      } catch { /* ignore */ }
    }
  }, [])

  // Apply the admin's own light/dark choice by toggling the `dark` class. Light
  // mode falls back to the `:root` palette (near-white content, dark teal sidebar).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const navLinks = (collapsedMode: boolean, onNavigate?: () => void) => nav.map(({ label, href, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        title={collapsedMode ? label : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150',
          collapsedMode ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
          active
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25 font-semibold'
            : 'text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsedMode && <span>{label}</span>}
      </Link>
    )
  })

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — desktop only, off-canvas on mobile via the Sheet drawer below */}
      <aside className={cn(
        'hidden md:flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border transition-all duration-200',
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
              <p className="text-[14px] font-bold leading-tight text-sidebar-foreground truncate">{t('brand')}</p>
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-sidebar-foreground/45 mt-0.5">{t('brandSub')}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label={t('collapseSidebar')}
              title={t('collapseSidebar')}
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
              aria-label={t('expandSidebar')}
              title={t('expandSidebar')}
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
              {t('navigation')}
            </p>
          )}
          {navLinks(collapsed)}
        </nav>

        {/* Footer — theme toggle + locale switcher + version */}
        <div className={cn('border-t border-sidebar-border', collapsed ? 'py-3 flex flex-col items-center gap-2.5' : 'px-3 py-3 flex flex-col gap-2.5')}>
          {collapsed ? (
            <>
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
                title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                className="p-1.5 rounded-lg text-sidebar-foreground/55 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <p className="text-[11px] font-medium text-sidebar-foreground/30">v1</p>
            </>
          ) : (
            <>
              <LocaleSwitcher className="self-start" />
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                  <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
                </button>
                <span className="text-[11px] font-medium text-sidebar-foreground/30 pr-1">v1.0.0</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile nav drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[240px] p-0 gap-0 flex flex-col bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">{t('navigation')}</SheetTitle>
          <div className="flex items-center gap-3 px-5 py-5 h-[74px] shrink-0">
            <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-[11px] font-black tracking-wider shrink-0 shadow-lg shadow-sidebar-primary/30">
              IJ
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-tight text-sidebar-foreground truncate">{t('brand')}</p>
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-sidebar-foreground/45 mt-0.5">{t('brandSub')}</p>
            </div>
          </div>
          <div className="mx-4 h-px bg-sidebar-border" />
          <nav className="flex-1 pt-4 pb-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
            <p className="px-2 pt-1 pb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/35">
              {t('navigation')}
            </p>
            {navLinks(false, () => setMobileNavOpen(false))}
          </nav>
          <div className="py-3 px-3 border-t border-sidebar-border shrink-0 flex flex-col gap-2.5">
            <LocaleSwitcher />
            <div className="flex items-center justify-between">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
              </button>
              <span className="text-[11px] font-medium text-sidebar-foreground/30 pr-1">v1.0.0</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Content column: mobile topbar + main */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        {/* Mobile topbar — hidden on desktop where the sidebar is always visible */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-sidebar-border bg-sidebar shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label={t('openMenu')}
            className="p-1.5 -ml-1.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-[10px] font-black shrink-0">
            IJ
          </div>
          <p className="text-sm font-bold text-sidebar-foreground truncate">{t('brand')} {t('brandSub')}</p>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
            className="ml-auto p-1.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* scrollbar-gutter:stable reserves the scrollbar's width even when no scrollbar is
            showing. Without it, a short loading state removes the scrollbar and the whole
            page shifts sideways, then shifts back once the rows land. */}
        <main className="flex-1 overflow-auto [scrollbar-gutter:stable]">
          {children}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  )
}

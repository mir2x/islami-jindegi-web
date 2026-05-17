'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Users, Tag, LayoutDashboard } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Books', href: '/admin/books', icon: BookOpen },
  { label: 'Authors', href: '/admin/authors', icon: Users },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 flex flex-col shrink-0 bg-sidebar">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-[11px] font-bold tracking-wider shrink-0">
            IJ
          </div>
          <div>
            <p className="text-[13px] font-bold leading-tight text-sidebar-foreground">Islami Jindegi</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/35">Admin</p>
          </div>
        </div>

        <div className="mx-5 mb-3 h-px bg-sidebar-border" />

        <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/35">
          Navigation
        </p>

        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mx-5 mt-3 mb-5 pt-4 border-t border-sidebar-border">
          <p className="text-[11px] text-sidebar-foreground/30">v1.0.0</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}

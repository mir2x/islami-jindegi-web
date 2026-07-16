'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
  disabled?: boolean
}

// Shared, mobile-safe pager. Prev/next collapse to icon-only below `sm`, and the page-number
// window is narrower on mobile (5) than on larger screens (7) so the row never overflows the
// viewport — page-level horizontal scroll on mobile breaks fixed-position centering elsewhere.
export function Pagination({ page, totalPages, onChange, disabled }: Props) {
  if (totalPages <= 1) return null

  const windowed = (count: number) =>
    Array.from({ length: Math.min(totalPages, count) }, (_, i) =>
      totalPages <= count ? i + 1
        : page <= Math.ceil(count / 2) ? i + 1
        : page >= totalPages - Math.floor(count / 2) ? totalPages - count + 1 + i
        : page - Math.floor(count / 2) + i
    ).filter(p => p >= 1 && p <= totalPages)

  const numberBtn = (p: number) => (
    <button
      key={p}
      onClick={() => onChange(p)}
      className={cn(
        'w-8 sm:w-9 h-8 sm:h-9 rounded-lg text-sm font-medium transition-colors shrink-0',
        p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {p}
    </button>
  )

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-10">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1 || disabled}
        aria-label="আগের"
        className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors shrink-0"
      >
        <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">আগের</span>
      </button>

      <div className="flex sm:hidden items-center gap-1">{windowed(5).map(numberBtn)}</div>
      <div className="hidden sm:flex items-center gap-1">{windowed(7).map(numberBtn)}</div>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages || disabled}
        aria-label="পরের"
        className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors shrink-0"
      >
        <span className="hidden sm:inline">পরের</span><ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

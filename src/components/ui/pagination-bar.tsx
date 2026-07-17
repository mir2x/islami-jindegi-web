'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  /** Render the page buttons and the "go to page" control on a single row. */
  inline?: boolean
}

function getPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const left = Math.max(2, current - 2)
  const right = Math.min(total - 1, current + 2)
  const pages: (number | 'ellipsis')[] = [1]

  if (left > 2) pages.push('ellipsis')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('ellipsis')
  pages.push(total)

  return pages
}

export function PaginationBar({ page, totalPages, onPageChange, className, inline = false }: Props) {
  const [goTo, setGoTo] = useState('')

  if (totalPages <= 1) return null

  const pages = getPages(page, totalPages)

  function handleGoTo() {
    const n = parseInt(goTo, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n)
      setGoTo('')
    }
  }

  return (
    <div
      className={cn(
        inline
          ? 'flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2'
          : 'flex flex-col items-center gap-3 my-10',
        className
      )}
    >
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="flex items-center justify-center w-9 h-9 text-sm text-muted-foreground select-none">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-colors',
                p === page
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Go to page */}
      <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <span>Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={goTo}
          onChange={e => setGoTo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGoTo()}
          className="w-16 h-8 rounded-md border border-border bg-card px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder={String(page)}
        />
        <span>page</span>
        <button
          onClick={handleGoTo}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go
        </button>
      </div>
    </div>
  )
}

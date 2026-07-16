'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder, className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      )}
    </div>
  )
}

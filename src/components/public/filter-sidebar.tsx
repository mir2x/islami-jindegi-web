'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  id: string
  label: string
  count: number
}

interface Props {
  title: string
  items: FilterOption[]
  search: string
  onSearch: (v: string) => void
  selected: string
  onSelect: (id: string) => void
  emptyText: string
}

export function SidebarOptionList({ title, items, search, onSearch, selected, onSelect, emptyText }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">{title}</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto px-2 pb-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-lg text-sm transition-colors',
              selected === item.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="truncate">{item.label}</span>
            <span className="text-xs tabular-nums shrink-0 opacity-70">({item.count.toLocaleString('bn-BD')})</span>
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground px-2.5 py-2">{emptyText}</p>
        )}
      </div>
    </div>
  )
}

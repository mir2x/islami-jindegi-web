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
  listClassName?: string
  /** Stretch to fill the height of its flex row/column instead of capping at max-h-72 */
  fill?: boolean
  /** Put the search box beside the title instead of below it */
  inlineSearch?: boolean
}

/**
 * Title + search + option list, without any card chrome — so several sections
 * can be stacked inside a single shared card.
 */
export function SidebarOptionSection({
  title, items, search, onSearch, selected, onSelect, emptyText, listClassName, fill, inlineSearch,
}: Props) {
  return (
    <div className={cn('flex flex-col', fill && 'flex-1 min-h-0 basis-0')}>
      <div className={cn('px-4 pt-4 pb-3 shrink-0', inlineSearch && 'flex items-center gap-3')}>
        <p className={cn(
          'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
          !inlineSearch && 'mb-2.5'
        )}>
          {title}
        </p>
        <div className={cn('relative', inlineSearch && 'ml-auto w-36 shrink-0')}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="খুঁজুন..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className={cn(
        'overflow-y-auto px-2 pb-2 [scrollbar-gutter:stable]',
        'snap-y snap-mandatory [&>button:last-child]:border-b-0',
        // The box height is whatever the flex layout leaves over, so it rarely lands
        // exactly on a 36px row boundary — fade the remainder instead of slicing a row.
        '[mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)]',
        listClassName ?? (fill ? 'flex-1 min-h-0' : 'max-h-72')
      )}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 text-sm transition-colors',
              'snap-start border-b border-border/60 h-9',
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

/** A single filter list in its own card. */
export function SidebarOptionList({ fill, ...rest }: Props) {
  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card overflow-hidden',
      fill && 'flex-1 min-h-0 basis-0 flex flex-col'
    )}>
      <SidebarOptionSection fill={fill} {...rest} />
    </div>
  )
}

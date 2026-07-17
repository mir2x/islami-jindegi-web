'use client'

import { useCallback, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc'
export interface SortState<K extends string = string> {
  key: K
  dir: SortDir
}

/**
 * Table sort state for the admin list pages. `param` is the value the API expects
 * as its `sort` query param (`<column>_asc` / `<column>_desc`).
 */
export function useTableSort<K extends string>(initialKey: K, initialDir: SortDir = 'desc') {
  const [sort, setSort] = useState<SortState<K>>({ key: initialKey, dir: initialDir })

  // First click on a new column sorts ascending; clicking the active column flips it.
  const toggle = useCallback((key: K) => {
    setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  }, [])

  const reset = useCallback(() => setSort({ key: initialKey, dir: initialDir }), [initialKey, initialDir])

  return { sort, toggle, reset, param: `${sort.key}_${sort.dir}` }
}

interface Props<K extends string> {
  label: string
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  className?: string
}

export function SortableHeader<K extends string>({ label, sortKey, sort, onSort, className }: Props<K>) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown

  return (
    <th
      className={cn('text-left px-5 py-3.5', className)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'group inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {label}
        <Icon className={cn('w-3.5 h-3.5 shrink-0', active ? 'opacity-100' : 'opacity-40 group-hover:opacity-70')} />
      </button>
    </th>
  )
}

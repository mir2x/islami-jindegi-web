'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { SearchInput } from '@/components/public/search-input'

export interface FilterOption {
  id: string
  label: string
  count: number
}

interface TriggerProps {
  label: string
  activeLabel?: string
  onClick: () => void
  className?: string
}

// Mobile-only select-style button (matches the app's filter row) — opens a MobileFilterSheet
export function MobileFilterTrigger({ label, activeLabel, onClick, className }: TriggerProps) {
  const active = !!activeLabel
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-xl border text-base font-medium transition-colors',
        active ? 'border-primary bg-primary/8 text-primary' : 'border-border bg-muted text-muted-foreground',
        className
      )}
    >
      <span className="truncate">{activeLabel ?? label}</span>
      <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
    </button>
  )
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  options: FilterOption[]
  fetchOptions?: (search: string) => Promise<FilterOption[]>
  selected: string
  onSelect: (id: string) => void
  emptyText: string
  searchPlaceholder?: string
}

// Centered modal picker for a single filter (author/category/etc) on mobile.
// `options` seeds the list instantly from the already-fetched full set; typing in the sheet's
// own search box switches to live server-side search via `fetchOptions` (debounced).
export function MobileFilterSheet({
  open, onClose, title, options, fetchOptions, selected, onSelect, emptyText, searchPlaceholder,
}: SheetProps) {
  const t = useTranslations('Common')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(options)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) { setQuery(''); setItems(options) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || !fetchOptions) return
    if (!query.trim()) { setItems(options); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const result = await fetchOptions(query)
      setItems(result)
      setLoading(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Centered via left-0/right-0 + mx-auto (layout margins), NOT translate-x —
          the zoom-in enter animation drives `transform`, so a translate-based center
          would fight the animation and render off-center mid-transition. */}
      <div className="absolute top-20 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-sm max-h-[75vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b border-border/60">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 -m-1 text-muted-foreground hover:text-foreground">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-4 pb-2 shrink-0">
          <SearchInput value={query} onChange={setQuery} placeholder={searchPlaceholder ?? t('searchShort')} />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => { onSelect(''); onClose() }}
            className={cn(
              'w-full flex items-center gap-2.5 text-left px-3 py-3 rounded-xl text-base transition-colors',
              selected === '' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
            )}
          >
            <Check className={cn('w-4 h-4 shrink-0', selected === '' ? 'opacity-100' : 'opacity-0')} />
            {t('all')}
          </button>

          {loading ? (
            <div className="space-y-2 px-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-base text-muted-foreground px-3 py-6 text-center">{emptyText}</p>
          ) : items.map(item => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); onClose() }}
              className={cn(
                'w-full flex items-center gap-2.5 text-left px-3 py-3 rounded-xl text-base transition-colors',
                selected === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
              )}
            >
              <Check className={cn('w-4 h-4 shrink-0', selected === item.id ? 'opacity-100' : 'opacity-0')} />
              <span>
                {item.label} <span className="text-muted-foreground tabular-nums">({item.count.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')})</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

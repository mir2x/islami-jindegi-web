'use client'

import { Minus, Plus } from 'lucide-react'
import { useLocale } from 'next-intl'

const MIN = 70
const MAX = 200
const STEP = 10

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
function toLocaleDigits(value: string, locale: string) {
  return locale === 'bn' ? value.replace(/[0-9]/g, d => BN_DIGITS[Number(d)]) : value
}

const ICON_BUTTON = 'p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-transparent'

interface Props {
  zoom: number
  onZoomChange: (zoom: number) => void
}

/** Zoom controls for a detail panel's content pane — scales that pane only, not the page. */
export function ZoomControl({ zoom, onZoomChange }: Props) {
  const locale = useLocale()

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onZoomChange(Math.max(MIN, zoom - STEP))}
        disabled={zoom <= MIN}
        title="Zoom out"
        className={ICON_BUTTON}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-sm text-muted-foreground tabular-nums w-11 text-center select-none">
        {toLocaleDigits(String(zoom), locale)}%
      </span>
      <button
        onClick={() => onZoomChange(Math.min(MAX, zoom + STEP))}
        disabled={zoom >= MAX}
        title="Zoom in"
        className={ICON_BUTTON}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

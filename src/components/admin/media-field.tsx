'use client'

import { useEffect, useState } from 'react'
import { FileAudio, FileText, ImageIcon, Library, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaPicker } from '@/components/admin/media-picker'
import type { MediaItem, MediaType } from '@/types'

interface Props {
  value: string
  onChange: (url: string) => void
  accept?: MediaType
  placeholder?: string
  compact?: boolean
}

const TYPE_ICONS: Record<MediaType, React.ElementType> = {
  image: ImageIcon,
  audio: FileAudio,
  document: FileText,
}

function isImageUrl(url: string) {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)
}

function urlBasename(url: string) {
  return decodeURIComponent(url.split('/').pop() ?? url)
}

export function MediaField({ value, onChange, accept, placeholder, compact }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  useEffect(() => {
    if (!value || (selectedItem && selectedItem.url !== value)) {
      setSelectedItem(null)
    }
  }, [value])

  function handleSelect(item: MediaItem) {
    setSelectedItem(item)
    onChange(item.url)
  }

  const Icon = accept ? TYPE_ICONS[accept] : FileText
  const showAsImage = accept === 'image' || (!accept && value && isImageUrl(value))
  const displayName = selectedItem?.fileName ?? urlBasename(value)

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Preview area */}
        {value ? (
          <div className="relative">
            {showAsImage ? (
              <div>
                <img
                  src={value}
                  alt=""
                  className={compact
                    ? 'w-full max-h-36 object-contain bg-muted/30'
                    : 'w-full max-h-52 object-cover'}
                />
                {compact && (
                  <div className="px-3 py-1.5 border-t bg-muted/20">
                    <p className="text-xs text-muted-foreground truncate">{displayName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-5 bg-muted/40">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <span className="text-sm text-foreground truncate flex-1 font-medium">
                  {displayName}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center gap-2 bg-muted/20 ${compact ? 'py-6' : 'py-10'}`}>
            <Icon className={`text-muted-foreground/30 ${compact ? 'w-7 h-7' : 'w-9 h-9'}`} />
            <p className="text-sm text-muted-foreground">
              {placeholder ?? 'No file selected'}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-t bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="gap-1.5 h-8"
          >
            <Library className="w-3.5 h-3.5" />
            {value ? 'Change' : 'Select from library'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="h-8 text-muted-foreground hover:text-destructive"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        accept={accept}
      />
    </>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, FileAudio, FileText, Loader2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { useMediaStore } from '@/store/media-store'
import { cn } from '@/lib/utils'
import type { MediaItem, MediaType } from '@/types'

type FilterType = 'all' | MediaType

const TYPE_TABS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'Documents', value: 'document' },
]

const ACCEPT_MAP: Record<FilterType, string> = {
  all: '*',
  image: 'image/*',
  audio: 'audio/*',
  document: '.pdf,application/pdf',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
  accept?: MediaType
}

export function MediaPicker({ open, onClose, onSelect, accept }: Props) {
  const { result, loading, uploading, fetch, upload } = useMediaStore()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>(accept ?? 'all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    fetch({ page, pageSize: 24, search: search || undefined, type: filterType === 'all' ? undefined : filterType })
  }, [fetch, page, search, filterType])

  useEffect(() => {
    if (open) { load(); setSelected(null) }
  }, [open, load])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const item = await upload(file)
      toast.success('Uploaded successfully')
      onSelect(item)
      onClose()
    } catch {
      toast.error('Upload failed')
    }
    e.target.value = ''
  }

  function handleConfirm() {
    if (!selected) return
    onSelect(selected)
    onClose()
  }

  const visibleTabs = accept ? TYPE_TABS.filter(t => t.value === 'all' || t.value === accept) : TYPE_TABS

  const totalPages = result ? Math.ceil(result.total / 24) : 1

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-5xl h-[82vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0 bg-muted/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 h-9 bg-card"
            />
          </div>

          {/* Type filter */}
          <div className="flex border rounded-lg overflow-hidden bg-card">
            {visibleTabs.map(t => (
              <button
                key={t.value}
                onClick={() => { setFilterType(t.value); setPage(1) }}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  filterType === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Upload new
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPT_MAP[filterType]}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!loading && result?.data.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <FileText className="w-12 h-12 opacity-25" />
              <p className="text-sm">{search ? 'No files match your search' : 'No files uploaded yet'}</p>
            </div>
          )}

          {!loading && result && result.data.length > 0 && (
            <div className="grid grid-cols-6 gap-3">
              {result.data.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelected(s => s?.id === item.id ? null : item)}
                  className={cn(
                    'relative aspect-square rounded-xl border-2 overflow-hidden transition-all group',
                    selected?.id === item.id
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-muted-foreground/30 bg-muted'
                  )}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 bg-muted">
                      {item.type === 'audio'
                        ? <FileAudio className="w-8 h-8 text-muted-foreground/50" />
                        : <FileText className="w-8 h-8 text-muted-foreground/50" />}
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2 text-center w-full">
                        {item.fileName}
                      </span>
                    </div>
                  )}

                  {/* Overlay on hover for non-selected */}
                  {selected?.id !== item.id && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  )}

                  {/* Selected checkmark */}
                  {selected?.id === item.id && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="my-4" />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {result && <span>{result.total.toLocaleString()} file{result.total !== 1 ? 's' : ''}</span>}
            {selected && (
              <span className="ml-3 text-foreground">
                <span className="font-medium">{selected.fileName}</span>
                <span className="ml-2 text-muted-foreground">({formatBytes(selected.size)})</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!selected}>
              Use this file
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

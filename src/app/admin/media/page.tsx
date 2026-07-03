'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Copy, FileAudio, FileText, ImageIcon, Loader2, Plus, Search, Trash2,
  CheckCircle2, XCircle, X, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMediaStore } from '@/store/media-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { cn } from '@/lib/utils'
import type { MediaItem } from '@/types'

type FilterType = 'all' | 'image' | 'audio' | 'document'

const FILTER_TABS: { label: string; value: FilterType }[] = [
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

// ── Upload progress panel ────────────────────────────────────────────────────

type UploadJob = {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
}

function UploadPanel({ jobs, onDismiss }: { jobs: UploadJob[]; onDismiss: () => void }) {
  if (jobs.length === 0) return null
  const allSettled = jobs.every(j => j.status !== 'uploading')
  const doneCount  = jobs.filter(j => j.status === 'done').length
  const errorCount = jobs.filter(j => j.status === 'error').length

  return (
    <div className="fixed bottom-5 right-5 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          {!allSettled && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
          <span className="text-sm font-semibold">
            {allSettled
              ? errorCount > 0
                ? `${doneCount} uploaded, ${errorCount} failed`
                : `${doneCount} file${doneCount !== 1 ? 's' : ''} uploaded`
              : `Uploading ${jobs.length} file${jobs.length !== 1 ? 's' : ''}…`}
          </span>
        </div>
        {allSettled && (
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* File list */}
      <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
        {jobs.map(job => (
          <div key={job.id} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              {job.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-primary" />}
              {job.status === 'done'      && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" />}
              {job.status === 'error'     && <XCircle className="w-3.5 h-3.5 shrink-0 text-destructive" />}
              <span className="text-xs font-medium truncate flex-1 min-w-0">{job.name}</span>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {job.status === 'uploading' ? `${job.progress}%` : formatBytes(job.size)}
              </span>
            </div>
            {job.status === 'uploading' && (
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-[width] duration-150"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            )}
            {job.status === 'error' && (
              <p className="text-[11px] text-destructive mt-0.5 leading-snug">{job.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const { result, loading, fetch, upload, update, remove } = useMediaStore()
  const [search, setSearch]         = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [page, setPage]             = useState(1)
  const [selected, setSelected]     = useState<MediaItem | null>(null)
  const [deleting, setDeleting]     = useState<MediaItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([])
  const [editing, setEditing]       = useState(false)
  const [editName, setEditName]     = useState('')
  const [editUrl, setEditUrl]       = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    fetch({ page, pageSize: 36, search: search || undefined, type: filterType === 'all' ? undefined : filterType })
  }, [fetch, page, search, filterType])

  useEffect(() => { load() }, [load])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    e.target.value = ''

    const newJobs: UploadJob[] = files.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'uploading',
    }))
    setUploadJobs(prev => [...prev, ...newJobs])

    await Promise.all(files.map(async (file, i) => {
      const jobId = newJobs[i].id
      try {
        await upload(file, (pct) => {
          setUploadJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: pct } : j))
        })
        setUploadJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'done', progress: 100 } : j))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setUploadJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: msg } : j))
      }
    }))

    load()
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await remove(deleting.id)
      toast.success('Deleted')
      if (selected?.id === deleting.id) setSelected(null)
      setDeleting(null)
      load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteLoading(false) }
  }

  function handleCopyUrl() {
    if (!selected) return
    navigator.clipboard.writeText(selected.url)
    toast.success('URL copied')
  }

  function startEdit() {
    if (!selected) return
    setEditName(selected.fileName)
    setEditUrl(selected.url)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function handleSave() {
    if (!selected) return
    setSaveLoading(true)
    try {
      const updated = await update(selected.id, { fileName: editName, url: editUrl })
      setSelected(updated)
      setEditing(false)
      toast.success('Saved')
      load()
    } catch { toast.error('Failed to save') }
    finally { setSaveLoading(false) }
  }

  const totalPages = result ? Math.ceil(result.total / 36) : 1
  const activeJobs = uploadJobs.filter(j => j.status === 'uploading').length

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main grid area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-8 pt-8 pb-4 bg-background">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {result
                  ? <><span className="font-semibold text-foreground">{result.total.toLocaleString()}</span> files</>
                  : 'Loading...'}
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={activeJobs > 0}
              className="gap-2 shadow-sm"
            >
              {activeJobs > 0
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading {activeJobs}…</>
                : <><Plus className="w-4 h-4" /> Upload files</>}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ACCEPT_MAP[filterType]}
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-56 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 bg-card"
              />
            </div>

            <div className="flex border rounded-lg overflow-hidden bg-card">
              {FILTER_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setFilterType(t.value); setPage(1) }}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors',
                    filterType === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-6">
          {loading && (
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: 36 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          )}

          {!loading && result?.data.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <ImageIcon className="w-7 h-7 opacity-30" />
              </div>
              <p className="font-medium">No files found</p>
              <p className="text-sm">{search ? 'Try a different search' : 'Upload your first file'}</p>
            </div>
          )}

          {!loading && result && result.data.length > 0 && (
            <div className="grid grid-cols-6 gap-3">
              {result.data.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelected(s => s?.id === item.id ? null : item); setEditing(false) }}
                  className={cn(
                    'relative aspect-square rounded-xl border-2 overflow-hidden transition-all group',
                    selected?.id === item.id
                      ? 'border-primary ring-2 ring-primary/25'
                      : 'border-transparent hover:border-muted-foreground/30 bg-muted'
                  )}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.fileName} className="w-full h-full object-cover" />
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}

          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Detail panel */}
      <div className={cn(
        'w-72 shrink-0 border-l bg-card flex flex-col transition-all duration-200',
        selected ? 'translate-x-0' : 'translate-x-full absolute right-0 inset-y-0 pointer-events-none opacity-0'
      )}>
        {selected && (
          <>
            {/* Preview */}
            <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {selected.type === 'image' ? (
                <img src={selected.url} alt={selected.fileName} className="w-full h-full object-contain" />
              ) : selected.type === 'audio' ? (
                <div className="flex flex-col items-center gap-2">
                  <FileAudio className="w-12 h-12 text-muted-foreground/40" />
                  <audio controls className="w-full px-2">
                    <source src={selected.url} />
                  </audio>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">PDF Document</span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">File name</p>
                {editing ? (
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" />
                ) : (
                  <p className="text-sm font-medium break-all">{selected.fileName}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Type</p>
                  <p className="text-sm capitalize">{selected.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Size</p>
                  <p className="text-sm">{formatBytes(selected.size)}</p>
                </div>
              </div>
              {selected.width && selected.height && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dimensions</p>
                  <p className="text-sm">{selected.width} × {selected.height}px</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Uploaded</p>
                <p className="text-sm">{new Date(selected.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">URL</p>
                {editing ? (
                  <Input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="h-8 text-xs font-mono" />
                ) : (
                  <p className="text-xs text-muted-foreground break-all bg-muted rounded-md px-2 py-1.5 font-mono">{selected.url}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex flex-col gap-2 shrink-0">
              {editing ? (
                <>
                  <Button size="sm" className="w-full" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save changes'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={cancelEdit} disabled={saveLoading}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={startEdit}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={handleCopyUrl}>
                    <Copy className="w-3.5 h-3.5" /> Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full text-destructive hover:text-destructive hover:border-destructive/50"
                    onClick={() => setDeleting(selected)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete file
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
            <DialogDescription>
              <strong>{deleting?.fileName}</strong> will be permanently deleted from storage and cannot be recovered.
              Any content still referencing this URL will show broken links.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload progress panel */}
      <UploadPanel
        jobs={uploadJobs}
        onDismiss={() => setUploadJobs([])}
      />
    </div>
  )
}

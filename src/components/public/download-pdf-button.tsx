'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { downloadFile } from '@/lib/utils'

interface Props {
  url: string
  filename: string
  label: string
  className?: string
}

export function DownloadPdfButton({ url, filename, label, className }: Props) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await downloadFile(url, filename)
    } catch {
      window.open(url, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={className ?? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60'}
    >
      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} {label}
    </button>
  )
}

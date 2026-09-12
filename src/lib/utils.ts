import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Files (e.g. bayan audio, article PDFs) are served from a different origin,
// so a plain <a download> is ignored by the browser and it just navigates to
// the file instead of saving it. The storage host sends CORS headers, so we
// can fetch it as a blob and save that instead — that always honors a
// filename and never opens the browser's built-in viewer/player.
export function buildDownloadFilename(title: string, authorName: string, fileUrl: string) {
  const ext = fileUrl.match(/\.\w+$/)?.[0] ?? ''
  return `${title} - ${authorName}${ext}`
}

export async function downloadFile(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
}

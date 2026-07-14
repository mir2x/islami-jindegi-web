export interface QuranLastRead {
  surahNumber: number
  surahName: string
  ayahNumber: number
  updatedAt: string
}

const KEY = 'quran_last_read'

export function getLastRead(): QuranLastRead | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setLastRead(entry: Omit<QuranLastRead, 'updatedAt'>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify({ ...entry, updatedAt: new Date().toISOString() }))
}

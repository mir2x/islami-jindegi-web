export interface QuranBookmark {
  surahNumber: number
  ayahNumber: number
  surahName: string
  arabic: string
  addedAt: string
}

const KEY = 'quran_bookmarks'
export const BOOKMARKS_CHANGED_EVENT = 'quran-bookmarks-changed'

export function getBookmarks(): QuranBookmark[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isBookmarked(surahNumber: number, ayahNumber: number): boolean {
  return getBookmarks().some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
}

function save(bookmarks: QuranBookmark[]) {
  localStorage.setItem(KEY, JSON.stringify(bookmarks))
  window.dispatchEvent(new Event(BOOKMARKS_CHANGED_EVENT))
}

/** Adds the bookmark if absent, removes it if present. Returns the resulting bookmarked state. */
export function toggleBookmark(bookmark: Omit<QuranBookmark, 'addedAt'>): boolean {
  const bookmarks = getBookmarks()
  const idx = bookmarks.findIndex(b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber)
  if (idx >= 0) {
    bookmarks.splice(idx, 1)
    save(bookmarks)
    return false
  }
  bookmarks.push({ ...bookmark, addedAt: new Date().toISOString() })
  save(bookmarks)
  return true
}

export function removeBookmark(surahNumber: number, ayahNumber: number) {
  save(getBookmarks().filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)))
}

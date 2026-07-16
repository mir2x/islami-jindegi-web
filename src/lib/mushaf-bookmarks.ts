export interface MushafPageBookmark {
  editionId: string
  page: number
  sura: number
  para: number | null
  addedAt: string
}

const KEY = 'mushaf_page_bookmarks'

export function getPageBookmarks(editionId: string): MushafPageBookmark[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const all: MushafPageBookmark[] = raw ? JSON.parse(raw) : []
    return all.filter(b => b.editionId === editionId)
  } catch {
    return []
  }
}

function getAll(): MushafPageBookmark[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isPageBookmarked(editionId: string, page: number): boolean {
  return getPageBookmarks(editionId).some(b => b.page === page)
}

/** Adds the bookmark if absent, removes it if present. Returns the resulting bookmarked state. */
export function togglePageBookmark(bookmark: Omit<MushafPageBookmark, 'addedAt'>): boolean {
  const all = getAll()
  const idx = all.findIndex(b => b.editionId === bookmark.editionId && b.page === bookmark.page)
  if (idx >= 0) {
    all.splice(idx, 1)
    localStorage.setItem(KEY, JSON.stringify(all))
    return false
  }
  all.push({ ...bookmark, addedAt: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(all))
  return true
}

export function removePageBookmark(editionId: string, page: number) {
  const all = getAll().filter(b => !(b.editionId === editionId && b.page === page))
  localStorage.setItem(KEY, JSON.stringify(all))
}

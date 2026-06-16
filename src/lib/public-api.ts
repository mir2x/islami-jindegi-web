import type { Book, BookDetail, BookAuthorOption, BookCategoryOption, BayanListItem, BayanDetail, BayanAuthorOption, BayanCategoryOption, ArticleListItem, NewsListItem, MalfuzatListItem, NamazTimeListItem, PagedResult, MushafEdition, QuranSurah, QuranSurahDetail } from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function get<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getMushafs(): Promise<MushafEdition[]> {
  const r = await get<MushafEdition[]>('/api/quran/mushafs', 3600)
  return r ?? []
}

export async function getRecentBooks(pageSize = 10) {
  const r = await get<PagedResult<Book>>(`/api/books?page=1&pageSize=${pageSize}&published=true`, 180)
  return r?.data ?? []
}

export async function getBooks(opts: {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  authorId?: string
} = {}) {
  const q = new URLSearchParams()
  q.set('published', 'true')
  q.set('page', String(opts.page ?? 1))
  q.set('pageSize', String(opts.pageSize ?? 24))
  if (opts.search) q.set('search', opts.search)
  if (opts.categoryId) q.set('categoryId', opts.categoryId)
  if (opts.authorId) q.set('authorId', opts.authorId)
  return get<PagedResult<Book>>(`/api/books?${q}`, 120)
}

export async function getBook(id: string) {
  return get<BookDetail>(`/api/books/${id}`, 300)
}

export async function getBookAuthors() {
  const r = await get<BookAuthorOption[]>('/api/books/authors?published=true', 600)
  return r ?? []
}

export async function getBookCategories() {
  const r = await get<BookCategoryOption[]>('/api/books/categories?published=true', 600)
  return r ?? []
}

export async function getRecentBayans(pageSize = 10) {
  const r = await get<PagedResult<BayanListItem>>(`/api/bayan?page=1&pageSize=${pageSize}&published=true&sort=date`, 180)
  return r?.data ?? []
}

export async function getBayans(opts: {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  authorId?: string
} = {}) {
  const q = new URLSearchParams()
  q.set('published', 'true')
  q.set('sort', 'date')
  q.set('page', String(opts.page ?? 1))
  q.set('pageSize', String(opts.pageSize ?? 20))
  if (opts.search) q.set('search', opts.search)
  if (opts.categoryId) q.set('categoryId', opts.categoryId)
  if (opts.authorId) q.set('authorId', opts.authorId)
  return get<PagedResult<BayanListItem>>(`/api/bayan?${q}`, 120)
}

export async function getBayan(id: string) {
  return get<BayanDetail>(`/api/bayan/${id}`, 300)
}

export async function getBayanAuthors() {
  const r = await get<BayanAuthorOption[]>('/api/bayan/authors?published=true', 600)
  return r ?? []
}

export async function getBayanCategories() {
  const r = await get<BayanCategoryOption[]>('/api/bayan/categories?published=true', 600)
  return r ?? []
}

export async function getRecentMalfuzat(pageSize = 8) {
  const r = await get<PagedResult<MalfuzatListItem>>(`/api/malfuzat?page=1&pageSize=${pageSize}&published=true`, 180)
  return r?.data ?? []
}

export async function getRecentArticles(pageSize = 6) {
  const r = await get<PagedResult<ArticleListItem>>(`/api/articles?page=1&pageSize=${pageSize}&published=true`, 180)
  return r?.data ?? []
}

export async function getRecentNews(pageSize = 6) {
  const r = await get<PagedResult<NewsListItem>>(`/api/news?page=1&pageSize=${pageSize}&published=true`, 180)
  return r?.data ?? []
}

export async function getNamazTimes() {
  const r = await get<PagedResult<NamazTimeListItem>>(`/api/namaz-times?page=1&pageSize=10`, 3600)
  return r?.data ?? []
}

export async function getQuranSurahs(): Promise<QuranSurah[]> {
  const r = await get<QuranSurah[]>('/api/quran/surahs', 86400)
  return r ?? []
}

export async function getQuranSurah(number: number, translator?: string): Promise<QuranSurahDetail | null> {
  const q = translator ? `?translator=${encodeURIComponent(translator)}` : ''
  return get<QuranSurahDetail>(`/api/quran/surahs/${number}/ayahs${q}`, 86400)
}

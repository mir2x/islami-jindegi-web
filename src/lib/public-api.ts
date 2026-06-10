import type { Book, BookDetail, Author, Category, BayanListItem, ArticleListItem, NewsListItem, MalfuzatListItem, NamazTimeListItem, PagedResult } from '@/types'

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

export async function getAllCategories() {
  const r = await get<Category[]>('/api/categories', 3600)
  return r ?? []
}

export async function getAllAuthors() {
  const r = await get<PagedResult<Author>>('/api/authors?pageSize=200', 3600)
  return r?.data ?? []
}

export async function getRecentBayans(pageSize = 10) {
  const r = await get<PagedResult<BayanListItem>>(`/api/bayan?page=1&pageSize=${pageSize}&published=true`, 180)
  return r?.data ?? []
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

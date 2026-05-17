import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Book, PagedResult } from '@/types'

interface BookParams {
  page?: number
  pageSize?: number
  search?: string
  authorId?: string
  categoryId?: string
  published?: boolean
}

interface BookStore {
  result: PagedResult<Book> | null
  loading: boolean
  fetch: (params?: BookParams) => Promise<void>
  create: (data: Partial<Book> & { authorIds: string[]; categoryIds: string[] }) => Promise<void>
  update: (id: string, data: Partial<Book> & { authorIds: string[]; categoryIds: string[] }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useBookStore = create<BookStore>((set) => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    set({ loading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.authorId) query.set('authorId', params.authorId)
    if (params.categoryId) query.set('categoryId', params.categoryId)
    if (params.published !== undefined) query.set('published', String(params.published))
    const result = await api.get<PagedResult<Book>>(`/api/books?${query}`)
    set({ result, loading: false })
  },

  create: async (data) => {
    await api.post('/api/books', data)
  },

  update: async (id, data) => {
    await api.put(`/api/books/${id}`, data)
  },

  remove: async (id) => {
    await api.delete(`/api/books/${id}`)
  },
}))

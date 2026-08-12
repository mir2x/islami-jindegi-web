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
  offlineAvailable?: boolean
  sort?: string
}

interface BookStore {
  result: PagedResult<Book> | null
  all: Book[]
  loading: boolean
  lastParams: Record<string, string>
  setLastParams: (params: Record<string, string>) => void
  fetch: (params?: BookParams) => Promise<void>
  fetchAll: () => Promise<void>
  create: (data: Partial<Book> & { authorIds: string[]; categoryIds: string[] }) => Promise<void>
  update: (id: string, data: Partial<Book> & { authorIds: string[]; categoryIds: string[] }) => Promise<void>
  setOfflineAvailable: (id: string, value: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useBookStore = create<BookStore>((set, get) => ({
  result: null,
  all: [],
  loading: false,
  lastParams: {},
  setLastParams: (params) => set({ lastParams: params }),

  fetch: async (params = {}) => {
    set({ loading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.authorId) query.set('authorId', params.authorId)
    if (params.categoryId) query.set('categoryId', params.categoryId)
    if (params.published !== undefined) query.set('published', String(params.published))
    if (params.offlineAvailable !== undefined) query.set('offlineAvailable', String(params.offlineAvailable))
    if (params.sort) query.set('sort', params.sort)
    const result = await api.get<PagedResult<Book>>(`/api/books?${query}`)
    set({ result, loading: false })
  },

  // Kept separate from `result` so populating filter dropdowns can't clobber the paginated list.
  fetchAll: async () => {
    const result = await api.get<PagedResult<Book>>('/api/books?pageSize=500')
    set({ all: result.data })
  },

  create: async (data) => {
    await api.post('/api/books', data)
  },

  update: async (id, data) => {
    await api.put(`/api/books/${id}`, data)
  },

  setOfflineAvailable: async (id, value) => {
    const prev = get().result
    set(state => ({ result: state.result
      ? { ...state.result, data: state.result.data.map(b => b.id === id ? { ...b, isOfflineAvailable: value } : b) }
      : state.result }))
    try {
      await api.patch(`/api/books/${id}/offline-availability`, { isOfflineAvailable: value })
    } catch (e) {
      set({ result: prev })
      throw e
    }
  },

  remove: async (id) => {
    await api.delete(`/api/books/${id}`)
  },
}))

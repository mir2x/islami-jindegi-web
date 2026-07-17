import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Author, PagedResult } from '@/types'

interface AuthorStore {
  result: PagedResult<Author> | null
  all: Author[]
  loading: boolean
  fetch: (params?: { page?: number; pageSize?: number; search?: string; sort?: string }) => Promise<void>
  fetchAll: () => Promise<void>
  create: (data: Partial<Author>) => Promise<void>
  update: (id: string, data: Partial<Author>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useAuthorStore = create<AuthorStore>((set) => ({
  result: null,
  all: [],
  loading: false,

  fetch: async (params = {}) => {
    set({ loading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.sort) query.set('sort', params.sort)
    const result = await api.get<PagedResult<Author>>(`/api/authors?${query}`)
    set({ result, loading: false })
  },

  fetchAll: async () => {
    const result = await api.get<PagedResult<Author>>('/api/authors?pageSize=500')
    set({ all: result.data })
  },

  create: async (data) => {
    await api.post('/api/authors', data)
  },

  update: async (id, data) => {
    await api.put(`/api/authors/${id}`, data)
  },

  remove: async (id) => {
    await api.delete(`/api/authors/${id}`)
  },
}))

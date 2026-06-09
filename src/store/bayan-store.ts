import { create } from 'zustand'
import { api } from '@/lib/api'
import type { BayanListItem, PagedResult } from '@/types'

interface BayanParams {
  page?: number
  pageSize?: number
  search?: string
  authorId?: string
  categoryId?: string
  published?: boolean
}

interface BayanStore {
  result: PagedResult<BayanListItem> | null
  loading: boolean
  fetch: (params?: BayanParams) => Promise<void>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useBayanStore = create<BayanStore>((set) => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    set({ loading: true })
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    if (params.search) q.set('search', params.search)
    if (params.authorId) q.set('authorId', params.authorId)
    if (params.categoryId) q.set('categoryId', params.categoryId)
    if (params.published !== undefined) q.set('published', String(params.published))
    const result = await api.get<PagedResult<BayanListItem>>(`/api/bayan?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => { await api.post('/api/bayan', data) },
  update: async (id, data) => { await api.put(`/api/bayan/${id}`, data) },
  remove: async (id) => { await api.delete(`/api/bayan/${id}`) },
}))

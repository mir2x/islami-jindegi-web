import { create } from 'zustand'
import { api } from '@/lib/api'
import type { MasailListItem, PagedResult } from '@/types'

interface MasailParams {
  page?: number
  pageSize?: number
  search?: string
  authorId?: string
  categoryId?: string
  published?: boolean
  sort?: string
}

interface MasailStore {
  result: PagedResult<MasailListItem> | null
  loading: boolean
  lastParams: MasailParams
  setLastParams: (params: MasailParams) => void
  fetch: (params?: MasailParams) => Promise<void>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useMasailStore = create<MasailStore>((set) => ({
  result: null,
  loading: false,
  lastParams: { page: 1 },
  setLastParams: (params) => set({ lastParams: params }),

  fetch: async (params = {}) => {
    set({ loading: true })
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    if (params.search) q.set('search', params.search)
    if (params.authorId) q.set('authorId', params.authorId)
    if (params.categoryId) q.set('categoryId', params.categoryId)
    if (params.published !== undefined) q.set('published', String(params.published))
    if (params.sort) q.set('sort', params.sort)
    const result = await api.get<PagedResult<MasailListItem>>(`/api/masail?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => { await api.post('/api/masail', data) },
  update: async (id, data) => { await api.put(`/api/masail/${id}`, data) },
  remove: async (id) => { await api.delete(`/api/masail/${id}`) },
}))

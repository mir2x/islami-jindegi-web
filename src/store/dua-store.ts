import { create } from 'zustand'
import { api } from '@/lib/api'
import type { DuaListItem, PagedResult } from '@/types'

interface DuaParams {
  page?: number
  pageSize?: number
  search?: string
  categoryId?: string
  published?: boolean
  sort?: string
}

interface DuaStore {
  result: PagedResult<DuaListItem> | null
  loading: boolean
  lastParams: Record<string, string>
  setLastParams: (params: Record<string, string>) => void
  fetch: (params?: DuaParams) => Promise<void>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useDuaStore = create<DuaStore>((set) => ({
  result: null,
  loading: false,
  lastParams: {},
  setLastParams: (params) => set({ lastParams: params }),

  fetch: async (params = {}) => {
    set({ loading: true })
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    if (params.search) q.set('search', params.search)
    if (params.categoryId) q.set('categoryId', params.categoryId)
    if (params.published !== undefined) q.set('published', String(params.published))
    if (params.sort) q.set('sort', params.sort)
    const result = await api.get<PagedResult<DuaListItem>>(`/api/dua?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => { await api.post('/api/dua', data) },
  update: async (id, data) => { await api.put(`/api/dua/${id}`, data) },
  remove: async (id) => { await api.delete(`/api/dua/${id}`) },
}))

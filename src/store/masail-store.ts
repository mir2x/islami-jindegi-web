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
  offlineAvailable?: boolean
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
  setOfflineAvailable: (id: string, value: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useMasailStore = create<MasailStore>((set, get) => ({
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
    if (params.offlineAvailable !== undefined) q.set('offlineAvailable', String(params.offlineAvailable))
    if (params.sort) q.set('sort', params.sort)
    const result = await api.get<PagedResult<MasailListItem>>(`/api/masail?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => { await api.post('/api/masail', data) },
  update: async (id, data) => { await api.put(`/api/masail/${id}`, data) },

  setOfflineAvailable: async (id, value) => {
    const prev = get().result
    set(state => ({ result: state.result
      ? { ...state.result, data: state.result.data.map(m => m.id === id ? { ...m, isOfflineAvailable: value } : m) }
      : state.result }))
    try {
      await api.patch(`/api/masail/${id}/offline-availability`, { isOfflineAvailable: value })
    } catch (e) {
      set({ result: prev })
      throw e
    }
  },

  remove: async (id) => { await api.delete(`/api/masail/${id}`) },
}))

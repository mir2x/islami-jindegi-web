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
  offlineAvailable?: boolean
  sort?: string
}

interface BayanStore {
  result: PagedResult<BayanListItem> | null
  loading: boolean
  lastParams: Record<string, string>
  setLastParams: (params: Record<string, string>) => void
  fetch: (params?: BayanParams) => Promise<void>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  setOfflineAvailable: (id: string, value: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useBayanStore = create<BayanStore>((set, get) => ({
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
    if (params.authorId) q.set('authorId', params.authorId)
    if (params.categoryId) q.set('categoryId', params.categoryId)
    if (params.published !== undefined) q.set('published', String(params.published))
    if (params.offlineAvailable !== undefined) q.set('offlineAvailable', String(params.offlineAvailable))
    if (params.sort) q.set('sort', params.sort)
    const result = await api.get<PagedResult<BayanListItem>>(`/api/bayan?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => { await api.post('/api/bayan', data) },
  update: async (id, data) => { await api.put(`/api/bayan/${id}`, data) },

  setOfflineAvailable: async (id, value) => {
    const prev = get().result
    set(state => ({ result: state.result
      ? { ...state.result, data: state.result.data.map(b => b.id === id ? { ...b, isOfflineAvailable: value } : b) }
      : state.result }))
    try {
      await api.patch(`/api/bayan/${id}/offline-availability`, { isOfflineAvailable: value })
    } catch (e) {
      set({ result: prev })
      throw e
    }
  },

  remove: async (id) => { await api.delete(`/api/bayan/${id}`) },
}))

import { create } from 'zustand'
import { api } from '@/lib/api'
import type { PageListItem, PageDetail, PagedResult } from '@/types'

interface PageParams {
  page?: number
  pageSize?: number
  search?: string
  offlineAvailable?: boolean
}

interface PageStore {
  result: PagedResult<PageListItem> | null
  loading: boolean
  fetch: (params?: PageParams) => Promise<void>
  getById: (id: string) => Promise<PageDetail>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  setOfflineAvailable: (id: string, value: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const usePageStore = create<PageStore>(() => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    usePageStore.setState({ loading: true })
    try {
      const q = new URLSearchParams()
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('pageSize', String(params.pageSize))
      if (params.search) q.set('search', params.search)
      if (params.offlineAvailable !== undefined) q.set('offlineAvailable', String(params.offlineAvailable))
      const result = await api.get<PagedResult<PageListItem>>(`/api/pages?${q}`)
      usePageStore.setState({ result, loading: false })
    } catch {
      usePageStore.setState({ loading: false })
    }
  },

  getById: (id) => api.get<PageDetail>(`/api/pages/${id}`),
  create: (data) => api.post('/api/pages', data),
  update: (id, data) => api.put(`/api/pages/${id}`, data),

  setOfflineAvailable: async (id, value) => {
    const prev = usePageStore.getState().result
    usePageStore.setState(state => ({ result: state.result
      ? { ...state.result, data: state.result.data.map(p => p.id === id ? { ...p, isOfflineAvailable: value } : p) }
      : state.result }))
    try {
      await api.patch(`/api/pages/${id}/offline-availability`, { isOfflineAvailable: value })
    } catch (e) {
      usePageStore.setState({ result: prev })
      throw e
    }
  },

  remove: (id) => api.delete(`/api/pages/${id}`),
}))

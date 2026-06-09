import { create } from 'zustand'
import { api } from '@/lib/api'
import type { NamazTimeListItem, NamazTimeDetail, PagedResult } from '@/types'

interface NamazTimeParams {
  page?: number
  pageSize?: number
  search?: string
}

interface NamazTimeStore {
  result: PagedResult<NamazTimeListItem> | null
  loading: boolean
  fetch: (params?: NamazTimeParams) => Promise<void>
  getById: (id: string) => Promise<NamazTimeDetail>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useNamazTimeStore = create<NamazTimeStore>(() => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    useNamazTimeStore.setState({ loading: true })
    try {
      const q = new URLSearchParams()
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('pageSize', String(params.pageSize))
      if (params.search) q.set('search', params.search)
      const result = await api.get<PagedResult<NamazTimeListItem>>(`/api/namaz-times?${q}`)
      useNamazTimeStore.setState({ result, loading: false })
    } catch {
      useNamazTimeStore.setState({ loading: false })
    }
  },

  getById: (id) => api.get<NamazTimeDetail>(`/api/namaz-times/${id}`),
  create: (data) => api.post('/api/namaz-times', data),
  update: (id, data) => api.put(`/api/namaz-times/${id}`, data),
  remove: (id) => api.delete(`/api/namaz-times/${id}`),
}))

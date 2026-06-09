import { create } from 'zustand'
import { api } from '@/lib/api'
import type { MadrasahListItem, MadrasahDetail, PagedResult } from '@/types'

interface MadrasahParams {
  page?: number
  pageSize?: number
  search?: string
}

interface MadrasahStore {
  result: PagedResult<MadrasahListItem> | null
  loading: boolean
  fetch: (params?: MadrasahParams) => Promise<void>
  getById: (id: string) => Promise<MadrasahDetail>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useMadrasahStore = create<MadrasahStore>(() => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    useMadrasahStore.setState({ loading: true })
    try {
      const q = new URLSearchParams()
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('pageSize', String(params.pageSize))
      if (params.search) q.set('search', params.search)
      const result = await api.get<PagedResult<MadrasahListItem>>(`/api/madrasahs?${q}`)
      useMadrasahStore.setState({ result, loading: false })
    } catch {
      useMadrasahStore.setState({ loading: false })
    }
  },

  getById: (id) => api.get<MadrasahDetail>(`/api/madrasahs/${id}`),
  create: (data) => api.post('/api/madrasahs', data),
  update: (id, data) => api.put(`/api/madrasahs/${id}`, data),
  remove: (id) => api.delete(`/api/madrasahs/${id}`),
}))

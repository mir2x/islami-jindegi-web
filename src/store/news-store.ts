import { create } from 'zustand'
import { api } from '@/lib/api'
import type { NewsListItem, NewsDetail, PagedResult } from '@/types'

interface NewsParams {
  page?: number
  pageSize?: number
  search?: string
  published?: boolean
  sort?: string
}

interface NewsStore {
  result: PagedResult<NewsListItem> | null
  loading: boolean
  lastParams: Record<string, string>
  setLastParams: (params: Record<string, string>) => void
  fetch: (params?: NewsParams) => Promise<void>
  getById: (id: string) => Promise<NewsDetail>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useNewsStore = create<NewsStore>((set) => ({
  result: null,
  loading: false,
  lastParams: {},
  setLastParams: (params) => set({ lastParams: params }),

  fetch: async (params = {}) => {
    set({ loading: true })
    try {
      const q = new URLSearchParams()
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('pageSize', String(params.pageSize))
      if (params.search) q.set('search', params.search)
      if (params.published !== undefined) q.set('published', String(params.published))
      if (params.sort) q.set('sort', params.sort)
      const result = await api.get<PagedResult<NewsListItem>>(`/api/news?${q}`)
      useNewsStore.setState({ result, loading: false })
    } catch {
      useNewsStore.setState({ loading: false })
    }
  },

  getById: (id) => api.get<NewsDetail>(`/api/news/${id}`),
  create: (data) => api.post('/api/news', data),
  update: (id, data) => api.put(`/api/news/${id}`, data),
  remove: (id) => api.delete(`/api/news/${id}`),
}))

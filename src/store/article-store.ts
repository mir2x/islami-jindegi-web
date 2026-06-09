import { create } from 'zustand'
import { api } from '@/lib/api'
import type { ArticleListItem, PagedResult } from '@/types'

interface ArticleParams {
  page?: number
  pageSize?: number
  search?: string
  authorId?: string
  categoryId?: string
  published?: boolean
}

interface ArticleStore {
  result: PagedResult<ArticleListItem> | null
  loading: boolean
  fetch: (params?: ArticleParams) => Promise<void>
  create: (data: unknown) => Promise<void>
  update: (id: string, data: unknown) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useArticleStore = create<ArticleStore>((set) => ({
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
    const result = await api.get<PagedResult<ArticleListItem>>(`/api/articles?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => { await api.post('/api/articles', data) },
  update: async (id, data) => { await api.put(`/api/articles/${id}`, data) },
  remove: async (id) => { await api.delete(`/api/articles/${id}`) },
}))

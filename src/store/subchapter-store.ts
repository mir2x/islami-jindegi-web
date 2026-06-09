import { create } from 'zustand'
import { api } from '@/lib/api'
import type { SubChapterListItem, PagedResult } from '@/types'

interface SubChapterStore {
  result: PagedResult<SubChapterListItem> | null
  loading: boolean
  fetch: (params?: { page?: number; pageSize?: number; search?: string; bookId?: string }) => Promise<void>
  create: (data: { chapterId: string; parentSubChapterId?: string | null; title: string; body?: string | null; position?: number }) => Promise<void>
  update: (id: string, data: { title: string; body?: string | null; position?: number; chapterId?: string; parentSubChapterId?: string | null }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useSubChapterStore = create<SubChapterStore>(() => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    useSubChapterStore.setState({ loading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.bookId) query.set('bookId', params.bookId)
    const result = await api.get<PagedResult<SubChapterListItem>>(`/api/subchapters?${query}`)
    useSubChapterStore.setState({ result, loading: false })
  },

  create: async (data) => {
    await api.post('/api/subchapters', data)
  },

  update: async (id, data) => {
    await api.put(`/api/subchapters/${id}`, data)
  },

  remove: async (id) => {
    await api.delete(`/api/subchapters/${id}`)
  },
}))

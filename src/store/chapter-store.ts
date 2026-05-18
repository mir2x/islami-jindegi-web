import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Chapter, ChapterListItem, PagedResult } from '@/types'

interface ChapterStore {
  result: PagedResult<ChapterListItem> | null
  loading: boolean
  fetch: (params?: { page?: number; pageSize?: number; search?: string; bookId?: string }) => Promise<void>
  fetchByBook: (bookId: string) => Promise<Chapter[]>
  create: (bookId: string, data: { title: string; body?: string | null; position?: number }) => Promise<void>
  update: (id: string, data: { title: string; body?: string | null; position?: number }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useChapterStore = create<ChapterStore>(() => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    useChapterStore.setState({ loading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.bookId) query.set('bookId', params.bookId)
    const result = await api.get<PagedResult<ChapterListItem>>(`/api/chapters?${query}`)
    useChapterStore.setState({ result, loading: false })
  },

  fetchByBook: async (bookId: string) => {
    return api.get<Chapter[]>(`/api/books/${bookId}/chapters`)
  },

  create: async (bookId, data) => {
    await api.post(`/api/books/${bookId}/chapters`, data)
  },

  update: async (id, data) => {
    await api.put(`/api/chapters/${id}`, data)
  },

  remove: async (id) => {
    await api.delete(`/api/chapters/${id}`)
  },
}))

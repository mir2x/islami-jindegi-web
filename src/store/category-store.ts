import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Category, PagedResult } from '@/types'

interface CategoryStore {
  /** Full unpaged tree — backs the category filter dropdowns across the admin. */
  categories: Category[]
  /** Paged top-level categories — backs the admin categories list screen. */
  result: PagedResult<Category> | null
  loading: boolean
  pagedLoading: boolean
  fetch: () => Promise<void>
  fetchPaged: (params?: { page?: number; pageSize?: number; search?: string; sort?: string }) => Promise<void>
  create: (data: Partial<Category>) => Promise<void>
  update: (id: string, data: Partial<Category>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  result: null,
  loading: false,
  pagedLoading: false,

  fetch: async () => {
    set({ loading: true })
    const categories = await api.get<Category[]>('/api/categories')
    set({ categories, loading: false })
  },

  // Kept separate from `categories` so the paged list can't clobber the dropdown tree.
  fetchPaged: async (params = {}) => {
    set({ pagedLoading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.sort) query.set('sort', params.sort)
    const result = await api.get<PagedResult<Category>>(`/api/categories/paged?${query}`)
    set({ result, pagedLoading: false })
  },

  create: async (data) => {
    await api.post('/api/categories', data)
  },

  update: async (id, data) => {
    await api.put(`/api/categories/${id}`, data)
  },

  remove: async (id) => {
    await api.delete(`/api/categories/${id}`)
  },
}))

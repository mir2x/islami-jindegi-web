import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Category, CategoryUsage, PagedResult } from '@/types'

/** What the write endpoints accept: module KEYS, not the membership objects they return. */
export type CategoryWritePayload = Omit<Partial<Category>, 'modules'> & { modules?: string[] }

interface CategoryStore {
  /** Full unpaged tree — backs the category filter dropdowns across the admin. */
  categories: Category[]
  /** Paged top-level categories — backs the admin categories list screen. */
  result: PagedResult<Category> | null
  loading: boolean
  pagedLoading: boolean
  fetch: () => Promise<void>
  fetchPaged: (params?: { page?: number; pageSize?: number; search?: string; sort?: string }) => Promise<void>
  create: (data: CategoryWritePayload) => Promise<void>
  update: (id: string, data: CategoryWritePayload) => Promise<void>
  remove: (id: string) => Promise<void>
  usage: (id: string) => Promise<CategoryUsage[]>
  /** Moves all content and memberships from `id` onto `targetId`, then deletes `id`. */
  merge: (id: string, targetId: string) => Promise<void>
  /** Rewrites one module's category order to the sequence given. */
  reorder: (module: string, categoryIds: string[]) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  result: null,
  loading: false,
  pagedLoading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const categories = await api.get<Category[]>('/api/categories')
      set({ categories, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },

  // Kept separate from `categories` so the paged list can't clobber the dropdown tree.
  fetchPaged: async (params = {}) => {
    set({ pagedLoading: true })
    try {
      const query = new URLSearchParams()
      if (params.page) query.set('page', String(params.page))
      if (params.pageSize) query.set('pageSize', String(params.pageSize))
      if (params.search) query.set('search', params.search)
      if (params.sort) query.set('sort', params.sort)
      const result = await api.get<PagedResult<Category>>(`/api/categories/paged?${query}`)
      set({ result, pagedLoading: false })
    } catch (e) {
      set({ pagedLoading: false })
      throw e
    }
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

  usage: (id) => api.get<CategoryUsage[]>(`/api/categories/${id}/usage`),

  merge: async (id, targetId) => {
    await api.post(`/api/categories/${id}/merge`, { targetId })
  },

  reorder: async (module, categoryIds) => {
    await api.put('/api/categories/reorder', { module, categoryIds })
  },
}))

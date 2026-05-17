import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Category } from '@/types'

interface CategoryStore {
  categories: Category[]
  loading: boolean
  fetch: () => Promise<void>
  create: (data: Partial<Category>) => Promise<void>
  update: (id: string, data: Partial<Category>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const categories = await api.get<Category[]>('/api/categories')
    set({ categories, loading: false })
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

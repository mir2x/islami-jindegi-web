import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Author, AuthorUsage, PagedResult } from '@/types'

/** What the write endpoints accept: module KEYS, not the membership objects they return. */
export type AuthorWritePayload = Omit<Partial<Author>, 'modules'> & { modules?: string[] }

interface AuthorStore {
  result: PagedResult<Author> | null
  all: Author[]
  loading: boolean
  fetch: (params?: { page?: number; pageSize?: number; search?: string; sort?: string }) => Promise<void>
  fetchAll: () => Promise<void>
  create: (data: AuthorWritePayload) => Promise<void>
  update: (id: string, data: AuthorWritePayload) => Promise<void>
  remove: (id: string) => Promise<void>
  usage: (id: string) => Promise<AuthorUsage[]>
  /** Moves all content and memberships from `id` onto `targetId`, then deletes `id`. */
  merge: (id: string, targetId: string) => Promise<void>
  /** Rewrites one module's author order to the sequence given. */
  reorder: (module: string, authorIds: string[]) => Promise<void>
}

export const useAuthorStore = create<AuthorStore>((set) => ({
  result: null,
  all: [],
  loading: false,

  fetch: async (params = {}) => {
    set({ loading: true })
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.pageSize) query.set('pageSize', String(params.pageSize))
    if (params.search) query.set('search', params.search)
    if (params.sort) query.set('sort', params.sort)
    const result = await api.get<PagedResult<Author>>(`/api/authors?${query}`)
    set({ result, loading: false })
  },

  // Unpaged: PageSizeClampFilter caps pageSize at 100, so asking the paged endpoint for a big
  // page silently returned the first 100 authors of 394 — and every picker was missing the rest.
  fetchAll: async () => {
    set({ all: await api.get<Author[]>('/api/authors/all') })
  },

  create: async (data) => {
    await api.post('/api/authors', data)
  },

  update: async (id, data) => {
    await api.put(`/api/authors/${id}`, data)
  },

  remove: async (id) => {
    await api.delete(`/api/authors/${id}`)
  },

  usage: (id) => api.get<AuthorUsage[]>(`/api/authors/${id}/usage`),

  merge: async (id, targetId) => {
    await api.post(`/api/authors/${id}/merge`, { targetId })
  },

  reorder: async (module, authorIds) => {
    await api.put('/api/authors/reorder', { module, authorIds })
  },
}))

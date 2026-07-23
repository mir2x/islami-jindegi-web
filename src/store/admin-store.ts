import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Admin } from '@/types'

interface AdminStore {
  admins: Admin[]
  loading: boolean
  fetch: () => Promise<void>
  create: (data: { email: string; displayName?: string }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useAdminStore = create<AdminStore>((set) => ({
  admins: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const admins = await api.get<Admin[]>('/api/admins')
    set({ admins, loading: false })
  },

  create: async (data) => {
    await api.post('/api/admins', data)
  },

  remove: async (id) => {
    await api.delete(`/api/admins/${id}`)
  },
}))

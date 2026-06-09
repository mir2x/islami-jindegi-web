import { create } from 'zustand'
import { api } from '@/lib/api'
import type { MediaItem, PagedResult } from '@/types'

interface FetchParams {
  page?: number
  pageSize?: number
  search?: string
  type?: string
}

interface MediaStore {
  result: PagedResult<MediaItem> | null
  loading: boolean
  uploading: boolean
  fetch: (params?: FetchParams) => Promise<void>
  upload: (file: File) => Promise<MediaItem>
  remove: (id: string) => Promise<void>
}

export const useMediaStore = create<MediaStore>((set) => ({
  result: null,
  loading: false,
  uploading: false,

  fetch: async (params = {}) => {
    set({ loading: true })
    try {
      const q = new URLSearchParams()
      if (params.page) q.set('page', String(params.page))
      if (params.pageSize) q.set('pageSize', String(params.pageSize))
      if (params.search) q.set('search', params.search)
      if (params.type) q.set('type', params.type)
      const result = await api.get<PagedResult<MediaItem>>(`/api/media?${q}`)
      set({ result, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  upload: async (file: File) => {
    set({ uploading: true })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      const item = await res.json() as MediaItem
      return item
    } finally {
      set({ uploading: false })
    }
  },

  remove: async (id: string) => {
    await api.delete(`/api/media/${id}`)
  },
}))

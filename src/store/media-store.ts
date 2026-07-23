import { create } from 'zustand'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
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
  upload: (file: File, onProgress?: (pct: number) => void) => Promise<MediaItem>
  update: (id: string, patch: { fileName?: string; url?: string }) => Promise<MediaItem>
  remove: (id: string) => Promise<void>
}

function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/media/upload`)
    const token = useAuthStore.getState().token
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as MediaItem)
      } else {
        let msg = `Upload failed (${xhr.status})`
        try { msg = JSON.parse(xhr.responseText)?.message ?? msg } catch { /* use default */ }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Network error — check your connection'))
    xhr.ontimeout = () => reject(new Error('Upload timed out'))
    xhr.send(formData)
  })
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

  upload: async (file: File, onProgress?: (pct: number) => void) => {
    set({ uploading: true })
    try {
      return await uploadFile(file, onProgress)
    } finally {
      set({ uploading: false })
    }
  },

  update: async (id: string, patch: { fileName?: string; url?: string }) => {
    return api.patch<MediaItem>(`/api/media/${id}`, patch)
  },

  remove: async (id: string) => {
    await api.delete(`/api/media/${id}`)
  },
}))

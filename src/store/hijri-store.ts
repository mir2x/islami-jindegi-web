import { create } from 'zustand'
import { api } from '@/lib/api'
import type { HijriMonthSighting, PagedResult } from '@/types'

interface HijriStore {
  result: PagedResult<HijriMonthSighting> | null
  loading: boolean
  fetch: (params?: { page?: number; pageSize?: number; countryCode?: string; hijriYear?: number }) => Promise<void>
  create: (data: { countryCode: string; hijriYear: number; hijriMonth: number; gregorianStartDate: string }) => Promise<void>
  update: (id: string, data: { countryCode: string; hijriYear: number; hijriMonth: number; gregorianStartDate: string }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useHijriStore = create<HijriStore>((set) => ({
  result: null,
  loading: false,

  fetch: async (params = {}) => {
    set({ loading: true })
    const q = new URLSearchParams()
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    if (params.countryCode) q.set('countryCode', params.countryCode)
    if (params.hijriYear) q.set('hijriYear', String(params.hijriYear))
    const result = await api.get<PagedResult<HijriMonthSighting>>(`/api/hijri/sightings?${q}`)
    set({ result, loading: false })
  },

  create: async (data) => {
    await api.post('/api/hijri/sightings', {
      countryCode: data.countryCode,
      hijriYear: data.hijriYear,
      hijriMonth: data.hijriMonth,
      gregorianStartDate: data.gregorianStartDate,
    })
  },

  update: async (id, data) => {
    await api.put(`/api/hijri/sightings/${id}`, {
      countryCode: data.countryCode,
      hijriYear: data.hijriYear,
      hijriMonth: data.hijriMonth,
      gregorianStartDate: data.gregorianStartDate,
    })
  },

  remove: async (id) => {
    await api.delete(`/api/hijri/sightings/${id}`)
  },
}))

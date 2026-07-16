import type { FilterOption } from '@/components/public/mobile-filter-sheet'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function fetchOptions<T>(path: string, search: string): Promise<T[]> {
  const q = new URLSearchParams({ published: 'true' })
  if (search) q.set('search', search)
  try {
    const res = await fetch(`${BASE}${path}?${q}`)
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

// For "authors"-shaped option endpoints ({ id, name, count })
export async function fetchNamedOptions(path: string, search: string): Promise<FilterOption[]> {
  const raw = await fetchOptions<{ id: string; name: string; count: number }>(path, search)
  return raw.map(o => ({ id: o.id, label: o.name, count: o.count }))
}

// For "categories"-shaped option endpoints ({ id, title, count })
export async function fetchTitledOptions(path: string, search: string): Promise<FilterOption[]> {
  const raw = await fetchOptions<{ id: string; title: string; count: number }>(path, search)
  return raw.map(o => ({ id: o.id, label: o.title, count: o.count }))
}

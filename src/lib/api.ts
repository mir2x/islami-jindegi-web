import { useAuthStore } from '@/store/auth-store'

const BASE = process.env.NEXT_PUBLIC_API_URL

/** Carries the HTTP status so callers can act on it — 409 in particular means a duplicate title. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (res.status === 401) useAuthStore.getState().clearSession()

  if (!res.ok) {
    // The API returns { message } for conflicts and validation failures; fall back to the raw
    // body so an unexpected error still says something useful.
    const body = await res.text()
    let message = body
    try {
      const parsed = JSON.parse(body)
      if (parsed?.message) message = parsed.message
    } catch { /* not JSON — keep the raw text */ }
    throw new ApiError(res.status, message || `API error ${res.status}`)
  }

  // 204 and empty bodies would blow up res.json().
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}

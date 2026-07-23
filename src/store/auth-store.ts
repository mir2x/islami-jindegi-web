import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  token: string | null
  email: string | null
  setSession: (token: string, email: string) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      setSession: (token, email) => set({ token, email }),
      clearSession: () => set({ token: null, email: null }),
    }),
    { name: 'ij-admin-auth' }
  )
)

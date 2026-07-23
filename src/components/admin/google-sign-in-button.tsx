'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

export function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null)
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set')
      return
    }

    const handleCredential = async (response: { credential: string }) => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential }),
        })
        if (!res.ok) return
        const { token, email } = await res.json()
        setSession(token, email)
        window.location.assign('/admin')
      } catch (e) {
        console.error('Google sign-in failed', e)
      }
    }

    const init = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential })
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      })
    }

    if (window.google) {
      init()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = init
    document.body.appendChild(script)
    return () => {
      script.onload = null
    }
  }, [setSession])

  return <div ref={buttonRef} />
}

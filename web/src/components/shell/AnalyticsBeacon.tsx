'use client'

import {useAuth, useUser} from '@clerk/nextjs'
import {usePathname} from 'next/navigation'
import {useEffect, useRef} from 'react'
import {apiFetch} from '@/lib/api'

/**
 * Records page views and one login ping per browser session for the admin
 * overview. Failures are silent — analytics must never block the archive.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname()
  const {isLoaded, isSignedIn, getToken} = useAuth()
  const {user} = useUser()
  const lastPath = useRef<string | null>(null)
  const loginSent = useRef(false)

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    lastPath.current = pathname

    void apiFetch('/admin/events', {
      method: 'POST',
      body: {type: 'page_view', path: pathname},
      getAccessToken: isSignedIn ? () => getToken() : undefined,
    }).catch(() => {})
  }, [pathname, isSignedIn, getToken])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || loginSent.current) return
    if (typeof window === 'undefined') return

    const key = `bc-login-ping:${user.id}`
    try {
      if (sessionStorage.getItem(key)) {
        loginSent.current = true
        return
      }
      sessionStorage.setItem(key, '1')
    } catch {
      // Private browsing can block sessionStorage; still try once per mount.
    }
    loginSent.current = true

    void apiFetch('/admin/events', {
      method: 'POST',
      body: {type: 'login', path: pathname || '/'},
      getAccessToken: () => getToken(),
    }).catch(() => {})
  }, [isLoaded, isSignedIn, user, getToken, pathname])

  return null
}

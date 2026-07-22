'use client'

import {useAuth} from '@clerk/nextjs'
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {apiFetch} from '@/lib/api'

type UnreadContextValue = {
  /** Total unread messages across every conversation. */
  total: number
  /** Call after reading a thread so the badge clears without a round trip. */
  refresh: () => void
}

const UnreadContext = createContext<UnreadContextValue>({total: 0, refresh: () => {}})

const POLL_MS = 60_000

/**
 * Keeps the Messages badge honest across the whole app.
 *
 * Deliberately low-frequency: the thread view already has a realtime Ably
 * subscription, so this only has to catch messages that arrive while someone is
 * reading a story somewhere else.
 */
export function UnreadProvider({children}: {children: React.ReactNode}) {
  const {isLoaded, isSignedIn, getToken} = useAuth()
  const [total, setTotal] = useState(0)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setTotal(0)
      return
    }
    let cancelled = false

    async function load() {
      try {
        const data = await apiFetch<{conversations: Array<{unreadCount?: number}>}>(
          '/conversations',
          {getAccessToken: () => getToken()}
        )
        if (cancelled) return
        setTotal(data.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0))
      } catch {
        // A badge is not worth surfacing an error for.
      }
    }

    void load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isLoaded, isSignedIn, getToken, tick])

  const value = useMemo(() => ({total, refresh}), [total, refresh])
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
}

export function useUnread() {
  return useContext(UnreadContext)
}

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { syncToSupabase, downloadFromSupabase } from '../db/syncEngine'
import { useAuth } from './AuthContext'
import { db } from '../db/database'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [toast, setToast] = useState(null)
  const { user } = useAuth()
  const prevUserIdRef = useRef(undefined)

  useEffect(() => {
    const prevUserId = prevUserIdRef.current
    const currentUserId = user?.id ?? null

    if (prevUserId === undefined) {
      prevUserIdRef.current = currentUserId
      // First load — if user already logged in, download their data
      if (currentUserId && navigator.onLine) {
        console.log('[Auth] User found on load, downloading data...')
        downloadFromSupabase()
      }
      return
    }

    if (prevUserId !== currentUserId) {
      prevUserIdRef.current = currentUserId

      if (currentUserId) {
        // New user logged in — download their data from Supabase
        console.log('[Auth] New user logged in, downloading data...')
        downloadFromSupabase()
      } else {
        // User logged out — clear local data
        console.log('[Auth] User logged out, clearing local data...')
        clearLocalData()
      }
    }
  }, [user])

  async function clearLocalData() {
    try {
      await db.customers.clear()
      await db.transactions.clear()
      await db.transaction_items.clear()
      await db.sync_queue.clear()
      console.log('[Auth] Local data cleared')
    } catch (err) {
      console.error('[Auth] Failed to clear local data:', err)
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('✅ May internet na! Nag-si-sync...', 'success')
      handleSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      showToast('📵 Walang internet. Offline mode.', 'warning')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function handleSync() {
    if (!user) return
    setIsSyncing(true)
    try {
      await syncToSupabase()
      setLastSync(new Date())
    } finally {
      setIsSyncing(false)
    }
  }

  function showToast(message, type = 'info') {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <AppContext.Provider value={{ isOnline, isSyncing, lastSync, toast, showToast, handleSync }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { syncToSupabase } from '../db/syncEngine'
import { useAuth } from './AuthContext'
import { db } from '../db/database'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [toast, setToast] = useState(null)
  const { user } = useAuth()
  const prevUserIdRef = useRef(undefined) // undefined = not yet initialized

  useEffect(() => {
    const prevUserId = prevUserIdRef.current
    const currentUserId = user?.id ?? null

    // Skip on very first render (undefined = not initialized yet)
    if (prevUserId === undefined) {
      prevUserIdRef.current = currentUserId
      return
    }

    // Only clear if DIFFERENT user logged in, or user logged OUT
    if (prevUserId !== currentUserId) {
      console.log('[Auth] User changed, clearing local data...')
      clearLocalData()
      prevUserIdRef.current = currentUserId
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

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
  const prevUserRef = useRef(null)

  // When user changes (login/logout/switch), clear local Dexie data
  useEffect(() => {
    const prevUser = prevUserRef.current
    const currentUserId = user?.id ?? null
    const prevUserId = prevUser?.id ?? null

    if (prevUserId !== currentUserId) {
      // Different user or logged out — wipe local DB so no data leaks!
      if (prevUserId !== null || currentUserId !== null) {
        clearLocalData()
      }
      prevUserRef.current = user
    }
  }, [user])

  async function clearLocalData() {
    try {
      await db.customers.clear()
      await db.transactions.clear()
      await db.transaction_items.clear()
      await db.sync_queue.clear()
      console.log('[Auth] Local data cleared for user switch')
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
    if (!user) return // Don't sync if not logged in
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

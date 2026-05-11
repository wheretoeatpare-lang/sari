import { createContext, useContext, useState, useEffect } from 'react'
import { syncToSupabase } from '../db/syncEngine'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [toast, setToast] = useState(null)

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

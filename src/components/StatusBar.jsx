import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function StatusBar() {
  const { isOnline, isSyncing, handleSync } = useApp()

  if (isOnline && !isSyncing) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold ${
      isOnline ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'
    }`}>
      {isOnline ? (
        <>
          <RefreshCw size={12} className="animate-spin" />
          <span>Nag-si-sync sa cloud...</span>
        </>
      ) : (
        <>
          <WifiOff size={12} />
          <span>Offline mode – naka-save sa phone</span>
        </>
      )}
    </div>
  )
}

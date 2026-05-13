import { RefreshCw, WifiOff, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

export default function StatusBar() {
  const { isOnline, isSyncing } = useApp()
  const { user, signOut } = useAuth()
  const { t } = useLang()

  return (
    <>
      {user && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-700 text-white flex items-center justify-between px-4 py-2 text-xs">
          <span className="truncate max-w-[70%]">👤 {user.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded-lg transition-all"
          >
            <LogOut size={11} />
            <span>{t('logout')}</span>
          </button>
        </div>
      )}

      {(!isOnline || isSyncing) && (
        <div className={`fixed left-0 right-0 z-40 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold ${
          user ? 'top-8' : 'top-0'
        } ${
          isOnline ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'
        }`}>
          {isOnline ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              <span>{t('syncing')}</span>
            </>
          ) : (
            <>
              <WifiOff size={12} />
              <span>{t('offlineMode')}</span>
            </>
          )}
        </div>
      )}
    </>
  )
}

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Header({ title, showBack = false, rightAction = null }) {
  const navigate = useNavigate()
  const { isOnline } = useApp()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3 h-14">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isOnline
            ? <Wifi size={16} className="text-emerald-500" />
            : <WifiOff size={16} className="text-amber-400" />
          }
          {rightAction}
        </div>
      </div>
    </header>
  )
}

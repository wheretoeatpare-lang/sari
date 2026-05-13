import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wifi, WifiOff, Globe } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LanguageContext'

export default function Header({ title, showBack = false, rightAction = null }) {
  const navigate = useNavigate()
  const { isOnline } = useApp()
  const { lang, switchLang } = useLang()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          {/* Wifi status */}
          {isOnline
            ? <Wifi size={16} className="text-emerald-500" />
            : <WifiOff size={16} className="text-amber-400" />
          }

          {/* Language switcher */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowLangMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
              title="Switch Language"
            >
              <Globe size={15} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600 uppercase">{lang}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-50 min-w-[130px]">
                <button
                  onClick={() => { switchLang('tl'); setShowLangMenu(false) }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50 ${
                    lang === 'tl' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
                  }`}
                >
                  <span className="text-base">🇵🇭</span>
                  <span>Filipino</span>
                  {lang === 'tl' && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
                </button>
                <div className="h-px bg-gray-100 mx-3" />
                <button
                  onClick={() => { switchLang('en'); setShowLangMenu(false) }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50 ${
                    lang === 'en' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-700'
                  }`}
                >
                  <span className="text-base">🇺🇸</span>
                  <span>English</span>
                  {lang === 'en' && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>

          {rightAction}
        </div>
      </div>
    </header>
  )
}

import { NavLink } from 'react-router-dom'
import { Home, Users, ArrowLeftRight } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

export default function BottomNav() {
  const { t } = useLang()

  const navItems = [
    { to: '/', icon: Home, label: t('navDashboard') },
    { to: '/customers', icon: Users, label: t('navCustomers') },
    { to: '/transactions', icon: ArrowLeftRight, label: t('navTransactions') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-xs font-${isActive ? '700' : '500'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

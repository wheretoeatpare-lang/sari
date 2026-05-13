import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react'
import Header from '../components/Header'
import TransactionModal from '../components/TransactionModal'
import { getTotalUtang, getTodayPayments, getRecentTransactions } from '../db/database'
import { formatPeso, formatRelative, getInitials } from '../utils/format'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LanguageContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { dataVersion } = useApp()
  const { t } = useLang()
  const [totalUtang, setTotalUtang] = useState(0)
  const [todayPayments, setTodayPayments] = useState(0)
  const [recentTxns, setRecentTxns] = useState([])
  const [showModal, setShowModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [dataVersion])

  async function loadData() {
    setLoading(true)
    const [utang, payments, recent] = await Promise.all([
      getTotalUtang(),
      getTodayPayments(),
      getRecentTransactions(8),
    ])
    setTotalUtang(utang)
    setTodayPayments(payments)
    setRecentTxns(recent)
    setLoading(false)
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening')

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title={t('utangTracker')} />

      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div>
          <p className="text-gray-500 text-sm">{greeting}, Ate/Kuya! 👋</p>
          <h2 className="text-2xl font-black text-gray-900">{t('howsShop')}</h2>
        </div>

        <div className="space-y-3">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-5 text-white shadow-lg shadow-red-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-xl p-2">
                  <TrendingDown size={20} />
                </div>
                <span className="text-sm font-semibold opacity-90">{t('totalUtangSuki')}</span>
              </div>
            </div>
            <p className="text-4xl font-black tracking-tight">
              {loading ? '...' : formatPeso(totalUtang)}
            </p>
            <p className="text-sm opacity-75 mt-1">{t('totalToPay')}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 rounded-xl p-2">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-semibold opacity-90">{t('paymentsToday')}</span>
            </div>
            <p className="text-4xl font-black tracking-tight">
              {loading ? '...' : formatPeso(todayPayments)}
            </p>
            <p className="text-sm opacity-75 mt-1">{t('collectedToday')}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowModal('utang')}
              className="bg-white border-2 border-red-100 rounded-3xl p-4 text-left hover:border-red-300 active:bg-red-50 transition-all shadow-sm"
            >
              <div className="text-2xl mb-2">📝</div>
              <p className="font-bold text-gray-900">{t('addUtang')}</p>
              <p className="text-xs text-gray-500">{t('recordNewDebt')}</p>
            </button>
            <button
              onClick={() => setShowModal('bayad')}
              className="bg-white border-2 border-emerald-100 rounded-3xl p-4 text-left hover:border-emerald-300 active:bg-emerald-50 transition-all shadow-sm"
            >
              <div className="text-2xl mb-2">💚</div>
              <p className="font-bold text-gray-900">{t('addBayad')}</p>
              <p className="text-xs text-gray-500">{t('recordPayment')}</p>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('recentTransactions')}</h3>
            <button onClick={() => navigate('/transactions')} className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
              {t('seeAll')} <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-500 font-medium">{t('noTransactions')}</p>
              <p className="text-gray-400 text-sm">{t('recordFirstDebt')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTxns.map(txn => (
                <div key={txn.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                    txn.type === 'utang' ? 'bg-red-400' : 'bg-emerald-400'
                  }`}>
                    {txn.customer ? getInitials(txn.customer.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{txn.customer?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{formatRelative(txn.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-base ${txn.type === 'utang' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {txn.type === 'utang' ? '-' : '+'}{formatPeso(txn.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{txn.type === 'utang' ? t('debt') : t('payment')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TransactionModal
          type={showModal}
          onClose={() => setShowModal(null)}
          onSaved={loadData}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Filter, Plus } from 'lucide-react'
import Header from '../components/Header'
import TransactionModal from '../components/TransactionModal'
import { getRecentTransactions, db } from '../db/database'
import { formatPeso, formatDate, formatTime, getInitials } from '../utils/format'

const FILTERS = [
  { key: 'all', label: 'Lahat' },
  { key: 'utang', label: '📝 Utang' },
  { key: 'bayad', label: '💚 Bayad' },
]

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const txns = await getRecentTransactions(50)
    setTransactions(txns)
    setLoading(false)
  }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  // Group by date
  const grouped = filtered.reduce((acc, txn) => {
    const date = formatDate(txn.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(txn)
    return acc
  }, {})

  const totalUtang = filtered.filter(t => t.type === 'utang').reduce((s, t) => s + Number(t.amount), 0)
  const totalBayad = filtered.filter(t => t.type === 'bayad').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header
        title="📊 Mga Transaksyon"
        rightAction={
          <button
            onClick={() => setShowModal('utang')}
            className="bg-emerald-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 font-bold text-sm shadow-sm shadow-emerald-200"
          >
            <Plus size={16} /> Bago
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 grid grid-cols-2 gap-3 shadow-sm">
          <div className="text-center">
            <p className="text-xl font-black text-red-500">{formatPeso(totalUtang)}</p>
            <p className="text-xs text-gray-400">Kabuuang Utang</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-xl font-black text-emerald-500">{formatPeso(totalBayad)}</p>
            <p className="text-xs text-gray-400">Kabuuang Bayad</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                filter === f.key
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Quick add buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowModal('utang')}
            className="flex items-center justify-center gap-2 bg-red-50 border-2 border-red-100 text-red-600 font-bold py-3 rounded-2xl text-sm hover:bg-red-100 active:bg-red-200 transition-colors"
          >
            📝 I-record ng Utang
          </button>
          <button
            onClick={() => setShowModal('bayad')}
            className="flex items-center justify-center gap-2 bg-emerald-50 border-2 border-emerald-100 text-emerald-600 font-bold py-3 rounded-2xl text-sm hover:bg-emerald-100 active:bg-emerald-200 transition-colors"
          >
            💚 I-record ng Bayad
          </button>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-bold text-gray-700">Wala pang transaksyon</p>
            <p className="text-gray-400 text-sm mt-1">I-record ang unang utang o bayad!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, txns]) => (
              <div key={date}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{date}</p>
                <div className="space-y-2">
                  {txns.map(txn => (
                    <div key={txn.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 ${
                        txn.type === 'utang' ? 'bg-red-400' : 'bg-emerald-400'
                      }`}>
                        {txn.customer ? getInitials(txn.customer.name) : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{txn.customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{formatTime(txn.created_at)}</p>
                        {txn.notes && <p className="text-xs text-gray-400 italic truncate">"{txn.notes}"</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-base ${txn.type === 'utang' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {txn.type === 'utang' ? '-' : '+'}{formatPeso(txn.amount)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          txn.type === 'utang' ? 'bg-red-50 text-red-400' : 'bg-emerald-50 text-emerald-500'
                        }`}>
                          {txn.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronRight } from 'lucide-react'
import Header from '../components/Header'
import CustomerModal from '../components/CustomerModal'
import { getCustomersWithBalances } from '../db/database'
import { formatPeso, getInitials } from '../utils/format'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadCustomers() }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(customers)
    } else {
      const q = search.toLowerCase()
      setFiltered(customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      ))
    }
  }, [search, customers])

  async function loadCustomers() {
    setLoading(true)
    const data = await getCustomersWithBalances()
    setCustomers(data)
    setLoading(false)
  }

  const totalDebtors = customers.filter(c => c.balance > 0).length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        title="👥 Mga Suki"
        rightAction={
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-500 text-white rounded-xl px-3 py-2 flex items-center gap-1 font-bold text-sm shadow-sm shadow-emerald-200"
          >
            <Plus size={16} /> Dagdag
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm">
          <div className="flex-1 text-center border-r border-gray-100">
            <p className="text-2xl font-black text-gray-900">{customers.length}</p>
            <p className="text-xs text-gray-400">Lahat ng Suki</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-black text-red-500">{totalDebtors}</p>
            <p className="text-xs text-gray-400">May Utang</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hanapin ang suki..."
            className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-base focus:border-emerald-400 focus:outline-none shadow-sm"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <p className="text-5xl mb-3">{search ? '🔍' : '👤'}</p>
            <p className="font-bold text-gray-700">
              {search ? 'Walang nakitang suki' : 'Wala pang suki'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Subukan ng ibang pangalan' : 'Mag-dagdag ng bagong suki!'}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-emerald-500 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-emerald-200"
              >
                + Dagdag ng Suki
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(customer => {
              const colors = [
                'from-violet-400 to-purple-500',
                'from-sky-400 to-blue-500',
                'from-amber-400 to-orange-500',
                'from-pink-400 to-rose-500',
                'from-emerald-400 to-teal-500',
              ]
              const colorIdx = customer.id % colors.length

              return (
                <button
                  key={customer.id}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md active:scale-[0.98] transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm`}>
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {customer.phone || customer.address || 'Walang contact info'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 mr-1">
                    {customer.balance > 0 ? (
                      <>
                        <p className="font-black text-red-500">{formatPeso(customer.balance)}</p>
                        <p className="text-xs text-red-300">utang pa</p>
                      </>
                    ) : customer.balance < 0 ? (
                      <>
                        <p className="font-black text-emerald-500">{formatPeso(Math.abs(customer.balance))}</p>
                        <p className="text-xs text-emerald-300">sobrang bayad</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-400">₱0</p>
                        <p className="text-xs text-gray-300">wala nang utang</p>
                      </>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onSaved={loadCustomers}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Edit2, Phone, MapPin } from 'lucide-react'
import Header from '../components/Header'
import CustomerModal from '../components/CustomerModal'
import TransactionModal from '../components/TransactionModal'
import EditTransactionModal from '../components/EditTransactionModal'
import { getCustomerById, getTransactionsByCustomer, getCustomerBalance, getTransactionItems } from '../db/database'
import { formatPeso, formatDate, formatTime, getInitials } from '../utils/format'
import { useLang } from '../context/LanguageContext'

export default function CustomerDetail() {
  const { id } = useParams()
  const { t } = useLang()
  const [customer, setCustomer] = useState(null)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTxModal, setShowTxModal] = useState(null)
  const [expandedTx, setExpandedTx] = useState(null)
  const [txItems, setTxItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState(null)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [cust, bal, txns] = await Promise.all([
      getCustomerById(id),
      getCustomerBalance(id),
      getTransactionsByCustomer(id),
    ])
    setCustomer(cust)
    setBalance(bal)
    setTransactions(txns)
    setLoading(false)
  }

  async function toggleExpand(txId) {
    if (expandedTx === txId) { setExpandedTx(null); return }
    setExpandedTx(txId)
    if (!txItems[txId]) {
      const items = await getTransactionItems(txId)
      setTxItems(prev => ({ ...prev, [txId]: items }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="..." showBack />
        <div className="max-w-md mx-auto px-4 pt-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Hindi nahanap" showBack />
        <p className="text-center text-gray-400 mt-20">Walang suki na ito.</p>
      </div>
    )
  }

  const colors = ['from-violet-400 to-purple-500','from-sky-400 to-blue-500','from-amber-400 to-orange-500','from-pink-400 to-rose-500','from-emerald-400 to-teal-500']
  const colorIdx = customer.id % colors.length

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header
        title={customer.name}
        showBack
        rightAction={
          <button onClick={() => setShowEditModal(true)} className="p-2 rounded-xl hover:bg-gray-100">
            <Edit2 size={18} className="text-gray-600" />
          </button>
        }
      />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-xl font-black text-white shadow-md`}>
              {getInitials(customer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-gray-900">{customer.name}</h2>
              {customer.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone size={12} /> {customer.phone}
                </p>
              )}
              {customer.address && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} /> {customer.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`rounded-3xl p-5 text-white shadow-lg ${
          balance > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200'
          : balance < 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200'
          : 'bg-gradient-to-br from-gray-400 to-gray-500'
        }`}>
          <p className="text-sm font-semibold opacity-80 mb-1">
            {balance > 0 ? t('utangPaSuki') : balance < 0 ? t('overpaidLabel') : t('noDebtLabel')}
          </p>
          <p className="text-4xl font-black">{formatPeso(Math.abs(balance))}</p>
          {balance > 0 && <p className="text-sm opacity-75 mt-1">{t('needsToPay')}</p>}
          {balance === 0 && <p className="text-sm opacity-75 mt-1">{t('allPaid')}</p>}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowTxModal('utang')}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-md shadow-red-200"
          >
            📝 {t('debt')}
          </button>
          <button
            onClick={() => setShowTxModal('bayad')}
            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-md shadow-emerald-200"
          >
            💚 {t('payment')}
          </button>
        </div>

        {/* Transaction history */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            {t('transactionHistory')} ({transactions.length})
          </h3>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-gray-500 font-medium">{t('noTransactionsYet')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(txn => (
                <div key={txn.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="w-full p-4 flex items-center gap-3">
                    {/* Tap area to expand */}
                    <button
                      onClick={() => toggleExpand(txn.id)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                        txn.type === 'utang' ? 'bg-red-50' : 'bg-emerald-50'
                      }`}>
                        {txn.type === 'utang' ? '📝' : '💚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">
                          {txn.type === 'utang' ? t('borrowed') : t('paid')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(txn.created_at)} · {formatTime(txn.created_at)}
                        </p>
                        {txn.notes && <p className="text-xs text-gray-500 italic mt-0.5">"{txn.notes}"</p>}
                      </div>
                      <p className={`font-black text-lg shrink-0 ${txn.type === 'utang' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {txn.type === 'utang' ? '-' : '+'}{formatPeso(txn.amount)}
                      </p>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingTransaction(txn) }}
                      className="ml-2 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0"
                      title="Edit"
                    >
                      <Edit2 size={15} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>

                  {/* Expanded items */}
                  {expandedTx === txn.id && txItems[txn.id]?.length > 0 && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase mt-3 mb-2">{t('itemsBought')}</p>
                      <div className="space-y-1.5">
                        {txItems[txn.id].map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{item.description} <span className="text-gray-400">×{item.quantity}</span></span>
                            <span className="font-semibold text-gray-800">{formatPeso(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <CustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSaved={loadData}
        />
      )}

      {showTxModal && (
        <TransactionModal
          type={showTxModal}
          customerId={customer.id}
          onClose={() => setShowTxModal(null)}
          onSaved={loadData}
        />
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSaved={() => {
            setEditingTransaction(null)
            setTxItems({}) // clear cached items so they reload fresh
            loadData()
          }}
        />
      )}
    </div>
  )
}

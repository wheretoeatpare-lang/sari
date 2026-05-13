import { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { updateTransaction, deleteTransaction, getTransactionItems, updateTransactionItems } from '../db/database'
import { syncToSupabase } from '../db/syncEngine'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LanguageContext'
import { formatPeso } from '../utils/format'

export default function EditTransactionModal({ transaction, onClose, onSaved }) {
  const { showToast } = useApp()
  const { t } = useLang()
  const [amount, setAmount] = useState(String(transaction.amount))
  const [notes, setNotes] = useState(transaction.notes || '')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isUtang = transaction.type === 'utang'

  useEffect(() => {
    async function fetchItems() {
      if (isUtang) {
        const txItems = await getTransactionItems(transaction.id)
        if (txItems && txItems.length > 0) {
          setItems(txItems.map(i => ({
            id: i.id,
            description: i.description,
            quantity: i.quantity,
            unit_price: String(i.unit_price),
          })))
        } else {
          setItems([{ description: '', quantity: 1, unit_price: '' }])
        }
      }
      setLoadingItems(false)
    }
    fetchItems()
  }, [transaction.id, isUtang])

  const totalFromItems = items.reduce(
    (sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0
  )

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }

  function removeItem(idx) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    const finalAmount = isUtang && totalFromItems > 0 ? totalFromItems : Number(amount)
    if (!finalAmount || finalAmount <= 0) {
      showToast(t('enterAmount'), 'error')
      return
    }
    setLoading(true)
    try {
      await updateTransaction(transaction.id, {
        amount: finalAmount,
        notes,
      })
      if (isUtang) {
        const validItems = items.filter(i => i.description && Number(i.unit_price) > 0)
        await updateTransactionItems(
          transaction.id,
          validItems.map(i => ({
            ...i,
            unit_price: Number(i.unit_price),
            quantity: Number(i.quantity),
          }))
        )
      }
      syncToSupabase()
      showToast(t('transactionUpdated'), 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      showToast(t('errorTryAgain'), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteTransaction(transaction.id)
      syncToSupabase()
      showToast(t('transactionDeleted'), 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      showToast(t('errorTryAgain'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isUtang ? `✏️ ${t('editDebt')}` : `✏️ ${t('editPayment')}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Type badge */}
        <div className="px-5 shrink-0">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold mb-4 ${
            isUtang ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {isUtang ? '📝' : '💚'} {isUtang ? t('editDebt') : t('editPayment')}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5">
          {loadingItems ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {isUtang && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-600">{t('itemsBoughtLabel')}</label>
                    <button onClick={addItem} className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                      <Plus size={16} /> {t('addItem')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-2xl p-3 space-y-2">
                        <input
                          type="text"
                          placeholder={t('itemName')}
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none bg-white"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder={t('qty')}
                            value={item.quantity}
                            min="1"
                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                            className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none bg-white"
                          />
                          <input
                            type="number"
                            placeholder={t('price')}
                            value={item.unit_price}
                            onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none bg-white"
                          />
                          {items.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {item.unit_price && (
                          <p className="text-xs text-gray-500 text-right">
                            = {formatPeso(Number(item.quantity) * Number(item.unit_price))}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {totalFromItems > 0 && (
                    <div className="mt-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex justify-between items-center">
                      <span className="text-sm font-semibold text-red-700">{t('totalDebt')}</span>
                      <span className="text-lg font-black text-red-600">{formatPeso(totalFromItems)}</span>
                    </div>
                  )}
                  {totalFromItems === 0 && (
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('orAmount')}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₱</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full border-2 border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-base font-bold focus:border-red-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isUtang && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('paymentAmount')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₱</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border-2 border-gray-200 rounded-2xl pl-10 pr-4 py-4 text-xl font-bold focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('notes')}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('noteExample')}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="px-5 pb-8 pt-3 shrink-0 space-y-2">
          <button
            onClick={handleSave}
            disabled={loading || loadingItems}
            className={`w-full font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg disabled:opacity-60 text-white ${
              isUtang
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-red-200'
                : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {loading ? t('saving') : `💾 ${t('save')}`}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="w-full font-bold py-3.5 rounded-2xl text-base transition-colors border-2 border-red-200 text-red-500 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> {t('deleteTransaction')}
          </button>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900">{t('deleteTransaction')}</h3>
              <p className="text-gray-500 text-sm">{t('confirmDelete')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-3 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading ? '...' : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

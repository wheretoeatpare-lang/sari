import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { addTransaction, getAllCustomers } from '../db/database'
import { syncToSupabase } from '../db/syncEngine'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LanguageContext'
import { formatPeso } from '../utils/format'

export default function TransactionModal({ type = 'utang', customerId = null, onClose, onSaved }) {
  const { showToast } = useApp()
  const { t } = useLang()
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(customerId ? String(customerId) : '')
  const [txType, setTxType] = useState(type)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: '' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAllCustomers().then(setCustomers)
  }, [])

  const totalFromItems = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0)
  const isUtang = txType === 'utang'

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: '' }])
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx, field, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSubmit() {
    if (!selectedCustomer) { showToast(t('selectCustomerError'), 'error'); return }

    const finalAmount = isUtang && items.some(i => i.description && i.unit_price)
      ? totalFromItems
      : Number(amount)

    if (!finalAmount || finalAmount <= 0) {
      showToast(t('enterAmount'), 'error'); return
    }

    setLoading(true)
    try {
      const validItems = isUtang ? items.filter(i => i.description && Number(i.unit_price) > 0) : []
      await addTransaction(
        {
          customer_id: Number(selectedCustomer),
          type: txType,
          amount: finalAmount,
          notes,
        },
        validItems.map(i => ({ ...i, unit_price: Number(i.unit_price), quantity: Number(i.quantity) }))
      )

      syncToSupabase()
      const msg = txType === 'utang' ? t('debtRecorded') : t('paymentRecorded')
      showToast(msg, 'success')
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
            {isUtang ? t('recordDebt') : t('recordPayment2')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="px-5 shrink-0">
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
            <button
              onClick={() => setTxType('utang')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${txType === 'utang' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}
            >
              📝 {t('debt')}
            </button>
            <button
              onClick={() => setTxType('bayad')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${txType === 'bayad' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500'}`}
            >
              💚 {t('payment')}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t('customer')} *</label>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-medium focus:border-emerald-400 focus:outline-none bg-white"
              disabled={!!customerId}
            >
              <option value="">{t('selectCustomer')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

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
        </div>

        <div className="px-5 pb-8 pt-3 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg disabled:opacity-60 text-white ${
              isUtang
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-red-200'
                : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {loading ? t('saving') : isUtang ? t('saveRecord') : t('savePayment')}
          </button>
        </div>
      </div>
    </div>
  )
}

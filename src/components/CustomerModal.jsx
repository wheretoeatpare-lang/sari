import { useState } from 'react'
import { X, User, Phone, MapPin } from 'lucide-react'
import { addCustomer, updateCustomer } from '../db/database'
import { syncToSupabase } from '../db/syncEngine'
import { useApp } from '../context/AppContext'
import { useLang } from '../context/LanguageContext'

export default function CustomerModal({ customer = null, onClose, onSaved }) {
  const { showToast } = useApp()
  const { t } = useLang()
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  })
  const [loading, setLoading] = useState(false)

  const isEdit = !!customer

  async function handleSubmit() {
    if (!form.name.trim()) {
      showToast(t('nameRequired'), 'error')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await updateCustomer(customer.id, form)
        showToast(t('customerUpdated'), 'success')
      } else {
        await addCustomer(form)
        showToast(t('customerAdded'), 'success')
      }
      syncToSupabase()
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
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? t('editCustomer') : t('newCustomer')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><User size={14} /> {t('name')}</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={t('namePlaceholder')}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-medium focus:border-emerald-400 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><Phone size={14} /> {t('phone')}</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="09XXXXXXXXX"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-medium focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><MapPin size={14} /> {t('address')}</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder={t('addressPlaceholder')}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-medium focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-emerald-200 mt-2"
          >
            {loading ? t('saving') : isEdit ? t('saveChanges') : t('addCustomerBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

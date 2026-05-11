import { useState } from 'react'
import { X, User, Phone, MapPin } from 'lucide-react'
import { addCustomer, updateCustomer } from '../db/database'
import { useApp } from '../context/AppContext'

export default function CustomerModal({ customer = null, onClose, onSaved }) {
  const { showToast } = useApp()
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  })
  const [loading, setLoading] = useState(false)

  const isEdit = !!customer

  async function handleSubmit() {
    if (!form.name.trim()) {
      showToast('❌ Kailangan ng pangalan!', 'error')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await updateCustomer(customer.id, form)
        showToast('✅ Na-update na ang suki!', 'success')
      } else {
        await addCustomer(form)
        showToast('✅ Naidagdag ang bagong suki!', 'success')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      showToast('❌ May error. Subukan ulit.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? '✏️ I-edit ang Suki' : '➕ Bagong Suki'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><User size={14} /> Pangalan *</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Juan dela Cruz"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-medium focus:border-emerald-400 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><Phone size={14} /> Telepono (opsyonal)</span>
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
              <span className="flex items-center gap-1"><MapPin size={14} /> Address (opsyonal)</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Blk 1 Lot 2 Kalye Mo"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-base font-medium focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-emerald-200 mt-2"
          >
            {loading ? 'Nag-se-save...' : isEdit ? '💾 I-save ang Pagbabago' : '✅ Idagdag ang Suki'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()

  if (!toast) return null

  const colors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center animate-slide-up">
      <div className={`${colors[toast.type] || colors.info} text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-600 max-w-sm w-full text-center`}>
        {toast.message}
      </div>
    </div>
  )
}

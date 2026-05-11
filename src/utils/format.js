export function formatPeso(amount) {
  const num = Number(amount) || 0
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('tl-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ngayon lang'
  if (diffMins < 60) return `${diffMins} minuto ang nakalipas`
  if (diffHours < 24) return `${diffHours} oras ang nakalipas`
  if (diffDays === 1) return 'Kahapon'
  if (diffDays < 7) return `${diffDays} araw ang nakalipas`
  return formatDate(dateStr)
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

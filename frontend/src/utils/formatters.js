// Description: Utility formatters — relative time, confidence percentage, token count
// display, truncation, and source type labels.

export function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export function formatConfidence(value) {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatTokenCount(count) {
  if (!count) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

export function truncate(text, maxLen = 120) {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '...'
}

export function getSourceTypeLabel(type) {
  const labels = {
    pdf: 'PDF',
    markdown: 'Markdown',
    text: 'Text',
    url: 'URL',
  }
  return labels[type] || type || 'Unknown'
}

export function getSourceTypeIcon(type) {
  const icons = {
    pdf: 'FileText',
    markdown: 'FileCode',
    text: 'AlignLeft',
    url: 'Globe',
  }
  return icons[type] || 'File'
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return `${diff}s geleden`
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`
  return `${Math.floor(diff / 86400)} dagen geleden`
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    fire: 'Brandweer',
    ambulance: 'Ambulance',
    police: 'Politie',
    traumaheli: 'Traumaheli',
    rescue: 'Reddingsdienst',
    traffic: 'Verkeer',
    other: 'Overig',
  }
  return labels[category] ?? 'Overig'
}

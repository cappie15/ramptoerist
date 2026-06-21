import { useState, useEffect, useCallback } from 'react'
import type { Incident } from '../types'

interface UseIncidentsResult {
  incidents: Incident[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useIncidents(searchQuery?: string): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const url = searchQuery
        ? `/api/search?q=${encodeURIComponent(searchQuery)}`
        : '/api/incidents'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setIncidents(searchQuery ? data.incidents : data)
    } catch (err) {
      setError('Kon incidenten niet laden')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchIncidents()

    if (searchQuery) {
      // Search results don't benefit from SSE push; keep a light polling interval
      const interval = setInterval(() => fetchIncidents(true), 30_000)
      return () => clearInterval(interval)
    }

    // Main feed: subscribe to server-sent events for instant updates
    const es = new EventSource('/api/incidents/stream')
    es.addEventListener('refresh', () => fetchIncidents(true))

    // Fallback poll in case the SSE connection stays broken for a full minute
    const fallback = setInterval(() => fetchIncidents(true), 60_000)

    return () => {
      es.close()
      clearInterval(fallback)
    }
  }, [fetchIncidents, searchQuery])

  return { incidents, loading, error, refetch: fetchIncidents }
}

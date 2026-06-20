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

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
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
    const interval = setInterval(fetchIncidents, 30000)
    return () => clearInterval(interval)
  }, [fetchIncidents])

  return { incidents, loading, error, refetch: fetchIncidents }
}

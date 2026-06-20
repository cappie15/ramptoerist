import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Incident } from '../types'
import { IncidentDetail } from '../components/IncidentDetail'

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/incidents/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(setIncident)
      .catch(() => setError('Incident niet gevonden'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        Laden…
      </div>
    )
  }
  if (error || !incident) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: '#e53e3e',
          background: '#fff5f5',
          borderRadius: '12px',
          margin: '16px',
        }}
      >
        {error ?? 'Incident niet gevonden'}
      </div>
    )
  }

  return <IncidentDetail incident={incident} />
}

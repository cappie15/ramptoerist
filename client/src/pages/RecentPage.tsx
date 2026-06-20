import { useState } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import { IncidentList } from '../components/IncidentList'
import { SearchBar } from '../components/SearchBar'

export function RecentPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { incidents, loading, error } = useIncidents(searchQuery || undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SearchBar onSearch={setSearchQuery} value={searchQuery} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <IncidentList
          incidents={incidents}
          loading={loading}
          error={error}
          emptyMessage={searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Geen incidenten'}
        />
      </div>
    </div>
  )
}

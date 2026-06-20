import { useState } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import { IncidentList } from '../components/IncidentList'
import { SearchBar } from '../components/SearchBar'
import { TimeFilter } from '../components/TimeFilter'
import { filterByTime, type TimeRange } from '../utils/filters'

export function RecentPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('2h')
  const { incidents, loading, error } = useIncidents(searchQuery || undefined)
  const filtered = filterByTime(incidents, timeRange)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SearchBar onSearch={setSearchQuery} value={searchQuery} />
      <TimeFilter value={timeRange} onChange={setTimeRange} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <IncidentList
          incidents={filtered}
          loading={loading}
          error={error}
          emptyMessage={searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Geen incidenten'}
        />
      </div>
    </div>
  )
}

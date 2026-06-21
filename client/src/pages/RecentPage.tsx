import { useState } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import { IncidentList } from '../components/IncidentList'
import { SearchBar } from '../components/SearchBar'
import { TimeFilter } from '../components/TimeFilter'
import { IncidentFilters } from '../components/IncidentFilters'
import { filterByTime, filterByCategory, filterByPriority, type TimeRange, type CategoryFilter, type PriorityFilter } from '../utils/filters'

export function RecentPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<TimeRange>('2h')
  const [catFilter, setCatFilter] = useState<CategoryFilter>(new Set())
  const [prioFilter, setPriorityFilter] = useState<PriorityFilter>(new Set())
  const { incidents, loading, error } = useIncidents(searchQuery || undefined)
  const filtered = filterByPriority(filterByCategory(filterByTime(incidents, timeRange), catFilter), prioFilter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SearchBar onSearch={setSearchQuery} value={searchQuery} />
      <TimeFilter value={timeRange} onChange={setTimeRange} />
      <IncidentFilters categories={catFilter} priorities={prioFilter} onCategoryChange={setCatFilter} onPriorityChange={setPriorityFilter} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <IncidentList incidents={filtered} loading={loading} error={error} emptyMessage={searchQuery ? `Geen resultaten voor "${searchQuery}"` : 'Geen incidenten'} />
      </div>
    </div>
  )
}

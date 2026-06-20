import { describe, it, expect } from 'vitest'
import { normalizeText } from '../normalizer'

function search(incidents: Array<{ title: string; city: string; category: string }>, query: string) {
  const words = normalizeText(query).split(' ').filter(Boolean)
  return incidents.filter((inc) => {
    const searchable = normalizeText([inc.title, inc.city, inc.category].join(' '))
    return words.every((word) => searchable.includes(word))
  })
}

const INCIDENTS = [
  { title: 'Woningbrand', city: 'Leiden', category: 'fire' },
  { title: 'Reanimatie', city: 'Amsterdam', category: 'ambulance' },
  { title: 'Verkeersongeval', city: 'Rotterdam', category: 'traffic' },
  { title: 'Traumaheli', city: 'Utrecht', category: 'traumaheli' },
  { title: 'Woningbrand', city: 'Amsterdam', category: 'fire' },
]

describe('search', () => {
  it('returns all incidents for empty query (empty words array matches all)', () => {
    expect(search(INCIDENTS, '')).toHaveLength(INCIDENTS.length)
  })

  it('finds by city', () => {
    const result = search(INCIDENTS, 'Leiden')
    expect(result).toHaveLength(1)
    expect(result[0].city).toBe('Leiden')
  })

  it('finds by category', () => {
    const result = search(INCIDENTS, 'fire')
    expect(result).toHaveLength(2)
  })

  it('finds by title keyword', () => {
    const result = search(INCIDENTS, 'woningbrand')
    expect(result).toHaveLength(2)
  })

  it('combines multiple terms', () => {
    const result = search(INCIDENTS, 'woningbrand amsterdam')
    expect(result).toHaveLength(1)
    expect(result[0].city).toBe('Amsterdam')
  })

  it('is case insensitive', () => {
    const result = search(INCIDENTS, 'LEIDEN')
    expect(result).toHaveLength(1)
  })

  it('returns empty for non-matching query', () => {
    const result = search(INCIDENTS, 'groningen')
    expect(result).toHaveLength(0)
  })
})

import { describe, it, expect } from 'vitest'
import { normalizeText, normalizeMessage } from '../normalizer'
import type { RawSourceMessage } from '../types'

describe('normalizeMessage', () => {
  const raw: RawSourceMessage = {
    id: 'test-1',
    sourceName: 'p2000.net',
    sourceUrl: 'https://p2000.net/1',
    externalId: 'ext-1',
    rawTitle: '  Woningbrand  ',
    rawMessage: 'Brand in woning, rook zichtbaar',
    receivedAt: new Date().toISOString(),
    locationText: 'Bloemstraat 12, Leiden',
    category: 'fire',
    priority: 'prio1',
    metadata: { city: 'Leiden', street: 'Bloemstraat 12', lat: 52.1601, lng: 4.4970 },
  }

  it('trims title and message', () => {
    const normalized = normalizeMessage(raw)
    expect(normalized.title).toBe('Woningbrand')
    expect(normalized.message).toBe('Brand in woning, rook zichtbaar')
  })

  it('extracts city from metadata', () => {
    const normalized = normalizeMessage(raw)
    expect(normalized.city).toBe('Leiden')
  })

  it('extracts coordinates from metadata', () => {
    const normalized = normalizeMessage(raw)
    expect(normalized.lat).toBeCloseTo(52.1601)
    expect(normalized.lng).toBeCloseTo(4.4970)
  })

  it('falls back to extracting city from locationText when not in metadata', () => {
    const rawNoMeta = { ...raw, metadata: {} }
    const normalized = normalizeMessage(rawNoMeta)
    expect(normalized.city).toBe('Leiden')
  })
})

describe('normalizeText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeText('Brand, Leiden!')).toBe('brand leiden')
  })
})

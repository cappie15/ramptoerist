import { describe, it, expect } from 'vitest'
import { normalizeText } from '../normalizer'

describe('normalizeText', () => {
  it('lowercases text', () => {
    expect(normalizeText('Woningbrand')).toBe('woningbrand')
  })
  it('removes punctuation', () => {
    expect(normalizeText('Brand, Leiden.')).toBe('brand leiden')
  })
  it('collapses whitespace', () => {
    expect(normalizeText('brand   in   woning')).toBe('brand in woning')
  })
})

describe('text similarity for deduplication', () => {
  function similarity(a: string, b: string): number {
    const na = normalizeText(a).split(' ').filter(Boolean)
    const nb = normalizeText(b).split(' ').filter(Boolean)
    const setA = new Set(na)
    const setB = new Set(nb)
    const intersection = new Set([...setA].filter(w => setB.has(w)))
    const union = new Set([...setA, ...setB])
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  it('returns 1.0 for identical texts', () => {
    expect(similarity('Woningbrand Leiden', 'Woningbrand Leiden')).toBe(1.0)
  })

  it('returns high similarity for near-duplicates', () => {
    const sim = similarity('Brand in woning Bloemstraat Leiden', 'Uitslaande woningbrand Bloemstraat Leiden')
    expect(sim).toBeGreaterThan(0.3)
  })

  it('returns low similarity for different incidents', () => {
    const sim = similarity('Brand Leiden centrum', 'Reanimatie Rotterdam haven')
    expect(sim).toBeLessThan(0.3)
  })
})

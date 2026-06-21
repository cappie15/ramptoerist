import type { RawSourceMessage, NormalizedMessage, Category } from '../types'

function inferCategory(text: string): Category {
  const lower = text.toLowerCase()
  if (lower.includes('brand') || lower.includes('brandweer') || lower.includes('gaslek')) return 'fire'
  if (lower.includes('ambulance') || lower.includes('reanimatie') || lower.includes('letsel')) return 'ambulance'
  if (lower.includes('politie') || lower.includes('politieassistentie')) return 'police'
  if (lower.includes('trauma') || lower.includes('heli')) return 'traumaheli'
  if (lower.includes('knrm') || lower.includes('reddingsdienst') || lower.includes('water')) return 'rescue'
  if (lower.includes('verkeer') || lower.includes('aanrijding') || lower.includes('snelweg')) return 'traffic'
  return 'other'
}

export function normalizeMessage(raw: RawSourceMessage): NormalizedMessage {
  const meta = raw.metadata as Record<string, unknown>
  return {
    externalId: raw.externalId,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    title: raw.rawTitle.trim(),
    message: raw.rawMessage.trim(),
    receivedAt: new Date(raw.receivedAt),
    locationText: raw.locationText.trim(),
    city: (meta.city as string | undefined) ?? extractCity(raw.locationText),
    street: (meta.street as string | undefined) ?? extractStreet(raw.locationText),
    category: raw.category ?? inferCategory(raw.rawTitle + ' ' + raw.rawMessage),
    priority: raw.priority ?? 'prio2',
    lat: (meta.lat as number | undefined) ?? null,
    lng: (meta.lng as number | undefined) ?? null,
    imageUrl: (meta.imageUrl as string | undefined) ?? null,
    metadata: raw.metadata,
  }
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractCity(locationText: string): string {
  const parts = locationText.split(',')
  return parts[parts.length - 1].trim()
}

function extractStreet(locationText: string): string {
  const parts = locationText.split(',')
  if (parts.length > 1) return parts[0].trim()
  return ''
}

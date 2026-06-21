import type { Category, Priority } from '../types'

export interface RssItem {
  title: string
  description: string
  link: string
  pubDate: string
  guid: string
  imageUrl?: string
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`, 'i'
  ).exec(xml)
  if (cdataMatch) return cdataMatch[1].trim()

  const plainMatch = new RegExp(`<${tag}[^>]*>([^<]*)<`, 'i').exec(xml)
  if (plainMatch) return plainMatch[1].trim()
  return ''
}

function extractImageUrl(raw: string): string | undefined {
  // media:content url="..."
  const mediaContent = /media:content[^>]+url=["']([^"']+)["']/i.exec(raw)
  if (mediaContent) return mediaContent[1]
  // media:thumbnail url="..."
  const mediaThumbnail = /media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(raw)
  if (mediaThumbnail) return mediaThumbnail[1]
  // <enclosure type="image/..." url="..." />
  const enclosure = /<enclosure[^>]+type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']/i.exec(raw)
    ?? /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i.exec(raw)
  if (enclosure) return enclosure[1]
  return undefined
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null
  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[1]
    const imageUrl = extractImageUrl(raw)
    items.push({
      title: extractTag(raw, 'title'),
      description: extractTag(raw, 'description'),
      link: extractTag(raw, 'link'),
      pubDate: extractTag(raw, 'pubDate'),
      guid: extractTag(raw, 'guid'),
      ...(imageUrl ? { imageUrl } : {}),
    })
  }
  return items
}

export function inferPriority(text: string): Priority {
  const u = text.toUpperCase()
  if (/P[\s_]?1\b|PRIO[\s_]?1\b|\bA1\b|LIFELINER\d|PRIO1/.test(u)) return 'prio1'
  if (/P[\s_]?3\b|PRIO[\s_]?3\b|\bB[23]\b|PRIO3/.test(u)) return 'prio3'
  return 'prio2'
}

export function inferCategory(text: string): Category {
  const u = text.toUpperCase()
  if (/\bTRAUMAHELI\b|\bLIFELINER\b|\bMMT\b/.test(u)) return 'traumaheli'
  if (/\bBRAND\b|\bGASLEK\b|\bROOKMELDING\b|\bSTOOMWOLK\b/.test(u)) return 'fire'
  if (/\bKNRM\b|\bWATERRED\b|\bDRENKELING\b/.test(u)) return 'rescue'
  if (/\bAMBU\b|\bAMBULANCE\b|\bMEDISCH\b|\bLETSEL\b|\bREANI\b|\bHMK\b/.test(u)) return 'ambulance'
  if (/\bPOLITIE\b|\bPOLAS\b/.test(u)) return 'police'
  if (/\bOAV\b|\bVHR\b|\bSNELWEG\b|\bRIJKSWEG\b/.test(u)) return 'traffic'
  return 'other'
}

// Strip P2000 type/priority prefixes from text to extract location
export function stripP2000Prefixes(text: string): string {
  return text
    .replace(/\bPRIO[\s_]?[123]\b/gi, '')
    .replace(/\bP[\s_]?[123]\b/gi, '')
    .replace(/\bA[123]\b/gi, '')
    .replace(/\bB[123]\b/gi, '')
    .replace(/\bBRAND\b/gi, '')
    .replace(/\bAMBULANCE\b/gi, '')
    .replace(/\bAMBU\b/gi, '')
    .replace(/\bPOLITIE\b/gi, '')
    .replace(/\bTRAUMAHELI\b/gi, '')
    .replace(/\bKNRM\b/gi, '')
    .replace(/\bLIFELINER\d*/gi, '')
    .replace(/[-–]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '')
}

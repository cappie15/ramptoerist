import { db } from '../db/database'
import { normalizeMessage } from '../normalizer'
import { findOrCreateIncident } from '../deduplicator'
import { enrichWithGeocoderFallback } from '../geocoder'
import { NominatimGeocoder } from '../geocoder/NominatimGeocoder'
import { enrichIncidentImages } from './ImageScraper'
import type { RawSourceMessage } from '../types'

export interface IngestResult {
  created: number
  merged: number
  skipped: number
}

export class IngestionService {
  private seenSourceUrls: Set<string>
  private geocoder: NominatimGeocoder

  constructor() {
    const rows = db
      .prepare('SELECT DISTINCT source_url FROM incident_sources')
      .all() as { source_url: string }[]
    this.seenSourceUrls = new Set(rows.map((r) => r.source_url))
    this.geocoder = new NominatimGeocoder()
    console.log(`[IngestionService] Loaded ${this.seenSourceUrls.size} seen source URLs from DB`)
  }

  async ingest(messages: RawSourceMessage[]): Promise<IngestResult> {
    let created = 0, merged = 0, skipped = 0
    const newIncidentIds: string[] = []

    for (const raw of messages) {
      if (this.seenSourceUrls.has(raw.sourceUrl)) {
        skipped++
        continue
      }

      let normalized = normalizeMessage(raw)

      if (normalized.lat === null || normalized.lng === null) {
        normalized = await enrichWithGeocoderFallback(normalized, this.geocoder)
      }

      const countBefore = (
        db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }
      ).c
      const incidentId = findOrCreateIncident(normalized)
      const countAfter = (
        db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }
      ).c

      this.seenSourceUrls.add(raw.sourceUrl)
      if (countAfter > countBefore) {
        created++
        if (normalized.imageUrl === null && raw.sourceUrl.includes('alarmeringen.nl')) {
          newIncidentIds.push(incidentId)
        }
      } else {
        merged++
      }
    }

    // Scrape og:image in background — don't await, non-blocking
    if (newIncidentIds.length > 0) {
      enrichIncidentImages(newIncidentIds).catch(() => {})
    }

    return { created, merged, skipped }
  }

  getSeenCount(): number {
    return this.seenSourceUrls.size
  }
}

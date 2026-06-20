import { db } from '../db/database'
import { v4 as uuid } from 'uuid'
import type { NormalizedMessage, Incident } from '../types'
import { normalizeText } from '../normalizer'

const DEDUP_WINDOW_MS = 30 * 60 * 1000

function textSimilarity(a: string, b: string): number {
  const na = normalizeText(a)
  const nb = normalizeText(b)
  if (na === nb) return 1.0
  const wordsA = new Set(na.split(' ').filter(Boolean))
  const wordsB = new Set(nb.split(' ').filter(Boolean))
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

export function findOrCreateIncident(msg: NormalizedMessage): string {
  const windowStart = new Date(msg.receivedAt.getTime() - DEDUP_WINDOW_MS).toISOString()

  const candidates = db
    .prepare(
      `SELECT * FROM incidents
       WHERE city = ? AND category = ? AND first_seen_at >= ?
       ORDER BY first_seen_at DESC LIMIT 10`
    )
    .all(msg.city, msg.category, windowStart) as Incident[]

  for (const candidate of candidates) {
    const sim = textSimilarity(candidate.locationText, msg.locationText)
    if (sim >= 0.4) {
      db.prepare(
        `UPDATE incidents SET
          last_seen_at = ?,
          source_count = source_count + 1,
          updated_at = datetime('now')
         WHERE id = ?`
      ).run(msg.receivedAt.toISOString(), candidate.id)

      db.prepare(
        `INSERT OR IGNORE INTO incident_sources
         (id, incident_id, source_name, source_url, raw_message, received_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(uuid(), candidate.id, msg.sourceName, msg.sourceUrl, msg.message, msg.receivedAt.toISOString())

      return candidate.id
    }
  }

  const incidentId = uuid()
  const meta = msg.metadata as Record<string, unknown>
  db.prepare(
    `INSERT INTO incidents
     (id, title, summary, category, priority, first_seen_at, last_seen_at, location_text, city, street, lat, lng, source_count, reportage_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    incidentId,
    msg.title,
    msg.message,
    msg.category,
    msg.priority,
    msg.receivedAt.toISOString(),
    msg.receivedAt.toISOString(),
    msg.locationText,
    msg.city,
    msg.street,
    msg.lat,
    msg.lng,
    (meta.reportageUrl as string | null) ?? null
  )

  db.prepare(
    `INSERT INTO incident_sources
     (id, incident_id, source_name, source_url, raw_message, received_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(uuid(), incidentId, msg.sourceName, msg.sourceUrl, msg.message, msg.receivedAt.toISOString())

  return incidentId
}

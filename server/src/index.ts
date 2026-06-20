import express from 'express'
import cors from 'cors'
import { db } from './db/database'
import { incidentRouter } from './routes/incidents'
import { vehicleRouter } from './routes/vehicles'
import { MockConnector } from './connectors/MockConnector'
import { normalizeMessage, normalizeText } from './normalizer'
import { findOrCreateIncident } from './deduplicator'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

function mapIncident(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    priority: row.priority,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    locationText: row.location_text,
    city: row.city,
    street: row.street,
    lat: row.lat,
    lng: row.lng,
    sourceCount: row.source_count,
    reportageUrl: row.reportage_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

app.get('/api/search', (req, res) => {
  const q = (req.query.q as string | undefined) ?? ''
  if (!q.trim()) {
    const rows = db.prepare('SELECT * FROM incidents ORDER BY first_seen_at DESC LIMIT 100').all() as Record<string, unknown>[]
    return res.json({ incidents: rows.map(mapIncident), total: rows.length })
  }
  const words = normalizeText(q).split(' ').filter(Boolean)
  const allIncidents = db.prepare('SELECT * FROM incidents ORDER BY first_seen_at DESC').all() as Record<string, unknown>[]
  const matched = allIncidents.filter((row) => {
    const searchable = normalizeText(
      [row.title, row.summary, row.city, row.street, row.location_text, row.category].join(' ')
    )
    return words.every((word) => searchable.includes(word))
  })
  return res.json({ incidents: matched.map(mapIncident), total: matched.length })
})

app.use('/api/incidents', incidentRouter)
app.use('/api/vehicles', vehicleRouter)

app.get('/api/sources', (_req, res) => {
  res.json([
    { name: 'p2000.net', enabled: true, type: 'mock' },
    { name: 'p2000m.nl', enabled: true, type: 'mock' },
    { name: 'alarmeringen.nl', enabled: true, type: 'mock' },
    { name: 'dashpatch', enabled: false, type: 'mock' },
    { name: '1120.nl', enabled: false, type: 'mock' },
  ])
})

app.post('/api/ingest/mock', async (_req, res) => {
  const connector = new MockConnector()
  const messages = await connector.fetch()
  let created = 0
  let merged = 0

  const countBefore = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c

  for (const raw of messages) {
    const normalized = normalizeMessage(raw)
    const prevCount = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
    findOrCreateIncident(normalized)
    const afterCount = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
    if (afterCount > prevCount) created++
    else merged++
  }

  const total = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
  res.json({ created, merged, total, countBefore })
})

app.listen(PORT, () => {
  console.log(`[Server] Ramptoerist API running on http://localhost:${PORT}`)
})

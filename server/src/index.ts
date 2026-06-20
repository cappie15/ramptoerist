import express from 'express'
import cors from 'cors'
import { db } from './db/database'
import { incidentRouter } from './routes/incidents'
import { vehicleRouter } from './routes/vehicles'
import { MockConnector } from './connectors/MockConnector'
import { normalizeMessage, normalizeText } from './normalizer'
import { findOrCreateIncident } from './deduplicator'
import { IngestionService } from './services/IngestionService'
import { startScheduler, getSchedulerStatus } from './scheduler'

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
    const rows = db
      .prepare('SELECT * FROM incidents ORDER BY first_seen_at DESC LIMIT 100')
      .all() as Record<string, unknown>[]
    return res.json({ incidents: rows.map(mapIncident), total: rows.length })
  }
  const words = normalizeText(q).split(' ').filter(Boolean)
  const allIncidents = db
    .prepare('SELECT * FROM incidents ORDER BY first_seen_at DESC')
    .all() as Record<string, unknown>[]
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
  const schedulerSt = getSchedulerStatus()
  const realData = schedulerSt.realData

  const sources = realData
    ? schedulerSt.sources.map((s) => ({
        name: s.name,
        enabled: true,
        type: 'rss',
        lastFetchedAt: s.lastFetchedAt,
        lastCount: s.lastCount,
      }))
    : [
        { name: 'p2000-online.net', enabled: false, type: 'rss', lastFetchedAt: null, lastCount: 0 },
        { name: 'alarmeringen.nl', enabled: false, type: 'rss', lastFetchedAt: null, lastCount: 0 },
        { name: 'mock', enabled: true, type: 'mock', lastFetchedAt: null, lastCount: 0 },
      ]

  res.json(sources)
})

app.get('/api/ingest/status', (_req, res) => {
  const s = getSchedulerStatus()
  const incidentCount = (
    db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }
  ).c
  const sourceCount = (
    db.prepare('SELECT COUNT(*) as c FROM incident_sources').get() as { c: number }
  ).c
  res.json({
    ...s,
    incidentCount,
    sourceMessageCount: sourceCount,
  })
})

// Ingest mock data on demand (useful during development / seeding)
const ingestionService = new IngestionService()

app.post('/api/ingest/mock', async (_req, res) => {
  const connector = new MockConnector()
  const messages = await connector.fetch()
  const result = await ingestionService.ingest(messages)
  const total = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
  res.json({ ...result, total })
})

// Trigger a single real-data fetch cycle on demand (handy for testing)
app.post('/api/ingest/now', async (_req, res) => {
  if (process.env.REAL_DATA !== 'true') {
    return res.status(400).json({ error: 'Set REAL_DATA=true to use real connectors' })
  }
  const { P2000RssConnector } = await import('./connectors/P2000RssConnector')
  const { AlarmeringenConnector } = await import('./connectors/AlarmeringenConnector')

  const connectors = [new P2000RssConnector(), new AlarmeringenConnector()]
  const results: Record<string, unknown> = {}

  for (const c of connectors) {
    try {
      const messages = await c.fetch()
      const result = await ingestionService.ingest(messages)
      results[c.name] = { fetched: messages.length, ...result }
    } catch (err) {
      results[c.name] = { error: err instanceof Error ? err.message : String(err) }
    }
  }

  const total = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
  res.json({ results, total })
})

startScheduler()

app.listen(PORT, () => {
  const mode = process.env.REAL_DATA === 'true' ? 'REAL DATA' : 'mock data'
  console.log(`[Server] Ramptoerist API running on http://localhost:${PORT} [${mode}]`)
})

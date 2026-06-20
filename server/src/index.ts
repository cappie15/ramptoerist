import path from 'path'
import fs from 'fs'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { db } from './db/database'
import { incidentRouter } from './routes/incidents'
import { vehicleRouter } from './routes/vehicles'
import { normalizeMessage, normalizeText } from './normalizer'
import { findOrCreateIncident } from './deduplicator'
import { IngestionService } from './services/IngestionService'
import { startScheduler, getSchedulerStatus } from './scheduler'

const app = express()
const PORT = process.env.PORT ?? 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ── Security headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow map tiles from external origins
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
  })
)

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigin = process.env.ALLOWED_ORIGIN
app.use(
  cors({
    origin: allowedOrigin ?? true,
    methods: ['GET'],
  })
)

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Te veel verzoeken, probeer het later opnieuw.' },
  })
)

app.use(express.json())

// ── Static frontend (production only) ────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '../../public')
if (IS_PROD && fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, { maxAge: '1h' }))
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── API routes ────────────────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const q = (req.query.q as string | undefined) ?? ''
  if (!q.trim()) {
    const rows = db
      .prepare('SELECT * FROM incidents ORDER BY first_seen_at DESC LIMIT 100')
      .all() as Record<string, unknown>[]
    return res.json({ incidents: rows.map(mapIncident), total: rows.length })
  }
  const words = normalizeText(q).split(' ').filter(Boolean)
  const all = db
    .prepare('SELECT * FROM incidents ORDER BY first_seen_at DESC')
    .all() as Record<string, unknown>[]
  const matched = all.filter((row) => {
    const text = normalizeText(
      [row.title, row.summary, row.city, row.street, row.location_text, row.category].join(' ')
    )
    return words.every((w) => text.includes(w))
  })
  return res.json({ incidents: matched.map(mapIncident), total: matched.length })
})

app.use('/api/incidents', incidentRouter)
app.use('/api/vehicles', vehicleRouter)

app.get('/api/sources', (_req, res) => {
  const s = getSchedulerStatus()
  res.json(
    s.realData
      ? s.sources.map((src) => ({
          name: src.name,
          enabled: true,
          type: 'rss',
          lastFetchedAt: src.lastFetchedAt,
          lastCount: src.lastCount,
        }))
      : [
          { name: 'p2000-online.net', enabled: false, type: 'rss' },
          { name: 'alarmeringen.nl', enabled: false, type: 'rss' },
          { name: 'mock', enabled: true, type: 'mock' },
        ]
  )
})

app.get('/api/ingest/status', (_req, res) => {
  const s = getSchedulerStatus()
  const incidentCount = (
    db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }
  ).c
  const sourceCount = (
    db.prepare('SELECT COUNT(*) as c FROM incident_sources').get() as { c: number }
  ).c
  res.json({ ...s, incidentCount, sourceMessageCount: sourceCount })
})

// Mock ingest — development only
if (!IS_PROD) {
  const { MockConnector } = require('./connectors/MockConnector')
  const svc = new IngestionService()
  app.post('/api/ingest/mock', async (_req, res) => {
    const msgs = await new MockConnector().fetch()
    const result = await svc.ingest(msgs)
    const total = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
    res.json({ ...result, total })
  })
}

// ── SPA fallback (production) ────────────────────────────────────────────────
if (IS_PROD && fs.existsSync(PUBLIC_DIR)) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'))
  })
}

// ── Start ────────────────────────────────────────────────────────────────────
startScheduler()

app.listen(PORT, () => {
  const mode = process.env.REAL_DATA === 'true' ? 'LIVE P2000' : 'mock data'
  console.log(`[Server] Ramptoerist op http://localhost:${PORT} [${mode}${IS_PROD ? ', prod' : ', dev'}]`)
})

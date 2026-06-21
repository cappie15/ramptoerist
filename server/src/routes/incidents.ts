import { Router } from 'express'
import { db } from '../db/database'
import { incidentEmitter, INCIDENT_UPDATED } from '../events'
import type { Incident, IncidentSource } from '../types'

export const incidentRouter = Router()

function mapIncident(row: Record<string, unknown>): Incident {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    category: row.category as Incident['category'],
    priority: row.priority as Incident['priority'],
    firstSeenAt: row.first_seen_at as string,
    lastSeenAt: row.last_seen_at as string,
    locationText: row.location_text as string,
    city: row.city as string,
    street: row.street as string,
    lat: row.lat as number | null,
    lng: row.lng as number | null,
    sourceCount: row.source_count as number,
    reportageUrl: row.reportage_url as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapSource(row: Record<string, unknown>): IncidentSource {
  return {
    id: row.id as string,
    incidentId: row.incident_id as string,
    sourceName: row.source_name as string,
    sourceUrl: row.source_url as string,
    rawMessage: row.raw_message as string,
    receivedAt: row.received_at as string,
  }
}

// SSE stream — clients subscribe and receive a 'refresh' ping when new data arrives
incidentRouter.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // disable nginx proxy buffering
  res.flushHeaders()

  res.write('event: connected\ndata: {}\n\n')

  const onUpdate = (payload: { created: number; merged: number }) => {
    res.write(`event: refresh\ndata: ${JSON.stringify(payload)}\n\n`)
  }
  incidentEmitter.on(INCIDENT_UPDATED, onUpdate)

  // Heartbeat keeps the connection alive through idle proxies
  const heartbeat = setInterval(() => res.write(':\n\n'), 25_000)

  req.on('close', () => {
    incidentEmitter.off(INCIDENT_UPDATED, onUpdate)
    clearInterval(heartbeat)
  })
})

incidentRouter.get('/', (_req, res) => {
  const rows = db.prepare(
    'SELECT * FROM incidents ORDER BY first_seen_at DESC LIMIT 100'
  ).all() as Record<string, unknown>[]
  res.json(rows.map(mapIncident))
})

incidentRouter.get('/:id', (req, res) => {
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!incident) return res.status(404).json({ error: 'Not found' })

  const sources = db.prepare(
    'SELECT * FROM incident_sources WHERE incident_id = ? ORDER BY received_at ASC'
  ).all(req.params.id) as Record<string, unknown>[]

  res.json({ ...mapIncident(incident), sources: sources.map(mapSource) })
})

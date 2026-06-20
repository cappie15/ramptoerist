import './database'
import { MockConnector } from '../connectors/MockConnector'
import { normalizeMessage } from '../normalizer'
import { findOrCreateIncident } from '../deduplicator'
import { db } from './database'

async function seed() {
  console.log('[Seed] Clearing existing data…')
  db.exec('DELETE FROM incident_sources; DELETE FROM incidents; DELETE FROM raw_source_messages; DELETE FROM reportages;')

  const connector = new MockConnector()
  console.log('[Seed] Fetching mock data…')
  const messages = await connector.fetch()
  console.log(`[Seed] Processing ${messages.length} raw messages…`)

  let created = 0
  let merged = 0

  for (const raw of messages) {
    const normalized = normalizeMessage(raw)
    const countBefore = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
    findOrCreateIncident(normalized)
    const countAfter = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
    if (countAfter > countBefore) created++
    else merged++
  }

  const total = (db.prepare('SELECT COUNT(*) as c FROM incidents').get() as { c: number }).c
  const sources = (db.prepare('SELECT COUNT(*) as c FROM incident_sources').get() as { c: number }).c

  console.log(`[Seed] Done!`)
  console.log(`[Seed]   Created: ${created} incidents`)
  console.log(`[Seed]   Merged:  ${merged} duplicate messages`)
  console.log(`[Seed]   Total incidents: ${total}`)
  console.log(`[Seed]   Total source messages: ${sources}`)
}

seed().catch(console.error)

import { IngestionService } from '../services/IngestionService'
import { GenericRssConnector } from '../connectors/GenericRssConnector'
import { RSS_SOURCES } from '../connectors/sources.config'
import type { BaseConnector, ConnectorHealth } from '../connectors/BaseConnector'

const POLL_INTERVAL_MS = 30_000

export interface SourceStatus {
  name: string
  url: string
  health: ConnectorHealth
  lastFetchedAt: string | null
  lastCount: number
  consecutiveErrors: number
  backoffUntil: string | null
  lastError: string | null
}

export interface SchedulerStatus {
  running: boolean
  realData: boolean
  lastRun: string | null
  nextRun: string | null
  totalCreated: number
  totalMerged: number
  sources: SourceStatus[]
}

const status: SchedulerStatus = {
  running: false,
  realData: false,
  lastRun: null,
  nextRun: null,
  totalCreated: 0,
  totalMerged: 0,
  sources: [],
}

let ingestionService: IngestionService | null = null
let connectors: BaseConnector[] = []

export function getSchedulerStatus(): SchedulerStatus {
  // Sync live connector health into the status snapshot
  connectors.forEach((c, i) => {
    const s = status.sources[i]
    if (s) {
      s.health = c.health
      s.backoffUntil = c.backoffUntilIso
      s.lastError = c.lastError
    }
  })
  return { ...status, sources: status.sources.map((s) => ({ ...s })) }
}

export function startScheduler(): void {
  const realData = process.env.REAL_DATA === 'true'
  status.realData = realData

  ingestionService = new IngestionService()

  const enabledSources = RSS_SOURCES.filter((s) => s.enabled)
  connectors = realData ? enabledSources.map((s) => new GenericRssConnector(s)) : []

  if (!realData) {
    console.log('[Scheduler] Mock mode — set REAL_DATA=true for live P2000 feeds')
    console.log(`[Scheduler] ${RSS_SOURCES.length} bronnen geconfigureerd, ${enabledSources.length} actief`)
    status.running = true
    return
  }

  status.sources = enabledSources.map((s) => ({
    name: s.name,
    url: s.url,
    health: 'ok' as ConnectorHealth,
    lastFetchedAt: null,
    lastCount: 0,
    consecutiveErrors: 0,
    backoffUntil: null,
    lastError: null,
  }))

  console.log(`[Scheduler] Real mode — polling ${connectors.length} connectors every ${POLL_INTERVAL_MS / 1000}s`)
  status.running = true

  runCycle()
  const interval = setInterval(runCycle, POLL_INTERVAL_MS)
  status.nextRun = new Date(Date.now() + POLL_INTERVAL_MS).toISOString()

  process.on('SIGTERM', () => clearInterval(interval))
  process.on('SIGINT', () => clearInterval(interval))
}

async function runCycle(): Promise<void> {
  if (!ingestionService || connectors.length === 0) return

  status.nextRun = new Date(Date.now() + POLL_INTERVAL_MS).toISOString()

  for (let i = 0; i < connectors.length; i++) {
    const connector = connectors[i]
    if (!connector.enabled) continue

    // Circuit breaker: skip this connector while it is backing off
    if (connector.isInBackoff()) continue

    try {
      const messages = await connector.fetch()
      connector.recordSuccess()

      const s = status.sources[i]
      if (s) {
        s.lastFetchedAt = new Date().toISOString()
        s.lastCount = messages.length
        s.health = 'ok'
        s.consecutiveErrors = 0
        s.backoffUntil = null
        s.lastError = null
      }

      if (messages.length === 0) continue

      const result = await ingestionService.ingest(messages)
      status.totalCreated += result.created
      status.totalMerged += result.merged

      if (result.created > 0 || result.merged > 0) {
        console.log(
          `[Scheduler] ${connector.name}: +${result.created} new, ${result.merged} merged, ${result.skipped} skipped`
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      connector.recordError(message)

      const s = status.sources[i]
      if (s) {
        s.consecutiveErrors++
        s.health = connector.health
        s.backoffUntil = connector.backoffUntilIso
        s.lastError = message
      }

      console.warn(
        `[Scheduler] ${connector.name} fout #${s?.consecutiveErrors}: ${message}` +
          ` — volgende poging om ${connector.backoffUntilIso}`
      )
    }
  }

  status.lastRun = new Date().toISOString()
}

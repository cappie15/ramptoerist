import { IngestionService } from '../services/IngestionService'
import { GenericRssConnector } from '../connectors/GenericRssConnector'
import { RSS_SOURCES } from '../connectors/sources.config'
import type { BaseConnector } from '../connectors/BaseConnector'

const POLL_INTERVAL_MS = 30_000

export interface SchedulerStatus {
  running: boolean
  realData: boolean
  lastRun: string | null
  nextRun: string | null
  totalCreated: number
  totalMerged: number
  sources: Array<{ name: string; url: string; lastFetchedAt: string | null; lastCount: number }>
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
  return { ...status }
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
    lastFetchedAt: null,
    lastCount: 0,
  }))

  console.log(`[Scheduler] Real mode — polling ${connectors.length} connectors every ${POLL_INTERVAL_MS / 1000}s`)
  status.running = true

  runCycle()
  const interval = setInterval(runCycle, POLL_INTERVAL_MS)
  status.nextRun = new Date(Date.now() + POLL_INTERVAL_MS).toISOString()

  // Clean up on process exit
  process.on('SIGTERM', () => clearInterval(interval))
  process.on('SIGINT', () => clearInterval(interval))
}

async function runCycle(): Promise<void> {
  if (!ingestionService || connectors.length === 0) return

  status.nextRun = new Date(Date.now() + POLL_INTERVAL_MS).toISOString()

  for (let i = 0; i < connectors.length; i++) {
    const connector = connectors[i]
    if (!connector.enabled) continue
    try {
      const messages = await connector.fetch()
      const sourceStatus = status.sources[i]
      if (sourceStatus) {
        sourceStatus.lastFetchedAt = new Date().toISOString()
        sourceStatus.lastCount = messages.length
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
      console.warn(`[Scheduler] Error from ${connector.name}:`, err instanceof Error ? err.message : err)
    }
  }

  status.lastRun = new Date().toISOString()
}

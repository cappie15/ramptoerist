import { IngestionService } from '../services/IngestionService'
import { P2000RssConnector } from '../connectors/P2000RssConnector'
import { AlarmeringenConnector } from '../connectors/AlarmeringenConnector'
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
  connectors = realData
    ? [new P2000RssConnector(), new AlarmeringenConnector()]
    : []

  if (!realData) {
    console.log('[Scheduler] Mock mode — set REAL_DATA=true for live P2000 feeds')
    status.running = true
    return
  }

  status.sources = connectors.map((c) => ({
    name: c.name,
    url: (c as unknown as { config: { url: string } }).config.url,
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

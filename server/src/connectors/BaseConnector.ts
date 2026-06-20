import type { RawSourceMessage } from '../types'

export interface ConnectorConfig {
  name: string
  url: string
  enabled: boolean
  pollIntervalMs: number
}

export type ConnectorHealth = 'ok' | 'backoff' | 'error'

// Backoff per consecutive error count (ms): 2m, 5m, 15m, 30m, 30m, …
const BACKOFF_MS = [2, 5, 15, 30].map((m) => m * 60_000)

export abstract class BaseConnector {
  private consecutiveErrors = 0
  private backoffUntil: number | null = null
  private _lastError: string | null = null

  constructor(protected config: ConnectorConfig) {}

  abstract fetch(): Promise<RawSourceMessage[]>

  get name(): string { return this.config.name }
  get enabled(): boolean { return this.config.enabled }

  get health(): ConnectorHealth {
    if (this.consecutiveErrors === 0) return 'ok'
    if (this.backoffUntil && Date.now() < this.backoffUntil) return 'backoff'
    return 'error'
  }

  get lastError(): string | null { return this._lastError }
  get backoffUntilIso(): string | null {
    return this.backoffUntil ? new Date(this.backoffUntil).toISOString() : null
  }

  /** Call after a successful fetch (even if 0 items). */
  recordSuccess(): void {
    this.consecutiveErrors = 0
    this.backoffUntil = null
    this._lastError = null
  }

  /** Call after any fetch error (HTTP error, network failure, parse error). */
  recordError(message: string): void {
    this._lastError = message
    const idx = Math.min(this.consecutiveErrors, BACKOFF_MS.length - 1)
    this.backoffUntil = Date.now() + BACKOFF_MS[idx]
    this.consecutiveErrors++
  }

  /** True when the connector is within a backoff window and should be skipped. */
  isInBackoff(): boolean {
    return this.backoffUntil !== null && Date.now() < this.backoffUntil
  }
}

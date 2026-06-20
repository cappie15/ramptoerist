import type { RawSourceMessage } from '../types'

export interface ConnectorConfig {
  name: string
  url: string
  enabled: boolean
  pollIntervalMs: number
}

export abstract class BaseConnector {
  constructor(protected config: ConnectorConfig) {}

  abstract fetch(): Promise<RawSourceMessage[]>

  get name(): string {
    return this.config.name
  }

  get enabled(): boolean {
    return this.config.enabled
  }
}

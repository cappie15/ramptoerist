import { v4 as uuid } from 'uuid'
import { BaseConnector } from './BaseConnector'
import { parseRssItems, inferPriority, inferCategory, stripP2000Prefixes } from './RssParser'
import type { ConnectorConfig } from './BaseConnector'
import type { RawSourceMessage } from '../types'

export interface RssSourceConfig extends ConnectorConfig {
  /** Which RSS field contains the location text */
  locationField: 'title' | 'description'
}

export class GenericRssConnector extends BaseConnector {
  private locationField: 'title' | 'description'

  constructor(config: RssSourceConfig) {
    super(config)
    this.locationField = config.locationField
  }

  async fetch(): Promise<RawSourceMessage[]> {
    try {
      const res = await fetch(this.config.url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Ramptoerist/1.0' },
      })
      if (!res.ok) {
        console.warn(`[${this.name}] HTTP ${res.status}`)
        return []
      }
      return this.parse(await res.text())
    } catch (err) {
      console.warn(`[${this.name}] ${err instanceof Error ? err.message : err}`)
      return []
    }
  }

  private parse(xml: string): RawSourceMessage[] {
    return parseRssItems(xml).flatMap((item) => {
      const sourceUrl = item.guid || item.link
      if (!sourceUrl || (!item.title && !item.description)) return []

      const combined = `${item.title} ${item.description}`
      const locationSource = this.locationField === 'title' ? item.title : (item.description || item.title)
      const locationText = stripP2000Prefixes(locationSource)
      const receivedAt = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString()

      return [{
        id: uuid(),
        sourceName: this.name,
        sourceUrl,
        externalId: sourceUrl,
        rawTitle: item.title || locationText,
        rawMessage: item.description || item.title,
        receivedAt,
        locationText,
        category: inferCategory(combined),
        priority: inferPriority(combined),
        metadata: item.imageUrl ? { imageUrl: item.imageUrl } : {},
      } satisfies RawSourceMessage]
    })
  }
}

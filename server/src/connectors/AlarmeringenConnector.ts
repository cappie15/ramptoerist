import { v4 as uuid } from 'uuid'
import { BaseConnector } from './BaseConnector'
import { parseRssItems, inferPriority, inferCategory, stripP2000Prefixes } from './RssParser'
import type { RawSourceMessage } from '../types'

export class AlarmeringenConnector extends BaseConnector {
  constructor() {
    super({
      name: 'alarmeringen.nl',
      url: 'https://www.alarmeringen.nl/feeds/regio/nederland.rss',
      enabled: true,
      pollIntervalMs: 30_000,
    })
  }

  async fetch(): Promise<RawSourceMessage[]> {
    try {
      const res = await fetch(this.config.url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Ramptoerist/1.0' },
      })
      if (!res.ok) {
        console.warn(`[AlarmeringenConnector] HTTP ${res.status}`)
        return []
      }
      const xml = await res.text()
      return this.parse(xml)
    } catch (err) {
      console.warn(`[AlarmeringenConnector] ${err instanceof Error ? err.message : err}`)
      return []
    }
  }

  private parse(xml: string): RawSourceMessage[] {
    return parseRssItems(xml).flatMap((item) => {
      const sourceUrl = item.guid || item.link
      if (!sourceUrl || (!item.title && !item.description)) return []

      // alarmeringen.nl titles: "A1 Ambulance Utrecht Koningsweg 8" or
      // "P 1 BRAND Amsterdam Herengracht 123"
      const combined = `${item.title} ${item.description}`
      const locationText = stripP2000Prefixes(item.title)
      const receivedAt = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString()

      return [
        {
          id: uuid(),
          sourceName: this.config.name,
          sourceUrl,
          externalId: sourceUrl,
          rawTitle: item.title || locationText,
          rawMessage: item.description || item.title,
          receivedAt,
          locationText,
          category: inferCategory(combined),
          priority: inferPriority(combined),
          metadata: {},
        } satisfies RawSourceMessage,
      ]
    })
  }
}

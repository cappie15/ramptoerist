import { v4 as uuid } from 'uuid'
import { BaseConnector } from './BaseConnector'
import { parseRssItems, inferPriority, inferCategory, stripP2000Prefixes } from './RssParser'
import type { RawSourceMessage } from '../types'

export class P2000RssConnector extends BaseConnector {
  constructor() {
    super({
      name: 'p2000-online.net',
      url: 'https://www.p2000-online.net/p2000.php?Type=1&Maximaal=50&Feed=RSS',
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
        console.warn(`[P2000RssConnector] HTTP ${res.status}`)
        return []
      }
      const xml = await res.text()
      return this.parse(xml)
    } catch (err) {
      console.warn(`[P2000RssConnector] ${err instanceof Error ? err.message : err}`)
      return []
    }
  }

  private parse(xml: string): RawSourceMessage[] {
    return parseRssItems(xml).flatMap((item) => {
      const sourceUrl = item.guid || item.link
      if (!sourceUrl || (!item.title && !item.description)) return []

      const combined = `${item.title} ${item.description}`
      const locationText = stripP2000Prefixes(item.description || item.title)
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

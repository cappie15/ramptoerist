import type { RssSourceConfig } from './GenericRssConnector'

/**
 * P2000 RSS bronnen. Schakel een bron uit met enabled: false als de feed niet reageert.
 * Volgorde = prioriteit bij gelijke meldingen (hogere bronnen winnen dedup).
 */
export const RSS_SOURCES: RssSourceConfig[] = [
  // ── Verified ────────────────────────────────────────────────────────────────
  {
    name: 'p2000-online.net',
    url: 'https://www.p2000-online.net/p2000.php?Type=1&Maximaal=50&Feed=RSS',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'description',
  },
  {
    name: 'alarmeringen.nl',
    url: 'https://www.alarmeringen.nl/feeds/regio/nederland.rss',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },

  // ── Enabled ──────────────────────────────────────────────────────────────────
  {
    name: 'p2000.nl',
    url: 'https://www.p2000.nl/?pf=rss',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: '112-nederland.nl',
    url: 'https://www.112-nederland.nl/rss/',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: 'p2000m.nl',
    url: 'https://www.p2000m.nl/feed/',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: 'incident.nu',
    url: 'https://www.incident.nu/feed/',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: 'zwaailicht.nu',
    url: 'https://zwaailicht.nu/feed/meldingen.xml',
    enabled: true,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },

  // ── Uitgeschakeld — niet bereikbaar (ECONNREFUSED / site offline) ─────────
  {
    name: 'calamiteiten.net',
    url: 'https://www.calamiteiten.net/rss/',
    enabled: false,
    pollIntervalMs: 30_000,
    locationField: 'description',
  },
  {
    name: 'meldpunt112.nl',
    url: 'https://www.meldpunt112.nl/rss/',
    enabled: false,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: 'p2000-live.nl',
    url: 'https://www.p2000-live.nl/rss/',
    enabled: false,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: 'regio-alarm.nl',
    url: 'https://www.regio-alarm.nl/rss/',
    enabled: false,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
]

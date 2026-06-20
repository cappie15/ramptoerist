import type { RssSourceConfig } from './GenericRssConnector'

/**
 * P2000 RSS bronnen. Zet enabled: true zodra de URL geverifieerd is.
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

  // ── Pending verification — zet enabled: true na handmatig testen ────────────
  {
    name: 'p2000.nl',
    url: 'https://www.p2000.nl/?pf=rss',
    enabled: false,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
  {
    name: '112-nederland.nl',
    url: 'https://www.112-nederland.nl/rss/',
    enabled: false,
    pollIntervalMs: 30_000,
    locationField: 'title',
  },
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
    name: 'p2000m.nl',
    url: 'https://www.p2000m.nl/feed/',
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
    name: 'incident.nu',
    url: 'https://www.incident.nu/feed/',
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

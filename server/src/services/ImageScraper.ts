import { db } from '../db/database'

const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
const OG_IMAGE_RE2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Ramptoerist/1.0', 'Accept': 'text/html' },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    // Read first 16 KB only
    const reader = res.body?.getReader()
    if (!reader) return null
    let chunk = ''
    let done = false
    while (!done && chunk.length < 16384) {
      const { value, done: d } = await reader.read()
      done = d
      if (value) chunk += new TextDecoder().decode(value)
    }
    reader.cancel().catch(() => {})
    const m = OG_IMAGE_RE.exec(chunk) ?? OG_IMAGE_RE2.exec(chunk)
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

export async function enrichIncidentImages(incidentIds: string[]): Promise<void> {
  if (incidentIds.length === 0) return

  for (const id of incidentIds) {
    const row = db.prepare(
      `SELECT i.id, i.image_url, s.source_url
       FROM incidents i
       JOIN incident_sources s ON s.incident_id = i.id
       WHERE i.id = ? AND i.image_url IS NULL AND s.source_url LIKE '%alarmeringen.nl%'
       LIMIT 1`
    ).get(id) as { id: string; image_url: string | null; source_url: string } | undefined

    if (!row) continue

    const img = await fetchOgImage(row.source_url)
    if (img) {
      db.prepare('UPDATE incidents SET image_url = ? WHERE id = ?').run(img, id)
    }
  }
}

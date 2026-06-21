#!/usr/bin/env python3
"""Fetch Dutch P2000 RSS feeds and write docs/data.json for the static page.

Feed priority order: first working feed per group wins.
Each group targets the same data with different providers as fallback.
"""

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# ── Feed candidates (tried in order; first successful result is used) ─────────
# Multiple sources cover the same P2000 traffic, so deduplication on guid
# handles any overlap when several feeds succeed.
FEED_GROUPS = [
    # Group A: p2000.brandweer-berkel-enschot.nl — server-friendly, used by
    # the Home Assistant P2000 component; designed for non-browser access.
    [
        'http://p2000.brandweer-berkel-enschot.nl/homeassistant/rss.asp',
        'http://p2000.brandweer-berkel-enschot.nl/rss/default.aspx',
    ],
    # Group B: alarmeringen.nl
    [
        'https://feeds.alarmeringen.nl/feed/all',
        'https://alarmeringen.nl/feeds/all.rss',
    ],
    # Group C: p2000-online.net
    [
        'https://www.p2000-online.net/p2000.xml',
    ],
    # Group D: p2000.nl
    [
        'https://www.p2000.nl/p2000.xml',
    ],
    # Group E: 112-nu.nl (per-discipline national feeds)
    [
        'https://112-nu.nl/rss/ambulance.xml',
        'https://112-nu.nl/rss/brandweer.xml',
        'https://112-nu.nl/rss/politie.xml',
    ],
]

ATOM = 'http://www.w3.org/2005/Atom'

# Mimic feedparser / Home Assistant default User-Agent for best compatibility
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (compatible; python-feedparser/6.0; '
        '+https://github.com/kurtmckee/feedparser)'
    ),
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    'Accept-Language': 'nl,en;q=0.9',
    'Cache-Control': 'no-cache',
}


def fetch(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read()
            # Try common encodings
            for enc in ('utf-8', 'latin-1', 'utf-8-sig'):
                try:
                    text = raw.decode(enc, errors='strict')
                    break
                except (UnicodeDecodeError, ValueError):
                    pass
            else:
                text = raw.decode('utf-8', errors='replace')
            return text
    except Exception as exc:
        print(f'  FAIL {url}: {exc}', file=sys.stderr)
        return None


def parse_date(raw: str) -> datetime | None:
    raw = raw.strip()
    if not raw:
        return None
    for fmt in (
        '%a, %d %b %Y %H:%M:%S %z',
        '%Y-%m-%dT%H:%M:%S%z',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S.%f%z',
    ):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            pass
    try:
        return parsedate_to_datetime(raw)
    except Exception:
        pass
    return None


def prio(title: str) -> int:
    t = title.strip()
    # P2000 ambulance prefix: a1/a2/a3 at start of message
    m = re.match(r'^\s*a([123])\b', t, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # Standard: p1/p2/p3 word, or prio N
    m = re.search(r'\bp([123])\b', t, re.IGNORECASE) or \
        re.search(r'prio\s*([123])', t, re.IGNORECASE)
    return int(m.group(1)) if m else 0


def is_test(title: str) -> bool:
    """Filter out P2000 test transmissions."""
    return bool(re.search(r'\btest(oproep|melding|bericht|transmissie)?\b', title, re.IGNORECASE))


def parse_feed(xml_text: str) -> list[dict]:
    # Sanity: must start with XML declaration or a tag
    stripped = xml_text.strip()
    if not (stripped.startswith('<?xml') or stripped.startswith('<')):
        print('  ✗ response does not look like XML', file=sys.stderr)
        return []
    # Reject HTML responses (error pages from proxies/sites)
    if re.match(r'<!DOCTYPE\s+html', stripped[:100], re.IGNORECASE):
        print('  ✗ response is HTML (likely error page)', file=sys.stderr)
        return []

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        print(f'  ✗ XML parse error: {exc}', file=sys.stderr)
        return []

    items: list[dict] = []

    # Atom feed
    for entry in root.iter(f'{{{ATOM}}}entry'):
        title = (entry.findtext(f'{{{ATOM}}}title') or '').strip()
        link_el = entry.find(f'{{{ATOM}}}link')
        link = link_el.get('href', '') if link_el is not None else ''
        guid = (entry.findtext(f'{{{ATOM}}}id') or link or '').strip()
        raw_date = (
            entry.findtext(f'{{{ATOM}}}published')
            or entry.findtext(f'{{{ATOM}}}updated')
            or ''
        )
        date = parse_date(raw_date)
        if title and guid and date and not is_test(title):
            items.append({'title': title, 'link': link, 'guid': guid,
                          'date': date.isoformat(), 'p': prio(title)})

    # RSS feed
    for item in root.iter('item'):
        title = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or '').strip()
        guid = (item.findtext('guid') or link or '').strip()
        raw_date = (item.findtext('pubDate') or '').strip()
        date = parse_date(raw_date)
        if title and guid and date and not is_test(title):
            items.append({'title': title, 'link': link, 'guid': guid,
                          'date': date.isoformat(), 'p': prio(title)})

    return items


def try_group(urls: list[str]) -> list[dict]:
    """Try each URL in a group; return items from the first that yields results."""
    for url in urls:
        print(f'  → {url}', file=sys.stderr)
        xml = fetch(url)
        if not xml:
            continue
        items = parse_feed(xml)
        if items:
            print(f'    ✓ {len(items)} items', file=sys.stderr)
            return items
        print('    ✗ 0 items parsed', file=sys.stderr)
    return []


def main() -> None:
    seen: set[str] = set()
    all_items: list[dict] = []
    groups_ok = 0

    for i, group in enumerate(FEED_GROUPS, 1):
        print(f'[Group {i}/{len(FEED_GROUPS)}]', file=sys.stderr)
        items = try_group(group)
        if items:
            groups_ok += 1
        for item in items:
            if item['guid'] not in seen:
                seen.add(item['guid'])
                all_items.append(item)

    all_items.sort(key=lambda x: x['date'], reverse=True)

    output = {
        'fetchedAt': datetime.now(timezone.utc).isoformat(),
        'items': all_items[:300],
        'groupsOk': groups_ok,
        'totalGroups': len(FEED_GROUPS),
    }

    out_path = 'docs/data.json'
    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump(output, fh, ensure_ascii=False, separators=(',', ':'))

    print(
        f'Done: {len(all_items)} items from {groups_ok}/{len(FEED_GROUPS)} feed groups → {out_path}',
        file=sys.stderr,
    )
    # Exit non-zero if nothing was fetched, so the workflow can flag it
    if not all_items:
        sys.exit(1)


if __name__ == '__main__':
    main()

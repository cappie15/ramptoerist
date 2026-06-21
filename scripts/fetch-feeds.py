#!/usr/bin/env python3
"""Fetch Dutch P2000 RSS feeds and write docs/data.json for the static page."""

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

FEEDS = [
    'https://www.p2000-online.net/p2000.xml',
    'https://feeds.alarmeringen.nl/feed/all',
    'https://www.p2000.nl/p2000.xml',
]

ATOM = 'http://www.w3.org/2005/Atom'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; ramptoerist-bot/1.0; +https://cappie15.github.io/ramptoerist/)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
}


def fetch(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except Exception as exc:
        print(f'  FAIL {url}: {exc}', file=sys.stderr)
        return None


def parse_date(raw: str) -> datetime | None:
    raw = raw.strip()
    if not raw:
        return None
    for fmt in ('%a, %d %b %Y %H:%M:%S %z', '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%dT%H:%M:%SZ'):
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
    m = re.search(r'\bp([123])\b', title, re.IGNORECASE) or re.search(r'prio\s*([123])', title, re.IGNORECASE)
    return int(m.group(1)) if m else 0


def parse_feed(xml_text: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        print(f'  XML parse error: {exc}', file=sys.stderr)
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
        if title and guid and date:
            items.append({'title': title, 'link': link, 'guid': guid,
                          'date': date.isoformat(), 'p': prio(title)})

    # RSS feed
    for item in root.iter('item'):
        title = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or '').strip()
        guid = (item.findtext('guid') or link or '').strip()
        raw_date = (item.findtext('pubDate') or '').strip()
        date = parse_date(raw_date)
        if title and guid and date:
            items.append({'title': title, 'link': link, 'guid': guid,
                          'date': date.isoformat(), 'p': prio(title)})

    return items


def main() -> None:
    seen: set[str] = set()
    all_items: list[dict] = []

    for feed_url in FEEDS:
        print(f'Fetching {feed_url}…', file=sys.stderr)
        xml = fetch(feed_url)
        if not xml:
            continue
        feed_items = parse_feed(xml)
        print(f'  → {len(feed_items)} items', file=sys.stderr)
        for item in feed_items:
            if item['guid'] not in seen:
                seen.add(item['guid'])
                all_items.append(item)

    all_items.sort(key=lambda x: x['date'], reverse=True)

    output = {
        'fetchedAt': datetime.now(timezone.utc).isoformat(),
        'items': all_items[:300],
    }

    out_path = 'docs/data.json'
    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump(output, fh, ensure_ascii=False, separators=(',', ':'))

    print(f'Wrote {len(all_items)} items to {out_path}', file=sys.stderr)


if __name__ == '__main__':
    main()

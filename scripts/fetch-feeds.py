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
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# ── Feed candidates (tried in order; first successful result is used) ─────────
FEED_GROUPS = [
    # Group A: p2000.brandweer-berkel-enschot.nl — server-friendly
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

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (compatible; python-feedparser/6.0; '
        '+https://github.com/kurtmckee/feedparser)'
    ),
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    'Accept-Language': 'nl,en;q=0.9',
    'Cache-Control': 'no-cache',
}

# Approximate lat/lng for Dutch municipalities (for Dichtbij tab)
CITY_COORDS: dict[str, tuple[float, float]] = {
    # G4 + large cities
    'amsterdam': (52.3676, 4.9041),
    'rotterdam': (51.9244, 4.4777),
    'den-haag': (52.0705, 4.3007),
    's-gravenhage': (52.0705, 4.3007),
    'utrecht': (52.0907, 5.1214),
    'eindhoven': (51.4416, 5.4697),
    'tilburg': (51.5555, 5.0913),
    'groningen': (53.2194, 6.5665),
    'almere': (52.3508, 5.2647),
    'breda': (51.5719, 4.7683),
    'nijmegen': (51.8426, 5.8546),
    'enschede': (52.2215, 6.8937),
    'apeldoorn': (52.2112, 5.9699),
    'haarlem': (52.3874, 4.6462),
    'arnhem': (51.9851, 5.8987),
    'zaanstad': (52.4561, 4.8137),
    'amersfoort': (52.1561, 5.3878),
    'haarlemmermeer': (52.3036, 4.6852),
    'zoetermeer': (52.0574, 4.4940),
    'zwolle': (52.5168, 6.0830),
    'maastricht': (50.8514, 5.6910),
    'leiden': (52.1601, 4.4970),
    'dordrecht': (51.8133, 4.6901),
    'ede': (52.0388, 5.6659),
    'westland': (51.9987, 4.2095),
    'delft': (52.0116, 4.3571),
    'deventer': (52.2553, 6.1552),
    'sittard-geleen': (51.0019, 5.8693),
    'emmen': (52.7791, 6.9007),
    'helmond': (51.4816, 5.6616),
    'alkmaar': (52.6324, 4.7534),
    'venlo': (51.3704, 6.1724),
    'hilversum': (52.2292, 5.1797),
    'leeuwarden': (53.2012, 5.7999),
    'purmerend': (52.5031, 4.9595),
    'roosendaal': (51.5318, 4.4639),
    'spijkenisse': (51.8448, 4.3336),
    'gouda': (52.0116, 4.7069),
    'alphen-aan-den-rijn': (52.1281, 4.6577),
    'schiedam': (51.9186, 4.3960),
    'lelystad': (52.5185, 5.4714),
    'vlissingen': (51.4425, 3.5714),
    'oss': (51.7662, 5.5178),
    'hardenberg': (52.5752, 6.6145),
    'hoorn': (52.6440, 5.0609),
    'hengelo': (52.2660, 6.7928),
    'dronten': (52.5206, 5.7188),
    'zeist': (52.0898, 5.2344),
    'nieuwegein': (52.0298, 5.0861),
    'katwijk': (52.2019, 4.4044),
    'landsmeer': (52.4326, 4.9199),
    'veenendaal': (52.0265, 5.5567),
    'capelle-aan-den-ijssel': (51.9286, 4.5769),
    'kampen': (52.5536, 5.9098),
    'doetinchem': (51.9633, 6.2934),
    'terneuzen': (51.3353, 3.8302),
    'middelburg': (51.4988, 3.6136),
    'bergen-op-zoom': (51.4953, 4.2887),
    'goes': (51.5037, 3.8904),
    'roermond': (51.1942, 5.9875),
    'weert': (51.2519, 5.7062),
    'heerlen': (50.8878, 5.9797),
    'kerkrade': (50.8667, 6.0667),
    'sittard': (51.0019, 5.8693),
    'geleen': (50.9667, 5.8333),
    'valkenburg': (50.8667, 5.8333),
    'boxmeer': (51.6498, 5.9457),
    'cuijk': (51.7293, 5.8795),
    'grave': (51.7580, 5.7367),
    'veghel': (51.6162, 5.5524),
    'boxtel': (51.5980, 5.3326),
    'waalwijk': (51.6832, 5.0706),
    'heusden': (51.7389, 5.1389),
    'druten': (51.8817, 5.5996),
    'tiel': (51.8901, 5.4317),
    'geldermalsen': (51.8863, 5.2814),
    'zaltbommel': (51.8101, 5.2477),
    'wageningen': (51.9644, 5.6648),
    'barneveld': (52.1418, 5.5782),
    'harderwijk': (52.3448, 5.6225),
    'nunspeet': (52.3574, 5.7833),
    'elburg': (52.4469, 5.8368),
    'ermelo': (52.3012, 5.6224),
    'putten': (52.2582, 5.5991),
    'soest': (52.1715, 5.2927),
    'baarn': (52.2107, 5.2876),
    'hilversum': (52.2292, 5.1797),
    'naarden': (52.2956, 5.1560),
    'bussum': (52.2742, 5.1669),
    'muiden': (52.3338, 5.0740),
    'weesp': (52.3079, 5.0436),
    'diemen': (52.3396, 4.9556),
    'ouder-amstel': (52.2895, 4.9333),
    'amstelveen': (52.3069, 4.8601),
    'aalsmeer': (52.2635, 4.7614),
    'uithoorn': (52.2321, 4.8274),
    'de-ronde-venen': (52.2167, 4.8500),
    'woerden': (52.0881, 4.8831),
    'bodegraven-reeuwijk': (52.0774, 4.7431),
    'waddinxveen': (52.0408, 4.6601),
    'zuidplas': (52.0167, 4.6167),
    'krimpenerwaard': (51.9167, 4.7667),
    'krimpen-aan-den-ijssel': (51.9167, 4.5833),
    'capelle-aan-den-ijssel': (51.9333, 4.5667),
    'ridderkerk': (51.8667, 4.5833),
    'barendrecht': (51.8500, 4.5333),
    'albrandswaard': (51.8667, 4.4333),
    'nissewaard': (51.8500, 4.2833),
    'hellevoetsluis': (51.8333, 4.1333),
    'brielle': (51.9000, 4.1667),
    'voorne-putten': (51.8667, 4.2333),
    'hoeksche-waard': (51.7500, 4.5000),
    'goeree-overflakkee': (51.7833, 4.0167),
    'gorinchem': (51.8333, 4.9667),
    'vijfheerenlanden': (51.9167, 5.0000),
    'molenlanden': (51.8500, 4.9167),
    'papendrecht': (51.8333, 4.7000),
    'sliedrecht': (51.8167, 4.7667),
    'alblasserdam': (51.8667, 4.6500),
    'hendrik-ido-ambacht': (51.8500, 4.6333),
    'zwijndrecht': (51.8167, 4.6333),
    'vlaardingen': (51.9167, 4.3500),
    'maassluis': (51.9167, 4.2667),
    'midden-delfland': (52.0000, 4.2833),
    'pijnacker-nootdorp': (52.0167, 4.4000),
    'lansingerland': (51.9833, 4.5333),
    'leidschendam-voorburg': (52.0833, 4.3833),
    'wassenaar': (52.1500, 4.4000),
    'rijswijk': (52.0333, 4.3167),
    'midden-delfland': (52.0000, 4.2833),
    'monster': (52.0167, 4.1833),
    'naaldwijk': (52.0000, 4.2000),
    'de-lier': (51.9833, 4.2333),
    'schipluiden': (52.0000, 4.3167),
    'maasland': (51.9833, 4.2833),
    'wateringen': (52.0167, 4.2667),
    'nootdorp': (52.0333, 4.3833),
    'leiderdorp': (52.1500, 4.5167),
    'voorschoten': (52.1167, 4.4500),
    'wassenaar': (52.1500, 4.4000),
    'oegstgeest': (52.1667, 4.4667),
    'rijnsburg': (52.1833, 4.4500),
    'valkenburg': (52.1833, 4.4333),
    'katwijk': (52.2000, 4.4000),
    'noordwijk': (52.2333, 4.4500),
    'lisse': (52.2500, 4.5500),
    'hillegom': (52.2833, 4.5833),
    'bennebroek': (52.3000, 4.6000),
    'heemstede': (52.3500, 4.6333),
    'bloemendaal': (52.4000, 4.6167),
    'zandvoort': (52.3667, 4.5333),
    'beverwijk': (52.4833, 4.6500),
    'heemskerk': (52.5000, 4.6833),
    'castricum': (52.5500, 4.6667),
    'heiloo': (52.6000, 4.6833),
    'bergen': (52.6667, 4.7000),
    'egmond': (52.6167, 4.6333),
    'schagen': (52.7833, 4.7833),
    'hollands-kroon': (52.8333, 4.9667),
    'den-helder': (52.9500, 4.7667),
    'texel': (53.0500, 4.8000),
    'enkhuizen': (52.7000, 5.3000),
    'stede-broec': (52.6833, 5.2167),
    'koggenland': (52.6333, 5.0000),
    'medemblik': (52.7667, 5.1167),
    'opmeer': (52.7000, 4.9667),
    'alkmaar': (52.6324, 4.7534),
    'heiloo': (52.6000, 4.6833),
    'langedijk': (52.6500, 4.8000),
    'dijk-en-waard': (52.6667, 4.8500),
    'uitgeest': (52.5333, 4.7167),
    'krommenie': (52.5000, 4.7667),
    'assendelft': (52.4667, 4.7500),
    'zaandam': (52.4333, 4.8167),
    'koog-aan-de-zaan': (52.4500, 4.8167),
    'westzaan': (52.4500, 4.8000),
    'wormerland': (52.5000, 4.8833),
    'edam-volendam': (52.5000, 5.0500),
    'waterland': (52.4500, 4.9667),
    'oostzaan': (52.4333, 4.8667),
    'landsmeer': (52.4333, 4.9167),
    'amsterdam-noord': (52.4000, 4.9167),
    'amsterdam-oost': (52.3500, 5.0000),
    'amsterdam-zuidoost': (52.3167, 4.9833),
    'amsterdam-west': (52.3667, 4.8667),
    'amsterdam-centrum': (52.3676, 4.9041),
    # Friesland
    'leeuwarden': (53.2012, 5.7999),
    'sneek': (53.0319, 5.6601),
    'drachten': (53.1101, 6.0980),
    'heerenveen': (52.9594, 5.9193),
    'harlingen': (53.1753, 5.4226),
    'franeker': (53.1879, 5.5450),
    'dokkum': (53.3239, 5.9990),
    # Groningen
    'groningen': (53.2194, 6.5665),
    'hoogezand': (53.1585, 6.7669),
    'veendam': (53.1094, 6.8757),
    'stadskanaal': (52.9849, 6.9513),
    'winschoten': (53.1421, 7.0433),
    'delfzijl': (53.3341, 6.9223),
    'appingedam': (53.3229, 6.8651),
    'assen': (52.9929, 6.5618),
    # Drenthe
    'emmen': (52.7791, 6.9007),
    'hoogeveen': (52.7277, 6.4752),
    'meppel': (52.6965, 6.1937),
    'coevorden': (52.6642, 6.7472),
    'borger': (52.9181, 6.7922),
    # Overijssel
    'zwolle': (52.5168, 6.0830),
    'deventer': (52.2553, 6.1552),
    'enschede': (52.2215, 6.8937),
    'hengelo': (52.2660, 6.7928),
    'almelo': (52.3561, 6.6619),
    'oldenzaal': (52.3133, 6.9271),
    'kampen': (52.5536, 5.9098),
    'steenwijk': (52.7888, 6.1150),
    'hardenberg': (52.5752, 6.6145),
    # Gelderland
    'arnhem': (51.9851, 5.8987),
    'nijmegen': (51.8426, 5.8546),
    'apeldoorn': (52.2112, 5.9699),
    'doetinchem': (51.9633, 6.2934),
    'winterswijk': (51.9770, 6.7176),
    'zutphen': (52.1391, 6.1949),
    'lochem': (52.1619, 6.4175),
    'bronckhorst': (52.0048, 6.3491),
    'aalten': (51.9254, 6.5766),
    'ede': (52.0388, 5.6659),
    'wageningen': (51.9644, 5.6648),
    'veenendaal': (52.0265, 5.5567),
    'rhenen': (51.9621, 5.5705),
    'culemborg': (51.9492, 5.2312),
    'tiel': (51.8901, 5.4317),
    'neder-betuwe': (51.8975, 5.5433),
    'buren': (51.9095, 5.3428),
    'lingewaard': (51.8777, 5.9773),
    'overbetuwe': (51.9021, 5.8229),
    'duiven': (51.9465, 5.9973),
    'zevenaar': (51.9280, 6.0723),
    'doesburg': (52.0093, 6.1389),
    'bronckhorst': (52.0048, 6.3491),
    # Utrecht
    'utrecht': (52.0907, 5.1214),
    'amersfoort': (52.1561, 5.3878),
    'nieuwegein': (52.0298, 5.0861),
    'zeist': (52.0898, 5.2344),
    'houten': (52.0256, 5.1676),
    'ijsselstein': (52.0176, 4.9598),
    'lopik': (51.9786, 4.9467),
    'woerden': (52.0881, 4.8831),
    'montfoort': (52.0511, 4.9642),
    'oudewater': (52.0259, 4.8682),
    'stichtse-vecht': (52.2500, 5.0000),
    'de-bilt': (52.1103, 5.1860),
    'soest': (52.1715, 5.2927),
    'baarn': (52.2107, 5.2876),
    'bunschoten': (52.2465, 5.3756),
    'eemnes': (52.2670, 5.2688),
    'hilversum': (52.2292, 5.1797),
    'wijk-bij-duurstede': (51.9694, 5.3454),
    'rhenen': (51.9621, 5.5705),
    'utrechtse-heuvelrug': (52.0396, 5.3693),
    'renswoude': (52.0787, 5.5333),
    'leusden': (52.1289, 5.4259),
    'bunnik': (52.0672, 5.1943),
}


def fetch(url: str, timeout: int = 20) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as exc:
        print(f'  FAIL {url}: {exc}', file=sys.stderr)
        return None


def fetch_text(url: str, timeout: int = 20) -> str | None:
    raw = fetch(url, timeout)
    if raw is None:
        return None
    for enc in ('utf-8', 'latin-1', 'utf-8-sig'):
        try:
            return raw.decode(enc, errors='strict')
        except (UnicodeDecodeError, ValueError):
            pass
    return raw.decode('utf-8', errors='replace')


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
    m = re.match(r'^\s*a([123])\b', t, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r'\bp([123])\b', t, re.IGNORECASE) or \
        re.search(r'prio\s*([123])', t, re.IGNORECASE)
    return int(m.group(1)) if m else 0


def is_test(title: str) -> bool:
    return bool(re.search(r'\btest(oproep|melding|bericht|transmissie)?\b', title, re.IGNORECASE))


def extract_city_coords(link: str) -> tuple[float, float] | None:
    """Extract city slug from alarmeringen.nl URL and look up coordinates."""
    # URL pattern: alarmeringen.nl/{province}/{region}/{city}/{id}/...
    m = re.search(r'alarmeringen\.nl/[^/]+/[^/]+/([^/]+)/', link)
    if not m:
        return None
    slug = m.group(1).lower().strip()
    coords = CITY_COORDS.get(slug)
    if coords:
        return coords
    # Try stripping common suffixes (gemeente, stad)
    for suffix in ('-gemeente', '-stad', '-centrum'):
        if slug.endswith(suffix):
            coords = CITY_COORDS.get(slug[: -len(suffix)])
            if coords:
                return coords
    # Partial match: find any key that starts with slug or slug starts with key
    for key, val in CITY_COORDS.items():
        if slug.startswith(key) or key.startswith(slug):
            return val
    return None


def _fetch_og_image(url: str) -> str | None:
    """Fetch the og:image from an alarmeringen.nl article page."""
    try:
        req = urllib.request.Request(url, headers={**HEADERS, 'Range': 'bytes=0-16383'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            chunk = resp.read(16384).decode('utf-8', errors='replace')
        m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', chunk, re.IGNORECASE)
        if not m:
            m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', chunk, re.IGNORECASE)
        return m.group(1).strip() if m else None
    except Exception:
        return None


def enrich_with_photos(items: list[dict]) -> None:
    """Fetch og:image for the top alarmeringen.nl items (in-place)."""
    candidates = [
        (i, item) for i, item in enumerate(items)
        if 'alarmeringen.nl' in item.get('link', '') and item.get('link')
    ][:30]

    if not candidates:
        return

    print(f'  Fetching og:image for {len(candidates)} alarmeringen.nl items…', file=sys.stderr)

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(_fetch_og_image, item['link']): idx for idx, item in candidates}
        for future in as_completed(futures):
            idx = futures[future]
            img = future.result()
            if img:
                items[idx]['img'] = img


def parse_feed(xml_text: str) -> list[dict]:
    stripped = xml_text.strip()
    if not (stripped.startswith('<?xml') or stripped.startswith('<')):
        print('  ✗ response does not look like XML', file=sys.stderr)
        return []
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
            item: dict = {'title': title, 'link': link, 'guid': guid,
                          'date': date.isoformat(), 'p': prio(title)}
            coords = extract_city_coords(link)
            if coords:
                item['lat'], item['lng'] = coords
            items.append(item)

    # RSS feed
    for rss_item in root.iter('item'):
        title = (rss_item.findtext('title') or '').strip()
        link = (rss_item.findtext('link') or '').strip()
        guid = (rss_item.findtext('guid') or link or '').strip()
        raw_date = (rss_item.findtext('pubDate') or '').strip()
        date = parse_date(raw_date)
        # media:content or enclosure for images
        img = None
        for ns in ('http://search.yahoo.com/mrss/', ''):
            tag = f'{{{ns}}}content' if ns else 'media:content'
            el = rss_item.find(tag)
            if el is not None:
                img = el.get('url')
                break
        enc = rss_item.find('enclosure')
        if enc is not None and (enc.get('type', '').startswith('image')):
            img = enc.get('url')
        if title and guid and date and not is_test(title):
            item = {'title': title, 'link': link, 'guid': guid,
                    'date': date.isoformat(), 'p': prio(title)}
            coords = extract_city_coords(link)
            if coords:
                item['lat'], item['lng'] = coords
            if img:
                item['img'] = img
            items.append(item)

    return items


def try_group(urls: list[str]) -> list[dict]:
    for url in urls:
        print(f'  → {url}', file=sys.stderr)
        xml = fetch_text(url)
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

    # Enrich top items with photos from alarmeringen.nl article pages
    enrich_with_photos(all_items)

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
    if not all_items:
        sys.exit(1)


if __name__ == '__main__':
    main()

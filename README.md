# Ramptoerist 🚨

Realtime P2000 incidentenviewer voor Nederland. Toont brandweer-, ambulance- en politiemeldingen op een kaart met split-screen layout voor tablet en desktop.

## Features

- **Realtime P2000 data** — pollt p2000-online.net en alarmeringen.nl elke 30 seconden
- **Kaart** — Leaflet + OpenStreetMap met emoji-markers per categorie en hulpdienstvoertuigen
- **Dichtbij** — incidenten gesorteerd op afstand tot jouw locatie (≤ 50 km, instelbaar)
- **Deduplicatie** — Jaccard-similarity samenvoegt dubbele meldingen van meerdere bronnen
- **Geocoding** — Nominatim (OSM) vult ontbrekende coördinaten in
- **Responsive** — mobiel (tabs), tablet (split overlay), desktop (drie kolommen)
- **Docker-ready** — multi-stage build, één container serveert frontend + API

## Snel starten

### Vereisten

- Node.js 20+
- npm 10+

### Lokaal ontwikkelen

```bash
npm install
npm run seed        # vul de DB met 29 mock-incidenten
npm run dev         # start server :3001 + Vite :5173
```

Live P2000 data inschakelen:

```bash
REAL_DATA=true npm run dev
```

### Productie met Docker

```bash
git clone https://github.com/cappie15/ramptoerist.git
cd ramptoerist

# Optioneel: domein instellen voor CORS
echo "ALLOWED_ORIGIN=https://jouwdomein.nl" > .env

docker compose up -d
```

App draait op poort **3000**. Zet nginx met Let's Encrypt ervóór voor HTTPS.

## Beschikbare scripts

| Script | Omschrijving |
|---|---|
| `npm install` | Alle dependencies installeren |
| `npm run dev` | Frontend (Vite :5173) + backend (:3001) tegelijk |
| `npm run seed` | DB vullen met 29 mock-incidenten |
| `npm run build` | Frontend + backend builden voor productie |
| `npm run test` | Unit tests (deduplicatie, geocoder, normalizer) |

## Omgevingsvariabelen

| Variabele | Standaard | Omschrijving |
|---|---|---|
| `REAL_DATA` | `false` | `true` = live RSS-feeds, `false` = mock data |
| `PORT` | `3001` | Serverpoort |
| `DATA_DIR` | `server/data` | Map voor de SQLite-database |
| `ALLOWED_ORIGIN` | `*` | CORS beperken in productie |
| `NODE_ENV` | — | `production` = static serving + rate limiting aan |

Zie `.env.example` voor een sjabloon.

## API

| Methode | Pad | Omschrijving |
|---|---|---|
| `GET` | `/api/incidents` | Laatste 100 incidenten |
| `GET` | `/api/incidents/:id` | Incidentdetail + bronmeldingen |
| `GET` | `/api/search?q=` | Zoeken op tekst |
| `GET` | `/api/vehicles` | Actieve hulpdienstvoertuigen |
| `GET` | `/api/sources` | Status van databronnen |
| `GET` | `/api/ingest/status` | Scheduler-status en tellers |

## Architectuur

```
client/                    React 18 + TypeScript + Vite
  src/
    components/            IncidentCard, IncidentMap, IncidentDetail …
    hooks/                 useIncidents, useVehicles, useGeolocation, useBreakpoint
    layouts/               SplitLayout (tablet/desktop split-screen)
    pages/                 RecentPage, NearbyPage, MapPage, IncidentDetailPage

server/                    Node.js + Express + SQLite (better-sqlite3)
  src/
    connectors/            P2000RssConnector, AlarmeringenConnector, MockConnector
    deduplicator/          Jaccard-similarity, 30-minuten tijdvenster
    geocoder/              MockGeocoder + NominatimGeocoder (rate-limited, gecached)
    normalizer/            Categorie/prioriteit-inferentie uit P2000-berichten
    scheduler/             Pollt connectors elke 30s (REAL_DATA=true)
    services/              IngestionService (dedup over herstarts heen)
    routes/                incidents, vehicles
    db/                    SQLite schema + seed
```

## Databronnen

| Bron | Type | Omschrijving |
|---|---|---|
| p2000-online.net | RSS | Nationale P2000-feed |
| alarmeringen.nl | RSS | Tweede bron voor deduplicatie |
| Flitsmeister | Mock | Deterministisch gegenereerde voertuigposities |

## Nieuwe databron toevoegen

Maak een klasse die `BaseConnector` uitbreidt in `server/src/connectors/`:

```typescript
export class MijnConnector extends BaseConnector {
  constructor() {
    super({ name: 'mijnbron.nl', url: 'https://...', enabled: true, pollIntervalMs: 30_000 })
  }
  async fetch(): Promise<RawSourceMessage[]> {
    // ophalen + omzetten naar RawSourceMessage[]
  }
}
```

Voeg de connector toe in `server/src/scheduler/index.ts`.

## Tech stack

- **Frontend** — React 18, TypeScript, Vite, React Router v6, Leaflet/OpenStreetMap
- **Backend** — Node.js, Express, better-sqlite3
- **Beveiliging** — helmet (CSP), express-rate-limit, CORS-restrictie
- **Infra** — Docker multi-stage (node:20-alpine), docker compose, tini

## Licentie

MIT

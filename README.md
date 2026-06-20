# Ramptoerist - P2000 Incidenten Viewer

Realtime viewer voor P2000/112-meldingen in Nederland. Mobile-first responsive web app.

## Snel starten

### Vereisten
- Node.js 18 of hoger
- npm 8 of hoger

### Installatie

```bash
npm install
```

### Database vullen met mockdata

```bash
npm run seed
```

### Ontwikkelserver starten

```bash
npm run dev
```

Opent:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### Alleen backend

```bash
npm run dev:server
```

### Alleen frontend

```bash
npm run dev:client
```

## Beschikbare scripts

| Script | Omschrijving |
|--------|--------------|
| `npm install` | Installeer alle dependencies |
| `npm run dev` | Start frontend én backend tegelijk |
| `npm run dev:client` | Start alleen de frontend (Vite) |
| `npm run dev:server` | Start alleen de backend (Express) |
| `npm run seed` | Vul de database met mockdata |
| `npm run test` | Run unit tests |
| `npm run build` | Build frontend én backend voor productie |

## API Endpoints

| Endpoint | Methode | Omschrijving |
|----------|---------|--------------|
| `/api/incidents` | GET | Laatste 100 incidenten |
| `/api/incidents/:id` | GET | Incident detail met bronnen |
| `/api/search?q=` | GET | Vrij zoeken |
| `/api/ingest/mock` | POST | Importeer mockdata opnieuw |
| `/api/sources` | GET | Geconfigureerde bronnen |

## Architectuur

```
ramptoerist/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # UI componenten
│       ├── pages/        # Route pagina's
│       ├── hooks/        # React hooks
│       ├── utils/        # Hulpfuncties (distance, formatters)
│       └── types/        # TypeScript types
└── server/          # Node.js + Express backend
    └── src/
        ├── connectors/   # Databronnen (nu: MockConnector)
        ├── normalizer/   # Zet bronmeldingen om naar intern formaat
        ├── deduplicator/ # Samenvoegen van dubbele meldingen
        ├── geocoder/     # Coördinaten opzoeken (nu: MockGeocoder)
        ├── routes/       # API routes
        └── db/           # SQLite database + seed
```

## Echte scrapers toevoegen

Maak een nieuwe klasse die `BaseConnector` uitbreidt in `server/src/connectors/`:

```typescript
import { BaseConnector } from './BaseConnector'
import type { RawSourceMessage } from '../types'

export class P2000NetConnector extends BaseConnector {
  constructor() {
    super({ name: 'p2000.net', url: 'https://p2000.net', enabled: true, pollIntervalMs: 30000 })
  }
  async fetch(): Promise<RawSourceMessage[]> {
    // Echte scraping logica hier
  }
}
```

## Geocoder uitbreiden met PDOK

De `MockGeocoder` implementeert de `Geocoder` interface. Vervang hem met:

```typescript
export class PdokGeocoder implements Geocoder {
  async geocode(locationText: string): Promise<GeocoderResult | null> {
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(locationText)}`
    // ...
  }
}
```

## Tests

```bash
npm run test
```

Tests dekken:
- Deduplicatie en tekstsimilariteit
- Haversine afstandsberekening
- Normalisatie van bronmeldingen
- Zoekfunctionaliteit

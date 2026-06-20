import { v4 as uuid } from 'uuid'
import { BaseConnector } from './BaseConnector'
import type { RawSourceMessage, Category, Priority } from '../types'

interface MockRaw {
  title: string
  message: string
  locationText: string
  city: string
  street: string
  category: Category
  priority: Priority
  lat: number
  lng: number
  minutesAgo: number
  sourceName?: string
  reportageUrl?: string
}

const MOCK_INCIDENTS: MockRaw[] = [
  { title: 'Woningbrand', message: 'Brand in woning, rookontwikkeling zichtbaar', locationText: 'Bloemstraat 12, Leiden', city: 'Leiden', street: 'Bloemstraat 12', category: 'fire', priority: 'prio1', lat: 52.1601, lng: 4.4970, minutesAgo: 5 },
  { title: 'Woningbrand', message: 'Uitslaande brand woning Bloemstraat', locationText: 'Bloemstraat 12, Leiden', city: 'Leiden', street: 'Bloemstraat 12', category: 'fire', priority: 'prio1', lat: 52.1601, lng: 4.4970, minutesAgo: 6, sourceName: 'p2000m.nl' },
  { title: 'Reanimatie', message: 'Reanimatie volwassene, bewusteloos', locationText: 'Koningsweg 8, Utrecht', city: 'Utrecht', street: 'Koningsweg 8', category: 'ambulance', priority: 'prio1', lat: 52.0907, lng: 5.1214, minutesAgo: 8 },
  { title: 'Verkeersongeval letsel', message: 'Aanrijding met letsel, 2 voertuigen', locationText: 'A4 km 42, Leiden', city: 'Leiden', street: 'A4', category: 'traffic', priority: 'prio1', lat: 52.1955, lng: 4.4010, minutesAgo: 12 },
  { title: 'Traumaheli', message: 'Traumaheli ingezet bij zwaar letsel', locationText: 'A4 km 42, Leiden', city: 'Leiden', street: 'A4', category: 'traumaheli', priority: 'prio1', lat: 52.1955, lng: 4.4010, minutesAgo: 13, sourceName: 'alarmeringen.nl' },
  { title: 'Automatische brandmelding', message: 'ABS melding school, brandweer ter controle', locationText: 'Schoolstraat 3, Amsterdam', city: 'Amsterdam', street: 'Schoolstraat 3', category: 'fire', priority: 'prio2', lat: 52.3676, lng: 4.9041, minutesAgo: 15 },
  { title: 'Voertuigbrand', message: 'Personenauto in brand op parkeerplaats', locationText: 'Marktplein 7, Arnhem', city: 'Arnhem', street: 'Marktplein', category: 'fire', priority: 'prio2', lat: 51.9851, lng: 5.8987, minutesAgo: 20 },
  { title: 'Assistentie ambulance', message: 'Ambulance verzoekt politieassistentie bij patiënt', locationText: 'Hoofdstraat 45, Rotterdam', city: 'Rotterdam', street: 'Hoofdstraat 45', category: 'ambulance', priority: 'prio2', lat: 51.9225, lng: 4.4792, minutesAgo: 22 },
  { title: 'Waterongeval', message: 'Persoon te water, KNRM gealarmeerd', locationText: 'Haringvliet, Hellevoetsluis', city: 'Hellevoetsluis', street: 'Haringvliet', category: 'rescue', priority: 'prio1', lat: 51.8320, lng: 4.1290, minutesAgo: 25 },
  { title: 'Woningbrand', message: 'Melding woningbrand, straat afgezet', locationText: 'Kerkstraat 2, Groningen', city: 'Groningen', street: 'Kerkstraat 2', category: 'fire', priority: 'prio1', lat: 53.2194, lng: 6.5665, minutesAgo: 30 },
  { title: 'Reanimatie', message: 'Reanimatie, AED op locatie', locationText: 'Kerkstraat 2, Groningen', city: 'Groningen', street: 'Kerkstraat 2', category: 'ambulance', priority: 'prio1', lat: 53.2194, lng: 6.5665, minutesAgo: 31, sourceName: 'p2000m.nl' },
  { title: 'Verkeersongeval snelweg', message: 'Aanrijding A2 met meerdere voertuigen', locationText: 'A2 km 123, Eindhoven', city: 'Eindhoven', street: 'A2', category: 'traffic', priority: 'prio1', lat: 51.4416, lng: 5.4697, minutesAgo: 35 },
  { title: 'Middelbrand bedrijfspand', message: 'Brand in loods, meerdere eenheden opgeroepen', locationText: 'Industrieweg 88, Enschede', city: 'Enschede', street: 'Industrieweg 88', category: 'fire', priority: 'prio1', lat: 52.2215, lng: 6.8937, minutesAgo: 40 },
  { title: 'Automatische brandmelding', message: 'ABS flatgebouw, geen rookontwikkeling', locationText: 'Torenstraat 14, Maastricht', city: 'Maastricht', street: 'Torenstraat 14', category: 'fire', priority: 'prio3', lat: 50.8514, lng: 5.6909, minutesAgo: 45 },
  { title: 'Traumaheli', message: 'Traumaheli landingsplek vrijhouden', locationText: 'Ringweg 5, Utrecht', city: 'Utrecht', street: 'Ringweg 5', category: 'traumaheli', priority: 'prio1', lat: 52.0800, lng: 5.1350, minutesAgo: 50 },
  { title: 'Gaslek', message: 'Gaslek in straat, bewoners geëvacueerd', locationText: 'Pleinlaan 9, Rotterdam', city: 'Rotterdam', street: 'Pleinlaan 9', category: 'fire', priority: 'prio1', lat: 51.9100, lng: 4.4600, minutesAgo: 55 },
  { title: 'Verkeersongeval letsel', message: 'Fietser aangereden, bewusteloos', locationText: 'Fietspad N206, Noordwijk', city: 'Noordwijk', street: 'N206', category: 'traffic', priority: 'prio1', lat: 52.2437, lng: 4.4475, minutesAgo: 60 },
  { title: 'Reanimatie', message: 'Reanimatie in openbare ruimte', locationText: 'Centrum, Amsterdam', city: 'Amsterdam', street: 'Damrak', category: 'ambulance', priority: 'prio1', lat: 52.3740, lng: 4.8980, minutesAgo: 65 },
  { title: 'Woningbrand', message: 'Brand keuken woning', locationText: 'Molenstraat 19, Eindhoven', city: 'Eindhoven', street: 'Molenstraat 19', category: 'fire', priority: 'prio1', lat: 51.4380, lng: 5.4750, minutesAgo: 70 },
  { title: 'Hulpverlening dier', message: 'Kat in boom, brandweer ter plaatse', locationText: 'Parkweg 3, Leiden', city: 'Leiden', street: 'Parkweg 3', category: 'other', priority: 'prio3', lat: 52.1550, lng: 4.5020, minutesAgo: 75 },
  { title: 'Waterongeval', message: 'Kind te water, snel gereanimeerd', locationText: 'Sloterplas, Amsterdam', city: 'Amsterdam', street: 'Sloterplas', category: 'rescue', priority: 'prio1', lat: 52.3660, lng: 4.8080, minutesAgo: 80 },
  { title: 'Verkeersongeval snelweg', message: 'Meerdere gewonden A10, traumaheli', locationText: 'A10 Oost, Amsterdam', city: 'Amsterdam', street: 'A10', category: 'traffic', priority: 'prio1', lat: 52.3700, lng: 4.9500, minutesAgo: 85 },
  { title: 'Traumaheli', message: 'Traumaheli opgeroepen A10 Amsterdam', locationText: 'A10 Oost, Amsterdam', city: 'Amsterdam', street: 'A10', category: 'traumaheli', priority: 'prio1', lat: 52.3700, lng: 4.9500, minutesAgo: 86, sourceName: 'p2000m.nl' },
  { title: 'Middelbrand woning', message: 'Felle woningbrand, drie panden bedreigd', locationText: 'Oudeweg 31, Arnhem', city: 'Arnhem', street: 'Oudeweg 31', category: 'fire', priority: 'prio1', lat: 51.9900, lng: 5.9100, minutesAgo: 90 },
  { title: 'Assistentie ambulance', message: 'ALS + politie gevraagd, verwarde patiënt', locationText: 'Vechtstraat 7, Utrecht', city: 'Utrecht', street: 'Vechtstraat 7', category: 'police', priority: 'prio2', lat: 52.0950, lng: 5.1000, minutesAgo: 95 },
  { title: 'Voertuigbrand', message: 'Vrachtwagen in brand snelweg', locationText: 'A58 km 88, Tilburg', city: 'Tilburg', street: 'A58', category: 'fire', priority: 'prio1', lat: 51.5555, lng: 5.0913, minutesAgo: 100 },
  { title: 'Automatische brandmelding', message: 'Melding verzorgingshuis, vals alarm', locationText: 'Zorgpark 1, Groningen', city: 'Groningen', street: 'Zorgpark 1', category: 'fire', priority: 'prio2', lat: 53.2100, lng: 6.5700, minutesAgo: 110 },
  { title: 'Reanimatie thuis', message: 'Reanimatie ouder, AED gevraagd', locationText: 'Lindenlaan 4, Maastricht', city: 'Maastricht', street: 'Lindenlaan 4', category: 'ambulance', priority: 'prio1', lat: 50.8600, lng: 5.6800, minutesAgo: 120 },
  { title: 'Verkeersongeval letsel', message: 'Motor vs auto, forse schade en letsel', locationText: 'N36, Almelo', city: 'Almelo', street: 'N36', category: 'traffic', priority: 'prio1', lat: 52.3520, lng: 6.6650, minutesAgo: 130 },
  { title: 'Woningbrand', message: 'Rookontwikkeling bovenverdieping', locationText: 'Havenweg 22, Rotterdam', city: 'Rotterdam', street: 'Havenweg 22', category: 'fire', priority: 'prio1', lat: 51.9200, lng: 4.5000, minutesAgo: 140, reportageUrl: 'https://1120.nl/fotoreportages/havenweg-rotterdam' },
]

export class MockConnector extends BaseConnector {
  constructor() {
    super({
      name: 'mock-p2000',
      url: 'mock://localhost',
      enabled: true,
      pollIntervalMs: 30000,
    })
  }

  async fetch(): Promise<RawSourceMessage[]> {
    const now = new Date()
    return MOCK_INCIDENTS.map((raw, index) => {
      const receivedAt = new Date(now.getTime() - raw.minutesAgo * 60 * 1000)
      return {
        id: uuid(),
        sourceName: raw.sourceName ?? 'p2000.net',
        sourceUrl: `https://p2000.net/melding/${index + 1}`,
        externalId: `mock-${index + 1}`,
        rawTitle: raw.title,
        rawMessage: raw.message,
        receivedAt: receivedAt.toISOString(),
        locationText: raw.locationText,
        category: raw.category,
        priority: raw.priority,
        metadata: {
          city: raw.city,
          street: raw.street,
          lat: raw.lat,
          lng: raw.lng,
          reportageUrl: raw.reportageUrl ?? null,
        },
      }
    })
  }
}

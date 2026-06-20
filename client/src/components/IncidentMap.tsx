import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Incident } from '../types'
import { CATEGORY_COLORS } from './CategoryIcon'
import type { GeoCoords } from '../types'

function makeIcon(category: string) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? '#718096'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  })
}

interface Props {
  incidents: Incident[]
  userCoords?: GeoCoords | null
  selectedId?: string | null
  onSelectIncident?: (id: string) => void
  height?: string
}

export function IncidentMap({ incidents, userCoords, selectedId: _selectedId, onSelectIncident, height = '100%' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = L.map(containerRef.current, {
      center: [52.3, 5.3],
      zoom: 7,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current)
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    incidents
      .filter((i) => i.lat !== null && i.lng !== null)
      .forEach((incident) => {
        const marker = L.marker([incident.lat!, incident.lng!], {
          icon: makeIcon(incident.category),
        })
        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:0.9rem">${incident.title}</strong>
            <div style="color:#718096;font-size:0.8rem;margin:4px 0">${incident.city}</div>
            <div style="color:#a0aec0;font-size:0.75rem;margin-bottom:8px">${new Date(incident.firstSeenAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</div>
            <a href="/incident/${incident.id}" style="display:inline-block;padding:5px 12px;background:#e53e3e;color:#fff;border-radius:6px;text-decoration:none;font-size:0.8rem;font-weight:600">Detail →</a>
          </div>
        `)
        marker.on('click', () => onSelectIncident?.(incident.id))
        marker.addTo(mapRef.current!)
        markersRef.current.push(marker)
      })
  }, [incidents, onSelectIncident])

  useEffect(() => {
    if (!mapRef.current || !userCoords) return
    L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 8,
      fillColor: '#3182ce',
      fillOpacity: 0.9,
      color: '#fff',
      weight: 2,
    })
      .bindPopup('Uw locatie')
      .addTo(mapRef.current)
    mapRef.current.setView([userCoords.lat, userCoords.lng], 12)
  }, [userCoords])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, minHeight: '300px' }}
    />
  )
}

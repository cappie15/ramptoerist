import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Incident, EmergencyVehicle } from '../types'
import type { GeoCoords } from '../types'

const INCIDENT_ICONS: Record<string, string> = {
  fire: '🔥',
  ambulance: '🚑',
  police: '🚔',
  traumaheli: '🚁',
  rescue: '🚤',
  traffic: '🚧',
  other: '🔔',
}

const VEHICLE_ICONS: Record<string, string> = {
  brandweer: '🚒',
  ambulance: '🚑',
  politie: '🚓',
  traumaheli: '🚁',
  knrm: '⛵',
  other: '🚐',
}

function incidentIcon(category: string): L.DivIcon {
  return L.divIcon({
    html: `<span class="rt-incident-icon">${INCIDENT_ICONS[category] ?? '🔔'}</span>`,
    className: 'rt-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  })
}

function vehicleIcon(type: string): L.DivIcon {
  return L.divIcon({
    html: `<span class="rt-vehicle-icon">${VEHICLE_ICONS[type] ?? '🚐'}</span>`,
    className: 'rt-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  })
}

interface Props {
  incidents: Incident[]
  vehicles?: EmergencyVehicle[]
  userCoords?: GeoCoords | null
  onSelectIncident?: (id: string) => void
  height?: string
}

export function IncidentMap({
  incidents,
  vehicles = [],
  userCoords,
  onSelectIncident,
  height = '100%',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const incidentLayerRef = useRef<L.LayerGroup | null>(null)
  const vehicleLayerRef = useRef<L.LayerGroup | null>(null)
  const userLayerRef = useRef<L.LayerGroup | null>(null)
  const onSelectRef = useRef(onSelectIncident)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelectIncident
  })

  // Initialize map once per mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = L.map(container, { center: [52.3, 5.3], zoom: 7 })
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Show overlay when tiles fail to load (e.g. no internet access)
    let errorCount = 0
    tileLayer.on('tileerror', () => {
      errorCount++
      if (errorCount === 4) {
        const el = document.createElement('div')
        el.id = 'tile-error-overlay'
        el.style.cssText =
          'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
          'background:rgba(247,250,252,0.92);z-index:500;pointer-events:none;'
        el.innerHTML =
          '<div style="text-align:center;padding:20px;color:#4a5568">' +
          '<div style="font-size:2rem;margin-bottom:8px">🗺️</div>' +
          '<strong>Kaartlaag niet beschikbaar</strong>' +
          '<p style="margin:6px 0 0;font-size:0.85rem">Controleer de internetverbinding.<br>Incidentmarkers zijn wel zichtbaar.</p>' +
          '</div>'
        container.style.position = 'relative'
        container.appendChild(el)
      }
    })

    incidentLayerRef.current = L.layerGroup().addTo(map)
    vehicleLayerRef.current = L.layerGroup().addTo(map)
    userLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // invalidateSize fixes rendering when container was hidden during init
    setTimeout(() => map.invalidateSize(), 100)
    setMapReady(true)

    return () => {
      setMapReady(false)
      map.remove()
      mapRef.current = null
      incidentLayerRef.current = null
      vehicleLayerRef.current = null
      userLayerRef.current = null
    }
  }, [])

  // Incident markers — run when map is ready OR incidents change
  useEffect(() => {
    const layer = incidentLayerRef.current
    if (!mapReady || !layer) return
    layer.clearLayers()

    incidents
      .filter((i) => i.lat !== null && i.lng !== null)
      .forEach((incident) => {
        const timeStr = new Date(incident.firstSeenAt).toLocaleTimeString('nl-NL', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const sourceBadge =
          incident.sourceCount > 1
            ? `<span style="font-size:0.7rem;background:#faf5ff;color:#805ad5;border-radius:9999px;padding:2px 7px;margin-left:4px">${incident.sourceCount} bronnen</span>`
            : ''
        L.marker([incident.lat!, incident.lng!], { icon: incidentIcon(incident.category) })
          .bindPopup(
            `<div style="min-width:185px">
              <strong style="font-size:0.9rem">${incident.title}</strong>${sourceBadge}
              <div style="color:#718096;font-size:0.8rem;margin:4px 0">${incident.city}</div>
              <div style="color:#a0aec0;font-size:0.73rem;margin-bottom:8px">${timeStr}</div>
              <a href="/incident/${incident.id}" style="display:inline-block;padding:5px 12px;background:#e53e3e;color:#fff;border-radius:6px;text-decoration:none;font-size:0.8rem;font-weight:600">Detail →</a>
            </div>`
          )
          .on('click', () => onSelectRef.current?.(incident.id))
          .addTo(layer)
      })
  }, [incidents, mapReady])

  // Vehicle markers — run when map is ready OR vehicles change
  useEffect(() => {
    const layer = vehicleLayerRef.current
    if (!mapReady || !layer) return
    layer.clearLayers()

    vehicles.forEach((vehicle) => {
      const timeStr = new Date(vehicle.lastSeenAt).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const incidentLink = vehicle.linkedIncidentId
        ? `<a href="/incident/${vehicle.linkedIncidentId}" style="display:block;margin-top:6px;padding:4px 10px;background:#1a365d;color:#fff;border-radius:5px;text-decoration:none;font-size:0.75rem;text-align:center">Gekoppeld incident →</a>`
        : ''
      L.marker([vehicle.lat, vehicle.lng], { icon: vehicleIcon(vehicle.type) })
        .bindPopup(
          `<div style="min-width:160px">
            <strong style="font-size:0.85rem">${vehicle.callSign}</strong>
            <div style="color:#718096;font-size:0.78rem;margin:3px 0">${vehicle.type} · ${vehicle.speed} km/h</div>
            <div style="color:#a0aec0;font-size:0.72rem">Flitsmeister · ${timeStr}</div>
            ${incidentLink}
          </div>`
        )
        .addTo(layer)
    })
  }, [vehicles, mapReady])

  // User location marker
  useEffect(() => {
    const layer = userLayerRef.current
    if (!mapReady || !layer) return
    layer.clearLayers()
    if (!userCoords) return

    L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 9,
      fillColor: '#3182ce',
      fillOpacity: 0.9,
      color: '#fff',
      weight: 2,
    })
      .bindPopup('Uw locatie')
      .addTo(layer)

    mapRef.current?.setView([userCoords.lat, userCoords.lng], 12)
  }, [userCoords, mapReady])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, minHeight: '300px', flex: 1 }}
    />
  )
}

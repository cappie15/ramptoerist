import { useState, useCallback } from 'react'
import type { GeoCoords } from '../types'

interface UseGeolocationResult {
  coords: GeoCoords | null
  loading: boolean
  error: string | null
  request: () => void
}

export function useGeolocation(): UseGeolocationResult {
  const [coords, setCoords] = useState<GeoCoords | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocatie wordt niet ondersteund door uw browser')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('GPS-toegang geweigerd. Sta locatietoegang toe om incidenten in de buurt te zien.')
        } else {
          setError('Kon uw locatie niet bepalen')
        }
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return { coords, loading, error, request }
}

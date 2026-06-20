import { useState, useEffect } from 'react'
import type { EmergencyVehicle } from '../types'

export function useVehicles(): EmergencyVehicle[] {
  const [vehicles, setVehicles] = useState<EmergencyVehicle[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/vehicles')
        if (res.ok) setVehicles(await res.json())
      } catch {
        // vehicles are optional, fail silently
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return vehicles
}

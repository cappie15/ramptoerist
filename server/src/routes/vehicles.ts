import { Router } from 'express'
import { db } from '../db/database'
import { FlitsmeisterConnector } from '../connectors/FlitsmeisterConnector'

export const vehicleRouter = Router()
const flitsmeister = new FlitsmeisterConnector()

vehicleRouter.get('/', (_req, res) => {
  const incidents = db
    .prepare(
      `SELECT id, category, lat, lng, first_seen_at as firstSeenAt
       FROM incidents
       WHERE lat IS NOT NULL AND lng IS NOT NULL
       ORDER BY first_seen_at DESC
       LIMIT 40`
    )
    .all() as Array<{
    id: string
    category: string
    lat: number
    lng: number
    firstSeenAt: string
  }>

  const vehicles = flitsmeister.generateVehiclesForIncidents(incidents)
  res.json(vehicles)
})

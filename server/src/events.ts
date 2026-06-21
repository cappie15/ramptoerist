import { EventEmitter } from 'events'

export const incidentEmitter = new EventEmitter()
export const INCIDENT_UPDATED = 'incident:updated'

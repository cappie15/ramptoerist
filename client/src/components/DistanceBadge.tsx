import { formatDistance } from '../utils/distance'

interface Props {
  distanceKm: number | null
}

export function DistanceBadge({ distanceKm }: Props) {
  if (distanceKm === null) return null
  return (
    <span
      style={{
        fontSize: '0.75rem',
        background: '#ebf8ff',
        color: '#2b6cb0',
        borderRadius: '9999px',
        padding: '2px 8px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {formatDistance(distanceKm)}
    </span>
  )
}

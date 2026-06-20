import type { Category } from '../types'

const ICONS: Record<Category, string> = {
  fire: '🔥',
  ambulance: '🚑',
  police: '🚔',
  traumaheli: '🚁',
  rescue: '🚤',
  traffic: '🚧',
  other: '🔔',
}

const COLORS: Record<Category, string> = {
  fire: '#e53e3e',
  ambulance: '#dd6b20',
  police: '#3182ce',
  traumaheli: '#805ad5',
  rescue: '#2b6cb0',
  traffic: '#d69e2e',
  other: '#718096',
}

interface Props {
  category: Category
  size?: 'sm' | 'md' | 'lg'
}

export function CategoryIcon({ category, size = 'md' }: Props) {
  const sizes = { sm: '1rem', md: '1.4rem', lg: '2rem' }
  return (
    <span
      title={category}
      style={{
        fontSize: sizes[size],
        color: COLORS[category],
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {ICONS[category]}
    </span>
  )
}

export { COLORS as CATEGORY_COLORS, ICONS as CATEGORY_ICONS }

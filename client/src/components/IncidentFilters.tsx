import type { Category, Priority } from '../types'
import type { CategoryFilter, PriorityFilter } from '../utils/filters'

const CATEGORIES: { value: Category; icon: string; label: string; color: string }[] = [
  { value: 'fire',       icon: '🔥', label: 'Brand',   color: '#e53e3e' },
  { value: 'ambulance',  icon: '🚑', label: 'Ambu',    color: '#dd6b20' },
  { value: 'police',     icon: '🚔', label: 'Politie', color: '#3182ce' },
  { value: 'traumaheli', icon: '🚁', label: 'Heli',    color: '#805ad5' },
  { value: 'rescue',     icon: '🚤', label: 'Redding', color: '#2b6cb0' },
  { value: 'traffic',    icon: '🚧', label: 'Verkeer', color: '#d69e2e' },
  { value: 'other',      icon: '🔔', label: 'Overig',  color: '#718096' },
]

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'prio1', label: 'P1', color: '#e53e3e' },
  { value: 'prio2', label: 'P2', color: '#dd6b20' },
  { value: 'prio3', label: 'P3', color: '#718096' },
]

interface Props {
  categories: CategoryFilter
  priorities: PriorityFilter
  onCategoryChange: (f: CategoryFilter) => void
  onPriorityChange: (f: PriorityFilter) => void
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  next.has(value) ? next.delete(value) : next.add(value)
  return next
}

export function IncidentFilters({ categories, priorities, onCategoryChange, onPriorityChange }: Props) {
  const hasFilter = categories.size > 0 || priorities.size > 0

  return (
    <div
      style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--rt-border)',
        background: 'var(--rt-surface)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}
    >
      {/* Category row */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--rt-text-muted)', minWidth: '28px' }}>Type:</span>
        {CATEGORIES.map((cat) => {
          const active = categories.has(cat.value)
          return (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(toggle(categories, cat.value))}
              title={cat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 8px',
                border: `1.5px solid ${active ? cat.color : 'var(--rt-border)'}`,
                borderRadius: '9999px',
                background: active ? cat.color + '22' : 'transparent',
                color: active ? cat.color : 'var(--rt-text-muted)',
                fontWeight: active ? 600 : 400,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>{cat.icon}</span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Priority + reset row */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--rt-text-muted)', minWidth: '28px' }}>Prio:</span>
        {PRIORITIES.map((p) => {
          const active = priorities.has(p.value)
          return (
            <button
              key={p.value}
              onClick={() => onPriorityChange(toggle(priorities, p.value))}
              style={{
                padding: '2px 10px',
                border: `1.5px solid ${active ? p.color : 'var(--rt-border)'}`,
                borderRadius: '9999px',
                background: active ? p.color + '22' : 'transparent',
                color: active ? p.color : 'var(--rt-text-muted)',
                fontWeight: active ? 700 : 400,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {p.label}
            </button>
          )
        })}
        {hasFilter && (
          <button
            onClick={() => { onCategoryChange(new Set()); onPriorityChange(new Set()) }}
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              border: 'none',
              background: 'none',
              color: 'var(--rt-accent)',
              fontSize: '0.73rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✕ reset
          </button>
        )}
      </div>
    </div>
  )
}

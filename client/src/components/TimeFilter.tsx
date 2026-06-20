import type { TimeRange } from '../utils/filters'

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1u' },
  { value: '2h', label: '2u' },
  { value: '6h', label: '6u' },
  { value: '24h', label: '24u' },
  { value: 'all', label: 'Alles' },
]

interface Props {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

export function TimeFilter({ value, onChange }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 12px',
        borderBottom: '1px solid var(--rt-border)',
        background: 'var(--rt-surface)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--rt-text-muted)', marginRight: '2px' }}>
        Periode:
      </span>
      {OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '3px 11px',
              border: active ? '1.5px solid var(--rt-accent)' : '1.5px solid var(--rt-border)',
              borderRadius: '9999px',
              background: active ? 'var(--rt-accent)' : 'transparent',
              color: active ? '#fff' : 'var(--rt-text-muted)',
              fontWeight: active ? 600 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

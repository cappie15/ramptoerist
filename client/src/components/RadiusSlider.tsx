interface Props {
  value: number
  onChange: (km: number) => void
  min?: number
  max?: number
}

export function RadiusSlider({ value, onChange, min = 1, max = 100 }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 12px',
        borderBottom: '1px solid var(--rt-border)',
        background: 'var(--rt-surface)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--rt-text-muted)', whiteSpace: 'nowrap' }}>
        📍 Radius:
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--rt-accent)' }}
      />
      <span
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--rt-accent)',
          minWidth: '44px',
          textAlign: 'right',
        }}
      >
        {value} km
      </span>
    </div>
  )
}

import { useState } from 'react'
import { useSearchHistory } from '../hooks/useSearchHistory'

interface Props {
  onSearch: (query: string) => void
  value: string
}

export function SearchBar({ onSearch, value }: Props) {
  const [draft, setDraft] = useState(value)
  const [showHistory, setShowHistory] = useState(false)
  const { history, addEntry } = useSearchHistory()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    if (q) addEntry(q)
    onSearch(q)
    setShowHistory(false)
  }

  const handleSelect = (q: string) => {
    setDraft(q)
    onSearch(q)
    setShowHistory(false)
  }

  const filteredHistory = draft
    ? history.filter((h) => h.toLowerCase().includes(draft.toLowerCase()))
    : history

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 12px',
          background: 'var(--rt-surface)',
          borderBottom: '1px solid var(--rt-border)',
        }}
      >
        <input
          type="search"
          placeholder="Zoek op stad, straat, type…"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            if (e.target.value === '') onSearch('')
          }}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 150)}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--rt-border)',
            borderRadius: '8px',
            fontSize: '1rem',
            outline: 'none',
            background: 'var(--rt-bg)',
            color: 'var(--rt-text)',
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            background: 'var(--rt-btn-bg)',
            color: 'var(--rt-btn-text)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Zoek
        </button>
      </form>
      {showHistory && filteredHistory.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--rt-surface)',
            border: '1px solid var(--rt-border)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 200,
          }}
        >
          {filteredHistory.map((h, i) => (
            <button
              key={i}
              onMouseDown={() => handleSelect(h)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom:
                  i < filteredHistory.length - 1 ? '1px solid var(--rt-border)' : 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: 'var(--rt-text)',
              }}
            >
              🕐 {h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

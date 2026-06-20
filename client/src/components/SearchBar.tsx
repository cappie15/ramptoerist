import { useState } from 'react'

interface Props {
  onSearch: (query: string) => void
  value: string
}

export function SearchBar({ onSearch, value }: Props) {
  const [draft, setDraft] = useState(value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(draft.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 12px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
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
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '1rem',
          outline: 'none',
          background: '#f7fafc',
          minWidth: 0,
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px 18px',
          background: '#2d3748',
          color: '#fff',
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
  )
}

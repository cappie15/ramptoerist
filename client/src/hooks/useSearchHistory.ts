import { useState } from 'react'

const STORAGE_KEY = 'rt-search-history'
const MAX_HISTORY = 5

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(loadHistory)

  const addEntry = (query: string) => {
    const q = query.trim()
    if (!q) return
    const next = [q, ...history.filter((h) => h !== q)].slice(0, MAX_HISTORY)
    setHistory(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { history, addEntry, clearHistory }
}

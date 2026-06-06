'use client'

import { useState, useEffect, useRef } from 'react'
import type { SchemeResult } from '@/lib/types'

interface Props {
  onSelect: (s: SchemeResult) => void
  placeholder?: string
}

export default function FundSearchInput({ onSelect, placeholder = 'Search fund...' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SchemeResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.slice(0, 8))
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        className="w-full bg-white text-zinc-900 placeholder-zinc-400 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && (
        <span className="absolute right-2 top-2.5 text-xs text-zinc-400">Loading…</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 bg-white border border-zinc-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto w-full">
          {results.map((r) => (
            <li
              key={r.schemeCode}
              className="px-3 py-2 cursor-pointer hover:bg-indigo-50 border-b border-zinc-100 last:border-0"
              onMouseDown={() => {
                onSelect(r)
                setQuery('')
                setOpen(false)
                setResults([])
              }}
            >
              <p className="text-sm font-medium text-zinc-900 leading-tight">{r.schemeName}</p>
              <p className="text-xs text-zinc-400">{r.schemeCode}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

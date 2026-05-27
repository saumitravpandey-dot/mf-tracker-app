'use client'

import { useEffect, useRef, useState } from 'react'
import type { SchemeResult } from '@/lib/types'

const TABS = ['Scheme Browser', 'NAV Data'] as const
type Tab = (typeof TABS)[number]

interface NavAllStatus {
  lastUpdated: string
  schemeCount: number
  status: string
}

export default function AmfiPage() {
  const [tab, setTab] = useState<Tab>('Scheme Browser')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SchemeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [navStatus, setNavStatus] = useState<NavAllStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/amfi/navall')
      .then((r) => r.json())
      .then(setNavStatus)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [query])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/amfi/navall', { method: 'POST' })
      const d = await res.json()
      setNavStatus((prev) =>
        prev ? { ...prev, lastUpdated: d.refreshedAt, status: 'refreshed' } : prev
      )
    } catch {
      // ignore
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">AMFI Data</h1>

      <div className="flex gap-1 mb-6 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Scheme Browser' && (
        <div>
          <div className="mb-4 relative">
            <input
              type="text"
              className="w-full max-w-md border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search mutual fund schemes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searching && (
              <span className="absolute right-3 top-2.5 text-xs text-zinc-400">Searching…</span>
            )}
          </div>

          {results.length === 0 && query.length < 2 ? (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center max-w-md">
              <p className="text-zinc-400 text-sm">Search for a mutual fund scheme</p>
            </div>
          ) : results.length === 0 && !searching ? (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center max-w-md">
              <p className="text-zinc-400 text-sm">No results found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden max-w-3xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                    <th className="text-left px-3 py-2">Code</th>
                    <th className="text-left px-3 py-2">Scheme Name</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-right px-3 py-2">NAV (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.schemeCode} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-3 py-2 font-mono text-zinc-400 text-xs">{r.schemeCode}</td>
                      <td className="px-3 py-2 text-zinc-900">{r.schemeName}</td>
                      <td className="px-3 py-2 text-zinc-500 text-xs">{r.category ?? '—'}</td>
                      <td className="text-right px-3 py-2 font-medium text-zinc-900">
                        {r.nav != null ? `₹${r.nav.toFixed(4)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'NAV Data' && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 max-w-sm">
          <h2 className="font-semibold text-zinc-900 mb-4">AMFI NAVAll Cache</h2>
          {navStatus ? (
            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs text-zinc-400">Last Updated</p>
                <p className="text-sm font-medium text-zinc-900">
                  {new Date(navStatus.lastUpdated).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Scheme Count</p>
                <p className="text-sm font-medium text-zinc-900">
                  {navStatus.schemeCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Status</p>
                <p className="text-sm font-medium text-zinc-900 capitalize">{navStatus.status}</p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 text-sm mb-5">Loading status…</p>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh NAV Data'}
          </button>
        </div>
      )}
    </div>
  )
}

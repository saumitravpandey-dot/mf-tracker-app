'use client'

import { useEffect, useState } from 'react'
import SectorPieChart from '@/components/SectorPieChart'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

interface Stock {
  name: string
  isin: string
  sector: string
  weight: number
}

interface Sector {
  sector: string
  weight: number
}

interface Overlap {
  fundA: string
  fundB: string
  pct: number
}

interface LookthroughData {
  stocks: Stock[]
  sectors: Sector[]
  overlap: Overlap[]
}

const TABS = ['Top Holdings', 'Sector Allocation', 'Fund Overlap'] as const
type Tab = (typeof TABS)[number]

function overlapColor(pct: number) {
  if (pct < 30) return 'bg-green-100 text-green-800'
  if (pct < 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function LookthroughPage() {
  const [profile, setProfileState] = useState('Default')
  const [data, setData] = useState<LookthroughData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('Top Holdings')

  useEffect(() => {
    setProfileState(getProfile())
    window.addEventListener('mft_profile_change', (e) => {
      setProfileState((e as CustomEvent).detail as string)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/lookthrough?profile=${encodeURIComponent(profile)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [profile])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Look-Through Analysis</h1>
      <p className="text-xs text-zinc-400 mb-6">
        Stock data based on last available AMFI portfolio disclosures (typically 1-month lag).
      </p>

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

      {loading ? (
        <p className="text-zinc-400 text-sm">Loading…</p>
      ) : !data ? (
        <p className="text-zinc-400 text-sm">Failed to load data.</p>
      ) : (
        <>
          {tab === 'Top Holdings' && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Stock</th>
                    <th className="text-left px-3 py-2">ISIN</th>
                    <th className="text-left px-3 py-2">Sector</th>
                    <th className="text-right px-3 py-2">Weight %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stocks.slice(0, 20).map((s, i) => (
                    <tr key={s.isin} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-3 py-2 text-zinc-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-zinc-900">{s.name}</td>
                      <td className="px-3 py-2 text-zinc-400 font-mono text-xs">{s.isin}</td>
                      <td className="px-3 py-2 text-zinc-600">{s.sector}</td>
                      <td className="px-3 py-2 text-right font-medium text-zinc-900">
                        {s.weight.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Sector Allocation' && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
              <SectorPieChart data={data.sectors} />
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                      <th className="text-left px-3 py-2">Sector</th>
                      <th className="text-right px-3 py-2">Weight %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sectors.map((s) => (
                      <tr key={s.sector} className="border-b border-zinc-100">
                        <td className="px-3 py-2 text-zinc-700">{s.sector}</td>
                        <td className="px-3 py-2 text-right font-medium">{s.weight.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'Fund Overlap' && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
              <p className="text-xs text-zinc-400 mb-4">
                Higher overlap means the funds hold many of the same stocks.
              </p>
              <div className="space-y-3">
                {data.overlap.map((o, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-zinc-900">{o.fundA}</span>
                      <span className="text-zinc-400 mx-2">×</span>
                      <span className="font-medium text-zinc-900">{o.fundB}</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${overlapColor(o.pct)}`}
                    >
                      {o.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

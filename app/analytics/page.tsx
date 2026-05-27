'use client'

import { useEffect, useState } from 'react'
import NavChart from '@/components/NavChart'
import MetricCard from '@/components/MetricCard'
import { formatPct, colorForValue } from '@/lib/types'
import type { HoldingRow, NavPoint } from '@/lib/types'
import {
  cagr,
  annualizedVolatility,
  sharpeRatio,
  maxDrawdown,
  periodReturn,
} from '@/lib/analytics'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

const PERIOD_ROWS = [
  { label: '1 Month', days: 21 },
  { label: '3 Months', days: 63 },
  { label: '6 Months', days: 126 },
  { label: '1 Year', days: 252 },
  { label: '3 Years', days: 756 },
  { label: '5 Years', days: 1260 },
]

export default function AnalyticsPage() {
  const [profile, setProfileState] = useState('Default')
  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [selectedCode, setSelectedCode] = useState<number | null>(null)
  const [navData, setNavData] = useState<NavPoint[]>([])
  const [navLoading, setNavLoading] = useState(false)
  const [schemeName, setSchemeName] = useState('')

  useEffect(() => {
    setProfileState(getProfile())
    window.addEventListener('mft_profile_change', (e) => {
      setProfileState((e as CustomEvent).detail as string)
    })
  }, [])

  useEffect(() => {
    fetch(`/api/holdings?profile=${encodeURIComponent(profile)}`)
      .then((r) => r.json())
      .then((d: HoldingRow[]) => setHoldings(d ?? []))
      .catch(() => {})
  }, [profile])

  useEffect(() => {
    if (!selectedCode) return
    setNavLoading(true)
    fetch(`/api/nav/${selectedCode}`)
      .then((r) => r.json())
      .then((d: { data: NavPoint[] }) => {
        const sorted = (d.data ?? []).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setNavData(sorted)
      })
      .catch(() => setNavData([]))
      .finally(() => setNavLoading(false))
  }, [selectedCode])

  const uniqueFunds = Array.from(
    new Map(holdings.map((h) => [h.scheme_code, h.scheme_name])).entries()
  )

  const navValues = navData.map((d) => d.nav)

  const cagrVal = navValues.length > 1
    ? cagr(navValues[0], navValues[navValues.length - 1], navValues.length / 252)
    : null
  const volVal = navValues.length > 1 ? annualizedVolatility(navValues) : null
  const sharpeVal = navValues.length > 1 ? sharpeRatio(navValues) : null
  const drawdownVal = navValues.length > 1 ? maxDrawdown(navValues) : null

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Analytics</h1>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-6">
        <label className="block text-xs text-zinc-500 mb-2">Select Fund</label>
        <select
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm"
          value={selectedCode ?? ''}
          onChange={(e) => {
            const code = Number(e.target.value)
            setSelectedCode(code || null)
            setSchemeName(uniqueFunds.find(([c]) => c === code)?.[1] ?? '')
          }}
        >
          <option value="">— Pick a fund from your holdings —</option>
          {uniqueFunds.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {selectedCode && (
        <>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-6">
            {navLoading ? (
              <p className="text-sm text-zinc-400 py-8 text-center">Loading NAV data…</p>
            ) : navData.length > 0 ? (
              <NavChart data={navData} schemeName={schemeName} />
            ) : (
              <p className="text-sm text-zinc-400 py-8 text-center">No NAV data available.</p>
            )}
          </div>

          {navValues.length > 1 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  label="CAGR"
                  value={cagrVal != null ? formatPct(cagrVal) : '—'}
                  valueClass={cagrVal != null ? colorForValue(cagrVal) : 'text-zinc-900'}
                />
                <MetricCard
                  label="Volatility (Ann.)"
                  value={volVal != null ? `${volVal.toFixed(2)}%` : '—'}
                />
                <MetricCard
                  label="Sharpe Ratio"
                  value={sharpeVal != null ? sharpeVal.toFixed(3) : '—'}
                  valueClass={sharpeVal != null ? colorForValue(sharpeVal) : 'text-zinc-900'}
                />
                <MetricCard
                  label="Max Drawdown"
                  value={drawdownVal != null ? `${drawdownVal.toFixed(2)}%` : '—'}
                  valueClass="text-red-600"
                />
              </div>

              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
                  Period Returns
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                      <th className="text-left px-3 py-2">Period</th>
                      <th className="text-right px-3 py-2">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERIOD_ROWS.map(({ label, days }) => {
                      const r = periodReturn(navValues, days)
                      return (
                        <tr key={label} className="border-b border-zinc-100">
                          <td className="px-3 py-2 text-zinc-700">{label}</td>
                          <td className={`text-right px-3 py-2 font-medium ${r != null ? colorForValue(r) : 'text-zinc-400'}`}>
                            {r != null ? formatPct(r) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

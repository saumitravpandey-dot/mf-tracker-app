'use client'

import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
import PortfolioChart from '@/components/PortfolioChart'
import { formatINR, formatPct, colorForValue } from '@/lib/types'
import type { HoldingRow } from '@/lib/types'
import { xirr } from '@/lib/analytics'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfileState] = useState('Default')

  useEffect(() => {
    setProfileState(getProfile())
    function onProfileChange(e: Event) {
      setProfileState((e as CustomEvent).detail as string)
    }
    window.addEventListener('mft_profile_change', onProfileChange)
    return () => window.removeEventListener('mft_profile_change', onProfileChange)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/holdings?profile=${encodeURIComponent(profile)}`)
      .then((r) => r.json())
      .then((raw: HoldingRow[]) => setHoldings(raw ?? []))
      .catch(() => setHoldings([]))
      .finally(() => setLoading(false))
  }, [profile])

  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0)
  const currentValue = holdings.reduce((s, h) => s + h.current_value, 0)
  const totalPnL = currentValue - totalInvested
  const returnPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  const portfolioXirr = (() => {
    if (holdings.length === 0) return null
    const cashflows = holdings.map((h) => ({
      date: new Date(h.buy_date),
      amount: -h.invested,
    }))
    cashflows.push({ date: new Date(), amount: currentValue })
    return xirr(cashflows)
  })()

  const chartData = (() => {
    if (holdings.length === 0) return []
    const sorted = [...holdings].sort(
      (a, b) => new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime()
    )
    const earliest = sorted[0].buy_date
    const startInvested = sorted[0].units * sorted[0].buy_nav
    const startValue = startInvested
    const today = new Date().toISOString().split('T')[0]
    return [
      { date: earliest, value: startValue, invested: startInvested },
      { date: today, value: currentValue, invested: totalInvested },
    ]
  })()

  const byFund = holdings
    .sort((a, b) => b.current_value - a.current_value)
    .slice(0, 8)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-zinc-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Current Value" value={formatINR(currentValue)} />
            <MetricCard label="Total Invested" value={formatINR(totalInvested)} />
            <MetricCard
              label="Total P&L"
              value={formatINR(totalPnL)}
              valueClass={colorForValue(totalPnL)}
            />
            <MetricCard
              label="Overall Return"
              value={formatPct(returnPct)}
              sub={portfolioXirr != null ? `XIRR ${formatPct(portfolioXirr)}` : undefined}
              valueClass={colorForValue(returnPct)}
            />
          </div>

          {chartData.length >= 2 && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 mb-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Portfolio Value</p>
              <PortfolioChart data={chartData} />
            </div>
          )}

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Holdings by Fund</p>
            {byFund.length === 0 ? (
              <p className="text-sm text-zinc-400">No holdings yet.</p>
            ) : (
              <div className="space-y-2">
                {byFund.map((h) => {
                  const pct = currentValue > 0 ? (h.current_value / currentValue) * 100 : 0
                  return (
                    <div key={h.id}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-zinc-700 truncate max-w-[240px]">{h.scheme_name}</span>
                        <span className="text-zinc-500 ml-2 flex-shrink-0">
                          {formatINR(h.current_value)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

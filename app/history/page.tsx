'use client'

import { useEffect, useState } from 'react'
import PortfolioChart from '@/components/PortfolioChart'
import MetricCard from '@/components/MetricCard'
import { formatINR, formatPct, colorForValue } from '@/lib/types'
import type { HoldingRow } from '@/lib/types'
import { loadEnrichedHoldings } from '@/lib/store'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

interface ChartPoint {
  date: string
  value: number
  invested: number
}

export default function HistoryPage() {
  const [profile, setProfileState] = useState('Default')
  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartPoint[]>([])

  useEffect(() => {
    setProfileState(getProfile())
    window.addEventListener('mft_profile_change', (e) => {
      setProfileState((e as CustomEvent).detail as string)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    loadEnrichedHoldings(profile)
      .then((data) => {
        setHoldings(data)
        buildTimeSeries(data)
      })
      .catch(() => setHoldings([]))
      .finally(() => setLoading(false))
  }, [profile])

  function buildTimeSeries(hs: HoldingRow[]) {
    if (hs.length === 0) {
      setChartData([])
      return
    }

    // Build points at every buy_date + today
    const dateMap = new Map<string, { value: number; invested: number }>()

    // Accumulate state over time
    const sorted = [...hs].sort(
      (a, b) => new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime()
    )

    let runningInvested = 0
    let runningValueAtBuy = 0

    for (const h of sorted) {
      runningInvested += h.invested
      runningValueAtBuy += h.invested // at buy date, value ≈ invested
      const existing = dateMap.get(h.buy_date)
      if (existing) {
        existing.invested = runningInvested
        existing.value = runningValueAtBuy
      } else {
        dateMap.set(h.buy_date, {
          invested: runningInvested,
          value: runningValueAtBuy,
        })
      }
    }

    // Add today
    const today = new Date().toISOString().split('T')[0]
    const totalInvested = hs.reduce((s, h) => s + h.invested, 0)
    const currentValue = hs.reduce((s, h) => s + h.current_value, 0)
    dateMap.set(today, { value: currentValue, invested: totalInvested })

    const points = Array.from(dateMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, v]) => ({ date, ...v }))

    setChartData(points)
  }

  const totalInvested = holdings.reduce((s, h) => s + h.invested, 0)
  const currentValue = holdings.reduce((s, h) => s + h.current_value, 0)
  const totalReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0

  const firstPoint = chartData[0]
  const startValue = firstPoint?.value ?? 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">History</h1>

      {loading ? (
        <p className="text-zinc-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MetricCard label="Start Value" value={formatINR(startValue)} />
            <MetricCard label="Current Value" value={formatINR(currentValue)} />
            <MetricCard
              label="Total Return"
              value={formatPct(totalReturn)}
              valueClass={colorForValue(totalReturn)}
            />
          </div>

          {chartData.length >= 2 ? (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
                Portfolio Growth Over Time
              </p>
              <PortfolioChart data={chartData} />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center">
              <p className="text-zinc-400 text-sm">
                No history data. Add holdings to see portfolio growth.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

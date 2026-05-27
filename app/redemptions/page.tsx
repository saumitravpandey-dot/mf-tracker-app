'use client'

import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
import { formatINR, formatPct, colorForValue } from '@/lib/types'
import type { Redemption, HoldingRow } from '@/lib/types'

function getProfile(): string {
  if (typeof window === 'undefined') return 'Default'
  return localStorage.getItem('mft_profile') ?? 'Default'
}

const TABS = ['History', 'Scenario Analysis'] as const
type Tab = (typeof TABS)[number]

export default function RedemptionsPage() {
  const [profile, setProfileState] = useState('Default')
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [holdings, setHoldings] = useState<HoldingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('History')

  useEffect(() => {
    setProfileState(getProfile())
    window.addEventListener('mft_profile_change', (e) => {
      setProfileState((e as CustomEvent).detail as string)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/redemptions?profile=${encodeURIComponent(profile)}`).then((r) => r.json()),
      fetch(`/api/holdings?profile=${encodeURIComponent(profile)}`).then((r) => r.json()),
    ])
      .then(([reds, holds]) => {
        setRedemptions(reds ?? [])
        setHoldings(holds ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profile])

  const totalRedeemed = redemptions.reduce((s, r) => s + r.units * r.sell_nav, 0)

  // Estimate invested for each redemption: find matching holding by scheme_code
  const enriched = redemptions.map((r) => {
    const matching = holdings.find((h) => h.scheme_code === r.scheme_code)
    const estimatedBuyNav = matching?.buy_nav ?? r.sell_nav
    const invested = r.units * estimatedBuyNav
    const sellValue = r.units * r.sell_nav
    const pnl = sellValue - invested
    const returnPct = invested > 0 ? (pnl / invested) * 100 : 0
    const buyDate = matching?.buy_date ?? r.sell_date
    const holdingDays = Math.round(
      (new Date(r.sell_date).getTime() - new Date(buyDate).getTime()) / (1000 * 86400)
    )
    const currentNav = matching?.current_nav ?? r.sell_nav
    const currentValueIfHeld = r.units * currentNav
    const opportunityCost = currentValueIfHeld - sellValue
    return {
      ...r,
      invested,
      sellValue,
      pnl,
      returnPct,
      holdingDays: Math.max(holdingDays, 0),
      currentValueIfHeld,
      opportunityCost,
    }
  })

  const totalRealizedPnL = enriched.reduce((s, r) => s + r.pnl, 0)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Redemptions</h1>

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
      ) : tab === 'History' ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MetricCard label="Total Redeemed" value={formatINR(totalRedeemed)} />
            <MetricCard
              label="Total Realized P&L"
              value={formatINR(totalRealizedPnL)}
              valueClass={colorForValue(totalRealizedPnL)}
            />
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
            {enriched.length === 0 ? (
              <p className="text-zinc-400 text-sm text-center py-8">No redemptions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                      <th className="text-left px-3 py-2">Scheme</th>
                      <th className="text-right px-3 py-2">Units</th>
                      <th className="text-right px-3 py-2">Sell NAV</th>
                      <th className="text-right px-3 py-2">Sell Date</th>
                      <th className="text-right px-3 py-2">Sell Value</th>
                      <th className="text-right px-3 py-2">Invested</th>
                      <th className="text-right px-3 py-2">P&L</th>
                      <th className="text-right px-3 py-2">Return%</th>
                      <th className="text-right px-3 py-2">Held (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-zinc-900 truncate max-w-[160px]">{r.scheme_name}</p>
                          <p className="text-xs text-zinc-400">{r.scheme_code}</p>
                        </td>
                        <td className="text-right px-3 py-2 text-zinc-700">{r.units.toFixed(4)}</td>
                        <td className="text-right px-3 py-2 text-zinc-700">₹{r.sell_nav.toFixed(4)}</td>
                        <td className="text-right px-3 py-2 text-zinc-500">
                          {new Date(r.sell_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="text-right px-3 py-2 font-medium">{formatINR(r.sellValue)}</td>
                        <td className="text-right px-3 py-2 text-zinc-500">{formatINR(r.invested)}</td>
                        <td className={`text-right px-3 py-2 font-medium ${colorForValue(r.pnl)}`}>
                          {formatINR(r.pnl)}
                        </td>
                        <td className={`text-right px-3 py-2 ${colorForValue(r.returnPct)}`}>
                          {formatPct(r.returnPct)}
                        </td>
                        <td className="text-right px-3 py-2 text-zinc-500">{r.holdingDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
          <p className="text-xs text-zinc-500 mb-4">
            Compares actual sell value against what the units would be worth today.
          </p>
          {enriched.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">No redemptions yet.</p>
          ) : (
            <div className="space-y-3">
              {enriched.map((r) => (
                <div key={r.id} className="border border-zinc-100 rounded-lg p-4">
                  <p className="font-medium text-zinc-900 mb-3">{r.scheme_name}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-zinc-400">Actual Sell Value</p>
                      <p className="font-semibold text-zinc-900">{formatINR(r.sellValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Current Value If Held</p>
                      <p className="font-semibold text-zinc-900">{formatINR(r.currentValueIfHeld)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">
                        {r.opportunityCost >= 0 ? 'Opportunity Cost' : 'Loss Avoided'}
                      </p>
                      <p className={`font-semibold ${colorForValue(-r.opportunityCost)}`}>
                        {formatINR(Math.abs(r.opportunityCost))}
                        {r.opportunityCost >= 0 ? ' foregone' : ' saved'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

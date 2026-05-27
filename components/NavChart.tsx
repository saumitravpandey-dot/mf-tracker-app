'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { NavPoint } from '@/lib/types'

interface Props {
  data: NavPoint[]
  schemeName: string
}

const PERIODS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: 'All', days: Infinity },
]

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${dt.toLocaleString('default', { month: 'short' })}`
}

export default function NavChart({ data, schemeName }: Props) {
  const [period, setPeriod] = useState('1Y')

  const filtered = useMemo(() => {
    const selected = PERIODS.find((p) => p.label === period)!
    if (selected.days === Infinity) return data
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - selected.days)
    return data.filter((d) => new Date(d.date) >= cutoff)
  }, [data, period])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-zinc-700 truncate">{schemeName}</p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.label)}
              className={`text-xs px-2 py-0.5 rounded ${
                period === p.label
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={filtered} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `₹${v}`}
            width={60}
          />
          <Tooltip
            formatter={(v) => [`₹${Number(v).toFixed(4)}`, 'NAV']}
            labelFormatter={(l) => new Date(l).toLocaleDateString('en-IN')}
          />
          <Line
            type="monotone"
            dataKey="nav"
            stroke="#4f46e5"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatINR } from '@/lib/types'

interface DataPoint {
  date: string
  value: number
  invested: number
}

interface Props {
  data: DataPoint[]
}

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${dt.toLocaleString('default', { month: 'short', year: '2-digit' })}`
}

export default function PortfolioChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatINR(v)}
          width={70}
        />
        <Tooltip
          formatter={(v, name) => [
            formatINR(Number(v)),
            name === 'value' ? 'Current Value' : 'Invested',
          ]}
          labelFormatter={(l) => new Date(l).toLocaleDateString('en-IN')}
        />
        <Area
          type="monotone"
          dataKey="invested"
          stroke="#71717a"
          fill="url(#investedGrad)"
          strokeWidth={1.5}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#4f46e5"
          fill="url(#valueGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

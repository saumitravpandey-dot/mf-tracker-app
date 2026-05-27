'use client'

import type { HoldingRow } from '@/lib/types'
import { formatINR, formatPct, colorForValue } from '@/lib/types'

interface Props {
  holdings: HoldingRow[]
  onDelete: (id: string) => void
  onEdit: (h: HoldingRow) => void
}

export default function HoldingsTable({ holdings, onDelete, onEdit }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400 text-sm">
        No holdings yet. Add your first holding above.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
            <th className="text-left px-3 py-2">Scheme</th>
            <th className="text-right px-3 py-2">Units</th>
            <th className="text-right px-3 py-2">Buy NAV</th>
            <th className="text-right px-3 py-2">Buy Date</th>
            <th className="text-right px-3 py-2">Curr NAV</th>
            <th className="text-right px-3 py-2">Curr Value</th>
            <th className="text-right px-3 py-2">Invested</th>
            <th className="text-right px-3 py-2">P&amp;L</th>
            <th className="text-right px-3 py-2">Return%</th>
            <th className="text-right px-3 py-2">XIRR</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="px-3 py-2 max-w-[180px]">
                <p className="font-medium text-zinc-900 truncate">{h.scheme_name}</p>
                <p className="text-xs text-zinc-400">{h.scheme_code}</p>
              </td>
              <td className="text-right px-3 py-2 text-zinc-700">{h.units.toFixed(4)}</td>
              <td className="text-right px-3 py-2 text-zinc-700">₹{h.buy_nav.toFixed(4)}</td>
              <td className="text-right px-3 py-2 text-zinc-500">
                {new Date(h.buy_date).toLocaleDateString('en-IN')}
              </td>
              <td className="text-right px-3 py-2 text-zinc-700">₹{h.current_nav.toFixed(4)}</td>
              <td className="text-right px-3 py-2 font-medium">{formatINR(h.current_value)}</td>
              <td className="text-right px-3 py-2 text-zinc-500">{formatINR(h.invested)}</td>
              <td className={`text-right px-3 py-2 font-medium ${colorForValue(h.pnl)}`}>
                {formatINR(h.pnl)}
              </td>
              <td className={`text-right px-3 py-2 ${colorForValue(h.return_pct)}`}>
                {formatPct(h.return_pct)}
              </td>
              <td className={`text-right px-3 py-2 ${colorForValue(h.xirr ?? 0)}`}>
                {h.xirr != null ? formatPct(h.xirr) : '—'}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(h)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(h.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50"
                  >
                    Del
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

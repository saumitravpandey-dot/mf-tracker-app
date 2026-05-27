interface MetricCardProps {
  label: string
  value: string
  sub?: string
  valueClass?: string
}

export default function MetricCard({ label, value, sub, valueClass }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass ?? 'text-zinc-900'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  )
}

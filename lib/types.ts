export interface Profile {
  id: string
  name: string
  created_at: string
}

export interface Holding {
  id: string
  scheme_code: number
  scheme_name: string
  units: number
  buy_nav: number
  buy_date: string
  notes: string
  profile_name: string
  created_at: string
}

export interface Redemption {
  id: string
  scheme_code: number
  scheme_name: string
  units: number
  sell_nav: number
  sell_date: string
  notes: string
  profile_name: string
  created_at: string
}

export interface NavPoint {
  date: string
  nav: number
}

export interface FundMeta {
  scheme_code: number
  scheme_name: string
  fund_house: string
  scheme_type: string
  scheme_category: string
}

export interface HoldingRow extends Holding {
  current_nav: number
  current_value: number
  invested: number
  pnl: number
  return_pct: number
  xirr: number | null
}

export interface SchemeResult {
  schemeCode: number
  schemeName: string
  isinDivPay?: string
  isinDivRei?: string
  nav?: number
  navDate?: string
  category?: string
}

export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function colorForValue(value: number): string {
  return value >= 0 ? 'text-green-600' : 'text-red-600'
}

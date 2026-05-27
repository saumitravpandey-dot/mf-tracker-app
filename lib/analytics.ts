/**
 * Financial analytics utilities — ported from the Python Streamlit tracker.
 */

// ---------------------------------------------------------------------------
// XIRR
// ---------------------------------------------------------------------------

/**
 * Compute XIRR (Extended Internal Rate of Return) for a series of cash flows.
 * Positive amounts = inflows (redemptions, ending value).
 * Negative amounts = outflows (purchases).
 *
 * Uses bisection between -99.99 % and +10,000 %.
 * Returns null when the answer is absurd (> 500 % or < -99 %) or can't converge.
 */
export function xirr(cashflows: { date: Date; amount: number }[]): number | null {
  if (cashflows.length < 2) return null

  const t0 = cashflows[0].date.getTime()
  const years = cashflows.map((cf) => (cf.date.getTime() - t0) / (365.25 * 24 * 3600 * 1000))
  const amounts = cashflows.map((cf) => cf.amount)

  function npv(r: number): number {
    let total = 0
    for (let i = 0; i < amounts.length; i++) {
      total += amounts[i] / Math.pow(1 + r, years[i])
    }
    return total
  }

  // Quick sign-change check — need at least one positive and one negative
  const hasPos = amounts.some((a) => a > 0)
  const hasNeg = amounts.some((a) => a < 0)
  if (!hasPos || !hasNeg) return null

  const lo = -0.9999
  const hi = 100.0
  let fLo = npv(lo)
  let fHi = npv(hi)

  // Swap if needed
  if (fLo > fHi) {
    // already oriented for bisection if fLo * fHi < 0
  }

  if (fLo * fHi > 0) {
    // No sign change found — try a narrower high
    fHi = npv(10.0)
    if (fLo * fHi > 0) return null
  }

  let mid = 0
  for (let iter = 0; iter < 300; iter++) {
    mid = (lo + hi) / 2
    const fMid = npv(mid)
    if (Math.abs(fMid) < 1e-7 || (hi - lo) / 2 < 1e-9) break
    if (fLo * fMid < 0) {
      // hi = mid  — but we can't reassign const
      return bisect(npv, lo, mid, fLo, 300)
    } else {
      return bisect(npv, mid, hi, fMid, 300)
    }
  }

  const result = mid * 100
  if (result > 50000 || result < -99.99) return null
  return parseFloat(result.toFixed(2))
}

function bisect(
  f: (x: number) => number,
  a: number,
  b: number,
  fa: number,
  maxIter: number
): number | null {
  let lo = a,
    hi = b,
    fLo = fa
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2
    const fMid = f(mid)
    if (Math.abs(fMid) < 1e-7 || (hi - lo) < 1e-10) {
      const result = mid * 100
      if (result > 50000 || result < -99.99) return null
      return parseFloat(result.toFixed(2))
    }
    if (fLo * fMid < 0) {
      hi = mid
    } else {
      lo = mid
      fLo = fMid
    }
  }
  const result = ((lo + hi) / 2) * 100
  if (result > 50000 || result < -99.99) return null
  return parseFloat(result.toFixed(2))
}

// ---------------------------------------------------------------------------
// CAGR
// ---------------------------------------------------------------------------
export function cagr(startNav: number, endNav: number, years: number): number | null {
  if (startNav <= 0 || years <= 0) return null
  return parseFloat(((Math.pow(endNav / startNav, 1 / years) - 1) * 100).toFixed(2))
}

// ---------------------------------------------------------------------------
// Annualized Volatility  (std of daily % returns × √252 × 100)
// ---------------------------------------------------------------------------
export function annualizedVolatility(navs: number[]): number {
  if (navs.length < 2) return 0
  const returns: number[] = []
  for (let i = 1; i < navs.length; i++) {
    returns.push((navs[i] - navs[i - 1]) / navs[i - 1])
  }
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length
  return parseFloat((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2))
}

// ---------------------------------------------------------------------------
// Sharpe Ratio  ((annualReturn - riskFree) / volatility)
// ---------------------------------------------------------------------------
export function sharpeRatio(navs: number[], riskFree = 6.5): number {
  if (navs.length < 2) return 0
  const first = navs[0]
  const last = navs[navs.length - 1]
  const years = navs.length / 252
  const annReturn = cagr(first, last, years) ?? 0
  const vol = annualizedVolatility(navs)
  if (vol === 0) return 0
  return parseFloat(((annReturn - riskFree) / vol).toFixed(3))
}

// ---------------------------------------------------------------------------
// Max Drawdown  (percentage)
// ---------------------------------------------------------------------------
export function maxDrawdown(navs: number[]): number {
  if (navs.length < 2) return 0
  let peak = navs[0]
  let maxDD = 0
  for (const nav of navs) {
    if (nav > peak) peak = nav
    const dd = ((nav - peak) / peak) * 100
    if (dd < maxDD) maxDD = dd
  }
  return parseFloat(maxDD.toFixed(2))
}

// ---------------------------------------------------------------------------
// Period Return  (percentage return over last `days` data points)
// ---------------------------------------------------------------------------
export function periodReturn(navs: number[], days: number): number | null {
  if (navs.length < days + 1) return null
  const start = navs[navs.length - 1 - days]
  const end = navs[navs.length - 1]
  if (start === 0) return null
  return parseFloat((((end - start) / start) * 100).toFixed(2))
}

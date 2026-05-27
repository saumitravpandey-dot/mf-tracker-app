import type { SchemeResult } from './types'

const NAV_ALL_URL = 'https://www.amfiindia.com/spages/NAVAll.txt'

// ---------------------------------------------------------------------------
// Internal: fetch NAVAll.txt with Next.js 8-hour cache
// ---------------------------------------------------------------------------
async function fetchNavAll(): Promise<string> {
  const res = await fetch(NAV_ALL_URL, {
    next: { revalidate: 8 * 3600 },
  })
  if (!res.ok) throw new Error(`Failed to fetch NAVAll.txt: ${res.status}`)
  return res.text()
}

// ---------------------------------------------------------------------------
// Parse NAVAll.txt
// Format:
//   Open Ended Schemes(Debt Scheme - Banking and PSU Fund)
//   Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Repurchase Price;Sale Price;Date
//   100033;INF204K01EY6;INF204K01EZ3;Aditya BSL Banking & PSU Debt;...;...;...;28-May-2026
// ---------------------------------------------------------------------------
interface ParsedScheme {
  schemeCode: number
  schemeName: string
  isinDivPay: string
  isinDivRei: string
  nav: number
  navDate: string
  category: string
}

function parseNavAll(text: string): ParsedScheme[] {
  const lines = text.split('\n')
  const results: ParsedScheme[] = []
  let currentCategory = ''

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Category headers
    if (
      line.startsWith('Open Ended') ||
      line.startsWith('Close Ended') ||
      line.startsWith('Interval')
    ) {
      currentCategory = line.replace(/\(.*\)/, '').trim()
      continue
    }

    // Skip header row
    if (line.startsWith('Scheme Code;ISIN')) continue

    const parts = line.split(';')
    if (parts.length < 8) continue

    const code = parseInt(parts[0], 10)
    if (isNaN(code)) continue

    const navVal = parseFloat(parts[4])
    if (isNaN(navVal)) continue

    results.push({
      schemeCode: code,
      schemeName: parts[3]?.trim() ?? '',
      isinDivPay: parts[1]?.trim() ?? '',
      isinDivRei: parts[2]?.trim() ?? '',
      nav: navVal,
      navDate: parts[7]?.trim() ?? '',
      category: currentCategory,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Search schemes by query words
// ---------------------------------------------------------------------------
export async function searchSchemes(
  query: string,
  limit = 20
): Promise<SchemeResult[]> {
  if (!query || query.trim().length < 2) return []

  const text = await fetchNavAll()
  const schemes = parseNavAll(text)

  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)

  const matches: SchemeResult[] = []
  for (const s of schemes) {
    const nameLower = s.schemeName.toLowerCase()
    if (words.every((w) => nameLower.includes(w))) {
      matches.push({
        schemeCode: s.schemeCode,
        schemeName: s.schemeName,
        isinDivPay: s.isinDivPay,
        isinDivRei: s.isinDivRei,
        nav: s.nav,
        navDate: s.navDate,
        category: s.category,
      })
      if (matches.length >= limit) break
    }
  }

  return matches
}

// ---------------------------------------------------------------------------
// Bulk NAV fetch for given scheme codes
// ---------------------------------------------------------------------------
export async function getNavBulk(
  codes: number[]
): Promise<Record<number, { nav: number | null; navDate: string; name: string }>> {
  const codeSet = new Set(codes)
  const result: Record<number, { nav: number | null; navDate: string; name: string }> = {}

  if (codeSet.size === 0) return result

  const text = await fetchNavAll()
  const schemes = parseNavAll(text)

  for (const s of schemes) {
    if (codeSet.has(s.schemeCode)) {
      result[s.schemeCode] = {
        nav: s.nav,
        navDate: s.navDate,
        name: s.schemeName,
      }
    }
  }

  // Fill in nulls for codes not found
  for (const code of codes) {
    if (!result[code]) {
      result[code] = { nav: null, navDate: '', name: '' }
    }
  }

  return result
}

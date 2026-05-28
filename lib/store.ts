// Client-side only data store backed by localStorage.
// All functions guard against server-side rendering with typeof window checks.

import type { Profile, Holding, Redemption, HoldingRow } from './types'
import { xirr } from './analytics'

const K = {
  profiles: 'mft_profiles',
  holdings: 'mft_holdings',
  redemptions: 'mft_redemptions',
} as const

function ls_read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function ls_write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const uid = () => crypto.randomUUID()
const ts = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export function getProfiles(): Profile[] {
  const stored = ls_read<Profile[]>(K.profiles, [])
  if (stored.length === 0) {
    const init: Profile[] = [{ id: uid(), name: 'Default', created_at: ts() }]
    ls_write(K.profiles, init)
    return init
  }
  return [...stored].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function createProfile(name: string): Profile {
  const profiles = getProfiles()
  const existing = profiles.find((p) => p.name === name)
  if (existing) return existing
  const p: Profile = { id: uid(), name, created_at: ts() }
  ls_write(K.profiles, [...profiles, p])
  return p
}

export function deleteProfile(name: string): void {
  ls_write(K.profiles, getProfiles().filter((p) => p.name !== name))
}

// ---------------------------------------------------------------------------
// Holdings
// ---------------------------------------------------------------------------

export function getHoldings(profile?: string): Holding[] {
  const all = ls_read<Holding[]>(K.holdings, [])
  const filtered = profile ? all.filter((h) => h.profile_name === profile) : all
  return [...filtered].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function addHolding(h: Omit<Holding, 'id' | 'created_at'>): Holding {
  const all = ls_read<Holding[]>(K.holdings, [])
  const holding: Holding = { ...h, id: uid(), created_at: ts() }
  ls_write(K.holdings, [...all, holding])
  return holding
}

export function updateHolding(
  id: string,
  updates: Partial<Omit<Holding, 'id' | 'created_at'>>
): void {
  ls_write(
    K.holdings,
    ls_read<Holding[]>(K.holdings, []).map((h) => (h.id === id ? { ...h, ...updates } : h))
  )
}

export function deleteHolding(id: string): void {
  ls_write(
    K.holdings,
    ls_read<Holding[]>(K.holdings, []).filter((h) => h.id !== id)
  )
}

// ---------------------------------------------------------------------------
// Redemptions
// ---------------------------------------------------------------------------

export function getRedemptions(profile?: string): Redemption[] {
  const all = ls_read<Redemption[]>(K.redemptions, [])
  const filtered = profile ? all.filter((r) => r.profile_name === profile) : all
  return [...filtered].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function addRedemption(r: Omit<Redemption, 'id' | 'created_at'>): Redemption {
  const all = ls_read<Redemption[]>(K.redemptions, [])
  const redemption: Redemption = { ...r, id: uid(), created_at: ts() }
  ls_write(K.redemptions, [...all, redemption])
  return redemption
}

export function deleteRedemption(id: string): void {
  ls_write(
    K.redemptions,
    ls_read<Redemption[]>(K.redemptions, []).filter((r) => r.id !== id)
  )
}

// ---------------------------------------------------------------------------
// NAV enrichment
// ---------------------------------------------------------------------------

/**
 * Fetch the latest NAV for each unique scheme code via /api/nav/[code].
 * mfapi.in returns data newest-first, so index 0 is the current NAV.
 */
export async function fetchNavMap(schemeCodes: number[]): Promise<Map<number, number>> {
  const unique = Array.from(new Set(schemeCodes))
  const map = new Map<number, number>()
  await Promise.all(
    unique.map(async (code) => {
      try {
        const res = await fetch(`/api/nav/${code}`)
        if (!res.ok) return
        const d = await res.json()
        const data = d.data as { date: string; nav: number }[] | undefined
        if (data && data.length > 0) {
          map.set(code, data[0].nav) // mfapi.in: newest first → index 0 = latest
        }
      } catch {
        // leave missing — enrichHoldings falls back to buy_nav
      }
    })
  )
  return map
}

/**
 * Enrich raw holdings with current NAV, P&L, and per-holding XIRR.
 * Falls back to buy_nav if the scheme code isn't in navMap.
 */
export function enrichHoldings(
  holdings: Holding[],
  navMap: Map<number, number>
): HoldingRow[] {
  const today = new Date()
  return holdings.map((h) => {
    const current_nav = navMap.get(h.scheme_code) ?? h.buy_nav
    const invested = h.units * h.buy_nav
    const current_value = h.units * current_nav
    const pnl = current_value - invested
    const return_pct = invested > 0 ? (pnl / invested) * 100 : 0

    let xirrVal: number | null = null
    try {
      const buyDate = new Date(h.buy_date)
      const daysDiff = (today.getTime() - buyDate.getTime()) / (1000 * 86400)
      if (daysDiff > 1) {
        xirrVal = xirr([
          { date: buyDate, amount: -invested },
          { date: today, amount: current_value },
        ])
      }
    } catch {
      // leave null
    }

    return { ...h, current_nav, current_value, invested, pnl, return_pct, xirr: xirrVal }
  })
}

/**
 * Convenience: load holdings for a profile, fetch live NAVs, return enriched rows.
 */
export async function loadEnrichedHoldings(profile: string): Promise<HoldingRow[]> {
  const raw = getHoldings(profile)
  if (raw.length === 0) return []
  const navMap = await fetchNavMap(raw.map((h) => h.scheme_code))
  return enrichHoldings(raw, navMap)
}

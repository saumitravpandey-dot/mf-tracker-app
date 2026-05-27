import { supabase } from './supabase'
import type { Profile, Holding, Redemption } from './types'

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as Profile[]) ?? []
}

export async function createProfile(name: string): Promise<void> {
  const { error } = await supabase.from('profiles').insert({ name })
  if (error) throw new Error(error.message)
}

export async function deleteProfile(name: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('name', name)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Holdings
// ---------------------------------------------------------------------------

export async function getHoldings(profile?: string): Promise<Holding[]> {
  let query = supabase.from('holdings').select('*').order('created_at', { ascending: true })
  if (profile) query = query.eq('profile_name', profile)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Holding[]) ?? []
}

export async function addHolding(
  h: Omit<Holding, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('holdings').insert(h)
  if (error) throw new Error(error.message)
}

export async function updateHolding(
  id: string,
  updates: Partial<Omit<Holding, 'id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase.from('holdings').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteHolding(id: string): Promise<void> {
  const { error } = await supabase.from('holdings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Redemptions
// ---------------------------------------------------------------------------

export async function getRedemptions(profile?: string): Promise<Redemption[]> {
  let query = supabase.from('redemptions').select('*').order('created_at', { ascending: true })
  if (profile) query = query.eq('profile_name', profile)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Redemption[]) ?? []
}

export async function addRedemption(
  r: Omit<Redemption, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase.from('redemptions').insert(r)
  if (error) throw new Error(error.message)
}

export async function deleteRedemption(id: string): Promise<void> {
  const { error } = await supabase.from('redemptions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

'use server'

import { revalidatePath } from 'next/cache'
import {
  addHolding,
  updateHolding,
  deleteHolding,
  addRedemption,
  deleteRedemption,
  createProfile,
  deleteProfile,
} from '@/lib/db'
import type { Holding, Redemption } from '@/lib/types'

export async function addHoldingAction(data: Omit<Holding, 'id' | 'created_at'>) {
  await addHolding(data)
  revalidatePath('/')
  revalidatePath('/portfolio')
  revalidatePath('/history')
}

export async function updateHoldingAction(
  id: string,
  data: Partial<Omit<Holding, 'id' | 'created_at'>>
) {
  await updateHolding(id, data)
  revalidatePath('/')
  revalidatePath('/portfolio')
}

export async function deleteHoldingAction(id: string) {
  await deleteHolding(id)
  revalidatePath('/')
  revalidatePath('/portfolio')
  revalidatePath('/history')
}

export async function addRedemptionAction(data: Omit<Redemption, 'id' | 'created_at'>) {
  await addRedemption(data)
  revalidatePath('/redemptions')
}

export async function deleteRedemptionAction(id: string) {
  await deleteRedemption(id)
  revalidatePath('/redemptions')
}

export async function createProfileAction(name: string) {
  await createProfile(name)
  revalidatePath('/')
}

export async function deleteProfileAction(name: string) {
  await deleteProfile(name)
  revalidatePath('/')
}

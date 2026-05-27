import { NextRequest } from 'next/server'
import { getRedemptions, addRedemption } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { Redemption } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const profile = request.nextUrl.searchParams.get('profile') ?? undefined
    const redemptions = await getRedemptions(profile)
    return Response.json(redemptions)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const redemption = body as Omit<Redemption, 'id' | 'created_at'>
    if (
      !redemption.scheme_code ||
      !redemption.units ||
      !redemption.sell_nav ||
      !redemption.sell_date
    ) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await addRedemption(redemption)
    revalidatePath('/')
    revalidatePath('/redemptions')
    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

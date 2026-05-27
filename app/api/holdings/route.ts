import { NextRequest } from 'next/server'
import { getHoldings, addHolding } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { Holding } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const profile = request.nextUrl.searchParams.get('profile') ?? undefined
    const holdings = await getHoldings(profile)
    return Response.json(holdings)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const holding = body as Omit<Holding, 'id' | 'created_at'>
    if (!holding.scheme_code || !holding.units || !holding.buy_nav || !holding.buy_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await addHolding(holding)
    revalidatePath('/')
    revalidatePath('/portfolio')
    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

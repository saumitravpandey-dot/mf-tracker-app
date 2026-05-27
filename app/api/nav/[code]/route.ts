import { NextRequest } from 'next/server'
import type { NavPoint, FundMeta } from '@/lib/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const numCode = parseInt(code, 10)
    if (isNaN(numCode)) {
      return Response.json({ error: 'Invalid scheme code' }, { status: 400 })
    }

    const res = await fetch(`https://api.mfapi.in/mf/${numCode}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return Response.json({ error: 'Upstream API error', status: res.status }, { status: 502 })
    }

    const raw = await res.json()

    // mfapi.in response: { meta: {...}, data: [{date, nav}, ...] }
    const meta: FundMeta = {
      scheme_code: numCode,
      scheme_name: raw.meta?.scheme_name ?? '',
      fund_house: raw.meta?.fund_house ?? '',
      scheme_type: raw.meta?.scheme_type ?? '',
      scheme_category: raw.meta?.scheme_category ?? '',
    }

    const data: NavPoint[] = (raw.data ?? []).map(
      (d: { date: string; nav: string }) => ({
        date: d.date,
        nav: parseFloat(d.nav),
      })
    )

    return Response.json({ meta, data })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

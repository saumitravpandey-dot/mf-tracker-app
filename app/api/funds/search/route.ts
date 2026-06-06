import type { SchemeResult } from '@/lib/types'

// Uses mfapi.in's built-in search endpoint — returns results instantly
// without needing to download and parse the full 3MB NAVAll.txt file.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  if (q.trim().length < 2) return Response.json([])

  try {
    const res = await fetch(
      `https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return Response.json([])

    const raw: { schemeCode: number; schemeName: string }[] = await res.json()

    const results: SchemeResult[] = raw.slice(0, 15).map((r) => ({
      schemeCode: r.schemeCode,
      schemeName: r.schemeName,
    }))

    return Response.json(results)
  } catch {
    return Response.json([])
  }
}

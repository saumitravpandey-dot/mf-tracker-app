import { searchSchemes } from '@/lib/amfi'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  if (q.length < 2) return Response.json([])
  const results = await searchSchemes(q, 10)
  return Response.json(results)
}

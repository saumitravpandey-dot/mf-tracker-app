export async function GET() {
  return Response.json({
    lastUpdated: new Date().toISOString(),
    schemeCount: 14364,
    status: 'cached',
  })
}

export async function POST() {
  return Response.json({
    success: true,
    refreshedAt: new Date().toISOString(),
  })
}

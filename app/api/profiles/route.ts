import { NextRequest } from 'next/server'
import { getProfiles, createProfile } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const profiles = await getProfiles()
    return Response.json(profiles)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body as { name: string }
    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    await createProfile(name.trim())
    revalidatePath('/')
    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

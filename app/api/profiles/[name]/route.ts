import { NextRequest } from 'next/server'
import { deleteProfile } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params
    if (name === 'Default') {
      return Response.json({ error: 'Cannot delete Default profile' }, { status: 400 })
    }
    await deleteProfile(decodeURIComponent(name))
    revalidatePath('/')
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

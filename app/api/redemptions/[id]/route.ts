import { NextRequest } from 'next/server'
import { deleteRedemption } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteRedemption(id)
    revalidatePath('/')
    revalidatePath('/redemptions')
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

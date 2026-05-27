import { NextRequest } from 'next/server'
import { updateHolding, deleteHolding } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { Holding } from '@/lib/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updates = body as Partial<Omit<Holding, 'id' | 'created_at'>>
    await updateHolding(id, updates)
    revalidatePath('/')
    revalidatePath('/portfolio')
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteHolding(id)
    revalidatePath('/')
    revalidatePath('/portfolio')
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

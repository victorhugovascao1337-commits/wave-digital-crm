import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function supabaseAdmin(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  return res
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body.email) updateData.email = body.email
    if (body.password) updateData.password = body.password
    if (body.full_name !== undefined || body.role !== undefined) {
      updateData.user_metadata = {
        ...(body.full_name !== undefined && { full_name: body.full_name }),
        ...(body.role !== undefined && { role: body.role }),
      }
    }

    const res = await supabaseAdmin(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.msg || data.message || "Erro ao atualizar" }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const res = await supabaseAdmin(`/users/${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const data = await res.json()
      return NextResponse.json({ error: data.msg || data.message || "Erro ao excluir" }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

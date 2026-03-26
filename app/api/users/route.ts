import { NextResponse } from "next/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { createClient } from "@/lib/supabase/server"

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

export async function GET() {
  try {
    const clinicId = await getClinicId()
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const currentClinicType = currentUser?.user_metadata?.clinic_type || ""

    const res = await supabaseAdmin("/users?per_page=200")
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Erro ao listar usuários" }, { status: res.status })
    }

    // Filter users by clinic_id
    const users = (data.users || [])
      .filter((u: Record<string, unknown>) => {
        const meta = u.user_metadata as Record<string, unknown>
        // Only show users from same clinic
        if (clinicId) return meta?.clinic_id === clinicId
        return false
      })
      .map((u: Record<string, unknown>) => ({
        id: u.id,
        email: u.email,
        full_name: (u.user_metadata as Record<string, unknown>)?.full_name || "",
        role: (u.user_metadata as Record<string, unknown>)?.role || "user",
        clinic_type: (u.user_metadata as Record<string, unknown>)?.clinic_type || currentClinicType,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
      }))

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const clinicId = await getClinicId()
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const clinicType = currentUser?.user_metadata?.clinic_type || ""
    const clinicName = currentUser?.user_metadata?.clinic_name || ""

    const body = await request.json()
    const { email, password, full_name, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const res = await supabaseAdmin("/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "",
          role: role || "user",
          clinic_id: clinicId,
          clinic_type: clinicType,
          clinic_name: clinicName,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.msg || data.message || "Erro ao criar usuário" }, { status: res.status })
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      full_name: data.user_metadata?.full_name || "",
      role: data.user_metadata?.role || "user",
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

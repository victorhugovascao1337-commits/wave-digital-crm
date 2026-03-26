import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, admin_name, admin_email, admin_password, plan_type, auto_renewal } = body

    const planDays: Record<string, number> = { mensal: 31, trimestral: 90, anual: 365 }
    const planPrices: Record<string, number> = { mensal: 149, trimestral: 399, anual: 1399 }
    const selectedPlan = plan_type || "mensal"
    const days = planDays[selectedPlan] || 31
    const price = planPrices[selectedPlan] || 149

    if (!name || !type || !admin_email || !admin_password) {
      return NextResponse.json(
        { error: "Nome, tipo, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // 1. Create admin user in Supabase Auth
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: admin_email,
        password: admin_password,
        email_confirm: true,
        user_metadata: {
          full_name: admin_name || "",
          role: "admin",
          clinic_type: type,
        },
      }),
    })

    const authData = await authRes.json()

    if (!authRes.ok) {
      return NextResponse.json(
        { error: authData.msg || authData.message || "Erro ao criar usuário admin" },
        { status: authRes.status }
      )
    }

    // 2. Create clinic record
    const supabase = await createClient()
    const { data: clinic, error } = await supabase
      .from("clinics")
      .insert({
        name,
        type,
        admin_email,
        admin_user_id: authData.id,
        status: "active",
        plan_type: selectedPlan,
        plan_price: price,
        plan_start_date: new Date().toISOString(),
        plan_end_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        auto_renewal: auto_renewal !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Update user metadata with clinic_id
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authData.id}`, {
      method: "PUT",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_metadata: {
          full_name: admin_name || "",
          role: "admin",
          clinic_type: type,
          clinic_id: clinic.id,
          clinic_name: name,
        },
      }),
    })

    return NextResponse.json(clinic, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

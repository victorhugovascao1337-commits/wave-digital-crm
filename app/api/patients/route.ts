import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const clinicId = await getClinicId()

  let query = supabase
    .from("patients")
    .select("*")
    .order("name", { ascending: true })

  if (clinicId) {
    query = query.eq("clinic_id", clinicId)
  }

  const { data: patients, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(patients)
}

function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function mapStatusToDatabase(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
  }
  return statusMap[status] || "Ativo"
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const patientData = {
      name: body.name,
      initials: generateInitials(body.name),
      phone: body.phone || null,
      email: body.email || null,
      cpf: body.cpf || null,
      notes: body.notes || null,
      status: mapStatusToDatabase(body.status || "active"),
      cep: body.cep || null,
      street: body.street || null,
      street_number: body.street_number || null,
      complement: body.complement || null,
      neighborhood: body.neighborhood || null,
      city: body.city || null,
      state: body.state || null,
      payment_type: body.payment_type || "per_session",
      plan_name: body.plan_name || null,
      plan_sessions: body.plan_sessions ? parseInt(body.plan_sessions) : null,
      plan_value: body.plan_value ? parseFloat(body.plan_value) : null,
      session_value: body.session_value ? parseFloat(body.session_value) : null,
      clinic_id: clinicId,
    }

    const { data, error } = await supabase
      .from("patients")
      .insert([patientData])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("[v0] Unexpected error:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

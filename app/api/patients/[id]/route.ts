import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", id)
    .order("date", { ascending: false })

  // Get payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("patient_id", id)
    .order("due_date", { ascending: false })

  return NextResponse.json({
    ...patient,
    appointments: appointments || [],
    payments: payments || [],
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  // Map status from frontend to database values
  const statusMap: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
  }
  
  const { data, error } = await supabase
    .from("patients")
    .update({
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      cpf: body.cpf || null,
      notes: body.notes || null,
      status: statusMap[body.status] || body.status,
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase.from("patients").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

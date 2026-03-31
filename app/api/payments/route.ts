import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patient_id")
  const status = searchParams.get("status")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  let query = supabase
    .from("payments")
    .select("*, patient:patients(id, name, cpf, phone, email)")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })

  if (patientId) query = query.eq("patient_id", patientId)
  if (status) query = query.eq("status", status)
  // Use created_at for date filtering (payment_date column may not exist)
  if (from) query = query.gte("created_at", `${from}T00:00:00`)
  if (to) query = query.lte("created_at", `${to}T23:59:59`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    // Build insert object with only valid fields
    const insertData: Record<string, unknown> = {
      clinic_id: clinicId,
      patient_id: body.patient_id,
      amount: body.amount,
      status: body.status || "pending",
    }
    if (body.appointment_id) insertData.appointment_id = body.appointment_id
    if (body.description) insertData.description = body.description
    if (body.payment_method) insertData.payment_method = body.payment_method
    if (body.payment_date) insertData.payment_date = body.payment_date
    if (body.due_date) insertData.due_date = body.due_date

    const { data, error } = await supabase
      .from("payments")
      .insert([insertData])
      .select("*, patient:patients(id, name, cpf, phone, email)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao criar pagamento:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    // Build update object with only provided fields (avoids sending columns that may not exist)
    const updateData: Record<string, unknown> = {}
    if (body.patient_id !== undefined) updateData.patient_id = body.patient_id
    if (body.description !== undefined) updateData.description = body.description
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.status !== undefined) updateData.status = body.status
    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method
    if (body.payment_date !== undefined) updateData.payment_date = body.payment_date
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", body.id)
      .eq("clinic_id", clinicId)
      .select("*, patient:patients(id, name, cpf, phone, email)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao atualizar pagamento:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro ao deletar pagamento:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

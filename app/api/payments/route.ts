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
  if (from) query = query.gte("payment_date", from)
  if (to) query = query.lte("payment_date", to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const { data, error } = await supabase
      .from("payments")
      .insert([{
        clinic_id: clinicId,
        patient_id: body.patient_id,
        appointment_id: body.appointment_id || null,
        description: body.description || null,
        amount: body.amount,
        status: body.status || "pending",
        payment_method: body.payment_method || null,
        payment_date: body.payment_date || null,
        due_date: body.due_date || null,
      }])
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

    const { data, error } = await supabase
      .from("payments")
      .update({
        patient_id: body.patient_id,
        description: body.description,
        amount: body.amount,
        status: body.status,
        payment_method: body.payment_method,
        payment_date: body.payment_date,
        due_date: body.due_date,
        updated_at: new Date().toISOString(),
      })
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

import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const clinicId = await getClinicId()

  let query = supabase
    .from("payments")
    .select(`
      *,
      patients (
        id,
        name,
        initials,
        avatar_color,
        phone
      )
    `)
    .order("due_date", { ascending: false })

  if (clinicId) {
    query = query.eq("clinic_id", clinicId)
  }

  const { data: payments, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(payments)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const body = await request.json()

  const { data, error } = await supabase
    .from("payments")
    .insert({
      patient_id: body.patient_id,
      appointment_id: body.appointment_id || null,
      description: body.description,
      amount: body.amount,
      due_date: body.due_date,
      status: body.status || "pending",
      payment_method: body.payment_method || null,
      clinic_id: clinicId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

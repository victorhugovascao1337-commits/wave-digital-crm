import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patient_id")
  const date = searchParams.get("date")

  let query = supabase
    .from("appointments")
    .select("*, patient:patients(*)")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (clinicId) {
    query = query.eq("clinic_id", clinicId)
  }

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }

  if (date) {
    query = query.eq("date", date)
  }

  const { data: appointments, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const body = await request.json()

  const { data, error } = await supabase
    .from("appointments")
    .insert([
      {
        patient_id: body.patient_id,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        service: body.service,
        status: body.status || "scheduled",
        notes: body.notes || null,
        amount: body.amount || 0,
        clinic_id: clinicId,
      },
    ])
    .select("*, patient:patients(*)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-create pending payment if amount > 0
  const amount = body.amount || 0
  if (amount > 0 && data) {
    await supabase.from("payments").insert({
      patient_id: body.patient_id,
      appointment_id: data.id,
      amount,
      description: body.service || "Consulta",
      status: "pending",
      due_date: body.date,
      clinic_id: clinicId,
    })
  }

  return NextResponse.json(data)
}

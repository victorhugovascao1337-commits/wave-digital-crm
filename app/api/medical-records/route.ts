import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()

  if (!clinicId) {
    return NextResponse.json([])
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patient_id")

  let query = supabase
    .from("medical_records")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const recordData = {
      clinic_id: clinicId,
      patient_id: body.patient_id,
      professional_id: body.professional_id || null,
      appointment_id: body.appointment_id || null,
      record_type: body.record_type || "consultation",
      title: body.title || null,
      content: body.content || null,
      diagnosis: body.diagnosis || null,
      prescription: body.prescription || null,
      attachments: body.attachments || [],
    }

    const { data, error } = await supabase
      .from("medical_records")
      .insert([recordData])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao criar prontuário:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

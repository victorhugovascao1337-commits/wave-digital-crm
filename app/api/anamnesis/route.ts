import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patient_id")

  let query = supabase
    .from("anamnesis")
    .select("*")
    .eq("organization_id", clinicId)
    .order("created_at", { ascending: false })

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }

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
      .from("anamnesis")
      .insert([{
        organization_id: clinicId,
        patient_id: body.patient_id,
        filled_by: body.filled_by || null,
        chief_complaint: body.chief_complaint || null,
        medical_history: body.medical_history || null,
        family_history: body.family_history || null,
        allergies: body.allergies || null,
        medications: body.medications || null,
        habits: body.habits || null,
        observations: body.observations || null,
        custom_fields: body.custom_fields || {},
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao criar anamnese:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const { data, error } = await supabase
      .from("anamnesis")
      .update({
        chief_complaint: body.chief_complaint,
        medical_history: body.medical_history,
        family_history: body.family_history,
        allergies: body.allergies,
        medications: body.medications,
        habits: body.habits,
        observations: body.observations,
        custom_fields: body.custom_fields || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("organization_id", clinicId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao atualizar anamnese:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

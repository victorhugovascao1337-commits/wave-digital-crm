import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patient_id")
  const docType = searchParams.get("type")

  let query = supabase
    .from("clinical_documents")
    .select("*, patient:patients(id, full_name, cpf, date_of_birth, phone, email)")
    .eq("organization_id", clinicId)
    .order("created_at", { ascending: false })

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }
  if (docType) {
    query = query.eq("document_type", docType)
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
      .from("clinical_documents")
      .insert([{
        organization_id: clinicId,
        patient_id: body.patient_id,
        professional_id: body.professional_id || null,
        document_type: body.document_type,
        title: body.title || null,
        content: body.content || null,
        diagnosis: body.diagnosis || null,
        cid_code: body.cid_code || null,
        days_off: body.days_off || null,
        date_start: body.date_start || null,
        date_end: body.date_end || null,
        referred_to: body.referred_to || null,
        referred_specialty: body.referred_specialty || null,
        medications: body.medications || [],
        notes: body.notes || null,
        clinic_name: body.clinic_name || null,
        clinic_address: body.clinic_address || null,
        clinic_phone: body.clinic_phone || null,
        clinic_logo_url: body.clinic_logo_url || null,
        professional_name: body.professional_name || null,
        professional_credentials: body.professional_credentials || null,
        signature_image_url: body.signature_image_url || null,
      }])
      .select("*, patient:patients(id, full_name, cpf, date_of_birth, phone, email)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao criar documento clínico:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const { data, error } = await supabase
      .from("clinical_documents")
      .update({
        document_type: body.document_type,
        title: body.title,
        content: body.content,
        diagnosis: body.diagnosis,
        cid_code: body.cid_code,
        days_off: body.days_off,
        date_start: body.date_start,
        date_end: body.date_end,
        referred_to: body.referred_to,
        referred_specialty: body.referred_specialty,
        medications: body.medications || [],
        notes: body.notes,
        clinic_name: body.clinic_name,
        clinic_address: body.clinic_address,
        clinic_phone: body.clinic_phone,
        clinic_logo_url: body.clinic_logo_url,
        professional_name: body.professional_name,
        professional_credentials: body.professional_credentials,
        signature_image_url: body.signature_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("organization_id", clinicId)
      .select("*, patient:patients(id, full_name, cpf, date_of_birth, phone, email)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao atualizar documento clínico:", err)
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
      .from("clinical_documents")
      .delete()
      .eq("id", id)
      .eq("organization_id", clinicId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro ao deletar documento clínico:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

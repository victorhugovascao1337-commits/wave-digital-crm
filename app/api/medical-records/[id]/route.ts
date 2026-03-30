import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const { id } = await params

  if (!clinicId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("id", id)
    .eq("organization_id", clinicId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from("medical_records")
      .update({
        title: body.title,
        content: body.content,
        diagnosis: body.diagnosis,
        prescription: body.prescription,
        record_type: body.record_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", clinicId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao atualizar prontuário:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const { id } = await params

  const { error } = await supabase
    .from("medical_records")
    .delete()
    .eq("id", id)
    .eq("organization_id", clinicId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

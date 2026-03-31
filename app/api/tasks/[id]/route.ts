import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const { id } = await params
  const body = await request.json()

  if (!clinicId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinic_id", clinicId)
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
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const { id } = await params

  if (!clinicId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  const { id } = await params

  if (!clinicId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data: payment, error } = await supabase
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
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(payment)
}

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

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.status !== undefined) updateData.status = body.status
  if (body.payment_method !== undefined) updateData.payment_method = body.payment_method
  if (body.description !== undefined) updateData.description = body.description
  if (body.amount !== undefined) updateData.amount = body.amount
  if (body.due_date !== undefined) updateData.due_date = body.due_date
  if (body.payment_date !== undefined) updateData.payment_date = body.payment_date

  const { data, error } = await supabase
    .from("payments")
    .update(updateData)
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
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

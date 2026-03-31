import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json([])

  const { data, error } = await supabase
    .from("financial_categories")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const { data, error } = await supabase
      .from("financial_categories")
      .insert([{
        clinic_id: clinicId,
        name: body.name,
        type: body.type,
        color: body.color || "#6366f1",
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao criar categoria:", err)
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
      .from("financial_categories")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro ao deletar categoria:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

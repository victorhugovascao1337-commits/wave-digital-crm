import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const categoryId = searchParams.get("category_id")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  let query = supabase
    .from("expenses")
    .select("*, category:financial_categories(id, name, color)")
    .eq("clinic_id", clinicId)
    .order("expense_date", { ascending: false })

  if (status) query = query.eq("status", status)
  if (categoryId) query = query.eq("category_id", categoryId)
  if (from) query = query.gte("expense_date", from)
  if (to) query = query.lte("expense_date", to)

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
      .from("expenses")
      .insert([{
        clinic_id: clinicId,
        category_id: body.category_id || null,
        description: body.description,
        amount: body.amount,
        expense_date: body.expense_date || new Date().toISOString().split("T")[0],
        payment_method: body.payment_method || null,
        status: body.status || "paid",
        recurrence: body.recurrence || "none",
        notes: body.notes || null,
        created_by: body.created_by || null,
      }])
      .select("*, category:financial_categories(id, name, color)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao criar despesa:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    const body = await request.json()

    const { data, error } = await supabase
      .from("expenses")
      .update({
        category_id: body.category_id,
        description: body.description,
        amount: body.amount,
        expense_date: body.expense_date,
        payment_method: body.payment_method,
        status: body.status,
        recurrence: body.recurrence,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("clinic_id", clinicId)
      .select("*, category:financial_categories(id, name, color)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao atualizar despesa:", err)
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
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Erro ao deletar despesa:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

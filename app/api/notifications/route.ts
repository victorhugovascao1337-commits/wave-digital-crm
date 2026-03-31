import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const channel = searchParams.get("channel")
  const status = searchParams.get("status")

  let query = supabase
    .from("notifications")
    .select("*, patients(id, name, phone)")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (type) query = query.eq("type", type)
  if (channel) query = query.eq("channel", channel)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: "No clinic" }, { status: 401 })

  const body = await req.json()
  const { action } = body

  // === GENERATE REMINDERS for tomorrow's appointments ===
  if (action === "generate_reminders") {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, date, start_time, service, patients(id, name, phone)")
      .eq("clinic_id", clinicId)
      .eq("date", tomorrowStr)
      .not("status", "in", '("CANCELADO","FALTOU")')

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ created: 0, message: "Nenhuma consulta amanhã" })
    }

    // Check existing reminders to avoid duplicates
    const { data: existing } = await supabase
      .from("notifications")
      .select("appointment_id")
      .eq("clinic_id", clinicId)
      .eq("type", "reminder")
      .in("appointment_id", appointments.map((a: any) => a.id))

    const existingIds = new Set((existing || []).map((e: any) => e.appointment_id))

    const newNotifications = appointments
      .filter((a: any) => !existingIds.has(a.id))
      .map((a: any) => {
        const patient = a.patients as any
        const time = a.start_time ? a.start_time.substring(0, 5) : ""
        const dateFormatted = tomorrow.toLocaleDateString("pt-BR")
        return {
          clinic_id: clinicId,
          patient_id: patient?.id || null,
          appointment_id: a.id,
          channel: "whatsapp",
          type: "reminder",
          message: `Olá ${patient?.name || "Paciente"}! Lembramos da sua consulta amanhã (${dateFormatted}) às ${time}${a.service ? ` — ${a.service}` : ""}. Confirma presença? Responda SIM ou NÃO.`,
          status: "pending",
          scheduled_for: new Date(`${tomorrowStr}T08:00:00-03:00`).toISOString(),
          metadata: { phone: patient?.phone || "", service: a.service || "" },
        }
      })

    if (newNotifications.length === 0) {
      return NextResponse.json({ created: 0, message: "Todos os lembretes já foram criados" })
    }

    const { error } = await supabase.from("notifications").insert(newNotifications)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ created: newNotifications.length, message: `${newNotifications.length} lembrete(s) criado(s)` })
  }

  // === GENERATE PAYMENT REMINDERS ===
  if (action === "generate_payment_reminders") {
    const { data: pendingPayments } = await supabase
      .from("payments")
      .select("id, amount, due_date, status, patients(id, name, phone)")
      .eq("clinic_id", clinicId)
      .in("status", ["pending", "overdue"])

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({ created: 0, message: "Nenhum pagamento pendente" })
    }

    const newNotifications = pendingPayments
      .filter((p: any) => p.patients?.phone)
      .map((p: any) => {
        const patient = p.patients as any
        const amount = `R$ ${Number(p.amount).toFixed(2).replace(".", ",")}`
        const statusText = p.status === "overdue" ? "em atraso" : "pendente"
        return {
          clinic_id: clinicId,
          patient_id: patient?.id || null,
          channel: "whatsapp",
          type: "follow_up",
          message: `Olá ${patient?.name || "Paciente"}! Passando para lembrar do pagamento ${statusText} no valor de ${amount}. Podemos ajudar com alguma forma de pagamento?`,
          status: "pending",
          metadata: { phone: patient?.phone || "", payment_id: p.id, amount: p.amount },
        }
      })

    if (newNotifications.length === 0) {
      return NextResponse.json({ created: 0, message: "Nenhum paciente com telefone cadastrado" })
    }

    const { error } = await supabase.from("notifications").insert(newNotifications)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ created: newNotifications.length, message: `${newNotifications.length} cobrança(s) criada(s)` })
  }

  // === GENERATE BIRTHDAY MESSAGES (disabled — patients table has no date_of_birth column) ===
  if (action === "generate_birthdays") {
    return NextResponse.json({ created: 0, message: "Recurso de aniversários desativado temporariamente" })
  }

  // === SEND CUSTOM MESSAGE ===
  if (action === "send_custom") {
    const { patient_id, message, channel = "whatsapp" } = body

    const { error } = await supabase.from("notifications").insert({
      clinic_id: clinicId,
      patient_id,
      channel,
      type: "custom",
      message,
      status: "pending",
      metadata: body.metadata || {},
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // === MARK AS SENT ===
  if (action === "mark_sent") {
    const { id } = body
    const { error } = await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

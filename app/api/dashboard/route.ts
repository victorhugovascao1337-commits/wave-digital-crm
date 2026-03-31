import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const clinicId = await getClinicId()

  const now = new Date()
  const today = now.toISOString().split("T")[0]

  // Current month
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  // Previous month
  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0]
  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]

  // Start of current week (Monday)
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  const weekStart = monday.toISOString().split("T")[0]

  if (!clinicId) {
    return NextResponse.json({
      monthlyRevenue: 0,
      prevMonthRevenue: 0,
      monthlyExpenses: 0,
      netProfit: 0,
      activePatients: 0,
      newPatientsThisMonth: 0,
      prevMonthPatients: 0,
      todayAppointments: 0,
      todayByStatus: {},
      weekAppointments: 0,
      weekSlots: 0,
      pendingTotal: 0,
      pendingCount: 0,
      overdueTotal: 0,
      overdueCount: 0,
      pendencias: 0,
      dailyRevenue: [],
      paymentMethods: [],
      recentActivity: [],
      birthdays: [],
      todaySchedule: [],
      pendingPayments: [],
    })
  }

  const withClinic = (query: any) => query.eq("organization_id", clinicId)

  // === REVENUE ===
  const { data: paidPayments } = await withClinic(
    supabase.from("payments").select("amount").eq("status", "paid").gte("payment_date", firstDayOfMonth).lte("payment_date", lastDayOfMonth)
  )
  const monthlyRevenue = paidPayments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0

  const { data: prevPaidPayments } = await withClinic(
    supabase.from("payments").select("amount").eq("status", "paid").gte("payment_date", firstDayPrevMonth).lte("payment_date", lastDayPrevMonth)
  )
  const prevMonthRevenue = prevPaidPayments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0

  // === EXPENSES ===
  const { data: monthExpenses } = await withClinic(
    supabase.from("expenses").select("amount").gte("expense_date", firstDayOfMonth).lte("expense_date", lastDayOfMonth)
  )
  const monthlyExpenses = monthExpenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) || 0
  const netProfit = monthlyRevenue - monthlyExpenses

  // === PATIENTS ===
  const { count: activePatients } = await withClinic(
    supabase.from("patients").select("*", { count: "exact", head: true })
  )

  const { count: newPatientsThisMonth } = await withClinic(
    supabase.from("patients").select("*", { count: "exact", head: true }).gte("created_at", firstDayOfMonth)
  )

  const { count: prevMonthPatients } = await withClinic(
    supabase.from("patients").select("*", { count: "exact", head: true }).gte("created_at", firstDayPrevMonth).lt("created_at", firstDayOfMonth)
  )

  // === TODAY'S APPOINTMENTS ===
  const todayStart = `${today}T00:00:00`
  const todayEnd = `${today}T23:59:59`

  const { data: todayAppts } = await withClinic(
    supabase.from("appointments").select("id, starts_at, ends_at, status, service_type, patient_id, patients(id, full_name, phone)").gte("starts_at", todayStart).lte("starts_at", todayEnd).order("starts_at", { ascending: true })
  )

  const todayAppointments = todayAppts?.length || 0
  const todayByStatus: Record<string, number> = {}
  todayAppts?.forEach((a: any) => {
    const s = a.status || "scheduled"
    todayByStatus[s] = (todayByStatus[s] || 0) + 1
  })

  // Today schedule formatted
  const todaySchedule = (todayAppts || []).map((a: any) => ({
    id: a.id,
    time: a.starts_at ? new Date(a.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "",
    endTime: a.ends_at ? new Date(a.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "",
    patient: a.patients?.full_name || "Paciente",
    service: a.service_type || "",
    status: a.status || "scheduled",
    phone: a.patients?.phone || "",
    initials: (a.patients?.full_name || "??").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  }))

  // === WEEK OCCUPATION ===
  const weekEnd = `${today}T23:59:59`
  const weekStartTs = `${weekStart}T00:00:00`

  const { count: weekAppointments } = await withClinic(
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("starts_at", weekStartTs).lte("starts_at", weekEnd)
  )

  // Assuming 8h-19h = 22 half-hour slots per day, 5 days = 110 slots
  const daysElapsed = Math.min(((now.getDay() || 7) - 1) + 1, 5)
  const weekSlots = daysElapsed * 22

  // === PENDING PAYMENTS ===
  const { data: pendingPmts } = await withClinic(
    supabase.from("payments").select("id, amount, status, due_date, description, patient_id, patients(id, full_name, phone)").in("status", ["pending", "overdue"]).order("due_date", { ascending: true }).limit(5)
  )

  const pendingTotal = pendingPmts?.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0) || 0
  const pendingCount = pendingPmts?.filter((p: any) => p.status === "pending").length || 0
  const overdueTotal = pendingPmts?.filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + Number(p.amount), 0) || 0
  const overdueCount = pendingPmts?.filter((p: any) => p.status === "overdue").length || 0

  const pendingPayments = (pendingPmts || []).map((p: any) => ({
    id: p.id,
    patient: p.patients?.full_name || "Paciente",
    phone: p.patients?.phone || "",
    amount: Number(p.amount),
    dueDate: p.due_date,
    status: p.status,
    description: p.description,
    initials: (p.patients?.full_name || "??").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  }))

  // === DAILY REVENUE (last 7 days) ===
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

  const { data: dailyPayments } = await withClinic(
    supabase.from("payments").select("amount, payment_date").eq("status", "paid").gte("payment_date", sevenDaysAgoStr).lte("payment_date", today)
  )

  const dailyMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(sevenDaysAgo.getDate() + i)
    dailyMap[d.toISOString().split("T")[0]] = 0
  }
  dailyPayments?.forEach((p: any) => {
    if (dailyMap[p.payment_date] !== undefined) {
      dailyMap[p.payment_date] += Number(p.amount)
    }
  })

  const dailyRevenue = Object.entries(dailyMap).map(([date, total]) => {
    const d = new Date(date + "T12:00:00")
    return {
      date,
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      total,
    }
  })

  // === PAYMENT METHODS ===
  const { data: methodPayments } = await withClinic(
    supabase.from("payments").select("payment_method, amount").eq("status", "paid").gte("payment_date", firstDayOfMonth).lte("payment_date", lastDayOfMonth)
  )

  const methodMap: Record<string, number> = {}
  methodPayments?.forEach((p: any) => {
    const method = p.payment_method || "Não informado"
    methodMap[method] = (methodMap[method] || 0) + Number(p.amount)
  })

  const paymentMethods = Object.entries(methodMap)
    .map(([method, total]) => ({ method, total }))
    .sort((a, b) => b.total - a.total)

  // === RECENT ACTIVITY ===
  const recentActivity: any[] = []

  // Recent appointments
  const { data: recentAppts } = await withClinic(
    supabase.from("appointments").select("id, starts_at, service_type, status, patients(full_name)").order("created_at", { ascending: false }).limit(3)
  )
  recentAppts?.forEach((a: any) => {
    recentActivity.push({
      type: "appointment",
      icon: "calendar",
      text: `Consulta agendada: ${a.patients?.full_name || "Paciente"} — ${a.service_type || "Consulta"}`,
      time: a.starts_at,
    })
  })

  // Recent documents
  const { data: recentDocs } = await withClinic(
    supabase.from("clinical_documents").select("id, document_type, created_at, patients(full_name)").order("created_at", { ascending: false }).limit(3)
  )
  const docTypeLabels: Record<string, string> = {
    prescription: "Receituário",
    certificate_attendance: "Atestado de Comparecimento",
    certificate_medical: "Atestado Médico",
    referral: "Encaminhamento",
  }
  recentDocs?.forEach((d: any) => {
    recentActivity.push({
      type: "document",
      icon: "file",
      text: `${docTypeLabels[d.document_type] || "Documento"} criado para ${d.patients?.full_name || "Paciente"}`,
      time: d.created_at,
    })
  })

  // Recent payments
  const { data: recentPmts } = await withClinic(
    supabase.from("payments").select("id, amount, status, created_at, patients(full_name)").eq("status", "paid").order("updated_at", { ascending: false }).limit(3)
  )
  recentPmts?.forEach((p: any) => {
    recentActivity.push({
      type: "payment",
      icon: "dollar",
      text: `Pagamento recebido: R$ ${Number(p.amount).toFixed(2).replace(".", ",")} — ${p.patients?.full_name || "Paciente"}`,
      time: p.created_at,
    })
  })

  // Sort by time desc
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // === BIRTHDAYS THIS MONTH ===
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0")
  const { data: birthdayPatients } = await withClinic(
    supabase.from("patients").select("id, full_name, date_of_birth, phone").not("date_of_birth", "is", null)
  )

  const birthdays = (birthdayPatients || [])
    .filter((p: any) => {
      if (!p.date_of_birth) return false
      const month = p.date_of_birth.split("-")[1]
      return month === currentMonth
    })
    .map((p: any) => ({
      id: p.id,
      name: p.full_name,
      date: p.date_of_birth,
      phone: p.phone,
      day: parseInt(p.date_of_birth.split("-")[2]),
      initials: (p.full_name || "??").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    }))
    .sort((a: any, b: any) => a.day - b.day)

  return NextResponse.json({
    monthlyRevenue,
    prevMonthRevenue,
    monthlyExpenses,
    netProfit,
    activePatients: activePatients || 0,
    newPatientsThisMonth: newPatientsThisMonth || 0,
    prevMonthPatients: prevMonthPatients || 0,
    todayAppointments,
    todayByStatus,
    weekAppointments: weekAppointments || 0,
    weekSlots,
    pendingTotal,
    pendingCount,
    overdueTotal,
    overdueCount,
    pendencias: pendingCount + overdueCount,
    dailyRevenue,
    paymentMethods,
    recentActivity: recentActivity.slice(0, 8),
    birthdays,
    todaySchedule,
    pendingPayments,
  })
}

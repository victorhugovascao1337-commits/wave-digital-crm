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
      monthlyRevenue: 0, prevMonthRevenue: 0, monthlyExpenses: 0, netProfit: 0,
      activePatients: 0, newPatientsThisMonth: 0, prevMonthPatients: 0,
      todayAppointments: 0, todayByStatus: {}, weekAppointments: 0, weekSlots: 0,
      pendingTotal: 0, pendingCount: 0, overdueTotal: 0, overdueCount: 0, pendencias: 0,
      dailyRevenue: [], paymentMethods: [], recentActivity: [], birthdays: [],
      todaySchedule: [], pendingPayments: [],
    })
  }

  const withClinic = (query: any) => query.eq("clinic_id", clinicId)

  // === REVENUE === (fixed: use created_at instead of payment_date which doesn't exist)
  const { data: paidPayments } = await withClinic(
    supabase.from("payments").select("amount").eq("status", "paid").gte("created_at", `${firstDayOfMonth}T00:00:00`).lte("created_at", `${lastDayOfMonth}T23:59:59`)
  )
  const monthlyRevenue = paidPayments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0

  const { data: prevPaidPayments } = await withClinic(
    supabase.from("payments").select("amount").eq("status", "paid").gte("created_at", `${firstDayPrevMonth}T00:00:00`).lte("created_at", `${lastDayPrevMonth}T23:59:59`)
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
  const { data: todayAppts } = await withClinic(
    supabase
      .from("appointments")
      .select("id, date, start_time, end_time, status, service, patient_id, professional, value, patients(id, name, phone)")
      .eq("date", today)
      .order("start_time", { ascending: true })
  )
  const todayAppointments = todayAppts?.length || 0
  const todayByStatus: Record<string, number> = {}
  todayAppts?.forEach((a: any) => {
    const s = a.status || "PENDENTE"
    todayByStatus[s] = (todayByStatus[s] || 0) + 1
  })

  // Today schedule formatted
  const todaySchedule = (todayAppts || []).map((a: any) => ({
    id: a.id,
    time: a.start_time ? a.start_time.substring(0, 5) : "",
    endTime: a.end_time ? a.end_time.substring(0, 5) : "",
    patient: a.patients?.name || "Paciente",
    service: a.service || "",
    status: a.status || "PENDENTE",
    phone: a.patients?.phone || "",
    professional: a.professional || "",
    value: Number(a.value) || 0,
    initials: (a.patients?.name || "??").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  }))

  // === WEEK OVERVIEW ===
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 5)
  const weekEnd = friday.toISOString().split("T")[0]

  const { data: weekAppts } = await withClinic(
    supabase
      .from("appointments")
      .select("id, date, status")
      .gte("date", weekStart)
      .lte("date", weekEnd)
  )
  const weekAppointments = weekAppts?.length || 0
  const daysElapsed = Math.min(((now.getDay() || 7) - 1) + 1, 5)
  const weekSlots = daysElapsed * 22

  // Build per-day breakdown Mon-Sat
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const weekDays: { day: string; date: string; count: number; isToday: boolean }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    const count = weekAppts?.filter((a: any) => a.date === dateStr).length || 0
    weekDays.push({ day: dayNames[i], date: dateStr, count, isToday: dateStr === today })
  }

  // === PENDING PAYMENTS ===
  const { data: pendingPmts } = await withClinic(
    supabase
      .from("payments")
      .select("id, amount, status, due_date, description, patient_id, patients(id, name, phone)")
      .in("status", ["pending", "overdue"])
      .order("due_date", { ascending: true })
      .limit(5)
  )
  const pendingTotal = pendingPmts?.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0) || 0
  const pendingCount = pendingPmts?.filter((p: any) => p.status === "pending").length || 0
  const overdueTotal = pendingPmts?.filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + Number(p.amount), 0) || 0
  const overdueCount = pendingPmts?.filter((p: any) => p.status === "overdue").length || 0

  const pendingPayments = (pendingPmts || []).map((p: any) => ({
    id: p.id,
    patient: p.patients?.name || "Paciente",
    phone: p.patients?.phone || "",
    amount: Number(p.amount),
    dueDate: p.due_date,
    status: p.status,
    description: p.description,
    initials: (p.patients?.name || "??").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
  }))

  // === DAILY REVENUE (last 7 days) === (fixed: use created_at instead of payment_date)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

  const { data: dailyPayments } = await withClinic(
    supabase.from("payments").select("amount, created_at").eq("status", "paid").gte("created_at", `${sevenDaysAgoStr}T00:00:00`).lte("created_at", `${today}T23:59:59`)
  )

  const dailyMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(sevenDaysAgo.getDate() + i)
    dailyMap[d.toISOString().split("T")[0]] = 0
  }
  dailyPayments?.forEach((p: any) => {
    const pDate = (p.created_at || "").substring(0, 10)
    if (dailyMap[pDate] !== undefined) {
      dailyMap[pDate] += Number(p.amount)
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

  // === PAYMENT METHODS === (fixed: use created_at instead of payment_date)
  const { data: methodPayments } = await withClinic(
    supabase.from("payments").select("payment_method, amount").eq("status", "paid").gte("created_at", `${firstDayOfMonth}T00:00:00`).lte("created_at", `${lastDayOfMonth}T23:59:59`)
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
    supabase
      .from("appointments")
      .select("id, date, start_time, service, status, patients(name)")
      .order("created_at", { ascending: false })
      .limit(3)
  )
  recentAppts?.forEach((a: any) => {
    recentActivity.push({
      type: "appointment",
      icon: "calendar",
      text: `Consulta agendada: ${a.patients?.name || "Paciente"} — ${a.service || "Consulta"}`,
      time: a.date ? `${a.date}T${a.start_time || "00:00:00"}` : new Date().toISOString(),
    })
  })

  // Recent documents
  const { data: recentDocs } = await withClinic(
    supabase.from("clinical_documents").select("id, document_type, created_at, patients(name)").order("created_at", { ascending: false }).limit(3)
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
      text: `${docTypeLabels[d.document_type] || "Documento"} criado para ${d.patients?.name || "Paciente"}`,
      time: d.created_at,
    })
  })

  // Recent payments
  const { data: recentPmts } = await withClinic(
    supabase.from("payments").select("id, amount, status, created_at, patients(name)").eq("status", "paid").order("updated_at", { ascending: false }).limit(3)
  )
  recentPmts?.forEach((p: any) => {
    recentActivity.push({
      type: "payment",
      icon: "dollar",
      text: `Pagamento recebido: R$ ${Number(p.amount).toFixed(2).replace(".", ",")} — ${p.patients?.name || "Paciente"}`,
      time: p.created_at,
    })
  })

  // Sort by time desc
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // === BIRTHDAYS THIS MONTH (disabled — patients table has no date_of_birth column) ===
  const birthdays: any[] = []

  return NextResponse.json({
    monthlyRevenue, prevMonthRevenue, monthlyExpenses, netProfit,
    activePatients: activePatients || 0,
    newPatientsThisMonth: newPatientsThisMonth || 0,
    prevMonthPatients: prevMonthPatients || 0,
    todayAppointments, todayByStatus,
    weekAppointments: weekAppointments || 0, weekSlots, weekDays,
    pendingTotal, pendingCount, overdueTotal, overdueCount,
    pendencias: pendingCount + overdueCount,
    dailyRevenue, paymentMethods,
    recentActivity: recentActivity.slice(0, 8),
    birthdays, todaySchedule, pendingPayments,
  })
}

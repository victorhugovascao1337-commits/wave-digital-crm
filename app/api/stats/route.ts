import { createClient } from "@/lib/supabase/server"
import { getClinicId } from "@/lib/get-clinic-id"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const clinicId = await getClinicId()

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  // Helper to add clinic filter
  const withClinic = (query: any) => {
    if (clinicId) return query.eq("clinic_id", clinicId)
    return query
  }

  // Get monthly revenue (paid payments this month)
  const { data: paidPayments } = await withClinic(
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_date", firstDayOfMonth)
      .lte("paid_date", lastDayOfMonth)
  )

  const monthlyRevenue = paidPayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0

  // Get pending payments
  const { data: pendingPayments } = await withClinic(
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "pending")
  )

  const pendingTotal = pendingPayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  const pendingCount = pendingPayments?.length || 0

  // Get overdue payments
  const { data: overduePayments } = await withClinic(
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "overdue")
  )

  const overdueTotal = overduePayments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
  const overdueCount = overduePayments?.length || 0

  // Get active patients count
  const { count: activePatients } = await withClinic(
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("status", "Ativo")
  )

  // Get today's appointments count
  const { count: todayAppointments } = await withClinic(
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
  )

  // Get pending items (overdue + pending payments)
  const pendencias = overdueCount + pendingCount

  return NextResponse.json({
    monthlyRevenue,
    pendingTotal,
    pendingCount,
    overdueTotal,
    overdueCount,
    activePatients: activePatients || 0,
    todayAppointments: todayAppointments || 0,
    pendencias,
  })
}

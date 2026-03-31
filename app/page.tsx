"use client"

import { useEffect, useState, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Check,
  Zap,
  DollarSign,
  Clock,
  FileText,
  Cake,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  UserPlus,
  Receipt,
  ClipboardList,
  Wallet,
  Activity,
  Target,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface DashboardData {
  monthlyRevenue: number
  prevMonthRevenue: number
  monthlyExpenses: number
  netProfit: number
  activePatients: number
  newPatientsThisMonth: number
  prevMonthPatients: number
  todayAppointments: number
  todayByStatus: Record<string, number>
  weekAppointments: number
  weekSlots: number
  pendingTotal: number
  pendingCount: number
  overdueTotal: number
  overdueCount: number
  pendencias: number
  dailyRevenue: { date: string; label: string; total: number }[]
  paymentMethods: { method: string; total: number }[]
  recentActivity: { type: string; icon: string; text: string; time: string }[]
  birthdays: { id: string; name: string; date: string; phone: string; day: number; initials: string }[]
  todaySchedule: {
    id: string; time: string; endTime: string; patient: string; service: string
    status: string; phone: string; initials: string
  }[]
  pendingPayments: {
    id: string; patient: string; phone: string; amount: number
    dueDate: string; status: string; description: string; initials: string
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("admin")

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => { if (d.role) setUserRole(d.role) })
      .catch(() => {})
  }, [])

  const canSeeFinancials = userRole === "admin" || userRole === "doctor"

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard")
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error("Dashboard fetch error:", e)
    }
  }, [])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  // Real-time subscriptions
  useEffect(() => {
    const supabase = createClient()
    const channels = ["payments", "appointments", "patients", "clinical_documents", "expenses"].map((table) =>
      supabase
        .channel(`dashboard-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => fetchData())
        .subscribe()
    )
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)) }
  }, [fetchData])

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR")
  const pct = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100)

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      scheduled: "Agendado", PENDENTE: "Pendente", CONFIRMADO: "Confirmado",
      CHEGOU: "Chegou", "EM ATENDIMENTO": "Atendendo", "CONCLUÍDO": "Concluído",
      FALTOU: "Faltou", CANCELADO: "Cancelado", pending: "Pendente",
      confirmed: "Confirmado", completed: "Concluído",
    }
    return map[s] || s
  }

  const getStatusColor = (s: string) => {
    const map: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-700", PENDENTE: "bg-amber-100 text-amber-700",
      CONFIRMADO: "bg-blue-100 text-blue-700", CHEGOU: "bg-indigo-100 text-indigo-700",
      "EM ATENDIMENTO": "bg-violet-100 text-violet-700", "CONCLUÍDO": "bg-emerald-100 text-emerald-700",
      FALTOU: "bg-red-100 text-red-700", CANCELADO: "bg-gray-100 text-gray-600",
      pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
    }
    return map[s] || "bg-gray-100 text-gray-600"
  }

  const getServiceColor = (service: string) => {
    const map: Record<string, string> = {
      "Limpeza e Profilaxia": "bg-sky-500", "Restauração Dentária": "bg-amber-500",
      "Tratamento de Canal": "bg-red-500", "Extração Dentária": "bg-rose-500",
      "Clareamento Dental": "bg-violet-500", "Implante Dentário": "bg-indigo-500",
      "Ortodontia": "bg-blue-500", "Prótese Dentária": "bg-teal-500",
      "Periodontia": "bg-emerald-500", "Cirurgia Oral": "bg-orange-500",
      "Consulta Geral": "bg-slate-500", "Retorno": "bg-green-500",
    }
    return map[service] || "bg-gray-400"
  }

  const handleWhatsApp = (phone: string, name: string, msg: string) => {
    const message = encodeURIComponent(msg)
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${message}`, "_blank")
  }

  const markPaid = async (id: string) => {
    try {
      await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", payment_date: new Date().toISOString().split("T")[0] }),
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const getTodayFormatted = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    const f = new Date().toLocaleDateString("pt-BR", options)
    return f.charAt(0).toUpperCase() + f.slice(1)
  }

  const occupationRate = data ? (data.weekSlots > 0 ? Math.round((data.weekAppointments / data.weekSlots) * 100) : 0) : 0
  const revenueChange = data ? pct(data.monthlyRevenue, data.prevMonthRevenue) : 0
  const patientChange = data ? (data.newPatientsThisMonth - (data.prevMonthPatients || 0)) : 0
  const maxDailyRevenue = data ? Math.max(...data.dailyRevenue.map((d) => d.total), 1) : 1

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
          <p className="text-sm text-gray-500">{getTodayFormatted()}</p>
        </div>
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/agenda">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Agendamento</span>
            </Button>
          </Link>
          <Link href="/pacientes">
            <Button size="sm" variant="outline" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Paciente</span>
            </Button>
          </Link>
          <Link href="/documentos">
            <Button size="sm" variant="outline" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documento</span>
            </Button>
          </Link>
          {canSeeFinancials && (
            <Link href="/financeiro">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Financeiro</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn("grid gap-3 sm:gap-4 mb-6", canSeeFinancials ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
        {/* Revenue Card */}
        {canSeeFinancials && (
          <Card className="p-4 relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              {revenueChange !== 0 && (
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                  revenueChange >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {revenueChange >= 0 ? "+" : ""}{revenueChange}%
                </span>
              )}
            </div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Faturamento do Mês</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(data?.monthlyRevenue || 0)}</p>
            {canSeeFinancials && data && data.monthlyExpenses > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                <span className="text-gray-400">Lucro:</span>
                <span className={cn("font-bold", data.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {fmt(data.netProfit)}
                </span>
              </div>
            )}
            {/* Mini bar */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((data?.monthlyRevenue || 0) / Math.max((data?.monthlyRevenue || 0) + (data?.monthlyExpenses || 1), 1) * 100, 100)}%` }}
              />
            </div>
          </Card>
        )}

        {/* Patients Card */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-100">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            {(data?.newPatientsThisMonth || 0) > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />
                +{data?.newPatientsThisMonth} {patientChange > 0 ? "novos" : "novo"}
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Pacientes Ativos</p>
          <p className="text-2xl font-bold text-gray-900">{data?.activePatients || 0}</p>
        </Card>

        {/* Today Appointments Card */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            {occupationRate > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {occupationRate}% ocupação
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Consultas Hoje</p>
          <p className="text-2xl font-bold text-gray-900">{data?.todayAppointments || 0}</p>
          {/* Status mini dots */}
          {data && Object.keys(data.todayByStatus).length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {Object.entries(data.todayByStatus).map(([status, count]) => (
                <span key={status} className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", getStatusColor(status))}>
                  {count} {getStatusLabel(status).toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Pendências Card */}
        <Card className={cn("p-4", (data?.pendencias || 0) > 0 && "border-l-4 border-l-red-500")}>
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            {(data?.pendencias || 0) > 0 && (
              <span className="text-[10px] font-bold text-red-500 uppercase">Atenção</span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Pendências</p>
          <p className="text-2xl font-bold text-gray-900">{data?.pendencias || 0}</p>
          {data && (data.overdueCount > 0 || data.pendingCount > 0) && (
            <div className="mt-2 flex gap-2 text-[10px]">
              {data.overdueCount > 0 && <span className="font-bold text-red-600">{data.overdueCount} atrasados</span>}
              {data.pendingCount > 0 && <span className="font-bold text-amber-600">{data.pendingCount} pendentes</span>}
            </div>
          )}
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Today Schedule */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
              <div>
                <h2 className="text-base font-bold text-gray-900">Agenda do Dia</h2>
                <p className="text-xs text-gray-500">{data?.todayAppointments || 0} consulta(s) agendada(s)</p>
              </div>
              <Link href="/agenda">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  Ver agenda completa
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="divide-y">
              {(data?.todaySchedule || []).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhuma consulta agendada para hoje</p>
                  <Link href="/agenda">
                    <Button size="sm" variant="link" className="mt-1">Agendar consulta</Button>
                  </Link>
                </div>
              ) : (
                data?.todaySchedule.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
                    {/* Time */}
                    <div className="text-center w-14 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{apt.time}</p>
                      <p className="text-[10px] text-gray-400">{apt.endTime}</p>
                    </div>

                    {/* Service color bar */}
                    <div className={cn("w-1 h-10 rounded-full flex-shrink-0", getServiceColor(apt.service))} />

                    {/* Avatar */}
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                        {apt.initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient}</p>
                      <p className="text-xs text-gray-500 truncate">{apt.service || "Consulta"}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge className={cn("text-[10px] font-bold", getStatusColor(apt.status))}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                      {apt.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleWhatsApp(
                              apt.phone,
                              apt.patient,
                              `Olá ${apt.patient}! Lembramos da sua consulta hoje às ${apt.time}. Nos vemos em breve!`
                            )
                          }
                          title="Lembrete via WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Revenue Chart + Payment Methods */}
          {canSeeFinancials && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Revenue Chart */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Faturamento Diário
                  </h3>
                  <span className="text-[10px] text-gray-400">Últimos 7 dias</span>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                  {(data?.dailyRevenue || []).map((day) => {
                    const height = maxDailyRevenue > 0 ? Math.max((day.total / maxDailyRevenue) * 100, 4) : 4
                    const isToday = day.date === new Date().toISOString().split("T")[0]
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-400 font-medium">
                          {day.total > 0 ? `${(day.total / 1000).toFixed(1)}k` : "—"}
                        </span>
                        <div
                          className={cn(
                            "w-full rounded-t-md transition-all duration-300",
                            isToday ? "bg-blue-500" : day.total > 0 ? "bg-blue-200" : "bg-gray-100"
                          )}
                          style={{ height: `${height}%` }}
                        />
                        <span className={cn("text-[10px] font-medium", isToday ? "text-blue-600" : "text-gray-400")}>
                          {day.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Payment Methods */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Wallet className="h-4 w-4 text-violet-600" />
                  Métodos de Pagamento
                </h3>
                {(data?.paymentMethods || []).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Sem dados este mês</p>
                ) : (
                  <div className="space-y-3">
                    {data?.paymentMethods.slice(0, 5).map((pm) => {
                      const total = data.paymentMethods.reduce((s, p) => s + p.total, 0)
                      const pctWidth = total > 0 ? (pm.total / total) * 100 : 0
                      return (
                        <div key={pm.method}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{pm.method}</span>
                            <span className="text-gray-500">{fmt(pm.total)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-400 rounded-full transition-all duration-500"
                              style={{ width: `${pctWidth}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Pending Payments Table */}
          {canSeeFinancials && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
                <h2 className="text-base font-bold text-gray-900">Pagamentos Pendentes</h2>
                <Link href="/pagamentos">
                  <Button variant="link" size="sm" className="text-xs gap-1">
                    Ver todos <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Paciente</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3">Valor</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3">Vencimento</th>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3">Status</th>
                      <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.pendingPayments || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                          <DollarSign className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                          Nenhum pagamento pendente
                        </td>
                      </tr>
                    ) : (
                      data?.pendingPayments.map((p) => (
                        <tr key={p.id} className={cn("border-b hover:bg-gray-50 transition-colors", p.status === "overdue" && "bg-red-50/50")}>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px] font-bold">
                                  {p.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-900">{p.patient}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm font-semibold text-gray-900">{fmt(p.amount)}</td>
                          <td className="py-3 text-sm text-gray-600">{fmtDate(p.dueDate)}</td>
                          <td className="py-3">
                            <Badge className={cn("text-[10px] font-bold", p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                              {p.status === "overdue" ? "Atrasado" : "Pendente"}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {p.phone && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleWhatsApp(
                                      p.phone,
                                      p.patient,
                                      `Olá ${p.patient}! Passando para lembrar do pagamento pendente no valor de ${fmt(p.amount)}. Podemos ajudar com alguma forma de pagamento?`
                                    )
                                  }
                                  title="Cobrar via WhatsApp"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => markPaid(p.id)}
                                title="Marcar como pago"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-4 lg:space-y-6">
          {/* Financial Summary */}
          {canSeeFinancials && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Resumo Financeiro
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Receitas</span>
                  <span className="text-sm font-bold text-emerald-600">{fmt(data?.monthlyRevenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Despesas</span>
                  <span className="text-sm font-bold text-red-500">{fmt(data?.monthlyExpenses || 0)}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Lucro Líquido</span>
                  <span className={cn("text-sm font-bold", (data?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {fmt(data?.netProfit || 0)}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Pendente</span>
                  <span className="text-sm font-bold text-amber-600">{fmt(data?.pendingTotal || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Em atraso</span>
                  <span className="text-sm font-bold text-red-600">{fmt(data?.overdueTotal || 0)}</span>
                </div>
              </div>
              <Link href="/financeiro">
                <Button variant="outline" size="sm" className="w-full mt-4 text-xs gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  Ver relatório completo
                </Button>
              </Link>
            </Card>
          )}

          {/* Occupation Rate */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-blue-600" />
              Ocupação da Semana
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={cn(occupationRate >= 75 ? "text-emerald-500" : occupationRate >= 40 ? "text-blue-500" : "text-amber-500")}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${occupationRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                  {occupationRate}%
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{data?.weekAppointments || 0} consultas</p>
                <p className="text-[10px] text-gray-400">de {data?.weekSlots || 0} slots disponíveis</p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-violet-600" />
              Atividade Recente
            </h3>
            {(data?.recentActivity || []).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-3">
                {data?.recentActivity.slice(0, 6).map((act, i) => {
                  const Icon = act.icon === "calendar" ? Calendar : act.icon === "file" ? FileText : DollarSign
                  const iconColor = act.icon === "calendar" ? "text-blue-500 bg-blue-50" : act.icon === "file" ? "text-violet-500 bg-violet-50" : "text-emerald-500 bg-emerald-50"
                  const timeAgo = getTimeAgo(act.time)
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className={cn("p-1.5 rounded-lg flex-shrink-0", iconColor)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed truncate">{act.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Birthdays */}
          {(data?.birthdays || []).length > 0 && (
            <Card className="p-5 bg-gradient-to-br from-pink-50 to-amber-50 border-pink-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Cake className="h-4 w-4 text-pink-500" />
                Aniversariantes do Mês
              </h3>
              <div className="space-y-2.5">
                {data?.birthdays.slice(0, 5).map((b) => {
                  const isToday = b.day === new Date().getDate()
                  return (
                    <div key={b.id} className={cn("flex items-center gap-3 p-2 rounded-xl", isToday && "bg-white/70 shadow-sm")}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-pink-100 text-pink-700 text-[10px] font-bold">
                          {b.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {b.name}
                          {isToday && <span className="ml-1.5 text-pink-500">Hoje!</span>}
                        </p>
                        <p className="text-[10px] text-gray-500">Dia {b.day}</p>
                      </div>
                      {b.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleWhatsApp(
                              b.phone,
                              b.name,
                              `Olá ${b.name}! A equipe da clínica deseja um feliz aniversário! Esperamos que tenha um dia especial! 🎂`
                            )
                          }
                          title="Enviar parabéns"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* System Status */}
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Sistema Ativo</span>
            </div>
            <p className="text-xs text-emerald-800">
              Dados sincronizados em tempo real. Qualquer alteração será refletida automaticamente.
            </p>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}

function getTimeAgo(time: string): string {
  const diff = Date.now() - new Date(time).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return "ontem"
  return `${days} dias atrás`
}

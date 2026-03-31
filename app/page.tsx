"use client"

import { useEffect, useState, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Check,
  Zap,
  DollarSign,
  FileText,
  Cake,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  UserPlus,
  Receipt,
  Wallet,
  Activity,
  Target,
  BarChart3,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
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
  const fmtShort = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k` : fmt(v)
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

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase()
    if (m.includes("pix")) return QrCode
    if (m.includes("cré") || m.includes("credit")) return CreditCard
    if (m.includes("déb") || m.includes("debit")) return CreditCard
    if (m.includes("dinh") || m.includes("cash")) return Banknote
    return Wallet
  }

  const methodColors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  ]

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
    } catch (e) { console.error(e) }
  }

  const getTodayFormatted = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    const f = new Date().toLocaleDateString("pt-BR", options)
    return f.charAt(0).toUpperCase() + f.slice(1)
  }

  const occupationRate = data ? (data.weekSlots > 0 ? Math.round((data.weekAppointments / data.weekSlots) * 100) : 0) : 0
  const revenueChange = data ? pct(data.monthlyRevenue, data.prevMonthRevenue) : 0
  const maxDailyRevenue = data ? Math.max(...data.dailyRevenue.map((d) => d.total), 1) : 1

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-400 animate-pulse">Carregando painel...</p>
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Painel</h1>
          <p className="text-sm text-gray-400 mt-0.5">{getTodayFormatted()}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/agenda">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 font-semibold text-xs h-9">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agendamento</span>
            </Button>
          </Link>
          <Link href="/pacientes">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200">
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Paciente</span>
            </Button>
          </Link>
          <Link href="/documentos">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200">
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Documento</span>
            </Button>
          </Link>
          {canSeeFinancials && (
            <Link href="/financeiro">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200">
                <Receipt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Financeiro</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn("grid gap-4 mb-8", canSeeFinancials ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
        {/* Revenue */}
        {canSeeFinancials && (
          <Card className="p-5 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-100 rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 shadow-sm">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                {revenueChange !== 0 && (
                  <span className={cn(
                    "text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5",
                    revenueChange >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}>
                    {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {revenueChange >= 0 ? "+" : ""}{revenueChange}%
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Faturamento do Mês</p>
              <p className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">{fmt(data?.monthlyRevenue || 0)}</p>
              {data && data.monthlyExpenses > 0 && (
                <p className="text-[11px] text-gray-400 mt-2">
                  Lucro: <span className={cn("font-bold", data.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>{fmt(data.netProfit)}</span>
                </p>
              )}
              <div className="mt-3 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((data?.monthlyRevenue || 0) / Math.max((data?.monthlyRevenue || 0) + (data?.monthlyExpenses || 1), 1) * 100, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Patients */}
        <Card className="p-5 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-100 rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-100 shadow-sm">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              {(data?.newPatientsThisMonth || 0) > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  +{data?.newPatientsThisMonth} novos
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Pacientes Ativos</p>
            <p className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">{data?.activePatients || 0}</p>
            <div className="mt-3 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((data?.activePatients || 0) * 10, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Today Appointments */}
        <Card className="p-5 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-100 rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-100 shadow-sm">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              {occupationRate > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  {occupationRate}% ocupação
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-blue-600/70 uppercase tracking-widest mb-1">Consultas Hoje</p>
            <p className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">{data?.todayAppointments || 0}</p>
            {data && Object.keys(data.todayByStatus).length > 0 && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {Object.entries(data.todayByStatus).map(([status, count]) => (
                  <span key={status} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", getStatusColor(status))}>
                    {count} {getStatusLabel(status).toLowerCase()}
                  </span>
                ))}
              </div>
            )}
            {(!data || Object.keys(data.todayByStatus).length === 0) && (
              <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-300 to-blue-500 rounded-full" style={{ width: "0%" }} />
              </div>
            )}
          </div>
        </Card>

        {/* Pendências */}
        <Card className={cn(
          "p-5 rounded-2xl border-0 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow",
          (data?.pendencias || 0) > 0
            ? "bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500"
            : "bg-gradient-to-br from-gray-50 to-white"
        )}>
          <div className={cn(
            "absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-40 group-hover:opacity-60 transition-opacity",
            (data?.pendencias || 0) > 0 ? "bg-red-100" : "bg-gray-100"
          )} />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2.5 rounded-xl shadow-sm", (data?.pendencias || 0) > 0 ? "bg-red-100" : "bg-gray-100")}>
                <AlertCircle className={cn("h-5 w-5", (data?.pendencias || 0) > 0 ? "text-red-600" : "text-gray-400")} />
              </div>
              {(data?.pendencias || 0) > 0 && (
                <span className="text-[11px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Atenção
                </span>
              )}
            </div>
            <p className={cn("text-[11px] font-bold uppercase tracking-widest mb-1", (data?.pendencias || 0) > 0 ? "text-red-500/70" : "text-gray-400")}>
              Pendências
            </p>
            <p className="text-[26px] font-extrabold text-gray-900 tracking-tight leading-none">{data?.pendencias || 0}</p>
            {data && (data.overdueCount > 0 || data.pendingCount > 0) && (
              <div className="mt-3 flex gap-2 text-[11px]">
                {data.overdueCount > 0 && <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{data.overdueCount} atrasados</span>}
                {data.pendingCount > 0 && <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{data.pendingCount} pendentes</span>}
              </div>
            )}
            {(data?.pendencias || 0) === 0 && (
              <p className="text-[11px] text-emerald-500 font-semibold mt-3 flex items-center gap-1">
                <Check className="h-3 w-3" /> Tudo em dia
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5 lg:space-y-6">
          {/* Today Schedule */}
          <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Agenda do Dia</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{data?.todayAppointments || 0} consulta(s) agendada(s)</p>
              </div>
              <Link href="/agenda">
                <Button variant="outline" size="sm" className="gap-1.5 text-[11px] rounded-xl font-semibold border-gray-200 h-8">
                  Ver agenda
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(data?.todaySchedule || []).length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-blue-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">Nenhuma consulta agendada para hoje</p>
                  <p className="text-[11px] text-gray-300 mt-1 mb-3">Clique abaixo para agendar uma nova consulta</p>
                  <Link href="/agenda">
                    <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-[11px] font-semibold gap-1.5 h-8">
                      <PlusCircle className="h-3.5 w-3.5" />
                      Agendar consulta
                    </Button>
                  </Link>
                </div>
              ) : (
                data?.todaySchedule.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/70 transition-colors">
                    <div className="text-center w-14 flex-shrink-0">
                      <p className="text-sm font-extrabold text-gray-900">{apt.time}</p>
                      <p className="text-[10px] text-gray-300 font-medium">{apt.endTime}</p>
                    </div>
                    <div className={cn("w-1 h-10 rounded-full flex-shrink-0", getServiceColor(apt.service))} />
                    <Avatar className="h-9 w-9 flex-shrink-0 shadow-sm">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                        {apt.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{apt.patient}</p>
                      <p className="text-[11px] text-gray-400 truncate">{apt.service || "Consulta"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge className={cn("text-[10px] font-bold border-0 shadow-sm", getStatusColor(apt.status))}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                      {apt.phone && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-green-50"
                          onClick={() => handleWhatsApp(apt.phone, apt.patient, `Olá ${apt.patient}! Lembramos da sua consulta hoje às ${apt.time}. Nos vemos em breve!`)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Daily Revenue */}
              <Card className="p-5 rounded-2xl border-0 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    Faturamento Diário
                  </h3>
                  <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">7 dias</span>
                </div>
                {(data?.dailyRevenue || []).every(d => d.total === 0) ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="flex items-end gap-1.5 mb-3">
                      {[20, 45, 30, 60, 35, 50, 40].map((h, i) => (
                        <div key={i} className="w-5 bg-gray-100 rounded-t-md animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }} />
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-300 font-medium">Sem faturamento registrado</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {(data?.dailyRevenue || []).map((day) => {
                      const height = maxDailyRevenue > 0 ? Math.max((day.total / maxDailyRevenue) * 100, 6) : 6
                      const isToday = day.date === new Date().toISOString().split("T")[0]
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
                          <span className="text-[9px] text-gray-400 font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                            {day.total > 0 ? fmtShort(day.total) : "—"}
                          </span>
                          <div className="w-full relative">
                            <div
                              className={cn(
                                "w-full rounded-lg transition-all duration-500 group-hover/bar:opacity-90",
                                isToday
                                  ? "bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm shadow-blue-200"
                                  : day.total > 0
                                    ? "bg-gradient-to-t from-blue-200 to-blue-100"
                                    : "bg-gray-100"
                              )}
                              style={{ height: `${height}px` }}
                            />
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold",
                            isToday ? "text-blue-600" : "text-gray-300"
                          )}>
                            {day.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {/* Payment Methods */}
              <Card className="p-5 rounded-2xl border-0 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                    <div className="p-1.5 rounded-lg bg-violet-50">
                      <Wallet className="h-4 w-4 text-violet-600" />
                    </div>
                    Pagamentos
                  </h3>
                  <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider">Mês</span>
                </div>
                {(data?.paymentMethods || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                      <CreditCard className="h-6 w-6 text-violet-200" />
                    </div>
                    <p className="text-[11px] text-gray-300 font-medium">Sem dados este mês</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {data?.paymentMethods.slice(0, 4).map((pm, idx) => {
                      const total = data.paymentMethods.reduce((s, p) => s + p.total, 0)
                      const pctWidth = total > 0 ? (pm.total / total) * 100 : 0
                      const MethodIcon = getMethodIcon(pm.method)
                      return (
                        <div key={pm.method}>
                          <div className="flex justify-between items-center text-[11px] mb-1.5">
                            <span className="font-bold text-gray-700 flex items-center gap-1.5">
                              <MethodIcon className="h-3.5 w-3.5 text-gray-400" />
                              {pm.method}
                            </span>
                            <span className="text-gray-400 font-semibold">{fmt(pm.total)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-700", methodColors[idx % methodColors.length])}
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

          {/* Pending Payments */}
          {canSeeFinancials && (
            <Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Pagamentos Pendentes</h2>
                <Link href="/pagamentos">
                  <Button variant="link" size="sm" className="text-[11px] gap-1 font-semibold text-blue-600">
                    Ver todos <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[10px] font-bold text-gray-300 uppercase tracking-widest px-6 py-3">Paciente</th>
                      <th className="text-left text-[10px] font-bold text-gray-300 uppercase tracking-widest py-3">Valor</th>
                      <th className="text-left text-[10px] font-bold text-gray-300 uppercase tracking-widest py-3">Vencimento</th>
                      <th className="text-left text-[10px] font-bold text-gray-300 uppercase tracking-widest py-3">Status</th>
                      <th className="text-right text-[10px] font-bold text-gray-300 uppercase tracking-widest px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.pendingPayments || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                            <Check className="h-7 w-7 text-emerald-300" />
                          </div>
                          <p className="text-sm font-semibold text-gray-300">Nenhum pagamento pendente</p>
                          <p className="text-[11px] text-gray-200 mt-0.5">Todos os pagamentos estão em dia</p>
                        </td>
                      </tr>
                    ) : (
                      data?.pendingPayments.map((p) => (
                        <tr key={p.id} className={cn("border-b border-gray-50 hover:bg-gray-50/50 transition-colors", p.status === "overdue" && "bg-red-50/30")}>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 shadow-sm">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px] font-extrabold">{p.initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-[13px] font-bold text-gray-900">{p.patient}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-[13px] font-extrabold text-gray-900">{fmt(p.amount)}</td>
                          <td className="py-3.5 text-[12px] text-gray-500 font-medium">{fmtDate(p.dueDate)}</td>
                          <td className="py-3.5">
                            <Badge className={cn("text-[10px] font-bold border-0 shadow-sm", p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                              {p.status === "overdue" ? "Atrasado" : "Pendente"}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {p.phone && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-green-50"
                                  onClick={() => handleWhatsApp(p.phone, p.patient, `Olá ${p.patient}! Passando para lembrar do pagamento pendente no valor de ${fmt(p.amount)}. Podemos ajudar com alguma forma de pagamento?`)}
                                  title="Cobrar via WhatsApp"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-emerald-50"
                                onClick={() => markPaid(p.id)} title="Marcar como pago"
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

        {/* Right Column */}
        <div className="space-y-5 lg:space-y-6">
          {/* Financial Summary */}
          {canSeeFinancials && (
            <Card className="p-5 rounded-2xl border-0 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-5 tracking-tight">
                <div className="p-1.5 rounded-lg bg-emerald-50">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                Resumo Financeiro
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Receitas</span>
                  <span className="text-[13px] font-extrabold text-emerald-600">{fmt(data?.monthlyRevenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Despesas</span>
                  <span className="text-[13px] font-extrabold text-red-500">{fmt(data?.monthlyExpenses || 0)}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center py-1 px-3 rounded-xl bg-gray-50">
                  <span className="text-[12px] font-bold text-gray-700">Lucro Líquido</span>
                  <span className={cn("text-[14px] font-extrabold", (data?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {fmt(data?.netProfit || 0)}
                  </span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Pendente</span>
                  <span className="text-[13px] font-extrabold text-amber-600">{fmt(data?.pendingTotal || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-gray-400 font-medium">Em atraso</span>
                  <span className="text-[13px] font-extrabold text-red-600">{fmt(data?.overdueTotal || 0)}</span>
                </div>
              </div>
              <Link href="/financeiro">
                <Button variant="outline" size="sm" className="w-full mt-5 text-[11px] gap-1.5 rounded-xl font-bold border-gray-200 h-9">
                  <Wallet className="h-3.5 w-3.5" />
                  Ver relatório completo
                </Button>
              </Link>
            </Card>
          )}

          {/* Occupation */}
          <Card className="p-5 rounded-2xl border-0 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-4 tracking-tight">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              Ocupação da Semana
            </h3>
            <div className="flex items-center gap-5">
              <div className="relative w-[72px] h-[72px]">
                <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-100" stroke="currentColor" strokeWidth="3.5" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path
                    className={cn(
                      occupationRate >= 75 ? "text-emerald-500" : occupationRate >= 40 ? "text-blue-500" : "text-amber-400"
                    )}
                    stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none"
                    strokeDasharray={`${occupationRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-gray-900">
                  {occupationRate}%
                </span>
              </div>
              <div>
                <p className="text-[14px] font-extrabold text-gray-900">{data?.weekAppointments || 0} consultas</p>
                <p className="text-[11px] text-gray-300 font-medium">de {data?.weekSlots || 0} slots disponíveis</p>
                <p className={cn(
                  "text-[11px] font-bold mt-1",
                  occupationRate >= 75 ? "text-emerald-500" : occupationRate >= 40 ? "text-blue-500" : "text-amber-500"
                )}>
                  {occupationRate >= 75 ? "Excelente" : occupationRate >= 40 ? "Bom ritmo" : "Horários livres"}
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-5 rounded-2xl border-0 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-4 tracking-tight">
              <div className="p-1.5 rounded-lg bg-violet-50">
                <Activity className="h-4 w-4 text-violet-600" />
              </div>
              Atividade Recente
            </h3>
            {(data?.recentActivity || []).length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-gray-200" />
                </div>
                <p className="text-[11px] text-gray-300 font-medium">Nenhuma atividade recente</p>
                <p className="text-[10px] text-gray-200 mt-0.5">As atividades aparecerão aqui automaticamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentActivity.slice(0, 6).map((act, i) => {
                  const Icon = act.icon === "calendar" ? Calendar : act.icon === "file" ? FileText : DollarSign
                  const colors = act.icon === "calendar" ? "text-blue-600 bg-blue-50" : act.icon === "file" ? "text-violet-600 bg-violet-50" : "text-emerald-600 bg-emerald-50"
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className={cn("p-1.5 rounded-lg flex-shrink-0 shadow-sm", colors)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-600 leading-relaxed truncate font-medium">{act.text}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5 font-medium">{getTimeAgo(act.time)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Birthdays */}
          {(data?.birthdays || []).length > 0 && (
            <Card className="p-5 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-pink-50 via-amber-50/50 to-white">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 mb-4 tracking-tight">
                <div className="p-1.5 rounded-lg bg-pink-100">
                  <Cake className="h-4 w-4 text-pink-500" />
                </div>
                Aniversariantes
              </h3>
              <div className="space-y-2.5">
                {data?.birthdays.slice(0, 5).map((b) => {
                  const isToday = b.day === new Date().getDate()
                  return (
                    <div key={b.id} className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-all", isToday && "bg-white shadow-sm")}>
                      <Avatar className="h-8 w-8 shadow-sm">
                        <AvatarFallback className="bg-pink-100 text-pink-700 text-[10px] font-extrabold">{b.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-900 truncate">
                          {b.name}
                          {isToday && <span className="ml-1.5 text-pink-500 animate-pulse">Hoje!</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">Dia {b.day}</p>
                      </div>
                      {b.phone && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-green-50"
                          onClick={() => handleWhatsApp(b.phone, b.name, `Olá ${b.name}! A equipe da clínica deseja um feliz aniversário! Esperamos que tenha um dia especial!`)}
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
          <Card className="p-4 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/30">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">Sistema Ativo</span>
            </div>
            <p className="text-[11px] text-emerald-700/70 font-medium leading-relaxed">
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

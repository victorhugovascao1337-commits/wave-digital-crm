"use client"

import { useEffect, useState, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp, Users, Calendar, AlertCircle, MessageSquare, ExternalLink,
  Check, Zap, DollarSign, FileText, Cake, ArrowUpRight, ArrowDownRight,
  PlusCircle, UserPlus, Receipt, Wallet, Activity, Target, BarChart3,
  Sparkles, CreditCard, Banknote, QrCode,
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
  weekDays: { day: string; date: string; count: number; isToday: boolean }[]
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

  const methodColors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"]
  const avatarGradients = [
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-violet-400 to-violet-600",
    "from-rose-400 to-rose-600",
    "from-amber-400 to-amber-600",
    "from-sky-400 to-sky-600",
    "from-pink-400 to-pink-600",
    "from-teal-400 to-teal-600",
    "from-indigo-400 to-indigo-600",
    "from-orange-400 to-orange-600",
  ]

  const handleWhatsApp = (phone: string, name: string, msg: string) => {
    const message = encodeURIComponent(msg)
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${message}`, "_blank")
  }

  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())

  const markPaid = async (id: string) => {
    try {
      await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "paid" }),
      })
      setPaidIds((prev) => new Set(prev).add(id))
      setTimeout(() => {
        setPaidIds((prev) => { const next = new Set(prev); next.delete(id); return next })
        fetchData()
      }, 1500)
    } catch (e) {
      console.error(e)
    }
  }

  const getTodayFormatted = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    const f = new Date().toLocaleDateString("pt-BR", options)
    return f.charAt(0).toUpperCase() + f.slice(1)
  }

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
          <Link href="/agenda"><Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 font-semibold text-xs h-9"><PlusCircle className="h-3.5 w-3.5" /><span className="hidden sm:inline">Agendamento</span></Button></Link>
          <Link href="/pacientes"><Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200"><UserPlus className="h-3.5 w-3.5" /><span className="hidden sm:inline">Paciente</span></Button></Link>
          <Link href="/documentos"><Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200"><FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">Documento</span></Button></Link>
          {canSeeFinancials && (<Link href="/financeiro"><Button size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200"><Receipt className="h-3.5 w-3.5" /><span className="hidden sm:inline">Financeiro</span></Button></Link>)}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {/* Revenue Card */}
        <Link href="/financeiro" className="block">
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Receita Mensal</p>
                <p className="text-xl font-bold text-gray-900">{data ? fmtShort(data.monthlyRevenue) : "R$ 0"}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  {revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3 text-emerald-600" /> : <ArrowDownRight className="h-3 w-3 text-red-600" />}
                  <span className={cn("text-[10px] font-semibold", revenueChange >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {Math.abs(revenueChange)}% vs anterior
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg"><DollarSign className="h-5 w-5 text-blue-700" /></div>
            </div>
          </Card>
        </Link>

        {/* Expenses Card */}
        <Link href="/financeiro" className="block">
          <Card className="p-5 bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Despesas Mensais</p>
                <p className="text-xl font-bold text-gray-900">{data ? fmtShort(data.monthlyExpenses) : "R$ 0"}</p>
                <p className="text-[10px] text-red-600 mt-1.5 font-medium">Este mês</p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg"><Banknote className="h-5 w-5 text-red-700" /></div>
            </div>
          </Card>
        </Link>

        {/* Consultas Hoje Card */}
        <Link href="/agenda" className="block">
          <Card className="p-5 bg-gradient-to-br from-sky-50 to-sky-100 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-sky-600 mb-1">Consultas Hoje</p>
                <p className="text-xl font-bold text-gray-900">{data?.todayAppointments || 0}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {data?.todayByStatus && Object.entries(data.todayByStatus).map(([status, count]) => (
                    <span key={status} className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", getStatusColor(status))}>
                      {count} {getStatusLabel(status).substring(0, 4)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-2 bg-sky-200 rounded-lg"><Calendar className="h-5 w-5 text-sky-700" /></div>
            </div>
          </Card>
        </Link>

        {/* Active Patients Card */}
        <Link href="/pacientes" className="block">
          <Card className="p-5 bg-gradient-to-br from-violet-50 to-violet-100 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-violet-600 mb-1">Pacientes Ativos</p>
                <p className="text-xl font-bold text-gray-900">{data?.activePatients || 0}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  <span className="text-[10px] font-semibold text-emerald-600">{data ? data.newPatientsThisMonth : 0} novos</span>
                </div>
              </div>
              <div className="p-2 bg-violet-200 rounded-lg"><Users className="h-5 w-5 text-violet-700" /></div>
            </div>
          </Card>
        </Link>

        {/* Pendências Card */}
        <Link href="/financeiro" className="block">
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">Pendências</p>
                <p className="text-xl font-bold text-gray-900">{data?.pendencias || 0}</p>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {(data?.pendingCount || 0) > 0 && <span className="text-[10px] font-semibold text-amber-600">{data?.pendingCount} pendente(s)</span>}
                  {(data?.overdueCount || 0) > 0 && <span className="text-[10px] font-semibold text-red-600">{data?.overdueCount} atrasado(s)</span>}
                </div>
              </div>
              <div className="p-2 bg-amber-200 rounded-lg"><AlertCircle className="h-5 w-5 text-amber-700" /></div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="p-6 shadow-sm border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Agenda de Hoje</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0">{data?.todayAppointments || 0} agendamentos</Badge>
                <Link href="/agenda" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver agenda <ExternalLink className="h-3 w-3" /></Link>
              </div>
            </div>

            {data?.todaySchedule && data.todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {data.todaySchedule.map((apt, idx) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className={cn("h-8 w-8 bg-gradient-to-br", avatarGradients[idx % avatarGradients.length])}>
                        <AvatarFallback className="text-white text-xs font-bold">{apt.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient}</p>
                        <p className="text-xs text-gray-500">{apt.time} - {apt.endTime}</p>
                      </div>
                      <div className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", getStatusColor(apt.status))}>{getStatusLabel(apt.status)}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="ml-2" onClick={() => handleWhatsApp(apt.phone, apt.patient, `Olá ${apt.patient}, tudo bem? Confirma sua consulta de ${apt.service} às ${apt.time}?`)}>
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Sem agendamentos para hoje</p>
            )}
          </Card>
        </div>

        {/* Week Overview */}
        <Card className="p-6 shadow-sm border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Visão da Semana</h2>
            <Link href="/agenda" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver agenda <ExternalLink className="h-3 w-3" /></Link>
          </div>
          {data?.weekDays && data.weekDays.length > 0 ? (
            <div className="space-y-2.5">
              {(() => {
                const maxCount = Math.max(...data.weekDays.map((d) => d.count), 1)
                return data.weekDays.map((day, idx) => (
                  <div key={idx} className={cn("flex items-center gap-2 p-2 rounded-lg transition-colors", day.isToday ? "bg-blue-50 ring-1 ring-blue-200" : "")}>
                    <span className={cn("w-8 text-xs font-bold text-center", day.isToday ? "text-blue-700" : "text-gray-500")}>{day.day}</span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all flex items-center justify-end pr-2", day.isToday ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-gray-300 to-gray-400")}
                        style={{ width: day.count > 0 ? `${Math.max((day.count / maxCount) * 100, 12)}%` : "0%" }}
                      >
                        {day.count > 0 && <span className="text-[10px] font-bold text-white">{day.count}</span>}
                      </div>
                    </div>
                    {day.count === 0 && <span className="text-[10px] text-gray-400 w-4">0</span>}
                  </div>
                ))
              })()}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <p className="text-sm font-semibold text-gray-900 text-center">{data.weekAppointments} consultas na semana</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sem dados da semana</p>
          )}
        </Card>
      </div>

      {/* Charts and Financial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Revenue Chart */}
        <Card className="p-6 shadow-sm border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Receita Diária (7 dias)</h2>
            <Link href="/financeiro" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver financeiro <ExternalLink className="h-3 w-3" /></Link>
          </div>
          {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
            <div className="space-y-2">
              {data.dailyRevenue.map((day, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-16 text-xs font-medium text-gray-600 truncate">{day.label}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                      style={{ width: `${(day.total / maxDailyRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs font-semibold text-gray-900 text-right">{fmtShort(day.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sem dados de receita</p>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="p-6 shadow-sm border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Meios de Pagamento</h2>
            <Link href="/financeiro" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver financeiro <ExternalLink className="h-3 w-3" /></Link>
          </div>
          {data?.paymentMethods && data.paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {data.paymentMethods.map((method, idx) => {
                const Icon = getMethodIcon(method.method)
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg text-white", methodColors[idx % methodColors.length])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{method.method}</p>
                      <p className="text-xs text-gray-500">{fmt(method.total)}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{Math.round((method.total / (data.monthlyRevenue || 1)) * 100)}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sem métodos registrados</p>
          )}
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pending Payments */}
        <Card className="p-6 shadow-sm border-gray-100 bg-amber-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Pagamentos Pendentes</h2>
            </div>
            <Badge className="bg-amber-200 text-amber-800 border-0">{data?.pendingCount || 0}</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{data ? fmt(data.pendingTotal) : "R$ 0"}</p>
          <p className="text-sm text-gray-600 mb-4">em {data?.pendingCount || 0} transação(ões)</p>
          <Link href="/financeiro">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2">
              Ver Detalhes <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </Card>

        {/* Overdue Payments */}
        <Card className="p-6 shadow-sm border-gray-100 bg-red-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-bold text-gray-900">Pagamentos Atrasados</h2>
            </div>
            <Badge className="bg-red-200 text-red-800 border-0">{data?.overdueCount || 0}</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">{data ? fmt(data.overdueTotal) : "R$ 0"}</p>
          <p className="text-sm text-gray-600 mb-4">em {data?.overdueCount || 0} transação(ões)</p>
          <Link href="/financeiro">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
              Ver Detalhes <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Pending Payments Table */}
      {data?.pendingPayments && data.pendingPayments.length > 0 && (
        <Card className="p-6 shadow-sm border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Últimos Pagamentos Pendentes</h2>
            <Link href="/financeiro" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver todos <ExternalLink className="h-3 w-3" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Descrição</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Vencimento</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingPayments.slice(0, 5).map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 bg-gradient-to-br from-blue-400 to-blue-600">
                          <AvatarFallback className="text-white text-xs font-bold">{payment.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">{payment.patient}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{payment.description}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{fmt(payment.amount)}</td>
                    <td className="py-3 px-4 text-gray-600">{fmtDate(payment.dueDate)}</td>
                    <td className="py-3 px-4">
                      <Badge className={cn("border-0", getStatusColor(payment.status))}>{getStatusLabel(payment.status)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {paidIds.has(payment.id) ? (
                          <Button size="sm" disabled className="h-7 text-xs bg-emerald-500 hover:bg-emerald-500 text-white border-emerald-500 gap-1">
                            <Check className="h-3 w-3" /> Pago ✓
                          </Button>
                        ) : payment.status === "pending" ? (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markPaid(payment.id)}>
                              <Check className="h-3 w-3 mr-1" /> Marcar Pago
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => handleWhatsApp(payment.phone, payment.patient, `Olá ${payment.patient}, você tem um pagamento pendente de ${fmt(payment.amount)} vencido em ${fmtDate(payment.dueDate)}.`)}>
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recent Activity & Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6 shadow-sm border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Atividade Recente</h2>
            <Link href="/tarefas" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver tarefas <ExternalLink className="h-3 w-3" /></Link>
          </div>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity, idx) => {
                const iconMap: Record<string, any> = {
                  appointment: Calendar, payment: DollarSign, patient: Users,
                  document: FileText, system: Zap, other: Activity,
                }
                const Icon = iconMap[activity.icon] || Activity
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-500">{getTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sem atividade recente</p>
          )}
        </Card>

        {/* Birthdays */}
        <Card className="p-6 shadow-sm border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Próximos Aniversários</h2>
            <Link href="/pacientes" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">Ver pacientes <ExternalLink className="h-3 w-3" /></Link>
          </div>
          {data?.birthdays && data.birthdays.length > 0 ? (
            <div className="space-y-3">
              {data.birthdays.map((birthday) => (
                <div key={birthday.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-200 rounded-lg">
                      <Cake className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{birthday.name}</p>
                      <p className="text-xs text-gray-500">em {birthday.day} dias</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-pink-600" onClick={() => handleWhatsApp(birthday.phone, birthday.name, `Olá ${birthday.name}! Gostaríamos de desejar um feliz aniversário! 🎉`)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sem aniversários próximos</p>
          )}
        </Card>
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

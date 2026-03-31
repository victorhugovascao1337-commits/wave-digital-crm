"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import {
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  CheckCircle2,
  Receipt,
  UserPlus,
  BarChart3,
  CalendarDays,
  TrendingUp,
} from "lucide-react"

const barColors = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
]

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

interface InsightsData {
  monthlyRevenue: number
  completionRate: number
  avgTicket: number
  newPatients: number
  totalConsultations: number
  completedConsultations: number
  pendingAmount: number
  monthlyRevenueChart: { month: string; value: number }[]
  weeklyConsultations: { week: string; value: number }[]
  topServices: { name: string; count: number; percentage: number }[]
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [exporting, setExporting] = useState(false)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    try {
      const [appointmentsRes, paymentsRes, patientsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/payments"),
        fetch("/api/patients"),
      ])

      const appointments = await appointmentsRes.json()
      const payments = await paymentsRes.json()
      const patients = await patientsRes.json()

      const m = selectedMonth
      const y = selectedYear

      const monthAppointments = Array.isArray(appointments)
        ? appointments.filter((a: { date: string }) => {
            const d = new Date(a.date)
            return d.getMonth() === m && d.getFullYear() === y
          })
        : []

      const monthPayments = Array.isArray(payments)
        ? payments.filter((p: { created_at: string; due_date?: string }) => {
            const d = new Date(p.due_date || p.created_at)
            return d.getMonth() === m && d.getFullYear() === y
          })
        : []

      const paidPayments = monthPayments.filter(
        (p: { status: string }) => p.status === "paid"
      )
      const monthlyRevenue = paidPayments.reduce(
        (sum: number, p: { amount: number }) => sum + Number(p.amount),
        0
      )

      const pendingPayments = monthPayments.filter(
        (p: { status: string }) => p.status === "pending" || p.status === "overdue"
      )
      const pendingAmount = pendingPayments.reduce(
        (sum: number, p: { amount: number }) => sum + Number(p.amount),
        0
      )

      const totalApts = monthAppointments.length
      const completedApts = monthAppointments.filter(
        (a: { status: string }) =>
          ["completed", "CONCLUÍDO", "CONFIRMADO", "confirmed"].includes(a.status)
      ).length
      const completionRate =
        totalApts > 0 ? Math.round((completedApts / totalApts) * 100) : 0

      const avgTicket =
        paidPayments.length > 0 ? Math.round(monthlyRevenue / paidPayments.length) : 0

      const newPatients = Array.isArray(patients)
        ? patients.filter((p: { created_at: string }) => {
            const d = new Date(p.created_at)
            return d.getMonth() === m && d.getFullYear() === y
          }).length
        : 0

      const monthlyRevenueChart = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(y, m - i, 1)
        const cm = d.getMonth()
        const cy = d.getFullYear()
        const monthPaid = Array.isArray(payments)
          ? payments
              .filter(
                (p: { status: string; payment_date?: string | null; created_at: string }) => {
                  if (p.status !== "paid") return false
                  const pd = new Date(p.created_at)
                  return pd.getMonth() === cm && pd.getFullYear() === cy
                }
              )
              .reduce(
                (sum: number, p: { amount: number }) => sum + Number(p.amount),
                0
              )
          : 0
        monthlyRevenueChart.push({ month: MONTH_SHORT[cm], value: monthPaid })
      }

      const weeklyConsultations = []
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(y, m, 1 + w * 7)
        const weekEnd = new Date(y, m, 7 + w * 7)
        const startStr = weekStart.toISOString().split("T")[0]
        const endStr = weekEnd.toISOString().split("T")[0]
        const count = monthAppointments.filter(
          (a: { date: string }) => a.date >= startStr && a.date <= endStr
        ).length
        weeklyConsultations.push({ week: `Sem ${w + 1}`, value: count })
      }

      const serviceCounts: Record<string, number> = {}
      monthAppointments.forEach((a: { service: string }) => {
        if (a.service) {
          serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1
        }
      })
      const totalServices = Object.values(serviceCounts).reduce((a, b) => a + b, 0)
      const topServices = Object.entries(serviceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name, count]) => ({
          name,
          count,
          percentage:
            totalServices > 0 ? Math.round((count / totalServices) * 100) : 0,
        }))

      setData({
        monthlyRevenue,
        completionRate,
        avgTicket,
        newPatients,
        totalConsultations: totalApts,
        completedConsultations: completedApts,
        pendingAmount,
        monthlyRevenueChart,
        weeklyConsultations,
        topServices,
      })
    } catch (error) {
      console.error("Erro ao carregar insights:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    const now = new Date()
    const isCurrentMonth =
      selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
    if (isCurrentMonth) return
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const isCurrentMonth =
    selectedMonth === new Date().getMonth() &&
    selectedYear === new Date().getFullYear()

  const handleExport = async () => {
    if (!data) return
    setExporting(true)
    try {
      const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
      const lines = [
        `RELATÓRIO FINANCEIRO - ${monthLabel}`,
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        "",
        "RESUMO DO MÊS",
        `Receita Total;${formatCurrency(data.monthlyRevenue)}`,
        `Valor Pendente;${formatCurrency(data.pendingAmount)}`,
        `Total de Consultas;${data.totalConsultations}`,
        `Consultas Concluídas;${data.completedConsultations}`,
        `Taxa de Conclusão;${data.completionRate}%`,
        `Ticket Médio;${formatCurrency(data.avgTicket)}`,
        `Novos Pacientes;${data.newPatients}`,
        "",
        "RECEITA POR MÊS (ÚLTIMOS 6 MESES)",
        "Mês;Valor",
        ...data.monthlyRevenueChart.map(
          (item) => `${item.month};${formatCurrency(item.value)}`
        ),
        "",
        "SERVIÇOS MAIS REALIZADOS",
        "Serviço;Quantidade;Percentual",
        ...data.topServices.map((s) => `${s.name};${s.count};${s.percentage}%`),
        "",
        "CONSULTAS POR SEMANA",
        "Semana;Quantidade",
        ...data.weeklyConsultations.map((w) => `${w.week};${w.value}`),
      ]
      const BOM = "\uFEFF"
      const csvContent = BOM + lines.join("\r\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `relatorio-${MONTH_NAMES[selectedMonth].toLowerCase()}-${selectedYear}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Relatórios
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe o desempenho financeiro e clínico da sua clínica.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Month Selector */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm">
              <button
                onClick={goToPreviousMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-foreground min-w-[130px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                  isCurrentMonth
                    ? "text-gray-300 cursor-not-allowed"
                    : "hover:bg-gray-100 text-muted-foreground hover:text-foreground"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {/* Export */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {exporting ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 mb-1">Receita — {MONTH_SHORT[selectedMonth]}</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(data?.monthlyRevenue || 0)}
                </p>
              </div>
              <div className="p-2 bg-emerald-200 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Taxa Conclusão</p>
                <p className="text-xl font-bold text-gray-900">
                  {data?.completionRate || 0}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {data?.completedConsultations || 0} de {data?.totalConsultations || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-violet-600 mb-1">Ticket Médio</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(data?.avgTicket || 0)}
                </p>
              </div>
              <div className="p-2 bg-violet-200 rounded-lg">
                <Receipt className="h-5 w-5 text-violet-700" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">Novos Pacientes</p>
                <p className="text-xl font-bold text-gray-900">
                  {data?.newPatients || 0}
                </p>
              </div>
              <div className="p-2 bg-amber-200 rounded-lg">
                <UserPlus className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Alert */}
        {(data?.pendingAmount || 0) > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-white rounded-2xl border-0 shadow-sm flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl shrink-0">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Valores pendentes em {MONTH_NAMES[selectedMonth]}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data?.pendingAmount || 0)} aguardando pagamento
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Monthly Revenue */}
          <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Receita Mensal</h3>
            </div>
            <div className="h-48 flex items-end gap-3">
              {data?.monthlyRevenueChart.map((item, i) => {
                const max = Math.max(
                  ...(data.monthlyRevenueChart.map((d) => d.value)),
                  1
                )
                const height = (item.value / max) * 100
                const isSelected = item.month === MONTH_SHORT[selectedMonth]
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full relative"
                      style={{ height: "160px" }}
                    >
                      {item.value > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                          {(item.value / 1000).toFixed(1)}k
                        </span>
                      )}
                      <div
                        className={cn(
                          "absolute bottom-0 w-full rounded-xl transition-all",
                          isSelected
                            ? "bg-gradient-to-t from-primary to-primary/70"
                            : "bg-gradient-to-t from-emerald-500 to-emerald-300"
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly Consultations */}
          <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-100 rounded-xl">
                <CalendarDays className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Consultas por Semana</h3>
            </div>
            <div className="h-48 flex items-end gap-3">
              {data?.weeklyConsultations.map((item, i) => {
                const max = Math.max(
                  ...(data.weeklyConsultations.map((d) => d.value)),
                  1
                )
                const height = (item.value / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full relative"
                      style={{ height: "160px" }}
                    >
                      {item.value > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground">
                          {item.value}
                        </span>
                      )}
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-xl transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.week}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-violet-100 rounded-xl">
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="font-bold text-foreground text-sm">Serviços Mais Realizados</h3>
          </div>
          {data?.topServices && data.topServices.length > 0 ? (
            <div className="space-y-4">
              {data.topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {service.name}
                      </p>
                      <span className="text-xs font-bold text-muted-foreground ml-3">
                        {service.count}x ({service.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          barColors[index % barColors.length]
                        )}
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="p-4 bg-violet-50 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">
                  Nenhum serviço registrado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie consultas em {MONTH_NAMES[selectedMonth]} para ver os relatórios.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Download, ChevronLeft, ChevronRight, FileText } from "lucide-react"

const barColors = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-red-500", "bg-amber-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500"]

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

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

      // Filter appointments for selected month
      const monthAppointments = Array.isArray(appointments)
        ? appointments.filter((a: { date: string }) => {
            const d = new Date(a.date)
            return d.getMonth() === m && d.getFullYear() === y
          })
        : []

      // Filter payments for selected month
      const monthPayments = Array.isArray(payments)
        ? payments.filter((p: { created_at: string; due_date?: string }) => {
            const d = new Date(p.due_date || p.created_at)
            return d.getMonth() === m && d.getFullYear() === y
          })
        : []

      // Monthly revenue from paid payments
      const paidPayments = monthPayments.filter((p: { status: string }) => p.status === "paid")
      const monthlyRevenue = paidPayments.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0)

      // Pending amount
      const pendingPayments = monthPayments.filter((p: { status: string }) => p.status === "pending" || p.status === "overdue")
      const pendingAmount = pendingPayments.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0)

      // Completion rate
      const totalApts = monthAppointments.length
      const completedApts = monthAppointments.filter((a: { status: string }) =>
        ["completed", "CONCLUÍDO", "CONFIRMADO", "confirmed"].includes(a.status)
      ).length
      const completionRate = totalApts > 0 ? Math.round((completedApts / totalApts) * 100) : 0

      // Average ticket
      const avgTicket = paidPayments.length > 0 ? Math.round(monthlyRevenue / paidPayments.length) : 0

      // New patients this month
      const newPatients = Array.isArray(patients)
        ? patients.filter((p: { created_at: string }) => {
            const d = new Date(p.created_at)
            return d.getMonth() === m && d.getFullYear() === y
          }).length
        : 0

      // Monthly revenue chart (last 6 months from selected)
      const monthlyRevenueChart = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(y, m - i, 1)
        const cm = d.getMonth()
        const cy = d.getFullYear()
        const monthPaid = Array.isArray(payments)
          ? payments
              .filter((p: { status: string; paid_date?: string | null; created_at: string }) => {
                if (p.status !== "paid") return false
                const pd = new Date(p.paid_date || p.created_at)
                return pd.getMonth() === cm && pd.getFullYear() === cy
              })
              .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0)
          : 0
        monthlyRevenueChart.push({ month: MONTH_SHORT[cm], value: monthPaid })
      }

      // Weekly consultations (4 weeks of selected month)
      const weeklyConsultations = []
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(y, m, 1 + w * 7)
        const weekEnd = new Date(y, m, 7 + w * 7)
        const startStr = weekStart.toISOString().split("T")[0]
        const endStr = weekEnd.toISOString().split("T")[0]
        const count = monthAppointments.filter((a: { date: string }) => a.date >= startStr && a.date <= endStr).length
        weeklyConsultations.push({ week: `Sem ${w + 1}`, value: count })
      }

      // Top services
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
          percentage: totalServices > 0 ? Math.round((count / totalServices) * 100) : 0,
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
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
    if (isCurrentMonth) return
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()

  const handleExport = async () => {
    if (!data) return
    setExporting(true)

    try {
      const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`

      // Build CSV content for the accountant
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
        ...data.monthlyRevenueChart.map((item) => `${item.month};${formatCurrency(item.value)}`),
        "",
        "SERVIÇOS MAIS REALIZADOS",
        "Serviço;Quantidade;Percentual",
        ...data.topServices.map((s) => `${s.name};${s.count};${s.percentage}%`),
        "",
        "CONSULTAS POR SEMANA",
        "Semana;Quantidade",
        ...data.weeklyConsultations.map((w) => `${w.week};${w.value}`),
      ]

      // Add BOM for Excel UTF-8 compatibility
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
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      {/* Header with month filter and export */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o desempenho da sua clínica
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-accent/50 rounded-xl border border-border/30 px-1 py-1">
            <button
              onClick={goToPreviousMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-medium text-foreground min-w-[130px] text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                isCurrentMonth
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "hover:bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-primary">
          <p className="text-xs font-medium mb-1 uppercase text-primary-foreground/80">
            RECEITA — {MONTH_SHORT[selectedMonth].toUpperCase()}
          </p>
          <p className="text-2xl font-bold text-primary-foreground">
            {formatCurrency(data?.monthlyRevenue || 0)}
          </p>
          <div className="mt-2 h-1 bg-primary-foreground/30 rounded-full overflow-hidden">
            <div className="h-full w-full bg-primary-foreground rounded-full" />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium mb-1 uppercase text-muted-foreground">Taxa de Conclusão</p>
          <p className="text-2xl font-bold text-foreground">{data?.completionRate || 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.completedConsultations || 0} de {data?.totalConsultations || 0} consultas
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium mb-1 uppercase text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(data?.avgTicket || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium mb-1 uppercase text-muted-foreground">Novos Pacientes</p>
          <p className="text-2xl font-bold text-foreground">{data?.newPatients || 0}</p>
        </Card>
      </div>

      {/* Pending Alert */}
      {(data?.pendingAmount || 0) > 0 && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Valores pendentes em {MONTH_NAMES[selectedMonth]}
              </p>
              <p className="text-xs text-amber-600">
                {formatCurrency(data?.pendingAmount || 0)} aguardando pagamento
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Receita Mensal (R$)</h2>
          <div className="h-56 flex items-end gap-3">
            {data?.monthlyRevenueChart.map((item, i) => {
              const max = Math.max(...(data.monthlyRevenueChart.map((d) => d.value)), 1)
              const height = (item.value / max) * 100
              const isSelected = item.month === MONTH_SHORT[selectedMonth]
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: "180px" }}>
                    <div
                      className={cn(
                        "absolute bottom-0 w-full rounded-t-md transition-all",
                        isSelected ? "bg-primary" : "bg-emerald-500"
                      )}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs",
                    isSelected ? "text-primary font-semibold" : "text-muted-foreground"
                  )}>{item.month}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Weekly Consultations */}
        <Card className="p-6">
          <h2 className="font-semibold text-foreground mb-4">Consultas por Semana</h2>
          <div className="h-56 flex items-end gap-3">
            {data?.weeklyConsultations.map((item, i) => {
              const max = Math.max(...(data.weeklyConsultations.map((d) => d.value)), 1)
              const height = (item.value / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: "180px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.week}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Top Services */}
      <Card className="p-6">
        <h2 className="font-semibold text-foreground mb-4">Serviços Mais Realizados</h2>
        {data?.topServices && data.topServices.length > 0 ? (
          <div className="space-y-4">
            {data.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-foreground mb-1">{service.name}</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", barColors[index % barColors.length])}
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground ml-4 w-16 text-right">
                  {service.count}x ({service.percentage}%)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum serviço registrado em {MONTH_NAMES[selectedMonth]}. Crie consultas para ver os relatórios.
          </p>
        )}
      </Card>
    </CRMLayout>
  )
}

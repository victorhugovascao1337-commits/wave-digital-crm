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
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Stats {
  monthlyRevenue: number
  pendingTotal: number
  pendingCount: number
  overdueTotal: number
  overdueCount: number
  activePatients: number
  todayAppointments: number
  pendencias: number
}

interface Appointment {
  id: string
  date: string
  start_time: string
  end_time: string
  service: string
  status: string
  patients: {
    id: string
    name: string
    initials: string
    avatar_color: string
  }
}

interface Payment {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  patients: {
    id: string
    name: string
    initials: string
    avatar_color: string
    phone: string
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("admin")

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => { if (data.role) setUserRole(data.role) })
      .catch(() => {})
  }, [])

  const canSeeFinancials = userRole === "admin" || userRole === "doctor"

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [])

  const fetchAppointments = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0]
    try {
      const res = await fetch(`/api/appointments?date=${today}`)
      const data = await res.json()
      setAppointments(Array.isArray(data) ? data.map((a: any) => ({ ...a, patients: a.patient })) : [])
    } catch {
      setAppointments([])
    }
  }, [])

  const fetchPendingPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/payments")
      const data = await res.json()
      const pending = Array.isArray(data)
        ? data.filter((p: any) => p.status === "pending" || p.status === "overdue").slice(0, 5)
        : []
      setPendingPayments(pending)
    } catch {
      setPendingPayments([])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchStats(), fetchAppointments(), fetchPendingPayments()])
      .finally(() => setLoading(false))
  }, [fetchStats, fetchAppointments, fetchPendingPayments])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    
    const paymentsChannel = supabase
      .channel("dashboard-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          fetchStats()
          fetchPendingPayments()
        }
      )
      .subscribe()

    const appointmentsChannel = supabase
      .channel("dashboard-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          fetchStats()
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(paymentsChannel)
      supabase.removeChannel(appointmentsChannel)
    }
  }, [fetchStats, fetchPendingPayments, fetchAppointments])

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || ""
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("pt-BR")
  }

  const handleWhatsApp = (phone: string, patientName: string, amount: number) => {
    const message = encodeURIComponent(
      `Olá ${patientName}! Passando para lembrar do pagamento pendente no valor de R$ ${amount.toFixed(2).replace(".", ",")}. Podemos ajudar com alguma forma de pagamento?`
    )
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${message}`, "_blank")
  }

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
          payment_method: "Não informado",
        }),
      })
      fetchStats()
      fetchPendingPayments()
    } catch (error) {
      console.error("Error marking payment as paid:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-primary text-primary-foreground">CONCLUÍDO</Badge>
      case "pending":
        return <Badge className="bg-amber-500 text-white">PENDENTE</Badge>
      case "confirmed":
        return <Badge className="bg-primary text-primary-foreground">CONFIRMADO</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return <Badge className="bg-red-500 text-white">ATRASADO</Badge>
      case "pending":
        return <Badge className="bg-amber-500 text-white">PENDENTE</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTodayFormatted = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }
    const formatted = today.toLocaleDateString("pt-BR", options)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CRMLayout>
    )
  }

  const allStatsCards = [
    ...(canSeeFinancials ? [{
      icon: TrendingUp,
      label: "VOCÊ FATUROU ESTE MÊS",
      value: formatCurrency(stats?.monthlyRevenue || 0),
      change: "+12%",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      hasProgressBar: true,
    }] : []),
    {
      icon: Users,
      label: "PACIENTES ATIVOS",
      value: String(stats?.activePatients || 0),
      change: "+5 novos",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      icon: Calendar,
      label: "CONSULTAS HOJE",
      value: String(stats?.todayAppointments || 0),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: AlertCircle,
      label: "PENDÊNCIAS",
      value: String(stats?.pendencias || 0),
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      attention: (stats?.pendencias || 0) > 0,
    },
  ]

  const statsCards = allStatsCards
  const gridCols = statsCards.length === 4 ? "grid-cols-2 lg:grid-cols-4" : statsCards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"

  return (
    <CRMLayout>
      <div className={cn("grid gap-3 sm:gap-4 mb-6", gridCols)}>
        {statsCards.map((stat, index) => (
          <Card 
            key={index} 
            className={cn(
              "p-4",
              stat.attention && "border-l-4 border-l-red-500"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
              {stat.change && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  stat.attention ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {stat.change}
                </span>
              )}
              {stat.attention && (
                <span className="text-xs text-red-500 font-medium">Atenção</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            {stat.hasProgressBar && (
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary rounded-full" />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Agenda do Dia</h2>
                <p className="text-sm text-muted-foreground">{getTodayFormatted()}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="default" size="sm" className="bg-primary text-primary-foreground">
                  Dia
                </Button>
                <Button variant="outline" size="sm">
                  Semana
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma consulta agendada para hoje
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between py-3 border-b border-border">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-12">
                        {formatTime(appointment.start_time)}
                      </span>
                      <Avatar className={cn("h-8 w-8", appointment.patients?.avatar_color)}>
                        <AvatarFallback className={cn(appointment.patients?.avatar_color, "text-white text-xs")}>
                          {appointment.patients?.initials || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {appointment.patients?.name || "Paciente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.service}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.status === "pending" && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <MessageSquare className="h-3 w-3" />
                          ENVIAR LEMBRETE
                        </Button>
                      )}
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {canSeeFinancials ? (<Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Pagamentos Pendentes</h2>
              <div className="flex items-center gap-2">
                <Link href="/pagamentos">
                  <Button variant="link" className="text-primary">Ver todos</Button>
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Paciente</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Valor</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Vencimento</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum pagamento pendente
                      </td>
                    </tr>
                  ) : (
                    pendingPayments.map((payment) => (
                      <tr 
                        key={payment.id} 
                        className={cn(
                          "border-b border-border",
                          payment.status === "overdue" && "bg-red-50"
                        )}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className={cn("h-8 w-8", payment.patients?.avatar_color)}>
                              <AvatarFallback className={cn(payment.patients?.avatar_color, "text-white text-xs")}>
                                {payment.patients?.initials || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {payment.patients?.name || "Paciente"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-foreground">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 text-sm text-foreground">
                          {formatDate(payment.due_date)}
                        </td>
                        <td className="py-3">
                          {getPaymentStatusBadge(payment.status)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleWhatsApp(
                                payment.patients?.phone || "",
                                payment.patients?.name || "",
                                payment.amount
                              )}
                              title="Cobrar via WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              title="Ver detalhes"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => markPaymentAsPaid(payment.id)}
                              title="Marcar como pago"
                            >
                              <Check className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>) : null}
        </div>

        <div className="space-y-6">
          {canSeeFinancials ? (<Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Resumo Financeiro</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Faturamento do mês</span>
                  <span className="text-sm font-medium text-emerald-600">
                    {formatCurrency(stats?.monthlyRevenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pendente</span>
                  <span className="text-sm font-medium text-amber-600">
                    {formatCurrency(stats?.pendingTotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Em atraso</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(stats?.overdueTotal || 0)}
                  </span>
                </div>
              </div>
            </Card>) : null}

          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700 uppercase">Sistema Ativo</span>
            </div>
            <p className="text-sm text-emerald-800">
              Seus dados estão sendo sincronizados em tempo real. Qualquer alteração será refletida automaticamente.
            </p>
          </Card>
        </div>
      </div>
    </CRMLayout>
  )
}

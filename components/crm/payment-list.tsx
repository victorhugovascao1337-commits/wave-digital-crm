"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Download, 
  MessageSquare, 
  Check, 
  Search, 
  MoreVertical,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Payment {
  id: string
  patient_id: string
  description: string
  amount: number
  due_date: string
  payment_date: string | null
  status: "paid" | "pending" | "overdue"
  payment_method: string | null
  patients: {
    id: string
    name: string
    initials: string
    avatar_color: string
    phone: string
  }
}

interface PaymentStats {
  monthlyRevenue: number
  pendingTotal: number
  pendingCount: number
  overdueTotal: number
  overdueCount: number
}

interface PatientOption {
  id: string
  name: string
}

export function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [markPaidModal, setMarkPaidModal] = useState<Payment | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [saving, setSaving] = useState(false)
  const [registerModal, setRegisterModal] = useState(false)
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [newPayment, setNewPayment] = useState({
    patient_id: "",
    description: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    status: "pending",
  })

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch("/api/payments")
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error("Error fetching payments:", error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }, [])

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/patients")
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch {
      setPatients([])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchPayments(), fetchStats(), fetchPatients()]).finally(() => setLoading(false))
  }, [fetchPayments, fetchStats, fetchPatients])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("payments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => {
          fetchPayments()
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPayments, fetchStats])

  const handleMarkAsPaid = async () => {
    if (!markPaidModal || !paymentMethod) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/payments/${markPaidModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: paymentMethod,
        }),
      })

      if (response.ok) {
        setMarkPaidModal(null)
        setPaymentMethod("")
        fetchPayments()
        fetchStats()
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRegister = async () => {
    if (!newPayment.patient_id || !newPayment.description || !newPayment.amount) return

    setSaving(true)
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: newPayment.patient_id,
          description: newPayment.description,
          amount: parseFloat(newPayment.amount),
          due_date: newPayment.due_date,
          status: newPayment.status,
        }),
      })

      if (response.ok) {
        setRegisterModal(false)
        setNewPayment({
          patient_id: "",
          description: "",
          amount: "",
          due_date: new Date().toISOString().split("T")[0],
          status: "pending",
        })
        fetchPayments()
        fetchStats()
      }
    } catch (error) {
      console.error("Error registering payment:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleWhatsApp = (phone: string, patientName: string, amount: number) => {
    const message = encodeURIComponent(
      `Olá ${patientName}! Passando para lembrar do pagamento pendente no valor de R$ ${amount.toFixed(2).replace(".", ",")}. Podemos ajudar com alguma forma de pagamento?`
    )
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${message}`, "_blank")
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("pt-BR")
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-primary text-primary-foreground">PAGO</Badge>
      case "pending":
        return <Badge className="bg-amber-500 text-white">PENDENTE</Badge>
      case "overdue":
        return <Badge className="bg-red-500 text-white">ATRASADO</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "PIX":
        return <Smartphone className="h-4 w-4" />
      case "Cartão de Crédito":
      case "Cartão de Débito":
        return <CreditCard className="h-4 w-4" />
      case "Dinheiro":
        return <Banknote className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.patients?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-6 bg-primary">
          <p className="text-xs font-medium mb-2 uppercase text-primary-foreground/80">
            FATURAMENTO DO MÊS
          </p>
          <p className="text-2xl font-bold text-primary-foreground">
            {formatCurrency(stats?.monthlyRevenue || 0)}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-medium mb-2 uppercase text-muted-foreground">
            A RECEBER
          </p>
          <p className="text-2xl font-bold text-amber-500">
            {formatCurrency(stats?.pendingTotal || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.pendingCount || 0} pagamento(s)
          </p>
        </Card>

        <Card className="p-6 relative">
          <p className="text-xs font-medium mb-2 uppercase text-muted-foreground">
            EM ATRASO
          </p>
          <p className="text-2xl font-bold text-red-500">
            {formatCurrency(stats?.overdueTotal || 0)}
          </p>
          {(stats?.overdueCount || 0) > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {stats?.overdueCount}
            </span>
          )}
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-foreground">Todos os Pagamentos</h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("paid")}>
                  Pagos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
                  Atrasados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => setRegisterModal(true)}>
              <Plus className="h-4 w-4" />
              Registrar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Paciente</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Descrição</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Valor</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Vencimento</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Método</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className={cn(
                      "border-b border-border",
                      payment.status === "overdue" && "bg-red-50"
                    )}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={cn("h-8 w-8", payment.patients?.avatar_color)}>
                          <AvatarFallback className={cn(payment.patients?.avatar_color, "text-white text-xs")}>
                            {payment.patients?.initials || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {payment.patients?.name || "Paciente desconhecido"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-foreground">{payment.description}</td>
                    <td className="py-4 text-sm font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-4 text-sm text-foreground">
                      <div className="flex items-center gap-1">
                        {payment.status === "overdue" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {formatDate(payment.due_date)}
                      </div>
                    </td>
                    <td className="py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {payment.payment_method && (
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span>{payment.payment_method}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      {payment.status !== "paid" ? (
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
                            onClick={() => setMarkPaidModal(payment)}
                            title="Marcar como pago"
                          >
                            <Check className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mark as Paid Modal */}
      <Dialog open={!!markPaidModal} onOpenChange={() => setMarkPaidModal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Marcar pagamento de {markPaidModal?.patients?.name} como pago
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(markPaidModal?.amount || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {markPaidModal?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={!paymentMethod || saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Salvando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Payment Modal */}
      <Dialog open={registerModal} onOpenChange={setRegisterModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Adicione um novo registro de pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={newPayment.patient_id}
                onValueChange={(value) =>
                  setNewPayment({ ...newPayment, patient_id: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                placeholder="Ex: Sessão de fisioterapia"
                value={newPayment.description}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150,00"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={newPayment.due_date}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, due_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newPayment.status}
                onValueChange={(value) =>
                  setNewPayment({ ...newPayment, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegister}
              disabled={
                !newPayment.patient_id ||
                !newPayment.description ||
                !newPayment.amount ||
                saving
              }
            >
              {saving ? "Salvando..." : "Registrar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

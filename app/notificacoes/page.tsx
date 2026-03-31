"use client"

import { useEffect, useState, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bell,
  MessageSquare,
  Send,
  Calendar,
  DollarSign,
  Cake,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Zap,
  Users,
  Filter,
  Search,
  ChevronDown,
  Sparkles,
  FileText,
  Phone,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationType = "reminder" | "confirmation" | "cancellation" | "follow_up" | "birthday" | "custom"
type NotificationChannel = "whatsapp" | "email" | "sms" | "push"
type NotificationStatus = "pending" | "sent" | "delivered" | "failed" | "read"

interface Notification {
  id: string
  patient_id: string
  appointment_id: string | null
  channel: NotificationChannel
  type: NotificationType
  message: string
  status: NotificationStatus
  scheduled_for: string | null
  sent_at: string | null
  created_at: string
  metadata: any
  patients?: { id: string; full_name: string; phone: string }
}

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: any; color: string; bg: string }> = {
  reminder: { label: "Lembrete", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  confirmation: { label: "Confirmação", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  cancellation: { label: "Cancelamento", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  follow_up: { label: "Cobrança", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  birthday: { label: "Aniversário", icon: Cake, color: "text-pink-600", bg: "bg-pink-50" },
  custom: { label: "Personalizada", icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50" },
}

const STATUS_CONFIG: Record<NotificationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "text-amber-700", bg: "bg-amber-100" },
  sent: { label: "Enviado", color: "text-blue-700", bg: "bg-blue-100" },
  delivered: { label: "Entregue", color: "text-emerald-700", bg: "bg-emerald-100" },
  failed: { label: "Falhou", color: "text-red-700", bg: "bg-red-100" },
  read: { label: "Lido", color: "text-violet-700", bg: "bg-violet-100" },
}

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      let url = "/api/notifications?"
      if (filterType !== "all") url += `type=${filterType}&`
      if (filterStatus !== "all") url += `status=${filterStatus}&`
      const res = await fetch(url)
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      setNotifications([])
    }
  }, [filterType, filterStatus])

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const runAction = async (action: string, label: string) => {
    setActionLoading(action)
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.error) {
        showToast(`Erro: ${data.error}`, "error")
      } else {
        showToast(data.message || `${label} concluído`, "success")
        fetchNotifications()
      }
    } catch {
      showToast("Erro ao executar ação", "error")
    } finally {
      setActionLoading("")
    }
  }

  const sendWhatsApp = async (notification: Notification) => {
    const phone = notification.metadata?.phone || notification.patients?.phone || ""
    if (!phone) {
      showToast("Telefone não encontrado", "error")
      return
    }

    const cleanPhone = phone.replace(/\D/g, "")
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
    const message = encodeURIComponent(notification.message)
    window.open(`https://wa.me/${fullPhone}?text=${message}`, "_blank")

    // Mark as sent
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_sent", id: notification.id }),
      })
      fetchNotifications()
    } catch {}
  }

  const filtered = notifications.filter((n) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (n.patients?.full_name || "").toLowerCase().includes(term) ||
      n.message.toLowerCase().includes(term)
    )
  })

  // Stats
  const stats = {
    total: notifications.length,
    pending: notifications.filter((n) => n.status === "pending").length,
    sent: notifications.filter((n) => n.status === "sent" || n.status === "delivered").length,
    failed: notifications.filter((n) => n.status === "failed").length,
  }

  const getTimeAgo = (time: string): string => {
    const diff = Date.now() - new Date(time).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "agora"
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <CRMLayout>
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-right",
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notificações
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Central de mensagens e lembretes para pacientes</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNotifications()}
          className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-gray-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">Total</p>
              <p className="text-xl font-extrabold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">Pendentes</p>
              <p className="text-xl font-extrabold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100">
              <Send className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">Enviados</p>
              <p className="text-xl font-extrabold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 rounded-2xl border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest">Falharam</p>
              <p className="text-xl font-extrabold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
          onClick={() => !actionLoading && runAction("generate_reminders", "Lembretes")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Lembretes de Consulta</h3>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">Gerar lembretes via WhatsApp para as consultas de amanhã</p>
              <Button
                size="sm"
                disabled={!!actionLoading}
                className="mt-3 gap-1.5 rounded-xl font-bold text-[11px] h-8 bg-blue-600 hover:bg-blue-700"
                onClick={(e) => { e.stopPropagation(); runAction("generate_reminders", "Lembretes") }}
              >
                {actionLoading === "generate_reminders" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Gerar Lembretes
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
          onClick={() => !actionLoading && runAction("generate_payment_reminders", "Cobranças")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 group-hover:bg-amber-100 transition-colors">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Cobranças de Pagamento</h3>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">Enviar lembretes de pagamentos pendentes e atrasados</p>
              <Button
                size="sm"
                disabled={!!actionLoading}
                className="mt-3 gap-1.5 rounded-xl font-bold text-[11px] h-8 bg-amber-600 hover:bg-amber-700"
                onClick={(e) => { e.stopPropagation(); runAction("generate_payment_reminders", "Cobranças") }}
              >
                {actionLoading === "generate_payment_reminders" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <DollarSign className="h-3.5 w-3.5" />
                )}
                Gerar Cobranças
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
          onClick={() => !actionLoading && runAction("generate_birthdays", "Aniversários")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-pink-50 group-hover:bg-pink-100 transition-colors">
              <Cake className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Parabéns de Aniversário</h3>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">Enviar mensagem de aniversário para pacientes de hoje</p>
              <Button
                size="sm"
                disabled={!!actionLoading}
                className="mt-3 gap-1.5 rounded-xl font-bold text-[11px] h-8 bg-pink-600 hover:bg-pink-700"
                onClick={(e) => { e.stopPropagation(); runAction("generate_birthdays", "Aniversários") }}
              >
                {actionLoading === "generate_birthdays" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Cake className="h-3.5 w-3.5" />
                )}
                Enviar Parabéns
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Notification List */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder="Buscar por paciente ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os tipos</option>
              <option value="reminder">Lembretes</option>
              <option value="follow_up">Cobranças</option>
              <option value="birthday">Aniversários</option>
              <option value="confirmation">Confirmações</option>
              <option value="custom">Personalizadas</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="sent">Enviados</option>
              <option value="delivered">Entregues</option>
              <option value="failed">Falharam</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-400">Nenhuma notificação encontrada</p>
            <p className="text-[11px] text-gray-300 mt-1">Use os botões acima para gerar lembretes automaticamente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((n) => {
              const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.custom
              const statusConf = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending
              const TypeIcon = typeConf.icon
              const patientName = n.patients?.full_name || "Paciente"
              const initials = patientName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
              const phone = n.metadata?.phone || n.patients?.phone || ""

              return (
                <div key={n.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Type icon */}
                  <div className={cn("p-2 rounded-xl flex-shrink-0 mt-0.5", typeConf.bg)}>
                    <TypeIcon className={cn("h-4 w-4", typeConf.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-gray-900">{patientName}</span>
                      <Badge className={cn("text-[9px] font-bold border-0", typeConf.bg, typeConf.color)}>
                        {typeConf.label}
                      </Badge>
                      <Badge className={cn("text-[9px] font-bold border-0", statusConf.bg, statusConf.color)}>
                        {statusConf.label}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-300 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(n.created_at)}
                      </span>
                      {phone && (
                        <span className="text-[10px] text-gray-300 font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {phone}
                        </span>
                      )}
                      {n.channel === "whatsapp" && (
                        <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          WhatsApp
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {n.status === "pending" && phone && (
                      <Button
                        size="sm"
                        onClick={() => sendWhatsApp(n)}
                        className="gap-1.5 rounded-xl font-bold text-[10px] h-8 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="h-3 w-3" />
                        Enviar
                      </Button>
                    )}
                    {n.status === "sent" && (
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </CRMLayout>
  )
}

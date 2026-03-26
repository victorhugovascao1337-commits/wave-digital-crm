"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  AlertTriangle,
  Info,
  Megaphone,
  Wrench,
  Trash2,
  Send,
} from "lucide-react"

interface Message {
  id: string
  title: string
  message: string
  type: string
  target: string
  created_at: string
}

const typeConfig: Record<string, { label: string; icon: typeof Info; color: string; badgeClass: string }> = {
  info: { label: "Informação", icon: Info, color: "text-blue-400", badgeClass: "bg-blue-500/20 text-blue-400" },
  alerta: { label: "Alerta", icon: AlertTriangle, color: "text-amber-400", badgeClass: "bg-amber-500/20 text-amber-400" },
  promocao: { label: "Promoção", icon: Megaphone, color: "text-green-400", badgeClass: "bg-green-500/20 text-green-400" },
  manutencao: { label: "Manutenção", icon: Wrench, color: "text-orange-400", badgeClass: "bg-orange-500/20 text-orange-400" },
}

export default function MensagensPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    target: "all",
  })

  const fetchMessages = async () => {
    const res = await fetch("/api/admin/messages")
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchMessages() }, [])

  const handleCreate = async () => {
    setSaving(true)
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setCreateOpen(false)
      setForm({ title: "", message: "", type: "info", target: "all" })
      fetchMessages()
    }
  }

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchMessages()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mensagens</h1>
          <p className="text-sm text-gray-400">
            Envie comunicados para todas as clínicas
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(typeConfig).map(([key, config]) => {
          const count = messages.filter((m) => m.type === key).length
          const Icon = config.icon
          return (
            <div key={key} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="text-xs text-gray-500 uppercase">{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <Send className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500">Nenhuma mensagem enviada ainda</p>
          </div>
        ) : (
          messages.map((msg) => {
            const config = typeConfig[msg.type] || typeConfig.info
            const Icon = config.icon
            return (
              <div
                key={msg.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{msg.title}</h3>
                        <Badge className={config.badgeClass}>{config.label}</Badge>
                        <Badge className="bg-gray-800 text-gray-400">
                          {msg.target === "all" ? "Todas clínicas" : msg.target}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(msg.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-red-400"
                    onClick={() => handleDelete(msg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Message Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Mensagem</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Envie um comunicado para todas as clínicas da plataforma.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Manutenção programada"
              />
            </div>

            <div>
              <Label>Mensagem</Label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva o comunicado em detalhes..."
                className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">📋 Informação</SelectItem>
                    <SelectItem value="alerta">⚠️ Alerta</SelectItem>
                    <SelectItem value="promocao">🎉 Promoção</SelectItem>
                    <SelectItem value="manutencao">🔧 Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destinatário</Label>
                <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Clínicas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!form.title || !form.message || saving}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {saving ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

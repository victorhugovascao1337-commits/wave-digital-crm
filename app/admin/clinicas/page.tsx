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
  Search,
  Building2,
  Mail,
  KeyRound,
  User,
  Eye,
  EyeOff,
  MoreHorizontal,
  Power,
  LogIn,
} from "lucide-react"

interface Clinic {
  id: string
  name: string
  type: string
  admin_email: string
  admin_user_id: string | null
  status: string
  created_at: string
  plan_type: string
  plan_price: number
  plan_start_date: string
  plan_end_date: string
  auto_renewal: boolean
}

const planTypes = [
  { value: "mensal", label: "Mensal", days: 31, price: 149 },
  { value: "trimestral", label: "Trimestral", days: 90, price: 399 },
  { value: "anual", label: "Anual", days: 365, price: 1399 },
]

const clinicTypes = [
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "odontologia", label: "Odontologia" },
  { value: "psicologia", label: "Psicologia" },
  { value: "estetica", label: "Estética" },
  { value: "nutricao", label: "Nutrição" },
  { value: "clinica_geral", label: "Clínica Geral" },
  { value: "pilates", label: "Pilates" },
  { value: "fonoaudiologia", label: "Fonoaudiologia" },
  { value: "acupuntura", label: "Acupuntura" },
  { value: "quiropraxia", label: "Quiropraxia" },
]

const typeLabels: Record<string, string> = Object.fromEntries(
  clinicTypes.map((t) => [t.value, t.label])
)

export default function ClinicasPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    type: "fisioterapia",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    plan_type: "mensal",
    auto_renewal: true,
  })

  const fetchClinics = async () => {
    const res = await fetch("/api/admin/clinics")
    const data = await res.json()
    setClinics(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchClinics()
  }, [])

  const handleCreate = async () => {
    setError("")
    setSaving(true)

    const res = await fetch("/api/admin/clinics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || "Erro ao criar clínica")
      return
    }

    setCreateOpen(false)
    setForm({ name: "", type: "fisioterapia", admin_name: "", admin_email: "", admin_password: "", plan_type: "mensal", auto_renewal: true })
    fetchClinics()
  }

  const toggleStatus = async (clinic: Clinic) => {
    const newStatus = clinic.status === "active" ? "inactive" : "active"
    await fetch(`/api/admin/clinics/${clinic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setMenuOpen(null)
    fetchClinics()
  }

  const filtered = clinics.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.admin_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-white">Clínicas</h1>
          <p className="text-sm text-gray-400">
            {clinics.length} clínica{clinics.length !== 1 ? "s" : ""} cadastrada{clinics.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => { setCreateOpen(true); setError("") }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Clínica
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar clínica..."
          className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-visible">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-2">Clínica</div>
          <div className="col-span-1">Tipo</div>
          <div className="col-span-2">Admin</div>
          <div className="col-span-1">Plano</div>
          <div className="col-span-2">Validade</div>
          <div className="col-span-1">Renovação</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Criada</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p>Nenhuma clínica encontrada</p>
          </div>
        ) : (
          filtered.map((clinic) => (
            <div
              key={clinic.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
            >
              <div className="col-span-2 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-white truncate">{clinic.name}</p>
              </div>

              <div className="col-span-1">
                <span className="text-xs text-gray-400">
                  {typeLabels[clinic.type] || clinic.type}
                </span>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-300 truncate">{clinic.admin_email}</p>
              </div>

              <div className="col-span-1">
                <Badge className={
                  clinic.plan_type === "anual" ? "bg-purple-500/20 text-purple-400" :
                  clinic.plan_type === "trimestral" ? "bg-blue-500/20 text-blue-400" :
                  "bg-gray-800 text-gray-300"
                }>
                  {clinic.plan_type === "anual" ? "Anual" : clinic.plan_type === "trimestral" ? "Trimestral" : "Mensal"}
                </Badge>
              </div>

              <div className="col-span-2">
                {(() => {
                  const endDate = clinic.plan_end_date ? new Date(clinic.plan_end_date) : null
                  const now = new Date()
                  const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
                  const isExpired = daysLeft <= 0
                  const isExpiring = daysLeft > 0 && daysLeft <= 7
                  return (
                    <div>
                      <p className={`text-xs font-medium ${isExpired ? "text-red-400" : isExpiring ? "text-amber-400" : "text-gray-400"}`}>
                        {endDate ? endDate.toLocaleDateString("pt-BR") : "—"}
                      </p>
                      {isExpired && <p className="text-[10px] text-red-400">Expirado</p>}
                      {isExpiring && <p className="text-[10px] text-amber-400">{daysLeft}d restantes</p>}
                      {!isExpired && !isExpiring && daysLeft > 0 && <p className="text-[10px] text-gray-600">{daysLeft}d restantes</p>}
                    </div>
                  )
                })()}
              </div>

              <div className="col-span-1">
                <Badge className={clinic.auto_renewal ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-500"}>
                  {clinic.auto_renewal ? "Auto" : "Manual"}
                </Badge>
              </div>

              <div className="col-span-1">
                <Badge className={clinic.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                  {clinic.status === "active" ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              <div className="col-span-1">
                <p className="text-xs text-gray-600">
                  {new Date(clinic.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="col-span-1 flex justify-end relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-white"
                  onClick={() => setMenuOpen(menuOpen === clinic.id ? null : clinic.id)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                {menuOpen === clinic.id && (
                  <div className="absolute right-0 top-8 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 w-48">
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2"
                      onClick={async () => {
                        setMenuOpen(null)
                        const res = await fetch("/api/admin/login-as", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ clinic_id: clinic.id }),
                        })
                        const data = await res.json()
                        if (data.redirect) {
                          window.open(data.redirect, "_blank")
                        } else {
                          alert(data.error || "Erro ao logar na clínica")
                        }
                      }}
                    >
                      <LogIn className="h-4 w-4" />
                      Logar na Clínica
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => toggleStatus(clinic)}
                    >
                      <Power className="h-4 w-4" />
                      {clinic.status === "active" ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Clinic Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Clínica</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Crie uma nova clínica e o acesso admin dela.
            </p>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Clinic Info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dados da Clínica
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome da Clínica</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Clínica Saúde Plena"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Tipo de Serviço</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acesso do Administrador
              </p>
            </div>

            <div>
              <Label>Nome do Admin</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.admin_name}
                  onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                  placeholder="Dr. João Silva"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>E-mail do Admin</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  placeholder="admin@clinica.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Senha do Admin</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.admin_password}
                  onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Plano de Assinatura
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {planTypes.map((plan) => (
                <button
                  key={plan.value}
                  type="button"
                  onClick={() => setForm({ ...form, plan_type: plan.value })}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.plan_type === plan.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold">{plan.label}</p>
                  <p className="text-lg font-bold text-primary">R$ {plan.price}</p>
                  <p className="text-xs text-muted-foreground">{plan.days} dias</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Renovação Automática</p>
                <p className="text-xs text-muted-foreground">Renovar automaticamente ao expirar</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, auto_renewal: !form.auto_renewal })}
                className={`w-11 h-6 rounded-full transition-colors ${
                  form.auto_renewal ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.auto_renewal ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!form.name || !form.admin_email || !form.admin_password || saving}
              >
                {saving ? "Criando..." : "Criar Clínica"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

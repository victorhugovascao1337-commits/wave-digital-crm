"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Loader2 } from "lucide-react"
import type { Patient } from "@/lib/database.types"

interface PatientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: Patient | null
  onSuccess: () => void
}

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function PatientFormModal({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    birth_date: "",
    notes: "",
    status: "active" as "active" | "inactive" | "pending",
    cep: "",
    street: "",
    street_number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    payment_type: "per_session",
    plan_name: "",
    plan_sessions: "",
    plan_value: "",
    session_value: "",
  })

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        cpf: patient.cpf || "",
        birth_date: patient.birth_date || "",
        notes: patient.notes || "",
        status: patient.status || "active",
        cep: patient.cep || "",
        street: patient.street || "",
        street_number: patient.street_number || "",
        complement: patient.complement || "",
        neighborhood: patient.neighborhood || "",
        city: patient.city || "",
        state: patient.state || "",
        payment_type: patient.payment_type || "per_session",
        plan_name: patient.plan_name || "",
        plan_sessions: patient.plan_sessions ? String(patient.plan_sessions) : "",
        plan_value: patient.plan_value ? String(patient.plan_value) : "",
        session_value: patient.session_value ? String(patient.session_value) : "",
      })
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        cpf: "",
        birth_date: "",
        notes: "",
        status: "active",
        cep: "",
        street: "",
        street_number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        payment_type: "per_session",
        plan_name: "",
        plan_sessions: "",
        plan_value: "",
        session_value: "",
      })
    }
  }, [patient, open])

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handleCepChange = async (value: string) => {
    const formattedCep = formatCep(value)
    setFormData({ ...formData, cep: formattedCep })

    const digits = value.replace(/\D/g, "")
    if (digits.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data: ViaCepResponse = await response.json()
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            cep: formattedCep,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
            complement: data.complemento || prev.complement,
          }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = patient
        ? `/api/patients/${patient.id}`
        : "/api/patients"
      const method = patient ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao salvar paciente")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar paciente:", error)
    } finally {
      setLoading(false)
    }
  }

  const isEditing = !!patient

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? "Formulário para editar dados do paciente" : "Formulário para cadastrar novo paciente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Dados Pessoais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Digite o nome do paciente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({ ...formData, cpf: formatCpf(e.target.value) })
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: formatPhone(e.target.value) })
                  }
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="Nome da rua"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street_number">Número</Label>
                <Input
                  id="street_number"
                  value={formData.street_number}
                  onChange={(e) =>
                    setFormData({ ...formData, street_number: e.target.value })
                  }
                  placeholder="Nº"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) =>
                    setFormData({ ...formData, complement: e.target.value })
                  }
                  placeholder="Apt, Bloco, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) =>
                    setFormData({ ...formData, neighborhood: e.target.value })
                  }
                  placeholder="Bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Tipo de Pagamento */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Forma de Pagamento</h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "per_session", label: "Por Consulta", desc: "Paga a cada sessão realizada" },
                { value: "plan", label: "Plano/Pacote", desc: "Pacote de sessões com valor fixo" },
                { value: "monthly", label: "Mensalidade", desc: "Valor fixo mensal" },
                { value: "insurance", label: "Convênio", desc: "Coberto por plano de saúde" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_type: option.value })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.payment_type === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>

            {formData.payment_type === "per_session" && (
              <div className="space-y-2">
                <Label htmlFor="session_value">Valor por Sessão (R$)</Label>
                <Input
                  id="session_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.session_value}
                  onChange={(e) =>
                    setFormData({ ...formData, session_value: e.target.value })
                  }
                  placeholder="150,00"
                />
              </div>
            )}

            {formData.payment_type === "plan" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="plan_name">Nome do Plano</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name}
                    onChange={(e) =>
                      setFormData({ ...formData, plan_name: e.target.value })
                    }
                    placeholder="Ex: Pacote 10 sessões"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_sessions">Qtd. de Sessões</Label>
                    <Input
                      id="plan_sessions"
                      type="number"
                      min="1"
                      value={formData.plan_sessions}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_sessions: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan_value">Valor do Plano (R$)</Label>
                    <Input
                      id="plan_value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.plan_value}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_value: e.target.value })
                      }
                      placeholder="1.200,00"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.payment_type === "monthly" && (
              <div className="space-y-2">
                <Label htmlFor="plan_value_monthly">Valor da Mensalidade (R$)</Label>
                <Input
                  id="plan_value_monthly"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.plan_value}
                  onChange={(e) =>
                    setFormData({ ...formData, plan_value: e.target.value })
                  }
                  placeholder="500,00"
                />
              </div>
            )}

            {formData.payment_type === "insurance" && (
              <div className="space-y-2">
                <Label htmlFor="plan_name_insurance">Nome do Convênio</Label>
                <Input
                  id="plan_name_insurance"
                  value={formData.plan_name}
                  onChange={(e) =>
                    setFormData({ ...formData, plan_name: e.target.value })
                  }
                  placeholder="Ex: Unimed, Bradesco Saúde..."
                />
              </div>
            )}
          </div>

          {/* Status e Observações */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "pending") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Histórico médico, alergias, observações importantes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Salvar alterações" : "Criar paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

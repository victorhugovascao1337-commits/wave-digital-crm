"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { durations } from "@/lib/data"
import { SERVICES_BY_TYPE, SERVICES } from "@/lib/types"
import type { Patient } from "@/lib/database.types"

interface NovaConsultaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NovaConsultaModal({ open, onOpenChange, onSuccess }: NovaConsultaModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [clinicServices, setClinicServices] = useState<string[]>([])
  const [formData, setFormData] = useState({
    paciente: "",
    data: new Date().toISOString().split("T")[0],
    horario: "09:00",
    duracao: "60 min",
    valor: "150",
    servico: "",
    observacoes: "",
  })

  // Load clinic-specific services
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const type = data.clinic_type || "fisioterapia"
        const services = SERVICES_BY_TYPE[type] || SERVICES
        setClinicServices(services)
        setFormData((prev) => ({ ...prev, servico: prev.servico || services[0] }))
      })
      .catch(() => {
        setClinicServices(SERVICES)
        setFormData((prev) => ({ ...prev, servico: prev.servico || SERVICES[0] }))
      })
  }, [])

  useEffect(() => {
    if (open) {
      fetchPatients()
    }
  }, [open])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/patients")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDurationMinutes = (duration: string) => {
    const match = duration.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 60
  }

  const calculateEndTime = (startTime: string, duration: string) => {
    const [hours, minutes] = startTime.split(":").map(Number)
    const durationMinutes = getDurationMinutes(duration)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const endTime = calculateEndTime(formData.horario, formData.duracao)
      
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: formData.paciente,
          date: formData.data,
          start_time: formData.horario,
          end_time: endTime,
          service: formData.servico,
          amount: parseFloat(formData.valor) || 0,
          notes: formData.observacoes || null,
          status: "scheduled",
        }),
      })

      if (response.ok) {
        onSuccess?.()
        onOpenChange(false)
        // Reset form
        setFormData({
          paciente: "",
          data: new Date().toISOString().split("T")[0],
          horario: "09:00",
          duracao: "60 min",
          valor: "150",
          servico: clinicServices[0] || "",
          observacoes: "",
        })
      }
    } catch (error) {
      console.error("Erro ao criar consulta:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nova Consulta</DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para agendar nova consulta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="paciente">Paciente *</Label>
            <Select
              value={formData.paciente}
              onValueChange={(value) => setFormData({ ...formData, paciente: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <Spinner className="h-4 w-4" />
                  </div>
                ) : patients && patients.length > 0 ? (
                  patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Nenhum paciente encontrado
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horario">Horário *</Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração</Label>
              <Select
                value={formData.duracao}
                onValueChange={(value) => setFormData({ ...formData, duracao: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                placeholder="150"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <Select
              value={formData.servico}
              onValueChange={(value) => setFormData({ ...formData, servico: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {clinicServices.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Notas opcionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90"
              disabled={submitting || !formData.paciente}
            >
              {submitting && <Spinner className="mr-2 h-4 w-4" />}
              Agendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

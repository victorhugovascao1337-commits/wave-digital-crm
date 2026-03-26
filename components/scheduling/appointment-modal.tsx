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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Appointment,
  AppointmentFormData,
  Patient,
  SERVICES,
  SERVICES_BY_TYPE,
  DURATIONS,
  TIME_SLOTS,
  PROFESSIONALS,
  statusColors,
  AppointmentStatus,
} from "@/lib/types"
import { Trash2 } from "lucide-react"

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  patients: Patient[]
  defaultDate?: string
  defaultTime?: string
  onSave: (data: AppointmentFormData) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onStatusChange?: (id: string, status: AppointmentStatus) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function AppointmentModal({
  open,
  onClose,
  appointment,
  patients,
  defaultDate,
  defaultTime,
  onSave,
  onDelete,
  onStatusChange,
  isLoading,
  error,
}: AppointmentModalProps) {
  const isEditing = !!appointment
  const [clinicServices, setClinicServices] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const type = data.clinic_type || "fisioterapia"
        setClinicServices(SERVICES_BY_TYPE[type] || SERVICES)
      })
      .catch(() => setClinicServices(SERVICES))
  }, [])

  const [formData, setFormData] = useState<AppointmentFormData>({
    patient_id: "",
    date: "",
    start_time: "09:00",
    duration: 60,
    service: "",
    price: 150,
    notes: "",
    professional: PROFESSIONALS[0],
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (appointment) {
      setFormData({
        patient_id: appointment.patient_id,
        date: appointment.date,
        start_time: appointment.start_time,
        duration: appointment.duration,
        service: appointment.service,
        price: appointment.price,
        notes: appointment.notes || "",
        professional: (appointment as Record<string, unknown>).professional as string || PROFESSIONALS[0],
      })
    } else if (clinicServices.length > 0) {
      setFormData({
        patient_id: "",
        date: defaultDate || new Date().toISOString().split("T")[0],
        start_time: defaultTime || "09:00",
        duration: 60,
        service: clinicServices[0],
        price: 150,
        notes: "",
        professional: PROFESSIONALS[0],
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment, defaultDate, defaultTime, open, clinicServices.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const handleDelete = async () => {
    if (appointment && onDelete) {
      await onDelete(appointment.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Consulta" : "Nova Consulta"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? "Formulário para editar consulta" : "Formulário para agendar nova consulta"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) =>
                setFormData({ ...formData, patient_id: value })
              }
            >
              <SelectTrigger id="patient" className="w-full">
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
            <Label htmlFor="professional">Profissional *</Label>
            <Select
              value={formData.professional}
              onValueChange={(value) =>
                setFormData({ ...formData, professional: value })
              }
            >
              <SelectTrigger id="professional" className="w-full">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONALS.map((prof) => (
                  <SelectItem key={prof} value={prof}>
                    {prof}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Select
                value={formData.start_time}
                onValueChange={(value) =>
                  setFormData({ ...formData, start_time: value })
                }
              >
                <SelectTrigger id="time" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração</Label>
              <Select
                value={String(formData.duration)}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: parseInt(value) })
                }
              >
                <SelectTrigger id="duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Valor (R$)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={10}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Select
              value={formData.service}
              onValueChange={(value) =>
                setFormData({ ...formData, service: value })
              }
            >
              <SelectTrigger id="service" className="w-full">
                <SelectValue />
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
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas opcionais..."
            />
          </div>

          {isEditing && appointment && onStatusChange && (
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {(["pending", "confirmed", "completed", "missed"] as AppointmentStatus[]).map(
                  (status) => {
                    const style = statusColors[status]
                    const isActive = appointment.status === status

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onStatusChange(appointment.id, status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive
                            ? `${style.bg} ${style.text}`
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {style.label}
                      </button>
                    )
                  }
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.patient_id}>
              {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

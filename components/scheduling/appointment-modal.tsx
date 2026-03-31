"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Trash2, Clock, User, CalendarDays, Repeat, Lock, DollarSign, FileText, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Appointment, AppointmentFormData, AppointmentStatus, Patient } from "@/lib/types"
import {
  statusColors,
  STATUS_FLOW,
  PROFESSIONALS,
  DURATIONS,
  RECURRENCE_OPTIONS,
  TIME_SLOTS,
  SERVICES_BY_TYPE,
} from "@/lib/types"

interface AppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  patients: Patient[]
  defaultDate: string
  defaultTime?: string
  onSave: (data: AppointmentFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>
  isLoading: boolean
  error: string | null
  blockMode?: boolean
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
  blockMode = false,
}: AppointmentModalProps) {
  const [patientId, setPatientId] = useState("")
  const [date, setDate] = useState(defaultDate)
  const [startTime, setStartTime] = useState(defaultTime || "09:00")
  const [duration, setDuration] = useState(60)
  const [service, setService] = useState("")
  const [price, setPrice] = useState(0)
  const [notes, setNotes] = useState("")
  const [professional, setProfessional] = useState("")
  const [recurrence, setRecurrence] = useState("none")
  const [isBlock, setIsBlock] = useState(blockMode)
  const [blockReason, setBlockReason] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // All services flattened
  const allServices = useMemo(() => {
    const all: string[] = []
    Object.values(SERVICES_BY_TYPE).forEach((list) => {
      list.forEach((s) => { if (!all.includes(s)) all.push(s) })
    })
    return all.sort()
  }, [])

  // Reset form on open
  useEffect(() => {
    if (!open) return

    if (appointment) {
      setPatientId(appointment.patient_id || "")
      setDate(appointment.date)
      setStartTime(appointment.start_time?.slice(0, 5) || "09:00")
      setDuration(appointment.duration || 60)
      setService(appointment.service || "")
      setPrice(appointment.price || 0)
      setNotes(appointment.notes || "")
      setProfessional(appointment.professional || "")
      setRecurrence("none")
      setIsBlock(appointment.is_block || false)
      setBlockReason(appointment.block_reason || "")
      setPatientSearch("")

      // Set patient search text
      if (appointment.patient) {
        const p = appointment.patient as any
        setPatientSearch(p.full_name || p.name || "")
      }
    } else {
      setPatientId("")
      setDate(defaultDate)
      setStartTime(defaultTime || "09:00")
      setDuration(60)
      setService("")
      setPrice(0)
      setNotes("")
      setProfessional("")
      setRecurrence("none")
      setIsBlock(blockMode)
      setBlockReason("")
      setPatientSearch("")
    }
    setConfirmDelete(false)
    setShowPatientDropdown(false)
  }, [open, appointment, defaultDate, defaultTime, blockMode])

  // Filter patients by search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 20)
    const term = patientSearch.toLowerCase()
    return patients.filter((p) => {
      const name = ((p as any).full_name || p.name || "").toLowerCase()
      const phone = (p.phone || "").toLowerCase()
      return name.includes(term) || phone.includes(term)
    }).slice(0, 20)
  }, [patients, patientSearch])

  const selectedPatient = patients.find((p) => p.id === patientId)

  const handleSubmit = () => {
    if (!isBlock && !patientId) return

    onSave({
      patient_id: isBlock ? "" : patientId,
      date,
      start_time: startTime,
      duration,
      service: isBlock ? (blockReason || "Bloqueio") : service,
      price: isBlock ? 0 : price,
      notes,
      professional,
      recurrence: appointment ? undefined : recurrence,
      is_block: isBlock,
      block_reason: isBlock ? blockReason : undefined,
    })
  }

  // Valid next statuses for current appointment
  const nextStatuses = appointment ? (STATUS_FLOW[appointment.status] || []) : []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b",
          isBlock ? "bg-gray-50" : appointment ? "bg-blue-50" : "bg-emerald-50"
        )}>
          <div className="flex items-center gap-3">
            {isBlock ? (
              <Lock className="h-5 w-5 text-gray-600" />
            ) : (
              <CalendarDays className={cn("h-5 w-5", appointment ? "text-blue-600" : "text-emerald-600")} />
            )}
            <h2 className="text-lg font-bold text-gray-800">
              {isBlock
                ? "Bloquear Horário"
                : appointment
                  ? "Detalhes da Consulta"
                  : "Nova Consulta"
              }
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Status bar for existing appointments */}
        {appointment && !isBlock && (
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 mr-1">Status:</span>
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full",
              statusColors[appointment.status].bg,
              statusColors[appointment.status].text
            )}>
              {statusColors[appointment.status].label}
            </span>

            {nextStatuses.length > 0 && (
              <>
                <span className="text-xs text-gray-300 mx-1">&rarr;</span>
                {nextStatuses.map((ns) => (
                  <button
                    key={ns}
                    onClick={() => onStatusChange(appointment.id, ns)}
                    disabled={isLoading}
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:scale-105 hover:shadow-sm",
                      statusColors[ns].bg, statusColors[ns].text,
                      "opacity-80 hover:opacity-100"
                    )}
                  >
                    {statusColors[ns].label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Block mode toggle (only for new) */}
          {!appointment && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBlock(false)}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all",
                  !isBlock
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <CalendarDays className="h-4 w-4 inline mr-1.5" />
                Consulta
              </button>
              <button
                type="button"
                onClick={() => setIsBlock(true)}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all",
                  isBlock
                    ? "border-gray-700 bg-gray-100 text-gray-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <Lock className="h-4 w-4 inline mr-1.5" />
                Bloqueio
              </button>
            </div>
          )}

          {/* Patient selection (not for blocks) */}
          {!isBlock && (
            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Paciente
              </label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  setShowPatientDropdown(true)
                  if (!e.target.value) setPatientId("")
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Buscar paciente por nome ou telefone..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map((p) => {
                    const name = (p as any).full_name || p.name || "—"
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPatientId(p.id)
                          setPatientSearch(name)
                          setShowPatientDropdown(false)
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors text-sm",
                          patientId === p.id && "bg-blue-50"
                        )}
                      >
                        <span className="font-medium text-gray-800">{name}</span>
                        {p.phone && <span className="text-gray-400 ml-2">{p.phone}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Block reason */}
          {isBlock && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Motivo do Bloqueio
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Almoço, Reunião, Intervalo..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Horário
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration & Professional row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Duração
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5" />
                Profissional
              </label>
              <select
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {PROFESSIONALS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service & Price (not for blocks) */}
          {!isBlock && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Serviço
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {allServices.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Valor (R$)
                </label>
                <input
                  type="number"
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="0,00"
                  min={0}
                  step={10}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Recurrence (only for new appointments) */}
          {!appointment && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Recorrência
              </label>
              <div className="flex gap-2">
                {RECURRENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurrence(opt.value)}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all",
                      recurrence === opt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {recurrence !== "none" && (
                <p className="text-[10px] text-blue-600 mt-1.5 bg-blue-50 rounded-lg px-3 py-1.5">
                  Serão criados 12 agendamentos no total ({recurrence === "weekly" ? "semanalmente" : recurrence === "biweekly" ? "quinzenalmente" : "mensalmente"})
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anotações sobre a consulta..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center gap-3 bg-gray-50">
          {/* Delete button */}
          {appointment && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Confirmar exclusão?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(appointment.id)}
                  disabled={isLoading}
                >
                  Sim, excluir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )
          )}

          <div className="flex-1" />

          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!isBlock && !patientId)}
            className={cn(
              isBlock
                ? "bg-gray-700 hover:bg-gray-800"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading ? "Salvando..." : appointment ? "Atualizar" : isBlock ? "Bloquear" : "Agendar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

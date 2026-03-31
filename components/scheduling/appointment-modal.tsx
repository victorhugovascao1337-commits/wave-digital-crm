"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Trash2, Clock, User, CalendarDays, Repeat, Lock, DollarSign, FileText, Stethoscope, CheckCircle2 } from "lucide-react"
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

const PAYMENT_METHODS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão Crédito",
  debit_card: "Cartão Débito",
  cash: "Dinheiro",
  bank_transfer: "Transferência",
  boleto: "Boleto",
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

  // Payment state
  const [payment, setPayment] = useState<any>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showPaymentMethod, setShowPaymentMethod] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("pix")

  // All services flattened
  const allServices = useMemo(() => {
    const all: string[] = []
    Object.values(SERVICES_BY_TYPE).forEach((list) => {
      list.forEach((s) => { if (!all.includes(s)) all.push(s) })
    })
    return all.sort()
  }, [])

  // Fetch payment associated with this appointment
  useEffect(() => {
    if (!open || !appointment?.id) {
      setPayment(null)
      return
    }

    fetch(`/api/payments?patient_id=${appointment.patient_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Find payment linked to this appointment
          const linked = data.find((p: any) => p.appointment_id === appointment.id)
          setPayment(linked || null)
        }
      })
      .catch(() => setPayment(null))
  }, [open, appointment?.id, appointment?.patient_id])

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
      setShowPaymentMethod(false)
      setPaymentError(null)

      // Set patient search text
      if (appointment.patient) {
        const p = appointment.patient as any
        setPatientSearch(p.name || p.full_name || "")
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
      setShowPaymentMethod(false)
      setPaymentError(null)
    }
    setConfirmDelete(false)
    setShowPatientDropdown(false)
  }, [open, appointment, defaultDate, defaultTime, blockMode])

  // Filter patients by search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 20)
    const term = patientSearch.toLowerCase()
    return patients.filter((p) => {
      const name = ((p as any).name || (p as any).full_name || "").toLowerCase()
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

  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleConfirmPayment = async () => {
    if (!payment) return
    setPaymentLoading(true)
    setPaymentError(null)
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payment.id,
          patient_id: payment.patient_id,
          description: payment.description,
          amount: payment.amount,
          status: "paid",
          payment_method: selectedPaymentMethod,
          payment_date: today,
          due_date: payment.due_date,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPayment(updated)
        setShowPaymentMethod(false)
      } else {
        const errData = await res.json().catch(() => null)
        const msg = errData?.error || `Erro ${res.status} ao confirmar pagamento`
        console.error("Erro ao confirmar pagamento:", msg, errData)
        setPaymentError(msg)
      }
    } catch (err: any) {
      console.error("Erro ao confirmar pagamento:", err)
      setPaymentError(err?.message || "Erro de conexão ao confirmar pagamento")
    } finally {
      setPaymentLoading(false)
    }
  }

  // DB constraint only allows: PENDENTE, CONFIRMADO, CONCLUÍDO, FALTOU, CANCELADO
  // Override STATUS_FLOW to only use allowed transitions
  const SAFE_STATUS_FLOW: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "missed", "cancelled"],
    completed: [],
    missed: [],
    cancelled: [],
    // Fallback for any legacy statuses
    arrived: ["completed", "missed"],
    in_progress: ["completed"],
    blocked: [],
  }
  const nextStatuses = appointment
    ? (SAFE_STATUS_FLOW[appointment.status] || STATUS_FLOW[appointment.status] || [])
    : []

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

        {/* Payment bar for existing appointments with value */}
        {appointment && !isBlock && payment && (
          <div className={cn(
            "px-6 border-b",
            payment.status === "paid" ? "bg-emerald-50 py-3" : "bg-amber-50 py-3"
          )}>
            {/* Payment info row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className={cn("h-4 w-4", payment.status === "paid" ? "text-emerald-600" : "text-amber-600")} />
                <span className="text-xs font-medium text-gray-600">Pagamento:</span>
                <span className={cn(
                  "text-sm font-bold",
                  payment.status === "paid" ? "text-emerald-700" : "text-amber-700"
                )}>
                  R$ {Number(payment.amount).toFixed(2).replace(".", ",")}
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  payment.status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                )}>
                  {payment.status === "paid" ? "PAGO" : payment.status === "overdue" ? "ATRASADO" : "PENDENTE"}
                </span>
                {payment.status === "paid" && payment.payment_method && (
                  <span className="text-[10px] text-emerald-600">
                    via {PAYMENT_METHODS[payment.payment_method] || payment.payment_method}
                  </span>
                )}
              </div>

              {payment.status !== "paid" && !showPaymentMethod && (
                <button
                  onClick={() => setShowPaymentMethod(true)}
                  disabled={paymentLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Pagamento
                </button>
              )}
            </div>

            {/* Payment method selector — full width row below */}
            {payment.status !== "paid" && showPaymentMethod && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200">
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={handleConfirmPayment}
                  disabled={paymentLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {paymentLoading ? "Salvando..." : "Confirmar"}
                </button>
                <button
                  onClick={() => { setShowPaymentMethod(false); setPaymentError(null) }}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm rounded-lg hover:bg-white/50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Error */}
          {(error || paymentError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error || paymentError}
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
                    const name = (p as any).name || (p as any).full_name || "—"
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

"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Appointment, Patient, AppointmentFormData } from "@/lib/types"

function getSupabase() {
  return createClient()
}

let _clinicId: string | null | undefined = undefined
async function getClinicId(): Promise<string | null> {
  if (_clinicId !== undefined) return _clinicId
  try {
    const res = await fetch("/api/me")
    const data = await res.json()
    _clinicId = data.clinic_id || null
  } catch {
    _clinicId = null
  }
  return _clinicId
}

const statusToDb: Record<string, string> = {
  confirmed: "CONFIRMADO",
  pending: "PENDENTE",
  completed: "CONCLUÍDO",
  missed: "FALTOU",
  cancelled: "CANCELADO",
  arrived: "CHEGOU",
  in_progress: "EM ATENDIMENTO",
}

const statusFromDb: Record<string, string> = {
  CONFIRMADO: "confirmed",
  PENDENTE: "pending",
  "CONCLUÍDO": "completed",
  FALTOU: "missed",
  CANCELADO: "cancelled",
  CHEGOU: "arrived",
  "EM ATENDIMENTO": "in_progress",
}

function mapAppointmentFromDb(apt: Record<string, unknown>): Appointment {
  return {
    ...apt,
    status: statusFromDb[apt.status as string] || apt.status,
    price: apt.value,
  } as unknown as Appointment
}

async function fetchAppointments(date?: string): Promise<Appointment[]> {
  const supabase = getSupabase()
  const clinicId = await getClinicId()

  let query = supabase
    .from("appointments")
    .select(`*, patient:patients(*)`)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (date) query = query.eq("date", date)
  if (clinicId) query = query.eq("clinic_id", clinicId)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map((d: Record<string, unknown>) => mapAppointmentFromDb(d))
}

async function fetchAppointmentsByRange(startDate: string, endDate: string): Promise<Appointment[]> {
  const supabase = getSupabase()
  const clinicId = await getClinicId()

  let query = supabase
    .from("appointments")
    .select(`*, patient:patients(*)`)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (clinicId) query = query.eq("clinic_id", clinicId)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map((d: Record<string, unknown>) => mapAppointmentFromDb(d))
}

async function fetchPatients(): Promise<Patient[]> {
  const supabase = getSupabase()
  const clinicId = await getClinicId()

  let query = supabase
    .from("patients")
    .select("*")
    .in("status", ["active", "Ativo"])
    .order("name", { ascending: true })

  if (clinicId) query = query.eq("clinic_id", clinicId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export function useAppointments(date?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAppointments(date)
      setAppointments(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [date])

  useEffect(() => { mutate() }, [mutate])
  return { appointments, isLoading, error, mutate }
}

export function useWeekAppointments(startDate: string, endDate: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAppointmentsByRange(startDate, endDate)
      setAppointments(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { mutate() }, [mutate])
  return { appointments, isLoading, error, mutate }
}

export function useMonthAppointments(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAppointmentsByRange(startDate, endDate)
      setAppointments(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { mutate() }, [mutate])
  return { appointments, isLoading, error, mutate }
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchPatients()
      setPatients(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { mutate() }, [mutate])
  return { patients, isLoading, error, mutate }
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
}

export async function checkTimeConflict(
  date: string, startTime: string, duration: number, excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase()
  const endTime = calculateEndTime(startTime, duration)
  let query = supabase
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("date", date)
    .neq("status", "CANCELADO")
  if (excludeId) query = query.neq("id", excludeId)
  const { data: existing, error } = await query
  if (error) throw error
  for (const apt of existing || []) {
    if (
      (startTime >= apt.start_time && startTime < apt.end_time) ||
      (endTime > apt.start_time && endTime <= apt.end_time) ||
      (startTime <= apt.start_time && endTime >= apt.end_time)
    ) return true
  }
  return false
}

export async function createAppointment(data: AppointmentFormData): Promise<Appointment> {
  const supabase = getSupabase()
  const endTime = calculateEndTime(data.start_time, data.duration)

  // Skip conflict check for blocks
  if (!data.is_block) {
    const hasConflict = await checkTimeConflict(data.date, data.start_time, data.duration)
    if (hasConflict) throw new Error("Conflito de horário: já existe uma consulta neste horário")
  }

  const clinicId = await getClinicId()

  // Handle recurrence
  const dates: string[] = [data.date]
  if (data.recurrence && data.recurrence !== "none") {
    const baseDate = new Date(data.date + "T12:00:00")
    for (let i = 1; i <= 11; i++) {
      const next = new Date(baseDate)
      if (data.recurrence === "weekly") next.setDate(next.getDate() + 7 * i)
      else if (data.recurrence === "biweekly") next.setDate(next.getDate() + 14 * i)
      else if (data.recurrence === "monthly") next.setMonth(next.getMonth() + i)
      dates.push(next.toISOString().split("T")[0])
    }
  }

  let lastAppointment: Appointment | null = null

  for (const appointmentDate of dates) {
    const insertData: Record<string, unknown> = {
      patient_id: data.is_block ? null : data.patient_id,
      date: appointmentDate,
      start_time: data.start_time,
      end_time: endTime,
      duration: data.duration,
      service: data.is_block ? (data.block_reason || "Bloqueio") : data.service,
      value: data.is_block ? 0 : (data.price || 0),
      notes: data.notes || null,
      status: data.is_block ? "BLOQUEADO" : "PENDENTE",
      professional: data.professional || null,
      clinic_id: clinicId,
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert(insertData)
      .select(`*, patient:patients(*)`)
      .single()

    if (error) throw error

    // Auto-create pending payment if price > 0
    if (!data.is_block && data.price && data.price > 0 && appointment) {
      await supabase.from("payments").insert({
        patient_id: data.patient_id,
        appointment_id: (appointment as Record<string, unknown>).id,
        amount: data.price,
        description: data.service || "Consulta",
        status: "pending",
        due_date: appointmentDate,
        clinic_id: clinicId,
      })
    }

    lastAppointment = mapAppointmentFromDb(appointment as unknown as Record<string, unknown>)
  }

  return lastAppointment!
}

export async function updateAppointment(
  id: string, data: Partial<AppointmentFormData>
): Promise<Appointment> {
  const supabase = getSupabase()

  // Only send valid DB columns — filter out form-only fields
  const updateData: Record<string, unknown> = {}

  if (data.patient_id !== undefined) updateData.patient_id = data.patient_id
  if (data.date !== undefined) updateData.date = data.date
  if (data.start_time !== undefined) updateData.start_time = data.start_time
  if (data.duration !== undefined) updateData.duration = data.duration
  if (data.service !== undefined) updateData.service = data.service
  if (data.price !== undefined) updateData.value = data.price
  if (data.notes !== undefined) updateData.notes = data.notes || null
  if (data.professional !== undefined) updateData.professional = data.professional || null

  // Calculate end_time if start_time and duration are provided
  if (data.start_time && data.duration) {
    updateData.end_time = calculateEndTime(data.start_time, data.duration)
    const hasConflict = await checkTimeConflict(data.date!, data.start_time, data.duration, id)
    if (hasConflict) throw new Error("Conflito de horário: já existe uma consulta neste horário")
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .select(`*, patient:patients(*)`)
    .single()

  if (error) throw error
  return mapAppointmentFromDb(appointment as unknown as Record<string, unknown>)
}

export async function updateAppointmentStatus(
  id: string, status: Appointment["status"]
): Promise<Appointment> {
  const supabase = getSupabase()
  const dbStatus = statusToDb[status] || status
  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: dbStatus })
    .eq("id", id)
    .select(`*, patient:patients(*)`)
    .single()
  if (error) throw error
  return mapAppointmentFromDb(appointment as unknown as Record<string, unknown>)
}

export async function deleteAppointment(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("appointments").delete().eq("id", id)
  if (error) throw error
}

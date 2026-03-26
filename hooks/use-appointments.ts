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
}

const statusFromDb: Record<string, string> = {
  CONFIRMADO: "confirmed",
  PENDENTE: "pending",
  "CONCLUÍDO": "completed",
  FALTOU: "missed",
  CANCELADO: "cancelled",
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
    .select(`
      *,
      patient:patients(*)
    `)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (date) {
    query = query.eq("date", date)
  }
  if (clinicId) {
    query = query.eq("clinic_id", clinicId)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []).map((d: Record<string, unknown>) => mapAppointmentFromDb(d))
}

async function fetchAppointmentsByWeek(startDate: string, endDate: string): Promise<Appointment[]> {
  const supabase = getSupabase()
  const clinicId = await getClinicId()
  let query = supabase
    .from("appointments")
    .select(`
      *,
      patient:patients(*)
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (clinicId) {
    query = query.eq("clinic_id", clinicId)
  }

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

  if (clinicId) {
    query = query.eq("clinic_id", clinicId)
  }

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

  useEffect(() => {
    mutate()
  }, [mutate])

  return {
    appointments,
    isLoading,
    error,
    mutate,
  }
}

export function useWeekAppointments(startDate: string, endDate: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAppointmentsByWeek(startDate, endDate)
      setAppointments(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    mutate()
  }, [mutate])

  return {
    appointments,
    isLoading,
    error,
    mutate,
  }
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

  useEffect(() => {
    mutate()
  }, [mutate])

  return {
    patients,
    isLoading,
    error,
    mutate,
  }
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
}

export async function checkTimeConflict(
  date: string,
  startTime: string,
  duration: number,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase()
  const endTime = calculateEndTime(startTime, duration)

  let query = supabase
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("date", date)
    .neq("status", "CANCELADO")

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data: existingAppointments, error } = await query

  if (error) throw error

  for (const apt of existingAppointments || []) {
    const existingStart = apt.start_time
    const existingEnd = apt.end_time

    if (
      (startTime >= existingStart && startTime < existingEnd) ||
      (endTime > existingStart && endTime <= existingEnd) ||
      (startTime <= existingStart && endTime >= existingEnd)
    ) {
      return true
    }
  }

  return false
}

export async function createAppointment(data: AppointmentFormData): Promise<Appointment> {
  const supabase = getSupabase()
  const endTime = calculateEndTime(data.start_time, data.duration)

  const hasConflict = await checkTimeConflict(data.date, data.start_time, data.duration)
  if (hasConflict) {
    throw new Error("Conflito de horário: já existe uma consulta neste horário")
  }

  const clinicId = await getClinicId()

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: data.patient_id,
      date: data.date,
      start_time: data.start_time,
      end_time: endTime,
      duration: data.duration,
      service: data.service,
      value: data.price,
      notes: data.notes || null,
      status: "PENDENTE",
      professional: data.professional || null,
      clinic_id: clinicId,
    })
    .select(`
      *,
      patient:patients(*)
    `)
    .single()

  if (error) throw error

  // Auto-create pending payment if price > 0
  if (data.price && data.price > 0 && appointment) {
    await supabase.from("payments").insert({
      patient_id: data.patient_id,
      appointment_id: (appointment as Record<string, unknown>).id,
      amount: data.price,
      description: data.service || "Consulta",
      status: "pending",
      due_date: data.date,
      clinic_id: clinicId,
    })
  }

  return mapAppointmentFromDb(appointment as unknown as Record<string, unknown>)
}

export async function updateAppointment(
  id: string,
  data: Partial<AppointmentFormData>
): Promise<Appointment> {
  const supabase = getSupabase()
  const { price, ...rest } = data
  const updateData: Record<string, unknown> = { ...rest }
  if (price !== undefined) {
    updateData.value = price
  }

  if (data.start_time && data.duration) {
    updateData.end_time = calculateEndTime(data.start_time, data.duration)

    const hasConflict = await checkTimeConflict(
      data.date!,
      data.start_time,
      data.duration,
      id
    )
    if (hasConflict) {
      throw new Error("Conflito de horário: já existe uma consulta neste horário")
    }
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      patient:patients(*)
    `)
    .single()

  if (error) throw error
  return mapAppointmentFromDb(appointment as unknown as Record<string, unknown>)
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Promise<Appointment> {
  const supabase = getSupabase()
  const dbStatus = statusToDb[status] || status

  const { data: appointment, error } = await supabase
    .from("appointments")
    .update({ status: dbStatus })
    .eq("id", id)
    .select(`
      *,
      patient:patients(*)
    `)
    .single()

  if (error) throw error
  return mapAppointmentFromDb(appointment as unknown as Record<string, unknown>)
}

export async function deleteAppointment(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("appointments").delete().eq("id", id)
  if (error) throw error
}

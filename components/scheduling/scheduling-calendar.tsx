"use client"

import { useState, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Users, Clock, CheckCircle2, AlertTriangle, Ban, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DailyView } from "./daily-view"
import { WeeklyView } from "./weekly-view"
import { MonthlyView } from "./monthly-view"
import { AppointmentModal } from "./appointment-modal"
import {
  useAppointments,
  useWeekAppointments,
  useMonthAppointments,
  usePatients,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "@/hooks/use-appointments"
import type { Appointment, AppointmentFormData, ViewMode, AppointmentStatus } from "@/lib/types"
import { statusColors, PROFESSIONALS } from "@/lib/types"

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

function getWeekRange(date: Date): { start: string; end: string } {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay() + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: formatDateKey(start), end: formatDateKey(end) }
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

export function SchedulingCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [defaultTime, setDefaultTime] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [professional, setProfessional] = useState("")
  const [blockMode, setBlockMode] = useState(false)

  const dateKey = formatDateKey(selectedDate)
  const weekRange = getWeekRange(selectedDate)
  const monthYear = { year: selectedDate.getFullYear(), month: selectedDate.getMonth() + 1 }

  // Fetch data for all views
  const { appointments: dailyAppointments, mutate: mutateDaily } = useAppointments(dateKey)
  const { appointments: weeklyAppointments, mutate: mutateWeekly } = useWeekAppointments(weekRange.start, weekRange.end)
  const { appointments: monthlyAppointments, mutate: mutateMonthly } = useMonthAppointments(monthYear.year, monthYear.month)
  const { patients } = usePatients()

  const appointments = viewMode === "day" ? dailyAppointments : viewMode === "week" ? weeklyAppointments : monthlyAppointments

  const mutateAll = useCallback(() => {
    mutateDaily()
    mutateWeekly()
    mutateMonthly()
  }, [mutateDaily, mutateWeekly, mutateMonthly])

  // Stats for today
  const todayApts = useMemo(() => {
    const todayKey = formatDateKey(new Date())
    const source = viewMode === "day" ? dailyAppointments : weeklyAppointments
    return source.filter((a) => a.date === todayKey)
  }, [dailyAppointments, weeklyAppointments, viewMode])

  const stats = useMemo(() => ({
    total: todayApts.length,
    confirmed: todayApts.filter((a) => ["confirmed", "arrived", "in_progress"].includes(a.status)).length,
    pending: todayApts.filter((a) => a.status === "pending").length,
    completed: todayApts.filter((a) => a.status === "completed").length,
    missed: todayApts.filter((a) => a.status === "missed").length,
  }), [todayApts])

  const handlePrevious = () => {
    const d = new Date(selectedDate)
    if (viewMode === "day") d.setDate(d.getDate() - 1)
    else if (viewMode === "week") d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setSelectedDate(d)
  }

  const handleNext = () => {
    const d = new Date(selectedDate)
    if (viewMode === "day") d.setDate(d.getDate() + 1)
    else if (viewMode === "week") d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setSelectedDate(d)
  }

  const handleToday = () => setSelectedDate(new Date())

  const handleSelectAppointment = useCallback((apt: Appointment) => {
    setSelectedAppointment(apt)
    setDefaultTime(undefined)
    setBlockMode(false)
    setError(null)
    setModalOpen(true)
  }, [])

  const handleSelectSlot = useCallback((date: Date | string, time: string) => {
    const targetDate = typeof date === "string" ? new Date(date + "T00:00:00") : date
    setSelectedDate(targetDate)
    setSelectedAppointment(null)
    setDefaultTime(time)
    setError(null)
    setModalOpen(true)
  }, [])

  const handleSelectSlotDaily = useCallback((time: string) => {
    handleSelectSlot(selectedDate, time)
  }, [selectedDate, handleSelectSlot])

  const handleMonthSelectDate = useCallback((date: Date) => {
    setSelectedDate(date)
    setViewMode("day")
  }, [])

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedAppointment(null)
    setDefaultTime(undefined)
    setBlockMode(false)
    setError(null)
  }

  const handleSave = async (data: AppointmentFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      if (selectedAppointment) {
        await updateAppointment(selectedAppointment.id, data)
      } else {
        await createAppointment(data)
      }
      mutateAll()
      handleCloseModal()
    } catch (err: any) {
      console.error("Erro ao salvar consulta:", err)
      setError(err?.message || String(err) || "Erro ao salvar consulta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await deleteAppointment(id)
      mutateAll()
      handleCloseModal()
    } catch (err: any) {
      console.error("Erro ao excluir consulta:", err)
      setError(err?.message || String(err) || "Erro ao excluir consulta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await updateAppointmentStatus(id, status)
      setSelectedAppointment(updated)
      mutateAll()
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err)
      setError(err?.message || String(err) || "Erro ao atualizar status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, status)
      mutateAll()
    } catch {
      // silent fail for quick actions
    }
  }, [mutateAll])

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm">
      {/* Stats Bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-bold text-gray-700">{stats.total}</span>
          <span className="text-[10px] text-gray-400">hoje</span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg px-3 py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-bold text-blue-700">{stats.confirmed}</span>
          <span className="text-[10px] text-blue-400">confirmados</span>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-700">{stats.pending}</span>
          <span className="text-[10px] text-amber-400">pendentes</span>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-3 py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">{stats.completed}</span>
          <span className="text-[10px] text-emerald-400">concluídos</span>
        </div>
        {stats.missed > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-bold text-red-700">{stats.missed}</span>
            <span className="text-[10px] text-red-400">faltas</span>
          </div>
        )}

        {/* Professional filter */}
        <div className="ml-auto flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos profissionais</option>
            {PROFESSIONALS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">{getMonthName(selectedDate)}</h2>
          <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border p-1">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {{ day: "Dia", week: "Semana", month: "Mês" }[mode]}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAppointment(null)
              setDefaultTime(undefined)
              setBlockMode(true)
              setError(null)
              setModalOpen(true)
            }}
          >
            <Lock className="h-4 w-4 mr-1" />
            Bloquear
          </Button>

          <Button onClick={() => {
            setSelectedAppointment(null)
            setDefaultTime(undefined)
            setBlockMode(false)
            setError(null)
            setModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden p-4">
        {viewMode === "day" ? (
          <DailyView
            date={selectedDate}
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onSelectSlot={handleSelectSlotDaily}
            onQuickStatus={handleQuickStatus}
            professional={professional || undefined}
          />
        ) : viewMode === "week" ? (
          <WeeklyView
            weekStart={selectedDate}
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onSelectSlot={handleSelectSlot}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            professional={professional || undefined}
          />
        ) : (
          <MonthlyView
            year={monthYear.year}
            month={monthYear.month}
            appointments={appointments}
            onSelectDate={handleMonthSelectDate}
            professional={professional || undefined}
          />
        )}
      </div>

      {/* Appointment modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={handleCloseModal}
        appointment={selectedAppointment}
        patients={patients}
        defaultDate={dateKey}
        defaultTime={defaultTime}
        onSave={handleSave}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        isLoading={isLoading}
        error={error}
        blockMode={blockMode}
      />
    </div>
  )
}

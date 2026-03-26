"use client"

import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DailyView } from "./daily-view"
import { WeeklyView } from "./weekly-view"
import { AppointmentModal } from "./appointment-modal"
import {
  useAppointments,
  useWeekAppointments,
  usePatients,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "@/hooks/use-appointments"
import type { Appointment, AppointmentFormData, ViewMode, AppointmentStatus } from "@/lib/types"

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

  const dateKey = formatDateKey(selectedDate)
  const weekRange = getWeekRange(selectedDate)

  // Fetch data based on view mode
  const { appointments: dailyAppointments, mutate: mutateDaily } = useAppointments(dateKey)
  const { appointments: weeklyAppointments, mutate: mutateWeekly } = useWeekAppointments(
    weekRange.start,
    weekRange.end
  )
  const { patients } = usePatients()

  const appointments = viewMode === "day" ? dailyAppointments : weeklyAppointments

  const handlePrevious = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setSelectedDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setSelectedDate(newDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleSelectAppointment = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDefaultTime(undefined)
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

  const handleSelectSlotDaily = useCallback(
    (time: string) => {
      handleSelectSlot(selectedDate, time)
    },
    [selectedDate, handleSelectSlot]
  )

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedAppointment(null)
    setDefaultTime(undefined)
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
      mutateDaily()
      mutateWeekly()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar consulta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteAppointment(id)
      mutateDaily()
      mutateWeekly()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir consulta")
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
      mutateDaily()
      mutateWeekly()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">
            {getMonthName(selectedDate)}
          </h2>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border p-1">
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                viewMode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Semana
            </button>
          </div>

          <Button onClick={() => {
            setSelectedAppointment(null)
            setDefaultTime(undefined)
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
          />
        ) : (
          <WeeklyView
            weekStart={selectedDate}
            appointments={appointments}
            onSelectAppointment={handleSelectAppointment}
            onSelectSlot={handleSelectSlot}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
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
      />
    </div>
  )
}

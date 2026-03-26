"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Appointment, WORK_HOURS, statusColorsBorder, AppointmentStatus } from "@/lib/types"

const defaultBorderStyle = 'border-l-gray-400 bg-gray-50'

interface WeeklyViewProps {
  weekStart: Date
  appointments: Appointment[]
  onSelectAppointment: (appointment: Appointment) => void
  onSelectSlot: (date: Date, time: string) => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

const hours = Array.from(
  { length: WORK_HOURS.end - WORK_HOURS.start + 1 },
  (_, i) => WORK_HOURS.start + i
)

const DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = []
  const start = new Date(startDate)
  start.setDate(start.getDate() - start.getDay() + 1) // Start from Monday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  return days
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

function isSameDay(d1: Date, d2: Date): boolean {
  return formatDateKey(d1) === formatDateKey(d2)
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function WeeklyView({
  weekStart,
  appointments,
  onSelectAppointment,
  onSelectSlot,
  selectedDate,
  onSelectDate,
}: WeeklyViewProps) {
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const appointmentsByDateAndHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {}
    
    weekDays.forEach((day) => {
      map[formatDateKey(day)] = {}
    })

    appointments.forEach((apt) => {
      const dateKey = apt.date
      const hour = parseInt(apt.start_time.split(":")[0])
      
      if (!map[dateKey]) map[dateKey] = {}
      if (!map[dateKey][hour]) map[dateKey][hour] = []
      map[dateKey][hour].push(apt)
    })

    return map
  }, [appointments, weekDays])

  return (
    <div className="h-full flex flex-col overflow-x-auto">
      {/* Week header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-background sticky top-0 z-10">
        <div className="py-3" />
        {weekDays.map((day, index) => {
          const dayIndex = (index + 1) % 7
          const isSelected = isSameDay(day, selectedDate)
          const today = isToday(day)

          return (
            <button
              key={index}
              onClick={() => onSelectDate(day)}
              className={cn(
                "py-3 text-center border-l transition-colors",
                isSelected && "bg-primary/5",
                today && "bg-emerald-50"
              )}
            >
              <p className="text-xs text-muted-foreground">{DAYS[dayIndex]}</p>
              <p
                className={cn(
                  "text-lg font-semibold mt-1",
                  isSelected && "text-primary",
                  today && !isSelected && "text-emerald-600"
                )}
              >
                {day.getDate()}
              </p>
            </button>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="py-2 pr-2 text-right border-b">
                <span className="text-xs text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
              {weekDays.map((day, dayIndex) => {
                const dateKey = formatDateKey(day)
                const hourAppointments =
                  appointmentsByDateAndHour[dateKey]?.[hour] || []
                const timeString = `${String(hour).padStart(2, "0")}:00`

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "min-h-[60px] border-l border-b p-0.5",
                      isSameDay(day, selectedDate) && "bg-primary/5",
                      isToday(day) && !isSameDay(day, selectedDate) && "bg-emerald-50/50"
                    )}
                  >
                    {hourAppointments.length > 0 ? (
                      <div className="space-y-0.5">
                        {hourAppointments.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => onSelectAppointment(apt)}
                            className={cn(
                              "w-full text-left p-1.5 rounded border-l-2 text-xs",
                              "hover:shadow-sm transition-shadow",
                              statusColorsBorder[apt.status as AppointmentStatus] || defaultBorderStyle
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-medium truncate">
                                {apt.start_time}
                              </span>
                              <span className="truncate text-muted-foreground">
                                {getInitials(apt.patient?.name || "?")}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectSlot(day, timeString)}
                        className="w-full h-full min-h-[56px] hover:bg-primary/10 transition-colors rounded"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

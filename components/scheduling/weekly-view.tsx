"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Appointment, AppointmentStatus } from "@/lib/types"
import { WORK_HOURS, statusColors, getServiceColor } from "@/lib/types"

interface WeeklyViewProps {
  weekStart: Date
  appointments: Appointment[]
  onSelectAppointment: (apt: Appointment) => void
  onSelectSlot: (date: Date | string, time: string) => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
  professional?: string
}

const hours = Array.from({ length: WORK_HOURS.end - WORK_HOURS.start }, (_, i) => i + WORK_HOURS.start)

function getWeekDays(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay() + 1) // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0]
}

export function WeeklyView({ weekStart, appointments, onSelectAppointment, onSelectSlot, selectedDate, onSelectDate, professional }: WeeklyViewProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart])
  const today = formatDateKey(new Date())

  const filtered = useMemo(() => {
    if (!professional) return appointments
    return appointments.filter((a) => a.professional === professional)
  }, [appointments, professional])

  const getAptsForCell = (dayKey: string, hour: number) => {
    const hourStr = `${String(hour).padStart(2, "0")}:`
    return filtered.filter((a) => a.date === dayKey && a.start_time.startsWith(hourStr))
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[700px]">
        {/* Header with day names */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] sticky top-0 bg-white z-10 border-b">
          <div className="p-2" />
          {days.map((d) => {
            const dk = formatDateKey(d)
            const isToday = dk === today
            const isSelected = dk === formatDateKey(selectedDate)
            return (
              <button
                key={dk}
                onClick={() => onSelectDate(d)}
                className={cn(
                  "p-2 text-center border-l transition-colors",
                  isToday && "bg-blue-50",
                  isSelected && "ring-2 ring-inset ring-blue-500"
                )}
              >
                <p className="text-[10px] uppercase font-medium text-gray-400">
                  {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                </p>
                <p className={cn(
                  "text-lg font-bold",
                  isToday ? "text-blue-600" : "text-gray-800"
                )}>
                  {d.getDate()}
                </p>
              </button>
            )
          })}
        </div>

        {/* Time grid */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-50">
            <div className="p-1 text-right pr-2">
              <span className="text-[10px] text-gray-400">{`${String(hour).padStart(2, "0")}:00`}</span>
            </div>
            {days.map((d) => {
              const dk = formatDateKey(d)
              const apts = getAptsForCell(dk, hour)
              return (
                <div
                  key={dk}
                  className="border-l min-h-[52px] p-0.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (apts.length === 0) onSelectSlot(dk, `${String(hour).padStart(2, "0")}:00`)
                  }}
                >
                  {apts.map((apt) => {
                    const svc = getServiceColor(apt.service)
                    const st = statusColors[apt.status]
                    const name = (apt.patient as any)?.full_name || (apt.patient as any)?.name || "—"
                    return (
                      <button
                        key={apt.id}
                        onClick={(e) => { e.stopPropagation(); onSelectAppointment(apt) }}
                        className={cn(
                          "w-full text-left rounded-lg border-l-3 p-1.5 mb-0.5 transition-all hover:shadow-sm",
                          svc.bg, svc.border
                        )}
                      >
                        <p className={cn("text-[10px] font-semibold truncate", svc.text)}>{name}</p>
                        <p className="text-[9px] text-gray-500 truncate">{apt.service}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", st.bg)} />
                          <span className="text-[8px] text-gray-400">{apt.start_time}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Appointment, WORK_HOURS } from "@/lib/types"
import { AppointmentCard } from "./appointment-card"

interface DailyViewProps {
  date: Date
  appointments: Appointment[]
  onSelectAppointment: (appointment: Appointment) => void
  onSelectSlot: (time: string) => void
}

const hours = Array.from(
  { length: WORK_HOURS.end - WORK_HOURS.start + 1 },
  (_, i) => WORK_HOURS.start + i
)

export function DailyView({
  date,
  appointments,
  onSelectAppointment,
  onSelectSlot,
}: DailyViewProps) {
  const [formattedDate, setFormattedDate] = useState("")
  
  useEffect(() => {
    setFormattedDate(
      date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    )
  }, [date])

  const appointmentsByHour = useMemo(() => {
    const map: Record<number, Appointment[]> = {}
    appointments.forEach((apt) => {
      const hour = parseInt(apt.start_time.split(":")[0])
      if (!map[hour]) map[hour] = []
      map[hour].push(apt)
    })
    return map
  }, [appointments])

  return (
    <div className="h-full flex flex-col">
      <div className="py-4 border-b">
        <h2 className="text-lg font-semibold capitalize">{formattedDate || "Carregando..."}</h2>
        <p className="text-sm text-muted-foreground">
          {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {hours.map((hour) => {
            const hourAppointments = appointmentsByHour[hour] || []
            const timeString = `${String(hour).padStart(2, "0")}:00`
            const hasAppointments = hourAppointments.length > 0

            return (
              <div key={hour} className="flex min-h-[80px]">
                <div className="w-16 py-2 pr-3 text-right">
                  <span className="text-sm text-muted-foreground">
                    {timeString}
                  </span>
                </div>
                <div className="flex-1 py-2 pl-3 border-l">
                  {hasAppointments ? (
                    <div className="space-y-2">
                      {hourAppointments.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          onClick={() => onSelectAppointment(apt)}
                        />
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectSlot(timeString)}
                      className={cn(
                        "w-full h-full min-h-[60px] rounded-lg border-2 border-dashed",
                        "border-transparent hover:border-primary/30 hover:bg-primary/5",
                        "transition-colors flex items-center justify-center group"
                      )}
                    >
                      <span className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        + Agendar
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

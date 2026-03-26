"use client"

import { format, addDays, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AppointmentBlock } from "./appointment-block"
import type { Appointment } from "@/lib/types"
import { cn } from "@/lib/utils"

interface WeekViewProps {
  startDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick: (date: Date, time: string) => void
}

const HOUR_HEIGHT = 60
const START_HOUR = 7
const END_HOUR = 20

export function WeekView({ startDate, appointments, onAppointmentClick, onTimeSlotClick }: WeekViewProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  const today = new Date()

  const getAppointmentStyle = (appointment: Appointment) => {
    const [startHour, startMin] = appointment.start_time.split(":").map(Number)
    const [endHour, endMin] = appointment.end_time.split(":").map(Number)
    
    const startOffset = (startHour - START_HOUR) * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT
    const endOffset = (endHour - START_HOUR) * HOUR_HEIGHT + (endMin / 60) * HOUR_HEIGHT
    const height = endOffset - startOffset
    
    return {
      top: `${startOffset}px`,
      height: `${Math.max(height, 24)}px`,
    }
  }

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return appointments.filter((apt) => apt.date === dateStr)
  }

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const time = `${String(hour).padStart(2, "0")}:00`
    onTimeSlotClick(day, time)
  }

  return (
    <div className="flex-1 overflow-auto border rounded-lg bg-card">
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="flex">
          <div className="w-16 shrink-0 border-r" />
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 text-center py-3 border-r last:border-r-0",
                  isToday && "bg-primary/5"
                )}
              >
                <p className="text-xs text-muted-foreground uppercase">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <p
                  className={cn(
                    "text-xl font-semibold mt-1",
                    isToday && "bg-primary text-primary-foreground w-8 h-8 rounded-full mx-auto flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex">
        <div className="w-16 shrink-0 border-r">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b text-xs text-muted-foreground px-2 py-1"
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isToday = isSameDay(day, today)
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 border-r last:border-r-0 relative",
                isToday && "bg-primary/5"
              )}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] border-b hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleTimeSlotClick(day, hour)}
                />
              ))}
              
              {dayAppointments.map((appointment) => (
                <AppointmentBlock
                  key={appointment.id}
                  appointment={appointment}
                  onClick={onAppointmentClick}
                  style={getAppointmentStyle(appointment)}
                  compact
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

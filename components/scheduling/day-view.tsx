"use client"

import { useRef } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AppointmentBlock } from "./appointment-block"
import type { Appointment } from "@/lib/types"

interface DayViewProps {
  date: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick: (time: string) => void
}

const HOUR_HEIGHT = 60
const START_HOUR = 7
const END_HOUR = 20

export function DayView({ date, appointments, onAppointmentClick, onTimeSlotClick }: DayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  
  const dateStr = format(date, "yyyy-MM-dd")
  const dayAppointments = appointments.filter((apt) => apt.date === dateStr)

  const getAppointmentStyle = (appointment: Appointment) => {
    const [startHour, startMin] = appointment.start_time.split(":").map(Number)
    const [endHour, endMin] = appointment.end_time.split(":").map(Number)
    
    const startOffset = (startHour - START_HOUR) * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT
    const endOffset = (endHour - START_HOUR) * HOUR_HEIGHT + (endMin / 60) * HOUR_HEIGHT
    const height = endOffset - startOffset
    
    return {
      top: `${startOffset}px`,
      height: `${Math.max(height, 30)}px`,
    }
  }

  const handleTimeSlotClick = (hour: number) => {
    const time = `${String(hour).padStart(2, "0")}:00`
    onTimeSlotClick(time)
  }

  return (
    <div className="flex-1 overflow-auto border rounded-lg bg-card">
      <div className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground capitalize">
            {format(date, "EEEE", { locale: ptBR })}
          </p>
          <p className="text-2xl font-semibold">{format(date, "d")}</p>
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
        
        <div className="flex-1 relative" ref={containerRef}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleTimeSlotClick(hour)}
            />
          ))}
          
          {dayAppointments.map((appointment) => (
            <AppointmentBlock
              key={appointment.id}
              appointment={appointment}
              onClick={onAppointmentClick}
              style={getAppointmentStyle(appointment)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

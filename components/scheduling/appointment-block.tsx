"use client"

import { cn } from "@/lib/utils"
import type { Appointment } from "@/lib/types"
import { statusColorsBorder, statusColors } from "@/lib/types"

interface AppointmentBlockProps {
  appointment: Appointment
  onClick: (appointment: Appointment) => void
  style?: React.CSSProperties
  compact?: boolean
}

export function AppointmentBlock({ 
  appointment, 
  onClick, 
  style,
  compact = false 
}: AppointmentBlockProps) {
  const statusStyle = statusColorsBorder[appointment.status]
  const patientName = appointment.patient?.name || "Paciente"
  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-pink-500",
      "bg-cyan-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (compact) {
    return (
      <button
        onClick={() => onClick(appointment)}
        style={style}
        className={cn(
          "absolute left-1 right-1 rounded-md px-2 py-1 text-left border-l-4 transition-all hover:shadow-md overflow-hidden",
          statusStyle
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{patientName}</span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick(appointment)}
      style={style}
      className={cn(
        "absolute left-1 right-1 rounded-lg px-3 py-2 text-left border-l-4 transition-all hover:shadow-lg overflow-hidden",
        statusStyle
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0",
            getAvatarColor(patientName)
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{patientName}</p>
          <p className="text-xs text-muted-foreground truncate">{appointment.service}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {appointment.start_time} - {appointment.end_time}
          </p>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
            statusColors[appointment.status].bg,
            statusColors[appointment.status].text
          )}
        >
          {statusColors[appointment.status].label}
        </span>
      </div>
    </button>
  )
}

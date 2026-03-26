"use client"

import { cn } from "@/lib/utils"
import { Appointment, statusColors, statusColorsBorder, AppointmentStatus } from "@/lib/types"

interface AppointmentCardProps {
  appointment: Appointment
  onClick?: () => void
  compact?: boolean
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-cyan-500",
]

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
}

const defaultStatusStyle = { bg: 'bg-gray-400', text: 'text-white', label: 'Desconhecido' }
const defaultBorderStyle = 'border-l-gray-400 bg-gray-50'

export function AppointmentCard({ appointment, onClick, compact = false }: AppointmentCardProps) {
  const patientName = appointment.patient?.name || "Paciente"
  const initials = getInitials(patientName)
  const avatarColor = getAvatarColor(patientName)
  const status = appointment.status as AppointmentStatus
  const statusStyle = statusColors[status] || defaultStatusStyle
  const borderStyle = statusColorsBorder[status] || defaultBorderStyle

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-2 rounded-md border-l-4 transition-all hover:shadow-md",
          borderStyle
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0",
              avatarColor
            )}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{patientName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {appointment.start_time} - {appointment.service}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border-l-4 transition-all hover:shadow-md",
        borderStyle
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0",
              avatarColor
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{patientName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {appointment.service}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {appointment.start_time} - {appointment.end_time} • {appointment.duration} min
            </p>
          </div>
        </div>
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium shrink-0",
            statusStyle.bg,
            statusStyle.text
          )}
        >
          {statusStyle.label}
        </span>
      </div>
    </button>
  )
}

"use client"

import { useMemo } from "react"
import { Clock, User, CheckCircle2, XCircle, Play, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Appointment, AppointmentStatus } from "@/lib/types"
import { WORK_HOURS, statusColors, getServiceColor, STATUS_FLOW } from "@/lib/types"

interface DailyViewProps {
  date: Date
  appointments: Appointment[]
  onSelectAppointment: (apt: Appointment) => void
  onSelectSlot: (time: string) => void
  onQuickStatus?: (id: string, status: AppointmentStatus) => void
  professional?: string
}

const hours = Array.from({ length: WORK_HOURS.end - WORK_HOURS.start }, (_, i) => i + WORK_HOURS.start)

export function DailyView({ date, appointments, onSelectAppointment, onSelectSlot, onQuickStatus, professional }: DailyViewProps) {
  const filtered = useMemo(() => {
    let list = appointments
    if (professional) list = list.filter((a) => a.professional === professional)
    return list
  }, [appointments, professional])

  const getAppointmentForHour = (hour: number) => {
    const hourStr = `${String(hour).padStart(2, "0")}:`
    return filtered.filter((a) => a.start_time.startsWith(hourStr))
  }

  const quickActionIcon = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed": return <CheckCircle2 className="h-3.5 w-3.5" />
      case "arrived": return <LogIn className="h-3.5 w-3.5" />
      case "in_progress": return <Play className="h-3.5 w-3.5" />
      case "completed": return <CheckCircle2 className="h-3.5 w-3.5" />
      case "cancelled": return <XCircle className="h-3.5 w-3.5" />
      case "missed": return <XCircle className="h-3.5 w-3.5" />
      default: return null
    }
  }

  const dayStr = date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="h-full overflow-y-auto">
      <h3 className="text-base font-semibold text-gray-800 mb-4 capitalize">{dayStr}</h3>
      <p className="text-sm text-gray-500 mb-4">{filtered.length} agendamento{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-1">
        {hours.map((hour) => {
          const hourAppts = getAppointmentForHour(hour)
          const timeStr = `${String(hour).padStart(2, "0")}:00`

          return (
            <div key={hour} className="flex gap-3 group min-h-[64px]">
              {/* Time label */}
              <div className="w-14 flex-shrink-0 text-right">
                <span className="text-xs font-medium text-gray-400">{timeStr}</span>
              </div>

              {/* Slot content */}
              <div className="flex-1 border-t border-gray-100 pt-1 pb-2">
                {hourAppts.length > 0 ? (
                  <div className="space-y-1.5">
                    {hourAppts.map((apt) => {
                      const svcColor = getServiceColor(apt.service)
                      const stColor = statusColors[apt.status]
                      const nextStatuses = STATUS_FLOW[apt.status] || []
                      const patientName = (apt.patient as any)?.full_name || (apt.patient as any)?.name || "Paciente"

                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className={cn(
                            "rounded-xl border-l-4 p-3 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]",
                            svcColor.bg, svcColor.border
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className={cn("h-3.5 w-3.5 flex-shrink-0", svcColor.text)} />
                                <span className={cn("text-sm font-semibold truncate", svcColor.text)}>
                                  {patientName}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{apt.service}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{apt.start_time} - {apt.end_time}</span>
                                <span>•</span>
                                <span>{apt.duration || 60} min</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5">
                              {/* Status badge */}
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                stColor.bg, stColor.text
                              )}>
                                {stColor.label}
                              </span>

                              {/* Quick actions */}
                              {onQuickStatus && nextStatuses.length > 0 && (
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  {nextStatuses.slice(0, 2).map((ns) => (
                                    <button
                                      key={ns}
                                      onClick={() => onQuickStatus(apt.id, ns)}
                                      title={statusColors[ns].label}
                                      className={cn(
                                        "p-1 rounded-md transition-colors hover:scale-110",
                                        statusColors[ns].bg, statusColors[ns].text
                                      )}
                                    >
                                      {quickActionIcon(ns)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectSlot(timeStr)}
                    className="w-full text-left py-2 px-3 rounded-lg text-xs text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    + Agendar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

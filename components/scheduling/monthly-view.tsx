"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Appointment } from "@/lib/types"
import { statusColors } from "@/lib/types"

interface MonthlyViewProps {
  year: number
  month: number
  appointments: Appointment[]
  onSelectDate: (date: Date) => void
  professional?: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay()
  return d === 0 ? 6 : d - 1 // Monday = 0
}

export function MonthlyView({ year, month, appointments, onSelectDate, professional }: MonthlyViewProps) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  const filtered = useMemo(() => {
    if (!professional) return appointments
    return appointments.filter((a) => a.professional === professional)
  }, [appointments, professional])

  const dayApptCounts = useMemo(() => {
    const map: Record<string, { total: number; confirmed: number; pending: number; completed: number }> = {}
    for (const apt of filtered) {
      if (!map[apt.date]) map[apt.date] = { total: 0, confirmed: 0, pending: 0, completed: 0 }
      map[apt.date].total++
      if (apt.status === "confirmed" || apt.status === "arrived" || apt.status === "in_progress") map[apt.date].confirmed++
      else if (apt.status === "pending") map[apt.date].pending++
      else if (apt.status === "completed") map[apt.date].completed++
    }
    return map
  }, [filtered])

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

  // Build calendar grid
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((wd) => (
          <div key={wd} className="text-center text-xs font-semibold text-gray-400 py-2">
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} className="min-h-[90px]" />

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isToday = dateStr === todayStr
          const counts = dayApptCounts[dateStr]
          const isPast = new Date(dateStr) < new Date(todayStr)

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(new Date(dateStr + "T12:00:00"))}
              className={cn(
                "min-h-[90px] rounded-xl border p-2 text-left transition-all hover:shadow-md hover:border-blue-300",
                isToday ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-gray-100",
                isPast && !isToday && "opacity-60"
              )}
            >
              <span className={cn(
                "text-sm font-bold",
                isToday ? "text-blue-600" : "text-gray-800"
              )}>
                {day}
              </span>

              {counts && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-700">{counts.total}</span>
                    <span className="text-[9px] text-gray-400">consulta{counts.total !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="flex gap-0.5 flex-wrap">
                    {counts.confirmed > 0 && (
                      <span className="flex items-center gap-0.5 text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        <span className="w-1 h-1 rounded-full bg-blue-500" />
                        {counts.confirmed}
                      </span>
                    )}
                    {counts.pending > 0 && (
                      <span className="flex items-center gap-0.5 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        {counts.pending}
                      </span>
                    )}
                    {counts.completed > 0 && (
                      <span className="flex items-center gap-0.5 text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {counts.completed}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

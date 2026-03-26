"use client"

import { cn } from "@/lib/utils"

interface AgendaCalendarProps {
  selectedDate: number
  onSelectDate: (date: number) => void
}

const daysOfWeek = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

const daysWithAppointments = [5, 8, 11, 12, 15, 18, 19, 22, 24, 25, 26]
const fridays = [5, 12, 19, 26]
const thursdays = [4, 11, 18, 25]
const mondays = [1, 8, 15, 22, 29]

export function AgendaCalendar({ selectedDate, onSelectDate }: AgendaCalendarProps) {
  const weeks = [
    [null, null, null, null, null, null, null],
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28],
    [29, 30, 31, null, null, null, null],
  ]

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.slice(1).map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={dayIndex} className="h-9" />
              }

              const isSelected = day === selectedDate
              const hasAppointment = daysWithAppointments.includes(day)
              const isFriday = fridays.includes(day)
              const isThursday = thursdays.includes(day)
              const isMonday = mondays.includes(day)
              const isSunday = dayIndex === 6

              let bgColor = ""
              if (isSelected) {
                bgColor = "bg-primary text-primary-foreground"
              } else if (isFriday) {
                bgColor = "bg-teal-100 text-teal-700"
              } else if (isThursday && hasAppointment) {
                bgColor = "bg-amber-100 text-amber-700"
              } else if (isMonday && hasAppointment) {
                bgColor = "bg-emerald-100 text-emerald-700"
              }

              return (
                <button
                  key={dayIndex}
                  onClick={() => onSelectDate(day)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-colors",
                    bgColor || "text-foreground hover:bg-accent",
                    isSunday && !isSelected && "text-red-500"
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

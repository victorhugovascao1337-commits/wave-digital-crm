"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addDays, addWeeks, subDays, subWeeks } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CalendarHeaderProps {
  currentDate: Date
  view: "day" | "week"
  onViewChange: (view: "day" | "week") => void
  onDateChange: (date: Date) => void
  onNewAppointment: () => void
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onNewAppointment,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (view === "day") {
      onDateChange(subDays(currentDate, 1))
    } else {
      onDateChange(subWeeks(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === "day") {
      onDateChange(addDays(currentDate, 1))
    } else {
      onDateChange(addWeeks(currentDate, 1))
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const getTitle = () => {
    if (view === "day") {
      return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    }
    const weekStart = currentDate
    const weekEnd = addDays(currentDate, 6)
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
    
    if (sameMonth) {
      return `${format(weekStart, "d", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
    }
    return `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
  }

  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <div className="flex items-center gap-4">
        <Button onClick={onNewAppointment} className="bg-primary hover:bg-primary/90">
          + Nova Consulta
        </Button>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="outline" onClick={handleToday}>
          Hoje
        </Button>
        
        <h2 className="text-lg font-semibold capitalize">{getTitle()}</h2>
      </div>
      
      <div className="flex items-center rounded-lg border bg-muted p-1">
        <button
          onClick={() => onViewChange("day")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === "day"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Dia
        </button>
        <button
          onClick={() => onViewChange("week")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === "week"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Semana
        </button>
      </div>
    </div>
  )
}

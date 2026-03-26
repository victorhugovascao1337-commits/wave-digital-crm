"use client"

import { CRMLayout } from "@/components/crm/crm-layout"
import { SchedulingCalendar } from "@/components/scheduling/scheduling-calendar"

export default function AgendaPage() {
  return (
    <CRMLayout>
      <div className="h-[calc(100vh-120px)]">
        <SchedulingCalendar />
      </div>
    </CRMLayout>
  )
}

"use client"

import { CRMLayout } from "@/components/crm/crm-layout"
import { PaymentList } from "@/components/crm/payment-list"

export default function PagamentosPage() {
  return (
    <CRMLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Pagamentos</h1>
      </div>
      <PaymentList />
    </CRMLayout>
  )
}

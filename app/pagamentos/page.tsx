"use client"

import { CRMLayout } from "@/components/crm/crm-layout"
import { PaymentList } from "@/components/crm/payment-list"

export default function PagamentosPage() {
  return (
    <CRMLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Pagamentos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie cobranças, recebimentos e acompanhe o fluxo financeiro.
          </p>
        </div>

        <PaymentList />
      </div>
    </CRMLayout>
  )
}

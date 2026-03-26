"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { NovaConsultaModal } from "./nova-consulta-modal"

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [novaConsultaOpen, setNovaConsultaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        onNovaConsulta={() => setNovaConsultaOpen(true)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="lg:ml-64">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
      <NovaConsultaModal
        open={novaConsultaOpen}
        onOpenChange={setNovaConsultaOpen}
      />
    </div>
  )
}

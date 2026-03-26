"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { MobileNav } from "./mobile-nav"
import { NovaConsultaModal } from "./nova-consulta-modal"

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [novaConsultaOpen, setNovaConsultaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar
        onNovaConsulta={() => setNovaConsultaOpen(true)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="lg:ml-64">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile floating action button */}
      <button
        onClick={() => setNovaConsultaOpen(true)}
        className="lg:hidden fixed bottom-[76px] z-[998] w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
        style={{ right: '16px' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mobile bottom nav */}
      <MobileNav />

      <NovaConsultaModal
        open={novaConsultaOpen}
        onOpenChange={setNovaConsultaOpen}
      />
    </div>
  )
}

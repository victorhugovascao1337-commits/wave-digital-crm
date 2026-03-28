"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  Plus,
  ClipboardList,
  UserCog,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// roles: admin/superadmin = all, doctor = no usuarios/configuracoes, receptionist = basic only
const navItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/pacientes", label: "Pacientes", icon: Users, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/agenda", label: "Agenda", icon: Calendar, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/tarefas", label: "Tarefas", icon: ClipboardList, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/insights", label: "Relatórios", icon: TrendingUp, roles: ["admin", "superadmin", "doctor"] },
  { href: "/usuarios", label: "Usuários", icon: UserCog, roles: ["admin", "superadmin"] },
]

interface SidebarProps {
  onNovaConsulta: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ onNovaConsulta, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("user_role") || null
    }
    return null
  })

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const role = data.role || "user"
        setUserRole(role)
        sessionStorage.setItem("user_role", role)
      })
      .catch(() => {
        setUserRole("user")
        sessionStorage.setItem("user_role", "user")
      })
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => {
    onMobileClose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-5 pb-4 flex items-center justify-between">
        <div>
          <img src="/logo-wave.png" alt="Wave Digital" className="h-12 object-contain" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1 pl-1">Gestão Clínica</p>
        </div>
        <button onClick={onMobileClose} className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
        {navItems.filter((item) => userRole && item.roles.includes(userRole)).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-primary bg-white rounded-l-xl shadow-sm translate-x-1"
                  : "text-muted-foreground hover:bg-white/50"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* CTA & Footer */}
      <div className="p-4 space-y-3">
        <button
          onClick={() => { onNovaConsulta(); onMobileClose() }}
          className="w-full py-3 bg-gradient-to-b from-primary to-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </button>
        <div className="pt-3 border-t border-border/50">
          <a
            href="https://wa.me/5521969907980?text=Ol%C3%A1%2C%20sou%20um%20cliente%20e%20preciso%20de%20ajuda"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Suporte</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-destructive transition-colors text-sm w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-40 bg-[#f2f4f6] w-64 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full z-50 bg-[#f2f4f6] w-72 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

// Hamburger button exported for use in header
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
      <Menu className="h-6 w-6" />
    </button>
  )
}

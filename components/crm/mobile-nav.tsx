"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  ClipboardList,
  TrendingUp,
  UserCog,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const allTabs = [
  { href: "/", label: "Painel", icon: LayoutDashboard, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/pacientes", label: "Pacientes", icon: Users, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/agenda", label: "Agenda", icon: Calendar, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/tarefas", label: "Tarefas", icon: ClipboardList, roles: ["admin", "superadmin", "doctor", "receptionist"] },
  { href: "/insights", label: "Relatórios", icon: TrendingUp, roles: ["admin", "superadmin", "doctor"] },
  { href: "/usuarios", label: "Usuários", icon: UserCog, roles: ["admin", "superadmin"] },
  { href: "/configuracoes", label: "Ajustes", icon: Settings, roles: ["admin", "superadmin"] },
]

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>("admin")

  useEffect(() => {
    const cached = sessionStorage.getItem("user_role")
    if (cached) setUserRole(cached)
  }, [])

  const filteredTabs = allTabs.filter((t) => t.roles.includes(userRole))
  // Show first 4 in bottom bar, rest in "Mais" menu
  const mainTabs = filteredTabs.slice(0, 4)
  const moreTabs = filteredTabs.slice(4)

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMoreOpen(false)} />
      )}

      {/* More menu popup */}
      {moreOpen && moreTabs.length > 0 && (
        <div className="lg:hidden fixed bottom-[68px] right-2 z-[1000] bg-white rounded-2xl shadow-2xl border border-border/50 py-2 w-48 mb-[env(safe-area-inset-bottom)]">
          {moreTabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  isActive ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-accent"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 z-[999] w-screen bg-white border-t border-border/40 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-[60px]">
          {mainTabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors min-w-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{tab.label}</span>
              </Link>
            )
          })}

          {/* More button */}
          {moreTabs.length > 0 && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors min-w-[56px]",
                moreOpen ? "text-primary" : "text-muted-foreground"
              )}
            >
              {moreOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Users, Calendar, TrendingUp, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/insights", label: "Relatórios", icon: TrendingUp },
  { href: "/configuracoes", label: "Ajustes", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href === "/pacientes" && pathname === "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[64px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

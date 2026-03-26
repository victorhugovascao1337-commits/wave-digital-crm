"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Shield,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clinicas", label: "Clínicas", icon: Building2 },
  { href: "/admin/mensagens", label: "Mensagens", icon: MessageSquare },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      setChecking(false)
      setIsAuthenticated(true)
      return
    }

    const adminAuth = sessionStorage.getItem("admin_authenticated")
    if (adminAuth !== "true") {
      router.replace("/admin/login")
      return
    }
    setIsAuthenticated(true)
    setChecking(false)
    setUserName("Admin Wave Digital")
  }, [pathname, router])

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated")
    router.push("/admin/login")
  }

  // Login page renders without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (checking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0">
        <div className="p-5 border-b border-gray-800">
          <img src="/logo-wave-dark.png" alt="Wave Digital" className="h-10 object-contain" />
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Painel Administrativo</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white text-xs">
                {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[240px] flex-1 p-8 bg-gray-950 min-h-screen">
        {children}
      </main>
    </div>
  )
}

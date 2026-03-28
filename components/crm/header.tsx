"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, AlertTriangle, Menu, Settings, LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { CLINIC_TYPE_LABELS } from "@/lib/types"

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [user, setUser] = useState<{ name: string; email: string; clinicType: string; logoUrl: string } | null>(null)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [adminMessages, setAdminMessages] = useState<{ id: string; title: string; message: string; type: string }[]>([])
  const [showMessages, setShowMessages] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.full_name || data.email) {
          setUser({
            name: data.full_name || data.email?.split("@")[0] || "Usuário",
            email: data.email || "",
            clinicType: data.clinic_type || "fisioterapia",
            logoUrl: data.logo_url || "",
          })
        }
      })
      .catch(() => {})

    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setPendingAmount((data.pendingTotal || 0) + (data.overdueTotal || 0))
      })
      .catch(() => {})

    // Fetch admin messages
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAdminMessages(data.slice(0, 5))
      })
      .catch(() => {})
  }, [])

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const displayName = user?.name || "Carregando..."
  const initials = user ? getInitials(user.name) : "..."

  return (
    <header className="w-full h-14 sm:h-16 sticky top-0 bg-background/80 backdrop-blur-xl flex justify-between items-center px-4 sm:px-6 lg:px-8 z-30 border-b border-border/30">
      <div className="flex items-center gap-3 sm:gap-8">
        {/* Mobile: logo + hamburger */}
        <button onClick={onMobileMenuToggle} className="lg:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar - desktop only */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-10 pr-4 py-2 bg-accent/50 border border-border/15 rounded-full text-sm w-80 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
            placeholder="Buscar pacientes, prontuários..."
          />
        </div>

        {/* Mobile search icon */}
        <button className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground">
          <Search className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Pending Payments Alert - hidden on small screens */}
        {pendingAmount > 0 && (
          <button
            onClick={() => router.push("/pagamentos")}
            className="hidden md:flex px-3 lg:px-5 py-2 bg-accent text-primary font-bold text-xs lg:text-sm rounded-xl hover:bg-primary hover:text-white transition-all items-center"
          >
            <AlertTriangle className="h-4 w-4 mr-1 lg:mr-2" />
            <span className="hidden lg:inline">R$ {pendingAmount.toFixed(2).replace(".", ",")} Pendentes</span>
            <span className="lg:hidden">R$ {pendingAmount.toFixed(0)}</span>
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-muted-foreground hover:bg-accent rounded-full transition-colors"
            onClick={() => setShowMessages(!showMessages)}
          >
            <Bell className="h-5 w-5" />
            {adminMessages.length > 0 && (
              <span className="absolute top-0 right-0 sm:top-1 sm:right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {adminMessages.length}
              </span>
            )}
          </button>
          {showMessages && adminMessages.length > 0 && (
            <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white rounded-xl border shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b bg-accent/30">
                <p className="text-sm font-semibold">Comunicados</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {adminMessages.map((msg) => (
                  <div key={msg.id} className="px-4 py-3 border-b last:border-0 hover:bg-accent/20">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        msg.type === "alerta" ? "bg-amber-500" :
                        msg.type === "manutencao" ? "bg-orange-500" :
                        msg.type === "promocao" ? "bg-green-500" :
                        "bg-blue-500"
                      }`} />
                      <p className="text-sm font-medium text-foreground">{msg.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar with dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => { setShowUserMenu(!showUserMenu); setShowMessages(false) }}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">
                {CLINIC_TYPE_LABELS[user?.clinicType || "fisioterapia"] || "Profissional"}
              </p>
            </div>
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-white shadow-sm">
              {user?.logoUrl ? (
                <img src={user.logoUrl} alt="" className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary text-white text-xs sm:text-sm font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-xl border shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b bg-accent/30">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); router.push("/perfil") }}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent/50 flex items-center gap-3 transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Meu Perfil
                </button>
              </div>
              <div className="border-t py-1">
                <button
                  onClick={async () => {
                    setShowUserMenu(false)
                    sessionStorage.clear()
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push("/login")
                    router.refresh()
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

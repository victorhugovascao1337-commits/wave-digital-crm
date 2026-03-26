"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Users, Activity, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Clinic {
  id: string
  name: string
  type: string
  admin_email: string
  status: string
  created_at: string
}

const typeLabels: Record<string, string> = {
  fisioterapia: "Fisioterapia",
  odontologia: "Odontologia",
  psicologia: "Psicologia",
  estetica: "Estética",
  nutricao: "Nutrição",
  clinica_geral: "Clínica Geral",
  pilates: "Pilates",
  fonoaudiologia: "Fonoaudiologia",
}

export default function AdminDashboard() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/clinics")
      .then((r) => r.json())
      .then((data) => {
        setClinics(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const activeClinics = clinics.filter((c) => c.status === "active")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
        <p className="text-gray-400 mt-1">Gerencie todas as clínicas da plataforma Wave Digital</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">Total de Clínicas</span>
          </div>
          <p className="text-3xl font-bold text-white">{clinics.length}</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Clínicas Ativas</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeClinics.length}</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Tipos de Serviço</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {new Set(clinics.map((c) => c.type)).size}
          </p>
        </div>
      </div>

      {/* Recent Clinics */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Últimas Clínicas</h2>
          <Link href="/admin/clinicas">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {clinics.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p className="text-sm">Nenhuma clínica cadastrada ainda</p>
            <Link href="/admin/clinicas">
              <Button className="mt-4" size="sm">Criar Primeira Clínica</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {clinics.slice(0, 5).map((clinic) => (
              <div key={clinic.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{clinic.name}</p>
                    <p className="text-xs text-gray-500">{clinic.admin_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                    {typeLabels[clinic.type] || clinic.type}
                  </Badge>
                  <Badge className={clinic.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                    {clinic.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    {new Date(clinic.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

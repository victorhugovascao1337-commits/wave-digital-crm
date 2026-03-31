"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import {
  Search,
  Plus,
  FileText,
  ClipboardList,
  Stethoscope,
  Pill,
  TrendingUp,
  Filter,
  Activity,
} from "lucide-react"
import { MedicalRecordList } from "@/components/crm/medical-record-list"
import { MedicalRecordFormModal } from "@/components/crm/medical-record-form-modal"
import type { MedicalRecord, Patient } from "@/lib/database.types"

const recordTypeFilters = [
  { label: "Todos", value: "all", icon: Filter },
  { label: "Consultas", value: "consultation", icon: Stethoscope },
  { label: "Exames", value: "exam", icon: FileText },
  { label: "Procedimentos", value: "procedure", icon: ClipboardList },
  { label: "Prescrições", value: "prescription", icon: Pill },
  { label: "Evoluções", value: "evolution", icon: TrendingUp },
]

export default function ProntuarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [newRecordModalOpen, setNewRecordModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [recordsRes, patientsRes] = await Promise.all([
        fetch("/api/medical-records"),
        fetch("/api/patients"),
      ])
      if (recordsRes.ok) {
        const data = await recordsRes.json()
        setRecords(data)
      }
      if (patientsRes.ok) {
        const data = await patientsRes.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId)
    return patient?.name || ""
  }

  const filteredRecords = records.filter((record) => {
    const patientName = getPatientName(record.patient_id)
    const matchesSearch =
      (record.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || record.record_type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: records.length,
    consultations: records.filter((r) => r.record_type === "consultation").length,
    evolutions: records.filter((r) => r.record_type === "evolution").length,
    prescriptions: records.filter((r) => r.record_type === "prescription").length,
    todayCount: records.filter((r) => {
      const today = new Date().toISOString().split("T")[0]
      return r.created_at.startsWith(today)
    }).length,
  }

  return (
    <CRMLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Prontuário Eletrônico
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registros clínicos com editor avançado, templates e exportação PDF.
            </p>
          </div>
          <button
            onClick={() => setNewRecordModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Registro
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 mb-1">Consultas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.consultations}</p>
              </div>
              <div className="p-2 bg-emerald-200 rounded-lg">
                <Stethoscope className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-violet-600 mb-1">Evoluções</p>
                <p className="text-2xl font-bold text-gray-900">{stats.evolutions}</p>
              </div>
              <div className="p-2 bg-violet-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-violet-700" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">Prescrições</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptions}</p>
              </div>
              <div className="p-2 bg-amber-200 rounded-lg">
                <Pill className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-cyan-600 mb-1">Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
              </div>
              <div className="p-2 bg-cyan-200 rounded-lg">
                <Activity className="h-5 w-5 text-cyan-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm font-medium outline-none shadow-sm"
              placeholder="Buscar por título, diagnóstico, conteúdo ou nome do paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {recordTypeFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    typeFilter === filter.value
                      ? "bg-primary text-white shadow-md shadow-primary/15"
                      : "bg-white text-muted-foreground border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">Carregando registros...</p>
          </div>
        ) : filteredRecords.length === 0 && !searchTerm && typeFilter === "all" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <FileText className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Nenhum registro encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece criando seu primeiro registro clínico.
              </p>
            </div>
            <button
              onClick={() => setNewRecordModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </button>
          </div>
        ) : (
          <MedicalRecordList
            records={filteredRecords}
            patients={patients}
            onRefresh={fetchData}
          />
        )}
      </div>

      <MedicalRecordFormModal
        open={newRecordModalOpen}
        onOpenChange={setNewRecordModalOpen}
        onSuccess={fetchData}
      />
    </CRMLayout>
  )
}

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
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Prontuário Eletrônico
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-12">
              Registros clínicos com editor avançado, templates e exportação PDF.
            </p>
          </div>
          <button
            onClick={() => setNewRecordModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:scale-[1.02] transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Registro
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.consultations}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Consultas</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.evolutions}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Evoluções</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                <Pill className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptions}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Prescrições</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl">
                <Activity className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Hoje</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm font-medium outline-none shadow-sm"
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
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    typeFilter === filter.value
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/15"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
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
            <p className="text-sm text-gray-500">Carregando registros...</p>
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

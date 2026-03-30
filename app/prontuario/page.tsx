"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import { Search, Plus, FileText, ClipboardList, Filter } from "lucide-react"
import { MedicalRecordList } from "@/components/crm/medical-record-list"
import { MedicalRecordFormModal } from "@/components/crm/medical-record-form-modal"
import type { MedicalRecord } from "@/lib/database.types"

const recordTypeFilters = [
  { label: "Todos", value: "all" },
  { label: "Consultas", value: "consultation" },
  { label: "Exames", value: "exam" },
  { label: "Procedimentos", value: "procedure" },
  { label: "Prescrições", value: "prescription" },
  { label: "Evoluções", value: "evolution" },
]

export default function ProntuarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [newRecordModalOpen, setNewRecordModalOpen] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch("/api/medical-records")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error("Erro ao carregar prontuários:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      (record.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.content || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || record.record_type === typeFilter
    return matchesSearch && matchesType
  })

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
              Registros clínicos, evoluções e anamneses dos pacientes.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setNewRecordModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Registro</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{records.length}</p>
                <p className="text-xs text-muted-foreground">Total de Registros</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-xl">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {records.filter((r) => r.record_type === "consultation").length}
                </p>
                <p className="text-xs text-muted-foreground">Consultas</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {records.filter((r) => r.record_type === "evolution").length}
                </p>
                <p className="text-xs text-muted-foreground">Evoluções</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {records.filter((r) => r.record_type === "prescription").length}
                </p>
                <p className="text-xs text-muted-foreground">Prescrições</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-accent/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium outline-none"
              placeholder="Buscar por título, diagnóstico ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-span-12 lg:col-span-7 flex gap-2 items-center flex-wrap">
            {recordTypeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTypeFilter(filter.value)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  typeFilter === filter.value
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "bg-white text-muted-foreground hover:bg-accent"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <MedicalRecordList records={filteredRecords} onRefresh={fetchRecords} />
        )}
      </div>

      <MedicalRecordFormModal
        open={newRecordModalOpen}
        onOpenChange={setNewRecordModalOpen}
        onSuccess={fetchRecords}
      />
    </CRMLayout>
  )
}

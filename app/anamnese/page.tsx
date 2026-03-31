"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import {
  Search,
  Plus,
  ClipboardList,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Heart,
  AlertCircle,
  Pill,
  Stethoscope,
  UserCheck,
  Eye,
} from "lucide-react"
import { AnamnesisFormModal } from "@/components/crm/anamnesis-form-modal"
import type { Patient } from "@/lib/database.types"

interface AnamnesisRecord {
  id: string
  patient_id: string
  filled_by: string | null
  chief_complaint: string | null
  medical_history: string | null
  family_history: string | null
  allergies: string | null
  medications: string | null
  habits: string | null
  observations: string | null
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export default function AnamnesePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<AnamnesisRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AnamnesisRecord | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [anamnesisRes, patientsRes] = await Promise.all([
        fetch("/api/anamnesis"),
        fetch("/api/patients"),
      ])
      if (anamnesisRes.ok) {
        const data = await anamnesisRes.json()
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
    return (patient as any)?.full_name || (patient as any)?.name || "Paciente"
  }

  const handleEdit = (record: AnamnesisRecord) => {
    setEditingRecord(record)
    setSelectedPatientId(record.patient_id)
    setModalOpen(true)
  }

  const handleNew = () => {
    setEditingRecord(null)
    setSelectedPatientId(null)
    setModalOpen(true)
  }

  const filteredRecords = records.filter((record) => {
    const patientName = getPatientName(record.patient_id)
    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.chief_complaint || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.allergies || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.medications || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Patients with anamnesis vs without
  const patientsWithAnamnesis = new Set(records.map((r) => r.patient_id))
  const stats = {
    total: records.length,
    patientsTotal: patients.length,
    withAnamnesis: patientsWithAnamnesis.size,
    withoutAnamnesis: patients.length - patientsWithAnamnesis.size,
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const renderFieldCard = (icon: React.ReactNode, label: string, value: string | null) => {
    if (!value) return null
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{value}</p>
      </div>
    )
  }

  return (
    <CRMLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Anamnese
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-12">
              Fichas de anamnese completas com histórico médico, alergias, medicamentos e hábitos.
            </p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Anamnese
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.patientsTotal}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Pacientes</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.withAnamnesis}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Preenchidas</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.withoutAnamnesis}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Pendentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-sm font-medium outline-none shadow-sm"
              placeholder="Buscar por paciente, queixa principal, alergias ou medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-gray-500">Carregando anamneses...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex p-4 bg-emerald-50 rounded-2xl mb-4">
              <ClipboardList className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhuma anamnese encontrada</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm ? "Tente buscar com outros termos." : "Comece criando a primeira ficha de anamnese."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Nova Anamnese
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const isExpanded = expandedId === record.id
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Collapsed Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shrink-0">
                        <ClipboardList className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {getPatientName(record.patient_id)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(record.created_at)}</span>
                          {record.chief_complaint && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="truncate max-w-[200px]">{record.chief_complaint}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(record)
                        }}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <div className="p-2 text-gray-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderFieldCard(
                          <Stethoscope className="h-4 w-4 text-emerald-500" />,
                          "Queixa Principal",
                          record.chief_complaint
                        )}
                        {renderFieldCard(
                          <Heart className="h-4 w-4 text-red-500" />,
                          "Histórico Médico",
                          record.medical_history
                        )}
                        {renderFieldCard(
                          <Users className="h-4 w-4 text-blue-500" />,
                          "Histórico Familiar",
                          record.family_history
                        )}
                        {renderFieldCard(
                          <AlertCircle className="h-4 w-4 text-amber-500" />,
                          "Alergias",
                          record.allergies
                        )}
                        {renderFieldCard(
                          <Pill className="h-4 w-4 text-purple-500" />,
                          "Medicamentos em Uso",
                          record.medications
                        )}
                        {renderFieldCard(
                          <Eye className="h-4 w-4 text-cyan-500" />,
                          "Hábitos",
                          record.habits
                        )}
                        {renderFieldCard(
                          <ClipboardList className="h-4 w-4 text-gray-500" />,
                          "Observações",
                          record.observations
                        )}
                      </div>
                      {record.filled_by && (
                        <p className="text-xs text-gray-400 mt-3 text-right">
                          Preenchido por: {record.filled_by}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnamnesisFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingRecord(null)
            setSelectedPatientId(null)
          }
        }}
        onSuccess={fetchData}
        editingRecord={editingRecord}
        preselectedPatientId={selectedPatientId}
      />
    </CRMLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  X,
  Save,
  Search,
  Stethoscope,
  Heart,
  Users,
  AlertCircle,
  Pill,
  Eye,
  ClipboardList,
  Loader2,
} from "lucide-react"
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

interface AnamnesisFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingRecord?: AnamnesisRecord | null
  preselectedPatientId?: string | null
}

const formSections = [
  {
    key: "chief_complaint",
    label: "Queixa Principal",
    icon: Stethoscope,
    color: "emerald",
    placeholder: "Descreva a queixa principal do paciente, motivo da consulta...",
  },
  {
    key: "medical_history",
    label: "Histórico Médico Pessoal",
    icon: Heart,
    color: "red",
    placeholder: "Doenças prévias, cirurgias, internações, tratamentos anteriores...",
  },
  {
    key: "family_history",
    label: "Histórico Familiar",
    icon: Users,
    color: "blue",
    placeholder: "Doenças na família (pai, mãe, irmãos): diabetes, hipertensão, câncer...",
  },
  {
    key: "allergies",
    label: "Alergias",
    icon: AlertCircle,
    color: "amber",
    placeholder: "Alergias a medicamentos, alimentos, substâncias...",
  },
  {
    key: "medications",
    label: "Medicamentos em Uso",
    icon: Pill,
    color: "purple",
    placeholder: "Medicamentos em uso contínuo com dosagens...",
  },
  {
    key: "habits",
    label: "Hábitos de Vida",
    icon: Eye,
    color: "cyan",
    placeholder: "Tabagismo, etilismo, atividade física, alimentação, sono...",
  },
  {
    key: "observations",
    label: "Observações",
    icon: ClipboardList,
    color: "gray",
    placeholder: "Observações adicionais relevantes...",
  },
]

export function AnamnesisFormModal({
  open,
  onOpenChange,
  onSuccess,
  editingRecord,
  preselectedPatientId,
}: AnamnesisFormModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({
    chief_complaint: "",
    medical_history: "",
    family_history: "",
    allergies: "",
    medications: "",
    habits: "",
    observations: "",
  })

  useEffect(() => {
    if (open) {
      fetch("/api/patients")
        .then((r) => r.json())
        .then((data) => setPatients(data))
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (editingRecord) {
      setSelectedPatientId(editingRecord.patient_id)
      setFormData({
        chief_complaint: editingRecord.chief_complaint || "",
        medical_history: editingRecord.medical_history || "",
        family_history: editingRecord.family_history || "",
        allergies: editingRecord.allergies || "",
        medications: editingRecord.medications || "",
        habits: editingRecord.habits || "",
        observations: editingRecord.observations || "",
      })
    } else {
      setSelectedPatientId(preselectedPatientId || "")
      setFormData({
        chief_complaint: "",
        medical_history: "",
        family_history: "",
        allergies: "",
        medications: "",
        habits: "",
        observations: "",
      })
    }
    setPatientSearch("")
  }, [editingRecord, preselectedPatientId, open])

  const filteredPatients = patients.filter((p) => {
    const name = (p as any).full_name || (p as any).name || ""
    return name.toLowerCase().includes(patientSearch.toLowerCase())
  })

  const getPatientName = (id: string) => {
    const p = patients.find((pt) => pt.id === id)
    return (p as any)?.full_name || (p as any)?.name || ""
  }

  const handleSave = async () => {
    if (!selectedPatientId) return
    setSaving(true)
    try {
      const method = editingRecord ? "PUT" : "POST"
      const body = editingRecord
        ? { id: editingRecord.id, ...formData }
        : { patient_id: selectedPatientId, ...formData }

      const res = await fetch("/api/anamnesis", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      }
    } catch (err) {
      console.error("Erro ao salvar anamnese:", err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 pb-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {editingRecord ? "Editar Anamnese" : "Nova Anamnese"}
              </h3>
              <p className="text-xs text-gray-500">Preencha as informações do paciente</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Patient Selection */}
          {!editingRecord && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Paciente *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-sm outline-none"
                  placeholder="Buscar paciente..."
                  value={selectedPatientId ? getPatientName(selectedPatientId) : patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setSelectedPatientId("")
                    setShowPatientDropdown(true)
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                />
                {showPatientDropdown && !selectedPatientId && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">Nenhum paciente encontrado</div>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                          onClick={() => {
                            setSelectedPatientId(p.id)
                            setShowPatientDropdown(false)
                            setPatientSearch("")
                          }}
                        >
                          <span className="font-medium text-gray-900">
                            {(p as any).full_name || (p as any).name}
                          </span>
                          {p.phone && (
                            <span className="text-gray-400 ml-2 text-xs">{p.phone}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {editingRecord && (
            <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                {getPatientName(editingRecord.patient_id)}
              </span>
            </div>
          )}

          {/* Form Sections */}
          {formSections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.key}>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Icon className="h-4 w-4" />
                  {section.label}
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all text-sm outline-none resize-none"
                  rows={3}
                  placeholder={section.placeholder}
                  value={formData[section.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [section.key]: e.target.value }))
                  }
                />
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedPatientId}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : editingRecord ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}

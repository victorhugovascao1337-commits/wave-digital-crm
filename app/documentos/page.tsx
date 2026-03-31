"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import {
  Search,
  Plus,
  FileSignature,
  Filter,
  Pill,
  Award,
  Stethoscope,
  ArrowRightLeft,
  Calendar,
  Eye,
  Trash2,
  Printer,
} from "lucide-react"
import { DocumentFormModal } from "@/components/crm/document-form-modal"
import { DocumentPdfViewer } from "@/components/crm/document-pdf-viewer"
import type { Patient } from "@/lib/database.types"

interface ClinicalDoc {
  id: string
  patient_id: string
  professional_id: string | null
  document_type: "prescription" | "certificate_attendance" | "certificate_medical" | "referral"
  title: string | null
  content: string | null
  diagnosis: string | null
  cid_code: string | null
  days_off: number | null
  date_start: string | null
  date_end: string | null
  referred_to: string | null
  referred_specialty: string | null
  medications: any[]
  notes: string | null
  clinic_name: string | null
  clinic_address: string | null
  clinic_phone: string | null
  clinic_logo_url: string | null
  professional_name: string | null
  professional_credentials: string | null
  signature_image_url: string | null
  created_at: string
  updated_at: string
  patient?: { id: string; full_name: string; cpf: string | null; date_of_birth: string | null; phone: string | null; email: string | null }
}

const typeConfig: Record<string, { label: string; icon: any; gradient: string; bgLight: string; textColor: string }> = {
  prescription: { label: "Receituário", icon: Pill, gradient: "from-violet-500 to-purple-500", bgLight: "bg-violet-50", textColor: "text-violet-600" },
  certificate_attendance: { label: "Atestado de Comparecimento", icon: Award, gradient: "from-blue-500 to-cyan-500", bgLight: "bg-blue-50", textColor: "text-blue-600" },
  certificate_medical: { label: "Atestado Médico", icon: Stethoscope, gradient: "from-green-500 to-emerald-500", bgLight: "bg-green-50", textColor: "text-green-600" },
  referral: { label: "Encaminhamento", icon: ArrowRightLeft, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50", textColor: "text-amber-600" },
}

const typeFilters = [
  { label: "Todos", value: "all", icon: Filter },
  { label: "Receituários", value: "prescription", icon: Pill },
  { label: "Atestados Comparecimento", value: "certificate_attendance", icon: Award },
  { label: "Atestados Médicos", value: "certificate_medical", icon: Stethoscope },
  { label: "Encaminhamentos", value: "referral", icon: ArrowRightLeft },
]

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [documents, setDocuments] = useState<ClinicalDoc[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [pdfDoc, setPdfDoc] = useState<ClinicalDoc | null>(null)
  const [editingDoc, setEditingDoc] = useState<ClinicalDoc | null>(null)
  const [preselectedType, setPreselectedType] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [docsRes, patientsRes] = await Promise.all([
        fetch("/api/clinical-documents"),
        fetch("/api/patients"),
      ])
      if (docsRes.ok) setDocuments(await docsRes.json())
      if (patientsRes.ok) setPatients(await patientsRes.json())
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getPatientName = (doc: ClinicalDoc) => {
    if (doc.patient?.full_name) return doc.patient.full_name
    const p = patients.find((pt) => pt.id === doc.patient_id)
    return (p as any)?.full_name || (p as any)?.name || "Paciente"
  }

  const handleNew = (type?: string) => {
    setEditingDoc(null)
    setPreselectedType(type || null)
    setModalOpen(true)
  }

  const handleEdit = (doc: ClinicalDoc) => {
    setEditingDoc(doc)
    setPreselectedType(null)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return
    try {
      const res = await fetch(`/api/clinical-documents?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (err) {
      console.error("Erro ao excluir:", err)
    }
  }

  const filteredDocs = documents.filter((doc) => {
    const patientName = getPatientName(doc)
    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.diagnosis || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.professional_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: documents.length,
    prescriptions: documents.filter((d) => d.document_type === "prescription").length,
    certificates: documents.filter((d) => d.document_type === "certificate_attendance" || d.document_type === "certificate_medical").length,
    referrals: documents.filter((d) => d.document_type === "referral").length,
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <CRMLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-500/20">
                <FileSignature className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Documentos Clínicos
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-12">
              Receituários, atestados e encaminhamentos com exportação PDF profissional.
            </p>
          </div>
          <button
            onClick={() => handleNew()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 hover:scale-[1.02] transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Documento
          </button>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => handleNew("prescription")}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group hover:border-violet-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl group-hover:from-violet-100 group-hover:to-violet-200 transition-colors">
                <Pill className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.prescriptions}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Receituários</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleNew("certificate_medical")}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group hover:border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:from-green-100 group-hover:to-green-200 transition-colors">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.certificates}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Atestados</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleNew("referral")}
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group hover:border-amber-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl group-hover:from-amber-100 group-hover:to-amber-200 transition-colors">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.referrals}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Encaminhamentos</p>
              </div>
            </div>
          </button>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl">
                <FileSignature className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-sm font-medium outline-none shadow-sm"
              placeholder="Buscar por paciente, título, diagnóstico ou profissional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {typeFilters.map((filter) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    typeFilter === filter.value
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/15"
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

        {/* Documents List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-gray-500">Carregando documentos...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex p-4 bg-violet-50 rounded-2xl mb-4">
              <FileSignature className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum documento encontrado</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || typeFilter !== "all"
                ? "Tente buscar com outros termos ou filtros."
                : "Comece criando o primeiro documento clínico."}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <button
                onClick={() => handleNew()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Novo Documento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocs.map((doc) => {
              const config = typeConfig[doc.document_type] || typeConfig.prescription
              const Icon = config.icon
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 ${config.bgLight} rounded-xl shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.textColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${config.bgLight} ${config.textColor}`}>
                            {config.label}
                          </span>
                          {doc.title && (
                            <span className="text-sm font-semibold text-gray-900 truncate">{doc.title}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{getPatientName(doc)}</span>
                          <span className="text-gray-300">•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.created_at)}</span>
                          {doc.professional_name && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span>Dr(a). {doc.professional_name}</span>
                            </>
                          )}
                        </div>
                        {doc.document_type === "prescription" && doc.medications?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {doc.medications.map((m: any) => m.name).join(", ")}
                          </p>
                        )}
                        {doc.document_type === "certificate_medical" && doc.days_off && (
                          <p className="text-xs text-gray-400 mt-1">
                            {doc.days_off} dia(s) de afastamento
                            {doc.cid_code && ` • CID: ${doc.cid_code}`}
                          </p>
                        )}
                        {doc.document_type === "referral" && doc.referred_specialty && (
                          <p className="text-xs text-gray-400 mt-1">
                            Encaminhado para: {doc.referred_specialty}
                            {doc.referred_to && ` — ${doc.referred_to}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPdfDoc(doc)}
                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                        title="Visualizar PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPdfDoc(doc)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Imprimir"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(doc)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <FileSignature className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DocumentFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingDoc(null)
            setPreselectedType(null)
          }
        }}
        onSuccess={fetchData}
        editingDoc={editingDoc}
        preselectedType={preselectedType}
      />

      {pdfDoc && (
        <DocumentPdfViewer
          document={pdfDoc}
          onClose={() => setPdfDoc(null)}
        />
      )}
    </CRMLayout>
  )
}

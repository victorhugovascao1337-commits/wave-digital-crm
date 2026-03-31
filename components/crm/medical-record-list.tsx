"use client"

import { useState } from "react"
import {
  FileText,
  Calendar,
  Stethoscope,
  Pill,
  TrendingUp,
  MoreVertical,
  Eye,
  Trash2,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { MedicalRecord, Patient } from "@/lib/database.types"
import { ProntuarioPDFViewer } from "./prontuario-pdf-viewer"
import { renderMarkdown } from "./prontuario-editor"

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  consultation: { label: "Consulta", icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  exam: { label: "Exame", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  procedure: { label: "Procedimento", icon: FileText, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  prescription: { label: "Prescrição", icon: Pill, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  evolution: { label: "Evolução", icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
  other: { label: "Outro", icon: FileText, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100" },
}

interface Props {
  records: MedicalRecord[]
  patients?: Patient[]
  onRefresh: () => void
}

export function MedicalRecordList({ records, patients = [], onRefresh }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [pdfRecord, setPdfRecord] = useState<MedicalRecord | null>(null)

  const getPatient = (patientId: string) => patients.find((p) => p.id === patientId) || null

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return
    try {
      const res = await fetch(`/api/medical-records/${id}`, { method: "DELETE" })
      if (res.ok) onRefresh()
    } catch (err) {
      console.error("Erro ao excluir:", err)
    }
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
          <FileText className="h-10 w-10 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhum registro encontrado</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">Comece adicionando um novo registro clínico para seus pacientes.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {records.map((record) => {
          const config = typeConfig[record.record_type] || typeConfig.other
          const Icon = config.icon
          const isExpanded = expandedId === record.id
          const patient = getPatient(record.patient_id)
          return (
            <div key={record.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${isExpanded ? `${config.border} border-l-4` : "border-gray-100"}`}>
              <div className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : record.id)}>
                <div className={`p-2.5 rounded-xl ${config.bg} shrink-0`}><Icon className={`h-5 w-5 ${config.color}`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{record.title || "Sem título"}</h4>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>{config.label}</span>
                        {patient && <span className="text-xs text-gray-500 font-medium">{patient.name}</span>}
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3 w-3" />{new Date(record.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setPdfRecord(record) }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Imprimir / Exportar PDF"><Printer className="h-4 w-4 text-gray-400 hover:text-primary" /></button>
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === record.id ? null : record.id) }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><MoreVertical className="h-4 w-4 text-gray-400" /></button>
                        {menuOpenId === record.id && (
                          <div className="absolute right-0 top-8 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-10 py-1">
                            <button onClick={(e) => { e.stopPropagation(); setExpandedId(record.id); setMenuOpenId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"><Eye className="h-4 w-4 text-gray-500" /> Visualizar</button>
                            <button onClick={(e) => { e.stopPropagation(); setPdfRecord(record); setMenuOpenId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"><Download className="h-4 w-4 text-gray-500" /> Exportar PDF</button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); setMenuOpenId(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /> Excluir</button>
                          </div>
                        )}
                      </div>
                      <div className="p-1">{isExpanded ? <ChevronUp className="h-4 w-4 text-gray-300" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}</div>
                    </div>
                  </div>
                  {!isExpanded && record.diagnosis && <p className="text-xs text-gray-500 mt-2 line-clamp-1"><span className="font-medium text-gray-600">Diagnóstico:</span>{" "}{record.diagnosis}</p>}
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  {record.content && <div><h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="h-3 w-3" />Registro Clínico</h5><div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(record.content) }} /></div>}
                  {record.diagnosis && <div><h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Diagnóstico</h5><p className="text-sm text-gray-700 bg-amber-50 rounded-xl p-3 border border-amber-100">{record.diagnosis}</p></div>}
                  {record.prescription && <div><h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prescrição</h5><p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 rounded-xl p-3 border border-blue-100">{record.prescription}</p></div>}
                  <div className="flex items-center gap-2 pt-2"><button onClick={() => setPdfRecord(record)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"><Printer className="h-3.5 w-3.5" />Imprimir / PDF</button></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {pdfRecord && <ProntuarioPDFViewer record={pdfRecord} patient={getPatient(pdfRecord.patient_id)} onClose={() => setPdfRecord(null)} />}
    </>
  )
}

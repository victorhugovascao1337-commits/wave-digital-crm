"use client"

import { useState, useEffect } from "react"
import {
  X,
  Save,
  FileText,
  User,
  Stethoscope,
  Pill,
  TrendingUp,
  Search,
  LayoutTemplate,
} from "lucide-react"
import { ProntuarioEditor } from "./prontuario-editor"
import type { Patient } from "@/lib/database.types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedPatientId?: string
}

const recordTypes = [
  { value: "consultation", label: "Consulta", icon: Stethoscope, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "exam", label: "Exame", icon: FileText, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "procedure", label: "Procedimento", icon: FileText, color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "prescription", label: "Prescrição", icon: Pill, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "evolution", label: "Evolução", icon: TrendingUp, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
]

const defaultTemplates = [
  {
    name: "Atendimento Clínico Geral",
    content: "# Consulta Clínica\n\n**Queixa Principal:**\n\n\n**História da Doença Atual:**\n\n\n**Exame Físico:**\n\n\n---\n\n## Hipótese Diagnóstica\n\n\n## Conduta\n\n**Medicação prescrita:**\n\n\n**Exames solicitados:**\n\n\n**Orientações:**\n\n\n**Retorno:**",
  },
  {
    name: "Evolução Diária",
    content: "# Evolução\n\n**Data:** " + new Date().toLocaleDateString("pt-BR") + "\n\n**Subjetivo (S):**\n\n\n**Objetivo (O):**\n- PA:\n- FC:\n- FR:\n- Temp:\n- SpO2:\n\n**Avaliação (A):**\n\n\n**Plano (P):\n",
  },
  {
    name: "Prescrição Médica",
    content: "# Prescrição\n\n**Paciente:**\n\n**Data:** " + new Date().toLocaleDateString("pt-BR") + "\n\n---\n\n1.\n\n2.\n\n3.\n\n---\n\n**Observações:**\n",
  },
  {
    name: "Anamnese Completa",
    content: "# Anamnese\n\n**Identificação:**\n\n**Queixa Principal (QP):**\n\n**História da Moléstia Atual (HMA):**\n\n**Interrogatório Sintomatológico (IS):**\n\n**Antecedentes Pessoais:**\n- Patológicos:\n- Cirúrgicos:\n- Medicamentos em uso:\n- Alergias:\n\n**Antecedentes Familiares:**\n\n**Hábitos e Estilo de Vida:**\n- Tabagismo:\n- Etilismo:\n- Atividade física:\n- Alimentação:\n\n**Exame Físico:**\n- Estado geral:\n- PA:\n- FC:\n- FR:\n- Temp:\n- Peso:\n- Altura:\n- IMC:\n\n**Hipótese Diagnóstica:**\n\n**Conduta:**\n",
  },
]

const cid10Data = [
  { code: "J06.9", desc: "Infecção aguda das vias aéreas superiores" },
  { code: "J11", desc: "Influenza (gripe)" },
  { code: "M54.5", desc: "Dor lombar baixa (lombalgia)" },
  { code: "I10", desc: "Hipertensão essencial (primária)" },
  { code: "E11", desc: "Diabetes mellitus tipo 2" },
  { code: "K29.7", desc: "Gastrite não especificada" },
  { code: "F32.9", desc: "Episódio depressivo não especificado" },
  { code: "F41.1", desc: "Ansiedade generalizada" },
  { code: "G43.9", desc: "Enxaqueca não especificada" },
  { code: "M79.1", desc: "Mialgia" },
  { code: "R51", desc: "Cefaleia" },
  { code: "R10.4", desc: "Dor abdominal" },
  { code: "R50.9", desc: "Febre não especificada" },
  { code: "J03.9", desc: "Amigdalite aguda" },
  { code: "J02.9", desc: "Faringite aguda" },
  { code: "H10.9", desc: "Conjuntivite" },
  { code: "L30.9", desc: "Dermatite não especificada" },
  { code: "N39.0", desc: "Infecção do trato urinário" },
  { code: "K59.0", desc: "Constipação" },
  { code: "R11", desc: "Náusea e vômitos" },
  { code: "M25.5", desc: "Dor articular" },
  { code: "S93.4", desc: "Entorse de tornozelo" },
  { code: "M54.2", desc: "Cervicalgia" },
  { code: "J00", desc: "Resfriado comum" },
  { code: "B34.9", desc: "Infecção viral não especificada" },
  { code: "E78.5", desc: "Hiperlipidemia não especificada" },
  { code: "M75.1", desc: "Síndrome do manguito rotador" },
  { code: "G44.2", desc: "Cefaleia tensional" },
  { code: "M77.1", desc: "Epicondilite lateral" },
  { code: "M65.4", desc: "Tenossinovite de De Quervain" },
]

export function MedicalRecordFormModal({ open, onOpenChange, onSuccess, preselectedPatientId }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [recordType, setRecordType] = useState("consultation")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [prescription, setPrescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCID, setShowCID] = useState(false)
  const [cidSearch, setCidSearch] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    if (open) {
      fetch("/api/patients").then((r) => r.json()).then((data) => setPatients(data)).catch(console.error)
      if (preselectedPatientId) setSelectedPatient(preselectedPatientId)
    }
  }, [open, preselectedPatientId])

  const resetForm = () => {
    setSelectedPatient(preselectedPatientId || "")
    setRecordType("consultation")
    setTitle("")
    setContent("")
    setDiagnosis("")
    setPrescription("")
    setPatientSearch("")
    setCidSearch("")
    setShowCID(false)
    setShowTemplates(false)
  }

  const handleSubmit = async () => {
    if (!selectedPatient) return
    setSaving(true)
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: selectedPatient, record_type: recordType, title, content, diagnosis, prescription }),
      })
      if (res.ok) { onSuccess(); onOpenChange(false); resetForm() }
    } catch (err) { console.error("Erro ao salvar:", err) } finally { setSaving(false) }
  }

  const applyTemplate = (template: typeof defaultTemplates[0]) => { setContent(template.content); setShowTemplates(false) }
  const applyCID = (item: typeof cid10Data[0]) => { const cidText = `${item.code} - ${item.desc}`; setDiagnosis((prev) => (prev ? `${prev}\n${cidText}` : cidText)); setShowCID(false); setCidSearch("") }

  const filteredCID = cidSearch ? cid10Data.filter((c) => c.code.toLowerCase().includes(cidSearch.toLowerCase()) || c.desc.toLowerCase().includes(cidSearch.toLowerCase())) : cid10Data.slice(0, 10)
  const filteredPatients = patientSearch ? patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase())) : patients

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h2 className="text-lg font-bold text-gray-900">Novo Registro Clínico</h2><p className="text-xs text-gray-500 mt-0.5">Preencha os dados do prontuário eletrônico</p></div>
          <button onClick={() => { onOpenChange(false); resetForm() }} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-4 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5"><User className="h-3.5 w-3.5 inline mr-1" />Paciente *</label>
            <div className="relative">
              <input type="text" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar paciente pelo nome..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              {patientSearch && filteredPatients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-auto">
                  {filteredPatients.map((p) => (<button key={p.id} onClick={() => { setSelectedPatient(p.id); setPatientSearch(p.name) }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors">{p.name}{p.phone && <span className="text-xs text-gray-400 ml-2">{p.phone}</span>}</button>))}
                </div>
              )}
            </div>
            {selectedPatient && !patientSearch && <p className="text-xs text-emerald-600 mt-1">✓ Paciente selecionado: {patients.find(p => p.id === selectedPatient)?.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de Registro</label>
            <div className="flex flex-wrap gap-2">
              {recordTypes.map((type) => { const Icon = type.icon; return (<button key={type.value} type="button" onClick={() => setRecordType(type.value)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${recordType === type.value ? `${type.color} border-current shadow-sm` : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}><Icon className="h-3.5 w-3.5" />{type.label}</button>) })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Consulta de rotina, Retorno..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Conteúdo do Prontuário</label>
              <button type="button" onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"><LayoutTemplate className="h-3.5 w-3.5" />Usar Modelo</button>
            </div>
            {showTemplates && (
              <div className="mb-2 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium mb-2">Selecione um modelo:</p>
                {defaultTemplates.map((t) => (<button key={t.name} onClick={() => applyTemplate(t)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white hover:shadow-sm transition-all"><FileText className="h-4 w-4 text-primary" />{t.name}</button>))}
              </div>
            )}
            <ProntuarioEditor value={content} onChange={setContent} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Diagnóstico</label>
              <button type="button" onClick={() => setShowCID(!showCID)} className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"><Search className="h-3.5 w-3.5" />Buscar CID-10</button>
            </div>
            {showCID && (
              <div className="mb-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <input type="text" value={cidSearch} onChange={(e) => setCidSearch(e.target.value)} placeholder="Buscar por código ou descrição CID-10..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mb-2" />
                <div className="max-h-32 overflow-auto space-y-0.5">
                  {filteredCID.map((c) => (<button key={c.code} onClick={() => applyCID(c)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded-lg hover:bg-white transition-all"><span className="font-mono font-bold text-primary">{c.code}</span><span className="text-gray-600">{c.desc}</span></button>))}
                </div>
              </div>
            )}
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnóstico ou hipótese diagnóstica..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prescrição</label>
            <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Prescrição de medicamentos, tratamentos..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-20 transition-all" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={() => { onOpenChange(false); resetForm() }} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={!selectedPatient || saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm disabled:opacity-50 disabled:hover:scale-100"><Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar Registro"}</button>
        </div>
      </div>
    </div>
  )
}

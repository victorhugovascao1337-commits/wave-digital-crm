"use client"

import { useState, useEffect } from "react"
import {
  X,
  Save,
  Search,
  Pill,
  Award,
  Stethoscope,
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  FileSignature,
} from "lucide-react"
import type { Patient } from "@/lib/database.types"

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface DocumentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingDoc?: any
  preselectedType?: string | null
}

const docTypes = [
  { value: "prescription", label: "Receituário", icon: Pill, gradient: "from-violet-500 to-purple-500", description: "Prescrição de medicamentos" },
  { value: "certificate_attendance", label: "Atestado de Comparecimento", icon: Award, gradient: "from-blue-500 to-cyan-500", description: "Comprova comparecimento à consulta" },
  { value: "certificate_medical", label: "Atestado Médico", icon: Stethoscope, gradient: "from-green-500 to-emerald-500", description: "Atestado com CID e dias de afastamento" },
  { value: "referral", label: "Encaminhamento", icon: ArrowRightLeft, gradient: "from-amber-500 to-orange-500", description: "Encaminhamento para especialista" },
]

const emptyMedication: Medication = { name: "", dosage: "", frequency: "", duration: "", instructions: "" }

export function DocumentFormModal({
  open,
  onOpenChange,
  onSuccess,
  editingDoc,
  preselectedType,
}: DocumentFormModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [docType, setDocType] = useState("prescription")

  // Form fields
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [cidCode, setCidCode] = useState("")
  const [daysOff, setDaysOff] = useState("")
  const [dateStart, setDateStart] = useState("")
  const [dateEnd, setDateEnd] = useState("")
  const [referredTo, setReferredTo] = useState("")
  const [referredSpecialty, setReferredSpecialty] = useState("")
  const [medications, setMedications] = useState<Medication[]>([{ ...emptyMedication }])
  const [notes, setNotes] = useState("")
  const [professionalName, setProfessionalName] = useState("")
  const [professionalCredentials, setProfessionalCredentials] = useState("")

  useEffect(() => {
    if (open) {
      fetch("/api/patients")
        .then((r) => r.json())
        .then((data) => setPatients(data))
        .catch(() => {})

      // Load profile info for professional name
      fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
          if (!editingDoc) {
            setProfessionalName(data.full_name || data.name || "")
            setProfessionalCredentials(data.credentials || data.crm || "")
          }
        })
        .catch(() => {})
    }
  }, [open, editingDoc])

  useEffect(() => {
    if (editingDoc) {
      setDocType(editingDoc.document_type)
      setSelectedPatientId(editingDoc.patient_id)
      setTitle(editingDoc.title || "")
      setContent(editingDoc.content || "")
      setDiagnosis(editingDoc.diagnosis || "")
      setCidCode(editingDoc.cid_code || "")
      setDaysOff(editingDoc.days_off?.toString() || "")
      setDateStart(editingDoc.date_start || "")
      setDateEnd(editingDoc.date_end || "")
      setReferredTo(editingDoc.referred_to || "")
      setReferredSpecialty(editingDoc.referred_specialty || "")
      setMedications(editingDoc.medications?.length > 0 ? editingDoc.medications : [{ ...emptyMedication }])
      setNotes(editingDoc.notes || "")
      setProfessionalName(editingDoc.professional_name || "")
      setProfessionalCredentials(editingDoc.professional_credentials || "")
    } else {
      setDocType(preselectedType || "prescription")
      setSelectedPatientId("")
      setTitle("")
      setContent("")
      setDiagnosis("")
      setCidCode("")
      setDaysOff("")
      setDateStart(new Date().toISOString().split("T")[0])
      setDateEnd("")
      setReferredTo("")
      setReferredSpecialty("")
      setMedications([{ ...emptyMedication }])
      setNotes("")
    }
    setPatientSearch("")
  }, [editingDoc, preselectedType, open])

  const filteredPatients = patients.filter((p) => {
    const name = (p as any).full_name || (p as any).name || ""
    return name.toLowerCase().includes(patientSearch.toLowerCase())
  })

  const getPatientName = (id: string) => {
    const p = patients.find((pt) => pt.id === id)
    return (p as any)?.full_name || (p as any)?.name || ""
  }

  const addMedication = () => setMedications((prev) => [...prev, { ...emptyMedication }])
  const removeMedication = (index: number) => setMedications((prev) => prev.filter((_, i) => i !== index))
  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setMedications((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  const handleSave = async () => {
    if (!selectedPatientId) return
    setSaving(true)
    try {
      const body: any = {
        patient_id: selectedPatientId,
        document_type: docType,
        title: title || null,
        content: content || null,
        diagnosis: diagnosis || null,
        cid_code: cidCode || null,
        days_off: daysOff ? parseInt(daysOff) : null,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        referred_to: referredTo || null,
        referred_specialty: referredSpecialty || null,
        medications: docType === "prescription" ? medications.filter((m) => m.name.trim()) : [],
        notes: notes || null,
        professional_name: professionalName || null,
        professional_credentials: professionalCredentials || null,
      }

      if (editingDoc) body.id = editingDoc.id

      const res = await fetch("/api/clinical-documents", {
        method: editingDoc ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
      }
    } catch (err) {
      console.error("Erro ao salvar documento:", err)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const selectedTypeConfig = docTypes.find((t) => t.value === docType)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 pb-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br ${selectedTypeConfig?.gradient || "from-violet-500 to-purple-500"} rounded-xl`}>
              <FileSignature className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {editingDoc ? "Editar Documento" : "Novo Documento Clínico"}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedTypeConfig?.description || "Selecione o tipo de documento"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Document Type Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block">Tipo de Documento *</label>
            <div className="grid grid-cols-2 gap-2">
              {docTypes.map((type) => {
                const Icon = type.icon
                const isSelected = docType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => setDocType(type.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `border-violet-400 bg-gradient-to-r ${type.gradient} text-white shadow-md`
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isSelected ? "text-white" : "text-gray-400"}`} />
                    <span className="text-xs font-bold">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Patient Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Paciente *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-sm outline-none"
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
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        onClick={() => {
                          setSelectedPatientId(p.id)
                          setShowPatientDropdown(false)
                          setPatientSearch("")
                        }}
                      >
                        <span className="font-medium text-gray-900">{(p as any).full_name || (p as any).name}</span>
                        {p.phone && <span className="text-gray-400 ml-2 text-xs">{p.phone}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Professional Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Nome do Profissional</label>
              <input
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 text-sm outline-none"
                placeholder="Dr(a). Nome"
                value={professionalName}
                onChange={(e) => setProfessionalName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">CRM / Registro</label>
              <input
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 text-sm outline-none"
                placeholder="CRM/UF 000000"
                value={professionalCredentials}
                onChange={(e) => setProfessionalCredentials(e.target.value)}
              />
            </div>
          </div>

          {/* Prescription Fields */}
          {docType === "prescription" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-violet-500" />
                  Medicamentos
                </label>
                <button
                  onClick={addMedication}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">Medicamento {index + 1}</span>
                      {medications.length > 1 && (
                        <button
                          onClick={() => removeMedication(index)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                      placeholder="Nome do medicamento"
                      value={med.name}
                      onChange={(e) => updateMedication(index, "name", e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        placeholder="Dosagem"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      />
                      <input
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        placeholder="Frequência"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                      />
                      <input
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        placeholder="Duração"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, "duration", e.target.value)}
                      />
                    </div>
                    <input
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                      placeholder="Instruções de uso"
                      value={med.instructions}
                      onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificate Fields */}
          {(docType === "certificate_attendance" || docType === "certificate_medical") && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Data Início</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Data Fim</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                  />
                </div>
              </div>
              {docType === "certificate_medical" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">CID-10</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                      placeholder="Ex: J06.9"
                      value={cidCode}
                      onChange={(e) => setCidCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Dias de Afastamento</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                      placeholder="Nº de dias"
                      value={daysOff}
                      onChange={(e) => setDaysOff(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Diagnóstico</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                  rows={2}
                  placeholder="Diagnóstico ou motivo do atestado..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Referral Fields */}
          {docType === "referral" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Encaminhar para (Profissional)</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Nome do profissional"
                    value={referredTo}
                    onChange={(e) => setReferredTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Especialidade</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Ex: Cardiologia, Ortopedia..."
                    value={referredSpecialty}
                    onChange={(e) => setReferredSpecialty(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Diagnóstico / Motivo</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                  rows={2}
                  placeholder="Motivo do encaminhamento..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Content / Additional Text */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              {docType === "prescription" ? "Observações da Receita" : "Conteúdo / Descrição"}
            </label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
              rows={3}
              placeholder={
                docType === "prescription"
                  ? "Instruções adicionais para o paciente..."
                  : "Texto do documento..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Notas Internas (não aparecem no PDF)</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
              rows={2}
              placeholder="Notas internas do profissional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
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
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : editingDoc ? "Atualizar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}

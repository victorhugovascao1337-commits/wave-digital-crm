"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface Patient {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  patientId?: string
}

const recordTypes = [
  { value: "consultation", label: "Consulta" },
  { value: "exam", label: "Exame" },
  { value: "procedure", label: "Procedimento" },
  { value: "prescription", label: "Prescrição" },
  { value: "evolution", label: "Evolução" },
  { value: "other", label: "Outro" },
]

export function MedicalRecordFormModal({ open, onOpenChange, onSuccess, patientId }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    patient_id: patientId || "",
    record_type: "consultation",
    title: "",
    content: "",
    diagnosis: "",
    prescription: "",
  })

  useEffect(() => {
    if (open) {
      fetch("/api/patients")
        .then((r) => r.json())
        .then((data) => setPatients(Array.isArray(data) ? data : []))
        .catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (patientId) setForm((f) => ({ ...f, patient_id: patientId }))
  }, [patientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        onSuccess()
        onOpenChange(false)
        setForm({
          patient_id: patientId || "",
          record_type: "consultation",
          title: "",
          content: "",
          diagnosis: "",
          prescription: "",
        })
      }
    } catch (err) {
      console.error("Erro ao salvar:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border/50 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-foreground">Novo Registro Clínico</h3>
          <button onClick={() => onOpenChange(false)} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!patientId && (
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Paciente *</label>
              <select
                required
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="w-full px-4 py-3 bg-accent/50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione um paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Tipo de Registro *</label>
              <select
                value={form.record_type}
                onChange={(e) => setForm({ ...form, record_type: e.target.value })}
                className="w-full px-4 py-3 bg-accent/50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
              >
                {recordTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Consulta de rotina"
                className="w-full px-4 py-3 bg-accent/50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Descrição / Observações</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Descreva o atendimento, observações clínicas..."
              rows={4}
              className="w-full px-4 py-3 bg-accent/50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Diagnóstico</label>
            <input
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="CID ou descrição do diagnóstico"
              className="w-full px-4 py-3 bg-accent/50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Prescrição</label>
            <textarea
              value={form.prescription}
              onChange={(e) => setForm({ ...form, prescription: e.target.value })}
              placeholder="Medicamentos, dosagens, orientações..."
              rows={3}
              className="w-full px-4 py-3 bg-accent/50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-3 bg-accent text-foreground font-semibold rounded-xl hover:bg-accent/80 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.patient_id}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Salvando..." : "Salvar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { X, Search, DollarSign } from "lucide-react"

interface PatientOption {
  id: string
  full_name: string
  cpf: string | null
}

interface PaymentFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editData?: any
}

export function PaymentFormModal({ open, onClose, onSaved, editData }: PaymentFormModalProps) {
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient_id: "",
    patient_name: "",
    description: "",
    amount: "",
    status: "pending",
    payment_method: "",
    payment_date: "",
    due_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (editData) {
      setForm({
        patient_id: editData.patient_id || "",
        patient_name: editData.patient?.full_name || "",
        description: editData.description || "",
        amount: editData.amount?.toString() || "",
        status: editData.status || "pending",
        payment_method: editData.payment_method || "",
        payment_date: editData.payment_date || "",
        due_date: editData.due_date || "",
      })
    } else {
      setForm({
        patient_id: "",
        patient_name: "",
        description: "",
        amount: "",
        status: "pending",
        payment_method: "",
        payment_date: "",
        due_date: new Date().toISOString().split("T")[0],
      })
    }
  }, [editData, open])

  useEffect(() => {
    if (patientSearch.length >= 2) {
      fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}`)
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.data || []
          setPatients(list)
          setShowPatientDropdown(true)
        })
    } else {
      setPatients([])
      setShowPatientDropdown(false)
    }
  }, [patientSearch])

  const handleSave = async () => {
    if (!form.patient_id || !form.amount) return
    setSaving(true)
    try {
      const payload = {
        ...(editData?.id ? { id: editData.id } : {}),
        patient_id: form.patient_id,
        description: form.description,
        amount: parseFloat(form.amount),
        status: form.status,
        payment_method: form.payment_method || null,
        payment_date: form.payment_date || null,
        due_date: form.due_date || null,
      }
      const method = editData?.id ? "PUT" : "POST"
      const res = await fetch("/api/payments", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onSaved()
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {editData ? "Editar Pagamento" : "Novo Pagamento"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Paciente *</label>
            {form.patient_id ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <span className="text-sm font-medium text-emerald-800">{form.patient_name}</span>
                <button onClick={() => { setForm({ ...form, patient_id: "", patient_name: "" }); setPatientSearch("") }} className="text-emerald-600 hover:text-red-500 text-xs">Trocar</button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nome..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                        onClick={() => {
                          setForm({ ...form, patient_id: p.id, patient_name: (p as any).full_name || (p as any).name || "" })
                          setShowPatientDropdown(false)
                          setPatientSearch("")
                        }}
                      >
                        <span className="font-medium">{(p as any).full_name || (p as any).name}</span>
                        {p.cpf && <span className="text-gray-400 ml-2">CPF: {p.cpf}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Consulta, Procedimento, Retorno..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Amount + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Forma de Pagamento</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Selecione...</option>
                <option value="pix">PIX</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="cash">Dinheiro</option>
                <option value="bank_transfer">Transferência</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "pending", label: "Pendente", color: "bg-amber-50 border-amber-300 text-amber-700" },
                { value: "paid", label: "Pago", color: "bg-emerald-50 border-emerald-300 text-emerald-700" },
                { value: "overdue", label: "Atrasado", color: "bg-red-50 border-red-300 text-red-700" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setForm({ ...form, status: s.value, payment_date: s.value === "paid" ? (form.payment_date || new Date().toISOString().split("T")[0]) : form.payment_date })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.status === s.value ? s.color + " ring-2 ring-offset-1" : "bg-gray-50 border-gray-200 text-gray-500"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vencimento</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data do Pagamento</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.patient_id || !form.amount}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {saving ? "Salvando..." : editData ? "Atualizar" : "Registrar Pagamento"}
          </button>
        </div>
      </div>
    </div>
  )
}

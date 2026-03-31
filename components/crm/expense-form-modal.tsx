"use client"

import { useState, useEffect } from "react"
import { X, Receipt, Plus } from "lucide-react"

interface Category {
  id: string
  name: string
  type: string
  color: string
}

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editData?: any
}

export function ExpenseFormModal({ open, onClose, onSaved, editData }: ExpenseFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [form, setForm] = useState({
    category_id: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "",
    status: "paid",
    recurrence: "none",
    notes: "",
  })

  useEffect(() => {
    fetch("/api/financial-categories")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setCategories(list.filter((c: Category) => c.type === "expense"))
      })
  }, [open])

  useEffect(() => {
    if (editData) {
      setForm({
        category_id: editData.category_id || "",
        description: editData.description || "",
        amount: editData.amount?.toString() || "",
        expense_date: editData.expense_date || "",
        payment_method: editData.payment_method || "",
        status: editData.status || "paid",
        recurrence: editData.recurrence || "none",
        notes: editData.notes || "",
      })
    } else {
      setForm({
        category_id: "",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        payment_method: "",
        status: "paid",
        recurrence: "none",
        notes: "",
      })
    }
  }, [editData, open])

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    const res = await fetch("/api/financial-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName, type: "expense", color: "#ef4444" }),
    })
    if (res.ok) {
      const cat = await res.json()
      setCategories((prev) => [...prev, cat])
      setForm({ ...form, category_id: cat.id })
      setNewCatName("")
      setShowNewCategory(false)
    }
  }

  const handleSave = async () => {
    if (!form.description || !form.amount) return
    setSaving(true)
    try {
      const payload = {
        ...(editData?.id ? { id: editData.id } : {}),
        category_id: form.category_id || null,
        description: form.description,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        payment_method: form.payment_method || null,
        status: form.status,
        recurrence: form.recurrence,
        notes: form.notes || null,
      }
      const method = editData?.id ? "PUT" : "POST"
      const res = await fetch("/api/expenses", {
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
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {editData ? "Editar Despesa" : "Nova Despesa"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Descrição *</label>
            <input
              type="text"
              placeholder="Ex: Aluguel, Material, Salário..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Amount + Date */}
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Data</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Categoria</label>
            <div className="flex gap-2">
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="px-3 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {showNewCategory && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Nome da nova categoria"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm"
                />
                <button onClick={handleCreateCategory} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium">Criar</button>
              </div>
            )}
          </div>

          {/* Payment Method + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Forma de Pagamento</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
              </select>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Recorrência</label>
            <select
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="none">Única (sem recorrência)</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Observações</label>
            <textarea
              rows={2}
              placeholder="Observações adicionais..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.description || !form.amount}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {saving ? "Salvando..." : editData ? "Atualizar" : "Registrar Despesa"}
          </button>
        </div>
      </div>
    </div>
  )
}

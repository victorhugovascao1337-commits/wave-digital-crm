"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import {
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Edit2,
  Trash2,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
} from "lucide-react"
import { PaymentFormModal } from "@/components/crm/payment-form-modal"
import { ExpenseFormModal } from "@/components/crm/expense-form-modal"

type TabType = "overview" | "receitas" | "despesas" | "fluxo"

const PAYMENT_METHODS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão Crédito",
  debit_card: "Cartão Débito",
  cash: "Dinheiro",
  bank_transfer: "Transferência",
  boleto: "Boleto",
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Pago", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  pending: { label: "Pendente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  overdue: { label: "Atrasado", color: "text-red-700", bg: "bg-red-50 border-red-200" },
}

export default function FinanceiroPage() {
  const [tab, setTab] = useState<TabType>("overview")
  const [payments, setPayments] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPayment, setSearchPayment] = useState("")
  const [searchExpense, setSearchExpense] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [paymentModal, setPaymentModal] = useState(false)
  const [expenseModal, setExpenseModal] = useState(false)
  const [editPayment, setEditPayment] = useState<any>(null)
  const [editExpense, setEditExpense] = useState<any>(null)

  // Period filter
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const periodFrom = useMemo(() => `${period}-01`, [period])
  const periodTo = useMemo(() => {
    const [y, m] = period.split("-").map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return `${period}-${lastDay}`
  }, [period])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, eRes] = await Promise.all([
        fetch(`/api/payments?from=${periodFrom}&to=${periodTo}`),
        fetch(`/api/expenses?from=${periodFrom}&to=${periodTo}`),
      ])
      const [pData, eData] = await Promise.all([pRes.json(), eRes.json()])
      setPayments(Array.isArray(pData) ? pData : [])
      setExpenses(Array.isArray(eData) ? eData : [])
    } finally {
      setLoading(false)
    }
  }, [periodFrom, periodTo])

  useEffect(() => { fetchData() }, [fetchData])

  // Totals
  const totalReceitas = useMemo(() => payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0), [payments])
  const totalPendente = useMemo(() => payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount || 0), 0), [payments])
  const totalAtrasado = useMemo(() => payments.filter((p) => p.status === "overdue").reduce((s, p) => s + Number(p.amount || 0), 0), [payments])
  const totalDespesas = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses])
  const saldo = totalReceitas - totalDespesas

  // Filtered lists
  const filteredPayments = useMemo(() => {
    let list = payments
    if (searchPayment) {
      const q = searchPayment.toLowerCase()
      list = list.filter((p) => (p.patient?.full_name || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q))
    }
    if (filterStatus) list = list.filter((p) => p.status === filterStatus)
    return list
  }, [payments, searchPayment, filterStatus])

  const filteredExpenses = useMemo(() => {
    if (!searchExpense) return expenses
    const q = searchExpense.toLowerCase()
    return expenses.filter((e) => (e.description || "").toLowerCase().includes(q) || (e.category?.name || "").toLowerCase().includes(q))
  }, [expenses, searchExpense])

  // Cash flow by week
  const cashFlowWeeks = useMemo(() => {
    const weeks: { label: string; receitas: number; despesas: number; saldo: number }[] = []
    const [y, m] = period.split("-").map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()

    for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
      const startDay = w * 7 + 1
      const endDay = Math.min((w + 1) * 7, daysInMonth)
      const startDate = `${period}-${String(startDay).padStart(2, "0")}`
      const endDate = `${period}-${String(endDay).padStart(2, "0")}`

      const weekReceitas = payments
        .filter((p) => p.status === "paid" && p.payment_date >= startDate && p.payment_date <= endDate)
        .reduce((s, p) => s + Number(p.amount || 0), 0)

      const weekDespesas = expenses
        .filter((e) => e.expense_date >= startDate && e.expense_date <= endDate)
        .reduce((s, e) => s + Number(e.amount || 0), 0)

      weeks.push({
        label: `${startDay}-${endDay} ${new Date(y, m - 1).toLocaleString("pt-BR", { month: "short" })}`,
        receitas: weekReceitas,
        despesas: weekDespesas,
        saldo: weekReceitas - weekDespesas,
      })
    }
    return weeks
  }, [payments, expenses, period])

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Deseja excluir este pagamento?")) return
    await fetch(`/api/payments?id=${id}`, { method: "DELETE" })
    fetchData()
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Deseja excluir esta despesa?")) return
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
    fetchData()
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const periodLabel = useMemo(() => {
    const [y, m] = period.split("-").map(Number)
    return new Date(y, m - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })
  }, [period])

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "overview", label: "Resumo", icon: BarChart3 },
    { key: "receitas", label: "Receitas", icon: ArrowUpCircle },
    { key: "despesas", label: "Despesas", icon: ArrowDownCircle },
    { key: "fluxo", label: "Fluxo de Caixa", icon: TrendingUp },
  ]

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-7 w-7 text-emerald-600" />
              Financeiro
            </h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => { setEditPayment(null); setPaymentModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4" /> Receita
            </button>
            <button
              onClick={() => { setEditExpense(null); setExpenseModal(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4" /> Despesa
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Receitas (Pago)", value: totalReceitas, icon: ArrowUpCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Pendente", value: totalPendente, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Atrasado", value: totalAtrasado, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
            { label: "Despesas", value: totalDespesas, icon: ArrowDownCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
            { label: "Saldo", value: saldo, icon: Wallet, color: saldo >= 0 ? "text-emerald-600" : "text-red-600", bg: saldo >= 0 ? "bg-emerald-50" : "bg-red-50", border: saldo >= 0 ? "border-emerald-200" : "border-red-200" },
          ].map((card, i) => (
            <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs font-medium text-gray-500">{card.label}</span>
              </div>
              <p className={`text-lg font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-white shadow text-emerald-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {/* ==================== OVERVIEW ==================== */}
            {tab === "overview" && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Payments */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                    Últimas Receitas
                  </h3>
                  {payments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Nenhuma receita neste período</p>
                  ) : (
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.patient?.full_name || "—"}</p>
                            <p className="text-xs text-gray-400">{p.description || "Pagamento"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(Number(p.amount))}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_LABELS[p.status]?.bg || ""} ${STATUS_LABELS[p.status]?.color || ""}`}>
                              {STATUS_LABELS[p.status]?.label || p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Expenses */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    Últimas Despesas
                  </h3>
                  {expenses.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Nenhuma despesa neste período</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.slice(0, 5).map((e) => (
                        <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{e.description}</p>
                            <p className="text-xs text-gray-400">{e.category?.name || "Sem categoria"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-600">- {formatCurrency(Number(e.amount))}</p>
                            <span className="text-[10px] text-gray-400">
                              {new Date(e.expense_date).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Methods Breakdown */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-2">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-500" />
                    Receitas por Forma de Pagamento
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.entries(PAYMENT_METHODS).map(([key, label]) => {
                      const total = payments.filter((p) => p.payment_method === key && p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0)
                      const count = payments.filter((p) => p.payment_method === key && p.status === "paid").length
                      return (
                        <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">{label}</p>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(total)}</p>
                          <p className="text-[10px] text-gray-400">{count} pagamento{count !== 1 ? "s" : ""}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== RECEITAS ==================== */}
            {tab === "receitas" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por paciente ou descrição..."
                      value={searchPayment}
                      onChange={(e) => setSearchPayment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Todos os status</option>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="overdue">Atrasado</option>
                  </select>
                </div>

                {filteredPayments.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">Nenhuma receita encontrada</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Paciente</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Descrição</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Valor</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Método</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Vencimento</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredPayments.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{p.patient?.full_name || "—"}</td>
                              <td className="px-4 py-3 text-gray-600">{p.description || "—"}</td>
                              <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(Number(p.amount))}</td>
                              <td className="px-4 py-3 text-gray-600">{PAYMENT_METHODS[p.payment_method] || "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_LABELS[p.status]?.bg} ${STATUS_LABELS[p.status]?.color}`}>
                                  {STATUS_LABELS[p.status]?.label || p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{p.due_date ? new Date(p.due_date).toLocaleDateString("pt-BR") : "—"}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => { setEditPayment(p); setPaymentModal(true) }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="h-4 w-4" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== DESPESAS ==================== */}
            {tab === "despesas" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar despesa..."
                    value={searchExpense}
                    onChange={(e) => setSearchExpense(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-16">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">Nenhuma despesa encontrada</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Descrição</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Valor</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Método</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Recorrência</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredExpenses.map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                              <td className="px-4 py-3">
                                {e.category ? (
                                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: e.category.color + "20", color: e.category.color }}>
                                    {e.category.name}
                                  </span>
                                ) : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-4 py-3 font-bold text-red-600">- {formatCurrency(Number(e.amount))}</td>
                              <td className="px-4 py-3 text-gray-500">{new Date(e.expense_date).toLocaleDateString("pt-BR")}</td>
                              <td className="px-4 py-3 text-gray-600">{PAYMENT_METHODS[e.payment_method] || "—"}</td>
                              <td className="px-4 py-3 text-gray-500 capitalize">
                                {{ none: "Única", monthly: "Mensal", weekly: "Semanal", yearly: "Anual" }[e.recurrence] || e.recurrence}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => { setEditExpense(e); setExpenseModal(true) }} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="h-4 w-4" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== FLUXO DE CAIXA ==================== */}
            {tab === "fluxo" && (
              <div className="space-y-6">
                {/* Visual bar chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Fluxo de Caixa Semanal — <span className="capitalize">{periodLabel}</span>
                  </h3>

                  <div className="space-y-4">
                    {cashFlowWeeks.map((week, i) => {
                      const maxVal = Math.max(...cashFlowWeeks.map((w) => Math.max(w.receitas, w.despesas)), 1)
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 w-24">{week.label}</span>
                            <span className={`text-sm font-bold ${week.saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              Saldo: {formatCurrency(week.saldo)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-600 w-6">+</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                  style={{ width: `${Math.max((week.receitas / maxVal) * 100, 0)}%`, minWidth: week.receitas > 0 ? "60px" : "0" }}
                                >
                                  {week.receitas > 0 && <span className="text-[10px] font-bold text-white">{formatCurrency(week.receitas)}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-red-600 w-6">−</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                  style={{ width: `${Math.max((week.despesas / maxVal) * 100, 0)}%`, minWidth: week.despesas > 0 ? "60px" : "0" }}
                                >
                                  {week.despesas > 0 && <span className="text-[10px] font-bold text-white">{formatCurrency(week.despesas)}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Monthly totals summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                    <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-emerald-600 font-medium mb-1">Total Entradas</p>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalReceitas)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                    <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-xs text-red-600 font-medium mb-1">Total Saídas</p>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(totalDespesas)}</p>
                  </div>
                  <div className={`${saldo >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"} border rounded-2xl p-5 text-center`}>
                    <Wallet className={`h-8 w-8 ${saldo >= 0 ? "text-emerald-500" : "text-red-500"} mx-auto mb-2`} />
                    <p className={`text-xs ${saldo >= 0 ? "text-emerald-600" : "text-red-600"} font-medium mb-1`}>Resultado</p>
                    <p className={`text-xl font-bold ${saldo >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(saldo)}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <PaymentFormModal
        open={paymentModal}
        onClose={() => { setPaymentModal(false); setEditPayment(null) }}
        onSaved={fetchData}
        editData={editPayment}
      />
      <ExpenseFormModal
        open={expenseModal}
        onClose={() => { setExpenseModal(false); setEditExpense(null) }}
        onSaved={fetchData}
        editData={editExpense}
      />
    </CRMLayout>
  )
}

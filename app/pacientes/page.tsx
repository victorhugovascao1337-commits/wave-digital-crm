"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  Users,
  UserCheck,
  UserX,
  Clock,
  X,
} from "lucide-react"
import { PatientList } from "@/components/crm/patient-list"
import { PatientFormModal } from "@/components/crm/patient-form-modal"
import type { Patient } from "@/lib/database.types"

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "Ativo" },
  { label: "Pendentes", value: "Pendente" },
  { label: "Inativos", value: "Inativo" },
]

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [newPatientModalOpen, setNewPatientModalOpen] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterPaymentType, setFilterPaymentType] = useState("all")
  const [filterHasPlan, setFilterHasPlan] = useState("all")

  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch("/api/patients")
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.cpf?.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter
    const matchesPayment =
      filterPaymentType === "all" ||
      (patient as Record<string, unknown>).payment_type === filterPaymentType
    const matchesPlan =
      filterHasPlan === "all" ||
      (filterHasPlan === "yes" && (patient as Record<string, unknown>).has_plan === true) ||
      (filterHasPlan === "no" && (patient as Record<string, unknown>).has_plan !== true)
    return matchesSearch && matchesStatus && matchesPayment && matchesPlan
  })

  const stats = {
    total: patients.length,
    ativos: patients.filter((p) => p.status === "Ativo").length,
    pendentes: patients.filter((p) => p.status === "Pendente").length,
    inativos: patients.filter((p) => p.status === "Inativo").length,
  }

  const handleExport = () => {
    const headers = ["Nome", "CPF", "Telefone", "Email", "Status", "Data Nascimento"]
    const rows = filteredPatients.map((p) => [
      p.name,
      p.cpf || "",
      p.phone || "",
      p.email || "",
      p.status || "",
      p.birth_date || "",
    ])
    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(";")),
    ].join("\n")
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `pacientes_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CRMLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Pacientes
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie o histórico e o atendimento de sua base clínica.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-muted-foreground font-medium border border-border rounded-xl hover:bg-accent hover:shadow-sm transition-all text-sm"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => setNewPatientModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Paciente</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-blue-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.total}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-emerald-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.ativos}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ativos</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-amber-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-amber-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.pendentes}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pendentes</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gray-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl">
                <UserX className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.inativos}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inativos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm font-medium outline-none shadow-sm"
              placeholder="Buscar por nome, CPF, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-span-12 lg:col-span-7 flex gap-2 items-center flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === filter.value
                    ? "bg-primary text-white shadow-md shadow-primary/15"
                    : "bg-white text-muted-foreground border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl transition-all text-sm ${
                  showAdvancedFilters
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-muted-foreground border border-gray-200 hover:border-gray-300"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Filtros Avançados
              </p>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tipo de Pagamento
                </label>
                <select
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todos</option>
                  <option value="por_sessao">Por Sessão</option>
                  <option value="mensal">Mensal</option>
                  <option value="plano">Plano</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tem Plano
                </label>
                <select
                  value={filterHasPlan}
                  onChange={(e) => setFilterHasPlan(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todos</option>
                  <option value="yes">Sim</option>
                  <option value="no">Não</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterPaymentType("all")
                    setFilterHasPlan("all")
                    setStatusFilter("all")
                    setSearchTerm("")
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-xl transition-all"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Mostrando {filteredPatients.length} de {patients.length} pacientes
            </p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">Carregando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 && !searchTerm && statusFilter === "all" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Nenhum paciente cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece adicionando seu primeiro paciente.
              </p>
            </div>
            <button
              onClick={() => setNewPatientModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Paciente
            </button>
          </div>
        ) : (
          <PatientList patients={filteredPatients} onRefresh={fetchPatients} />
        )}
      </div>

      <PatientFormModal
        open={newPatientModalOpen}
        onOpenChange={setNewPatientModalOpen}
        onSuccess={fetchPatients}
      />
    </CRMLayout>
  )
}

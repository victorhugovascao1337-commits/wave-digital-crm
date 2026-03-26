"use client"

import { useState, useEffect, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Spinner } from "@/components/ui/spinner"
import { Search, Plus, Download, SlidersHorizontal } from "lucide-react"
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

    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter

    const matchesPayment =
      filterPaymentType === "all" ||
      (patient as Record<string, unknown>).payment_type === filterPaymentType

    const matchesPlan =
      filterHasPlan === "all" ||
      (filterHasPlan === "yes" && (patient as Record<string, unknown>).has_plan === true) ||
      (filterHasPlan === "no" && (patient as Record<string, unknown>).has_plan !== true)

    return matchesSearch && matchesStatus && matchesPayment && matchesPlan
  })

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
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Pacientes
            </h2>
            <p className="text-muted-foreground mt-1">
              Gerencie o histórico e o atendimento de sua base clínica.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-muted-foreground font-medium border border-border rounded-xl hover:bg-accent transition-all"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => setNewPatientModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              <Plus className="h-4 w-4" />
              Novo Paciente
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-accent/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium outline-none"
              placeholder="Filtrar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-span-12 lg:col-span-7 flex gap-2 items-center">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                  statusFilter === filter.value
                    ? "bg-primary text-white shadow-md shadow-primary/10"
                    : "bg-white text-muted-foreground hover:bg-accent"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all ${
                  showAdvancedFilters
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-primary/5"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros Avançados
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mb-6 p-5 bg-white rounded-2xl border border-border/50 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tipo de Pagamento
                </label>
                <select
                  value={filterPaymentType}
                  onChange={(e) => setFilterPaymentType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-accent/50 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="w-full px-3 py-2.5 bg-accent/50 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
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
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
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
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" />
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

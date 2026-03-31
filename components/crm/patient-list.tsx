"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PatientDetailsModal } from "./patient-details-modal"
import { PatientFormModal } from "./patient-form-modal"
import type { Patient } from "@/lib/database.types"
import { cn } from "@/lib/utils"

interface PatientListProps {
  patients: Patient[]
  onRefresh: () => void
}

interface VisitInfo {
  lastVisit: string | null
  nextVisit: string | null
  nextVisitTime: string | null
}

// Avatar colors now handled automatically by avatar.tsx auto-gradient system

const ITEMS_PER_PAGE = 10

export function PatientList({ patients, onRefresh }: PatientListProps) {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [visits, setVisits] = useState<Record<string, VisitInfo>>({})

  // Fetch visit info for patients
  useEffect(() => {
    if (patients.length === 0) return
    const today = new Date().toISOString().split("T")[0]

    fetch(`/api/appointments`)
      .then((r) => r.json())
      .then((appointments: Array<{ patient_id: string; date: string; start_time: string }>) => {
        const map: Record<string, VisitInfo> = {}

        for (const patient of patients) {
          const patientApts = appointments.filter((a: { patient_id: string }) => a.patient_id === patient.id)
          const past = patientApts
            .filter((a: { date: string }) => a.date <= today)
            .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date))
          const future = patientApts
            .filter((a: { date: string }) => a.date >= today)
            .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))

          map[patient.id] = {
            lastVisit: past[0]?.date || null,
            nextVisit: future[0]?.date || null,
            nextVisitTime: future[0]?.start_time || null,
          }
        }

        setVisits(map)
      })
      .catch(() => {})
  }, [patients])

  const totalPages = Math.ceil(patients.length / ITEMS_PER_PAGE)
  const paginatedPatients = patients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { active: "Ativo", Ativo: "Ativo", pending: "Pendente", Pendente: "Pendente", inactive: "Inativo", Inativo: "Inativo" }
    return map[status] || status
  }

  const getStatusStyle = (status: string) => {
    const label = getStatusLabel(status)
    switch (label) {
      case "Ativo":
        return "bg-blue-50 text-blue-700"
      case "Pendente":
        return "bg-orange-50 text-orange-700"
      case "Inativo":
        return "bg-gray-100 text-gray-500"
      default:
        return "bg-gray-100 text-gray-500"
    }
  }

  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const cleanPhone = phone.replace(/\D/g, "")
    window.open(`https://wa.me/55${cleanPhone}`, "_blank")
  }

  const handleViewDetails = (patientId: string) => {
    setSelectedPatientId(patientId)
    setDetailsModalOpen(true)
  }

  const handleEdit = (patient: Patient, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPatientToEdit(patient)
    setEditModalOpen(true)
    setDetailsModalOpen(false)
  }

  const handleEditFromDetails = () => {
    const patient = patients.find((p) => p.id === selectedPatientId)
    if (patient) {
      setPatientToEdit(patient)
      setDetailsModalOpen(false)
      setEditModalOpen(true)
    }
  }

  const handleDelete = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Tem certeza que deseja excluir este paciente?")) {
      try {
        const response = await fetch(`/api/patients/${patientId}`, { method: "DELETE" })
        if (response.ok) onRefresh()
      } catch (error) {
        console.error("Erro ao excluir paciente:", error)
      }
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr + "T12:00:00")
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  }

  const formatNextVisit = (visit: VisitInfo | undefined) => {
    if (!visit?.nextVisit) return null
    const today = new Date()
    const visitDate = new Date(visit.nextVisit + "T12:00:00")
    const diffDays = Math.ceil((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let label: string
    if (diffDays === 0) label = "Hoje"
    else if (diffDays === 1) label = "Amanhã"
    else label = formatDate(visit.nextVisit) || ""

    const time = visit.nextVisitTime ? `, ${visit.nextVisitTime.slice(0, 5)}` : ""
    return { label: label + time, isUpcoming: diffDays <= 1 }
  }

  return (
    <>
      <section className="bg-gradient-to-br from-gray-50/80 to-gray-100/50 p-1 rounded-2xl">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-8 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Paciente
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  CPF / Identidade
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Última Visita
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Próxima Visita
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Contato
                </th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const visit = visits[patient.id]
                  const nextVisit = formatNextVisit(visit)

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => handleViewDetails(patient.id)}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Patient */}
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarFallback className="text-sm">
                              {getInitials(patient.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-foreground text-[15px]">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.phone || "Sem telefone"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CPF */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-muted-foreground">
                          {patient.cpf || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase",
                          getStatusStyle(patient.status)
                        )}>
                          {getStatusLabel(patient.status)}
                        </span>
                      </td>

                      {/* Última Visita */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(visit?.lastVisit) || "Sem registro"}
                        </span>
                      </td>

                      {/* Próxima Visita */}
                      <td className="px-5 py-4">
                        {nextVisit ? (
                          <div className="flex items-center gap-2">
                            {nextVisit.isUpcoming && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                            <span className={cn(
                              "text-sm font-semibold",
                              nextVisit.isUpcoming ? "text-primary" : "text-foreground"
                            )}>
                              {nextVisit.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não agendado</span>
                        )}
                      </td>

                      {/* WhatsApp */}
                      <td className="px-5 py-4">
                        {patient.phone ? (
                          <button
                            onClick={(e) => openWhatsApp(patient.phone, e)}
                            className="flex items-center gap-2 bg-[#25D366]/10 text-[#075E54] px-4 py-2 rounded-lg text-xs font-bold transition-all hover:bg-[#25D366]/20 active:scale-95"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(patient.id)}>
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleEdit(patient, e)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => handleDelete(patient.id, e)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {patients.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando{" "}
                <span className="font-semibold text-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, patients.length)}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-foreground">{patients.length}</span>{" "}
                pacientes
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors",
                      currentPage === page
                        ? "bg-primary text-white font-bold shadow-sm"
                        : "hover:bg-accent"
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent transition-colors text-muted-foreground disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <PatientDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        patientId={selectedPatientId}
        onEdit={handleEditFromDetails}
      />

      <PatientFormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        patient={patientToEdit}
        onSuccess={onRefresh}
      />
    </>
  )
}

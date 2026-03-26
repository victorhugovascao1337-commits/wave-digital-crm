"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  Pencil,
  MessageCircle,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  User,
  Hash,
  Upload,
  FileUp,
  Download,
  Trash2,
  File,
} from "lucide-react"
import type { PatientWithRelations } from "@/lib/database.types"
import { cn } from "@/lib/utils"

interface PatientDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string | null
  onEdit: () => void
}

export function PatientDetailsModal({
  open,
  onOpenChange,
  patientId,
  onEdit,
}: PatientDetailsModalProps) {
  const [patient, setPatient] = useState<PatientWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<Array<{
    id: string
    name: string
    file_url: string
    file_size: number | null
    file_type: string
    uploaded_by: string | null
    created_at: string
  }>>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (patientId && open) {
      fetchPatient()
      fetchDocuments()
    }
  }, [patientId, open])

  const fetchPatient = async () => {
    if (!patientId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data)
      }
    } catch (error) {
      console.error("Erro ao carregar paciente:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    if (!patientId) return
    try {
      const response = await fetch(`/api/patients/${patientId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !patientId) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      })
      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error("Erro ao enviar documento:", error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!patientId) return
    try {
      await fetch(`/api/patients/${patientId}/documents?docId=${docId}`, {
        method: "DELETE",
      })
      fetchDocuments()
    } catch (error) {
      console.error("Erro ao excluir documento:", error)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; className: string; dot: string }> = {
      active: {
        label: "Ativo",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      },
      pending: {
        label: "Pendente",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      },
      inactive: {
        label: "Inativo",
        className: "bg-gray-50 text-gray-500 border-gray-200",
        dot: "bg-gray-400",
      },
    }
    return config[status] || config.inactive
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getAppointmentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "no_show":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "")
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const openWhatsApp = () => {
    if (patient?.phone) {
      const phone = patient.phone.replace(/\D/g, "")
      window.open(`https://wa.me/55${phone}`, "_blank")
    }
  }

  const hasAddress = patient?.cep || patient?.street || patient?.city

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Carregando...</DialogTitle>
            <DialogDescription className="sr-only">
              Carregando dados do paciente
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!patient) return null

  const statusConfig = getStatusConfig(patient.status)

  const totalPaid =
    patient.payments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const totalPending =
    patient.payments
      ?.filter((p) => p.status !== "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-6 pt-6 pb-5">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-[72px] w-[72px] ring-4 ring-white shadow-md">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    {patient.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalhes do paciente {patient.name}
                  </DialogDescription>
                  <Badge
                    variant="outline"
                    className={cn("font-medium gap-1.5", statusConfig.className)}
                  >
                    <span className={cn("h-2 w-2 rounded-full", statusConfig.dot)} />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit} className="shadow-sm">
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 py-5">
            {/* Contact Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contato
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{patient.phone}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={openWhatsApp}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>

                {patient.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm">{patient.email}</span>
                  </div>
                )}

                {patient.cpf && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-50">
                      <Hash className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">CPF</span>
                      <p className="text-sm font-medium">{formatCpf(patient.cpf)}</p>
                    </div>
                  </div>
                )}

                {patient.birth_date && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-orange-50">
                      <Calendar className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Nascimento</span>
                      <p className="text-sm font-medium">{formatDate(patient.birth_date)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Endereço
              </h3>
              {hasAddress ? (
                <div className="flex gap-3">
                  <div className="flex items-start justify-center h-8 w-8 rounded-lg bg-rose-50 flex-shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-rose-500 mt-2" />
                  </div>
                  <div className="text-sm space-y-0.5">
                    {patient.street && (
                      <p className="font-medium">
                        {patient.street}
                        {patient.street_number && `, ${patient.street_number}`}
                      </p>
                    )}
                    {patient.complement && (
                      <p className="text-muted-foreground">{patient.complement}</p>
                    )}
                    {patient.neighborhood && (
                      <p className="text-muted-foreground">{patient.neighborhood}</p>
                    )}
                    {(patient.city || patient.state) && (
                      <p className="text-muted-foreground">
                        {[patient.city, patient.state].filter(Boolean).join(" - ")}
                      </p>
                    )}
                    {patient.cep && (
                      <p className="text-muted-foreground font-mono text-xs mt-1">
                        CEP: {patient.cep}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum endereço cadastrado
                </p>
              )}
            </div>
          </div>

          {/* Payment Type */}
          {patient.payment_type && (
            <div className="col-span-2 mt-4">
              <Separator className="mb-4" />
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Forma de Pagamento
                </h3>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">
                  {patient.payment_type === "per_session" && "Por Consulta"}
                  {patient.payment_type === "plan" && "Plano/Pacote"}
                  {patient.payment_type === "monthly" && "Mensalidade"}
                  {patient.payment_type === "insurance" && "Convênio"}
                </p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {patient.payment_type === "per_session" && patient.session_value && (
                    <p>Valor por sessão: {formatCurrency(Number(patient.session_value))}</p>
                  )}
                  {patient.payment_type === "plan" && (
                    <>
                      {patient.plan_name && <p>{patient.plan_name}</p>}
                      {patient.plan_sessions && <p>{patient.plan_sessions} sessões</p>}
                      {patient.plan_value && <p>Valor: {formatCurrency(Number(patient.plan_value))}</p>}
                    </>
                  )}
                  {patient.payment_type === "monthly" && patient.plan_value && (
                    <p>Mensalidade: {formatCurrency(Number(patient.plan_value))}</p>
                  )}
                  {patient.payment_type === "insurance" && patient.plan_name && (
                    <p>{patient.plan_name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {patient.notes && (
            <>
              <Separator />
              <div className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Observações
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                  {patient.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 py-5">
            <div className="rounded-xl border bg-gradient-to-br from-blue-50/50 to-transparent p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total Consultas
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {patient.appointments?.length || 0}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50/50 to-transparent p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total Pago
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="rounded-xl border bg-gradient-to-br from-amber-50/50 to-transparent p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  Pendente
                </span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  totalPending > 0 ? "text-amber-600" : "text-muted-foreground"
                )}
              >
                {formatCurrency(totalPending)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="appointments">
            <TabsList className="w-full h-11">
              <TabsTrigger value="appointments" className="flex-1 gap-2">
                <Calendar className="h-4 w-4" />
                Consultas
                {patient.appointments && patient.appointments.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-semibold">
                    {patient.appointments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex-1 gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamentos
                {patient.payments && patient.payments.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-semibold">
                    {patient.payments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 gap-2">
                <File className="h-4 w-4" />
                Documentos
                {documents.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-semibold">
                    {documents.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="mt-4 space-y-2">
              {patient.appointments && patient.appointments.length > 0 ? (
                patient.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getAppointmentStatusIcon(appointment.status)}
                      <div>
                        <p className="text-sm font-medium">
                          {appointment.service}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(appointment.date)} •{" "}
                          {appointment.start_time.slice(0, 5)} -{" "}
                          {appointment.end_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(Number(appointment.amount))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium">Nenhuma consulta registrada</p>
                  <p className="text-xs mt-1">As consultas aparecerão aqui</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-2">
              {patient.payments && patient.payments.length > 0 ? (
                patient.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentStatusIcon(payment.status)}
                      <div>
                        <p className="text-sm font-medium">
                          {payment.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.status === "paid"
                            ? `Pago em ${formatDate(payment.paid_date!)}`
                            : `Vence em ${formatDate(payment.due_date)}`}
                          {payment.payment_method &&
                            ` • ${payment.payment_method}`}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        payment.status === "paid"
                          ? "text-emerald-600"
                          : payment.status === "overdue"
                            ? "text-red-500"
                            : "text-amber-500"
                      )}
                    >
                      {formatCurrency(Number(payment.amount))}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium">Nenhum pagamento registrado</p>
                  <p className="text-xs mt-1">Os pagamentos aparecerão aqui</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-3">
              {/* Upload Button */}
              <div className="flex justify-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Enviar Documento"}
                </Button>
              </div>

              {/* Documents List */}
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-50 flex-shrink-0">
                        <FileUp className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                          {doc.uploaded_by && ` • ${doc.uploaded_by}`}
                          {" • "}
                          {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(doc.file_url, "_blank")}
                        title="Abrir documento"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Excluir documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <FileUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium">Nenhum documento enviado</p>
                  <p className="text-xs mt-1">
                    Envie PDFs, laudos ou exames do paciente
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useRef } from "react"
import { Printer, Download, X } from "lucide-react"
import { renderMarkdown } from "./prontuario-editor"
import type { MedicalRecord, Patient } from "@/lib/database.types"

interface ProntuarioPDFViewerProps {
  record: MedicalRecord
  patient: Patient | null
  clinicName?: string
  clinicLogo?: string | null
  clinicAddress?: string
  clinicPhone?: string
  professionalName?: string
  professionalCredentials?: string
  signatureImage?: string | null
  onClose: () => void
}

const typeLabels: Record<string, string> = {
  consultation: "Consulta",
  exam: "Exame",
  procedure: "Procedimento",
  prescription: "Prescrição",
  evolution: "Evolução",
  other: "Outro",
}

export function ProntuarioPDFViewer({
  record,
  patient,
  clinicName = "Wave CRM",
  clinicLogo,
  clinicAddress,
  clinicPhone,
  professionalName,
  professionalCredentials,
  signatureImage,
  onClose,
}: ProntuarioPDFViewerProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = printRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prontuário - ${patient?.name || "Paciente"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
          .header-left { display: flex; align-items: center; gap: 16px; }
          .header-logo { width: 80px; height: 40px; object-fit: contain; }
          .clinic-name { font-size: 22px; font-weight: 700; color: #0c4a6e; }
          .clinic-info { font-size: 11px; color: #64748b; margin-top: 4px; }
          .header-right { text-align: right; font-size: 11px; color: #64748b; }
          .patient-info { background: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .patient-name { font-size: 16px; font-weight: 600; color: #0c4a6e; }
          .patient-details { display: flex; gap: 24px; margin-top: 8px; font-size: 12px; color: #475569; flex-wrap: wrap; }
          .record-meta { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
          .meta-badge { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 11px; font-weight: 700; color: #0ea5e9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
          .section-content { font-size: 13px; color: #334155; white-space: pre-wrap; }
          .section-content h1 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 12px 0 8px; }
          .section-content h2 { font-size: 16px; font-weight: 700; color: #334155; margin: 10px 0 6px; }
          .section-content h3 { font-size: 14px; font-weight: 600; color: #475569; margin: 8px 0 4px; }
          .section-content strong { font-weight: 600; color: #1e293b; }
          .section-content li { margin-left: 20px; margin-bottom: 4px; }
          .section-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }
          .signature-area { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; }
          .signature-img { max-height: 60px; margin: 0 auto 8px; display: block; }
          .signature-line { width: 250px; border-bottom: 1px solid #1a1a1a; margin: 0 auto 8px; }
          .signature-name { font-size: 13px; font-weight: 600; color: #1e293b; }
          .signature-credentials { font-size: 11px; color: #64748b; }
          .signature-date { font-size: 11px; color: #94a3b8; margin-top: 4px; }
          .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          @media print {
            body { padding: 20px; }
            .footer { position: fixed; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const handleDownloadPDF = () => {
    handlePrint()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Visualização do Prontuário
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
              <Download className="h-3.5 w-3.5" /> Salvar PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div ref={printRef} className="bg-white rounded-lg shadow-md p-8 mx-auto" style={{ maxWidth: 700, minHeight: 500 }}>
            <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #0ea5e9", paddingBottom: 20, marginBottom: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {clinicLogo && <img src={clinicLogo} alt="Logo" style={{ width: 80, height: 40, objectFit: "contain" }} />}
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0c4a6e" }}>{clinicName}</div>
                  {(clinicAddress || clinicPhone) && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      {clinicAddress && <span>{clinicAddress}</span>}
                      {clinicAddress && clinicPhone && <span> • </span>}
                      {clinicPhone && <span>{clinicPhone}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>
                <div>Prontuário Eletrônico</div>
                <div style={{ fontWeight: 600 }}>{formatDate(record.created_at)}</div>
              </div>
            </div>
            <div style={{ background: "#f0f9ff", borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0c4a6e" }}>{patient?.name || "Paciente não identificado"}</div>
              <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 12, color: "#475569", flexWrap: "wrap" as const }}>
                {patient?.cpf && <span>CPF: {patient.cpf}</span>}
                {patient?.birth_date && <span>Nascimento: {new Date(patient.birth_date).toLocaleDateString("pt-BR")}</span>}
                {patient?.phone && <span>Tel: {patient.phone}</span>}
                {patient?.email && <span>E-mail: {patient.email}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" as const }}>
              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{typeLabels[record.record_type] || "Outro"}</span>
              {record.title && <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{record.title}</span>}
            </div>
            {record.content && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #e2e8f0" }}>Registro Clínico</div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(record.content) }} />
              </div>
            )}
            {record.diagnosis && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #e2e8f0" }}>Diagnóstico</div>
                <div style={{ fontSize: 13, color: "#334155" }}>{record.diagnosis}</div>
              </div>
            )}
            {record.prescription && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #e2e8f0" }}>Prescrição</div>
                <div style={{ fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" as const }}>{record.prescription}</div>
              </div>
            )}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: "2px solid #e2e8f0", textAlign: "center" as const }}>
              {signatureImage && <img src={signatureImage} alt="Assinatura" style={{ maxHeight: 60, margin: "0 auto 8px", display: "block" }} />}
              <div style={{ width: 250, borderBottom: "1px solid #1a1a1a", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{professionalName || "Profissional de Saúde"}</div>
              {professionalCredentials && <div style={{ fontSize: 11, color: "#64748b" }}>{professionalCredentials}</div>}
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{formatDate(record.created_at)}</div>
            </div>
            <div style={{ textAlign: "center" as const, fontSize: 10, color: "#94a3b8", marginTop: 30, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>Documento gerado eletronicamente por {clinicName} via Wave CRM</div>
          </div>
        </div>
      </div>
    </div>
  )
}

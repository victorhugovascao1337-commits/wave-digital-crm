"use client"

import { useRef } from "react"
import { X, Printer, Download } from "lucide-react"

interface DocumentPdfViewerProps {
  document: any
  onClose: () => void
}

export function DocumentPdfViewer({ document: doc, onClose }: DocumentPdfViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const patientName = doc.patient?.full_name || "Paciente"
  const patientCpf = doc.patient?.cpf || ""
  const patientDob = doc.patient?.date_of_birth
    ? new Date(doc.patient.date_of_birth).toLocaleDateString("pt-BR")
    : ""

  const typeLabels: Record<string, string> = {
    prescription: "RECEITUÁRIO",
    certificate_attendance: "ATESTADO DE COMPARECIMENTO",
    certificate_medical: "ATESTADO MÉDICO",
    referral: "ENCAMINHAMENTO",
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow || !contentRef.current) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${typeLabels[doc.document_type] || "Documento"} - ${patientName}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #6d28d9; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 16px; color: #6d28d9; margin: 0 0 4px 0; letter-spacing: 2px; }
          .header .clinic-name { font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 0 0 4px 0; }
          .header .clinic-info { font-size: 11px; color: #666; margin: 0; }
          .patient-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
          .patient-box p { margin: 2px 0; font-size: 13px; }
          .patient-box .label { font-weight: 600; color: #5b21b6; }
          .doc-title { text-align: center; font-size: 18px; font-weight: bold; color: #6d28d9; margin: 24px 0 16px; text-transform: uppercase; letter-spacing: 1px; }
          .content-section { margin: 16px 0; }
          .content-section h3 { font-size: 13px; color: #6d28d9; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .content-section p { font-size: 14px; margin: 0; }
          .med-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .med-table th { background: #6d28d9; color: white; padding: 8px 12px; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
          .med-table td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
          .med-table tr:nth-child(even) { background: #faf5ff; }
          .med-item { margin: 12px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; }
          .med-item .med-name { font-weight: 600; font-size: 14px; color: #1a1a1a; }
          .med-item .med-detail { font-size: 12px; color: #666; margin: 2px 0; }
          .signature { text-align: center; margin-top: 60px; }
          .signature .line { border-top: 1px solid #1a1a1a; width: 250px; margin: 0 auto 8px; }
          .signature .name { font-weight: 600; font-size: 14px; }
          .signature .credentials { font-size: 12px; color: #666; }
          .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        </style>
      </head>
      <body>
        ${contentRef.current.innerHTML}
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 pb-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">
            {typeLabels[doc.document_type]} — {patientName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold rounded-xl hover:shadow-md transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="p-6 max-h-[75vh] overflow-y-auto bg-gray-50">
          <div
            ref={contentRef}
            className="bg-white shadow-lg rounded-lg p-8 mx-auto"
            style={{ maxWidth: "210mm", minHeight: "297mm", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
          >
            {/* Header */}
            <div className="header" style={{ textAlign: "center", borderBottom: "2px solid #6d28d9", paddingBottom: "16px", marginBottom: "24px" }}>
              {doc.clinic_name && (
                <p className="clinic-name" style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a1a", margin: "0 0 4px 0" }}>
                  {doc.clinic_name}
                </p>
              )}
              {doc.clinic_address && (
                <p className="clinic-info" style={{ fontSize: "11px", color: "#666", margin: "0" }}>
                  {doc.clinic_address}
                  {doc.clinic_phone && ` • Tel: ${doc.clinic_phone}`}
                </p>
              )}
            </div>

            {/* Document Title */}
            <div className="doc-title" style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#6d28d9", margin: "24px 0 16px", textTransform: "uppercase", letterSpacing: "1px" }}>
              {typeLabels[doc.document_type]}
            </div>

            {/* Patient Info */}
            <div className="patient-box" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" }}>
              <p style={{ margin: "2px 0", fontSize: "13px" }}>
                <span style={{ fontWeight: 600, color: "#5b21b6" }}>Paciente:</span> {patientName}
              </p>
              {patientCpf && (
                <p style={{ margin: "2px 0", fontSize: "13px" }}>
                  <span style={{ fontWeight: 600, color: "#5b21b6" }}>CPF:</span> {patientCpf}
                </p>
              )}
              {patientDob && (
                <p style={{ margin: "2px 0", fontSize: "13px" }}>
                  <span style={{ fontWeight: 600, color: "#5b21b6" }}>Data de Nascimento:</span> {patientDob}
                </p>
              )}
            </div>

            {/* Date */}
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
              Data: {formatDate(doc.date_start) || today}
            </p>

            {/* Prescription Content */}
            {doc.document_type === "prescription" && doc.medications?.length > 0 && (
              <div className="content-section" style={{ margin: "16px 0" }}>
                {doc.medications.map((med: any, i: number) => (
                  <div key={i} className="med-item" style={{ margin: "12px 0", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                    <p className="med-name" style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a" }}>
                      {i + 1}. {med.name}
                      {med.dosage && ` — ${med.dosage}`}
                    </p>
                    {med.frequency && (
                      <p className="med-detail" style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>
                        Posologia: {med.frequency}
                      </p>
                    )}
                    {med.duration && (
                      <p className="med-detail" style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>
                        Duração: {med.duration}
                      </p>
                    )}
                    {med.instructions && (
                      <p className="med-detail" style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>
                        {med.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Certificate Content */}
            {(doc.document_type === "certificate_attendance" || doc.document_type === "certificate_medical") && (
              <div className="content-section" style={{ margin: "16px 0" }}>
                <p style={{ fontSize: "14px", lineHeight: "1.8", margin: "0" }}>
                  Atesto, para os devidos fins, que o(a) paciente{" "}
                  <strong>{patientName}</strong>
                  {patientCpf && <>, portador(a) do CPF <strong>{patientCpf}</strong></>}
                  {doc.document_type === "certificate_attendance" ? (
                    <>
                      {" "}compareceu a esta clínica na data de <strong>{formatDate(doc.date_start) || today}</strong>
                      {doc.date_end && doc.date_end !== doc.date_start && <> até <strong>{formatDate(doc.date_end)}</strong></>}
                      {" "}para atendimento médico.
                    </>
                  ) : (
                    <>
                      {" "}necessita de afastamento de suas atividades
                      {doc.days_off && <> por <strong>{doc.days_off} ({doc.days_off === 1 ? "um" : doc.days_off}) dia(s)</strong></>}
                      {doc.date_start && <>, a partir de <strong>{formatDate(doc.date_start)}</strong></>}
                      {doc.date_end && <> até <strong>{formatDate(doc.date_end)}</strong></>}
                      .
                    </>
                  )}
                </p>
                {doc.diagnosis && (
                  <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>
                    <strong>Diagnóstico:</strong> {doc.diagnosis}
                    {doc.cid_code && ` (CID-10: ${doc.cid_code})`}
                  </p>
                )}
              </div>
            )}

            {/* Referral Content */}
            {doc.document_type === "referral" && (
              <div className="content-section" style={{ margin: "16px 0" }}>
                <p style={{ fontSize: "14px", lineHeight: "1.8", margin: "0" }}>
                  Encaminho o(a) paciente <strong>{patientName}</strong>
                  {patientCpf && <>, portador(a) do CPF <strong>{patientCpf}</strong></>}
                  {doc.referred_specialty && <> para avaliação e acompanhamento em <strong>{doc.referred_specialty}</strong></>}
                  {doc.referred_to && <>, aos cuidados de <strong>{doc.referred_to}</strong></>}
                  .
                </p>
                {doc.diagnosis && (
                  <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>
                    <strong>Motivo:</strong> {doc.diagnosis}
                  </p>
                )}
              </div>
            )}

            {/* Additional Content */}
            {doc.content && (
              <div className="content-section" style={{ margin: "16px 0" }}>
                <p style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{doc.content}</p>
              </div>
            )}

            {/* Signature */}
            <div className="signature" style={{ textAlign: "center", marginTop: "80px" }}>
              <div className="line" style={{ borderTop: "1px solid #1a1a1a", width: "250px", margin: "0 auto 8px" }}></div>
              {doc.professional_name && (
                <p className="name" style={{ fontWeight: 600, fontSize: "14px", margin: "0" }}>
                  {doc.professional_name}
                </p>
              )}
              {doc.professional_credentials && (
                <p className="credentials" style={{ fontSize: "12px", color: "#666", margin: "0" }}>
                  {doc.professional_credentials}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="footer" style={{ textAlign: "center", fontSize: "10px", color: "#999", marginTop: "40px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
              Documento gerado eletronicamente em {today} • Wave Digital — Gestão Clínica
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { FileText, Calendar, Stethoscope, Pill, TrendingUp, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"
import type { MedicalRecord } from "@/lib/database.types"

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  consultation: { label: "Consulta", icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50" },
  exam: { label: "Exame", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  procedure: { label: "Procedimento", icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
  prescription: { label: "Prescrição", icon: Pill, color: "text-amber-600", bg: "bg-amber-50" },
  evolution: { label: "Evolução", icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50" },
  other: { label: "Outro", icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
}

interface Props {
  records: MedicalRecord[]
  onRefresh: () => void
}

export function MedicalRecordList({ records, onRefresh }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return
    try {
      const res = await fetch(`/api/medical-records/${id}`, { method: "DELETE" })
      if (res.ok) onRefresh()
    } catch (err) {
      console.error("Erro ao excluir:", err)
    }
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 bg-accent/50 rounded-2xl flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum registro encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Comece adicionando um novo registro clínico.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const config = typeConfig[record.record_type] || typeConfig.other
        const Icon = config.icon
        const isExpanded = expandedId === record.id

        return (
          <div
            key={record.id}
            className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div
              className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
            >
              <div className={`p-2.5 rounded-xl ${config.bg} shrink-0`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground truncate">
                      {record.title || "Sem título"}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === record.id ? null : record.id) }}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {menuOpenId === record.id && (
                      <div className="absolute right-0 top-8 w-40 bg-white rounded-xl border shadow-lg z-10 py-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(record.id); setMenuOpenId(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          <Eye className="h-4 w-4" /> Visualizar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(record.id); setMenuOpenId(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {record.diagnosis && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    <span className="font-medium">Diagnóstico:</span> {record.diagnosis}
                  </p>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border/50 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {record.content && (
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição</h5>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{record.content}</p>
                  </div>
                )}
                {record.diagnosis && (
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Diagnóstico</h5>
                    <p className="text-sm text-foreground">{record.diagnosis}</p>
                  </div>
                )}
                {record.prescription && (
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prescrição</h5>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{record.prescription}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

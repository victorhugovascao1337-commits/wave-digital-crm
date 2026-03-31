"use client"

import { useState, useRef, useCallback } from "react"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  Minus,
  Eye,
  Edit3,
  FileText,
} from "lucide-react"

interface ProntuarioEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

const formatHelp = [
  { label: "Negrito", syntax: "**texto**", icon: Bold, command: "bold" },
  { label: "Itálico", syntax: "*texto*", icon: Italic, command: "italic" },
  { label: "Sublinhado", syntax: "__texto__", icon: Underline, command: "underline" },
  { label: "Título 1", syntax: "# Título", icon: Heading1, command: "h1" },
  { label: "Título 2", syntax: "## Subtítulo", icon: Heading2, command: "h2" },
  { label: "Lista", syntax: "- item", icon: List, command: "ul" },
  { label: "Lista Num.", syntax: "1. item", icon: ListOrdered, command: "ol" },
  { label: "Separador", syntax: "---", icon: Minus, command: "hr" },
]

function renderMarkdown(text: string): string {
  if (!text) return ""
  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-800 mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-800 mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Underline
    .replace(/__(.+?)__/g, '<u>$1</u>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-3 border-gray-200" />')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-gray-700">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm text-gray-700">$1</li>')
    // Line breaks
    .replace(/\n/g, "<br/>")

  return html
}

function insertFormatting(
  textarea: HTMLTextAreaElement,
  command: string,
  value: string,
  onChange: (v: string) => void
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.substring(start, end)

  let newText = value
  let newCursorPos = start

  switch (command) {
    case "bold":
      newText = value.substring(0, start) + `**${selected || "texto"}**` + value.substring(end)
      newCursorPos = selected ? end + 4 : start + 2
      break
    case "italic":
      newText = value.substring(0, start) + `*${selected || "texto"}*` + value.substring(end)
      newCursorPos = selected ? end + 2 : start + 1
      break
    case "underline":
      newText = value.substring(0, start) + `__${selected || "texto"}__` + value.substring(end)
      newCursorPos = selected ? end + 4 : start + 2
      break
    case "h1":
      newText = value.substring(0, start) + `\n# ${selected || "Título"}\n` + value.substring(end)
      newCursorPos = start + 3
      break
    case "h2":
      newText = value.substring(0, start) + `\n## ${selected || "Subtítulo"}\n` + value.substring(end)
      newCursorPos = start + 4
      break
    case "ul":
      newText = value.substring(0, start) + `\n- ${selected || "Item"}\n` + value.substring(end)
      newCursorPos = start + 3
      break
    case "ol":
      newText = value.substring(0, start) + `\n1. ${selected || "Item"}\n` + value.substring(end)
      newCursorPos = start + 4
      break
    case "hr":
      newText = value.substring(0, start) + "\n---\n" + value.substring(end)
      newCursorPos = start + 5
      break
  }

  onChange(newText)
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 10)
}

export function ProntuarioEditor({ value, onChange, placeholder, readOnly }: ProntuarioEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (readOnly) {
    return (
      <div
        className="prose prose-sm max-w-none p-4 min-h-[200px] text-sm text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
      />
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        {formatHelp.map((fmt) => {
          const Icon = fmt.icon
          return (
            <button
              key={fmt.command}
              type="button"
              title={`${fmt.label} (${fmt.syntax})`}
              onClick={() => {
                if (textareaRef.current) {
                  insertFormatting(textareaRef.current, fmt.command, value, onChange)
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-800"
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            mode === "preview"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-500 hover:bg-white hover:shadow-sm"
          }`}
        >
          {mode === "edit" ? (
            <>
              <Eye className="h-3.5 w-3.5" /> Visualizar
            </>
          ) : (
            <>
              <Edit3 className="h-3.5 w-3.5" /> Editar
            </>
          )}
        </button>
      </div>

      {/* Editor / Preview */}
      {mode === "edit" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Digite aqui o conteúdo do prontuário...\n\nUse **texto** para negrito, *texto* para itálico, # para títulos..."}
          className="w-full min-h-[300px] p-4 text-sm font-mono text-gray-700 leading-relaxed resize-y outline-none border-none focus:ring-0 placeholder:text-gray-400"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        />
      ) : (
        <div className="min-h-[300px] p-4">
          {value ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <p className="text-sm text-gray-400 italic">Nenhum conteúdo para visualizar.</p>
          )}
        </div>
      )}
    </div>
  )
}

export { renderMarkdown }

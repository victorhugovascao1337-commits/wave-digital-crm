"use client"

import { useEffect, useState, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  Calendar,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  User,
  ListTodo,
  LayoutGrid,
  ClipboardList,
  Loader2,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
  assignee: string | null
  due_date: string | null
  related_to: string | null
  type: string
  patient_id: string | null
  created_at: string
  patients?: {
    id: string
    name: string
    initials: string
    avatar_color: string
  } | null
}

const statusConfig = {
  todo: {
    label: "A Fazer",
    color: "bg-gray-100 text-gray-700",
    icon: Circle,
    boardBg: "bg-gradient-to-b from-gray-50 to-white",
    borderColor: "border-gray-200",
    dotColor: "bg-gray-400",
  },
  in_progress: {
    label: "Em Andamento",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
    boardBg: "bg-gradient-to-b from-blue-50 to-white",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
  },
  completed: {
    label: "Concluído",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    boardBg: "bg-gradient-to-b from-emerald-50 to-white",
    borderColor: "border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  overdue: {
    label: "Atrasado",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
    boardBg: "bg-gradient-to-b from-red-50 to-white",
    borderColor: "border-red-200",
    dotColor: "bg-red-500",
  },
}

const priorityConfig = {
  low: { label: "Baixa", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  medium: { label: "Média", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  high: { label: "Alta", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "board">("list")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "",
    due_date: "",
    related_to: "",
    type: "general",
  })

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/tasks?status=${filterStatus}`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleCreate = async () => {
    const body: Record<string, unknown> = { ...form }
    if (!body.assignee) delete body.assignee
    if (!body.due_date) delete body.due_date
    if (!body.related_to) delete body.related_to
    if (!body.description) delete body.description

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setModalOpen(false)
      setForm({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignee: "",
        due_date: "",
        related_to: "",
        type: "general",
      })
      fetchTasks()
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setMenuOpen(null)
    fetchTasks()
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    setMenuOpen(null)
    fetchTasks()
  }

  const filtered = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d: string | null) => {
    if (!d) return ""
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  }

  return (
    <CRMLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Tarefas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas tarefas e acompanhe o progresso da equipe.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-blue-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.total}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gray-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl">
                <Circle className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.todo}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">A Fazer</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-sky-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-sky-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-sky-100 rounded-xl">
                <Clock className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.inProgress}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Andamento</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-emerald-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.completed}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Concluído</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-red-50 to-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-red-100/50" />
            <div className="relative flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.overdue}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Atrasado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              placeholder="Buscar tarefas..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm font-medium outline-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "todo", "in_progress", "completed", "overdue"] as const).map((s) => {
              const label =
                s === "all"
                  ? "Todos"
                  : s === "todo"
                    ? "A Fazer"
                    : s === "in_progress"
                      ? "Andamento"
                      : s === "completed"
                        ? "Concluído"
                        : "Atrasado"
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all hidden sm:block ${
                    filterStatus === s
                      ? "bg-primary text-white shadow-md shadow-primary/15"
                      : "bg-white text-muted-foreground border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              )
            })}
            {/* Mobile filter select */}
            <div className="sm:hidden flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all",
                  view === "list"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                )}
                onClick={() => setView("list")}
              >
                <ListTodo className="h-3.5 w-3.5" />
                Lista
              </button>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all",
                  view === "board"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                )}
                onClick={() => setView("board")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Quadro
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
          </div>
        ) : filtered.length === 0 && !search ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <ClipboardList className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Nenhuma tarefa encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua primeira tarefa para começar.
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </button>
          </div>
        ) : (
          <>
            {/* List View */}
            {view === "list" && (
              <div className="space-y-2">
                {filtered.map((task) => {
                  const statusCfg = statusConfig[task.status]
                  const priorityCfg = priorityConfig[task.priority]
                  const StatusIcon = statusCfg.icon
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-4 bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-all",
                        task.status === "overdue" && "border-l-4 border-l-red-400"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            className="mt-0.5 shrink-0"
                            onClick={() =>
                              updateStatus(
                                task.id,
                                task.status === "completed" ? "todo" : "completed"
                              )
                            }
                          >
                            <StatusIcon
                              className={cn(
                                "h-5 w-5",
                                task.status === "completed"
                                  ? "text-emerald-500"
                                  : task.status === "overdue"
                                    ? "text-red-400"
                                    : task.status === "in_progress"
                                      ? "text-blue-400"
                                      : "text-gray-300"
                              )}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                "font-semibold text-foreground text-sm",
                                task.status === "completed" &&
                                  "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {task.due_date && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                              {task.assignee && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {task.assignee}
                                </span>
                              )}
                              {task.related_to && (
                                <span className="text-xs text-muted-foreground">
                                  {task.related_to}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                              priorityCfg.color
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", priorityCfg.dot)} />
                            {priorityCfg.label}
                          </span>
                          <span
                            className={cn(
                              "hidden sm:inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                              statusCfg.color
                            )}
                          >
                            {statusCfg.label}
                          </span>
                          <div className="relative">
                            <button
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
                              onClick={() =>
                                setMenuOpen(menuOpen === task.id ? null : task.id)
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuOpen === task.id && (
                              <div className="absolute right-0 top-9 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 w-44 animate-in fade-in slide-in-from-top-1 duration-150">
                                {task.status !== "todo" && (
                                  <button
                                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    onClick={() => updateStatus(task.id, "todo")}
                                  >
                                    <Circle className="h-3.5 w-3.5 text-gray-400" />
                                    A Fazer
                                  </button>
                                )}
                                {task.status !== "in_progress" && (
                                  <button
                                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    onClick={() => updateStatus(task.id, "in_progress")}
                                  >
                                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                                    Em Andamento
                                  </button>
                                )}
                                {task.status !== "completed" && (
                                  <button
                                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    onClick={() => updateStatus(task.id, "completed")}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    Concluir
                                  </button>
                                )}
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  className="w-full text-left px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                                  onClick={() => deleteTask(task.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Board View */}
            {view === "board" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(["todo", "in_progress", "completed", "overdue"] as const).map((status) => {
                  const cfg = statusConfig[status]
                  const columnTasks = filtered.filter((t) => t.status === status)
                  return (
                    <div
                      key={status}
                      className={cn(
                        "rounded-2xl border p-4 min-h-[300px]",
                        cfg.boardBg,
                        cfg.borderColor
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                          <h3 className="font-bold text-sm text-foreground">{cfg.label}</h3>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground bg-white px-2 py-0.5 rounded-lg shadow-sm">
                          {columnTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {columnTasks.map((task) => {
                          const priorityCfg = priorityConfig[task.priority]
                          return (
                            <div
                              key={task.id}
                              className="p-3.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border-0"
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <h4 className="font-semibold text-sm text-foreground leading-snug flex-1">
                                  {task.title}
                                </h4>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ml-2 shrink-0",
                                    priorityCfg.color
                                  )}
                                >
                                  <span className={cn("w-1 h-1 rounded-full", priorityCfg.dot)} />
                                  {priorityCfg.label}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                {task.due_date ? (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(task.due_date)}
                                  </span>
                                ) : (
                                  <span />
                                )}
                                {task.assignee && (
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                      {task.assignee
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {columnTasks.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-6">
                            Nenhuma tarefa
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Task Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold tracking-tight">
              Nova Tarefa
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Crie uma nova tarefa para a equipe.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Título
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Digite o título da tarefa"
                className="mt-1.5 rounded-xl border-gray-200 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Descrição
              </Label>
              <textarea
                className="w-full mt-1.5 rounded-xl border border-gray-200 bg-background px-3 py-2.5 text-sm min-h-[80px] resize-none outline-none focus:ring-2 focus:ring-primary/20"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Prioridade
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Responsável
                </Label>
                <Input
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  placeholder="Nome"
                  className="mt-1.5 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Data Limite
                </Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="mt-1.5 rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Relacionado a
                </Label>
                <Input
                  value={form.related_to}
                  onChange={(e) => setForm({ ...form, related_to: e.target.value })}
                  placeholder="Ex: Paciente X"
                  className="mt-1.5 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tipo
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="patient">Paciente</SelectItem>
                    <SelectItem value="payment">Pagamento</SelectItem>
                    <SelectItem value="appointment">Consulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title.trim()}
                className="px-5 py-2.5 bg-gradient-to-b from-primary to-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform text-sm disabled:opacity-50 disabled:hover:scale-100"
              >
                Criar Tarefa
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}

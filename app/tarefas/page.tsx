"use client"

import { useEffect, useState, useCallback } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
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
  Filter,
  Calendar,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  User,
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
  todo: { label: "A Fazer", color: "bg-gray-100 text-gray-700", icon: Circle, boardBg: "bg-gray-50 border-gray-200" },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-700", icon: Clock, boardBg: "bg-blue-50 border-blue-200" },
  completed: { label: "Concluído", color: "bg-green-100 text-green-700", icon: CheckCircle2, boardBg: "bg-green-50 border-green-200" },
  overdue: { label: "Atrasado", color: "bg-red-100 text-red-700", icon: AlertTriangle, boardBg: "bg-red-50 border-red-200" },
}

const priorityConfig = {
  low: { label: "Baixa", color: "bg-green-100 text-green-700" },
  medium: { label: "Média", color: "bg-amber-100 text-amber-700" },
  high: { label: "Alta", color: "bg-red-100 text-red-700" },
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
      setForm({ title: "", description: "", status: "todo", priority: "medium", assignee: "", due_date: "", related_to: "", type: "general" })
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

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d: string | null) => {
    if (!d) return ""
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </CRMLayout>
    )
  }

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas tarefas e acompanhe o progresso
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
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
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
              )}
              onClick={() => setView("list")}
            >
              Lista
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                view === "board" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
              )}
              onClick={() => setView("board")}
            >
              Quadro
            </button>
          </div>
        </div>

        {/* List View */}
        {view === "list" && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                Nenhuma tarefa encontrada. Crie a primeira!
              </Card>
            ) : (
              filtered.map((task) => {
                const statusCfg = statusConfig[task.status]
                const priorityCfg = priorityConfig[task.priority]
                const StatusIcon = statusCfg.icon

                return (
                  <Card key={task.id} className={cn("p-4", task.status === "overdue" && "border-l-4 border-l-red-500")}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          className="mt-1"
                          onClick={() =>
                            updateStatus(task.id, task.status === "completed" ? "todo" : "completed")
                          }
                        >
                          <StatusIcon
                            className={cn(
                              "h-5 w-5",
                              task.status === "completed" ? "text-green-500" : "text-muted-foreground"
                            )}
                          />
                        </button>
                        <div className="flex-1">
                          <h3
                            className={cn(
                              "font-medium text-foreground",
                              task.status === "completed" && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.assignee}
                              </span>
                            )}
                            {task.related_to && (
                              <span>Relacionado: {task.related_to}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={priorityCfg.color}>{priorityCfg.label}</Badge>
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {menuOpen === task.id && (
                            <div className="absolute right-0 top-8 z-10 bg-card border border-border rounded-lg shadow-lg py-1 w-40">
                              {task.status !== "todo" && (
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => updateStatus(task.id, "todo")}>
                                  Mover para A Fazer
                                </button>
                              )}
                              {task.status !== "in_progress" && (
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => updateStatus(task.id, "in_progress")}>
                                  Em Andamento
                                </button>
                              )}
                              {task.status !== "completed" && (
                                <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => updateStatus(task.id, "completed")}>
                                  Concluir
                                </button>
                              )}
                              <button className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent" onClick={() => deleteTask(task.id)}>
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* Board View */}
        {view === "board" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["todo", "in_progress", "completed", "overdue"] as const).map((status) => {
              const cfg = statusConfig[status]
              const columnTasks = filtered.filter((t) => t.status === status)

              return (
                <div key={status} className={cn("rounded-xl border p-4 min-h-[300px]", cfg.boardBg)}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-foreground">{cfg.label}</h3>
                    <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.map((task) => {
                      const priorityCfg = priorityConfig[task.priority]
                      return (
                        <Card key={task.id} className="p-3 bg-card shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm text-foreground leading-snug">
                              {task.title}
                            </h4>
                            <Badge className={cn("text-xs ml-2 shrink-0", priorityCfg.color)}>
                              {priorityCfg.label}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {task.assignee && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {task.assignee.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <p className="text-sm text-muted-foreground">Crie uma nova tarefa.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Digite o título da tarefa"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição opcional..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Label>Responsável</Label>
                <Input
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div>
                <Label>Data Limite</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Relacionado a</Label>
                <Input
                  value={form.related_to}
                  onChange={(e) => setForm({ ...form, related_to: e.target.value })}
                  placeholder="Ex: Paciente X"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!form.title.trim()}>
                Criar Tarefa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  )
}

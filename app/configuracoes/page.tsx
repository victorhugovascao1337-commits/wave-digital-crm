"use client"

import { useState, useEffect } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  Users,
  CreditCard,
  Bell,
  Shield,
  Trash2,
  Plus,
  Building2,
  Camera,
} from "lucide-react"

export default function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Profile tab
  const [profileData, setProfileData] = useState({
    clinicName: "",
    specialty: "",
    ownerFirstName: "",
    ownerLastName: "",
    email: "",
    phone: "",
    crefito: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
  })

  // Load data from API
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        const nameParts = (data.full_name || "").split(" ")
        setProfileData((prev) => ({
          ...prev,
          clinicName: data.clinic_name || prev.clinicName,
          specialty: data.specialty || prev.specialty,
          ownerFirstName: nameParts[0] || "",
          ownerLastName: nameParts.slice(1).join(" ") || "",
          email: data.email || "",
          phone: data.phone || prev.phone,
        }))
        if (data.logo_url) setLogoUrl(data.logo_url)
        if (data.notifications) {
          setNotifications((prev) => ({ ...prev, ...data.notifications }))
        }
      })
      .catch(() => {})
  }, [])

  // Billing tab
  const [billingHistory] = useState([
    { date: "01/03/2026", amount: "R$ 149,00", status: "paid" },
    { date: "01/02/2026", amount: "R$ 149,00", status: "paid" },
    { date: "01/01/2026", amount: "R$ 149,00", status: "paid" },
  ])

  // Notifications tab
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    appointmentReminder24h: true,
    appointmentReminder1h: true,
    paymentReminders: true,
    weeklyReports: false,
    autoCharge: false,
  })

  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notifSaveSuccess, setNotifSaveSuccess] = useState(false)

  // Security tab
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    try {
      const fullName = `${profileData.ownerFirstName} ${profileData.ownerLastName}`.trim()
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          clinic_name: profileData.clinicName,
          specialty: profileData.specialty,
          phone: profileData.phone,
          address: `${profileData.street}, ${profileData.neighborhood}, ${profileData.city} - ${profileData.state}, ${profileData.cep}`.trim(),
        }),
      })
      // Reload page to update header/sidebar with new data
      sessionStorage.removeItem("user_role")
      setSaveSuccess(true)
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess(false)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("As senhas não coincidem")
      return
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordData.newPassword }),
      })
      if (res.ok) {
        setPasswordSuccess(true)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => setPasswordSuccess(false), 3000)
      } else {
        const data = await res.json()
        setPasswordError(data.error || "Erro ao atualizar senha")
      }
    } catch {
      setPasswordError("Erro ao atualizar senha")
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSavingNotifications(true)
    setNotifSaveSuccess(false)
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
      })
      setNotifSaveSuccess(true)
      setTimeout(() => setNotifSaveSuccess(false), 3000)
    } catch {
      // ignore
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1048576) {
      alert("Arquivo muito grande. Máximo 1MB.")
      return
    }
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/me/logo", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok && data.logo_url) {
        setLogoUrl(data.logo_url + "?t=" + Date.now())
        sessionStorage.removeItem("user_role")
        setTimeout(() => window.location.reload(), 500)
      }
    } catch {
      // ignore
    } finally {
      setUploadingLogo(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  }

  return (
    <CRMLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as configurações da sua clínica
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full h-12 bg-muted/50">
            <TabsTrigger value="profile" className="flex-1 gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
<TabsTrigger value="billing" className="flex-1 gap-2">
              <CreditCard className="h-4 w-4" />
              Assinatura
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* PERFIL */}
          <TabsContent value="profile">
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Informações do Perfil</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Atualize os dados da clínica e do responsável
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Photo */}
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-border">
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <Avatar className="h-16 w-16 bg-muted">
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById("logo-upload")?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {uploadingLogo ? "Enviando..." : logoUrl ? "Trocar Logo" : "Alterar Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG ou SVG. Máximo 1MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Clinic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Nome da Clínica</Label>
                    <Input
                      id="clinicName"
                      value={profileData.clinicName}
                      onChange={(e) => setProfileData({ ...profileData, clinicName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFirstName">Nome do Responsável</Label>
                    <Input
                      id="ownerFirstName"
                      value={profileData.ownerFirstName}
                      onChange={(e) => setProfileData({ ...profileData, ownerFirstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerLastName">Sobrenome</Label>
                    <Input
                      id="ownerLastName"
                      value={profileData.ownerLastName}
                      onChange={(e) => setProfileData({ ...profileData, ownerLastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crefito">CREFITO</Label>
                  <Input
                    id="crefito"
                    value={profileData.crefito}
                    onChange={(e) => setProfileData({ ...profileData, crefito: e.target.value })}
                  />
                </div>

                <Separator />

                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Endereço da Clínica
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={profileData.street}
                      onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={profileData.cep}
                      onChange={(e) => setProfileData({ ...profileData, cep: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={profileData.neighborhood}
                      onChange={(e) => setProfileData({ ...profileData, neighborhood: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : saveSuccess ? "Salvo!" : "Salvar Alterações"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* EQUIPE */}

          {/* ASSINATURA */}
          <TabsContent value="billing">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold">Plano Atual</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Seu plano de assinatura atual
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plano</span>
                    <Badge className="bg-primary text-primary-foreground">Profissional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor</span>
                    <span className="text-sm font-semibold">R$ 149,00/mês</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Usuários</span>
                    <span className="text-sm font-semibold">4 de 10</span>
                  </div>
                </div>

                <Button className="w-full mt-6">
                  Upgrade do Plano
                </Button>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold">Método de Pagamento</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Gerencie sua forma de pagamento
                </p>

                <div className="flex items-center gap-3 p-3 border rounded-lg mb-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">**** **** **** 4242</p>
                    <p className="text-xs text-muted-foreground">Expira 12/27</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Alterar Método de Pagamento
                </Button>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-lg font-semibold">Histórico de Faturas</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Baixe suas faturas anteriores
              </p>

              <div className="border rounded-lg">
                <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider rounded-t-lg">
                  <div>Data</div>
                  <div>Valor</div>
                  <div>Status</div>
                  <div>Fatura</div>
                </div>

                {billingHistory.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 items-center border-t">
                    <span className="text-sm text-primary font-medium">{item.date}</span>
                    <span className="text-sm">{item.amount}</span>
                    <div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Pago
                      </Badge>
                    </div>
                    <button className="text-sm text-primary hover:underline text-left">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* NOTIFICAÇÕES */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Preferências de Notificação</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Escolha como deseja receber notificações
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Comunicação</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Notificações por E-mail</p>
                        <p className="text-xs text-muted-foreground">Receba notificações por e-mail</p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Notificações por SMS</p>
                        <p className="text-xs text-muted-foreground">Receba notificações por SMS</p>
                      </div>
                      <Switch
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, smsNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Notificações no App</p>
                        <p className="text-xs text-muted-foreground">Mostrar notificações no sistema</p>
                      </div>
                      <Switch
                        checked={notifications.inAppNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, inAppNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-4">Lembretes de Consulta</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Lembrete 24h antes</p>
                        <p className="text-xs text-muted-foreground">Envio automático via WhatsApp</p>
                      </div>
                      <Switch
                        checked={notifications.appointmentReminder24h}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, appointmentReminder24h: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Lembrete 1h antes</p>
                        <p className="text-xs text-muted-foreground">Confirmação final da consulta</p>
                      </div>
                      <Switch
                        checked={notifications.appointmentReminder1h}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, appointmentReminder1h: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Lembretes de Pagamento</p>
                        <p className="text-xs text-muted-foreground">Notificar sobre pagamentos pendentes</p>
                      </div>
                      <Switch
                        checked={notifications.paymentReminders}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, paymentReminders: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-4">Relatórios</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Relatório Semanal</p>
                        <p className="text-xs text-muted-foreground">Resumo semanal do desempenho da clínica</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, weeklyReports: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Cobrança Automática</p>
                        <p className="text-xs text-muted-foreground">Cobrar automaticamente pagamentos vencidos</p>
                      </div>
                      <Switch
                        checked={notifications.autoCharge}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, autoCharge: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
                  {savingNotifications ? "Salvando..." : "Salvar Preferências"}
                </Button>
                {notifSaveSuccess && (
                  <span className="text-sm text-emerald-600 font-medium">✓ Preferências salvas!</span>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* SEGURANÇA */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold">Senha</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Atualize sua senha para manter sua conta segura
                </p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  {passwordSuccess && (
                    <p className="text-sm text-emerald-600 font-medium">✓ Senha atualizada com sucesso!</p>
                  )}
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? "Atualizando..." : "Atualizar Senha"}
                  </Button>
                </form>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold">Autenticação em Dois Fatores</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Adicione uma camada extra de segurança à sua conta
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">App Autenticador</p>
                      <p className="text-xs text-muted-foreground">
                        Use um app autenticador para gerar códigos
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Configurar</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Verificação por SMS</p>
                      <p className="text-xs text-muted-foreground">
                        Receba códigos de verificação por SMS
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Configurar</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold">Sessões Ativas</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Gerencie suas sessões ativas em outros dispositivos
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Sessão Atual</p>
                      <p className="text-xs text-muted-foreground">
                        Chrome no Windows - São Paulo, SP
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Ativa
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">App Celular</p>
                      <p className="text-xs text-muted-foreground">
                        iPhone - Último acesso há 2 horas
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Revogar</Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CRMLayout>
  )
}

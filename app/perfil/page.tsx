"use client"

import { useState, useEffect } from "react"
import { CRMLayout } from "@/components/crm/crm-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Building2, Camera, Check } from "lucide-react"

export default function PerfilPage() {
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)

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
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
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
      sessionStorage.removeItem("user_role")
      setSaveSuccess(true)
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
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

  return (
    <CRMLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Atualize os dados da clínica e do responsável
          </p>
        </div>

        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
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
                  id="logo-upload-perfil"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => document.getElementById("logo-upload-perfil")?.click()}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? "Salvando..." : saveSuccess ? (
                <><Check className="h-4 w-4" /> Salvo!</>
              ) : "Salvar Alterações"}
            </Button>
          </form>
        </Card>
      </div>
    </CRMLayout>
  )
}

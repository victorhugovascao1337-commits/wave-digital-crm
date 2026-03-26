import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const meta = user.user_metadata || {}

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: meta.full_name || "",
    role: meta.role || "user",
    clinic_id: meta.clinic_id || null,
    clinic_type: meta.clinic_type || "fisioterapia",
    clinic_name: meta.clinic_name || "",
    specialty: meta.specialty || "",
    phone: meta.phone || "",
    address: meta.address || "",
    logo_url: meta.logo_url || "",
    notifications: meta.notifications || null,
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const currentMeta = user.user_metadata || {}

  // Merge new fields into existing metadata
  const updatedMeta = {
    ...currentMeta,
    ...body,
  }

  const { error } = await supabase.auth.updateUser({
    data: updatedMeta,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

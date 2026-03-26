import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { clinic_id } = await request.json()

    if (!clinic_id) {
      return NextResponse.json({ error: "clinic_id required" }, { status: 400 })
    }

    // Get clinic info
    const supabase = await createClient()
    const { data: clinic } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinic_id)
      .single()

    if (!clinic || !clinic.admin_user_id) {
      return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 })
    }

    // Generate a magic link for the clinic admin user
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "magiclink",
        email: clinic.admin_email,
        options: {
          redirect_to: `${request.headers.get("origin") || "http://localhost:3000"}/`,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.msg || "Erro ao gerar link" }, { status: 500 })
    }

    // Use the token from the generated link to create a session
    // The properties object contains the hashed_token and action_link
    const actionLink = data.properties?.action_link

    if (actionLink) {
      // Extract the token from the action link and set session cookie
      return NextResponse.json({ redirect: actionLink })
    }

    return NextResponse.json({ error: "Não foi possível gerar link de acesso" }, { status: 500 })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

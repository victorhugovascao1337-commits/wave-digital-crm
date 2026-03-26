import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  // Auth check with user session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (file.size > 1048576) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 1MB." }, { status: 400 })
  }

  // Use admin client to bypass RLS
  const admin = createAdminClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const ext = file.name.split(".").pop() || "png"
  const fileName = `${user.id}/logo.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await admin.storage
    .from("clinic-logos")
    .upload(fileName, buffer, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/clinic-logos/${fileName}`

  // Save logo URL in user metadata via admin
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, logo_url: logoUrl },
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ logo_url: logoUrl })
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from("patient_documents")
    .select("*")
    .eq("patient_id", id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const formData = await request.formData()
  const file = formData.get("file") as File
  const uploadedBy = formData.get("uploaded_by") as string || "Usuário"

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  // Upload to Supabase Storage
  const fileName = `${id}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from("patient-documents")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("patient-documents")
    .getPublicUrl(fileName)

  // Save document record
  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      patient_id: id,
      name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const docId = searchParams.get("docId")

  if (!docId) {
    return NextResponse.json({ error: "docId is required" }, { status: 400 })
  }

  // Get document to find file path
  const { data: doc } = await supabase
    .from("patient_documents")
    .select("file_url")
    .eq("id", docId)
    .eq("patient_id", id)
    .single()

  if (doc?.file_url) {
    const path = doc.file_url.split("/patient-documents/")[1]
    if (path) {
      await supabase.storage.from("patient-documents").remove([path])
    }
  }

  const { error } = await supabase
    .from("patient_documents")
    .delete()
    .eq("id", docId)
    .eq("patient_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

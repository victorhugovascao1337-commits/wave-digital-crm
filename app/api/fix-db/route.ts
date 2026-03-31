import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Probe which status values the DB constraint allows
// Uses service role to bypass RLS

const TEST_STATUSES = [
  "PENDENTE", "CONFIRMADO", "CONCLUÍDO", "FALTOU", "CANCELADO",
  "CHEGOU", "EM ATENDIMENTO", "BLOQUEADO",
]

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 })
  }

  const supabase = createClient(url, key)

  // Step 1: Get a real appointment to use as test subject
  const { data: appt, error: fetchErr } = await supabase
    .from("appointments")
    .select("id, status")
    .limit(1)
    .single()

  if (fetchErr || !appt) {
    return NextResponse.json({
      error: "Não encontrou agendamento para testar",
      detail: fetchErr?.message,
    }, { status: 500 })
  }

  const originalStatus = appt.status
  const results: Record<string, string> = {}

  // Step 2: Try each status
  for (const testStatus of TEST_STATUSES) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: testStatus })
      .eq("id", appt.id)

    results[testStatus] = error ? `❌ ${error.message?.substring(0, 80)}` : "✅ OK"
  }

  // Step 3: Restore original status
  await supabase
    .from("appointments")
    .update({ status: originalStatus })
    .eq("id", appt.id)

  const allowed = Object.entries(results).filter(([, v]) => v.includes("OK")).map(([k]) => k)
  const blocked = Object.entries(results).filter(([, v]) => v.includes("❌")).map(([k]) => k)

  return NextResponse.json({
    message: "Resultado do teste de status",
    originalStatus,
    appointmentId: appt.id,
    results,
    summary: {
      allowed,
      blocked,
    },
    fix: blocked.length > 0
      ? "Status bloqueados pela constraint. Execute este SQL no Supabase SQL Editor do projeto fizhhazqanagnfkqsgtu: ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));"
      : "✅ Todos os status estão funcionando!",
  })
}

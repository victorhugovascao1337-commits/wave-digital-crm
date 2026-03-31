import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// ONE-TIME endpoint to fix the appointments CHECK constraint
// After running once successfully, this file can be deleted
export async function POST() {
  try {
    const supabase = await createClient()

    // Drop old constraint and add new one with ALL Portuguese status values
    const { error: dropError } = await supabase.rpc("exec_sql", {
      query: `ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check`
    })

    // If rpc doesn't exist, try direct SQL via REST
    if (dropError) {
      console.log("rpc exec_sql not available, trying direct approach...")

      // Try using the Supabase SQL execution through the admin API
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({
          error: "SUPABASE_SERVICE_ROLE_KEY não configurada. Execute o SQL manualmente no Supabase Dashboard.",
          sql: `ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));`
        }, { status: 500 })
      }

      // Use Supabase REST API to execute SQL
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          query: `
            ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
            ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
              CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));
          `
        }),
      })

      if (!res.ok) {
        return NextResponse.json({
          error: "Não foi possível executar SQL automaticamente. Execute manualmente no Supabase Dashboard → SQL Editor.",
          sql: `ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;\nALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));`
        }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Constraint atualizada com sucesso via REST API" })
    }

    // If rpc worked for drop, now add the new constraint
    const { error: addError } = await supabase.rpc("exec_sql", {
      query: `ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'))`
    })

    if (addError) {
      return NextResponse.json({ error: addError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Constraint atualizada com sucesso!" })
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || "Erro interno",
      sql: `ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;\nALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));`
    }, { status: 500 })
  }
}

// GET for easy browser access
export async function GET() {
  return NextResponse.json({
    message: "Execute um POST neste endpoint para corrigir a constraint do banco, OU copie o SQL abaixo e execute no Supabase Dashboard → SQL Editor",
    sql: `ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;\nALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));`
  })
}

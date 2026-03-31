import { NextResponse } from "next/server"

// ONE-TIME endpoint to fix the appointments CHECK constraint
// Deploy, access once via browser, then delete this file

const ALTER_SQL = `
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
  END IF;

  -- Add new constraint with ALL status values
  ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN (
      'PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO',
      'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'
    ));
END $$;
`

async function tryDirectPostgres(): Promise<{ success: boolean; method?: string; error?: string }> {
  // Try POSTGRES_URL, DATABASE_URL, or construct from individual vars
  const connString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    null

  if (connString) {
    try {
      // Dynamic import - pg may or may not be available
      const { Pool } = await import("pg")
      const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })
      await pool.query(ALTER_SQL)
      await pool.end()
      return { success: true, method: "pg direct connection" }
    } catch (e: any) {
      return { success: false, error: `pg connection failed: ${e.message}` }
    }
  }
  return { success: false, error: "No POSTGRES_URL or DATABASE_URL found" }
}

async function trySupabaseHttp(): Promise<{ success: boolean; method?: string; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }
  }

  // Try the Supabase SQL endpoint (available in newer Supabase versions)
  const endpoints = [
    `${supabaseUrl}/rest/v1/rpc/exec_sql`,
    `${supabaseUrl}/pg/query`,
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: ALTER_SQL }),
      })
      if (res.ok) {
        return { success: true, method: `HTTP ${endpoint}` }
      }
    } catch {
      continue
    }
  }

  return { success: false, error: "No HTTP SQL endpoint available" }
}

export async function GET() {
  // Step 1: Report what env vars are available (names only, no values)
  const envCheck = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DB_URL: !!process.env.SUPABASE_DB_URL,
    POSTGRES_HOST: !!process.env.POSTGRES_HOST,
    POSTGRES_PASSWORD: !!process.env.POSTGRES_PASSWORD,
  }

  // Step 2: Try direct PostgreSQL connection
  const pgResult = await tryDirectPostgres()
  if (pgResult.success) {
    return NextResponse.json({
      success: true,
      message: "✅ Constraint corrigida com sucesso!",
      method: pgResult.method,
      envCheck,
    })
  }

  // Step 3: Try Supabase HTTP endpoints
  const httpResult = await trySupabaseHttp()
  if (httpResult.success) {
    return NextResponse.json({
      success: true,
      message: "✅ Constraint corrigida com sucesso!",
      method: httpResult.method,
      envCheck,
    })
  }

  // Step 4: If nothing worked, construct connection string from parts
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_PASSWORD) {
    try {
      const host = process.env.POSTGRES_HOST
      const password = process.env.POSTGRES_PASSWORD
      const user = process.env.POSTGRES_USER || "postgres"
      const database = process.env.POSTGRES_DATABASE || "postgres"
      const port = process.env.POSTGRES_PORT || "5432"
      const connStr = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`

      const { Pool } = await import("pg")
      const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
      await pool.query(ALTER_SQL)
      await pool.end()

      return NextResponse.json({
        success: true,
        message: "✅ Constraint corrigida com sucesso!",
        method: "pg from individual env vars",
        envCheck,
      })
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        message: "❌ Não consegui corrigir automaticamente",
        errors: [pgResult.error, httpResult.error, `Individual vars: ${e.message}`],
        envCheck,
        manualFix: "Peça ao dono do projeto Supabase (fizhhazqanagnfkqsgtu) para rodar este SQL no SQL Editor:",
        sql: "ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));",
      }, { status: 500 })
    }
  }

  // Nothing worked
  return NextResponse.json({
    success: false,
    message: "❌ Não consegui corrigir automaticamente. Nenhuma conexão direta ao PostgreSQL disponível.",
    errors: [pgResult.error, httpResult.error],
    envCheck,
    manualFix: "Peça ao dono do projeto Supabase (fizhhazqanagnfkqsgtu) para rodar este SQL no SQL Editor:",
    sql: "ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));",
  }, { status: 500 })
}

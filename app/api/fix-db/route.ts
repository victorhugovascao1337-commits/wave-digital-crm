import { NextResponse } from "next/server"

// ONE-TIME endpoint to fix the appointments CHECK constraint
// Deploy, access via browser GET, then delete this file

const ALTER_SQL = `
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
  END IF;
  ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN (
      'PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO',
      'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'
    ));
END $$;
`

// Extract project ref from Supabase URL
function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match ? match[1] : null
}

// Method 1: Direct PostgreSQL via env vars
async function tryDirectPostgres(): Promise<{ success: boolean; method?: string; error?: string }> {
  const connString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    null

  if (!connString) return { success: false, error: "No POSTGRES_URL env var" }

  try {
    const { Pool } = await import("pg")
    const pool = new Pool({ connectionString: connString, ssl: { rejectUnauthorized: false } })
    await pool.query(ALTER_SQL)
    await pool.end()
    return { success: true, method: "direct_postgres" }
  } catch (e: any) {
    return { success: false, error: `pg: ${e.message}` }
  }
}

// Method 2: Connect via Supabase Pooler using JWT auth (service_role as password)
async function tryPoolerJwt(): Promise<{ success: boolean; method?: string; error?: string }> {
  const ref = getProjectRef()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ref || !serviceKey) return { success: false, error: "Missing ref or service key" }

  // Try multiple pooler regions and ports
  const regions = ["us-east-1", "sa-east-1", "us-west-1", "eu-west-1", "ap-southeast-1"]
  const configs = [
    // Transaction mode (port 6543)
    ...regions.map(r => ({ host: `aws-0-${r}.pooler.supabase.com`, port: 6543 })),
    // Session mode (port 5432)
    ...regions.map(r => ({ host: `aws-0-${r}.pooler.supabase.com`, port: 5432 })),
    // Direct connection
    { host: `db.${ref}.supabase.co`, port: 5432 },
  ]

  const errors: string[] = []

  for (const { host, port } of configs) {
    try {
      const connStr = `postgresql://postgres.${ref}:${encodeURIComponent(serviceKey)}@${host}:${port}/postgres?sslmode=require`
      const { Pool } = await import("pg")
      const pool = new Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      })
      await pool.query(ALTER_SQL)
      await pool.end()
      return { success: true, method: `pooler_jwt ${host}:${port}` }
    } catch (e: any) {
      errors.push(`${host}:${port} → ${e.message?.substring(0, 80)}`)
    }
  }

  return { success: false, error: `Pooler JWT failed: ${errors.join(" | ")}` }
}

// Method 3: Supabase HTTP SQL endpoints
async function tryHttpSql(): Promise<{ success: boolean; method?: string; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return { success: false, error: "Missing URL or key" }

  const endpoints = [
    { url: `${supabaseUrl}/pg/query`, body: { query: ALTER_SQL } },
    { url: `${supabaseUrl}/rest/v1/rpc/exec_sql`, body: { query: ALTER_SQL } },
    { url: `${supabaseUrl}/rest/v1/rpc/execute_sql`, body: { sql: ALTER_SQL } },
  ]

  for (const { url, body } of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(body),
      })
      if (res.ok) return { success: true, method: `http ${url}` }
    } catch {
      continue
    }
  }

  return { success: false, error: "No HTTP SQL endpoint available" }
}

export async function GET() {
  const envCheck = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    projectRef: getProjectRef(),
  }

  const results: Record<string, any> = {}

  // Try Method 1: Direct PostgreSQL
  const pg = await tryDirectPostgres()
  results.directPostgres = pg
  if (pg.success) {
    return NextResponse.json({ success: true, message: "✅ Constraint corrigida!", method: pg.method, envCheck })
  }

  // Try Method 2: Pooler with JWT auth
  const pooler = await tryPoolerJwt()
  results.poolerJwt = pooler
  if (pooler.success) {
    return NextResponse.json({ success: true, message: "✅ Constraint corrigida!", method: pooler.method, envCheck })
  }

  // Try Method 3: HTTP SQL endpoints
  const http = await tryHttpSql()
  results.httpSql = http
  if (http.success) {
    return NextResponse.json({ success: true, message: "✅ Constraint corrigida!", method: http.method, envCheck })
  }

  return NextResponse.json({
    success: false,
    message: "❌ Nenhum método funcionou. Veja os erros abaixo.",
    results,
    envCheck,
    sql: "ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));",
  }, { status: 500 })
}

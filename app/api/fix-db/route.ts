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

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match ? match[1] : null
}

async function tryPoolerJwt(): Promise<{ success: boolean; method?: string; error?: string }> {
  const ref = getProjectRef()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ref || !serviceKey) return { success: false, error: "Missing ref or service key" }

  // Disable TLS verification for this request (Supabase pooler uses self-signed certs)
  const originalTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

  const regions = ["us-east-1", "sa-east-1", "us-west-1", "eu-west-1"]
  const configs = [
    // Session mode (port 5432) - needed for DDL/DO blocks
    ...regions.map(r => ({ host: `aws-0-${r}.pooler.supabase.com`, port: 5432 })),
    // Transaction mode (port 6543)
    ...regions.map(r => ({ host: `aws-0-${r}.pooler.supabase.com`, port: 6543 })),
  ]

  const errors: string[] = []

  try {
    const { Pool } = await import("pg")

    for (const { host, port } of configs) {
      try {
        const pool = new Pool({
          host,
          port,
          database: "postgres",
          user: `postgres.${ref}`,
          password: serviceKey,
          ssl: false,
          connectionTimeoutMillis: 8000,
        })
        await pool.query(ALTER_SQL)
        await pool.end()
        return { success: true, method: `pooler ${host}:${port}` }
      } catch (e: any) {
        errors.push(`${host}:${port} → ${e.message?.substring(0, 100)}`)
        continue
      }
    }

    // Also try with ssl but rejectUnauthorized false
    for (const { host, port } of configs.slice(0, 4)) {
      try {
        const pool = new Pool({
          host,
          port,
          database: "postgres",
          user: `postgres.${ref}`,
          password: serviceKey,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 8000,
        })
        await pool.query(ALTER_SQL)
        await pool.end()
        return { success: true, method: `pooler-ssl ${host}:${port}` }
      } catch (e: any) {
        errors.push(`ssl ${host}:${port} → ${e.message?.substring(0, 100)}`)
        continue
      }
    }
  } finally {
    // Restore original TLS setting
    if (originalTls === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalTls
    }
  }

  return { success: false, error: errors.join(" | ") }
}

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    projectRef: getProjectRef(),
  }

  const result = await tryPoolerJwt()

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: "✅ Constraint corrigida com sucesso! Agora os status CHEGOU, EM ATENDIMENTO e BLOQUEADO vão funcionar.",
      method: result.method,
      envCheck,
    })
  }

  return NextResponse.json({
    success: false,
    message: "❌ Não funcionou. Detalhes dos erros abaixo.",
    error: result.error,
    envCheck,
    sql: "ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCLUÍDO', 'FALTOU', 'CANCELADO', 'CHEGOU', 'EM ATENDIMENTO', 'BLOQUEADO'));",
  }, { status: 500 })
}

import { createClient } from "@/lib/supabase/server"

export async function getClinicId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return user.user_metadata?.clinic_id || null
}

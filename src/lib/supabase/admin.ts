import { createClient } from '@supabase/supabase-js'

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getUserFromRequest(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = getAdminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzrczhneqneovwkjbkxx.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6cmN6aG5lcW5lb3Z3a2pia3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODY0MDQsImV4cCI6MjA5ODc2MjQwNH0.7k6YU3BMOWANODc9BFFbYkJ0hLg5oTvblloN1fZgPw4'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _client
}

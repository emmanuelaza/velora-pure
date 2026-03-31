import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase URL or Anon Key not found. Make sure you have a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)

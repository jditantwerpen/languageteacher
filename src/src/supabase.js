// Single shared Supabase client for the whole app.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Fail loudly in development instead of showing a blank screen
  throw new Error('VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY ontbreken (zie .env.example).')
}

export const supabase = createClient(url, anonKey)

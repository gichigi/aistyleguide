import { createClient } from '@supabase/supabase-js'

// Admin Supabase client for server-side operations (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase admin environment variables')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxktjvjfacbvbruxwgeh.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4a3RqdmpmYWNidmJydXh3Z2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDE5NzQsImV4cCI6MjA2OTIxNzk3NH0.TD9Qsg73INowWmgo9kadVN2aBJ8Ft2dGjhEfURvdtfE'

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Email capture types
export interface EmailCapture {
  id?: string
  session_token: string
  email: string
  captured_at?: string
  payment_completed: boolean
  abandoned_email_sent?: boolean
} 
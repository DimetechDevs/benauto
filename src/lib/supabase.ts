import { createClient } from '@supabase/supabase-js'

// These two values are public by design: the database's row-level security
// rules decide what each visitor can read or change.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', key ?? 'placeholder', {
  auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true },
})

export const PHOTO_BUCKET = 'vehicle-photos'

export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

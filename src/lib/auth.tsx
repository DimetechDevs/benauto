import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface StaffInfo { full_name: string; is_admin: boolean }
interface Ctx {
  session: Session | null
  staff: StaffInfo | null
  loading: boolean
  signOut: () => Promise<void>
}
const AuthContext = createContext<Ctx>({ session: null, staff: null, loading: true, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [staff, setStaff] = useState<StaffInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async (s: Session | null) => {
      setSession(s)
      if (!s) { setStaff(null); setLoading(false); return }
      const { data } = await supabase.from('staff').select('full_name, is_admin').eq('user_id', s.user.id).maybeSingle()
      if (active) { setStaff(data ?? null); setLoading(false) }
    }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer so we never call Supabase inside its own auth callback.
      setTimeout(() => { void load(s) }, 0)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const signOut = async () => { await supabase.auth.signOut() }
  return <AuthContext.Provider value={{ session, staff, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

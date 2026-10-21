import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchSettings } from './api'
import { isConfigured } from './supabase'
import type { DealershipSettings } from './types'

// Shown until the real settings load, or if the database is unreachable.
export const DEFAULT_SETTINGS: DealershipSettings = {
  id: 1,
  name: 'Benauto',
  tagline: 'Quality used cars in Zimbabwe',
  phone: null,
  whatsapp: null,
  email: null,
  address: 'Harare, Zimbabwe',
  map_url: null,
  opening_hours: {},
  zig_per_usd: null,
}

interface Ctx { settings: DealershipSettings; reload: () => Promise<void> }
const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, reload: async () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const reload = async () => {
    if (!isConfigured) return
    try {
      const s = await fetchSettings()
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s, opening_hours: s.opening_hours ?? {} })
    } catch (e) {
      console.error('Could not load dealership settings', e)
    }
  }
  useEffect(() => { void reload() }, [])
  return <SettingsContext.Provider value={{ settings, reload }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)

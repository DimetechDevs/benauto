import { useEffect } from 'react'
import { useSettings } from './settings'

export function useDocumentTitle(title?: string) {
  const { settings } = useSettings()
  useEffect(() => {
    document.title = title ? `${title} | ${settings.name}` : `${settings.name} | ${settings.tagline ?? 'Quality used cars in Zimbabwe'}`
  }, [title, settings.name, settings.tagline])
}

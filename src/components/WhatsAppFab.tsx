import { useSettings } from '../lib/settings'
import { whatsappLink } from '../lib/format'
import { WhatsAppIcon } from './Icons'

export default function WhatsAppFab() {
  const { settings } = useSettings()
  const href = whatsappLink(settings.whatsapp, `Hi ${settings.name}, I'm looking at your website and have a question.`)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-wa text-white shadow-lg shadow-green-900/20 transition hover:scale-105"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  )
}

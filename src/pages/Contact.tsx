import LeadForm from '../components/LeadForm'
import { useSettings } from '../lib/settings'
import { orderedHours, telLink, whatsappLink } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from '../components/Icons'

export default function Contact() {
  useDocumentTitle('Contact us')
  const { settings } = useSettings()
  const wa = whatsappLink(settings.whatsapp, `Hi ${settings.name}, I have a question.`)
  const hours = orderedHours(settings.opening_hours)
  const mapQuery = settings.address ? `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed` : null
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Contact us</h1>
      <p className="mt-2 text-lg text-neutral-600">The quickest way to reach us is WhatsApp. You are also welcome to visit the yard.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card divide-y divide-neutral-100">
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 hover:bg-neutral-50"><span className="grid h-11 w-11 place-items-center rounded-md bg-neutral-100 text-ink"><WhatsAppIcon /></span><div><p className="font-bold text-ink">WhatsApp</p><p className="text-sm text-neutral-600">Chat with our sales team</p></div></a>}
            {settings.phone && <a href={telLink(settings.phone)!} className="flex items-center gap-4 p-5 hover:bg-neutral-50"><span className="grid h-11 w-11 place-items-center rounded-md bg-neutral-100 text-ink"><PhoneIcon /></span><div><p className="font-bold text-ink">Call</p><p className="text-sm text-neutral-600">{settings.phone}</p></div></a>}
            {settings.email && <a href={`mailto:${settings.email}`} className="flex items-center gap-4 p-5 hover:bg-neutral-50"><span className="grid h-11 w-11 place-items-center rounded-md bg-neutral-100 text-ink"><MailIcon /></span><div><p className="font-bold text-ink">Email</p><p className="text-sm text-neutral-600">{settings.email}</p></div></a>}
            {settings.address && <div className="flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-md bg-neutral-100 text-ink"><PinIcon /></span><div><p className="font-bold text-ink">Visit</p><p className="text-sm text-neutral-600">{settings.address}</p></div></div>}
            {hours.length > 0 && (
              <div className="flex gap-4 p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-neutral-100 text-ink"><ClockIcon /></span>
                <ul className="flex-1 space-y-1 text-sm">{hours.map(([d, h]) => <li key={d} className="flex justify-between gap-4"><span className="font-medium text-ink">{d}</span><span className="text-neutral-600">{h}</span></li>)}</ul>
              </div>
            )}
          </div>
          {(settings.map_url || mapQuery) && (
            <iframe title="Map" src={settings.map_url || mapQuery!} className="h-72 w-full rounded-lg border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="mb-5 text-xl font-bold text-ink">Send us a message</h2>
          <LeadForm type="inquiry" submitLabel="Send message" />
        </div>
      </div>
    </div>
  )
}

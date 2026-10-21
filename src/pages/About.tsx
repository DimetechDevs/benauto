import { Link } from 'react-router-dom'
import { useSettings } from '../lib/settings'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function About() {
  useDocumentTitle('About us')
  const { settings } = useSettings()
  return (
    <div className="container-x py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">About {settings.name}</h1>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-700">
          <p>{settings.name} is a car dealership in Zimbabwe offering quality used and recently imported vehicles, from fuel-saving hatchbacks to hard-working double cabs.</p>
          <p>We list every car with clear USD pricing, real photos and its duty status, so you know exactly what you are buying. Our team can help with finance, trade-ins and paperwork, and we are always one WhatsApp message away.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/inventory" className="btn-primary">See our stock</Link>
          <Link to="/contact" className="btn-outline">Visit us</Link>
        </div>
      </div>
    </div>
  )
}

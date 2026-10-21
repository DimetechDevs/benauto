import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl font-bold text-ink">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">We could not find that page</h1>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  )
}

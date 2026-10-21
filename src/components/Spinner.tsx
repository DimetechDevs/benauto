export default function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-neutral-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-brand" />
      <span className="text-sm">{label}…</span>
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center">
      <p className="font-semibold text-neutral-800">Something went wrong</p>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>
      {onRetry && <button className="btn-outline mt-4" onClick={onRetry}>Try again</button>}
    </div>
  )
}

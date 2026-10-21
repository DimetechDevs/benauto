/** Supabase errors are not always `Error` instances, so read `.message` defensively. */
export function errMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') return (e as { message: string }).message
  return typeof e === 'string' ? e : fallback
}

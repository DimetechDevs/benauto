import { useState, type FormEvent, type ReactNode } from 'react'
import { errMessage } from '../lib/errors'
import { submitLead } from '../lib/api'
import type { LeadType } from '../lib/types'
import { CheckIcon } from './Icons'

interface Props {
  type: LeadType
  vehicleId?: string | null
  defaultMessage?: string
  submitLabel?: string
  /** Extra fields; their values are collected into `details` by input name. */
  extra?: ReactNode
  showDate?: boolean
  showMessage?: boolean
  successText?: string
  compact?: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

export default function LeadForm({
  type, vehicleId = null, defaultMessage = '', submitLabel = 'Send', extra, showDate = false,
  showMessage = true, successText = 'Thanks! We will get back to you shortly, usually on WhatsApp.', compact = false,
}: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    if (fd.get('company')) { setState('done'); return } // honeypot: bots fill hidden fields

    const details: Record<string, unknown> = {}
    for (const [k, v] of fd.entries()) {
      if (k.startsWith('d_') && typeof v === 'string' && v.trim()) {
        const key = k.slice(2)
        details[key] = /(_usd|_km|year|months)$/.test(key) && !isNaN(Number(v)) ? Number(v) : v.trim()
      }
    }
    const phone = String(fd.get('phone') ?? '').trim()
    if (phone.replace(/\D/g, '').length < 7) { setError('Please enter a valid phone number.'); return }

    setState('sending'); setError(null)
    try {
      await submitLead({
        type,
        vehicle_id: vehicleId,
        full_name: String(fd.get('full_name') ?? '').trim(),
        phone,
        email: String(fd.get('email') ?? ''),
        prefers_whatsapp: fd.get('prefers_whatsapp') === 'on',
        message: String(fd.get('message') ?? ''),
        preferred_date: (fd.get('preferred_date') as string) || null,
        preferred_time: (fd.get('preferred_time') as string) || null,
        details,
      })
      setState('done')
      form.reset()
    } catch (err) {
      setState('idle')
      const msg = errMessage(err)
      setError(msg.includes('Too many') ? msg : 'Sorry, we could not send that. Please try again or contact us on WhatsApp.')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-emerald-600 text-white"><CheckIcon /></span>
        <p className="mt-3 font-semibold text-emerald-900">Request sent</p>
        <p className="mt-1 text-sm text-emerald-800">{successText}</p>
        <button className="mt-4 text-sm font-medium text-emerald-900 underline" onClick={() => setState('idle')}>Send another</button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <div>
          <label className="label" htmlFor={`${type}-name`}>Full name</label>
          <input id={`${type}-name`} name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`${type}-phone`}>Phone / WhatsApp</label>
          <input id={`${type}-phone`} name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="077 123 4567" maxLength={30} className="input" />
        </div>
        <div className={compact ? '' : 'sm:col-span-2'}>
          <label className="label" htmlFor={`${type}-email`}>Email <span className="font-normal text-slate-400">(optional)</span></label>
          <input id={`${type}-email`} name="email" type="email" autoComplete="email" className="input" />
        </div>
        {showDate && (
          <>
            <div>
              <label className="label" htmlFor={`${type}-date`}>Preferred date</label>
              <input id={`${type}-date`} name="preferred_date" type="date" min={today()} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor={`${type}-time`}>Preferred time</label>
              <select id={`${type}-time`} name="preferred_time" className="input" defaultValue="Morning">
                <option>Morning</option><option>Midday</option><option>Afternoon</option>
              </select>
            </div>
          </>
        )}
      </div>
      {extra}
      {showMessage && (
        <div>
          <label className="label" htmlFor={`${type}-msg`}>Message</label>
          <textarea id={`${type}-msg`} name="message" rows={3} maxLength={2000} defaultValue={defaultMessage} className="input" />
        </div>
      )}
      {/* Honeypot field, hidden from people */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="prefers_whatsapp" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-brand" />
        Contact me on WhatsApp
      </label>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}

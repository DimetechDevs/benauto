import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { errMessage } from '../lib/errors'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PHOTO_BUCKET, photoUrl, supabase } from '../lib/supabase'
import { resizeImage } from '../lib/images'
import { BODY_TYPES, CONDITIONS, DRIVES, DUTY, FUELS, STATUSES, TRANSMISSIONS, slugify } from '../lib/format'
import type { Vehicle, VehicleImage } from '../lib/types'
import Spinner, { ErrorBox } from '../components/Spinner'
import { ChevronLeft, ChevronRight, StarIcon, TrashIcon, UploadIcon } from '../components/Icons'

type Form = Record<string, string | boolean>

const EMPTY: Form = {
  status: 'draft', featured: false, stock_number: '', make: '', model: '', variant: '', year: String(new Date().getFullYear() - 5),
  condition: 'used', body_type: 'sedan', fuel: 'petrol', transmission: 'automatic', drive: '', engine_cc: '', mileage_km: '',
  colour: '', doors: '', seats: '', duty: 'duty_paid', location: 'Harare', price_usd: '', previous_price_usd: '',
  price_negotiable: false, description: '', features: '', vin: '', purchase_cost_usd: '', private_notes: '',
}

const COMMON_FEATURES = ['Air conditioning', 'Power steering', 'Electric windows', 'Central locking', 'Reverse camera', 'Bluetooth', 'Navigation', 'Leather seats', 'Alloy wheels', 'Cruise control', 'Keyless entry', 'Push start', 'Tow bar', 'Canopy', 'Airbags', 'ABS']

interface Pending { key: string; file: File; preview: string }

const str = (v: unknown) => (v == null ? '' : String(v))
const numOrNull = (v: string | boolean) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : null)
const textOrNull = (v: string | boolean) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

function toForm(v: Vehicle, priv?: { vin: string | null; purchase_cost_usd: number | null; notes: string | null } | null): Form {
  return {
    status: v.status, featured: v.featured, stock_number: str(v.stock_number), make: v.make, model: v.model, variant: str(v.variant),
    year: str(v.year), condition: v.condition, body_type: v.body_type, fuel: v.fuel, transmission: v.transmission, drive: str(v.drive),
    engine_cc: str(v.engine_cc), mileage_km: str(v.mileage_km), colour: str(v.colour), doors: str(v.doors), seats: str(v.seats),
    duty: v.duty, location: str(v.location), price_usd: str(v.price_usd), previous_price_usd: str(v.previous_price_usd),
    price_negotiable: v.price_negotiable, description: str(v.description), features: v.features.join('\n'),
    vin: str(priv?.vin), purchase_cost_usd: str(priv?.purchase_cost_usd), private_notes: str(priv?.notes),
  }
}

export default function VehicleEditor() {
  const { id } = useParams()
  const isNew = !id
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(EMPTY)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [images, setImages] = useState<VehicleImage[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [loading, setLoading] = useState(!isNew || !!params.get('from'))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const location = useLocation()
  const arrived = location.state as { saved?: boolean; uploadError?: string | null } | null
  const [error, setError] = useState<string | null>(arrived?.uploadError ?? null)
  const [notice, setNotice] = useState<string | null>(arrived?.saved ? 'Car saved.' : null)
  const dragFrom = useRef<number | null>(null)

  useEffect(() => {
    const sourceId = id ?? params.get('from')
    if (!sourceId) return
    ;(async () => {
      const [{ data: v, error: e1 }, { data: priv }] = await Promise.all([
        supabase.from('vehicles').select('*, vehicle_images(*)').eq('id', sourceId).order('position', { referencedTable: 'vehicle_images' }).maybeSingle(),
        supabase.from('vehicle_private').select('*').eq('vehicle_id', sourceId).maybeSingle(),
      ])
      if (e1 || !v) { setError(e1?.message ?? 'Car not found'); setLoading(false); return }
      const veh = v as Vehicle
      if (isNew) {
        // Duplicating: copy details, but not photos, stock number or private details.
        setForm({ ...toForm(veh), status: 'draft', stock_number: '', featured: false, vin: '', purchase_cost_usd: '', private_notes: '' })
      } else {
        setVehicle(veh)
        setImages(veh.vehicle_images ?? [])
        setForm(toForm(veh, priv))
      }
      setLoading(false)
    })()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => pending.forEach((p) => URL.revokeObjectURL(p.preview)), []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  async function uploadFiles(vehicleId: string, files: File[], startPos: number) {
    const added: VehicleImage[] = []
    for (let i = 0; i < files.length; i++) {
      setUploading(`Uploading photo ${i + 1} of ${files.length}…`)
      const file = files[i]
      const [full, thumb] = await Promise.all([resizeImage(file, 1600), resizeImage(file, 640, 0.75)])
      const ext = full.type === 'image/webp' ? 'webp' : 'jpg'
      const name = crypto.randomUUID()
      const fullPath = `${vehicleId}/${name}.${ext}`
      const thumbPath = `${vehicleId}/${name}-thumb.${thumb.type === 'image/webp' ? 'webp' : 'jpg'}`
      const up1 = await supabase.storage.from(PHOTO_BUCKET).upload(fullPath, full, { contentType: full.type, cacheControl: '31536000' })
      if (up1.error) throw up1.error
      const up2 = await supabase.storage.from(PHOTO_BUCKET).upload(thumbPath, thumb, { contentType: thumb.type, cacheControl: '31536000' })
      if (up2.error) throw up2.error
      const { data, error } = await supabase.from('vehicle_images')
        .insert({ vehicle_id: vehicleId, storage_path: fullPath, thumb_path: thumbPath, position: startPos + i, alt_text: null })
        .select().single()
      if (error) throw error
      added.push(data as VehicleImage)
    }
    setUploading(null)
    return added
  }

  async function onPickFiles(list: FileList | null) {
    if (!list?.length) return
    const files = [...list].filter((f) => f.type.startsWith('image/'))
    if (!vehicle) {
      setPending((p) => [...p, ...files.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))])
      return
    }
    setError(null)
    try {
      const added = await uploadFiles(vehicle.id, files, images.length)
      setImages((imgs) => [...imgs, ...added])
    } catch (e) {
      setUploading(null)
      setError(`Photo upload failed: ${errMessage(e)}`)
    }
  }

  async function persistOrder(next: VehicleImage[]) {
    const ordered = next.map((img, i) => ({ ...img, position: i }))
    setImages(ordered)
    const results = await Promise.all(ordered.map((img) => supabase.from('vehicle_images').update({ position: img.position }).eq('id', img.id)))
    const failed = results.find((r) => r.error)
    if (failed?.error) setError(`Could not save photo order: ${failed.error.message}`)
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    void persistOrder(next)
  }

  async function removeImage(img: VehicleImage) {
    if (!confirm('Delete this photo?')) return
    const paths = [img.storage_path, img.thumb_path].filter((p): p is string => !!p && !/^https?:/.test(p))
    const { error } = await supabase.from('vehicle_images').delete().eq('id', img.id)
    if (error) { setError(error.message); return }
    if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths)
    void persistOrder(images.filter((i) => i.id !== img.id))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setNotice(null)
    const year = Number(form.year)
    const payload = {
      status: form.status, featured: form.featured, stock_number: textOrNull(form.stock_number),
      make: String(form.make).trim(), model: String(form.model).trim(), variant: textOrNull(form.variant), year,
      condition: form.condition, body_type: form.body_type, fuel: form.fuel, transmission: form.transmission,
      drive: textOrNull(form.drive), engine_cc: numOrNull(form.engine_cc), mileage_km: numOrNull(form.mileage_km),
      colour: textOrNull(form.colour), doors: numOrNull(form.doors), seats: numOrNull(form.seats), duty: form.duty,
      location: textOrNull(form.location), price_usd: numOrNull(form.price_usd), previous_price_usd: numOrNull(form.previous_price_usd),
      price_negotiable: form.price_negotiable, description: textOrNull(form.description),
      features: String(form.features).split('\n').map((s) => s.trim()).filter(Boolean),
    }
    try {
      let vehicleId = vehicle?.id
      if (!vehicleId) {
        const slug = `${slugify(`${year} ${payload.make} ${payload.model} ${payload.variant ?? ''}`)}-${Math.random().toString(36).slice(2, 6)}`
        const { data, error } = await supabase.from('vehicles').insert({ ...payload, slug }).select().single()
        if (error) throw error
        vehicleId = (data as Vehicle).id
      } else {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicleId)
        if (error) throw error
      }
      const priv = { vehicle_id: vehicleId, vin: textOrNull(form.vin), purchase_cost_usd: numOrNull(form.purchase_cost_usd), notes: textOrNull(form.private_notes) }
      const { error: pe } = await supabase.from('vehicle_private').upsert(priv)
      if (pe) throw pe

      if (isNew) {
        let uploadError: string | null = null
        if (pending.length) {
          try { await uploadFiles(vehicleId, pending.map((p) => p.file), 0) } catch (e) {
            uploadError = `The car was saved, but some photos failed to upload (${errMessage(e)}). Add them again below.`
          }
        }
        navigate(`/admin/vehicles/${vehicleId}`, { replace: true, state: { saved: true, uploadError } })
        return
      }
      setVehicle((v) => (v ? { ...v, ...(payload as Partial<Vehicle>) } : v))
      setNotice('Saved.')
    } catch (err) {
      const msg = errMessage(err)
      setError(msg.includes('vehicles_stock_number_key') ? 'Another car already uses that stock number.' : msg)
    } finally {
      setSaving(false); setUploading(null)
    }
  }

  async function deleteVehicle() {
    if (!vehicle || !confirm(`Delete the ${vehicle.year} ${vehicle.make} ${vehicle.model} and all its photos? This cannot be undone.`)) return
    const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(vehicle.id, { limit: 1000 })
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicle.id)
    if (error) { setError(error.message); return }
    if (files?.length) await supabase.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${vehicle.id}/${f.name}`))
    navigate('/admin/vehicles', { replace: true })
  }

  if (loading) return <Spinner />
  if (!isNew && !vehicle) return <ErrorBox message={error ?? 'Car not found'} />

  const featureList = String(form.features).split('\n').map((s) => s.trim()).filter(Boolean)
  const toggleFeature = (f: string) => set('features', (featureList.includes(f) ? featureList.filter((x) => x !== f) : [...featureList, f]).join('\n'))

  return (
    <form onSubmit={onSubmit} className="pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/vehicles" className="text-sm text-neutral-500 hover:text-ink">← All cars</Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">{isNew ? 'Add a car' : `${vehicle!.year} ${vehicle!.make} ${vehicle!.model}`}</h1>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            {vehicle!.status !== 'draft' && <Link to={`/cars/${vehicle!.slug}`} target="_blank" className="btn-outline btn-sm">View on site ↗</Link>}
            <Link to={`/admin/vehicles/new?from=${vehicle!.id}`} className="btn-outline btn-sm">Duplicate</Link>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title="Photos" hint="The first photo is the cover. Drag to reorder, or use the arrows. Photos are resized automatically.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, i) => (
                <div key={img.id} draggable onDragStart={() => { dragFrom.current = i }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragFrom.current != null) move(dragFrom.current, i); dragFrom.current = null }}
                  className="group relative aspect-[4/3] cursor-move overflow-hidden rounded-md bg-neutral-100 ring-1 ring-neutral-200">
                  <img src={photoUrl(img.thumb_path || img.storage_path)!} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-sm bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">COVER</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 p-1.5">
                    <div className="flex gap-1">
                      <IconBtn label="Move left" onClick={() => move(i, i - 1)} disabled={i === 0}><ChevronLeft width={14} height={14} /></IconBtn>
                      <IconBtn label="Move right" onClick={() => move(i, i + 1)} disabled={i === images.length - 1}><ChevronRight width={14} height={14} /></IconBtn>
                      {i !== 0 && <IconBtn label="Make cover" onClick={() => move(i, 0)}><StarIcon width={14} height={14} /></IconBtn>}
                    </div>
                    <IconBtn label="Delete photo" onClick={() => removeImage(img)}><TrashIcon width={14} height={14} /></IconBtn>
                  </div>
                </div>
              ))}
              {pending.map((p, i) => (
                <div key={p.key} className="relative aspect-[4/3] overflow-hidden rounded-md bg-neutral-100 ring-1 ring-neutral-200">
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  {i === 0 && images.length === 0 && <span className="absolute left-2 top-2 rounded-sm bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">COVER</span>}
                  <div className="absolute bottom-1.5 right-1.5"><IconBtn label="Remove photo" onClick={() => { URL.revokeObjectURL(p.preview); setPending((x) => x.filter((y) => y.key !== p.key)) }}><TrashIcon width={14} height={14} /></IconBtn></div>
                </div>
              ))}
              <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-md border-2 border-dashed border-neutral-300 text-center text-sm text-neutral-500 hover:border-ink hover:text-ink">
                <span className="flex flex-col items-center gap-1"><UploadIcon /> Add photos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void onPickFiles(e.target.files); e.target.value = '' }} disabled={!!uploading} />
              </label>
            </div>
            {uploading && <p className="mt-3 text-sm font-medium text-ink">{uploading}</p>}
            {isNew && pending.length > 0 && <p className="mt-3 text-sm text-neutral-500">These photos upload when you save the car.</p>}
          </Section>

          <Section title="Car details">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Make *"><input required className="input" value={String(form.make)} onChange={(e) => set('make', e.target.value)} placeholder="Toyota" list="makes" /></Field>
              <Field label="Model *"><input required className="input" value={String(form.model)} onChange={(e) => set('model', e.target.value)} placeholder="Hilux" /></Field>
              <Field label="Variant"><input className="input" value={String(form.variant)} onChange={(e) => set('variant', e.target.value)} placeholder="2.8 GD-6 Raider" /></Field>
              <Field label="Year *"><input required type="number" min={1950} max={new Date().getFullYear() + 1} className="input" value={String(form.year)} onChange={(e) => set('year', e.target.value)} /></Field>
              <Field label="Mileage (km)"><input type="number" min={0} className="input" value={String(form.mileage_km)} onChange={(e) => set('mileage_km', e.target.value)} /></Field>
              <Field label="Engine (cc)"><input type="number" min={1} className="input" value={String(form.engine_cc)} onChange={(e) => set('engine_cc', e.target.value)} placeholder="2800" /></Field>
              <Field label="Body type *"><Select value={form.body_type} onChange={(v) => set('body_type', v)} options={BODY_TYPES} /></Field>
              <Field label="Fuel *"><Select value={form.fuel} onChange={(v) => set('fuel', v)} options={FUELS} /></Field>
              <Field label="Transmission *"><Select value={form.transmission} onChange={(v) => set('transmission', v)} options={TRANSMISSIONS} /></Field>
              <Field label="Drive"><Select value={form.drive} onChange={(v) => set('drive', v)} options={DRIVES} empty="Not specified" /></Field>
              <Field label="Colour"><input className="input" value={String(form.colour)} onChange={(e) => set('colour', e.target.value)} /></Field>
              <Field label="Condition *"><Select value={form.condition} onChange={(v) => set('condition', v)} options={CONDITIONS} /></Field>
              <Field label="Doors"><input type="number" min={1} max={9} className="input" value={String(form.doors)} onChange={(e) => set('doors', e.target.value)} /></Field>
              <Field label="Seats"><input type="number" min={1} max={60} className="input" value={String(form.seats)} onChange={(e) => set('seats', e.target.value)} /></Field>
              <Field label="Duty status *"><Select value={form.duty} onChange={(v) => set('duty', v)} options={DUTY} /></Field>
              <Field label="Location"><input className="input" value={String(form.location)} onChange={(e) => set('location', e.target.value)} placeholder="Harare" /></Field>
            </div>
            <datalist id="makes">{['Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Ford', 'Isuzu', 'Mercedes-Benz', 'BMW', 'Volkswagen', 'Subaru', 'Suzuki', 'Hyundai', 'Kia', 'Land Rover', 'Lexus'].map((m) => <option key={m} value={m} />)}</datalist>
          </Section>

          <Section title="Description & features">
            <Field label="Description"><textarea rows={5} className="input" value={String(form.description)} onChange={(e) => set('description', e.target.value)} placeholder="Service history, condition, anything a buyer should know." /></Field>
            <p className="label mt-5">Features</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_FEATURES.map((f) => (
                <button type="button" key={f} onClick={() => toggleFeature(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${featureList.includes(f) ? 'bg-ink text-white ring-ink' : 'bg-white text-neutral-700 ring-neutral-300'}`}>{f}</button>
              ))}
            </div>
            <div className="mt-3"><Field label="All features (one per line)"><textarea rows={4} className="input" value={String(form.features)} onChange={(e) => set('features', e.target.value)} /></Field></div>
          </Section>

          <Section title="Private details" hint="Only staff can see these. They never appear on the website.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="VIN / chassis number"><input className="input" value={String(form.vin)} onChange={(e) => set('vin', e.target.value)} /></Field>
              <Field label="Purchase cost (USD)"><input type="number" min={0} className="input" value={String(form.purchase_cost_usd)} onChange={(e) => set('purchase_cost_usd', e.target.value)} /></Field>
            </div>
            <div className="mt-4"><Field label="Notes"><textarea rows={3} className="input" value={String(form.private_notes)} onChange={(e) => set('private_notes', e.target.value)} /></Field></div>
          </Section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Section title="Listing">
            <div className="space-y-4">
              <Field label="Status"><Select value={form.status} onChange={(v) => set('status', v)} options={STATUSES} /></Field>
              <p className="-mt-2 text-xs text-neutral-500">Drafts are hidden from the website. Sold cars stay visible with a SOLD badge.</p>
              <Field label="Price (USD)"><input type="number" min={0} step={1} className="input" value={String(form.price_usd)} onChange={(e) => set('price_usd', e.target.value)} placeholder="Leave empty for 'Call for price'" /></Field>
              <Field label="Was price (USD)"><input type="number" min={0} step={1} className="input" value={String(form.previous_price_usd)} onChange={(e) => set('previous_price_usd', e.target.value)} placeholder="Shows a REDUCED badge" /></Field>
              <Field label="Stock number"><input className="input" value={String(form.stock_number)} onChange={(e) => set('stock_number', e.target.value)} /></Field>
              <Check label="Price is negotiable" checked={!!form.price_negotiable} onChange={(v) => set('price_negotiable', v)} />
              <Check label="Feature on the home page" checked={!!form.featured} onChange={(v) => set('featured', v)} />
            </div>
          </Section>
          {!isNew && <button type="button" onClick={deleteVehicle} className="w-full text-sm font-medium text-red-600 hover:underline">Delete this car</button>}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="container-x flex items-center justify-end gap-3 py-3">
          {error && <p className="mr-auto text-sm text-red-700" role="alert">{error}</p>}
          {notice && !error && <p className="mr-auto text-sm text-ink">{notice}</p>}
          <Link to="/admin/vehicles" className="btn-outline">Cancel</Link>
          <button className="btn-primary" disabled={saving || !!uploading}>{saving ? (uploading ?? 'Saving…') : isNew ? 'Save car' : 'Save changes'}</button>
        </div>
      </div>
    </form>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-bold text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-neutral-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>
}
function Select({ value, onChange, options, empty }: { value: string | boolean; onChange: (v: string) => void; options: Record<string, string>; empty?: string }) {
  return (
    <select className="input" value={String(value)} onChange={(e) => onChange(e.target.value)}>
      {empty !== undefined && <option value="">{empty}</option>}
      {Object.entries(options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  )
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" className="h-4 w-4 accent-ink" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>
}
function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-ink hover:bg-white disabled:opacity-30">{children}</button>
}

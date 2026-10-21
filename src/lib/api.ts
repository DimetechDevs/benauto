import { supabase } from './supabase'
import type { BodyType, DealershipSettings, FuelType, LeadType, TransmissionType, Vehicle, VehicleCondition } from './types'

export const VEHICLE_LIST_FIELDS =
  'id, slug, stock_number, status, featured, make, model, variant, year, condition, body_type, fuel, transmission, drive, engine_cc, mileage_km, colour, location, duty, price_usd, previous_price_usd, price_negotiable, created_at, vehicle_images(id, storage_path, thumb_path, position, alt_text)'

export interface InventoryFilters {
  q?: string
  make?: string
  model?: string
  body?: BodyType | ''
  fuel?: FuelType | ''
  transmission?: TransmissionType | ''
  condition?: VehicleCondition | ''
  location?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc'
}

export const PAGE_SIZE = 24

export async function fetchInventory(f: InventoryFilters, page: number) {
  let q = supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS, { count: 'exact' })
    .in('status', ['available', 'reserved'])
  if (f.make) q = q.eq('make', f.make)
  if (f.model) q = q.eq('model', f.model)
  if (f.body) q = q.eq('body_type', f.body)
  if (f.fuel) q = q.eq('fuel', f.fuel)
  if (f.transmission) q = q.eq('transmission', f.transmission)
  if (f.condition) q = q.eq('condition', f.condition)
  if (f.location) q = q.eq('location', f.location)
  if (f.minPrice) q = q.gte('price_usd', f.minPrice)
  if (f.maxPrice) q = q.lte('price_usd', f.maxPrice)
  if (f.minYear) q = q.gte('year', f.minYear)
  if (f.maxYear) q = q.lte('year', f.maxYear)
  if (f.q) {
    const term = f.q.replace(/[%,()]/g, ' ').trim()
    if (term) q = q.or(`make.ilike.%${term}%,model.ilike.%${term}%,variant.ilike.%${term}%`)
  }
  switch (f.sort) {
    case 'price_asc': q = q.order('price_usd', { ascending: true, nullsFirst: false }); break
    case 'price_desc': q = q.order('price_usd', { ascending: false, nullsFirst: false }); break
    case 'mileage_asc': q = q.order('mileage_km', { ascending: true, nullsFirst: false }); break
    case 'year_desc': q = q.order('year', { ascending: false }); break
    default: q = q.order('created_at', { ascending: false })
  }
  q = q.order('position', { referencedTable: 'vehicle_images', ascending: true })
  const from = page * PAGE_SIZE
  const { data, error, count } = await q.range(from, from + PAGE_SIZE - 1)
  if (error) throw error
  return { vehicles: (data ?? []) as unknown as Vehicle[], total: count ?? 0 }
}

export async function fetchFeatured(limit = 6) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS)
    .eq('status', 'available')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'vehicle_images', ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as Vehicle[]
}

/** Distinct makes, models and locations currently in stock, for filter dropdowns. */
export async function fetchFacets() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('make, model, location, body_type')
    .in('status', ['available', 'reserved'])
  if (error) throw error
  const rows = data ?? []
  const makes = new Map<string, Set<string>>()
  const locations = new Set<string>()
  const bodyCounts = new Map<string, number>()
  for (const r of rows) {
    if (!makes.has(r.make)) makes.set(r.make, new Set())
    makes.get(r.make)!.add(r.model)
    if (r.location) locations.add(r.location)
    bodyCounts.set(r.body_type, (bodyCounts.get(r.body_type) ?? 0) + 1)
  }
  const sorted = (s: Iterable<string>) => [...s].sort((a, b) => a.localeCompare(b))
  return {
    makes: sorted(makes.keys()),
    modelsByMake: Object.fromEntries([...makes].map(([k, v]) => [k, sorted(v)])) as Record<string, string[]>,
    locations: sorted(locations),
    bodyCounts: Object.fromEntries(bodyCounts) as Record<string, number>,
    total: rows.length,
  }
}

export async function fetchVehicleBySlug(slug: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_images(id, storage_path, thumb_path, position, alt_text)')
    .eq('slug', slug)
    .order('position', { referencedTable: 'vehicle_images', ascending: true })
    .maybeSingle()
  if (error) throw error
  return data as Vehicle | null
}

export async function fetchSimilar(v: Vehicle, limit = 3) {
  const { data, error } = await supabase
    .from('vehicles')
    .select(VEHICLE_LIST_FIELDS)
    .in('status', ['available', 'reserved'])
    .neq('id', v.id)
    .or(`body_type.eq.${v.body_type},make.eq.${JSON.stringify(v.make)}`)
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'vehicle_images', ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as unknown as Vehicle[]
}

export async function fetchSettings() {
  const { data, error } = await supabase.from('dealership_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data as DealershipSettings | null
}

export interface NewLead {
  type: LeadType
  vehicle_id?: string | null
  full_name: string
  phone: string
  email?: string | null
  prefers_whatsapp?: boolean
  message?: string | null
  preferred_date?: string | null
  preferred_time?: string | null
  details?: Record<string, unknown>
}

export async function submitLead(lead: NewLead) {
  // No .select() here: visitors may create leads but not read them back.
  const { error } = await supabase.from('leads').insert({
    ...lead,
    email: lead.email?.trim() || null,
    message: lead.message?.trim() || null,
    details: lead.details ?? {},
  })
  if (error) throw error
}

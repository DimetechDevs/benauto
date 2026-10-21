import type {
  BodyType, DriveType, DutyStatus, FuelType, LeadStatus, LeadType,
  TransmissionType, Vehicle, VehicleCondition, VehicleStatus,
} from './types'

export const BODY_TYPES: Record<BodyType, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  station_wagon: 'Station Wagon',
  suv: 'SUV',
  mpv: 'MPV',
  single_cab: 'Single Cab',
  extended_cab: 'Extended Cab',
  double_cab: 'Double Cab',
  minibus_van: 'Minibus / Van',
  coupe: 'Coupe',
  truck_bus: 'Truck / Bus',
}
export const FUELS: Record<FuelType, string> = {
  petrol: 'Petrol', diesel: 'Diesel', hybrid: 'Hybrid', electric: 'Electric', lpg: 'LPG',
}
export const TRANSMISSIONS: Record<TransmissionType, string> = { automatic: 'Automatic', manual: 'Manual' }
export const DRIVES: Record<DriveType, string> = { '2wd': '2WD', '4wd': '4WD', awd: 'AWD' }
export const CONDITIONS: Record<VehicleCondition, string> = {
  new: 'New', recent_import: 'Recent Import', used: 'Used',
}
export const DUTY: Record<DutyStatus, string> = {
  duty_paid: 'Duty paid & registered',
  duty_free_bond: 'In bond (duty not yet paid)',
  not_applicable: 'Local car',
}
export const STATUSES: Record<VehicleStatus, string> = {
  draft: 'Draft', available: 'Available', reserved: 'Reserved', sold: 'Sold',
}
export const LEAD_TYPES: Record<LeadType, string> = {
  inquiry: 'Inquiry', test_drive: 'Test drive', finance: 'Finance', trade_in: 'Sell / trade-in',
}
export const LEAD_STATUSES: Record<LeadStatus, string> = {
  new: 'New', contacted: 'Contacted', won: 'Won', lost: 'Lost',
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('en-US')

export function formatUsd(v: number | null | undefined): string {
  return v == null ? 'Call for price' : usd.format(Number(v))
}
export function formatZig(usdValue: number | null | undefined, rate: number | null | undefined): string | null {
  if (usdValue == null || !rate) return null
  return `ZiG ${num.format(Math.round(Number(usdValue) * Number(rate)))}`
}
export function formatKm(v: number | null | undefined): string {
  return v == null ? 'N/A' : `${num.format(v)} km`
}
export function formatEngine(cc: number | null | undefined): string | null {
  return cc ? `${(cc / 1000).toFixed(1)}L` : null
}
export function vehicleTitle(v: Pick<Vehicle, 'year' | 'make' | 'model'>): string {
  return `${v.year} ${v.make} ${v.model}`
}
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Turns "077 123 4567" or "+263 77 123 4567" into "263771234567" for wa.me links. */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = '263' + digits.slice(1)
  return digits.length >= 9 ? digits : null
}
export function whatsappLink(number: string | null | undefined, text: string): string | null {
  const n = toWhatsAppNumber(number)
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null
}
export function telLink(raw: string | null | undefined): string | null {
  return raw ? `tel:${raw.replace(/[^\d+]/g, '')}` : null
}

/** Standard amortised monthly repayment. */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

export const HOUR_ROWS = ['Mon–Fri', 'Saturday', 'Sunday & holidays']
/** Opening hours in weekday order (the database does not keep key order). */
export function orderedHours(hours: Record<string, string> | null | undefined): [string, string][] {
  const entries = Object.entries(hours ?? {}).filter(([, v]) => v?.trim())
  const rank = (k: string) => { const i = HOUR_ROWS.indexOf(k); return i === -1 ? 99 : i }
  return entries.sort((a, b) => rank(a[0]) - rank(b[0]))
}

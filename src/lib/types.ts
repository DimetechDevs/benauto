export type VehicleStatus = 'draft' | 'available' | 'reserved' | 'sold'
export type VehicleCondition = 'new' | 'recent_import' | 'used'
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'lpg'
export type TransmissionType = 'automatic' | 'manual'
export type DriveType = '2wd' | '4wd' | 'awd'
export type BodyType =
  | 'hatchback' | 'sedan' | 'station_wagon' | 'suv' | 'mpv'
  | 'single_cab' | 'extended_cab' | 'double_cab' | 'minibus_van' | 'coupe' | 'truck_bus'
export type DutyStatus = 'duty_paid' | 'duty_free_bond' | 'not_applicable'
export type LeadType = 'inquiry' | 'test_drive' | 'finance' | 'trade_in'
export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost'

export interface VehicleImage {
  id: string
  vehicle_id: string
  storage_path: string
  thumb_path: string | null
  position: number
  alt_text: string | null
}

export interface Vehicle {
  id: string
  slug: string
  stock_number: string | null
  status: VehicleStatus
  featured: boolean
  make: string
  model: string
  variant: string | null
  year: number
  condition: VehicleCondition
  body_type: BodyType
  fuel: FuelType
  transmission: TransmissionType
  drive: DriveType | null
  engine_cc: number | null
  mileage_km: number | null
  colour: string | null
  doors: number | null
  seats: number | null
  duty: DutyStatus
  location: string | null
  price_usd: number | null
  previous_price_usd: number | null
  price_negotiable: boolean
  description: string | null
  features: string[]
  created_at: string
  updated_at: string
  sold_at: string | null
  vehicle_images?: VehicleImage[]
}

export interface VehiclePrivate {
  vehicle_id: string
  vin: string | null
  purchase_cost_usd: number | null
  notes: string | null
}

export interface Lead {
  id: string
  type: LeadType
  status: LeadStatus
  vehicle_id: string | null
  full_name: string
  phone: string
  email: string | null
  prefers_whatsapp: boolean
  message: string | null
  preferred_date: string | null
  preferred_time: string | null
  details: Record<string, unknown>
  staff_notes: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  vehicles?: Pick<Vehicle, 'id' | 'slug' | 'year' | 'make' | 'model' | 'stock_number'> | null
}

export interface DealershipSettings {
  id: number
  name: string
  tagline: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  map_url: string | null
  opening_hours: Record<string, string>
  zig_per_usd: number | null
}

export interface StaffMember {
  user_id: string
  full_name: string
  is_admin: boolean
  email: string
  created_at: string
}

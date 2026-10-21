-- Benauto database schema for Supabase (Postgres).
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Security is enforced here with row-level security (RLS), because the
-- website talks to the database directly from the browser.

-- gen_random_uuid() is built into Postgres 13+, so no extension is needed.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type vehicle_status    as enum ('draft', 'available', 'reserved', 'sold');
create type vehicle_condition as enum ('new', 'recent_import', 'used');
create type fuel_type         as enum ('petrol', 'diesel', 'hybrid', 'electric', 'lpg');
create type transmission_type as enum ('automatic', 'manual');
create type drive_type        as enum ('2wd', '4wd', 'awd');
create type body_type         as enum (
  'hatchback', 'sedan', 'station_wagon', 'suv', 'mpv',
  'single_cab', 'extended_cab', 'double_cab', 'minibus_van', 'coupe', 'truck_bus'
);
create type duty_status       as enum ('duty_paid', 'duty_free_bond', 'not_applicable');
create type lead_type         as enum ('inquiry', 'test_drive', 'finance', 'trade_in');
create type lead_status       as enum ('new', 'contacted', 'won', 'lost');

-- ---------------------------------------------------------------------------
-- Staff: which auth users can use the admin dashboard
-- ---------------------------------------------------------------------------
create table staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helper functions used by the RLS policies. SECURITY DEFINER lets them read
-- the staff table without the caller needing direct access to it. They live
-- in a "private" schema so they are not exposed through the public API.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and is_admin);
$$;

revoke execute on function private.is_staff(), private.is_admin() from public;
grant execute on function private.is_staff(), private.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dealership settings (single row)
-- ---------------------------------------------------------------------------
create table dealership_settings (
  id             int primary key default 1 check (id = 1),
  name           text not null default 'Benauto',
  tagline        text,
  phone          text,
  whatsapp       text,            -- international format, e.g. 263771234567
  email          text,
  address        text,
  map_url        text,
  opening_hours  jsonb not null default '{}'::jsonb,
  zig_per_usd    numeric(12, 4),  -- for showing a ZiG estimate; null hides it
  updated_at     timestamptz not null default now()
);
insert into dealership_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,           -- e.g. 2019-toyota-hilux-2-8-gd6-a1b2
  stock_number        text unique,
  status              vehicle_status not null default 'draft',
  featured            boolean not null default false,

  make                text not null,
  model               text not null,
  variant             text,                           -- e.g. 2.8 GD-6 Raider
  year                int  not null check (year between 1950 and 2100),
  condition           vehicle_condition not null default 'used',
  body_type           body_type not null,
  fuel                fuel_type not null,
  transmission        transmission_type not null,
  drive               drive_type,
  engine_cc           int check (engine_cc > 0),
  mileage_km          int check (mileage_km >= 0),
  colour              text,
  doors               smallint,
  seats               smallint,
  duty                duty_status not null default 'duty_paid',
  location            text,                           -- branch or city, e.g. Harare

  price_usd           numeric(12, 2) check (price_usd >= 0),  -- null = "Call for price"
  previous_price_usd  numeric(12, 2) check (previous_price_usd >= 0), -- shows a "Reduced" badge
  price_negotiable    boolean not null default false,

  description         text,
  features            text[] not null default '{}',   -- e.g. {Reverse camera, Leather seats}

  created_by          uuid references auth.users (id) default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  sold_at             timestamptz
);

create index vehicles_listing_idx on vehicles (status, created_at desc);
create index vehicles_make_model_idx on vehicles (make, model);
create index vehicles_price_idx on vehicles (price_usd);
create index vehicles_created_by_idx on vehicles (created_by);

-- Staff-only details for each vehicle
create table vehicle_private (
  vehicle_id         uuid primary key references vehicles (id) on delete cascade,
  vin                text,
  purchase_cost_usd  numeric(12, 2),
  notes              text
);

-- ---------------------------------------------------------------------------
-- Vehicle photos (files live in the vehicle-photos storage bucket)
-- ---------------------------------------------------------------------------
create table vehicle_images (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references vehicles (id) on delete cascade,
  storage_path text not null,        -- path inside the vehicle-photos bucket (or a full https URL)
  thumb_path   text,                 -- smaller copy for listing cards
  position     int  not null default 0,  -- 0 = cover photo
  alt_text     text,
  created_at   timestamptz not null default now()
);
create index vehicle_images_vehicle_idx on vehicle_images (vehicle_id, position);

-- ---------------------------------------------------------------------------
-- Leads: inquiries, test drives, finance applications, trade-ins
-- ---------------------------------------------------------------------------
create table leads (
  id                uuid primary key default gen_random_uuid(),
  type              lead_type not null,
  status            lead_status not null default 'new',
  vehicle_id        uuid references vehicles (id) on delete set null,

  full_name         text not null check (char_length(full_name) between 2 and 120),
  phone             text not null check (char_length(phone) between 7 and 30),
  email             text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  prefers_whatsapp  boolean not null default true,
  message           text check (message is null or char_length(message) <= 2000),

  preferred_date    date,           -- test drives
  preferred_time    text,
  details           jsonb not null default '{}'::jsonb,
  -- finance:  {"deposit_usd":..., "term_months":..., "monthly_income_usd":..., "employer":...}
  -- trade_in: {"make":..., "model":..., "year":..., "mileage_km":..., "asking_usd":...}

  staff_notes       text,
  assigned_to       uuid references auth.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index leads_inbox_idx on leads (status, created_at desc);
create index leads_vehicle_idx on leads (vehicle_id);
create index leads_assigned_idx on leads (assigned_to);

-- ---------------------------------------------------------------------------
-- Keep updated_at / sold_at current
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_table_name = 'vehicles' then
    if new.status = 'sold' and old.status is distinct from 'sold' then
      new.sold_at := now();
    elsif new.status <> 'sold' then
      new.sold_at := null;
    end if;
  end if;
  return new;
end $$;

create trigger vehicles_touch  before update on vehicles            for each row execute function touch_updated_at();
create trigger leads_touch     before update on leads               for each row execute function touch_updated_at();
create trigger settings_touch  before update on dealership_settings for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table staff               enable row level security;
alter table dealership_settings enable row level security;
alter table vehicles            enable row level security;
alter table vehicle_images      enable row level security;
alter table vehicle_private     enable row level security;
alter table leads               enable row level security;

-- (select fn()) lets Postgres evaluate the check once per query, not per row.

-- staff: staff see the team; only admins change it
create policy staff_read   on staff for select using ((select private.is_staff()));
create policy staff_insert on staff for insert with check ((select private.is_admin()));
create policy staff_update on staff for update using ((select private.is_admin())) with check ((select private.is_admin()));
create policy staff_delete on staff for delete using ((select private.is_admin()));

-- settings: public read, admin write
create policy settings_read  on dealership_settings for select using (true);
create policy settings_write on dealership_settings for update using ((select private.is_admin())) with check ((select private.is_admin()));

-- vehicles: public sees everything except drafts; staff manage all
create policy vehicles_read   on vehicles for select using (status <> 'draft' or (select private.is_staff()));
create policy vehicles_insert on vehicles for insert with check ((select private.is_staff()));
create policy vehicles_update on vehicles for update using ((select private.is_staff())) with check ((select private.is_staff()));
create policy vehicles_delete on vehicles for delete using ((select private.is_staff()));

-- vehicle images: visible when the car is visible
create policy images_read on vehicle_images for select using (
  exists (select 1 from vehicles v where v.id = vehicle_id and (v.status <> 'draft' or (select private.is_staff())))
);
create policy images_insert on vehicle_images for insert with check ((select private.is_staff()));
create policy images_update on vehicle_images for update using ((select private.is_staff())) with check ((select private.is_staff()));
create policy images_delete on vehicle_images for delete using ((select private.is_staff()));

-- Staff-only vehicle details (VIN, purchase cost) live in their own table so
-- the public can never read them.
create policy private_staff_all on vehicle_private for all using ((select private.is_staff())) with check ((select private.is_staff()));

-- leads: anyone can submit a new lead; only staff can read or change them
create policy leads_public_insert on leads for insert with check (
  status = 'new' and staff_notes is null and assigned_to is null
);
create policy leads_staff_read   on leads for select using ((select private.is_staff()));
create policy leads_staff_update on leads for update using ((select private.is_staff())) with check ((select private.is_staff()));
create policy leads_admin_delete on leads for delete using ((select private.is_admin()));

-- Table privileges for the website's API roles (RLS above still applies).
-- Supabase grants everything to anon by default, so start from nothing.
revoke all on all tables in schema public from anon;
grant usage on schema public to anon, authenticated;
grant select on dealership_settings, vehicles, vehicle_images to anon;
grant insert on leads to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Simple spam guard: at most 5 leads from the same phone number in 10 minutes
-- ---------------------------------------------------------------------------
create or replace function limit_lead_spam() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from leads
      where phone = new.phone and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Too many requests. Please try again later.';
  end if;
  return new;
end $$;
create trigger leads_spam_guard before insert on leads for each row execute function limit_lead_spam();
revoke execute on function limit_lead_spam() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admins add staff by email (the person must already have a login, created
-- under Authentication > Users > Add user in the Supabase dashboard)
-- ---------------------------------------------------------------------------
create or replace function add_staff_by_email(p_email text, p_full_name text, p_is_admin boolean default false)
returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'Only admins can add staff';
  end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'No login exists for %. Create it in Supabase first (Authentication > Users > Add user).', p_email;
  end if;
  insert into staff (user_id, full_name, is_admin)
  values (v_id, p_full_name, p_is_admin)
  on conflict (user_id) do update set full_name = excluded.full_name, is_admin = excluded.is_admin;
end $$;
revoke execute on function add_staff_by_email(text, text, boolean) from public, anon;
grant execute on function add_staff_by_email(text, text, boolean) to authenticated;

-- Staff list with emails, for the admin Staff page
create or replace function list_staff()
returns table (user_id uuid, full_name text, is_admin boolean, email text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.user_id, s.full_name, s.is_admin, u.email::text, s.created_at
  from staff s join auth.users u on u.id = s.user_id
  where private.is_staff()
  order by s.created_at;
$$;
revoke execute on function list_staff() from public, anon;
grant execute on function list_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for car photos. The bucket is public, so photos load by URL
-- without a read policy; only staff can list, upload, replace or delete.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "vehicle photos staff select" on storage.objects for select to authenticated using (bucket_id = 'vehicle-photos' and (select private.is_staff()));
create policy "vehicle photos staff insert" on storage.objects for insert to authenticated with check (bucket_id = 'vehicle-photos' and (select private.is_staff()));
create policy "vehicle photos staff update" on storage.objects for update to authenticated using (bucket_id = 'vehicle-photos' and (select private.is_staff()));
create policy "vehicle photos staff delete" on storage.objects for delete to authenticated using (bucket_id = 'vehicle-photos' and (select private.is_staff()));

-- ---------------------------------------------------------------------------
-- First admin: after creating your login under Authentication > Users,
-- replace the email below and run this line once.
-- ---------------------------------------------------------------------------
-- insert into staff (user_id, full_name, is_admin)
-- select id, 'Owner', true from auth.users where email = 'owner@example.com';

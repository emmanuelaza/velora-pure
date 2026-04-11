-- ============================================================
-- Velora Pure — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Businesses table (created during onboarding)
create table if not exists public.businesses (
  id            uuid default gen_random_uuid() primary key,
  owner_id      uuid references auth.users(id) on delete cascade not null,
  business_name text not null,
  owner_name    text not null,
  phone         text,
  city          text,
  state         text,
  zip_code      text default '',
  country       text default 'US',
  zelle_info    text default '',
  venmo_info    text default '',
  cashapp_info  text default '',
  bizum_info    text default '',
  bank_name     text default '',
  iban          text default '',
  nif_cif       text default '',
  subscription_status text default 'trial',
  trial_ends_at timestamptz,
  created_at    timestamptz default now()
);

alter table public.businesses enable row level security;

create policy "Users can read own business"
  on public.businesses for select
  using (auth.uid() = owner_id);

create policy "Users can insert own business"
  on public.businesses for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own business"
  on public.businesses for update
  using (auth.uid() = owner_id);

-- 2. Clients table
create table if not exists public.clients (
  id            uuid default gen_random_uuid() primary key,
  business_id   uuid references public.businesses(id) on delete cascade not null,
  name          text not null,
  email         text,
  phone         text,
  address       text,
  notes         text,
  active        boolean default true,
  created_at    timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Business owners can manage clients"
  on public.clients for all
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

-- 3. Services table
create table if not exists public.services (
  id            uuid default gen_random_uuid() primary key,
  business_id   uuid references public.businesses(id) on delete cascade not null,
  client_id     uuid references public.clients(id) on delete cascade not null,
  description   text not null,
  amount        numeric(10,2) not null default 0,
  status        text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  service_date  date not null default current_date,
  paid_date     date,
  created_at    timestamptz default now()
);

alter table public.services enable row level security;

create policy "Business owners can manage services"
  on public.services for all
  using (
    business_id in (
      select id from public.businesses where owner_id = auth.uid()
    )
  );

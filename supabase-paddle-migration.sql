-- ============================================================
-- Velora Pure — Paddle Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Add Paddle-specific columns to businesses table
alter table public.businesses
  add column if not exists plan_type              text check (plan_type in ('monthly', 'yearly', 'lifetime')),
  add column if not exists paddle_subscription_id text,
  add column if not exists next_billing_date      timestamptz,
  add column if not exists lifetime               boolean not null default false;

-- Also add paddle_customer_id for customer portal links
alter table public.businesses
  add column if not exists paddle_customer_id text;

-- Index for webhook lookups by paddle_subscription_id
create index if not exists businesses_paddle_subscription_id_idx
  on public.businesses (paddle_subscription_id);

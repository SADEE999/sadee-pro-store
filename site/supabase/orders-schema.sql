-- Run this in Supabase SQL Editor. Orders and license keys are server-only.
create extension if not exists pgcrypto;
create table if not exists public.store_orders (
 id uuid primary key default gen_random_uuid(),
 order_code text not null unique default ('SD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 created_at timestamptz not null default now(),
 customer_name text not null,
 customer_email text not null,
 device text not null default '',
 product_id uuid references public.products(id) on delete set null,
 product_name text not null,
 plan_name text not null,
 amount numeric(12,2) not null check(amount>=0),
 payment_method text not null default 'eZ Cash',
 payment_reference text not null,
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 license_key text unique,
 verified_at timestamptz,
 constraint license_after_verification check ((status='verified' and license_key is not null) or (status<>'verified' and license_key is null))
);
alter table public.store_orders enable row level security;
revoke all on public.store_orders from anon, authenticated;
grant all on public.store_orders to service_role;
-- Do not create public/anon policies for this table. Netlify Functions use server-side service-role key.

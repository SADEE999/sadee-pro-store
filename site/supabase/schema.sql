-- SADEE PRO STORE schema for Supabase SQL Editor.
-- Run this whole file in the SQL Editor after creating a Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 800),
  price numeric(12,2) not null default 0 check (price >= 0),
  category text not null default 'Gaming' check (category in ('Gaming','Accessories','Digital','Other')),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  phone text not null check (char_length(phone) between 3 and 30),
  notes text not null default '' check (char_length(notes) <= 500),
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Admin check runs with a controlled definer, avoiding recursive RLS on admin_users.
create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon, authenticated;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products
for select to anon, authenticated using (active = true or (select public.is_store_admin()));

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all to authenticated using ((select public.is_store_admin()))
with check ((select public.is_store_admin()));

drop policy if exists "Visitors can submit pending orders" on public.orders;
create policy "Visitors can submit pending orders" on public.orders
for insert to anon, authenticated
with check (
  status = 'pending'
  and char_length(customer_name) between 1 and 80
  and char_length(phone) between 3 and 30
  and char_length(notes) <= 500
  and quantity between 1 and 20
  and unit_price >= 0
);

drop policy if exists "Admins view orders" on public.orders;
create policy "Admins view orders" on public.orders
for select to authenticated using ((select public.is_store_admin()));

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders
for update to authenticated using ((select public.is_store_admin()))
with check ((select public.is_store_admin()));

drop policy if exists "Admins delete orders" on public.orders;
create policy "Admins delete orders" on public.orders
for delete to authenticated using ((select public.is_store_admin()));

-- Add a first product only if you want a demo listing; edit/delete it in the admin panel.
insert into public.products(name,description,price,category,stock,active)
select 'Starter Gaming Pack','Example listing — edit this product and price before publishing.',1500,'Gaming',10,true
where not exists (select 1 from public.products);

-- IMPORTANT: create your admin user in Supabase Dashboard > Authentication > Users.
-- Then copy that user's UUID and run the next statement manually, replacing the UUID:
-- insert into public.admin_users(user_id) values ('PASTE-ADMIN-USER-UUID-HERE');

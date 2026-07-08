-- Migration 013: Add-ons for cart upsell

create table if not exists add_ons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  price numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger add_ons_updated_at
before update on add_ons
for each row
execute function set_updated_at();

alter table add_ons enable row level security;

create policy "Public can read active add_ons"
on add_ons for select
using (is_active = true);

create policy "Admin full access add_ons"
on add_ons for all
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

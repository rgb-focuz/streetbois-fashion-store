-- StreetBois shop branch locations.
-- Run this once in Supabase SQL Editor before saving Shop Branches in Admin Settings.

alter table if exists public.store_settings
add column if not exists shop_locations jsonb not null default '[]'::jsonb;

update public.store_settings
set shop_locations = coalesce(shop_locations, '[]'::jsonb)
where id = 1;

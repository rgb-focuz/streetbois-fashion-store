-- StreetBois Fashion security hardening.
-- Run this in Supabase SQL Editor after backing up the project.
--
-- Goal:
-- 1. Public visitors can browse active products, categories, settings and reviews.
-- 2. Customers can only see their own orders/profile data.
-- 3. Only active admins can manage products, orders, settings, users and reports.
-- 4. Direct order inserts remain blocked; checkout must use create_secure_order.

create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.email())
      and is_active = true
  );
$$;

create or replace function public.is_active_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.email())
      and is_active = true
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_active_admin() from public;
revoke all on function public.is_active_super_admin() from public;
grant execute on function public.is_active_admin() to anon, authenticated;
grant execute on function public.is_active_super_admin() to authenticated;

alter table if exists public.products enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.store_settings enable row level security;
alter table if exists public.contact_messages enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.admin_users enable row level security;
alter table if exists public.inventory_history enable row level security;

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products"
on public.products
for select
to anon, authenticated
using (
  coalesce(status, 'Active') = 'Active'
  or public.is_active_admin()
);

drop policy if exists "admins can manage products" on public.products;
create policy "admins can manage products"
on public.products
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "public can read categories" on public.categories;
create policy "public can read categories"
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists "admins can manage categories" on public.categories;
create policy "admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "public can read store settings" on public.store_settings;
create policy "public can read store settings"
on public.store_settings
for select
to anon, authenticated
using (true);

drop policy if exists "admins can update store settings" on public.store_settings;
create policy "admins can update store settings"
on public.store_settings
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "public can submit contact messages" on public.contact_messages;
create policy "public can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (
  length(trim(coalesce(name, ''))) between 2 and 120
  and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  and length(trim(coalesce(subject, ''))) between 2 and 180
  and length(trim(coalesce(message, ''))) between 10 and 3000
);

drop policy if exists "admins can manage contact messages" on public.contact_messages;
create policy "admins can manage contact messages"
on public.contact_messages
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "public can read reviews" on public.reviews;
create policy "public can read reviews"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "public can submit reviews" on public.reviews;
create policy "public can submit reviews"
on public.reviews
for insert
to anon, authenticated
with check (
  rating between 1 and 5
  and length(trim(coalesce(customer_name, ''))) between 2 and 80
  and length(trim(coalesce(review, ''))) between 10 and 1000
);

drop policy if exists "admins can manage reviews" on public.reviews;
create policy "admins can manage reviews"
on public.reviews
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "customers can read their own orders" on public.orders;
create policy "customers can read their own orders"
on public.orders
for select
to authenticated
using (
  public.is_active_admin()
  or lower(customer_email) = lower(auth.email())
);

drop policy if exists "admins can manage orders" on public.orders;
create policy "admins can manage orders"
on public.orders
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_active_admin());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for all
to authenticated
using (id = auth.uid() or public.is_active_admin())
with check (id = auth.uid() or public.is_active_admin());

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users
for select
to authenticated
using (
  lower(email) = lower(auth.email())
  or public.is_active_admin()
);

drop policy if exists "super admins can manage admin users" on public.admin_users;
create policy "super admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_active_super_admin())
with check (public.is_active_super_admin());

drop policy if exists "admins can manage inventory history" on public.inventory_history;
create policy "admins can manage inventory history"
on public.inventory_history
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Direct inserts into orders should remain denied by RLS.
-- The app places orders through public.create_secure_order only.
revoke insert, update, delete on public.orders from anon, authenticated;

-- Keep checkout callable by visitors and signed-in customers.
grant execute on function public.create_secure_order(text, text, text, text, jsonb)
to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_physical_sale'
  ) then
    grant execute on function public.record_physical_sale(uuid, integer, text)
    to authenticated;
  end if;
end $$;

drop policy if exists "public can read streetbois storage images" on storage.objects;
create policy "public can read streetbois storage images"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('product-images', 'category-images'));

drop policy if exists "admins can upload streetbois storage images" on storage.objects;
create policy "admins can upload streetbois storage images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('product-images', 'category-images')
  and public.is_active_admin()
);

drop policy if exists "admins can update streetbois storage images" on storage.objects;
create policy "admins can update streetbois storage images"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('product-images', 'category-images')
  and public.is_active_admin()
)
with check (
  bucket_id in ('product-images', 'category-images')
  and public.is_active_admin()
);

drop policy if exists "admins can delete streetbois storage images" on storage.objects;
create policy "admins can delete streetbois storage images"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('product-images', 'category-images')
  and public.is_active_admin()
);

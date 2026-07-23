-- StreetBois admin order reader fix.
-- Paste this whole file into Supabase SQL Editor and click Run.
-- It lets active admins see every order in the admin dashboard without
-- weakening direct table permissions for normal customers.

create or replace function public.get_admin_orders()
returns setof public.orders
language sql
security definer
set search_path = public
as $$
  select *
  from public.orders
  where public.is_active_admin()
  order by created_at desc;
$$;

revoke all on function public.get_admin_orders() from public;
grant execute on function public.get_admin_orders() to authenticated;

-- StreetBois admin-only order cleanup.
-- Run this once in Supabase SQL Editor so the admin dashboard can clear
-- pre-launch/test orders without weakening table permissions.

create or replace function public.clear_all_orders_admin()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can clear order records.';
  end if;

  delete from public.orders
  where id is not null;
  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;

revoke all on function public.clear_all_orders_admin() from public;
grant execute on function public.clear_all_orders_admin() to authenticated;

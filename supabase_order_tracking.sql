-- StreetBois realistic order tracking.
-- Run this once in Supabase SQL Editor before using delivery tracking fields.

alter table if exists public.orders
add column if not exists tracking_location text,
add column if not exists tracking_note text,
add column if not exists shipped_at timestamptz,
add column if not exists delivered_at timestamptz,
add column if not exists customer_confirmed_at timestamptz,
add column if not exists last_tracking_update_at timestamptz;

create or replace function public.update_order_tracking_admin(
  p_order_id uuid,
  p_status text,
  p_tracking_location text default null,
  p_tracking_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_status text;
begin
  if not public.is_active_admin() then
    raise exception 'Only active admins can update order tracking.';
  end if;

  clean_status := trim(coalesce(p_status, 'Pending'));

  if clean_status not in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'Invalid order status.';
  end if;

  update public.orders
  set
    status = clean_status,
    tracking_location = nullif(trim(coalesce(p_tracking_location, '')), ''),
    tracking_note = nullif(trim(coalesce(p_tracking_note, '')), ''),
    shipped_at = case
      when clean_status = 'Shipped' and shipped_at is null then now()
      else shipped_at
    end,
    delivered_at = case
      when clean_status = 'Delivered' and delivered_at is null then now()
      else delivered_at
    end,
    customer_confirmed_at = case
      when clean_status <> 'Delivered' then null
      else customer_confirmed_at
    end,
    last_tracking_update_at = now()
  where id = p_order_id;

  if not found then
    raise exception 'Order not found.';
  end if;

  return jsonb_build_object('success', true, 'order_id', p_order_id, 'status', clean_status);
end;
$$;

create or replace function public.confirm_order_received(
  p_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.orders%rowtype;
begin
  select *
  into order_row
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found.';
  end if;

  if lower(coalesce(order_row.customer_email, '')) <> lower(coalesce(auth.email(), '')) then
    raise exception 'You can only confirm your own order.';
  end if;

  if coalesce(order_row.status, 'Pending') = 'Cancelled' then
    raise exception 'Cancelled orders cannot be confirmed as received.';
  end if;

  update public.orders
  set
    status = 'Delivered',
    delivered_at = coalesce(delivered_at, now()),
    customer_confirmed_at = now(),
    tracking_note = coalesce(tracking_note, 'Customer confirmed receipt.'),
    last_tracking_update_at = now()
  where id = p_order_id;

  return jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'Delivered');
end;
$$;

grant execute on function public.update_order_tracking_admin(uuid, text, text, text)
to authenticated;

grant execute on function public.confirm_order_received(uuid)
to authenticated;

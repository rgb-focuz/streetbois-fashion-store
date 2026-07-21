-- StreetBois live GPS delivery tracking.
-- Run this once in Supabase SQL Editor after supabase_order_tracking.sql.

create extension if not exists pgcrypto;

alter table if exists public.orders
add column if not exists tracking_token uuid default gen_random_uuid(),
add column if not exists rider_name text,
add column if not exists rider_phone text,
add column if not exists live_lat numeric,
add column if not exists live_lng numeric,
add column if not exists live_accuracy numeric,
add column if not exists live_tracking_active boolean not null default false,
add column if not exists live_tracking_started_at timestamptz,
add column if not exists live_tracking_ended_at timestamptz;

update public.orders
set tracking_token = gen_random_uuid()
where tracking_token is null;

create or replace function public.update_order_tracking_admin(
  p_order_id uuid,
  p_status text,
  p_tracking_location text default null,
  p_tracking_note text default null,
  p_rider_name text default null,
  p_rider_phone text default null
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
    rider_name = nullif(trim(coalesce(p_rider_name, '')), ''),
    rider_phone = nullif(trim(coalesce(p_rider_phone, '')), ''),
    shipped_at = case
      when clean_status = 'Shipped' and shipped_at is null then now()
      else shipped_at
    end,
    delivered_at = case
      when clean_status = 'Delivered' and delivered_at is null then now()
      else delivered_at
    end,
    live_tracking_active = case
      when clean_status in ('Delivered', 'Cancelled') then false
      else live_tracking_active
    end,
    live_tracking_ended_at = case
      when clean_status in ('Delivered', 'Cancelled') then coalesce(live_tracking_ended_at, now())
      else live_tracking_ended_at
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

create or replace function public.get_rider_tracking_order(
  p_order_id uuid,
  p_tracking_token uuid
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
  where id = p_order_id
    and tracking_token = p_tracking_token;

  if not found then
    raise exception 'Invalid tracking link.';
  end if;

  return jsonb_build_object(
    'id', order_row.id,
    'status', order_row.status,
    'customer_name', order_row.customer_name,
    'customer_phone', order_row.customer_phone,
    'delivery_address', order_row.delivery_address,
    'rider_name', order_row.rider_name,
    'rider_phone', order_row.rider_phone,
    'live_tracking_active', order_row.live_tracking_active
  );
end;
$$;

create or replace function public.update_delivery_live_location(
  p_order_id uuid,
  p_tracking_token uuid,
  p_lat numeric,
  p_lng numeric,
  p_accuracy numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'Invalid GPS coordinates.';
  end if;

  update public.orders
  set
    live_lat = p_lat,
    live_lng = p_lng,
    live_accuracy = p_accuracy,
    live_tracking_active = true,
    live_tracking_started_at = coalesce(live_tracking_started_at, now()),
    live_tracking_ended_at = null,
    status = case
      when status in ('Pending', 'Processing') then 'Shipped'
      else status
    end,
    tracking_location = 'Live GPS location shared by rider',
    tracking_note = 'Rider is currently sharing live delivery location.',
    last_tracking_update_at = now()
  where id = p_order_id
    and tracking_token = p_tracking_token
    and coalesce(status, 'Pending') not in ('Delivered', 'Cancelled');

  if not found then
    raise exception 'Tracking link is invalid or delivery is closed.';
  end if;

  return jsonb_build_object('success', true, 'order_id', p_order_id);
end;
$$;

create or replace function public.complete_delivery_by_rider(
  p_order_id uuid,
  p_tracking_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set
    status = 'Delivered',
    delivered_at = coalesce(delivered_at, now()),
    live_tracking_active = false,
    live_tracking_ended_at = now(),
    tracking_note = 'Rider marked this order as delivered.',
    last_tracking_update_at = now()
  where id = p_order_id
    and tracking_token = p_tracking_token
    and coalesce(status, 'Pending') <> 'Cancelled';

  if not found then
    raise exception 'Tracking link is invalid or order is cancelled.';
  end if;

  return jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'Delivered');
end;
$$;

grant execute on function public.update_order_tracking_admin(uuid, text, text, text, text, text)
to authenticated;

grant execute on function public.get_rider_tracking_order(uuid, uuid)
to anon, authenticated;

grant execute on function public.update_delivery_live_location(uuid, uuid, numeric, numeric, numeric)
to anon, authenticated;

grant execute on function public.complete_delivery_by_rider(uuid, uuid)
to anon, authenticated;

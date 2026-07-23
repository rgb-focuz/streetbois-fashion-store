-- StreetBois checkout order fix.
-- Paste this whole file into Supabase SQL Editor and click Run.
-- It lets the website create orders through a secure function and records the selected size.
--
-- This uses a unique function name so Supabase cannot confuse old checkout
-- functions with new ones.

alter table public.orders
add column if not exists order_reference text;

create unique index if not exists orders_order_reference_unique
on public.orders (order_reference)
where order_reference is not null;

create table if not exists public.order_reference_counters (
  product_prefix text primary key,
  next_number integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.order_reference_counters enable row level security;

drop function if exists public.create_whatsapp_order(
  text,
  text,
  text,
  text,
  jsonb
);

create or replace function public.create_whatsapp_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_address text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  item_product_id uuid;
  item_quantity integer;
  item_size text;
  product_row products%rowtype;
  item_subtotal numeric;
  order_items jsonb := '[]'::jsonb;
  order_total numeric := 0;
  new_order_id uuid;
  order_prefix text;
  next_reference_number integer;
  new_order_reference text;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Invalid customer name.';
  end if;

  if length(trim(coalesce(p_customer_phone, ''))) < 7 then
    raise exception 'Invalid phone number.';
  end if;

  if length(trim(coalesce(p_delivery_address, ''))) < 3 then
    raise exception 'Invalid delivery address.';
  end if;

  if p_customer_email is not null
    and p_customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Invalid email address.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'The order contains no products.';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many products in one order.';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    if item->>'id' is null or item->>'quantity' is null then
      raise exception 'Each item requires an id and quantity.';
    end if;

    begin
      item_product_id := (item->>'id')::uuid;
      item_quantity := (item->>'quantity')::integer;
      item_size := nullif(trim(coalesce(item->>'size', '')), '');
    exception when others then
      raise exception 'Invalid order item.';
    end;

    if item_quantity < 1 or item_quantity > 100 then
      raise exception 'Product quantity must be between 1 and 100.';
    end if;

    select *
    into product_row
    from products
    where id = item_product_id;

    if not found then
      raise exception 'One item in your cart is no longer on the website. Please remove it and add the product again.';
    end if;

    if coalesce(product_row.price, 0) <= 0 then
      raise exception 'A selected product has an invalid price.';
    end if;

    item_subtotal := product_row.price * item_quantity;
    order_total := order_total + item_subtotal;
    order_items := order_items || jsonb_build_array(
      jsonb_build_object(
        'id', product_row.id,
        'name', product_row.name,
        'category', product_row.category,
        'size', item_size,
        'price', product_row.price,
        'quantity', item_quantity,
        'subtotal', item_subtotal,
        'image_url', product_row.image_url
      )
    );
  end loop;

  order_prefix :=
    coalesce(
      nullif(
        trim(
          both '-' from left(
            regexp_replace(
              upper(coalesce(order_items->0->>'name', 'ORDER')),
              '[^A-Z0-9]+',
              '-',
              'g'
            ),
            16
          )
        ),
        ''
      ),
      'ORDER'
    );

  insert into public.order_reference_counters (product_prefix, next_number)
  values (order_prefix, 2)
  on conflict (product_prefix) do update
  set
    next_number = public.order_reference_counters.next_number + 1,
    updated_at = now()
  returning next_number - 1 into next_reference_number;

  new_order_reference := order_prefix || '-' || lpad(next_reference_number::text, 5, '0');

  insert into orders (
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    items,
    total,
    status,
    order_reference
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    trim(p_delivery_address),
    order_items,
    order_total,
    'Pending',
    new_order_reference
  )
  returning id into new_order_id;

  return jsonb_build_object(
    'success', true,
    'order_id', new_order_id,
    'order_reference', new_order_reference,
    'items', order_items,
    'total', order_total
  );
end;
$$;

grant execute on function public.create_whatsapp_order(text, text, text, text, jsonb)
to anon, authenticated;
